'use client';

import * as React from 'react';
import {
  Play,
  RotateCcw,
  Save,
  Wind,
  Ship,
  AlertOctagon,
  Truck,
  Snowflake,
  Zap,
  TrendingDown,
  TrendingUp,
  Clock,
  DollarSign,
  Sparkles,
  Target,
} from 'lucide-react';

import { SectionHeader }  from '@/components/ui/SectionHeader';
import { Card, CardHeader, CardBody, CardFooter } from '@/components/ui/Card';
import { Button }         from '@/components/ui/Button';
import { Badge }          from '@/components/ui/Badge';
import { Tabs }           from '@/components/ui/Tabs';
import { Spark }          from '@/components/ui/Spark';
import { ProgressBar }    from '@/components/ui/ProgressBar';
import { cn }             from '@/lib/utils';
import type { TimeseriesPoint } from '@/lib/types';

type Scenario = {
  id:   string;
  name: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: 'ai' | 'warning' | 'danger' | 'success';
};

const SCENARIOS: Scenario[] = [
  { id: 'typhoon',    name: 'Pacific typhoon',      desc: 'Category 4 storm crosses trans-Pacific lanes.',    icon: Wind,           tone: 'danger'  },
  { id: 'port',       name: 'Port closure · LAX',   desc: 'Labour action halts LA/Long Beach for 5 days.',    icon: Ship,           tone: 'warning' },
  { id: 'suez',       name: 'Suez incident',        desc: 'Transit blocked for 72h, rerouting activates.',    icon: AlertOctagon,   tone: 'danger'  },
  { id: 'cold-snap',  name: 'European cold snap',   desc: 'Rail freezes across DE/PL; road demand spikes.',   icon: Snowflake,      tone: 'ai'      },
  { id: 'demand',     name: 'Demand surge · APAC',  desc: 'Unexpected +22% spike across SEA lanes.',           icon: TrendingUp,     tone: 'ai'      },
  { id: 'fuel',       name: 'Fuel shock · +18%',    desc: 'Bunker fuel jumps 18%; margin compression.',        icon: Zap,            tone: 'warning' },
];

type ParamKey = 'disruption' | 'duration' | 'aiAggression' | 'reroutes';

const PARAMS: { key: ParamKey; label: string; min: number; max: number; unit: string; desc: string }[] = [
  { key: 'disruption',   label: 'Disruption intensity', min: 0,  max: 100, unit: '%',      desc: 'How strongly the shock degrades affected lanes.' },
  { key: 'duration',     label: 'Duration',             min: 1,  max: 30,  unit: 'days',   desc: 'How long the simulated shock persists.' },
  { key: 'aiAggression', label: 'AI reroute aggression',min: 0,  max: 100, unit: '%',      desc: 'How often the orchestrator auto-approves reroutes.' },
  { key: 'reroutes',     label: 'Max reroutes / hour',  min: 10, max: 500, unit: '/hr',    desc: 'Throughput cap on reroute approvals.' },
];

// Synthetic series for baseline vs simulated.
const BASELINE: TimeseriesPoint[] = buildSeries(24, 0.93, 0.975, 3, 0);
const WITH_AI:  TimeseriesPoint[] = buildSeries(24, 0.84, 0.965, 3, 0.7);
const NO_AI:    TimeseriesPoint[] = buildSeries(24, 0.62, 0.88,  3, 1.3);

export default function SimulationLabPage() {
  const [scenario,  setScenario]  = React.useState<string>('suez');
  const [params,    setParams]    = React.useState<Record<ParamKey, number>>({
    disruption:   72,
    duration:     5,
    aiAggression: 85,
    reroutes:     120,
  });
  const [mode, setMode] = React.useState<'with-ai' | 'no-ai'>('with-ai');
  const [running, setRunning] = React.useState(false);

  const active = SCENARIOS.find(s => s.id === scenario) ?? SCENARIOS[0];
  const ActiveIcon = active.icon;

  const onRun = () => {
    setRunning(true);
    setTimeout(() => setRunning(false), 1600);
  };

  return (
    <>
      <SectionHeader
        eyebrow="Lab · Simulations"
        title="Simulation lab"
        subtitle="Stress-test the Meridian network. Shock any lane, watch the AI respond, and measure the delta."
        actions={
          <>
            <Button variant="secondary" icon={<Save className="h-4 w-4" />}>Save scenario</Button>
            <Button variant="secondary" icon={<RotateCcw className="h-4 w-4" />}>Reset</Button>
            <Button loading={running} onClick={onRun} icon={<Play className="h-4 w-4" />}>Run simulation</Button>
          </>
        }
      />

      {/* Scenario picker */}
      <Card>
        <CardHeader
          eyebrow="Scenario"
          title="Pick a shock"
          subtitle="Every scenario ships with curated defaults — tune them below."
          action={<Badge tone="ai" dot size="md">6 presets</Badge>}
        />
        <CardBody className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {SCENARIOS.map(s => {
            const Icon = s.icon;
            const selected = scenario === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setScenario(s.id)}
                className={cn(
                  'text-left rounded-2xl border p-4 transition-all duration-200',
                  'hover:-translate-y-[1px] hover:shadow-card',
                  selected
                    ? 'border-brand-300 bg-brand-gradient-soft/60 ring-1 ring-brand-200'
                    : 'border-ink-100 bg-white',
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={cn(
                    'grid h-10 w-10 shrink-0 place-items-center rounded-xl',
                    s.tone === 'danger'  ? 'bg-danger-soft  text-danger'
                    : s.tone === 'warning' ? 'bg-warning-soft text-warning-ink'
                    : s.tone === 'success' ? 'bg-success-soft text-success-ink'
                    : 'bg-ai-soft text-ai-ink',
                  )}>
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[13.5px] font-semibold text-ink-900">{s.name}</span>
                      {selected && <Badge tone="ai" size="sm" dot>Active</Badge>}
                    </div>
                    <p className="mt-1 text-[12.5px] text-ink-500 leading-snug">{s.desc}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </CardBody>
      </Card>

      {/* Parameters + Results */}
      <div className="mt-6 grid grid-cols-1 xl:grid-cols-[380px_minmax(0,1fr)] gap-4">
        {/* Parameters */}
        <Card>
          <CardHeader
            eyebrow="Parameters"
            title={active.name}
            subtitle="Fine-tune the shock — the AI adapts to whatever you throw at it."
            action={
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-brand-gradient-soft text-brand-600">
                <ActiveIcon className="h-4 w-4" />
              </div>
            }
          />
          <CardBody className="space-y-5">
            {PARAMS.map(p => (
              <ParamSlider
                key={p.key}
                label={p.label}
                desc={p.desc}
                min={p.min}
                max={p.max}
                unit={p.unit}
                value={params[p.key]}
                onChange={v => setParams(s => ({ ...s, [p.key]: v }))}
              />
            ))}
          </CardBody>
          <CardFooter>
            <span className="text-[11px] text-ink-500">Seed 0x4A · deterministic</span>
            <Button size="sm" icon={<Sparkles className="h-3.5 w-3.5" />}>Ask AI to tune</Button>
          </CardFooter>
        </Card>

        {/* Results */}
        <div className="space-y-4">
          <Card>
            <CardHeader
              eyebrow="Projected · SLA"
              title="On-time performance under shock"
              subtitle="Hourly projection. Compare with-AI vs no-AI response."
              action={
                <Tabs value={mode} onChange={v => setMode(v as typeof mode)}>
                  <Tabs.Item value="with-ai">With AI</Tabs.Item>
                  <Tabs.Item value="no-ai">No AI</Tabs.Item>
                </Tabs>
              }
            />
            <CardBody>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <ResultStat label="Baseline"    value="96.4%" tone="neutral" />
                <ResultStat label="With AI"     value="91.2%" tone="ai"      sub="-5.2pp" />
                <ResultStat label="Without AI"  value="74.5%" tone="danger"  sub="-21.9pp" />
              </div>
              <div className="relative">
                {/* Layer baseline underneath, then the active variant */}
                <div className="absolute inset-0 opacity-40">
                  <Spark data={BASELINE} variant="line" tone="success" height={200} />
                </div>
                <Spark
                  data={mode === 'with-ai' ? WITH_AI : NO_AI}
                  variant="area"
                  tone={mode === 'with-ai' ? 'brand' : 'danger'}
                  height={200}
                />
              </div>
              <div className="mt-3 flex items-center gap-4 text-[11px] text-ink-500">
                <LegendDot className="bg-success"  label="Baseline" />
                <LegendDot className="bg-brand-500" label="With AI" />
                <LegendDot className="bg-danger"   label="Without AI" />
              </div>
            </CardBody>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card variant="gradient">
              <CardHeader
                eyebrow="Delta · AI impact"
                title="Value captured by Meridian"
                subtitle="What the AI saves, vs. letting the shock ride."
              />
              <CardBody className="space-y-4">
                <DeltaRow icon={<DollarSign className="h-4 w-4" />} label="Revenue protected"  value="+$18.6M"  tone="success" />
                <DeltaRow icon={<Clock      className="h-4 w-4" />} label="Delay reduced"      value="−2,240h" tone="success" />
                <DeltaRow icon={<Truck      className="h-4 w-4" />} label="Reroutes executed" value="184"     tone="ai"      />
                <DeltaRow icon={<TrendingDown className="h-4 w-4" />} label="Spoilage avoided" value="$6.2M"   tone="success" />
              </CardBody>
            </Card>

            <Card>
              <CardHeader
                eyebrow="Confidence"
                title="Monte-Carlo fan"
                subtitle="P10 · P50 · P90 outcomes across 5,000 trials."
                action={<Badge tone="ai" dot size="md">Converged</Badge>}
              />
              <CardBody className="space-y-3">
                <FanRow label="P90 (optimistic)" value="94.1%" pct={0.94} tone="success" />
                <FanRow label="P50 (median)"     value="91.2%" pct={0.91} tone="brand"   />
                <FanRow label="P10 (pessimistic)" value="87.3%" pct={0.87} tone="warning" />

                <div className="rounded-xl border border-ink-100 bg-ink-50/70 p-3 mt-3">
                  <div className="flex items-center gap-2 text-[11.5px] font-medium text-ink-700">
                    <Target className="h-3.5 w-3.5 text-ai" />
                    Ran 5,000 trials in 1.2s on the orchestrator.
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}

/* ------------------------------ Pieces ------------------------------ */

function ParamSlider({
  label,
  desc,
  min,
  max,
  unit,
  value,
  onChange,
}: {
  label: string;
  desc:  string;
  min: number;
  max: number;
  unit: string;
  value: number;
  onChange: (v: number) => void;
}) {
  const pct = (value - min) / (max - min);
  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="text-[12.5px] font-medium text-ink-800">{label}</span>
        <span className="text-[12.5px] font-semibold tabular-nums text-ink-900">{value}<span className="text-ink-400 font-normal"> {unit}</span></span>
      </div>
      <p className="mt-0.5 text-[11.5px] text-ink-500 leading-snug">{desc}</p>
      <div className="mt-2 relative">
        <div className="absolute inset-y-0 left-0 flex items-center w-full pointer-events-none">
          <div className="h-1.5 w-full rounded-full bg-ink-100 overflow-hidden">
            <div className="h-full rounded-full bg-brand-gradient transition-all" style={{ width: `${pct * 100}%` }} />
          </div>
        </div>
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="relative w-full h-5 appearance-none bg-transparent cursor-pointer
                     [&::-webkit-slider-thumb]:appearance-none
                     [&::-webkit-slider-thumb]:h-4
                     [&::-webkit-slider-thumb]:w-4
                     [&::-webkit-slider-thumb]:rounded-full
                     [&::-webkit-slider-thumb]:bg-white
                     [&::-webkit-slider-thumb]:border-2
                     [&::-webkit-slider-thumb]:border-brand-500
                     [&::-webkit-slider-thumb]:shadow-card
                     [&::-webkit-slider-thumb]:transition-transform
                     [&::-webkit-slider-thumb]:hover:scale-110
                     [&::-moz-range-thumb]:h-4
                     [&::-moz-range-thumb]:w-4
                     [&::-moz-range-thumb]:rounded-full
                     [&::-moz-range-thumb]:bg-white
                     [&::-moz-range-thumb]:border-2
                     [&::-moz-range-thumb]:border-brand-500"
        />
      </div>
    </div>
  );
}

function ResultStat({
  label,
  value,
  tone,
  sub,
}: {
  label: string;
  value: string;
  tone:  'neutral' | 'ai' | 'danger' | 'success';
  sub?:  string;
}) {
  const toneClass = {
    neutral: 'text-ink-900',
    ai:      'text-ai',
    danger:  'text-danger',
    success: 'text-success',
  }[tone];
  return (
    <div className="rounded-xl border border-ink-100 bg-white px-4 py-3">
      <div className="text-[10.5px] font-medium uppercase tracking-wider text-ink-400">{label}</div>
      <div className={cn('mt-1 text-[1.3rem] font-semibold tabular-nums', toneClass)}>{value}</div>
      {sub && <div className={cn('text-[11px] font-medium tabular-nums', toneClass)}>{sub}</div>}
    </div>
  );
}

function DeltaRow({
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
      <div className="min-w-0 flex-1 text-[11.5px] font-medium uppercase tracking-wider text-ink-400">{label}</div>
      <div className={cn('text-[1.05rem] font-semibold tabular-nums', toneClass)}>{value}</div>
    </div>
  );
}

function FanRow({
  label,
  value,
  pct,
  tone,
}: {
  label: string;
  value: string;
  pct:   number;
  tone:  'success' | 'brand' | 'warning';
}) {
  return (
    <div>
      <div className="flex items-center justify-between text-[12px] text-ink-700">
        <span>{label}</span>
        <span className="tabular-nums font-semibold text-ink-900">{value}</span>
      </div>
      <ProgressBar value={pct} tone={tone} className="mt-1.5" />
    </div>
  );
}

function LegendDot({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn('h-2 w-2 rounded-full', className)} />
      {label}
    </span>
  );
}

/* ------------------------------ Synthetic series ------------------------------ */

function buildSeries(n: number, min: number, max: number, decimals: number, shockPhase: number): TimeseriesPoint[] {
  const now = Date.now();
  const step = 3_600_000;
  return Array.from({ length: n }, (_, i) => {
    const phase = i / n;
    const noise = Math.sin(phase * Math.PI * 2 + i * 0.35) * 0.3 + Math.cos(i * 0.22) * 0.15;
    // Apply a smooth dip centred roughly in the middle for shockPhase > 0
    const shock = shockPhase > 0
      ? -Math.exp(-Math.pow((phase - 0.5) * 5, 2)) * (max - min) * 0.4 * shockPhase
      : 0;
    const base = 0.55 + noise * 0.35;
    const raw  = min + (max - min) * Math.min(1, Math.max(0, base)) + shock;
    const v = +Math.min(max, Math.max(min * 0.9, raw)).toFixed(decimals);
    return { t: new Date(now - (n - i - 1) * step).toISOString(), v };
  });
}
