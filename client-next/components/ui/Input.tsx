import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  kbd?:  string;
}

/**
 * Text input used for search bars, filters, and form fields.
 * Supports an optional leading icon and a trailing keyboard-shortcut chip.
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  function Input({ icon, kbd, className, ...props }, ref) {
    return (
      <div
        className={cn(
          'group relative flex items-center h-10 rounded-xl',
          'bg-white border border-ink-200 shadow-card',
          'transition-all duration-200',
          'focus-within:border-brand-400 focus-within:shadow-soft',
          className,
        )}
      >
        {icon && (
          <span className="pl-3 text-ink-400 group-focus-within:text-brand-500 transition-colors">
            {icon}
          </span>
        )}
        <input
          ref={ref}
          {...props}
          className="flex-1 min-w-0 bg-transparent px-3 text-sm text-ink-900 placeholder:text-ink-400 outline-none"
        />
        {kbd && (
          <kbd className="mr-2 rounded-md border border-ink-200 bg-ink-50 px-1.5 py-0.5 text-[10.5px] font-medium text-ink-500">
            {kbd}
          </kbd>
        )}
      </div>
    );
  },
);
