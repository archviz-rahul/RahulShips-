import { NextRequest } from "next/server";

interface RateLimitRecord {
  timestamps: number[];
}

const rateLimitMap = new Map<string, RateLimitRecord>();

/**
 * Enforces a rate limit of 10 requests per minute per IP.
 * Returns true if the request is permitted, false if rate limited.
 */
export function countRateLimit(req: NextRequest, limit: number = 10, windowMs: number = 60000): { isAllowed: boolean; remaining: number; reset: number } {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";
  const now = Date.now();
  
  let record = rateLimitMap.get(ip);
  if (!record) {
    record = { timestamps: [] };
    rateLimitMap.set(ip, record);
  }

  // Filter out timestamps outside the current slide-window
  record.timestamps = record.timestamps.filter((t) => now - t < windowMs);

  if (record.timestamps.length >= limit) {
    const oldest = record.timestamps[0];
    const resetTime = oldest + windowMs;
    return {
      isAllowed: false,
      remaining: 0,
      reset: Math.ceil((resetTime - now) / 1000)
    };
  }

  record.timestamps.push(now);
  return {
    isAllowed: true,
    remaining: limit - record.timestamps.length,
    reset: Math.ceil(windowMs / 1000)
  };
}
