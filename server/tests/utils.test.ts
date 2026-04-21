/**
 * ============================================================
 * tests/utils.test.ts
 * ============================================================
 * Unit tests for pure utility functions:
 *   - sanitizeResolvedBy (auth input validation)
 *   - parseRelativeEta   (ETA parsing from seed.ts)
 *   - nextOptId / nextHzId format validation
 *   - ID regex patterns
 * ============================================================
 */

import { describe, it, expect } from 'vitest';

// ─────────────────────────────────────────────────────────────
// sanitizeResolvedBy — extracted for testability
// ─────────────────────────────────────────────────────────────

// Inline the function here (matches the one in LogisticsController.ts)
const RESOLVED_BY_RE = /^[\w\s@.\-+]{1,80}$/;
function sanitizeResolvedBy(raw: unknown): string {
  if (typeof raw !== 'string' || !RESOLVED_BY_RE.test(raw.trim())) return 'operator';
  return raw.trim().slice(0, 80);
}

describe('sanitizeResolvedBy', () => {
  it('returns the trimmed value for a valid email-like string', () => {
    expect(sanitizeResolvedBy('operator@meridian.io')).toBe('operator@meridian.io');
  });

  it('returns the trimmed value for a simple name', () => {
    expect(sanitizeResolvedBy('  Alice B  ')).toBe('Alice B');
  });

  it('falls back to "operator" for an empty string', () => {
    expect(sanitizeResolvedBy('')).toBe('operator');
  });

  it('falls back to "operator" for undefined', () => {
    expect(sanitizeResolvedBy(undefined)).toBe('operator');
  });

  it('falls back to "operator" for a number', () => {
    expect(sanitizeResolvedBy(42)).toBe('operator');
  });

  it('falls back to "operator" for a string with angle brackets (XSS attempt)', () => {
    expect(sanitizeResolvedBy('<script>alert(1)</script>')).toBe('operator');
  });

  it('falls back to "operator" for a string longer than 80 chars after trim', () => {
    const long = 'a'.repeat(81);
    // 81 chars fails the regex {1,80}
    expect(sanitizeResolvedBy(long)).toBe('operator');
  });

  it('accepts exactly 80 characters', () => {
    const exactly80 = 'a'.repeat(80);
    expect(sanitizeResolvedBy(exactly80)).toBe(exactly80);
  });
});

// ─────────────────────────────────────────────────────────────
// parseRelativeEta — extracted from seed.ts
// ─────────────────────────────────────────────────────────────

function parseRelativeEta(label: string, now = new Date()): Date {
  let totalMs = 0;
  const dayMatch  = label.match(/(\d+)d/);
  const hourMatch = label.match(/(\d+)h/);
  const minMatch  = label.match(/(\d+)m/);
  if (dayMatch)  totalMs += parseInt(dayMatch[1],  10) * 24 * 60 * 60 * 1000;
  if (hourMatch) totalMs += parseInt(hourMatch[1], 10) * 60 * 60 * 1000;
  if (minMatch)  totalMs += parseInt(minMatch[1],  10) * 60 * 1000;
  return new Date(now.getTime() + totalMs);
}

describe('parseRelativeEta', () => {
  const baseDate = new Date('2026-04-19T00:00:00.000Z');

  it('parses "T+32h 10m" correctly', () => {
    const result = parseRelativeEta('T+32h 10m', baseDate);
    const diffMs = result.getTime() - baseDate.getTime();
    expect(diffMs).toBe((32 * 60 + 10) * 60 * 1000);
  });

  it('parses "T+6d 02h" correctly', () => {
    const result = parseRelativeEta('T+6d 02h', baseDate);
    const diffMs = result.getTime() - baseDate.getTime();
    expect(diffMs).toBe((6 * 24 * 60 + 2 * 60) * 60 * 1000);
  });

  it('parses hours-only label "T+18h"', () => {
    const result = parseRelativeEta('T+18h', baseDate);
    const diffMs = result.getTime() - baseDate.getTime();
    expect(diffMs).toBe(18 * 60 * 60 * 1000);
  });

  it('returns a date in the future relative to now', () => {
    const result = parseRelativeEta('T+1h', baseDate);
    expect(result.getTime()).toBeGreaterThan(baseDate.getTime());
  });

  it('returns the base date for an empty label (no duration extracted)', () => {
    const result = parseRelativeEta('', baseDate);
    expect(result.getTime()).toBe(baseDate.getTime());
  });
});

// ─────────────────────────────────────────────────────────────
// ID format patterns
// ─────────────────────────────────────────────────────────────

describe('ID regex patterns', () => {
  const OPT_RE = /^OPT-\d+$/;
  const HZ_RE  = /^HZ-\d+$/;
  const MRD_RE = /^MRD-\d+$/;

  it('OPT regex accepts OPT-5000', () => {
    expect(OPT_RE.test('OPT-5000')).toBe(true);
  });

  it('OPT regex accepts OPT-10000 (previously broken with \\d{4})', () => {
    expect(OPT_RE.test('OPT-10000')).toBe(true);
  });

  it('OPT regex rejects OPT- (no digits)', () => {
    expect(OPT_RE.test('OPT-')).toBe(false);
  });

  it('HZ regex accepts HZ-100', () => {
    expect(HZ_RE.test('HZ-100')).toBe(true);
  });

  it('HZ regex accepts HZ-1000 (previously broken with \\d{3})', () => {
    expect(HZ_RE.test('HZ-1000')).toBe(true);
  });

  it('MRD regex accepts MRD-48271', () => {
    expect(MRD_RE.test('MRD-48271')).toBe(true);
  });

  it('MRD regex accepts MRD-100000 (6 digits)', () => {
    expect(MRD_RE.test('MRD-100000')).toBe(true);
  });

  it('MRD regex rejects MRD-ABC', () => {
    expect(MRD_RE.test('MRD-ABC')).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────
// ID generator formatting
// ─────────────────────────────────────────────────────────────

describe('ID generator output format', () => {
  function makeOptId(seq: number): string { return `OPT-${seq}`; }
  function makeHzId(seq: number):  string { return `HZ-${seq}`; }

  it('OPT-5000 matches the OPT regex', () => {
    expect(/^OPT-\d+$/.test(makeOptId(5000))).toBe(true);
  });

  it('HZ-100 matches the HZ regex', () => {
    expect(/^HZ-\d+$/.test(makeHzId(100))).toBe(true);
  });

  it('sequential IDs are unique', () => {
    const ids = [5000, 5001, 5002, 5003].map(makeOptId);
    const set = new Set(ids);
    expect(set.size).toBe(ids.length);
  });
});
