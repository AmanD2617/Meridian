import type { Kpi, TimeseriesPoint } from '@/lib/types';

export const OVERVIEW_KPIS: Kpi[] = [
  { label: 'Active shipments',    value: '1,284', delta: '+4.8%', trend: 'up',   tone: 'neutral' },
  { label: 'On-time performance', value: '96.4%', delta: '+1.2pp', trend: 'up',  tone: 'success' },
  { label: 'At-risk now',         value: '12',    delta: '+3',     trend: 'up',  tone: 'warning' },
  { label: 'Auto-approve rate',   value: '84.6%', delta: '+2.1pp', trend: 'up',  tone: 'ai' },
];

export const AI_KPIS: Kpi[] = [
  { label: 'Decisions / hour',    value: '14,223', delta: '+8%',    trend: 'up',   tone: 'ai' },
  { label: 'Avg inference',       value: '1.52s',  delta: '-0.3s',  trend: 'down', tone: 'success' },
  { label: 'Confidence (median)', value: '0.89',   delta: '+0.04',  trend: 'up',   tone: 'ai' },
  { label: 'Fallback rate',       value: '2.1%',   delta: '-0.4pp', trend: 'down', tone: 'success' },
];

export const FLEET_KPIS: Kpi[] = [
  { label: 'Vehicles online',     value: '412',    delta: '+6',     trend: 'up',   tone: 'success' },
  { label: 'Utilisation avg',     value: '78.2%',  delta: '-0.6pp', trend: 'down', tone: 'warning' },
  { label: 'Maintenance due',     value: '14',     delta: '+2',     trend: 'up',   tone: 'warning' },
  { label: 'Mean hours in use',   value: '17.4h',  delta: '+0.8h',  trend: 'up',   tone: 'neutral' },
];

export const ANALYTICS_KPIS: Kpi[] = [
  { label: 'Spoilage avoided (30d)', value: '$28.4M', delta: '+$4.1M', trend: 'up',   tone: 'success' },
  { label: 'Time saved (30d)',       value: '1,840h', delta: '+210h',  trend: 'up',   tone: 'success' },
  { label: 'Reroute success rate',   value: '97.8%',  delta: '+0.9pp', trend: 'up',   tone: 'success' },
  { label: 'Cost index',             value: '102.4',  delta: '+1.4',   trend: 'up',   tone: 'warning' },
];

export const SHIPMENT_FLOW_30D: TimeseriesPoint[] = buildSeries(30, 1_050, 1_380);
export const ON_TIME_30D:      TimeseriesPoint[] = buildSeries(30, 93, 98.5, 1);
export const COST_INDEX_30D:   TimeseriesPoint[] = buildSeries(30, 96, 108, 1);
export const AI_LATENCY_24H:   TimeseriesPoint[] = buildSeries(24, 1.1, 2.3, 2);

function buildSeries(n: number, min: number, max: number, decimals = 0): TimeseriesPoint[] {
  const now = Date.now();
  const step = n <= 24 ? 3_600_000 : 86_400_000;
  return Array.from({ length: n }, (_, i) => {
    const phase = i / n;
    // Seeded sine + drift so charts look organic but deterministic
    const noise = Math.sin(phase * Math.PI * 2 + i * 0.4) * 0.5 + Math.cos(i * 0.22) * 0.25;
    const bias  = 0.5 + noise * 0.4 + phase * 0.15;
    const v = +(min + (max - min) * Math.min(1, Math.max(0, bias))).toFixed(decimals);
    return {
      t: new Date(now - (n - i - 1) * step).toISOString(),
      v,
    };
  });
}
