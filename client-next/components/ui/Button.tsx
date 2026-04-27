import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Primary interaction primitive. Variants follow the Meridian palette:
 *
 *   primary  → brand gradient, white text (main call-to-action)
 *   secondary→ white w/ border (structural actions)
 *   ghost    → transparent, hover state only
 *   danger   → rose accent
 *   ai       → indigo-tinted, for AI-triggered actions
 *
 * Sizes: sm · md · lg. Loading state swaps the icon for a spinner and
 * disables pointer events without shifting layout.
 */
type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'ai';
type ButtonSize    = 'sm' | 'md' | 'lg';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?:    ButtonSize;
  loading?: boolean;
  icon?:    React.ReactNode;
  iconRight?: React.ReactNode;
}

const base =
  'inline-flex items-center justify-center gap-2 font-medium rounded-xl ' +
  'transition-all duration-200 select-none ' +
  'disabled:opacity-50 disabled:cursor-not-allowed ' +
  'active:scale-[0.98]';

const VARIANT: Record<ButtonVariant, string> = {
  primary:
    'bg-brand-gradient text-white shadow-soft hover:shadow-lift hover:brightness-[1.05]',
  secondary:
    'bg-white text-ink-800 border border-ink-200 hover:border-ink-300 hover:bg-ink-50/60 shadow-card',
  ghost:
    'bg-transparent text-ink-600 hover:bg-ink-100 hover:text-ink-900',
  danger:
    'bg-danger text-white shadow-soft hover:brightness-[1.06]',
  ai:
    'bg-ai-soft text-ai-ink border border-brand-200 hover:bg-brand-100/70',
};

const SIZE: Record<ButtonSize, string> = {
  sm: 'h-8  px-3  text-xs',
  md: 'h-10 px-4  text-sm',
  lg: 'h-11 px-5  text-[0.95rem]',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    { variant = 'primary', size = 'md', loading, icon, iconRight, className, children, disabled, ...props },
    ref,
  ) {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(base, VARIANT[variant], SIZE[size], className)}
        {...props}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
        {children}
        {!loading && iconRight}
      </button>
    );
  },
);
