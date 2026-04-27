'use client';

import * as React from 'react';
import {
  Truck,
  Ship,
  Plane,
  Train,
  Wrench,
  Search,
  Filter,
  Download,
  MapPin,
  Activity,
} from 'lucide-react';

import { SectionHeader } from '@/components/ui/SectionHeader';
import { StatTile }      from '@/components/ui/StatTile';
import { Card }          from '@/components/ui/Card';
import { Button }        from '@/components/ui/Button';
import { Input }         from '@/components/ui/Input';
import { Tabs }          from '@/components/ui/Tabs';
import { Badge }         from '@/components/ui/Badge';
import { ProgressBar }   from '@/components/ui/ProgressBar';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/Table';
import { ModeBadge }     from '@/components/domain/StatusBadge';

import { FLEET }        from '@/lib/mock/fleet';
import { FLEET_KPIS }   from '@/lib/mock/kpis';
import type { TransportMode, Vehicle } from '@/lib/types';
import { fmt, fmtRelative } from '@/lib/utils';

const MODE_TABS: { label: string; value: TransportMode | 'all' }[] = [
  { label: 'All',   value: 'all'   },
  { label: 'Ocean', value: 'OCEAN' },
  { label: 'Air',   value: 'AIR'   },
  { label: 'Road',  value: 'ROAD'  },
  { label: 'Rail',  value: 'RAIL'  },
];

const MODE_ICON: Record<TransportMode, React.ComponentType<{ className?: string }>> = {
  OCEAN: Ship,
  AIR:   Plane,
  ROAD:  Truck,
  RAIL:  Train,
};

const KPI_ICONS = [
  <Truck    key="v" className="h-5 w-5" />,
  <Activity key="u" className="h-5 w-5" />,
  <Wrench   key="m" className="h-5 w-5" />,
  <MapPin   key="h" className="h-5 w-5" />,
];

export default function FleetPage() {
  const [mode,  setMode]  = React.useState<TransportMode | 'all'>('all');
  const [query, setQuery] = React.useState('');

  const filtered = FLEET.filter(v => {
    const matchMode = mode === 'all' || v.mode === mode;
    const q = query.trim().toLowerCase();
    const matchQuery = !q
      || v.id.toLowerCase().includes(q)
      || v.callsign.toLowerCase().includes(q)
      || v.carrier.toLowerCase().includes(q)
      || v.location.toLowerCase().includes(q);
    return matchMode && matchQuery;
  });

  const mix = FLEET.reduce<Record<TransportMode, number>>(
    (acc, v) => ({ ...acc, [v.mode]: (acc[v.mode] ?? 0) + 1 }),
    { OCEAN: 0, AIR: 0, ROAD: 0, RAIL: 0 },
  );

  return (
    <>
      <SectionHeader
        eyebrow="Assets · Fleet"
        title="Fleet"
        subtitle="Every vessel, aircraft, truck, and trainset on the Meridian network — with live utilisation and status."
        actions={
          <>
            <Button variant="secondary" icon={<Download className="h-4 w-4" />}>Export CSV</Button>
            <Button icon={<Wrench className="h-4 w-4" />}>Schedule maintenance</Button>
          </>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {FLEET_KPIS.map((k, i) => (
          <StatTile key={k.label} kpi={k} icon={KPI_ICONS[i]} accent={i === 0} />
        ))}
      </div>

      {/* Mode mix */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
        {(['OCEAN', 'AIR', 'ROAD', 'RAIL'] as TransportMode[]).map(m => {
          const Icon = MODE_ICON[m];
          return (
            <Card key={m} hover className="px-4 py-4">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-gradient-soft text-brand-600">
                  <Icon className="h-4.5 w-4.5" />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] font-medium uppercase tracking-wider text-ink-400">{m}</div>
                  <div className="text-[1.2rem] font-semibold text-ink-900 tabular-nums">{mix[m]}</div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Fleet table */}
      <div className="mt-6">
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-5">
            <Tabs value={mode} onChange={v => setMode(v as typeof mode)}>
              {MODE_TABS.map(t => (
                <Tabs.Item key={t.value} value={t.value}>{t.label}</Tabs.Item>
              ))}
            </Tabs>
            <div className="flex items-center gap-2">
              <Input
                icon={<Search className="h-4 w-4" />}
                placeholder="Search by id, callsign, carrier…"
                value={query}
                onChange={e => setQuery(e.target.value)}
                className="w-[260px]"
              />
              <Button variant="secondary" size="md" icon={<Filter className="h-4 w-4" />}>Filters</Button>
            </div>
          </div>

          <div className="mt-4">
            <Table>
              <THead>
                <TR>
                  <TH>Vehicle</TH>
                  <TH>Mode</TH>
                  <TH>Carrier</TH>
                  <TH>Location</TH>
                  <TH>Capacity</TH>
                  <TH>Utilisation</TH>
                  <TH>Status</TH>
                  <TH className="text-right">Last seen</TH>
                </TR>
              </THead>
              <TBody>
                {filtered.map(v => (
                  <VehicleRow key={v.id} v={v} />
                ))}
              </TBody>
            </Table>

            {filtered.length === 0 && (
              <div className="py-12 text-center text-sm text-ink-400">No vehicles match your filters.</div>
            )}
          </div>

          <div className="flex items-center justify-between px-5 py-4 border-t border-ink-100 text-xs text-ink-500">
            <span>Showing <span className="font-semibold text-ink-800">{filtered.length}</span> of {FLEET.length}</span>
            <Button variant="ghost" size="sm">View archived</Button>
          </div>
        </Card>
      </div>
    </>
  );
}

function VehicleRow({ v }: { v: Vehicle }) {
  const Icon = MODE_ICON[v.mode];

  return (
    <TR className="cursor-pointer">
      <TD>
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-brand-gradient-soft text-brand-600">
            <Icon className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="font-mono text-[13px] font-semibold text-ink-900">{v.id}</div>
            <div className="text-[11.5px] text-ink-400 truncate max-w-[180px]">{v.callsign}</div>
          </div>
        </div>
      </TD>
      <TD><ModeBadge mode={v.mode} /></TD>
      <TD className="text-ink-700">{v.carrier}</TD>
      <TD>
        <div className="text-[13px] text-ink-700 truncate max-w-[200px]">{v.location}</div>
      </TD>
      <TD className="tabular-nums">{fmt(v.capacityTonnes)} t</TD>
      <TD>
        <div className="w-[140px]">
          <ProgressBar
            value={v.utilisation}
            tone={v.utilisation > 0.9 ? 'warning' : v.utilisation > 0.5 ? 'brand' : 'success'}
          />
          <div className="mt-1 text-[11px] text-ink-400 tabular-nums">{Math.round(v.utilisation * 100)}%</div>
        </div>
      </TD>
      <TD><StatusPill status={v.status} /></TD>
      <TD className="text-right text-[12px] text-ink-500">{fmtRelative(v.lastSeen)}</TD>
    </TR>
  );
}

function StatusPill({ status }: { status: Vehicle['status'] }) {
  const cfg = {
    active:      { tone: 'success' as const, label: 'Active' },
    idle:        { tone: 'neutral' as const, label: 'Idle'   },
    maintenance: { tone: 'warning' as const, label: 'Maintenance' },
    offline:     { tone: 'danger'  as const, label: 'Offline' },
  }[status];

  return <Badge tone={cfg.tone} dot size="sm">{cfg.label}</Badge>;
}
