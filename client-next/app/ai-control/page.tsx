'use client';

import * as React from 'react';
import {
  Brain,
  Zap,
  CloudLightning,
  Radar,
  Route,
  Cpu,
  Check,
  Clock,
  Thermometer,
} from 'lucide-react';

import { SectionHeader } from '@/components/ui/SectionHeader';
import { StatTile }      from '@/components/ui/StatTile';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Badge }         from '@/components/ui/Badge';
import { Button }        from '@/components/ui/Button';
import { Spark }         from '@/components/ui/Spark';
import { ProgressBar }   from '@/components/ui/ProgressBar';
import { OptimizationStatusBadge } from '@/components/domain/StatusBadge';

import { AI_KPIS, AI_LATENCY_24H } from '@/lib/mock/kpis';
import { OPTIMIZATIONS } from '@/lib/mock/optimizations';
import { fmtRelative, cn } from '@/lib/utils';
import type { AgentTraceEntry } from '@/lib/types';

const AGENTS = [
  {
    key:   'weather',
    name:  'Weather agent',
    model: 'NOAA + ECMWF ensemble',
    icon:  CloudLightning,
    tone:  'ai',
    status: 'online',
    utilisation: 0.82,
  },
  {
    key:   'risk',
    name:  'Risk agent',
    model: 'Meridian Risk v4.2',
    icon:  Radar,
    tone:  'warning',
    status: 'online',
    utilisation: 0.64,
  },
  {
    key:   'route',
    name:  'Route agent',
    model: 'Gemini 2.0 Flash · maps',
    icon:  Route,
    tone:  'success',
    status: 'online',
    utilisation: 0.77,
  },
  {
    key:   'orchestrator',
    name:  'Orchestrator',
    model: 'Gemini 2.0 Pro',
    icon:  Cpu,
    tone:  'ai',
    status: 'online',
    utilisation: 0.91,
  },
] as const;

export default function AIControlPage() {
  const pending  = OPTIMIZATIONS.filter(o => o.status === 'PENDING');
  const executed = OPTIMIZATIONS.filter(o => o.status === 'EXECUTED' || o.status === 'AUTO_APPROVED');

  return (
    <>
      <SectionHeader
        eyebrow="AI · Control"
        title="Agent orchestration"
        subtitle="Supervise the Meridian multi-agent pipeline — weather, risk, route, and orchestrator agents running live."
        actions={
          <>
            <Button variant="secondary">Configure policies</Button>
            <Button icon={<Zap className="h-4 w-4" />}>Run pipeline</Button>
          </>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {AI_KPIS.map((kpi, i) => (
          <StatTile key={kpi.label} kpi={kpi} icon={<Brain className="h-5 w-5" />} accent={i === 0} />
        ))}
      </div>

      {/* Agents + latency */}
      <div className="mt-6 grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_380px] gap-4">
        <Card>
          <CardHeader
            eyebrow="Live agents"
            title="Agent swarm"
            subtitle="Four specialist agents + an orchestrator, running on Gemini."
            action={<Badge tone="ai" dot size="md">4 / 4 online</Badge>}
          />
          <CardBody className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {AGENTS.map(a => (
              <AgentCard key={a.key} agent={a} />
            ))}
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            eyebrow="Inference · 24h"
            title="Latency"
            subtitle="Median per-request latency, all agents."
          />
          <CardBody>
            <div className="text-[1.6rem] font-semibold text-ink-900 tabular-nums">1.52 s</div>
            <div className="text-xs text-success font-medium">-0.3s vs yesterday</div>
            <Spark data={AI_LATENCY_24H} variant="area" tone="brand" height={120} className="mt-3" />
          </CardBody>
        </Card>
      </div>

      {/* Queue + recent */}
      <div className="mt-6 grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Card>
          <CardHeader
            eyebrow="Awaiting sign-off"
            title={`Pending decisions · ${pending.length}`}
            action={<Badge tone="warning" dot>Needs operator</Badge>}
          />
          <CardBody className="space-y-3">
            {pending.map(o => (
              <DecisionCard key={o.id} o={o} />
            ))}
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            eyebrow="Completed"
            title={`Executed · ${executed.length}`}
          />
          <CardBody className="space-y-3">
            {executed.map(o => (
              <DecisionCard key={o.id} o={o} compact />
            ))}
          </CardBody>
        </Card>
      </div>
    </>
  );
}

function AgentCard({ agent }: { agent: typeof AGENTS[number] }) {
  const Icon = agent.icon;
  return (
    <div className="rounded-2xl border border-ink-100 bg-white p-4 transition-all duration-200 hover:shadow-card hover:-translate-y-[1px]">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-gradient-soft text-brand-600">
          <Icon className="h-4.5 w-4.5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[13.5px] font-semibold text-ink-900 truncate">{agent.name}</span>
            <Badge tone="success" size="sm" dot>Online</Badge>
          </div>
          <div className="text-[11.5px] text-ink-500 truncate">{agent.model}</div>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between text-[11.5px] text-ink-500">
        <span>Utilisation</span>
        <span className="tabular-nums font-medium text-ink-800">{Math.round(agent.utilisation * 100)}%</span>
      </div>
      <ProgressBar value={agent.utilisation} tone="brand" className="mt-1" />
    </div>
  );
}

function DecisionCard({ o, compact }: { o: typeof OPTIMIZATIONS[number]; compact?: boolean }) {
  return (
    <div className="rounded-xl border border-ink-100 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[12.5px] font-semibold text-ink-900">{o.id}</span>
            <OptimizationStatusBadge status={o.status} />
          </div>
          <div className="mt-1 text-[13px] font-medium text-ink-900">{o.selectedAlternate}</div>
          {!compact && (
            <p className="mt-1 text-xs text-ink-500 line-clamp-2">{o.reasoning}</p>
          )}
        </div>
        <div className="shrink-0 text-right">
          <div className="text-[11px] text-ink-400 uppercase tracking-wider">Confidence</div>
          <div className="text-[15px] font-semibold text-ai tabular-nums">{Math.round(o.confidence * 100)}%</div>
        </div>
      </div>

      {!compact && (
        <div className="mt-3 grid grid-cols-2 gap-1.5">
          {o.agents.map((a, i) => (
            <AgentTraceRow key={i} entry={a} />
          ))}
        </div>
      )}

      <div className="mt-3 flex items-center justify-between text-[11px] text-ink-400">
        <span>{fmtRelative(o.createdAt)}</span>
        {!compact && o.status === 'PENDING' && (
          <div className="flex items-center gap-1.5">
            <Button size="sm" variant="primary">Approve</Button>
            <Button size="sm" variant="secondary">Reject</Button>
          </div>
        )}
      </div>
    </div>
  );
}

function AgentTraceRow({ entry }: { entry: AgentTraceEntry }) {
  const Icon = entry.done ? Check : Clock;
  const iconTone = entry.done ? 'text-success' : 'text-warning';
  return (
    <div className="flex items-center gap-1.5 text-[11.5px] text-ink-600">
      <Icon className={cn('h-3 w-3 shrink-0', iconTone)} />
      <span className="font-medium text-ink-500 uppercase tracking-wider text-[9.5px]">{entry.agent}</span>
      <span className="truncate">{entry.message}</span>
    </div>
  );
}
