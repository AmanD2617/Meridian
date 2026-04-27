'use client';

import * as React from 'react';
import { Layers, Filter, Maximize2, Compass } from 'lucide-react';

import { SectionHeader }  from '@/components/ui/SectionHeader';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button }         from '@/components/ui/Button';
import { Badge }          from '@/components/ui/Badge';
import { Tabs }           from '@/components/ui/Tabs';
import { ProgressBar }    from '@/components/ui/ProgressBar';
import { WorldMap }       from '@/components/domain/WorldMap';
import {
  ShipmentStatusBadge,
  ModeBadge,
} from '@/components/domain/StatusBadge';

import { SHIPMENTS } from '@/lib/mock/shipments';
import { ALERTS }    from '@/lib/mock/alerts';
import type { TransportMode, ShipmentStatus } from '@/lib/types';
import { cn } from '@/lib/utils';

const MODE_FILTERS: { label: string; value: TransportMode | 'all' }[] = [
  { label: 'All',   value: 'all'   },
  { label: 'Ocean', value: 'OCEAN' },
  { label: 'Air',   value: 'AIR'   },
  { label: 'Road',  value: 'ROAD'  },
  { label: 'Rail',  value: 'RAIL'  },
];

export default function MapPage() {
  const [mode,     setMode]     = React.useState<TransportMode | 'all'>('all');
  const [selected, setSelected] = React.useState<string | null>(SHIPMENTS[0]?.id ?? null);

  const visible = SHIPMENTS.filter(s => mode === 'all' || s.mode === mode);
  const selectedShipment = visible.find(s => s.id === selected) ?? null;

  const byStatus = groupByStatus(visible);

  return (
    <>
      <SectionHeader
        eyebrow="Live map"
        title="Global shipment network"
        subtitle="Every active shipment, hazard overlay, and AI-proposed reroute on one canvas."
        actions={
          <>
            <Button variant="secondary" size="md" icon={<Filter className="h-4 w-4" />}>Filters</Button>
            <Button variant="secondary" size="md" icon={<Layers className="h-4 w-4" />}>Layers</Button>
            <Button icon={<Maximize2 className="h-4 w-4" />}>Fullscreen</Button>
          </>
        }
      />

      {/* Status strip */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
        <StatusChip label="Total"      value={visible.length} tone="neutral" />
        <StatusChip label="Transit"    value={byStatus.transit}   tone="ai" />
        <StatusChip label="At-risk"    value={byStatus.risk}      tone="warning" />
        <StatusChip label="Delayed"    value={byStatus.delayed}   tone="danger" />
        <StatusChip label="Rerouted"   value={byStatus.rerouted}  tone="success" />
      </div>

      <Card className="overflow-hidden">
        <CardHeader
          title="Live network"
          subtitle={`${visible.length} shipments · ${ALERTS.filter(a => a.active).length} active hazards`}
          action={
            <div className="flex items-center gap-2">
              <Tabs value={mode} onChange={v => setMode(v as typeof mode)}>
                {MODE_FILTERS.map(f => (
                  <Tabs.Item key={f.value} value={f.value}>{f.label}</Tabs.Item>
                ))}
              </Tabs>
              <Badge tone="ai" dot size="md">Streaming</Badge>
            </div>
          }
        />
        <CardBody>
          <WorldMap
            shipments={visible}
            selectedId={selected}
            onSelect={setSelected}
            height={520}
          />
        </CardBody>
      </Card>

      {/* Bottom: shipment inspector + hazard feed */}
      <div className="mt-6 grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-4">
        <Card>
          <CardHeader
            eyebrow="Shipment inspector"
            title={selectedShipment ? `${selectedShipment.id} · ${selectedShipment.cargo}` : 'Select a shipment'}
            subtitle={
              selectedShipment
                ? `${selectedShipment.from.code} → ${selectedShipment.to.code} · ${selectedShipment.carrier}`
                : 'Click a marker on the map to drill in.'
            }
            action={
              selectedShipment && (
                <div className="flex items-center gap-2">
                  <ShipmentStatusBadge status={selectedShipment.status} />
                  <ModeBadge mode={selectedShipment.mode} />
                </div>
              )
            }
          />
          <CardBody>
            {selectedShipment ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Stat label="Progress"    value={`${Math.round(selectedShipment.progress * 100)}%`} />
                <Stat label="ETA"         value={selectedShipment.etaLabel} />
                <Stat label="Weight"      value={`${selectedShipment.weightTonnes.toLocaleString()} t`} />
                <Stat label="Value"       value={`$${(selectedShipment.valueUsd / 1_000_000).toFixed(1)}M`} />
                <div className="col-span-full">
                  <div className="flex items-center justify-between text-xs text-ink-500 mb-1.5">
                    <span>Journey progress</span>
                    <span className="tabular-nums">{Math.round(selectedShipment.progress * 100)}%</span>
                  </div>
                  <ProgressBar value={selectedShipment.progress} tone={selectedShipment.status === 'risk' ? 'warning' : 'brand'} />
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-ink-400 py-6">
                <Compass className="h-4 w-4" />
                Nothing selected.
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            eyebrow="Live overlay"
            title="Active hazards"
            action={<Badge tone="warning" dot>{ALERTS.filter(a => a.active).length}</Badge>}
          />
          <CardBody className="space-y-3">
            {ALERTS.filter(a => a.active).map(a => (
              <div key={a.id} className="rounded-xl border border-ink-100 p-3 hover:border-ink-200 hover:shadow-card transition-all duration-200">
                <div className="flex items-center gap-2">
                  <span className={cn('h-2 w-2 rounded-full',
                    a.severity === 'Critical' ? 'bg-danger'
                      : a.severity === 'High' ? 'bg-warning'
                      : 'bg-ai',
                  )} />
                  <span className="font-mono text-[12px] font-semibold text-ink-900">{a.id}</span>
                  <Badge tone="neutral" size="sm">{a.source}</Badge>
                </div>
                <div className="mt-1 text-[13px] font-medium text-ink-900">{a.title}</div>
                <div className="text-xs text-ink-500 mt-0.5">{a.region}</div>
              </div>
            ))}
          </CardBody>
        </Card>
      </div>
    </>
  );
}

function StatusChip({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: 'neutral' | 'ai' | 'warning' | 'danger' | 'success';
}) {
  const toneClass = {
    neutral: 'bg-white border-ink-100 text-ink-700',
    ai:      'bg-ai-soft border-brand-200 text-ai-ink',
    warning: 'bg-warning-soft border-amber-200 text-warning-ink',
    danger:  'bg-danger-soft border-rose-200 text-danger-ink',
    success: 'bg-success-soft border-emerald-200 text-success-ink',
  }[tone];

  return (
    <div className={cn('rounded-xl border px-4 py-3 flex items-center justify-between', toneClass)}>
      <span className="text-[11.5px] font-medium uppercase tracking-wider">{label}</span>
      <span className="text-lg font-semibold tabular-nums">{value}</span>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] font-medium uppercase tracking-wider text-ink-400">{label}</div>
      <div className="mt-1 text-[0.95rem] font-semibold text-ink-900 tabular-nums">{value}</div>
    </div>
  );
}

function groupByStatus(shipments: { status: ShipmentStatus }[]) {
  return shipments.reduce(
    (acc, s) => {
      acc[s.status] += 1;
      return acc;
    },
    { transit: 0, risk: 0, delayed: 0, rerouted: 0, delivered: 0 },
  );
}
