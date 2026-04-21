/**
 * ============================================================
 * services/SseService.ts — Server-Sent Events bus
 * ============================================================
 * Provides a lightweight in-process SSE broadcaster.
 *
 * Flow:
 *   1. A client opens GET /api/events (registered in routes/api.ts).
 *      The registerClient() helper stores the Response object and
 *      sends an initial "connected" event.
 *
 *   2. When a simulation completes or a reroute is executed,
 *      the controller calls sseEmit(eventType, payload).
 *      This serialises the payload as JSON and writes it to ALL
 *      currently-connected Response streams.
 *
 *   3. When a client disconnects (tab close, network drop),
 *      the 'close' event on req removes the stale Response from
 *      the client set automatically.
 *
 * Why SSE instead of WebSockets?
 *   - Unidirectional (server → client) is all we need.
 *   - No extra library, works over HTTP/1.1, auto-reconnects
 *     natively in the browser via EventSource.
 *   - Simpler than WS for this use case and compatible with
 *     Express middleware without upgrading the HTTP server.
 *
 * Scaling note:
 *   This implementation uses a module-level Set, which is
 *   per-process. For a multi-process deployment (PM2 cluster,
 *   multiple containers) you would replace the Set with a
 *   Redis pub/sub channel. For the demo/single-server use case
 *   this is correct and sufficient.
 * ============================================================
 */

import { Request, Response } from 'express';

// ─────────────────────────────────────────────────────────────
// Client registry
// ─────────────────────────────────────────────────────────────

const clients = new Set<Response>();

// ─────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────

/**
 * registerClient
 * ──────────────
 * Attach a new SSE client connection to the registry.
 * Call this from the GET /api/events route handler.
 *
 * Sets the required SSE headers, sends an initial "connected"
 * event, and removes the response from the registry when the
 * client disconnects.
 */
export function registerClient(req: Request, res: Response): void {
  // Required SSE headers
  res.set({
    'Content-Type':  'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection':    'keep-alive',
    // Allow cross-origin EventSource in dev (Vite on :3000 → Express on :5000)
    'X-Accel-Buffering': 'no',
  });

  // Flush headers immediately so the browser knows the stream is open
  res.flushHeaders();

  // Register this client
  clients.add(res);
  console.log(`[SSE] Client connected  (total: ${clients.size})`);

  // Send initial handshake event
  writeEvent(res, 'connected', { message: 'Meridian SSE stream established' });

  // Keep-alive ping every 25 seconds (browsers drop idle SSE after ~30 s)
  const ping = setInterval(() => {
    if (!res.writableEnded) {
      res.write(': ping\n\n');
    }
  }, 25_000);

  // Cleanup on disconnect
  req.on('close', () => {
    clearInterval(ping);
    clients.delete(res);
    console.log(`[SSE] Client disconnected (total: ${clients.size})`);
  });
}

/**
 * sseEmit
 * ───────
 * Broadcast an event to all currently-connected SSE clients.
 *
 * @param event   - Event name (e.g. "simulation:complete", "reroute:executed")
 * @param payload - Any JSON-serialisable object
 */
export function sseEmit(event: string, payload: unknown): void {
  if (clients.size === 0) return; // no-op when no one is listening

  let sent = 0;
  for (const res of clients) {
    if (res.writableEnded) {
      clients.delete(res);   // prune stale connections opportunistically
      continue;
    }
    writeEvent(res, event, payload);
    sent++;
  }

  if (sent > 0) {
    console.log(`[SSE] Emitted "${event}" to ${sent} client(s)`);
  }
}

// ─────────────────────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────────────────────

/**
 * Serialises and writes a single SSE message frame.
 * SSE wire format:
 *   event: <name>\n
 *   data: <json>\n
 *   \n
 */
function writeEvent(res: Response, event: string, payload: unknown): void {
  try {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
  } catch {
    // If the write fails, remove the client so we don't keep trying
    clients.delete(res);
  }
}
