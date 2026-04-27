import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Small semantic pill used for status, severity, mode tags, etc.
 *
 * Tones map to the Meridian palette:
 *   success → green  (on-time, delivered, healthy)
 *   warning → amber  (at-risk, delayed, attention)
 *   danger  → rose   (critical, failed)
 *   ai      → indigo (AI-generated, auto-approved)
 *   neutral → slate  (informational)
 *
 * Size "sm" is for dense tables, "md" for card chrome.
 */
export type BadgeTone = 'success' | 'warning' | 'danger' | 'ai' | 'neutral';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  size?: 'sm' | 'md';
  dot?:  boolean;
}

const TONE: Record<BadgeTone, { chip: string; dot: string }> = {
  success: { chip: 'bg-success-soft text-success-ink',       dot: 'bg-success' },
  warning: { chip: 'bg-warning-soft text-warning-ink',       dot: 'bg-warning' },
  danger:  { chip: 'bg-danger-soft  text-danger-ink',        dot: 'bg-danger'  },
  ai:      { chip: 'bg-ai-soft      text-ai-ink',            dot: 'bg-ai'      },
  neutral: { chip: 'bg-ink-100      text-ink-700',           dot: 'bg-ink-400' },
};

const SIZE = {
  sm: 'h-5 px-1.5 text-[10.5px] font-medium',
  md: 'h-6 px-2   text-[11.5px] font-medium',
};

export function Badge({ tone = 'neutral', size = 'md', dot, className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full tracking-wide uppercase',
        SIZE[size],
        TONE[tone].chip,
        className,
      )}
      {...props}
    >
      {dot && <span className={cn('h-1.5 w-1.5 rounded-full', TONE[tone].dot)} />}
      {children}
    </span>
  );
}
