'use client';

import * as React from 'react';
import { Bell, BellOff, Filter, Megaphone, RefreshCw } from 'lucide-react';

import { SectionHeader } from '@/components/ui/SectionHeader';
import { Card, CardHeader, CardBody, CardFooter } from '@/components/ui/Card';
import { Button }        from '@/components/ui/Button';
import { Badge }         from '@/components/ui/Badge';
import { Tabs }          from '@/components/ui/Tabs';
import { StatTile }      from '@/components/ui/StatTile';
import { EmptyState }    from '@/components/ui/EmptyState';
import { SeverityBadge } from '@/components/domain/StatusBadge';

import { ALERTS }    from '@/lib/mock/alerts';
import type { AlertSeverity } from '@/lib/types';
import { fmtRelative, cn } from '@/lib/utils';

const FILTERS: { label: string; value: AlertSeverity | 'all' | 'active' }[] = [
  { label: 'Active',    value: 'active'   },
  { label: 'Critical',  value: 'Critical' },
  { label: 'High',      value: 'High'     },
  { label: 'Medium',    value: 'Medium'   },
  { label: 'Low',       value: 'Low'      },
  { label: 'All',       value: 'all'      },
];

export default function RiskAlertsPage() {
  const [filter, setFilter] = React.useState<AlertSeverity | 'all' | 'active'>('active');

  const filtered = ALERTS.filter(a => {
    if (filter === 'all')    return true;
    if (filter === 'active') return a.active;
    return a.severity === filter;
  });

  const stats = {
    critical: ALERTS.filter(a => a.active && a.severity === 'Critical').length,
    high:     ALERTS.filter(a => a.active && a.severity === 'High').length,
    medium:   ALERTS.filter(a => a.active && a.severity === 'Medium').length,
    affected: new Set(ALERTS.filter(a => a.active).flatMap(a => a.affects)).size,
  };

  return (
    <>
      <SectionHeader
        eyebrow="Risk · Alerts"
        title="Risk alert center"
        subtitle="Live hazards from weather, traffic, geopolitical, port, and fleet agents — with the shipments they touch."
        actions={
          <>
            <Button variant="secondary" icon={<RefreshCw className="h-4 w-4" />}>Refresh</Button>
            <Button icon={<Megaphone className="h-4 w-4" />}>Broadcast</Button>
          </>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatTile kpi={{ label: 'Critical',          value: String(stats.critical), delta: 'now',  trend: 'up',   tone: 'danger'  }} />
        <StatTile kpi={{ label: 'High',              value: String(stats.high),     delta: 'now',  trend: 'up',   tone: 'warning' }} />
        <StatTile kpi={{ label: 'Medium',            value: String(stats.medium),   delta: 'now',  trend: 'flat', tone: 'ai'      }} />
        <StatTile kpi={{ label: 'Shipments affected', value: String(stats.affected), delta: '+3',  trend: 'up',   tone: 'warning' }} />
      </div>

      <div className="mt-6">
        <Card>
          <div className="flex items-center justify-between px-5 pt-5">
            <Tabs value={filter} onChange={v => setFilter(v as typeof filter)}>
              {FILTERS.map(f => (
                <Tabs.Item key={f.value} value={f.value}>{f.label}</Tabs.Item>
              ))}
            </Tabs>
            <Button variant="secondary" size="md" icon={<Filter className="h-4 w-4" />}>Filters</Button>
          </div>

          <CardBody className="space-y-3 mt-4">
            {filtered.length === 0 ? (
              <EmptyState
                icon={<BellOff className="h-5 w-5" />}
                title="All clear"
                subtitle="No alerts match this filter right now. Meridian is monitoring the network continuously."
              />
            ) : (
              filtered.map(a => <AlertRow key={a.id} alert={a} />)
            )}
          </CardBody>

          {filtered.length > 0 && (
            <CardFooter>
              <span className="text-xs text-ink-500">Showing <span className="font-semibold text-ink-800">{filtered.length}</span> of {ALERTS.length}</span>
              <Button variant="ghost" size="sm">View archived</Button>
            </CardFooter>
          )}
        </Card>
      </div>
    </>
  );
}

function AlertRow({ alert: a }: { alert: typeof ALERTS[number] }) {
  const severityStripe = {
    Critical: 'bg-danger',
    High:     'bg-warning',
    Medium:   'bg-ai',
    Low:      'bg-ink-300',
  }[a.severity];

  return (
    <div
      className={cn(
        'relative rounded-2xl border border-ink-100 bg-white p-5 pl-6',
        'transition-all duration-200 hover:border-ink-200 hover:shadow-card',
      )}
    >
      <span className={cn('absolute left-0 top-4 bottom-4 w-[3px] rounded-r-full', severityStripe)} />

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[12px] font-semibold text-ink-900">{a.id}</span>
            <Badge tone="neutral" size="sm">{a.source}</Badge>
            <SeverityBadge severity={a.severity} />
            {a.active ? (
              <Badge tone="warning" size="sm" dot>Active</Badge>
            ) : (
              <Badge tone="neutral" size="sm">Resolved</Badge>
            )}
          </div>
          <h3 className="mt-2 text-[15px] font-semibold text-ink-900 leading-tight">{a.title}</h3>
          <p className="mt-1 text-sm text-ink-600 leading-relaxed max-w-3xl">{a.description}</p>

          <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-ink-500">
            <span>Region <span className="font-medium text-ink-800">{a.region}</span></span>
            <span>Raised {fmtRelative(a.raisedAt)}</span>
            {a.clearsAt && <span>Clears ~{fmtRelative(a.clearsAt)}</span>}
            {a.affects.length > 0 && (
              <span>
                Affects
                <span className="ml-1 font-medium text-ink-800">{a.affects.join(', ')}</span>
              </span>
            )}
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-2">
          <Button variant="secondary" size="sm" icon={<Bell className="h-3.5 w-3.5" />}>Subscribe</Button>
          <Button variant="ai" size="sm">Run agents</Button>
        </div>
      </div>
    </div>
  );
}
