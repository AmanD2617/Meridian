import * as React from 'react';
import { Badge } from '@/components/ui/Badge';
import type {
  ShipmentStatus,
  AlertSeverity,
  OptimizationStatus,
  TransportMode,
} from '@/lib/types';

/**
 * Small domain-specific badges so every screen renders the same label
 * and color for the same status — single source of truth.
 */

const SHIPMENT_TONE: Record<ShipmentStatus, React.ComponentProps<typeof Badge>['tone']> = {
  transit:   'ai',
  risk:      'warning',
  delayed:   'danger',
  rerouted:  'success',
  delivered: 'success',
};

export function ShipmentStatusBadge({ status }: { status: ShipmentStatus }) {
  return <Badge tone={SHIPMENT_TONE[status]} dot size="sm">{status}</Badge>;
}

const SEVERITY_TONE: Record<AlertSeverity, React.ComponentProps<typeof Badge>['tone']> = {
  Low:      'neutral',
  Medium:   'ai',
  High:     'warning',
  Critical: 'danger',
};

export function SeverityBadge({ severity }: { severity: AlertSeverity }) {
  return <Badge tone={SEVERITY_TONE[severity]} size="sm">{severity}</Badge>;
}

const OPT_TONE: Record<OptimizationStatus, React.ComponentProps<typeof Badge>['tone']> = {
  PENDING:       'warning',
  AUTO_APPROVED: 'ai',
  EXECUTED:      'success',
  REJECTED:      'neutral',
};

const OPT_LABEL: Record<OptimizationStatus, string> = {
  PENDING:       'Pending',
  AUTO_APPROVED: 'Auto-approved',
  EXECUTED:      'Executed',
  REJECTED:      'Rejected',
};

export function OptimizationStatusBadge({ status }: { status: OptimizationStatus }) {
  return <Badge tone={OPT_TONE[status]} size="sm">{OPT_LABEL[status]}</Badge>;
}

const MODE_TONE: Record<TransportMode, React.ComponentProps<typeof Badge>['tone']> = {
  OCEAN: 'ai',
  AIR:   'ai',
  ROAD:  'neutral',
  RAIL:  'neutral',
};

export function ModeBadge({ mode }: { mode: TransportMode }) {
  return <Badge tone={MODE_TONE[mode]} size="sm">{mode}</Badge>;
}
