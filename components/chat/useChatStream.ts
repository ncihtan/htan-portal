import { useCallback, useRef, useState } from 'react';

export interface ChatTurn {
    turnId: string;
    role: 'user' | 'assistant';
    text: string;
    sql?: string;
    rows?: Record<string, unknown>[];
    rowCount?: number;
    truncated?: boolean;
    toolError?: string;
    toolHint?: string;
    streaming?: boolean;
    fatalError?: string;
    rateLimited?: boolean;
    unavailable?: boolean;
    feedback?: 'up' | 'down';
}

function genTurnId(): string {
    return (
        Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10)
    );
}

interface ParsedEvent {
    type: string;
    [k: string]: unknown;
}

function applyEvent(turn: ChatTurn, event: ParsedEvent): ChatTurn {
    switch (event.type) {
        case 'text':
            return { ...turn, text: turn.text + String(event.value ?? '') };
        case 'tool-call':
            return { ...turn, sql: String(event.sql ?? '') };
        case 'tool-result':
            if (event.ok) {
                return {
                    ...turn,
                    sql: String(event.sql ?? ''),
                    rows: (event.rows as Record<string, unknown>[]) ?? [],
                    rowCount: Number(event.rowCount ?? 0),
                    truncated: !!event.truncated,
                    toolError: undefined,
                    toolHint: undefined,
                };
            }
            return {
                ...turn,
                sql: String(event.sql ?? turn.sql ?? ''),
                toolError: String(event.error ?? 'SQL error.'),
                toolHint:
                    typeof event.hint === 'string' ? event.hint : undefined,
            };
        case 'error':
            return {
                ...turn,
                fatalError: String(
                    event.message ?? 'Something went wrong on the server.'
                ),
            };
        case 'done':
            return { ...turn, streaming: false };
        default:
            return turn;
    }
}

export function useChatStream() {
    const [history, setHistory] = useState<ChatTurn[]>([]);
    const [pending, setPending] = useState(false);
    const abortRef = useRef<AbortController | null>(null);

    const sendMessage = useCallback(
        async (text: string) => {
            const trimmed = text.trim();
            if (!trimmed || pending) return;

            const turnId = genTurnId();
            const userTurn: ChatTurn = {
                turnId: turnId + '-u',
                role: 'user',
                text: trimmed,
            };
            const assistantTurn: ChatTurn = {
                turnId,
                role: 'assistant',
                text: '',
                streaming: true,
            };

            // Snapshot prior history so we can build the messages array
            // synchronously (state update is async).
            const prior = history;

            setHistory([...prior, userTurn, assistantTurn]);
            setPending(true);

            const controller = new AbortController();
            abortRef.current = controller;

            // Convert our internal history (alternating user/assistant) into
            // AI SDK ModelMessage shape. Skip turns that have no text.
            const messages = [...prior, userTurn]
                .filter((t) => t.text.length > 0)
                .map((t) => ({ role: t.role, content: t.text }));

            const updateLast = (fn: (t: ChatTurn) => ChatTurn) => {
                setHistory((h) =>
                    h.map((t, i) => (i === h.length - 1 ? fn(t) : t))
                );
            };

            try {
                const res = await fetch('/api/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ messages, turnId }),
                    signal: controller.signal,
                });

                const ct = res.headers.get('content-type') ?? '';
                if (!res.ok || ct.includes('application/json')) {
                    let payload: any = null;
                    try {
                        payload = await res.json();
                    } catch {
                        payload = null;
                    }
                    if (payload?.type === 'rate_limited') {
                        updateLast((t) => ({
                            ...t,
                            streaming: false,
                            rateLimited: true,
                            text: payload.message,
                        }));
                        return;
                    }
                    if (payload?.type === 'unavailable') {
                        updateLast((t) => ({
                            ...t,
                            streaming: false,
                            unavailable: true,
                            text: payload.message,
                        }));
                        return;
                    }
                    updateLast((t) => ({
                        ...t,
                        streaming: false,
                        fatalError:
                            payload?.error ?? `Server error (${res.status}).`,
                    }));
                    return;
                }

                if (!res.body) {
                    updateLast((t) => ({
                        ...t,
                        streaming: false,
                        fatalError: 'No response body from server.',
                    }));
                    return;
                }

                const reader = res.body.getReader();
                const decoder = new TextDecoder();
                let buffer = '';

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    buffer += decoder.decode(value, { stream: true });
                    let sep: number;
                    while ((sep = buffer.indexOf('\n\n')) !== -1) {
                        const block = buffer.slice(0, sep);
                        buffer = buffer.slice(sep + 2);
                        const lines = block
                            .split('\n')
                            .filter((l) => l.startsWith('data: '))
                            .map((l) => l.slice(6));
                        for (const line of lines) {
                            let event: ParsedEvent;
                            try {
                                event = JSON.parse(line);
                            } catch {
                                continue;
                            }
                            updateLast((t) => applyEvent(t, event));
                        }
                    }
                }
                // Ensure streaming flag is cleared even if server didn't send `done`.
                updateLast((t) => ({ ...t, streaming: false }));
            } catch (err) {
                if ((err as any)?.name === 'AbortError') {
                    updateLast((t) => ({ ...t, streaming: false }));
                } else {
                    updateLast((t) => ({
                        ...t,
                        streaming: false,
                        fatalError:
                            err instanceof Error
                                ? err.message
                                : 'Network error.',
                    }));
                }
            } finally {
                setPending(false);
                abortRef.current = null;
            }
        },
        [history, pending]
    );

    const cancel = useCallback(() => {
        abortRef.current?.abort();
    }, []);

    const reset = useCallback(() => {
        abortRef.current?.abort();
        setHistory([]);
        setPending(false);
    }, []);

    const setFeedback = useCallback(
        async (turnId: string, rating: 'up' | 'down') => {
            setHistory((h) =>
                h.map((t) =>
                    t.turnId === turnId ? { ...t, feedback: rating } : t
                )
            );
            try {
                await fetch('/api/chat-feedback', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ turnId, rating }),
                });
            } catch {
                // best-effort; UI already updated
            }
        },
        []
    );

    return {
        history,
        pending,
        sendMessage,
        cancel,
        reset,
        setFeedback,
    };
}
