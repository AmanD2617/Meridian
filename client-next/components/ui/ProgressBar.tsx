import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Thin horizontal progress indicator. Track is muted, fill uses the
 * brand gradient by default; override via `tone` for status bars.
 */
export interface ProgressBarProps {
  value: number;  // 0 – 1
  tone?: 'brand' | 'success' | 'warning' | 'danger';
  className?: string;
}

const FILL = {
  brand:   'bg-brand-gradient',
  success: 'bg-success',
  warning: 'bg-warning',
  danger:  'bg-danger',
} as const;

export function ProgressBar({ value, tone = 'brand', className }: ProgressBarProps) {
  const pct = Math.max(0, Math.min(1, value));
  return (
    <div className={cn('h-1.5 w-full rounded-full bg-ink-100 overflow-hidden', className)}>
      <div
        className={cn('h-full rounded-full transition-all duration-500', FILL[tone])}
        style={{ width: `${pct * 100}%` }}
      />
    </div>
  );
}
