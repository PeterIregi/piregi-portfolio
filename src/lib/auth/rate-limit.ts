/**
 * Per-email+IP login throttle, called from the credentials `authorize`
 * callback before bcrypt runs (design.md §4: rate limiting has to happen
 * before the expensive hash comparison, or the limiter itself becomes the
 * DoS amplifier it exists to stop).
 *
 * Known limitation: the store is process memory. On Vercel each serverless
 * instance has its own, so the limit is per-instance rather than global and
 * a burst spread across instances gets MAX_ATTEMPTS each. That is
 * acceptable for a single-admin site where the realistic threat is one
 * person guessing one password, but a real limit needs a shared store
 * (Upstash Redis) or a rate_limit table. Flagged rather than silently
 * widened, since design.md §2 does not include such a table.
 */

type Bucket = {
  count: number;
  resetAt: number;
};

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const MAX_TRACKED_KEYS = 10_000;

const buckets = new Map<string, Bucket>();

export type RateLimitResult = {
  allowed: boolean;
  retryAfterSeconds: number;
};

function key(email: string, ip: string | null): string {
  return `${email.toLowerCase()}:${ip ?? "unknown"}`;
}

function prune(now: number): void {
  for (const [k, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(k);
  }
  // Hard cap so an attacker cycling emails can't grow the map without
  // bound. Dropping the oldest is fine; entries are short-lived anyway.
  if (buckets.size > MAX_TRACKED_KEYS) {
    const excess = buckets.size - MAX_TRACKED_KEYS;
    let removed = 0;
    for (const k of buckets.keys()) {
      buckets.delete(k);
      if (++removed >= excess) break;
    }
  }
}

export function checkLoginRateLimit(
  email: string,
  ip: string | null,
  now: number = Date.now(),
): RateLimitResult {
  prune(now);

  const k = key(email, ip);
  const bucket = buckets.get(k);

  if (!bucket || now >= bucket.resetAt) {
    buckets.set(k, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  bucket.count += 1;
  if (bucket.count > MAX_ATTEMPTS) {
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000),
    };
  }
  return { allowed: true, retryAfterSeconds: 0 };
}

/** Exposed for tests; not used by the login path. */
export function resetRateLimitStore(): void {
  buckets.clear();
}
