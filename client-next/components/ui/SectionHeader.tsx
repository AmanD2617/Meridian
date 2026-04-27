import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Page-level heading used at the top of every screen.
 * Keeps vertical rhythm uniform: eyebrow + title + subtitle + optional
 * right-side actions. Do not inline this logic in individual pages.
 */
export interface SectionHeaderProps {
  eyebrow?:  React.ReactNode;
  title:     React.ReactNode;
  subtitle?: React.ReactNode;
  actions?:  React.ReactNode;
  className?: string;
}

export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  actions,
  className,
}: SectionHeaderProps) {
  return (
    <header className={cn('flex items-start justify-between gap-6 mb-6 flex-wrap', className)}>
      <div className="min-w-0">
        {eyebrow && (
          <div className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-brand-600">
            {eyebrow}
          </div>
        )}
        <h1 className="text-[1.6rem] font-semibold tracking-tight text-ink-900 leading-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1.5 text-sm text-ink-500 max-w-2xl">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </header>
  );
}
