import * as React from 'react';
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import { Card } from './Card';
import { cn } from '@/lib/utils';
import type { Kpi } from '@/lib/types';

/**
 * Single KPI tile — value + delta + optional sparkline / icon.
 *
 * Drives the Overview / AI Control / Fleet / Analytics header grids.
 * Keep this dumb: it reads from a `Kpi` shape and renders one block.
 */
export interface StatTileProps {
  kpi: Kpi;
  icon?: React.ReactNode;
  accent?: boolean;
}

const TREND_ICON = {
  up:   ArrowUpRight,
  down: ArrowDownRight,
  flat: Minus,
} as const;

const TONE: Record<NonNullable<Kpi['tone']>, string> = {
  success: 'text-success',
  warning: 'text-warning',
  danger:  'text-danger',
  ai:      'text-ai',
  neutral: 'text-ink-500',
};

export function StatTile({ kpi, icon, accent }: StatTileProps) {
  const TrendIcon = TREND_ICON[kpi.trend];
  const tone = kpi.tone ?? 'neutral';

  return (
    <Card
      variant={accent ? 'gradient' : 'default'}
      hover
      className="px-5 py-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[11px] font-medium uppercase tracking-wider text-ink-400">
            {kpi.label}
          </div>
          <div className="mt-2 text-[1.6rem] font-semibold tracking-tight text-ink-900 tabular-nums leading-none">
            {kpi.value}
          </div>
          <div className={cn('mt-2 inline-flex items-center gap-1 text-xs font-medium', TONE[tone])}>
            <TrendIcon className="h-3.5 w-3.5" />
            <span className="tabular-nums">{kpi.delta}</span>
            <span className="text-ink-400 font-normal">vs last period</span>
          </div>
        </div>
        {icon && (
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-gradient-soft text-brand-600">
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}
