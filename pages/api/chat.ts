import type { NextApiRequest, NextApiResponse } from 'next';
import { streamText, stepCountIs } from 'ai';
import type { ModelMessage } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';

import { SYSTEM_PROMPT } from '../../lib/chat/systemPrompt';
import { makeRunQueryTool } from '../../lib/chat/runQuery';
import { checkRateLimit } from '../../lib/chat/ratelimit';
import { hashIp, logTurn } from '../../lib/chat/logger';
import type { TurnOutcome } from '../../lib/chat/logger';
import {
    addSpend,
    estimateUsdCost,
    getBudgetState,
} from '../../lib/chat/budget';

const MODEL_ID = process.env.CHAT_MODEL ?? 'claude-sonnet-4-6';
const MAX_OUTPUT_TOKENS = 2000;
const MAX_STEPS = 3;

interface ChatRequestBody {
    messages: ModelMessage[];
    turnId: string;
}

function getIp(req: NextApiRequest): string {
    const xff = req.headers['x-forwarded-for'];
    if (typeof xff === 'string' && xff.length > 0) {
        return xff.split(',')[0].trim();
    }
    if (Array.isArray(xff) && xff.length > 0) {
        return xff[0].split(',')[0].trim();
    }
    return req.socket.remoteAddress ?? 'unknown';
}

function getQuestion(messages: ModelMessage[]): string {
    for (let i = messages.length - 1; i >= 0; i--) {
        const m = messages[i];
        if (m.role !== 'user') continue;
        if (typeof m.content === 'string') return m.content;
        if (Array.isArray(m.content)) {
            const text = m.content
                .map((part: any) =>
                    typeof part === 'string'
                        ? part
                        : part?.type === 'text'
                        ? part.text
                        : ''
                )
                .filter(Boolean)
                .join(' ');
            if (text) return text;
        }
    }
    return '';
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        res.status(405).end();
        return;
    }
    if (!process.env.ANTHROPIC_API_KEY) {
        res.status(500).json({
            error: 'ANTHROPIC_API_KEY is not configured on the server.',
        });
        return;
    }

    let body: ChatRequestBody;
    try {
        body =
            typeof req.body === 'string'
                ? JSON.parse(req.body)
                : (req.body as ChatRequestBody);
    } catch {
        res.status(400).json({ error: 'Invalid JSON body.' });
        return;
    }
    const { messages, turnId } = body;
    if (!Array.isArray(messages) || messages.length === 0) {
        res.status(400).json({ error: 'messages must be a non-empty array.' });
        return;
    }
    if (!turnId || typeof turnId !== 'string') {
        res.status(400).json({ error: 'turnId is required.' });
        return;
    }

    const ip = getIp(req);
    const ipHash = hashIp(ip);
    const question = getQuestion(messages);
    const tsIso = new Date().toISOString();

    // 1. Budget circuit breaker
    const budget = await getBudgetState();
    if (!budget.enabled) {
        await logTurn({
            turnId,
            ts: tsIso,
            question,
            model: MODEL_ID,
            outcome: 'budget_breaker',
            ipHash,
        });
        res.status(200).json({
            type: 'unavailable',
            message:
                "The chat backend is temporarily unavailable — today's budget has been reached. Please try again tomorrow.",
        });
        return;
    }

    // 2. Per-IP rate limit
    const rl = await checkRateLimit(ip);
    if (!rl.allowed) {
        await logTurn({
            turnId,
            ts: tsIso,
            question,
            model: MODEL_ID,
            outcome: 'rate_limited',
            ipHash,
        });
        res.status(200).json({
            type: 'rate_limited',
            message: rl.message,
        });
        return;
    }

    // 3. SSE stream
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();

    const send = (event: Record<string, unknown>) => {
        res.write(`data: ${JSON.stringify(event)}\n\n`);
    };

    const startedAt = Date.now();
    let lastSql: string | undefined;
    let lastRowCount: number | undefined;
    let outcome: TurnOutcome = 'success';
    let errorMessage: string | undefined;
    let promptTokens = 0;
    let completionTokens = 0;

    try {
        const result = streamText({
            model: anthropic(MODEL_ID),
            system: SYSTEM_PROMPT,
            messages,
            tools: { runQuery: makeRunQueryTool() },
            stopWhen: stepCountIs(MAX_STEPS),
            maxOutputTokens: MAX_OUTPUT_TOKENS,
        });

        for await (const event of result.fullStream) {
            const e = event as any;
            switch (e.type) {
                case 'text-delta': {
                    const text: string =
                        typeof e.text === 'string'
                            ? e.text
                            : typeof e.delta === 'string'
                            ? e.delta
                            : typeof e.textDelta === 'string'
                            ? e.textDelta
                            : '';
                    if (text) send({ type: 'text', value: text });
                    break;
                }
                case 'tool-call': {
                    if (e.toolName === 'runQuery') {
                        const sql: string | undefined = e.input?.sql;
                        if (sql) lastSql = sql;
                        send({ type: 'tool-call', sql: sql ?? '' });
                    }
                    break;
                }
                case 'tool-result': {
                    if (e.toolName === 'runQuery') {
                        const out = e.output as any;
                        if (out?.ok) {
                            lastSql = out.sql;
                            lastRowCount = out.rowCount;
                            send({
                                type: 'tool-result',
                                ok: true,
                                sql: out.sql,
                                rows: out.rows,
                                rowCount: out.rowCount,
                                truncated: !!out.truncated,
                            });
                        } else {
                            outcome = 'sql_error';
                            send({
                                type: 'tool-result',
                                ok: false,
                                sql: out?.sql ?? lastSql ?? '',
                                error: out?.error ?? 'Unknown SQL error.',
                                hint: out?.hint,
                            });
                        }
                    }
                    break;
                }
                case 'tool-error': {
                    outcome = 'sql_error';
                    errorMessage = String(e.error ?? 'tool error');
                    send({
                        type: 'tool-result',
                        ok: false,
                        sql: lastSql ?? '',
                        error: errorMessage,
                    });
                    break;
                }
                case 'finish': {
                    const usage = e.totalUsage ?? e.usage;
                    promptTokens = Number(usage?.inputTokens ?? 0);
                    completionTokens = Number(usage?.outputTokens ?? 0);
                    if (
                        outcome === 'success' &&
                        e.finishReason !== 'stop' &&
                        e.finishReason !== 'tool-calls'
                    ) {
                        // length, content-filter, error etc.
                        outcome = 'tool_loop_exceeded';
                    }
                    break;
                }
                case 'error': {
                    outcome = 'internal_error';
                    errorMessage = String(e.error ?? 'unknown error');
                    send({
                        type: 'error',
                        message: 'Something went wrong on the server.',
                    });
                    break;
                }
                default:
                    // ignore other events (start-step, finish-step, raw, reasoning-delta, ...)
                    break;
            }
        }

        if (promptTokens > 0 || completionTokens > 0) {
            const costUsd = estimateUsdCost(promptTokens, completionTokens);
            await addSpend(costUsd);
        }
    } catch (err) {
        outcome = 'internal_error';
        errorMessage = err instanceof Error ? err.message : String(err);
        send({
            type: 'error',
            message: 'Something went wrong on the server.',
        });
    } finally {
        const execMs = Date.now() - startedAt;
        send({ type: 'done', turnId, outcome });
        res.end();
        await logTurn({
            turnId,
            ts: tsIso,
            question,
            sql: lastSql,
            rowCount: lastRowCount,
            execMs,
            promptTokens,
            completionTokens,
            model: MODEL_ID,
            outcome,
            error: errorMessage,
            ipHash,
        });
    }
}
