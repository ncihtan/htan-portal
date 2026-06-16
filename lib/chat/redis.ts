import { Redis } from '@upstash/redis';

let _redis: Redis | null | undefined;

// Returns a configured Upstash Redis client, or null if env vars are missing.
// Callers gracefully degrade (e.g. allow the request without rate limiting)
// so local development without Upstash credentials still works.
export function getRedis(): Redis | null {
    if (_redis !== undefined) return _redis;
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (!url || !token) {
        _redis = null;
        return null;
    }
    _redis = new Redis({ url, token });
    return _redis;
}
