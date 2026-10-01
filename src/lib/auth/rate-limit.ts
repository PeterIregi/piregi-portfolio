interface RateLimitEntry {
  count: number;
  windowStart: number;
}

const store = new Map<string, RateLimitEntry>();

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

export function checkLoginRateLimit(email: string, ip: string | null): { allowed: boolean; remaining: number; resetAt: number } {
  const key = `${email.toLowerCase()}:${ip ?? "unknown"}`;
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now - entry.windowStart > WINDOW_MS) {
    store.set(key, { count: 1, windowStart: now });
    return { allowed: true, remaining: MAX_ATTEMPTS - 1, resetAt: now + WINDOW_MS };
  }

  if (entry.count >= MAX_ATTEMPTS) {
    return { allowed: false, remaining: 0, resetAt: entry.windowStart + WINDOW_MS };
  }

  entry.count += 1;
  store.set(key, entry);
  return { allowed: true, remaining: MAX_ATTEMPTS - entry.count, resetAt: entry.windowStart + WINDOW_MS };
}