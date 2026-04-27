'use client';

import * as React from 'react';
import type { Shipment, ShipmentStatus } from '@/lib/types';
import { cn } from '@/lib/utils';

/**
 * Stylised equirectangular world map for shipment visualisation.
 * SVG-only — no map tile dependency. Renders continents, route arcs,
 * and shipment markers at current progress. Status drives the color.
 *
 * Not geographically precise: continents are low-poly vector shapes
 * that match the premium-SaaS feel. Shipments land where they should
 * because city coordinates are real.
 */

const W = 1000;
const H = 500;

const project = (lon: number, lat: number): [number, number] => [
  ((lon + 180) * W) / 360,
  ((90 - lat) * H) / 180,
];

// Stylised continent outlines — [lon, lat] pairs.
const CONTINENTS: string[] = [
  '-168,65 -158,70 -140,68 -125,60 -122,48 -124,40 -117,32 -107,25 -97,22 -90,18 -82,15 -80,25 -75,35 -72,42 -65,45 -60,48 -55,52 -60,58 -68,63 -80,62 -90,65 -105,68 -125,72 -145,70 -168,65',
  '-80,12 -70,10 -60,8 -50,0 -40,-5 -35,-10 -40,-25 -55,-35 -70,-45 -73,-52 -70,-55 -65,-52 -60,-40 -68,-28 -78,-12 -80,-5 -80,12',
  '-10,36 0,38 10,38 18,40 28,38 35,40 40,43 35,55 28,60 20,62 10,60 4,55 -5,52 -10,45 -10,36',
  '-18,35 -8,32 0,30 15,32 25,31 33,30 36,22 44,12 50,2 45,-8 38,-18 30,-30 20,-35 10,-30 0,-22 -8,-8 -15,0 -18,12 -18,25 -18,35',
  '35,68 50,70 65,72 85,75 105,77 125,73 140,65 150,55 145,45 130,38 120,30 110,22 100,15 95,8 90,22 80,28 70,30 60,25 55,30 50,40 45,45 40,55 38,60 35,68',
  '68,8 72,22 80,28 88,22 90,10 80,5 72,5 68,8',
  '95,0 102,-2 110,-5 120,-8 128,-3 122,5 115,8 105,10 100,8 95,0',
  '115,-12 125,-12 135,-15 145,-15 150,-22 152,-32 145,-38 135,-35 125,-32 115,-28 112,-22 115,-12',
  '130,33 135,35 140,38 142,42 140,45 135,43 132,38 130,33',
];

const CITY_COORDS: Record<string, [number, number]> = {
  LAX: [-118.2,  34.0], JFK: [ -74.0,  40.7], MEX: [ -99.1,  19.4], GRU: [ -46.6, -23.5],
  LHR: [  -0.1,  51.5], CDG: [   2.3,  48.8], FRA: [   8.7,  50.1], DXB: [  55.3,  25.2],
  BOM: [  72.8,  19.0], BLR: [  77.5,  12.9], SIN: [ 103.8,   1.3], HKG: [ 114.1,  22.3],
  PVG: [ 121.4,  31.2], NRT: [ 140.3,  35.7], SYD: [ 151.2, -33.8], JNB: [  28.0, -26.2],
  LOS: [   3.4,   6.5], IST: [  28.9,  41.0], ROT: [   4.5,  51.9], ANR: [   4.4,  51.2],
};

const STATUS_COLOR: Record<ShipmentStatus, string> = {
  transit:   '#6366f1',
  risk:      '#f59e0b',
  delayed:   '#f43f5e',
  rerouted:  '#10b981',
  delivered: '#94a3b8',
};

/**
 * Quadratic bézier arc between two geo points. `bulge` controls curve
 * magnitude — positive curves the arc north, negative south.
 */
function arcPath(from: [number, number], to: [number, number], bulge: number): string {
  const [ax, ay] = project(from[0], from[1]);
  const [bx, by] = project(to[0],   to[1]);
  const mx = (ax + bx) / 2;
  const my = (ay + by) / 2 - bulge * Math.hypot(bx - ax, by - ay) * 0.6;
  return `M${ax.toFixed(1)},${ay.toFixed(1)} Q${mx.toFixed(1)},${my.toFixed(1)} ${bx.toFixed(1)},${by.toFixed(1)}`;
}

function pointOnArc(
  from: [number, number],
  to:   [number, number],
  t:    number,
  bulge: number,
): [number, number] {
  const [ax, ay] = project(from[0], from[1]);
  const [bx, by] = project(to[0],   to[1]);
  const mx = (ax + bx) / 2;
  const my = (ay + by) / 2 - bulge * Math.hypot(bx - ax, by - ay) * 0.6;
  const it = 1 - t;
  const x = it * it * ax + 2 * it * t * mx + t * t * bx;
  const y = it * it * ay + 2 * it * t * my + t * t * by;
  return [x, y];
}

export interface WorldMapProps {
  shipments:  Shipment[];
  selectedId?: string | null;
  onSelect?:  (id: string) => void;
  className?: string;
  height?:    number | string;
}

export function WorldMap({
  shipments,
  selectedId,
  onSelect,
  className,
  height = 480,
}: WorldMapProps) {
  const continentPaths = React.useMemo(
    () =>
      CONTINENTS.map(c =>
        c
          .split(' ')
          .map(pair => pair.split(',').map(Number) as [number, number])
          .map(([lon, lat]) => project(lon, lat).join(','))
          .join(' '),
      ),
    [],
  );

  return (
    <div
      className={cn(
        'relative w-full overflow-hidden rounded-2xl border border-ink-100 bg-gradient-to-br from-white to-ink-50',
        className,
      )}
      style={{ height }}
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="h-full w-full" preserveAspectRatio="xMidYMid slice">
        {/* Gridlines */}
        <g stroke="rgba(99,102,241,0.06)" strokeWidth={0.7}>
          {Array.from({ length: 10 }).map((_, i) => (
            <line key={`v-${i}`} x1={(W / 10) * i} x2={(W / 10) * i} y1={0} y2={H} />
          ))}
          {Array.from({ length: 6 }).map((_, i) => (
            <line key={`h-${i}`} y1={(H / 6) * i} y2={(H / 6) * i} x1={0} x2={W} />
          ))}
        </g>

        {/* Continents */}
        <g fill="#eef2ff" stroke="#c7d2fe" strokeWidth={0.7}>
          {continentPaths.map((pts, i) => (
            <polygon key={i} points={pts} />
          ))}
        </g>

        {/* Routes */}
        <g fill="none">
          {shipments.map(s => {
            const from = CITY_COORDS[s.from.code];
            const to   = CITY_COORDS[s.to.code];
            if (!from || !to) return null;
            const bulge = bulgeFor(s.id);
            const selected = selectedId === s.id;
            return (
              <path
                key={`route-${s.id}`}
                d={arcPath(from, to, bulge)}
                stroke={STATUS_COLOR[s.status]}
                strokeOpacity={selected ? 0.9 : 0.35}
                strokeWidth={selected ? 1.6 : 1}
                strokeDasharray={s.status === 'risk' ? '4 3' : undefined}
              />
            );
          })}
        </g>

        {/* Shipment markers */}
        <g>
          {shipments.map(s => {
            const from = CITY_COORDS[s.from.code];
            const to   = CITY_COORDS[s.to.code];
            if (!from || !to) return null;
            const bulge = bulgeFor(s.id);
            const [x, y] = pointOnArc(from, to, s.progress, bulge);
            const color = STATUS_COLOR[s.status];
            const selected = selectedId === s.id;

            return (
              <g
                key={`marker-${s.id}`}
                className="cursor-pointer"
                onClick={() => onSelect?.(s.id)}
              >
                <circle
                  cx={x} cy={y} r={selected ? 8 : 5}
                  fill={color} fillOpacity={0.15}
                />
                <circle
                  cx={x} cy={y} r={selected ? 4 : 3}
                  fill={color} stroke="white" strokeWidth={1.2}
                />
                {selected && (
                  <text
                    x={x + 8} y={y - 8}
                    fontSize={10}
                    fill="#1a2038"
                    fontWeight={600}
                    style={{ paintOrder: 'stroke' }}
                    stroke="white"
                    strokeWidth={3}
                  >
                    {s.id}
                  </text>
                )}
              </g>
            );
          })}
        </g>

        {/* Hub dots for origin / destination cities */}
        <g>
          {Object.entries(CITY_COORDS).map(([code, [lon, lat]]) => {
            const [x, y] = project(lon, lat);
            return (
              <g key={code}>
                <circle cx={x} cy={y} r={2.5} fill="#4f46e5" fillOpacity={0.4} />
              </g>
            );
          })}
        </g>
      </svg>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 flex items-center gap-3 rounded-xl border border-ink-100 bg-white/90 backdrop-blur px-3 py-2 shadow-card">
        <LegendSwatch color="#6366f1" label="Transit" />
        <LegendSwatch color="#f59e0b" label="At-risk" />
        <LegendSwatch color="#f43f5e" label="Delayed" />
        <LegendSwatch color="#10b981" label="Rerouted" />
      </div>
    </div>
  );
}

function LegendSwatch({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5 text-[11px] text-ink-600">
      <span className="h-2 w-2 rounded-full" style={{ background: color }} />
      {label}
    </div>
  );
}

function bulgeFor(id: string): number {
  // Stable deterministic bulge per shipment id.
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  const norm = ((h % 100) / 100 - 0.5) * 0.4; // range ≈ -0.2..0.2
  return norm + 0.05;
}
