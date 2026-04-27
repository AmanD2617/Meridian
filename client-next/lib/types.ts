/**
 * Shared types for the Meridian UI. Kept deliberately lightweight —
 * mock data uses these today; real API adapters will produce the same
 * shapes tomorrow.
 */

export type TransportMode = 'OCEAN' | 'AIR' | 'ROAD' | 'RAIL';

export type ShipmentStatus =
  | 'transit'
  | 'risk'
  | 'delayed'
  | 'rerouted'
  | 'delivered';

export interface Shipment {
  id: string;                // e.g. MRD-48271
  cargo: string;
  weightTonnes: number;
  from: { code: string; city: string; country: string };
  to:   { code: string; city: string; country: string };
  mode: TransportMode;
  progress: number;          // 0 → 1
  status: ShipmentStatus;
  etaLabel: string;          // "T+14h 20m"
  etaAbsolute: string;       // ISO
  delayMinutes: number;      // negative = ahead
  carrier: string;
  valueUsd: number;
}

export type AlertSeverity = 'Low' | 'Medium' | 'High' | 'Critical';
export type AlertSource   = 'Weather' | 'Traffic' | 'Geopolitical' | 'Port' | 'Fleet';

export interface RiskAlert {
  id: string;                // HZ-103
  source: AlertSource;
  severity: AlertSeverity;
  title: string;
  description: string;
  region: string;
  affects: string[];         // shipment ids
  raisedAt: string;          // ISO
  clearsAt: string | null;   // ISO
  active: boolean;
}

export type OptimizationStatus =
  | 'PENDING'
  | 'AUTO_APPROVED'
  | 'EXECUTED'
  | 'REJECTED';

export interface OptimizationLog {
  id: string;                // OPT-5021
  shipmentId: string;
  alertId: string;
  status: OptimizationStatus;
  confidence: number;        // 0 → 1
  selectedAlternate: string;
  reasoning: string;
  metrics: {
    originalEtaH: number;
    proposedEtaH: number;
    timeSavedMin: number;    // negative = faster
    spoilageAvoidedUsd: number;
    fuelDeltaPct: number;
  };
  agents: AgentTraceEntry[];
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

export interface AgentTraceEntry {
  agent: 'weather' | 'risk' | 'route' | 'orchestrator';
  message: string;
  done: boolean;
}

export interface Vehicle {
  id: string;                // VEH-224
  mode: TransportMode;
  callsign: string;          // e.g. "MV Meridian 07"
  carrier: string;
  capacityTonnes: number;
  utilisation: number;       // 0 → 1
  location: string;
  status: 'idle' | 'active' | 'maintenance' | 'offline';
  lastSeen: string;          // ISO
}

export interface Kpi {
  label: string;
  value: string;
  delta: string;
  trend: 'up' | 'down' | 'flat';
  tone?: 'success' | 'warning' | 'danger' | 'ai' | 'neutral';
}

export interface TimeseriesPoint {
  t: string;
  v: number;
}
