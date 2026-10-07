interface RateLimitEntry {
  count: number;
  windowStart: number;
}

const store = new Map<string, RateLimitEntry>();

const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX_ATTEMPTS = 5;

const CONTACT_WINDOW_MS = 60 * 60 * 1000;
const CONTACT_MAX_ATTEMPTS = 3;

// Forgot-password requests are throttled per email+IP so the endpoint can't
// be hammered into sending a mailbox full of reset emails (or used to probe
// which addresses exist via email-delivery side channels).
const PASSWORD_RESET_REQUEST_WINDOW_MS = 60 * 60 * 1000;
const PASSWORD_RESET_REQUEST_MAX_ATTEMPTS = 3;

// Reset-password submissions are throttled per IP to slow offline token
// brute force. The window mirrors the login limiter.
const RESET_ATTEMPT_WINDOW_MS = 15 * 60 * 1000;
const RESET_ATTEMPT_MAX_ATTEMPTS = 5;

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

export function checkPasswordResetRequestRateLimit(
  email: string,
  ip: string | null
): { allowed: boolean; remaining: number; resetAt: number } {
  const key = `pwreset:${email.toLowerCase()}:${ip ?? "unknown"}`;
  return checkRateLimit(key, PASSWORD_RESET_REQUEST_WINDOW_MS, PASSWORD_RESET_REQUEST_MAX_ATTEMPTS);
}

export function checkResetPasswordAttemptRateLimit(
  ip: string | null
): { allowed: boolean; remaining: number; resetAt: number } {
  const key = `reset:${ip ?? "unknown"}`;
  return checkRateLimit(key, RESET_ATTEMPT_WINDOW_MS, RESET_ATTEMPT_MAX_ATTEMPTS);
}

/** Whole seconds until a rate-limited window resets (floor at 1 for a Retry-After header). */
export function retryAfterSeconds(resetAt: number): number {
  return Math.max(1, Math.ceil((resetAt - Date.now()) / 1000));
}
