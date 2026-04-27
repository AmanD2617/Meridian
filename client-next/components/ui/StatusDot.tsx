import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Tiny pulsing dot used to indicate live state (e.g. "Syncing · 12ms"
 * chip, in-progress row status). Tone maps to the semantic palette.
 */
export interface StatusDotProps {
  tone?: 'success' | 'warning' | 'danger' | 'ai' | 'neutral';
  pulse?: boolean;
  className?: string;
}

const COLOR = {
  success: 'bg-success',
  warning: 'bg-warning',
  danger:  'bg-danger',
  ai:      'bg-ai',
  neutral: 'bg-ink-400',
} as const;

export function StatusDot({ tone = 'success', pulse, className }: StatusDotProps) {
  return (
    <span className={cn('relative inline-flex h-2 w-2', className)}>
      {pulse && (
        <span
          className={cn(
            'absolute inset-0 rounded-full opacity-60 animate-pulse-dot',
            COLOR[tone],
          )}
        />
      )}
      <span className={cn('relative h-2 w-2 rounded-full', COLOR[tone])} />
    </span>
  );
}
