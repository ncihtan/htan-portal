import { getRedis } from './redis';

// Anthropic published prices per million tokens for Claude Sonnet 4.6 (as of 2026-05).
// Numbers are illustrative — adjust when the published pricing changes.
const PRICE_PER_MTOKEN = {
    input: 3.0,
    output: 15.0,
};

function isoDate(): string {
    return new Date().toISOString().slice(0, 10);
}

function budgetCeiling(): number {
    const raw = process.env.CHAT_DAILY_BUDGET_USD;
    const n = raw ? Number(raw) : NaN;
    return Number.isFinite(n) && n > 0 ? n : 25; // sane default
}

export interface BudgetState {
    enabled: boolean;
    spentUsd: number;
    ceilingUsd: number;
}

export async function getBudgetState(): Promise<BudgetState> {
    const redis = getRedis();
    const ceilingUsd = budgetCeiling();
    if (!redis) return { enabled: true, spentUsd: 0, ceilingUsd };
    const raw = await redis.get<string | number>(
        `htan-chat:spend:${isoDate()}`
    );
    const spentUsd = Number(raw ?? 0);
    return {
        enabled: spentUsd < ceilingUsd,
        spentUsd,
        ceilingUsd,
    };
}

export function estimateUsdCost(
    promptTokens: number,
    completionTokens: number
): number {
    return (
        (promptTokens / 1_000_000) * PRICE_PER_MTOKEN.input +
        (completionTokens / 1_000_000) * PRICE_PER_MTOKEN.output
    );
}

export async function addSpend(usd: number): Promise<void> {
    const redis = getRedis();
    if (!redis) return;
    const key = `htan-chat:spend:${isoDate()}`;
    // Use Lua/atomic increment via incrbyfloat
    await redis.incrbyfloat(key, usd);
    // 48h TTL is more than enough for the daily counter.
    await redis.expire(key, 60 * 60 * 48);
}
