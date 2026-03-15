const hits = new Map<string, number[]>();

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 10;

export function checkRateLimit(key: string) {
  const now = Date.now();
  const existing = hits.get(key) ?? [];
  const active = existing.filter((timestamp) => now - timestamp < WINDOW_MS);

  if (active.length >= MAX_REQUESTS) {
    hits.set(key, active);
    return { allowed: false, remaining: 0, resetInMs: WINDOW_MS - (now - active[0]) };
  }

  active.push(now);
  hits.set(key, active);
  return { allowed: true, remaining: MAX_REQUESTS - active.length, resetInMs: WINDOW_MS };
}