'use client';

import * as React from 'react';
import { Download, Filter, Search, Plus } from 'lucide-react';

import { SectionHeader } from '@/components/ui/SectionHeader';
import { Card }          from '@/components/ui/Card';
import { Button }        from '@/components/ui/Button';
import { Input }         from '@/components/ui/Input';
import { Tabs }          from '@/components/ui/Tabs';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/Table';
import { ProgressBar }   from '@/components/ui/ProgressBar';
import {
  ShipmentStatusBadge,
  ModeBadge,
} from '@/components/domain/StatusBadge';

import { SHIPMENTS } from '@/lib/mock/shipments';
import type { ShipmentStatus } from '@/lib/types';
import { fmt } from '@/lib/utils';

const STATUS_TABS: { label: string; value: ShipmentStatus | 'all' }[] = [
  { label: 'All',        value: 'all'       },
  { label: 'Transit',    value: 'transit'   },
  { label: 'At-risk',    value: 'risk'      },
  { label: 'Delayed',    value: 'delayed'   },
  { label: 'Rerouted',   value: 'rerouted'  },
  { label: 'Delivered',  value: 'delivered' },
];

export default function ShipmentsPage() {
  const [tab,    setTab]    = React.useState<ShipmentStatus | 'all'>('all');
  const [query,  setQuery]  = React.useState('');

  const filtered = SHIPMENTS.filter(s => {
    const matchTab   = tab === 'all' || s.status === tab;
    const q = query.trim().toLowerCase();
    const matchQuery = !q
      || s.id.toLowerCase().includes(q)
      || s.cargo.toLowerCase().includes(q)
      || s.from.code.toLowerCase().includes(q)
      || s.to.code.toLowerCase().includes(q)
      || s.carrier.toLowerCase().includes(q);
    return matchTab && matchQuery;
  });

  return (
    <>
      <SectionHeader
        eyebrow="Operations · Shipments"
        title="Shipment registry"
        subtitle="Every shipment on the Meridian network — across ocean, air, road, and rail."
        actions={
          <>
            <Button variant="secondary" icon={<Download className="h-4 w-4" />}>Export CSV</Button>
            <Button icon={<Plus className="h-4 w-4" />}>New shipment</Button>
          </>
        }
      />

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-5">
          <Tabs value={tab} onChange={v => setTab(v as typeof tab)}>
            {STATUS_TABS.map(t => (
              <Tabs.Item key={t.value} value={t.value}>{t.label}</Tabs.Item>
            ))}
          </Tabs>
          <div className="flex items-center gap-2">
            <Input
              icon={<Search className="h-4 w-4" />}
              placeholder="Search by id, cargo, code…"
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
                <TH>Shipment</TH>
                <TH>Route</TH>
                <TH>Mode</TH>
                <TH>Cargo</TH>
                <TH>Progress</TH>
                <TH className="text-right">ETA</TH>
                <TH className="text-right">Value</TH>
                <TH>Status</TH>
              </TR>
            </THead>
            <TBody>
              {filtered.map(s => (
                <TR key={s.id} className="cursor-pointer">
                  <TD>
                    <div className="font-mono text-[13px] font-semibold text-ink-900">{s.id}</div>
                    <div className="text-[11.5px] text-ink-400">{s.carrier}</div>
                  </TD>
                  <TD>
                    <div className="flex items-center gap-1.5 text-[13px] text-ink-800">
                      <span className="font-semibold">{s.from.code}</span>
                      <span className="text-ink-300">→</span>
                      <span className="font-semibold">{s.to.code}</span>
                    </div>
                    <div className="text-[11.5px] text-ink-400">
                      {s.from.city} → {s.to.city}
                    </div>
                  </TD>
                  <TD><ModeBadge mode={s.mode} /></TD>
                  <TD>
                    <div className="text-[13px] text-ink-800 truncate max-w-[220px]">{s.cargo}</div>
                    <div className="text-[11.5px] text-ink-400">{fmt(s.weightTonnes, 1)} t</div>
                  </TD>
                  <TD>
                    <div className="w-[140px]">
                      <ProgressBar
                        value={s.progress}
                        tone={s.status === 'risk' ? 'warning' : s.status === 'delayed' ? 'danger' : 'brand'}
                      />
                      <div className="mt-1 text-[11px] text-ink-400 tabular-nums">{Math.round(s.progress * 100)}%</div>
                    </div>
                  </TD>
                  <TD className="text-right font-mono text-[13px] font-semibold text-ink-900">{s.etaLabel}</TD>
                  <TD className="text-right tabular-nums text-ink-800">${(s.valueUsd / 1_000_000).toFixed(2)}M</TD>
                  <TD><ShipmentStatusBadge status={s.status} /></TD>
                </TR>
              ))}
            </TBody>
          </Table>

          {filtered.length === 0 && (
            <div className="py-12 text-center text-sm text-ink-400">No shipments match your filters.</div>
          )}
        </div>

        <div className="flex items-center justify-between px-5 py-4 border-t border-ink-100 text-xs text-ink-500">
          <span>Showing <span className="font-semibold text-ink-800">{filtered.length}</span> of {SHIPMENTS.length}</span>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" disabled>Previous</Button>
            <Button variant="ghost" size="sm">1</Button>
            <Button variant="secondary" size="sm">Next</Button>
          </div>
        </div>
      </Card>
    </>
  );
}
