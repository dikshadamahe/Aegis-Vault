const buckets = new Map<string, number[]>();

// Allow `limit` requests per `windowMs` per key
export async function rateLimit(key: string, limit = 20, windowMs = 60_000) {
  const now = Date.now();
  const windowStart = now - windowMs;
  const arr = buckets.get(key) || [];
  // drop old
  const recent = arr.filter((t) => t > windowStart);
  if (recent.length >= limit) {
    buckets.set(key, recent);
    return false;
  }
  recent.push(now);
  buckets.set(key, recent);
  return true;
}
