// Simple in-memory rate limiter for MVP
// For production, replace with Upstash Ratelimit or similar

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

class InMemoryRateLimiter {
  private requests: Map<string, number[]> = new Map();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  private cleanupOldRequests(key: string, now: number) {
    const requests = this.requests.get(key) || [];
    const windowStart = now - this.config.windowMs;
    const validRequests = requests.filter((time) => time > windowStart);
    this.requests.set(key, validRequests);
  }

  isLimited(key: string): boolean {
    const now = Date.now();
    this.cleanupOldRequests(key, now);
    const requests = this.requests.get(key) || [];
    return requests.length >= this.config.maxRequests;
  }

  recordRequest(key: string): void {
    const now = Date.now();
    this.cleanupOldRequests(key, now);
    const requests = this.requests.get(key) || [];
    requests.push(now);
    this.requests.set(key, requests);
  }

  getRemainingRequests(key: string): number {
    const now = Date.now();
    this.cleanupOldRequests(key, now);
    const requests = this.requests.get(key) || [];
    return Math.max(0, this.config.maxRequests - requests.length);
  }

  getResetTime(key: string): number {
    const now = Date.now();
    const requests = this.requests.get(key) || [];
    if (requests.length === 0) return 0;
    const oldestRequest = Math.min(...requests);
    return oldestRequest + this.config.windowMs;
  }
}

// Rate limiter instances for different endpoints
export const apiRateLimiter = new InMemoryRateLimiter({
  maxRequests: 100,
  windowMs: 60 * 1000, // 1 minute
});

export const uploadRateLimiter = new InMemoryRateLimiter({
  maxRequests: 10,
  windowMs: 60 * 1000, // 1 minute
});

export function rateLimitMiddleware(limiter: InMemoryRateLimiter) {
  return async (req: Request) => {
    const key = req.headers.get("x-user-id") || req.headers.get("x-forwarded-for") || "anonymous";
    if (limiter.isLimited(key)) {
      return new Response(JSON.stringify({
        success: false,
        error: { code: "RATE_LIMITED", message: "Too many requests" }
      }), { status: 429, headers: { "Content-Type": "application/json" } });
    }
    limiter.recordRequest(key);
    return null; // Continue to next handler
  };
}
