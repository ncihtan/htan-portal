export function clamp(x: number, lower: number, upper: number) {
    return Math.max(lower, Math.min(x, upper));
}
