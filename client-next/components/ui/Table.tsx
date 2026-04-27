import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Dense but readable table primitive used across Shipments, Fleet, and
 * the Risk Alerts screens. Composed of Table / THead / TBody / TR / TH / TD.
 *
 * Hover rows get a subtle tint. No per-cell padding overrides — all
 * density lives in the TR / TH / TD classes so the table stays consistent.
 */
export function Table({ className, ...props }: React.HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="overflow-x-auto scroll-subtle">
      <table
        className={cn('w-full text-sm text-left border-separate border-spacing-0', className)}
        {...props}
      />
    </div>
  );
}

export function THead({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead
      className={cn(
        'bg-ink-50/70 text-[11px] font-medium uppercase tracking-wider text-ink-500',
        className,
      )}
      {...props}
    />
  );
}

export function TBody({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cn('divide-y divide-ink-100', className)} {...props} />;
}

export function TR({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn(
        'transition-colors duration-200 hover:bg-ink-50/60',
        className,
      )}
      {...props}
    />
  );
}

export function TH({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn('px-5 py-3 font-medium text-left whitespace-nowrap', className)}
      {...props}
    />
  );
}

export function TD({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={cn('px-5 py-3.5 text-ink-700 whitespace-nowrap align-middle', className)}
      {...props}
    />
  );
}
