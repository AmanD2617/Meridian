import * as React from 'react';
import { cn } from '@/lib/utils';

export interface EmptyStateProps {
  icon?:     React.ReactNode;
  title:     React.ReactNode;
  subtitle?: React.ReactNode;
  action?:   React.ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, subtitle, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center py-14 px-6',
        className,
      )}
    >
      {icon && (
        <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-brand-gradient-soft text-brand-600">
          {icon}
        </div>
      )}
      <h4 className="text-[0.95rem] font-semibold text-ink-900">{title}</h4>
      {subtitle && <p className="mt-1 text-sm text-ink-500 max-w-sm">{subtitle}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
