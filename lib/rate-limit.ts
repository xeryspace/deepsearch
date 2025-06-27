import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';

// Check if Redis credentials are available
const hasRedisCredentials =
  process.env.UPSTASH_REDIS_REST_URL &&
  process.env.UPSTASH_REDIS_REST_URL !== '****' &&
  process.env.UPSTASH_REDIS_REST_TOKEN &&
  process.env.UPSTASH_REDIS_REST_TOKEN !== '****';

// Create Redis instance only if credentials are available
export const redis = hasRedisCredentials ? new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  // Disable HTTPS check in development
  automaticDeserialization: true,
  agent: process.env.NODE_ENV === 'development' ? {
    https: {
      rejectUnauthorized: false
    }
  } : undefined,
}) : null;

// Create rate limiter only if Redis is available
export const rateLimiter = redis ? new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '60 s'),
  analytics: true,
  prefix: '@upstash/ratelimit',
}) : null;

// Mock rate limiter for when Redis is not available
export const mockRateLimiter = {
  limit: async () => ({
    success: true,
    limit: 5,
    reset: Date.now() + 60000,
    remaining: 4,
  }),
};

// Export the appropriate rate limiter
export const getRateLimiter = () => rateLimiter || mockRateLimiter;
