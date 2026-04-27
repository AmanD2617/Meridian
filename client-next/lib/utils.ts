import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Tailwind-aware className combiner. Merges conflicting utilities
 * so last-writer-wins ordering matches what you'd expect.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Format a number with thousands separators. */
export function fmt(n: number, fractionDigits = 0): string {
  return n.toLocaleString('en-US', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
}

/** Format USD with compact notation (e.g. "$2.4M"). */
export function fmtUsdCompact(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}

/** Convert decimal hours → "T+3h 14m". */
export function fmtHours(h: number): string {
  const hrs  = Math.floor(h);
  const mins = Math.round((h - hrs) * 60);
  return mins > 0 ? `T+${hrs}h ${mins}m` : `T+${hrs}h`;
}

/** Relative time string, compact. */
export function fmtRelative(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const abs = Math.abs(diffMs);
  const m = Math.round(abs / 60_000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  return `${d}d ago`;
}
