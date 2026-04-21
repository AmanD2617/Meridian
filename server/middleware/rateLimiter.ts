/**
 * ============================================================
 * middleware/rateLimiter.ts — Express rate limiters
 * ============================================================
 * Two distinct limiters with different budgets:
 *
 *   simulateLimiter  — POST /api/simulate
 *     Tight: 5 requests per 10 minutes per IP.
 *     Each call invokes Gemini 1.5 Pro and costs real money.
 *     Without this, a loop of POST requests drains the quota.
 *
 *   apiLimiter       — general read endpoints
 *     Generous: 120 requests per minute per IP.
 *     Covers GET /api/map-state and similar polling calls.
 * ============================================================
 */

import rateLimit from 'express-rate-limit';

/**
 * Tight limiter for the Gemini-calling simulation endpoint.
 * 5 calls / 10 minutes per IP address.
 */
export const simulateLimiter = rateLimit({
  windowMs:         10 * 60 * 1000,  // 10 minutes
  max:              5,
  standardHeaders:  true,             // Return RateLimit-* headers
  legacyHeaders:    false,
  message: {
    ok:    false,
    error: 'Too many simulation requests — please wait before triggering another.',
  },
});

/**
 * General limiter for read endpoints.
 * 120 calls / 1 minute per IP address.
 */
export const apiLimiter = rateLimit({
  windowMs:         60 * 1000,        // 1 minute
  max:              120,
  standardHeaders:  true,
  legacyHeaders:    false,
  message: {
    ok:    false,
    error: 'Too many requests — slow down.',
  },
});
