import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

/** Pre-configured limiters for auth endpoints */
export const rateLimiters = {
  /** Login: 5 attempts per 15 minutes */
  login: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, "15 m"),
    prefix: "ratelimit:login",
  }),

  /** Register: 3 attempts per hour */
  register: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(3, "1 h"),
    prefix: "ratelimit:register",
  }),

  /** Forgot password: 3 attempts per hour */
  forgotPassword: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(3, "1 h"),
    prefix: "ratelimit:forgot-password",
  }),

  /** Reset password: 5 attempts per 15 minutes */
  resetPassword: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, "15 m"),
    prefix: "ratelimit:reset-password",
  }),

  /** Resend verification: 3 attempts per 15 minutes */
  resendVerification: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(3, "15 m"),
    prefix: "ratelimit:resend-verification",
  }),
};

/**
 * Extract client IP from request headers.
 * Uses x-forwarded-for (Vercel/proxies) with fallback.
 */
function getIP(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0].trim() ?? "unknown";
}

/**
 * Build a rate limit key from IP and optional identifier (e.g. email).
 */
export function rateLimitKey(req: Request, identifier?: string): string {
  const ip = getIP(req);
  return identifier ? `${ip}:${identifier}` : ip;
}

/**
 * Check rate limit and return a 429 response if exceeded.
 * Returns null if the request is allowed.
 * Fails open — if Upstash is unreachable, the request is allowed.
 */
export async function checkRateLimit(
  limiter: Ratelimit,
  key: string
): Promise<NextResponse | null> {
  try {
    const { success, reset } = await limiter.limit(key);

    if (!success) {
      const retryAfter = Math.ceil((reset - Date.now()) / 1000);
      return NextResponse.json(
        {
          error: `Too many attempts. Please try again in ${Math.ceil(retryAfter / 60)} minute(s).`,
        },
        {
          status: 429,
          headers: { "Retry-After": String(retryAfter) },
        }
      );
    }

    return null;
  } catch (error) {
    // Fail open — allow the request if rate limiting is unavailable
    console.error("Rate limiting error (failing open):", error);
    return null;
  }
}
