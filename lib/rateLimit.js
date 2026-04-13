/**
 * rateLimit.js
 * Simple in-memory sliding-window rate limiter for Next.js API routes.
 *
 * Usage:
 *   import { rateLimit } from "@/lib/rateLimit";
 *
 *   const limiter = rateLimit({ limit: 10, windowMs: 60_000 });
 *
 *   export async function POST(request) {
 *     const result = limiter.check(request);
 *     if (!result.allowed) {
 *       return NextResponse.json({ error: "Too many requests" }, { status: 429 });
 *     }
 *     // ... rest of handler
 *   }
 *
 * NOTE: This is per-process. For multi-instance deployments, replace
 * the Map with a Redis-backed store (e.g. Upstash).
 */

/** @type {Map<string, number[]>} key → array of request timestamps */
const store = new Map();

/**
 * Create a rate limiter instance.
 * @param {{ limit: number, windowMs: number }} options
 */
export function rateLimit({ limit = 20, windowMs = 60_000 } = {}) {
  return {
    /**
     * Check whether the request is within rate limits.
     * Uses the real IP from standard headers, falling back to a fixed key.
     * @param {Request} request
     * @returns {{ allowed: boolean, remaining: number, resetAt: number }}
     */
    check(request) {
      const ip =
        request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
        request.headers.get("x-real-ip") ||
        "unknown";

      const now = Date.now();
      const windowStart = now - windowMs;

      // Get existing timestamps for this IP, prune old ones
      const timestamps = (store.get(ip) || []).filter((t) => t > windowStart);

      if (timestamps.length >= limit) {
        const resetAt = timestamps[0] + windowMs;
        return { allowed: false, remaining: 0, resetAt };
      }

      timestamps.push(now);
      store.set(ip, timestamps);

      // Cleanup: remove keys that haven't been touched in 2× the window
      if (Math.random() < 0.01) {
        const cutoff = now - windowMs * 2;
        for (const [key, ts] of store.entries()) {
          if (ts[ts.length - 1] < cutoff) store.delete(key);
        }
      }

      return { allowed: true, remaining: limit - timestamps.length, resetAt: now + windowMs };
    },
  };
}

// Pre-built limiters for common use cases
export const strictLimiter  = rateLimit({ limit: 5,  windowMs: 60_000 });  // auth, payments
export const defaultLimiter = rateLimit({ limit: 30, windowMs: 60_000 });  // general API
export const looseLimiter   = rateLimit({ limit: 60, windowMs: 60_000 });  // reads
