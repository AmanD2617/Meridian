'use client';

import * as React from 'react';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Clock,
  Leaf,
  Download,
  Share2,
  ArrowUpRight,
  ArrowDownRight,
  Ship,
  Plane,
  Truck,
  Train,
} from 'lucide-react';

import { SectionHeader }  from '@/components/ui/SectionHeader';
import { StatTile }       from '@/components/ui/StatTile';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button }         from '@/components/ui/Button';
import { Badge }          from '@/components/ui/Badge';
import { Tabs }           from '@/components/ui/Tabs';
import { Spark }          from '@/components/ui/Spark';
import { ProgressBar }    from '@/components/ui/ProgressBar';

import {
  ANALYTICS_KPIS,
  SHIPMENT_FLOW_30D,
  ON_TIME_30D,
  COST_INDEX_30D,
} from '@/lib/mock/kpis';
import { cn } from '@/lib/utils';
import type { TransportMode } from '@/lib/types';

type Range = '7d' | '30d' | '90d' | '1y';

const KPI_ICONS = [
  <DollarSign key="s" className="h-5 w-5" />,
  <Clock      key="t" className="h-5 w-5" />,
  <TrendingUp key="r" className="h-5 w-5" />,
  <BarChart3  key="c" className="h-5 w-5" />,
];

const MODE_MIX: { mode: TransportMode; pct: number; tonsK: number; trend: 'up' | 'down' | 'flat' }[] = [
  { mode: 'OCEAN', pct: 0.58, tonsK: 2_840, trend: 'up'   },
  { mode: 'AIR',   pct: 0.11, tonsK: 540,   trend: 'flat' },
  { mode: 'ROAD',  pct: 0.19, tonsK: 930,   trend: 'up'   },
  { mode: 'RAIL',  pct: 0.12, tonsK: 590,   trend: 'down' },
];

const MODE_ICON: Record<TransportMode, React.ComponentType<{ className?: string }>> = {
  OCEAN: Ship,
  AIR:   Plane,
  ROAD:  Truck,
  RAIL:  Train,
};

const TOP_LANES = [
  { lane: 'PVG → RTM', mode: 'OCEAN' as const, volume: 842, onTime: 0.968, cost: 102.1 },
  { lane: 'SIN → LAX', mode: 'OCEAN' as const, volume: 611, onTime: 0.942, cost: 99.4  },
  { lane: 'FRA → BOM', mode: 'AIR'   as const, volume: 512, onTime: 0.981, cost: 118.0 },
  { lane: 'DXB → JFK', mode: 'AIR'   as const, volume: 398, onTime: 0.934, cost: 121.6 },
  { lane: 'LAX → ORD', mode: 'ROAD'  as const, volume: 288, onTime: 0.972, cost: 101.3 },
  { lane: 'XMN → HAM', mode: 'RAIL'  as const, volume: 251, onTime: 0.918, cost: 96.2  },
];

export default function AnalyticsPage() {
  const [range, setRange] = React.useState<Range>('30d');

  return (
    <>
      <SectionHeader
        eyebrow="Insights · Analytics"
        title="Performance analytics"
        subtitle="Network throughput, lane economics, and the business impact of AI reroutes."
        actions={
          <>
            <Button variant="secondary" icon={<Share2 className="h-4 w-4" />}>Share</Button>
            <Button icon={<Download className="h-4 w-4" />}>Export report</Button>
          </>
        }
      />

      {/* Range + KPIs */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <Tabs value={range} onChange={v => setRange(v as Range)}>
          <Tabs.Item value="7d">7 days</Tabs.Item>
          <Tabs.Item value="30d">30 days</Tabs.Item>
          <Tabs.Item value="90d">90 days</Tabs.Item>
          <Tabs.Item value="1y">1 year</Tabs.Item>
        </Tabs>
        <Badge tone="ai" dot size="md">Updated 2m ago</Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {ANALYTICS_KPIS.map((k, i) => (
          <StatTile key={k.label} kpi={k} icon={KPI_ICONS[i]} accent={i === 0} />
        ))}
      </div>

      {/* Main charts */}
      <div className="mt-6 grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card className="xl:col-span-2">
          <CardHeader
            eyebrow="Trend · 30 days"
            title="Shipment flow"
            subtitle="Daily volume across all modes."
            action={
              <div className="flex items-center gap-3">
                <TrendChip label="+4.8%" trend="up" tone="success" />
                <span className="text-[11px] text-ink-400">vs. prior 30d</span>
              </div>
            }
          />
          <CardBody>
            <div className="flex items-end justify-between mb-3">
              <div>
                <div className="text-[11px] uppercase tracking-wider text-ink-400">Today</div>
                <div className="text-[1.6rem] font-semibold text-ink-900 tabular-nums">1,284</div>
              </div>
              <div className="text-right">
                <div className="text-[11px] uppercase tracking-wider text-ink-400">30d avg</div>
                <div className="text-[1.15rem] font-semibold text-ink-700 tabular-nums">1,203</div>
              </div>
            </div>
            <Spark data={SHIPMENT_FLOW_30D} variant="area" tone="brand" height={160} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            eyebrow="SLA · 30 days"
            title="On-time performance"
            subtitle="Delivered within planned window."
          />
          <CardBody>
            <div className="flex items-end justify-between mb-3">
              <div>
                <div className="text-[11px] uppercase tracking-wider text-ink-400">Current</div>
                <div className="text-[1.6rem] font-semibold text-success tabular-nums">96.4%</div>
              </div>
              <TrendChip label="+1.2pp" trend="up" tone="success" />
            </div>
            <Spark data={ON_TIME_30D} variant="area" tone="success" height={160} />
          </CardBody>
        </Card>
      </div>

      {/* Cost + mode mix */}
      <div className="mt-6 grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card>
          <CardHeader
            eyebrow="Index · 30 days"
            title="Cost index"
            subtitle="100 = Q1 baseline. Drifting up with fuel."
          />
          <CardBody>
            <div className="flex items-end justify-between mb-3">
              <div>
                <div className="text-[11px] uppercase tracking-wider text-ink-400">Current</div>
                <div className="text-[1.6rem] font-semibold text-ink-900 tabular-nums">102.4</div>
              </div>
              <TrendChip label="+1.4" trend="up" tone="warning" />
            </div>
            <Spark data={COST_INDEX_30D} variant="area" tone="warning" height={160} />
          </CardBody>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader
            eyebrow="Mix · mode share"
            title="Volume by transport mode"
            subtitle="Total tonnes moved this period, split by mode."
          />
          <CardBody className="space-y-3">
            {MODE_MIX.map(m => {
              const Icon = MODE_ICON[m.mode];
              return (
                <div key={m.mode} className="flex items-center gap-4">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-gradient-soft text-brand-600">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-[60px]">
                    <div className="text-[12px] font-semibold text-ink-900">{m.mode}</div>
                    <div className="text-[10.5px] text-ink-400 tabular-nums">{m.tonsK.toLocaleString()}k t</div>
                  </div>
                  <div className="flex-1">
                    <ProgressBar value={m.pct} tone="brand" />
                  </div>
                  <div className="w-[60px] text-right tabular-nums text-[13px] font-semibold text-ink-800">
                    {Math.round(m.pct * 100)}%
                  </div>
                </div>
              );
            })}
          </CardBody>
        </Card>
      </div>

      {/* Top lanes + impact */}
      <div className="mt-6 grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card className="xl:col-span-2">
          <CardHeader
            eyebrow="Ranked · top lanes"
            title="Top lanes by volume"
            subtitle="Network-wide leaderboard for the selected range."
            action={<Button variant="ghost" size="sm">View all lanes</Button>}
          />
          <CardBody className="space-y-3">
            {TOP_LANES.map(l => {
              const Icon = MODE_ICON[l.mode];
              return (
                <div
                  key={l.lane}
                  className="flex items-center gap-4 rounded-xl border border-ink-100 p-3 hover:border-ink-200 hover:shadow-card transition-all duration-200"
                >
                  <div className="grid h-9 w-9 place-items-center rounded-lg bg-ink-50 text-ink-600">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[13px] font-semibold text-ink-900">{l.lane}</span>
                      <Badge tone="neutral" size="sm">{l.mode}</Badge>
                    </div>
                    <div className="mt-1 text-[11.5px] text-ink-500 tabular-nums">
                      {l.volume.toLocaleString()} shipments · on-time {(l.onTime * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[11px] uppercase tracking-wider text-ink-400">Cost idx</div>
                    <div className={cn(
                      'text-[14px] font-semibold tabular-nums',
                      l.cost > 110 ? 'text-warning' : l.cost > 100 ? 'text-ink-900' : 'text-success',
                    )}>
                      {l.cost.toFixed(1)}
                    </div>
                  </div>
                </div>
              );
            })}
          </CardBody>
        </Card>

        <Card variant="gradient">
          <CardHeader
            eyebrow="AI · business impact"
            title="Value captured"
            subtitle="Net effect of Meridian reroutes over the last 30 days."
          />
          <CardBody className="space-y-4">
            <ImpactRow icon={<DollarSign className="h-4 w-4" />} label="Spoilage avoided" value="$28.4M" tone="success" />
            <ImpactRow icon={<Clock      className="h-4 w-4" />} label="Transit time saved" value="1,840 h" tone="success" />
            <ImpactRow icon={<Leaf       className="h-4 w-4" />} label="CO₂ averted"       value="612 t"   tone="success" />
            <ImpactRow icon={<TrendingUp className="h-4 w-4" />} label="Reroutes executed" value="287"     tone="ai" />

            <div className="rounded-xl border border-brand-200 bg-white/70 p-3">
              <div className="text-[11px] font-medium uppercase tracking-wider text-ink-400">ROI multiplier</div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-[1.6rem] font-semibold tabular-nums text-ai">6.2×</span>
                <span className="text-[11.5px] text-ink-500">vs. Meridian license fee</span>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </>
  );
}

function TrendChip({ label, trend, tone }: { label: string; trend: 'up' | 'down'; tone: 'success' | 'warning' | 'danger' }) {
  const Icon = trend === 'up' ? ArrowUpRight : ArrowDownRight;
  const toneClass = {
    success: 'text-success bg-success-soft',
    warning: 'text-warning bg-warning-soft',
    danger:  'text-danger  bg-danger-soft',
  }[tone];
  return (
    <span className={cn('inline-flex items-center gap-1 h-6 px-2 rounded-full text-[11px] font-medium', toneClass)}>
      <Icon className="h-3 w-3" />
      <span className="tabular-nums">{label}</span>
    </span>
  );
}

function ImpactRow({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: 'success' | 'ai';
}) {
  const toneClass = tone === 'success' ? 'text-success' : 'text-ai';
  return (
    <div className="flex items-center gap-3">
      <div className={cn('grid h-9 w-9 place-items-center rounded-lg bg-white border border-ink-100', toneClass)}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[11.5px] font-medium uppercase tracking-wider text-ink-400">{label}</div>
      </div>
      <div className={cn('text-[1.1rem] font-semibold tabular-nums', toneClass)}>{value}</div>
    </div>
  );
}
