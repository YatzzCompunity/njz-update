// Simple in-memory token-bucket rate limiter.
// NOTE: this is per server instance. On Vercel (multiple serverless instances)
// it is best-effort; for strict global limits use Upstash Redis (documented in README).

interface Bucket {
  tokens: number;
  lastRefill: number;
}

const buckets = new Map<string, Bucket>();

export interface RateLimitOptions {
  /** max requests per window */
  limit: number;
  /** window size in seconds */
  windowSec: number;
  /** bucket key prefix, e.g. "chat" */
  prefix: string;
}

export function rateLimit(
  key: string,
  { limit, windowSec, prefix }: RateLimitOptions
): { allowed: boolean; remaining: number; resetInSec: number } {
  const bucketKey = `${prefix}:${key}`;
  const now = Date.now();
  const refillRate = limit / windowSec; // tokens per second

  let bucket = buckets.get(bucketKey);
  if (!bucket) {
    bucket = { tokens: limit, lastRefill: now };
    buckets.set(bucketKey, bucket);
  }

  const elapsed = (now - bucket.lastRefill) / 1000;
  bucket.tokens = Math.min(limit, bucket.tokens + elapsed * refillRate);
  bucket.lastRefill = now;

  if (bucket.tokens < 1) {
    const resetInSec = Math.ceil((1 - bucket.tokens) / refillRate);
    return { allowed: false, remaining: 0, resetInSec };
  }

  bucket.tokens -= 1;
  return { allowed: true, remaining: Math.floor(bucket.tokens), resetInSec: 0 };
}

/** Prune old buckets occasionally to bound memory. */
let lastPrune = Date.now();
export function pruneBuckets() {
  const now = Date.now();
  if (now - lastPrune < 60_000) return;
  lastPrune = now;
  for (const [k, b] of buckets) {
    if (now - b.lastRefill > 10 * 60_000) buckets.delete(k);
  }
}

export function getClientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}
