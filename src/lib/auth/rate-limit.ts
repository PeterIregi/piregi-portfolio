interface RateLimitEntry {
  count: number;
  windowStart: number;
}

const store = new Map<string, RateLimitEntry>();

const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX_ATTEMPTS = 5;

const CONTACT_WINDOW_MS = 60 * 60 * 1000;
const CONTACT_MAX_ATTEMPTS = 3;

function checkRateLimit(
  key: string,
  windowMs: number,
  maxAttempts: number
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now - entry.windowStart > windowMs) {
    store.set(key, { count: 1, windowStart: now });
    return { allowed: true, remaining: maxAttempts - 1, resetAt: now + windowMs };
  }

  if (entry.count >= maxAttempts) {
    return { allowed: false, remaining: 0, resetAt: entry.windowStart + windowMs };
  }

  entry.count += 1;
  store.set(key, entry);
  return { allowed: true, remaining: maxAttempts - entry.count, resetAt: entry.windowStart + windowMs };
}

export function checkLoginRateLimit(email: string, ip: string | null): { allowed: boolean; remaining: number; resetAt: number } {
  const key = `login:${email.toLowerCase()}:${ip ?? "unknown"}`;
  return checkRateLimit(key, LOGIN_WINDOW_MS, LOGIN_MAX_ATTEMPTS);
}

export function checkContactRateLimit(email: string, ip: string | null): { allowed: boolean; remaining: number; resetAt: number } {
  const key = `contact:${email.toLowerCase()}:${ip ?? "unknown"}`;
  return checkRateLimit(key, CONTACT_WINDOW_MS, CONTACT_MAX_ATTEMPTS);
}
