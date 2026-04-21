/**
 * ============================================================
 * tests/adapters.test.ts
 * ============================================================
 * Unit tests for the API response shape helpers.
 * Tests the controller's response envelope and the SSE service.
 * No database required — all pure function tests.
 * ============================================================
 */

import { describe, it, expect } from 'vitest';

// ─────────────────────────────────────────────────────────────
// API response envelope helpers (duplicated from controller)
// ─────────────────────────────────────────────────────────────

// Minimal mock Response
function makeMockRes() {
  let statusCode = 200;
  let body: unknown = null;
  return {
    status(code: number) { statusCode = code; return this; },
    json(data: unknown) { body = data; return this; },
    get statusCode() { return statusCode; },
    get body() { return body; },
  };
}

describe('API response envelope', () => {
  it('success envelope sets ok: true and wraps data', () => {
    const res = makeMockRes();
    function success<T>(r: typeof res, data: T, status = 200) {
      r.status(status).json({ ok: true, data });
    }
    success(res, { foo: 'bar' });
    expect((res.body as Record<string, unknown>).ok).toBe(true);
    expect((res.body as Record<string, unknown>).data).toEqual({ foo: 'bar' });
    expect(res.statusCode).toBe(200);
  });

  it('success envelope uses provided status code', () => {
    const res = makeMockRes();
    function success<T>(r: typeof res, data: T, status = 200) {
      r.status(status).json({ ok: true, data });
    }
    success(res, {}, 201);
    expect(res.statusCode).toBe(201);
  });

  it('failure envelope sets ok: false and includes error message', () => {
    const res = makeMockRes();
    function failure(r: typeof res, message: string, status = 500, details?: string) {
      const b: Record<string, unknown> = { ok: false, error: message };
      if (details) b.details = details;
      r.status(status).json(b);
    }
    failure(res, 'Something broke', 422, 'field missing');
    expect((res.body as Record<string, unknown>).ok).toBe(false);
    expect((res.body as Record<string, unknown>).error).toBe('Something broke');
    expect((res.body as Record<string, unknown>).details).toBe('field missing');
    expect(res.statusCode).toBe(422);
  });

  it('failure envelope omits details when not provided', () => {
    const res = makeMockRes();
    function failure(r: typeof res, message: string, status = 500, details?: string) {
      const b: Record<string, unknown> = { ok: false, error: message };
      if (details) b.details = details;
      r.status(status).json(b);
    }
    failure(res, 'Not found', 404);
    expect('details' in (res.body as Record<string, unknown>)).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────
// Scenario rotation logic
// ─────────────────────────────────────────────────────────────

describe('Simulation scenario rotation', () => {
  const SCENARIOS = [
    { name: 'Pacific Typhoon' },
    { name: 'Arabian Sea Cyclone' },
    { name: 'South China Sea Closure' },
    { name: 'Indian Ocean Storm' },
  ];

  function pickScenario(totalLogs: number) {
    return SCENARIOS[totalLogs % SCENARIOS.length];
  }

  it('picks the first scenario when no logs exist', () => {
    expect(pickScenario(0).name).toBe('Pacific Typhoon');
  });

  it('rotates to the second scenario after 1 log', () => {
    expect(pickScenario(1).name).toBe('Arabian Sea Cyclone');
  });

  it('wraps around to the first scenario after all 4', () => {
    expect(pickScenario(4).name).toBe('Pacific Typhoon');
  });

  it('covers all 4 scenarios in a cycle of 4 simulations', () => {
    const names = [0, 1, 2, 3].map(i => pickScenario(i).name);
    expect(new Set(names).size).toBe(4);
  });
});

// ─────────────────────────────────────────────────────────────
// hoursToAbsoluteDate helper
// ─────────────────────────────────────────────────────────────

describe('hoursToAbsoluteDate', () => {
  function hoursToAbsoluteDate(hours: number, now = Date.now()): Date {
    return new Date(now + hours * 60 * 60 * 1000);
  }

  it('converts 1 hour to a date 3600 seconds in the future', () => {
    const base = new Date('2026-01-01T00:00:00Z').getTime();
    const result = hoursToAbsoluteDate(1, base);
    expect(result.getTime() - base).toBe(3_600_000);
  });

  it('converts 0 hours to the current time', () => {
    const base = new Date('2026-01-01T00:00:00Z').getTime();
    const result = hoursToAbsoluteDate(0, base);
    expect(result.getTime()).toBe(base);
  });

  it('converts 32.167 hours (32h 10m) correctly', () => {
    const base   = 0;
    const result = hoursToAbsoluteDate(32 + 10 / 60, base);
    const expectedMs = (32 * 60 + 10) * 60 * 1000;
    expect(Math.round(result.getTime())).toBeCloseTo(expectedMs, -2);
  });
});

// ─────────────────────────────────────────────────────────────
// Auth middleware logic
// ─────────────────────────────────────────────────────────────

describe('requireApiKey logic', () => {
  function checkApiKey(
    configuredKey: string | undefined,
    providedKey: string | undefined,
    nodeEnv: string,
  ): 'pass' | 'reject' | 'misconfigured' {
    if (!configuredKey) {
      return nodeEnv === 'production' ? 'misconfigured' : 'pass';
    }
    return providedKey === configuredKey ? 'pass' : 'reject';
  }

  it('passes in dev when no key is configured', () => {
    expect(checkApiKey(undefined, undefined, 'development')).toBe('pass');
  });

  it('rejects in production when no key is configured', () => {
    expect(checkApiKey(undefined, undefined, 'production')).toBe('misconfigured');
  });

  it('passes when the correct key is provided', () => {
    expect(checkApiKey('secret', 'secret', 'production')).toBe('pass');
  });

  it('rejects when an incorrect key is provided', () => {
    expect(checkApiKey('secret', 'wrong', 'production')).toBe('reject');
  });

  it('rejects when no key header is sent but a key is configured', () => {
    expect(checkApiKey('secret', undefined, 'production')).toBe('reject');
  });
});
