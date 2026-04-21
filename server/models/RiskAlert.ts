import { Schema, model, Document, Model } from 'mongoose';
import type { IGeoPolygon } from '../types/geo';

// ─────────────────────────────────────────────────────────────
// Enums
// ─────────────────────────────────────────────────────────────

/** Which sub-agent generated this alert */
export type AgentSource = 'Weather' | 'Traffic' | 'Geopolitical' | 'Custom';

/** How dangerous the hazard is */
export type AlertSeverity = 'Low' | 'Medium' | 'High' | 'Critical';

// ─────────────────────────────────────────────────────────────
// RiskAlert document interface
// ─────────────────────────────────────────────────────────────

export interface IRiskAlert extends Document {
  /** Short human-readable ID, e.g. "HZ-021" */
  alertId: string;

  /** Which agent produced this alert */
  agentSource: AgentSource;

  severity: AlertSeverity;

  /** e.g. "Cyclone Arwen — Arabian Sea" */
  title: string;

  /** Free-text description from the agent */
  description: string;

  /**
   * GeoJSON Polygon defining the geographic extent of the hazard.
   * The 2dsphere index on this field allows us to run
   * `$geoIntersects` queries against shipment routes instantly.
   */
  hazardZone: IGeoPolygon;

  /**
   * IDs of shipments whose activeRoute currently intersects
   * this hazard zone (maintained by the Risk Agent).
   */
  affectedShipmentIds: string[];

  /** False once the hazard has cleared or expired */
  isActive: boolean;

  /** When this hazard is expected to clear (ISO-8601 or null) */
  expectedClearanceAt: Date | null;

  // ── Timestamps ────────────────────────────────────────────
  createdAt: Date;
  updatedAt: Date;
}

// ─────────────────────────────────────────────────────────────
// Sub-schema: GeoJSON Polygon
// ─────────────────────────────────────────────────────────────

const GeoPolygonSchema = new Schema<IGeoPolygon>(
  {
    type: {
      type: String,
      enum: ['Polygon'],
      required: true,
      default: 'Polygon',
    },
    coordinates: {
      type: [[[Number]]],
      required: true,
      validate: {
        validator: (rings: number[][][]) => {
          if (!rings || rings.length === 0) return false;
          // Every ring must be closed (first coord === last coord)
          return rings.every((ring) => {
            if (ring.length < 4) return false; // min 4 points for a valid ring
            const first = ring[0];
            const last  = ring[ring.length - 1];
            return first[0] === last[0] && first[1] === last[1];
          });
        },
        message:
          'Each Polygon ring must have ≥ 4 positions and be closed (first coord must equal last coord)',
      },
    },
  },
  { _id: false }
);

// ─────────────────────────────────────────────────────────────
// Main RiskAlert schema
// ─────────────────────────────────────────────────────────────

const RiskAlertSchema = new Schema<IRiskAlert>(
  {
    alertId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      match: /^HZ-\d+$/,
    },

    agentSource: {
      type: String,
      enum: ['Weather', 'Traffic', 'Geopolitical', 'Custom'] as AgentSource[],
      required: true,
    },

    severity: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'] as AlertSeverity[],
      required: true,
    },

    title:       { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },

    hazardZone: { type: GeoPolygonSchema, required: true },

    affectedShipmentIds: {
      type: [String],
      default: [],
    },

    isActive: { type: Boolean, required: true, default: true },

    expectedClearanceAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    collection: 'riskalerts',
  }
);

// ─────────────────────────────────────────────────────────────
// 2dsphere index — enables $geoIntersects against hazardZone
// ─────────────────────────────────────────────────────────────

RiskAlertSchema.index({ hazardZone: '2dsphere' });

// Compound indexes for common query patterns
RiskAlertSchema.index({ isActive: 1, severity: 1 });
RiskAlertSchema.index({ agentSource: 1, updatedAt: -1 });

// ─────────────────────────────────────────────────────────────
// Model export
// ─────────────────────────────────────────────────────────────

const RiskAlert: Model<IRiskAlert> = model<IRiskAlert>('RiskAlert', RiskAlertSchema);
export default RiskAlert;
