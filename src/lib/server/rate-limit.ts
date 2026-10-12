import "server-only";

type Bucket = { count: number; resetAt: number };

const globalBuckets = globalThis as typeof globalThis & { allureLoginBuckets?: Map<string, Bucket> };
const buckets = globalBuckets.allureLoginBuckets ?? new Map<string, Bucket>();
globalBuckets.allureLoginBuckets = buckets;

export function checkLoginRateLimit(key: string) {
  const now = Date.now();
  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + 15 * 60 * 1000 });
    return { allowed: true, retryAfter: 0 };
  }

  existing.count += 1;
  if (existing.count <= 6) return { allowed: true, retryAfter: 0 };
  return { allowed: false, retryAfter: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)) };
}
