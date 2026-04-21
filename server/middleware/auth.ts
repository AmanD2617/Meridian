/**
 * ============================================================
 * middleware/auth.ts — API key authentication
 * ============================================================
 * Protects mutating endpoints (POST /simulate, PUT /execute,
 * PUT /reject) from unauthenticated callers.
 *
 * Mechanism: caller must send the header:
 *   X-API-Key: <value of MERIDIAN_API_KEY in .env>
 *
 * In development, if MERIDIAN_API_KEY is not set, the middleware
 * logs a warning and passes through — so the dev loop is not
 * blocked by missing credentials. In production it always enforces.
 *
 * Setup (.env):
 *   MERIDIAN_API_KEY=your-secret-key-here
 *
 * Frontend (api.jsx) must pass the key:
 *   headers: { 'X-API-Key': window.__MERIDIAN_API_KEY__ }
 * ============================================================
 */

import { Request, Response, NextFunction } from 'express';

const API_KEY  = process.env.MERIDIAN_API_KEY;
const NODE_ENV = process.env.NODE_ENV ?? 'development';

/**
 * requireApiKey
 * ─────────────
 * Express middleware that validates the X-API-Key request header.
 * Attach to any route that mutates data or calls an external LLM.
 */
export function requireApiKey(
  req:  Request,
  res:  Response,
  next: NextFunction,
): void {
  // No key configured — skip enforcement in development, block in production
  if (!API_KEY) {
    if (NODE_ENV === 'production') {
      res.status(500).json({
        ok:    false,
        error: 'Server misconfiguration: MERIDIAN_API_KEY is not set.',
      });
      return;
    }
    // Dev: warn once per process start, not per request
    if (!(globalThis as Record<string, unknown>).__apiKeyWarned) {
      console.warn(
        '[auth] MERIDIAN_API_KEY not set — skipping auth in development. ' +
        'Set it in .env before deploying to production.'
      );
      (globalThis as Record<string, unknown>).__apiKeyWarned = true;
    }
    next();
    return;
  }

  const provided = req.headers['x-api-key'];

  if (!provided || provided !== API_KEY) {
    res.status(401).json({
      ok:    false,
      error: 'Unauthorized — missing or invalid X-API-Key header.',
    });
    return;
  }

  next();
}
