'use client';

import * as React from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Brain,
  CheckCircle2,
  ChevronRight,
  CloudLightning,
  Compass,
  Eye,
  FlaskConical,
  Maximize2,
  Plane,
  Repeat,
  Route as RouteIcon,
  Ship,
  Sparkles,
  Truck,
  Train,
  TrendingUp,
  Zap,
} from 'lucide-react';

import { SectionHeader } from '@/components/ui/SectionHeader';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button }        from '@/components/ui/Button';
import { Badge }         from '@/components/ui/Badge';
import { ProgressBar }   from '@/components/ui/ProgressBar';
import { Spark }         from '@/components/ui/Spark';
import { WorldMap }      from '@/components/domain/WorldMap';
import { SeverityBadge } from '@/components/domain/StatusBadge';

import { SHIPMENTS }            from '@/lib/mock/shipments';
import { ALERTS }               from '@/lib/mock/alerts';
import { ON_TIME_30D, SHIPMENT_FLOW_30D } from '@/lib/mock/kpis';
import type { TimeseriesPoint, TransportMode } from '@/lib/types';
import { cn } from '@/lib/utils';

/* ------------------------------------------------------------------ */
/*  Mock data specific to the hero Live-AI-decisions card.            */
/* ------------------------------------------------------------------ */

type DecisionStatus = 'PENDING' | 'EXECUTED' | 'ASSESSING';
type SignalKind     = 'satellite' | 'traffic' | 'weather' | 'geopolitical';

type Decision = {
  id:           string;
  shipmentId:   string;
  contextLabel: string;
  vehicle:      TransportMode;
  signal:       SignalKind;
  resolution:   string;
  status:       DecisionStatus;
  confidence:   number;
  savings?:     string;
  analysis:     string;
};

const DECISIONS: Decision[] = [
  {
    id:           'OPT-MS39004',
    shipmentId:   'MS-39004',
    contextLabel: 'Delayed · Ocean',
    vehicle:      'OCEAN',
    signal:       'satellite',
    resolution:   'Reroute proposal · Port → Air',
    status:       'PENDING',
    confidence:   0.98,
    savings:      'Estimated saving: $12,500',
    analysis:     'Port strike in Dubai identified. Reroute via Emirates SkyCargo proposed.',
  },
  {
    id:           'OPT-MS39002',
    shipmentId:   'MS-39002',
    contextLabel: 'On Track · Road',
    vehicle:      'ROAD',
    signal:       'traffic',
    resolution:   'Route optimised · +14% speed',
    status:       'EXECUTED',
    confidence:   0.94,
    analysis:     'Corridor traffic agent found a faster alternate — fuel efficiency maintained.',
  },
  {
    id:           'OPT-MS39006',
    shipmentId:   'MS-39006',
    contextLabel: 'Weather Risk · Ocean',
    vehicle:      'OCEAN',
    signal:       'weather',
    resolution:   'Assessing detour',
    status:       'ASSESSING',
    confidence:   0.78,
    analysis:     'Monitoring shipment MS-39006. Analysing potential hurricane impact. Delay ~48h likely.',
  },
];

type ActiveShipmentRow = {
  id:           string;
  destination:  string;
  statusLabel:  string;
  statusTone:   'success' | 'warning' | 'danger' | 'ai' | 'neutral';
  mode:         TransportMode;
  eta:          string;
  risk:         'On Track' | 'Low Risk' | 'High Risk' | 'Safe';
  decision:     string;
  decisionTone: 'success' | 'warning' | 'danger' | 'ai';
  progress:     number;
  progressTone: 'brand' | 'success' | 'warning' | 'danger';
  action:       'view' | 'approve';
};

const ROWS: ActiveShipmentRow[] = [
  {
    id: '#MS-39004', destination: 'HKG → SIN', statusLabel: 'In Transit · Truck', statusTone: 'ai',
    mode: 'ROAD', eta: 'Sep 22', risk: 'On Track',
    decision: 'AI · Decision', decisionTone: 'warning',
    progress: 0.75, progressTone: 'brand', action: 'view',
  },
  {
    id: '#MS-39002', destination: 'LAX → NYC', statusLabel: 'At Port · Rail', statusTone: 'warning',
    mode: 'RAIL', eta: 'Sep 25', risk: 'Low Risk',
    decision: 'Confirmed', decisionTone: 'success',
    progress: 0.40, progressTone: 'warning', action: 'view',
  },
  {
    id: '#MS-39004', destination: 'DXB → LHR', statusLabel: 'Delayed · Ocean', statusTone: 'danger',
    mode: 'OCEAN', eta: 'Sep 28', risk: 'High Risk',
    decision: 'Proposed reroute', decisionTone: 'danger',
    progress: 0.20, progressTone: 'danger', action: 'approve',
  },
  {
    id: '#MS-39002', destination: 'PVG → SYD', statusLabel: 'On Transit · Truck', statusTone: 'success',
    mode: 'ROAD', eta: 'Sep 22', risk: 'On Track',
    decision: 'Confirmed', decisionTone: 'success',
    progress: 0.75, progressTone: 'success', action: 'view',
  },
  {
    id: '#MS-39006', destination: 'HAM → JFK', statusLabel: 'Redirected · Air', statusTone: 'ai',
    mode: 'AIR', eta: 'Sep 21', risk: 'Safe',
    decision: 'Safe',  decisionTone: 'success',
    progress: 0.60, progressTone: 'brand', action: 'view',
  },
];

/* ================================================================== */
/*                              PAGE                                  */
/* ================================================================== */

export default function OverviewPage() {
  const [selected, setSelected] = React.useState<string | null>(SHIPMENTS[0]?.id ?? null);

  return (
    <>
      {/* Inject keyframes once for the whole page */}
      <PageKeyframes />

      <SectionHeader
        eyebrow="Operations · Live"
        title="Global operations overview"
        subtitle="AI decisions dominate the deck — operators stay in the loop on every reroute."
        actions={
          <>
            <Button variant="secondary" size="md">Export report</Button>
            <Button icon={<Activity className="h-4 w-4" />}>Simulate disruption</Button>
          </>
        }
      />

      {/* ─────────── 1. KPI STRIP ─────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiStripCard
          label="On-time %"
          value="96.4%"
          delta="+1.2%"
          deltaTone="success"
          icon={<CheckCircle2 className="h-5 w-5" />}
          spark={ON_TIME_30D}
          sparkTone="success"
        />
        <KpiStripCard
          label="At risk"
          value="14"
          badge={<Badge tone="danger" dot size="md">High</Badge>}
          delta="+3"
          deltaTone="danger"
          icon={<AlertTriangle className="h-5 w-5" />}
          spark={SHIPMENT_FLOW_30D}
          sparkTone="warning"
        />
        <KpiStripCard
          label="Rerouted"
          value="210"
          badge={<Badge tone="ai" dot size="md">AI action</Badge>}
          delta="+18"
          deltaTone="ai"
          icon={<Repeat className="h-5 w-5" />}
          spark={SHIPMENT_FLOW_30D}
          sparkTone="brand"
        />
      </div>

      {/* ─────────── 2. PREDICTIVE ALERT  +  4. GLOBAL ROUTE MONITOR ─────────── */}
      <div className="mt-6 grid grid-cols-1 xl:grid-cols-[minmax(0,380px)_minmax(0,1fr)] gap-4">
        <PredictiveAlertCard />

        <Card className="overflow-hidden">
          <CardHeader
            eyebrow="Live map · network"
            title="Global route monitor"
            subtitle="2 hazards detected · 3 reroutes in progress"
            action={
              <div className="flex items-center gap-2">
                <Badge tone="warning" dot size="md">2 hazards</Badge>
                <Badge tone="ai"      dot size="md">3 reroutes</Badge>
                <Button variant="secondary" size="sm" icon={<Maximize2 className="h-3.5 w-3.5" />}>
                  Expand to map
                </Button>
              </div>
            }
          />
          <div className="px-5 pb-5">
            <WorldMap
              shipments={SHIPMENTS}
              selectedId={selected}
              onSelect={setSelected}
              height={300}
            />
          </div>
        </Card>
      </div>

      {/* ─────────── 3. LIVE AI DECISIONS — HERO ─────────── */}
      <div className="mt-6">
        <LiveAiDecisionsCard decisions={DECISIONS} />
      </div>

      {/* ─────────── 5. ACTIVE SHIPMENTS TABLE ─────────── */}
      <div className="mt-6">
        <ActiveShipmentsTable rows={ROWS} />
      </div>
    </>
  );
}

/* ================================================================== */
/*  KPI STRIP CARD                                                     */
/* ================================================================== */

function KpiStripCard({
  label,
  value,
  delta,
  deltaTone,
  icon,
  badge,
  spark,
  sparkTone,
}: {
  label: string;
  value: string;
  delta: string;
  deltaTone: 'success' | 'warning' | 'danger' | 'ai';
  icon: React.ReactNode;
  badge?: React.ReactNode;
  spark?: TimeseriesPoint[];
  sparkTone?: 'brand' | 'success' | 'warning' | 'danger';
}) {
  const deltaClass = {
    success: 'text-success',
    warning: 'text-warning',
    danger:  'text-danger',
    ai:      'text-ai',
  }[deltaTone];

  return (
    <Card hover className="relative overflow-hidden">
      <div className="flex items-start gap-4 px-5 py-5">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-gradient-soft text-brand-600">
          {icon}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium uppercase tracking-wider text-ink-400">{label}</span>
            {badge}
          </div>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="text-[1.85rem] font-semibold text-ink-900 tabular-nums leading-none">{value}</span>
            <span className={cn('inline-flex items-center gap-0.5 text-xs font-medium tabular-nums', deltaClass)}>
              <TrendingUp className="h-3.5 w-3.5" />
              {delta}
            </span>
          </div>
        </div>

        {spark && (
          <div className="w-[90px] shrink-0 self-end">
            <Spark data={spark} variant="line" tone={sparkTone ?? 'brand'} height={36} />
          </div>
        )}
      </div>
    </Card>
  );
}

/* ================================================================== */
/*  PREDICTIVE ALERT CARD                                              */
/* ================================================================== */

function PredictiveAlertCard() {
  const topAlerts = ALERTS.filter(a => a.active).slice(0, 2);

  return (
    <Card variant="gradient" className="relative overflow-hidden">
      <CardHeader
        eyebrow={
          <span className="inline-flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-ai" />
            Predictive Alert
          </span>
        }
        title="High-risk prediction"
        subtitle="3 shipments enter hazard zones in the next 48h."
        action={<Badge tone="danger" size="md" dot>New</Badge>}
      />
      <CardBody className="space-y-3">
        <div className="rounded-xl border border-rose-200 bg-danger-soft/60 p-3">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[12.5px] font-semibold text-danger-ink">#MS-39004</span>
            <Badge tone="danger" size="sm" dot>Imminent</Badge>
          </div>
          <p className="mt-1 text-[13px] text-ink-700 leading-snug">
            Shipment <span className="font-semibold">MS-39004</span> entering hazard zone in{' '}
            <span className="font-semibold text-danger">2h</span> — storm Eloise (Cat 3).
          </p>
        </div>

        {topAlerts.map(a => (
          <div key={a.id} className="flex items-start gap-3">
            <span className={cn(
              'mt-1 h-2 w-2 shrink-0 rounded-full',
              a.severity === 'Critical' ? 'bg-danger' : a.severity === 'High' ? 'bg-warning' : 'bg-ai',
            )} />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[12px] font-semibold text-ink-900">{a.id}</span>
                <SeverityBadge severity={a.severity} />
              </div>
              <div className="mt-0.5 text-[12.5px] text-ink-600 truncate">{a.title}</div>
            </div>
          </div>
        ))}

        <div className="pt-1 flex items-center gap-2">
          <Button size="sm" variant="primary" icon={<Eye className="h-3.5 w-3.5" />}>View impact</Button>
          <Button size="sm" variant="secondary" icon={<FlaskConical className="h-3.5 w-3.5" />}>Simulate</Button>
        </div>
      </CardBody>
    </Card>
  );
}

/* ================================================================== */
/*  LIVE AI DECISIONS — HERO                                           */
/* ================================================================== */

function LiveAiDecisionsCard({ decisions }: { decisions: Decision[] }) {
  return (
    <div className="relative">
      {/* Outer animated aura */}
      <div
        aria-hidden
        className="absolute -inset-[2px] rounded-[26px] opacity-70 blur-md animate-meridian-pulse
                   bg-[conic-gradient(from_120deg,rgba(124,58,237,0.55),rgba(59,130,246,0.45),rgba(236,72,153,0.45),rgba(124,58,237,0.55))]"
      />
      <Card
        className={cn(
          'relative overflow-hidden border-transparent shadow-lift',
          'bg-gradient-to-br from-white via-white to-brand-50/60',
        )}
      >
        {/* Top accent bar */}
        <div className="absolute inset-x-0 top-0 h-[3px] bg-[linear-gradient(90deg,#7C3AED,#3B82F6,#EC4899)]" />

        <CardHeader
          eyebrow={
            <span className="inline-flex items-center gap-1.5">
              <Brain className="h-3.5 w-3.5 text-ai" />
              Live AI decisions
            </span>
          }
          title="Agent swarm is reasoning"
          subtitle="Weather · Risk · Route · Orchestrator agents — streaming live"
          action={
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full bg-ai-soft text-ai-ink text-[11px] font-medium">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-ai opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-ai" />
                </span>
                Streaming
              </span>
              <Button variant="ai" size="sm" iconRight={<ChevronRight className="h-3.5 w-3.5" />}>
                Open AI control
              </Button>
            </div>
          }
        />

        <CardBody className="space-y-3">
          {decisions.map(d => (
            <DecisionRow key={d.id} decision={d} />
          ))}
        </CardBody>
      </Card>
    </div>
  );
}

function DecisionRow({ decision }: { decision: Decision }) {
  const statusCfg: Record<DecisionStatus, { label: string; tone: 'warning' | 'success' | 'ai' }> = {
    PENDING:   { label: 'Decision pending',     tone: 'warning' },
    EXECUTED:  { label: 'Optimised & executed', tone: 'success' },
    ASSESSING: { label: 'AI assessing',         tone: 'ai'      },
  };
  const s = statusCfg[decision.status];

  return (
    <div
      className={cn(
        'relative rounded-2xl border bg-white/80 p-4',
        'transition-all duration-200 hover:-translate-y-[1px] hover:shadow-card',
        decision.status === 'PENDING'
          ? 'border-amber-200 ring-1 ring-amber-200/50'
          : decision.status === 'ASSESSING'
          ? 'border-brand-200 ring-1 ring-brand-200/40'
          : 'border-ink-100',
      )}
    >
      {/* Pending shimmer */}
      {decision.status === 'PENDING' && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-2xl bg-[linear-gradient(110deg,transparent_45%,rgba(234,179,8,0.10)_50%,transparent_55%)] bg-[length:200%_100%] animate-meridian-shimmer"
        />
      )}

      <div className="relative flex flex-wrap items-start justify-between gap-4">
        {/* Left — meta + flow + analysis */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[12.5px] font-semibold text-ink-900">
              Decision · <span className="text-ai">{decision.shipmentId}</span>
            </span>
            <Badge tone="neutral" size="sm">{decision.contextLabel}</Badge>
          </div>

          {/* Flow chips: vehicle → signal → AI → resolution */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <FlowNode icon={<VehicleIcon mode={decision.vehicle} />} label={vehicleLabel(decision.vehicle)} />
            <FlowArrow />
            <FlowNode icon={<SignalIcon kind={decision.signal} />}  label={signalLabel(decision.signal)} tone="warning" />
            <FlowArrow />
            <FlowNode icon={<Brain className="h-3.5 w-3.5" />}      label="Meridian AI" tone="ai" accent />
            <FlowArrow />
            <FlowNode icon={<RouteIcon className="h-3.5 w-3.5" />}  label={decision.resolution} tone="success" />
          </div>

          <p className="mt-3 text-[12.5px] text-ink-600 leading-snug">
            <span className="font-medium text-ink-800">Analysis:</span> {decision.analysis}{' '}
            {decision.savings && <span className="text-success font-medium">{decision.savings}</span>}
          </p>
        </div>

        {/* Right — status + confidence + actions */}
        <div className="shrink-0 w-[230px] flex flex-col items-end gap-2">
          <Badge tone={s.tone} dot size="md">{s.label}</Badge>

          <div className="w-full">
            <div className="flex items-center justify-between text-[11px]">
              <span className="uppercase tracking-wider text-ink-400">Confidence</span>
              <span className={cn(
                'tabular-nums font-semibold',
                decision.confidence >= 0.9 ? 'text-success'
                  : decision.confidence >= 0.8 ? 'text-ai'
                  : 'text-warning',
              )}>
                {Math.round(decision.confidence * 100)}%
              </span>
            </div>
            <ProgressBar
              value={decision.confidence}
              tone={decision.confidence >= 0.9 ? 'success' : decision.confidence >= 0.8 ? 'brand' : 'warning'}
              className="mt-1"
            />
          </div>

          <div className="mt-1 flex items-center gap-1.5 flex-wrap justify-end">
            {decision.status === 'PENDING' && (
              <>
                <Button size="sm" variant="primary" icon={<Zap className="h-3.5 w-3.5" />}>Approve</Button>
                <Button size="sm" variant="secondary">Reject</Button>
              </>
            )}
            {decision.status === 'EXECUTED' && (
              <Button size="sm" variant="secondary">View details</Button>
            )}
            {decision.status === 'ASSESSING' && (
              <>
                <TypingDots />
                <Button size="sm" variant="secondary">View options</Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1 h-7 px-2 rounded-full bg-ai-soft text-ai-ink text-[11px] font-medium">
      <Dot delay="0ms"   />
      <Dot delay="160ms" />
      <Dot delay="320ms" />
      <span className="ml-0.5">reasoning</span>
    </span>
  );
}

function Dot({ delay }: { delay: string }) {
  return (
    <span
      className="inline-block h-1.5 w-1.5 rounded-full bg-ai animate-meridian-bounce"
      style={{ animationDelay: delay }}
    />
  );
}

/* ================================================================== */
/*  FLOW PRIMITIVES                                                    */
/* ================================================================== */

function FlowNode({
  icon,
  label,
  tone,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  tone?: 'warning' | 'success' | 'ai' | 'neutral';
  accent?: boolean;
}) {
  const toneClass =
    tone === 'warning' ? 'border-amber-200 text-warning-ink bg-warning-soft'
    : tone === 'success' ? 'border-emerald-200 text-success-ink bg-success-soft'
    : tone === 'ai'      ? 'border-brand-200 text-ai-ink bg-ai-soft'
    : 'border-ink-100 text-ink-700 bg-white';
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 h-7 px-2.5 rounded-lg border text-[11.5px] font-medium',
        toneClass,
        accent && 'shadow-[0_0_0_3px_rgba(124,58,237,0.10)]',
      )}
    >
      {icon}
      {label}
    </span>
  );
}

function FlowArrow() {
  return <ArrowRight className="h-3.5 w-3.5 text-ink-300 shrink-0" />;
}

function VehicleIcon({ mode }: { mode: TransportMode }) {
  const Icon = { OCEAN: Ship, AIR: Plane, ROAD: Truck, RAIL: Train }[mode];
  return <Icon className="h-3.5 w-3.5" />;
}
function vehicleLabel(mode: TransportMode) {
  return { OCEAN: 'Ocean vessel', AIR: 'Air freight', ROAD: 'Truck', RAIL: 'Rail' }[mode];
}

function SignalIcon({ kind }: { kind: SignalKind }) {
  const Icon = {
    satellite:    Compass,
    traffic:      Activity,
    weather:      CloudLightning,
    geopolitical: AlertTriangle,
  }[kind];
  return <Icon className="h-3.5 w-3.5" />;
}
function signalLabel(kind: SignalKind) {
  return {
    satellite:    'Satellite data',
    traffic:      'Traffic data',
    weather:      'Meteo data',
    geopolitical: 'Geo data',
  }[kind];
}

/* ================================================================== */
/*  ACTIVE SHIPMENTS TABLE                                             */
/* ================================================================== */

function ActiveShipmentsTable({ rows }: { rows: ActiveShipmentRow[] }) {
  return (
    <Card>
      <CardHeader
        eyebrow="Fleet · live"
        title="Active shipments"
        subtitle="Hover a row to surface actions. AI decisions stay in-line."
        action={
          <div className="flex items-center gap-2">
            <Badge tone="ai" dot size="md">{rows.length} live</Badge>
            <Button variant="secondary" size="sm" iconRight={<ChevronRight className="h-3.5 w-3.5" />}>
              Open shipments
            </Button>
          </div>
        }
      />

      <div className="overflow-x-auto scroll-subtle">
        <table className="w-full text-sm border-separate border-spacing-0">
          <thead className="bg-ink-50/70 text-[11px] font-medium uppercase tracking-wider text-ink-500">
            <tr>
              <Th>Shipment ID</Th>
              <Th>Destination</Th>
              <Th>Status</Th>
              <Th>ETA</Th>
              <Th>Risk level</Th>
              <Th>AI decision</Th>
              <Th>Progress</Th>
              <Th className="text-right pr-5">Action</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {rows.map((r, i) => (
              <tr
                key={i}
                className="group transition-colors duration-200 hover:bg-brand-gradient-soft/30"
              >
                <Td>
                  <span className="font-mono text-[13px] font-semibold text-ink-900">{r.id}</span>
                </Td>
                <Td>
                  <span className="text-[13px] font-medium text-ink-800">{r.destination}</span>
                </Td>
                <Td>
                  <span className="inline-flex items-center gap-1.5">
                    <VehicleIcon mode={r.mode} />
                    <Badge tone={r.statusTone} size="sm" dot>{r.statusLabel}</Badge>
                  </span>
                </Td>
                <Td>
                  <span className="text-[12.5px] text-ink-700 tabular-nums">{r.eta}</span>
                </Td>
                <Td>
                  <RiskChip risk={r.risk} />
                </Td>
                <Td>
                  <DecisionFlowCell tone={r.decisionTone} label={r.decision} />
                </Td>
                <Td>
                  <div className="w-[150px]">
                    <ProgressBar value={r.progress} tone={r.progressTone} />
                    <div className="mt-1 text-[11px] text-ink-400 tabular-nums">
                      {Math.round(r.progress * 100)}%
                    </div>
                  </div>
                </Td>
                <Td className="text-right pr-5">
                  {r.action === 'approve' ? (
                    <span className="inline-flex items-center gap-1.5">
                      <Button size="sm" variant="primary">Approve</Button>
                      <Button size="sm" variant="secondary">Reject</Button>
                    </span>
                  ) : (
                    <Button size="sm" variant="secondary">View details</Button>
                  )}
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return <th className={cn('px-5 py-3 font-medium text-left whitespace-nowrap', className)}>{children}</th>;
}
function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <td className={cn('px-5 py-3.5 text-ink-700 whitespace-nowrap align-middle', className)}>
      {children}
    </td>
  );
}

function RiskChip({ risk }: { risk: ActiveShipmentRow['risk'] }) {
  const cfg = {
    'On Track':  { tone: 'success' as const, icon: <CheckCircle2 className="h-3 w-3 text-success" /> },
    'Low Risk':  { tone: 'warning' as const, icon: <AlertTriangle className="h-3 w-3 text-warning" /> },
    'High Risk': { tone: 'danger'  as const, icon: <AlertTriangle className="h-3 w-3 text-danger" /> },
    'Safe':      { tone: 'success' as const, icon: <CheckCircle2 className="h-3 w-3 text-success" /> },
  }[risk];
  return (
    <span className="inline-flex items-center gap-1.5">
      {cfg.icon}
      <Badge tone={cfg.tone} size="sm">{risk}</Badge>
    </span>
  );
}

function DecisionFlowCell({
  tone,
  label,
}: {
  tone: 'success' | 'warning' | 'danger' | 'ai';
  label: string;
}) {
  const dotClass = {
    success: 'bg-success',
    warning: 'bg-warning',
    danger:  'bg-danger',
    ai:      'bg-ai',
  }[tone];
  const textClass = {
    success: 'text-success-ink',
    warning: 'text-warning-ink',
    danger:  'text-danger-ink',
    ai:      'text-ai-ink',
  }[tone];

  return (
    <span className="inline-flex items-center gap-2">
      <span className={cn('h-1.5 w-1.5 rounded-full', dotClass)} />
      <Brain className="h-3.5 w-3.5 text-ai" />
      <ArrowRight className="h-3 w-3 text-ink-300" />
      <span className={cn('text-[12px] font-medium', textClass)}>{label}</span>
    </span>
  );
}

/* ================================================================== */
/*  GLOBAL KEYFRAMES (scoped to this page)                             */
/* ================================================================== */

function PageKeyframes() {
  return (
    <style jsx global>{`
      @keyframes meridian-pulse {
        0%, 100% { opacity: 0.55; filter: blur(10px); }
        50%      { opacity: 0.95; filter: blur(16px); }
      }
      @keyframes meridian-shimmer {
        0%   { background-position: 100% 0; }
        100% { background-position: -100% 0; }
      }
      @keyframes meridian-bounce {
        0%, 60%, 100% { transform: translateY(0);    opacity: 0.4; }
        30%           { transform: translateY(-3px); opacity: 1;   }
      }
      .animate-meridian-pulse   { animation: meridian-pulse   6s ease-in-out infinite; }
      .animate-meridian-shimmer { animation: meridian-shimmer 2.4s linear infinite;     }
      .animate-meridian-bounce  { animation: meridian-bounce  1.1s ease-in-out infinite; }
    `}</style>
  );
}
