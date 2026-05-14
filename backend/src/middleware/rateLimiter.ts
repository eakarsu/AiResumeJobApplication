import rateLimit from 'express-rate-limit';
import type { Request } from 'express';
import type { AuthRequest } from './auth';

// General rate limiter: 100 requests per 15 minutes
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Auth rate limiter: 10 requests per 15 minutes (login, register, password reset)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many authentication attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// AI rate limiter: 20 requests per 15 minutes (IP-based, coarse first line of defense)
export const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many AI requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Per-user AI rate limiter: 20 requests per hour, keyed by authenticated user.
// Apply *after* `authenticateToken` so req.userId is populated.
export const aiRateLimiterPerUser = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    const a = req as AuthRequest;
    if (a.userId) return `user:${a.userId}`;
    return req.ip || 'unknown';
  },
  message: { error: 'AI hourly limit reached (20/hour). Please wait before making more AI requests.' },
});
