import { getRedis } from './redis';

const TURN_TTL_SECONDS = 60 * 60 * 24; // 24h

export type TurnOutcome =
    | 'success'
    | 'sql_error'
    | 'tool_loop_exceeded'
    | 'rate_limited'
    | 'budget_breaker'
    | 'refused'
    | 'internal_error';

export interface TurnRecord {
    turnId: string;
    ts: string; // ISO timestamp
    question: string;
    sql?: string;
    rowCount?: number;
    execMs?: number;
    promptTokens?: number;
    completionTokens?: number;
    model: string;
    outcome: TurnOutcome;
    error?: string;
    ipHash?: string;
}

export async function logTurn(record: TurnRecord): Promise<void> {
    const redis = getRedis();
    if (!redis) {
        // Dev mode without Upstash — log to stderr so the turn isn't lost silently.
        // eslint-disable-next-line no-console
        console.log('[htan-chat]', JSON.stringify(record));
        return;
    }
    try {
        const key = `htan-chat:turn:${record.turnId}`;
        await redis.set(key, JSON.stringify(record), {
            ex: TURN_TTL_SECONDS,
        });
        // Maintain a 24h list of recent turn IDs for easy inspection from the console.
        await redis.lpush('htan-chat:turns:recent', record.turnId);
        await redis.ltrim('htan-chat:turns:recent', 0, 999);
    } catch (err) {
        // eslint-disable-next-line no-console
        console.error('[htan-chat] failed to persist turn', err);
    }
}

export async function recordFeedback(
    turnId: string,
    rating: 'up' | 'down',
    comment?: string
): Promise<void> {
    const redis = getRedis();
    if (!redis) {
        // eslint-disable-next-line no-console
        console.log('[htan-chat] feedback', { turnId, rating, comment });
        return;
    }
    try {
        const key = `htan-chat:feedback:${turnId}`;
        await redis.set(
            key,
            JSON.stringify({
                turnId,
                rating,
                comment: comment ?? null,
                ts: new Date().toISOString(),
            }),
            { ex: TURN_TTL_SECONDS * 30 } // keep feedback longer than the turn
        );
    } catch (err) {
        // eslint-disable-next-line no-console
        console.error('[htan-chat] failed to persist feedback', err);
    }
}

// Hash an IP address so logs don't store raw addresses.
export function hashIp(ip: string): string {
    let h = 5381;
    for (let i = 0; i < ip.length; i++) {
        h = ((h << 5) + h) ^ ip.charCodeAt(i);
    }
    return (h >>> 0).toString(36);
}
