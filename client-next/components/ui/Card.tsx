import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Rounded, soft-shadowed content container. Composable: Card + CardHeader +
 * CardBody + CardFooter, but any of them can be used standalone.
 *
 *   <Card>
 *     <CardHeader title="Title" subtitle="…" action={<Button/>} />
 *     <CardBody>content</CardBody>
 *   </Card>
 *
 * Variant "muted" uses the subtle surface color for stacked cards.
 * Variant "gradient" adds a brand-tinted top edge — used for hero tiles.
 */
type CardVariant = 'default' | 'muted' | 'gradient';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  hover?:   boolean;
}

const variantClasses: Record<CardVariant, string> = {
  default:
    'bg-surface-card border border-ink-100 shadow-card',
  muted:
    'bg-surface-muted border border-ink-100',
  gradient:
    'bg-surface-card border border-ink-100 shadow-card relative overflow-hidden ' +
    'before:absolute before:inset-x-0 before:top-0 before:h-[3px] before:bg-brand-gradient',
};

export function Card({ variant = 'default', hover, className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl',
        variantClasses[variant],
        hover && 'transition-all duration-200 hover:-translate-y-[1px] hover:shadow-soft',
        className,
      )}
      {...props}
    />
  );
}

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title?:    React.ReactNode;
  subtitle?: React.ReactNode;
  action?:   React.ReactNode;
  eyebrow?:  React.ReactNode;
}

export function CardHeader({
  title,
  subtitle,
  action,
  eyebrow,
  className,
  children,
  ...props
}: CardHeaderProps) {
  return (
    <div
      className={cn(
        'flex items-start justify-between gap-4 px-5 pt-5 pb-4',
        className,
      )}
      {...props}
    >
      <div className="min-w-0">
        {eyebrow && (
          <div className="mb-1 text-[11px] font-medium uppercase tracking-wider text-ink-400">
            {eyebrow}
          </div>
        )}
        {title    && <h3 className="text-[0.95rem] font-semibold text-ink-900 leading-tight">{title}</h3>}
        {subtitle && <p className="mt-1 text-sm text-ink-500 leading-snug">{subtitle}</p>}
        {children}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function CardBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('px-5 pb-5', className)} {...props} />;
}

export function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 px-5 py-4 border-t border-ink-100 bg-ink-50/40 rounded-b-2xl',
        className,
      )}
      {...props}
    />
  );
}
