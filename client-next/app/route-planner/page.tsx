'use client';

import * as React from 'react';
import {
  Route,
  Navigation,
  MapPin,
  ArrowRight,
  Wind,
  Clock,
  TrendingDown,
  Shield,
  Sparkles,
  Flag,
  Crosshair,
} from 'lucide-react';

import { SectionHeader } from '@/components/ui/SectionHeader';
import { Card, CardHeader, CardBody, CardFooter } from '@/components/ui/Card';
import { Button }        from '@/components/ui/Button';
import { Badge }         from '@/components/ui/Badge';
import { Tabs }          from '@/components/ui/Tabs';
import { Input }         from '@/components/ui/Input';
import { ProgressBar }   from '@/components/ui/ProgressBar';
import { ModeBadge }     from '@/components/domain/StatusBadge';

import type { TransportMode } from '@/lib/types';
import { cn } from '@/lib/utils';

type RouteOption = {
  id: string;
  name: string;
  summary: string;
  etaHours: number;
  etaDelta: number;      // vs baseline, in hours
  costUsd: number;
  costDelta: number;     // vs baseline, in USD
  fuelIndex: number;     // 0–1
  riskScore: number;     // 0–1, lower is better
  co2Tonnes: number;
  aiPick?: boolean;
  tone: 'baseline' | 'recommended' | 'alternate';
  legs: { from: string; to: string; mode: TransportMode; hours: number }[];
  notes: string[];
};

const ROUTES: RouteOption[] = [
  {
    id:       'R-A',
    name:     'Baseline · Suez transit',
    summary:  'Shanghai → Rotterdam · via Suez Canal',
    etaHours: 624,
    etaDelta: 0,
    costUsd:  488_000,
    costDelta: 0,
    fuelIndex: 0.72,
    riskScore: 0.48,
    co2Tonnes: 340,
    tone:     'baseline',
    legs: [
      { from: 'PVG', to: 'SGP', mode: 'OCEAN', hours: 96 },
      { from: 'SGP', to: 'SUZ', mode: 'OCEAN', hours: 312 },
      { from: 'SUZ', to: 'RTM', mode: 'OCEAN', hours: 216 },
    ],
    notes: [
      'Current primary lane.',
      'Moderate Red Sea advisory (geopolitical).',
      'Fuel costs tracking seasonal average.',
    ],
  },
  {
    id:       'R-B',
    name:     'AI · Cape of Good Hope',
    summary:  'Shanghai → Rotterdam · via Cape route',
    etaHours: 648,
    etaDelta: 24,
    costUsd:  512_000,
    costDelta: 24_000,
    fuelIndex: 0.88,
    riskScore: 0.21,
    co2Tonnes: 402,
    aiPick:   true,
    tone:     'recommended',
    legs: [
      { from: 'PVG', to: 'SGP', mode: 'OCEAN', hours: 96 },
      { from: 'SGP', to: 'CPT', mode: 'OCEAN', hours: 384 },
      { from: 'CPT', to: 'RTM', mode: 'OCEAN', hours: 168 },
    ],
    notes: [
      'Avoids Red Sea flashpoint — risk drops 56%.',
      'Adds ~1 day transit, but insurance savings offset cost.',
      'Meridian agents jointly selected this at 91% confidence.',
    ],
  },
  {
    id:       'R-C',
    name:     'Rail-sea hybrid',
    summary:  'Shanghai → Duisburg (rail) → Rotterdam',
    etaHours: 528,
    etaDelta: -96,
    costUsd:  574_000,
    costDelta: 86_000,
    fuelIndex: 0.58,
    riskScore: 0.34,
    co2Tonnes: 248,
    tone:     'alternate',
    legs: [
      { from: 'PVG', to: 'ALA', mode: 'RAIL',  hours: 168 },
      { from: 'ALA', to: 'DUI', mode: 'RAIL',  hours: 312 },
      { from: 'DUI', to: 'RTM', mode: 'ROAD',  hours: 48  },
    ],
    notes: [
      'Fastest option — 4 days saved vs baseline.',
      'Lowest CO₂ (27% under baseline).',
      'Capacity constrained on EU rail corridor.',
    ],
  },
  {
    id:       'R-D',
    name:     'Air freight emergency',
    summary:  'Shanghai → Frankfurt → Rotterdam',
    etaHours: 36,
    etaDelta: -588,
    costUsd:  1_980_000,
    costDelta: 1_492_000,
    fuelIndex: 0.95,
    riskScore: 0.18,
    co2Tonnes: 812,
    tone:     'alternate',
    legs: [
      { from: 'PVG', to: 'FRA', mode: 'AIR',  hours: 12 },
      { from: 'FRA', to: 'RTM', mode: 'ROAD', hours: 6  },
    ],
    notes: [
      'For time-critical cargo only.',
      '4× baseline cost — reserve for high-value or perishable.',
      'CO₂ penalty 2.4×.',
    ],
  },
];

const PRESET_LANES = [
  { id: 'pvg-rtm', label: 'PVG → RTM', desc: 'Shanghai → Rotterdam',      mode: 'OCEAN' as const },
  { id: 'fra-bom', label: 'FRA → BOM', desc: 'Frankfurt → Mumbai',        mode: 'AIR'   as const },
  { id: 'lax-ord', label: 'LAX → ORD', desc: 'Los Angeles → Chicago',     mode: 'ROAD'  as const },
  { id: 'xmn-ham', label: 'XMN → HAM', desc: 'Xiamen → Hamburg',          mode: 'RAIL'  as const },
];

const OBJECTIVES: { label: string; value: Objective }[] = [
  { label: 'Balanced',     value: 'balanced'  },
  { label: 'Fastest',      value: 'fastest'   },
  { label: 'Cheapest',     value: 'cheapest'  },
  { label: 'Lowest risk',  value: 'risk'      },
  { label: 'Greenest',     value: 'green'     },
];

type Objective = 'balanced' | 'fastest' | 'cheapest' | 'risk' | 'green';

export default function RoutePlannerPage() {
  const [lane,      setLane]      = React.useState('pvg-rtm');
  const [objective, setObjective] = React.useState<Objective>('balanced');
  const [selected,  setSelected]  = React.useState<string>('R-B');

  const active = ROUTES.find(r => r.id === selected) ?? ROUTES[0];

  return (
    <>
      <SectionHeader
        eyebrow="Planning · Routes"
        title="Route planner"
        subtitle="Draft, compare, and dispatch lanes. Meridian's route agent scores every alternate on cost, risk, and carbon."
        actions={
          <>
            <Button variant="secondary" icon={<Flag className="h-4 w-4" />}>Save preset</Button>
            <Button icon={<Sparkles className="h-4 w-4" />}>Generate alternates</Button>
          </>
        }
      />

      {/* Planner inputs */}
      <Card>
        <CardBody className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] gap-4 items-end pt-5">
          <div>
            <Label>Origin</Label>
            <Input
              icon={<MapPin className="h-4 w-4" />}
              defaultValue="PVG · Shanghai Pudong"
              placeholder="Origin port, airport, or hub"
            />
          </div>
          <div>
            <Label>Destination</Label>
            <Input
              icon={<Crosshair className="h-4 w-4" />}
              defaultValue="RTM · Port of Rotterdam"
              placeholder="Destination port, airport, or hub"
            />
          </div>
          <div className="flex items-end gap-2">
            <Button variant="secondary" icon={<Navigation className="h-4 w-4" />}>Swap</Button>
            <Button icon={<Route className="h-4 w-4" />}>Plan route</Button>
          </div>
        </CardBody>

        <div className="flex flex-wrap items-center justify-between gap-3 px-5 pb-5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-medium uppercase tracking-wider text-ink-400">Preset lane</span>
            {PRESET_LANES.map(p => (
              <button
                key={p.id}
                onClick={() => setLane(p.id)}
                className={cn(
                  'inline-flex items-center gap-1.5 h-7 px-2.5 rounded-lg text-[11.5px] font-medium',
                  'transition-colors duration-200',
                  lane === p.id
                    ? 'bg-brand-gradient-soft text-brand-700 border border-brand-200'
                    : 'bg-ink-50 text-ink-600 border border-ink-100 hover:bg-ink-100',
                )}
              >
                {p.label}
                <span className="text-ink-400 font-normal">· {p.desc}</span>
              </button>
            ))}
          </div>

          <Tabs value={objective} onChange={v => setObjective(v as Objective)}>
            {OBJECTIVES.map(o => (
              <Tabs.Item key={o.value} value={o.value}>{o.label}</Tabs.Item>
            ))}
          </Tabs>
        </div>
      </Card>

      {/* Route options */}
      <div className="mt-6 grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_380px] gap-4">
        <div className="space-y-3">
          {ROUTES.map(r => (
            <RouteCard
              key={r.id}
              route={r}
              selected={selected === r.id}
              onSelect={() => setSelected(r.id)}
            />
          ))}
        </div>

        {/* Inspector */}
        <Card variant={active.aiPick ? 'gradient' : 'default'} className="flex flex-col self-start">
          <CardHeader
            eyebrow={active.aiPick ? 'AI · Recommended' : 'Route detail'}
            title={active.name}
            subtitle={active.summary}
            action={
              active.aiPick ? (
                <Badge tone="ai" dot size="md">AI pick</Badge>
              ) : (
                <Badge tone="neutral" size="md">{active.id}</Badge>
              )
            }
          />
          <CardBody className="space-y-5">
            <div className="grid grid-cols-2 gap-3">
              <Metric label="ETA"        value={fmtEta(active.etaHours)} delta={fmtDeltaH(active.etaDelta)} tone={active.etaDelta <= 0 ? 'success' : 'warning'} />
              <Metric label="Cost"       value={`$${(active.costUsd / 1000).toFixed(0)}k`} delta={fmtDeltaUsd(active.costDelta)} tone={active.costDelta <= 0 ? 'success' : 'warning'} />
              <Metric label="Risk score" value={`${Math.round(active.riskScore * 100)}`} delta="of 100" tone={active.riskScore < 0.3 ? 'success' : active.riskScore < 0.5 ? 'warning' : 'danger'} />
              <Metric label="CO₂"        value={`${active.co2Tonnes} t`} delta="well-to-wheel" tone="neutral" />
            </div>

            <div>
              <div className="flex items-center justify-between text-[11px] font-medium uppercase tracking-wider text-ink-400">
                <span>Fuel intensity</span>
                <span className="tabular-nums text-ink-700">{Math.round(active.fuelIndex * 100)}%</span>
              </div>
              <ProgressBar value={active.fuelIndex} tone={active.fuelIndex > 0.85 ? 'warning' : 'brand'} className="mt-2" />
            </div>

            <div>
              <div className="text-[11px] font-medium uppercase tracking-wider text-ink-400 mb-2">Waypoints</div>
              <ol className="relative space-y-3 pl-4 before:absolute before:left-[5px] before:top-2 before:bottom-2 before:w-px before:bg-ink-200">
                {active.legs.map((leg, i) => (
                  <li key={i} className="relative text-[13px] text-ink-700">
                    <span className="absolute -left-4 top-1.5 h-2.5 w-2.5 rounded-full bg-brand-gradient ring-2 ring-white" />
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold text-ink-900">{leg.from}</span>
                      <ArrowRight className="h-3 w-3 text-ink-300" />
                      <span className="font-mono font-semibold text-ink-900">{leg.to}</span>
                      <ModeBadge mode={leg.mode} />
                    </div>
                    <div className="mt-0.5 text-[11.5px] text-ink-500">{fmtEta(leg.hours)} · leg {i + 1}</div>
                  </li>
                ))}
              </ol>
            </div>

            <div>
              <div className="text-[11px] font-medium uppercase tracking-wider text-ink-400 mb-2">Notes</div>
              <ul className="space-y-1.5">
                {active.notes.map((n, i) => (
                  <li key={i} className="flex items-start gap-2 text-[12.5px] text-ink-600 leading-snug">
                    <span className="mt-1.5 h-1 w-1 rounded-full bg-brand-500 shrink-0" />
                    {n}
                  </li>
                ))}
              </ul>
            </div>
          </CardBody>

          <CardFooter>
            <Button variant="secondary" size="sm">Compare another</Button>
            <Button size="sm" icon={<Route className="h-3.5 w-3.5" />}>Dispatch</Button>
          </CardFooter>
        </Card>
      </div>
    </>
  );
}

/* ------------------------------ Pieces ------------------------------ */

function RouteCard({ route, selected, onSelect }: { route: RouteOption; selected: boolean; onSelect: () => void }) {
  const accent =
    route.tone === 'recommended'
      ? 'border-brand-300 ring-1 ring-brand-200/60'
      : selected
      ? 'border-ink-300'
      : 'border-ink-100';

  return (
    <button
      onClick={onSelect}
      className={cn(
        'w-full text-left rounded-2xl bg-surface-card border shadow-card',
        'transition-all duration-200 hover:-translate-y-[1px] hover:shadow-lift',
        accent,
      )}
    >
      {route.aiPick && (
        <div className="flex items-center gap-2 px-5 pt-4">
          <Badge tone="ai" dot size="sm">AI recommended</Badge>
          <span className="text-[11px] text-ink-400">91% confidence · orchestrator</span>
        </div>
      )}

      <div className="px-5 pt-4 pb-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[12px] font-semibold text-ink-900">{route.id}</span>
              {route.tone === 'baseline' && <Badge tone="neutral" size="sm">Current lane</Badge>}
            </div>
            <h3 className="mt-1 text-[15px] font-semibold text-ink-900">{route.name}</h3>
            <p className="mt-0.5 text-sm text-ink-500">{route.summary}</p>
          </div>

          <div className="shrink-0 text-right">
            <div className="text-[11px] uppercase tracking-wider text-ink-400">ETA</div>
            <div className="text-[1.15rem] font-semibold text-ink-900 tabular-nums">{fmtEta(route.etaHours)}</div>
            <div className={cn('text-[11px] font-medium tabular-nums', route.etaDelta < 0 ? 'text-success' : route.etaDelta > 0 ? 'text-warning' : 'text-ink-400')}>
              {route.etaDelta === 0 ? 'baseline' : fmtDeltaH(route.etaDelta)}
            </div>
          </div>
        </div>

        {/* Leg strip */}
        <div className="mt-4 flex items-center gap-1.5 flex-wrap">
          {route.legs.map((leg, i) => (
            <React.Fragment key={i}>
              <span className="inline-flex items-center gap-1 h-6 px-2 rounded-md bg-ink-50 border border-ink-100 text-[11px] font-mono font-medium text-ink-700">
                {leg.from}
                <ArrowRight className="h-3 w-3 text-ink-300" />
                {leg.to}
                <span className="text-ink-400 font-normal ml-1">{leg.mode}</span>
              </span>
              {i < route.legs.length - 1 && <ArrowRight className="h-3 w-3 text-ink-300" />}
            </React.Fragment>
          ))}
        </div>

        {/* Metrics row */}
        <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3">
          <MiniStat icon={<Clock className="h-3.5 w-3.5" />}   label="Transit"   value={fmtEta(route.etaHours)} />
          <MiniStat icon={<TrendingDown className="h-3.5 w-3.5" />} label="Cost"  value={`$${(route.costUsd / 1000).toFixed(0)}k`} />
          <MiniStat icon={<Shield className="h-3.5 w-3.5" />}  label="Risk"      value={`${Math.round(route.riskScore * 100)}/100`} tone={route.riskScore < 0.3 ? 'success' : route.riskScore < 0.5 ? 'warning' : 'danger'} />
          <MiniStat icon={<Wind className="h-3.5 w-3.5" />}    label="CO₂"       value={`${route.co2Tonnes}t`} />
        </div>
      </div>
    </button>
  );
}

function MiniStat({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string; tone?: 'success' | 'warning' | 'danger' }) {
  const toneClass =
    tone === 'success' ? 'text-success'
    : tone === 'warning' ? 'text-warning'
    : tone === 'danger' ? 'text-danger'
    : 'text-ink-800';

  return (
    <div className="rounded-lg border border-ink-100 bg-white px-3 py-2">
      <div className="flex items-center gap-1.5 text-[10.5px] font-medium uppercase tracking-wider text-ink-400">
        {icon}
        {label}
      </div>
      <div className={cn('mt-1 text-[0.95rem] font-semibold tabular-nums', toneClass)}>{value}</div>
    </div>
  );
}

function Metric({
  label,
  value,
  delta,
  tone,
}: {
  label: string;
  value: string;
  delta: string;
  tone: 'success' | 'warning' | 'danger' | 'neutral';
}) {
  const toneClass = {
    success: 'text-success',
    warning: 'text-warning',
    danger:  'text-danger',
    neutral: 'text-ink-700',
  }[tone];
  return (
    <div className="rounded-xl border border-ink-100 bg-white/80 p-3">
      <div className="text-[10.5px] font-medium uppercase tracking-wider text-ink-400">{label}</div>
      <div className="mt-1 text-[1.1rem] font-semibold tabular-nums text-ink-900">{value}</div>
      <div className={cn('text-[11px] font-medium tabular-nums mt-0.5', toneClass)}>{delta}</div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-ink-400">
      {children}
    </div>
  );
}

/* ------------------------------ fmt ------------------------------ */

function fmtEta(h: number) {
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  const rem = h % 24;
  return rem ? `${d}d ${rem}h` : `${d}d`;
}
function fmtDeltaH(h: number) {
  if (h === 0) return '—';
  const sign = h > 0 ? '+' : '−';
  return `${sign}${Math.abs(h)}h`;
}
function fmtDeltaUsd(v: number) {
  if (v === 0) return '—';
  const sign = v > 0 ? '+' : '−';
  const abs = Math.abs(v);
  return `${sign}$${abs >= 1000 ? `${(abs / 1000).toFixed(0)}k` : abs}`;
}
