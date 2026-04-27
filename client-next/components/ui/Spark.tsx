import * as React from 'react';
import type { TimeseriesPoint } from '@/lib/types';
import { cn } from '@/lib/utils';

/**
 * Inline sparkline — plain SVG, no dependencies. Two variants:
 *   "line" for KPI tiles, "area" for section-level cards.
 *
 * Width/height are controlled via the container; the SVG fills it.
 */
export interface SparkProps {
  data: TimeseriesPoint[];
  variant?: 'line' | 'area';
  tone?: 'brand' | 'success' | 'warning' | 'danger';
  className?: string;
  height?: number;
}

const STROKE: Record<NonNullable<SparkProps['tone']>, string> = {
  brand:   'stroke-brand-500',
  success: 'stroke-success',
  warning: 'stroke-warning',
  danger:  'stroke-danger',
};

const FILL: Record<NonNullable<SparkProps['tone']>, string> = {
  brand:   'fill-brand-500/10',
  success: 'fill-success/10',
  warning: 'fill-warning/10',
  danger:  'fill-danger/10',
};

export function Spark({
  data,
  variant = 'line',
  tone = 'brand',
  className,
  height = 48,
}: SparkProps) {
  if (!data.length) return null;

  const W = 100;
  const H = 100;
  const pad = 4;
  const min = Math.min(...data.map(d => d.v));
  const max = Math.max(...data.map(d => d.v));
  const span = Math.max(1, max - min);

  const points = data.map((d, i) => {
    const x = pad + (i / (data.length - 1)) * (W - pad * 2);
    const y = H - pad - ((d.v - min) / span) * (H - pad * 2);
    return [x, y] as const;
  });

  const linePath = points
    .map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`)
    .join(' ');

  const areaPath =
    `${linePath} L${points[points.length - 1][0].toFixed(2)},${H - pad} L${points[0][0].toFixed(2)},${H - pad} Z`;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      className={cn('w-full', className)}
      style={{ height }}
    >
      {variant === 'area' && <path d={areaPath} className={FILL[tone]} />}
      <path
        d={linePath}
        className={cn(STROKE[tone], 'fill-none')}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
