import { Ratelimit } from '@upstash/ratelimit';
import { getRedis } from './redis';

const FRIENDLY_LIMIT_MESSAGE =
    "You've hit the chat rate limit. Take a breath and try again in a minute, or come back tomorrow if it's been a busy day.";

interface Limiters {
    minute: Ratelimit;
    day: Ratelimit;
}

let _limiters: Limiters | null | undefined;

function getLimiters(): Limiters | null {
    if (_limiters !== undefined) return _limiters;
    const redis = getRedis();
    if (!redis) {
        _limiters = null;
        return null;
    }
    _limiters = {
        minute: new Ratelimit({
            redis,
            limiter: Ratelimit.slidingWindow(20, '1 m'),
            prefix: 'htan-chat:rl:min',
            analytics: false,
        }),
        day: new Ratelimit({
            redis,
            limiter: Ratelimit.slidingWindow(200, '1 d'),
            prefix: 'htan-chat:rl:day',
            analytics: false,
        }),
    };
    return _limiters;
}

export interface RateLimitDecision {
    allowed: boolean;
    message?: string;
    remaining?: { minute: number; day: number };
}

export async function checkRateLimit(ip: string): Promise<RateLimitDecision> {
    const limiters = getLimiters();
    if (!limiters) {
        // No Redis configured — allow but flag so devs know guardrails aren't on.
        return { allowed: true };
    }
    const minute = await limiters.minute.limit(ip);
    if (!minute.success) {
        return { allowed: false, message: FRIENDLY_LIMIT_MESSAGE };
    }
    const day = await limiters.day.limit(ip);
    if (!day.success) {
        return { allowed: false, message: FRIENDLY_LIMIT_MESSAGE };
    }
    return {
        allowed: true,
        remaining: { minute: minute.remaining, day: day.remaining },
    };
}
