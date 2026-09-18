// In-memory sliding window rate limiter for brute-force protection
interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

/**
 * Check if an operation under a given key is within rate limits.
 * @param key Identifier (e.g. IP address, email, or composite key)
 * @param maxAttempts Maximum allowed attempts in the window
 * @param windowMs Window duration in milliseconds (default: 15 minutes)
 */
export function checkRateLimit(
  key: string,
  maxAttempts: number = 5,
  windowMs: number = 15 * 60 * 1000
): { allowed: boolean; remaining: number; retryAfterSeconds: number } {
  const now = Date.now();
  const record = rateLimitStore.get(key);

  // If no record exists or window expired, start fresh
  if (!record || now > record.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: maxAttempts - 1, retryAfterSeconds: 0 };
  }

  // If already reached limit
  if (record.count >= maxAttempts) {
    const retryAfterSeconds = Math.max(1, Math.ceil((record.resetTime - now) / 1000));
    return { allowed: false, remaining: 0, retryAfterSeconds };
  }

  record.count += 1;
  return {
    allowed: true,
    remaining: maxAttempts - record.count,
    retryAfterSeconds: 0,
  };
}

/**
 * Reset rate limit on successful authentication.
 */
export function resetRateLimit(key: string): void {
  rateLimitStore.delete(key);
}
