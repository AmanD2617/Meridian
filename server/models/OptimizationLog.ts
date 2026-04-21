import { Schema, model, Document, Model, Types } from 'mongoose';
import type { IGeoLineString } from '../types/geo';

// ─────────────────────────────────────────────────────────────
// Enums
// ─────────────────────────────────────────────────────────────

/**
 * Lifecycle state of an optimization decision.
 *
 * PENDING          → Gemini has produced a decision; awaiting operator action
 * AUTO_APPROVED    → Confidence >= threshold; executed automatically
 * EXECUTED         → Operator clicked "Approve Reroute"; route updated in DB
 * REJECTED         → Operator dismissed, or confidence below reject threshold
 */
export type OptimizationStatus =
  | 'PENDING'
  | 'AUTO_APPROVED'
  | 'EXECUTED'
  | 'REJECTED';

/**
 * The action field returned directly by Gemini in its JSON output.
 * Maps to status transitions in the backend.
 */
export type GeminiAction =
  | 'AUTO_APPROVED'
  | 'REQUIRES_HUMAN_SIGNOFF'
  | 'REJECT';

// ─────────────────────────────────────────────────────────────
// ETA metrics sub-document
// ─────────────────────────────────────────────────────────────

export interface IOptimizationMetrics {
  /** Original ETA hours from departure (decimal) */
  originalETA_h: number;
  /** Proposed ETA hours if reroute is executed (decimal) */
  proposedETA_h: number;
  /**
   * Difference in minutes.
   * Negative = reroute is faster (time saved).
   * Positive = reroute adds delay (but avoids worse outcome).
   */
  timeSavedMinutes: number;
  /** Estimated USD value of cargo loss avoided, if applicable */
  spoilageAvoided_usd?: number;
  /** Fuel cost delta as a percentage of baseline (e.g. 2.8 = +2.8%) */
  fuelDeltaPct?: number;
}

// ─────────────────────────────────────────────────────────────
// OptimizationLog document interface
// ─────────────────────────────────────────────────────────────

export interface IOptimizationLog extends Document {
  /** Human-readable log ID, e.g. "OPT-4921" */
  optId: string;

  // ── References ────────────────────────────────────────────

  /** The shipment this optimization targets */
  shipmentId: Types.ObjectId;

  /** The risk alert that triggered this optimization */
  alertId: Types.ObjectId;

  /** IATA tracking code — denormalized for fast lookups without a join */
  shipmentTrackingId: string;

  /** Human-readable alert ID — denormalized for the same reason */
  alertHumanId: string;

  // ── Gemini output ─────────────────────────────────────────

  /**
   * Gemini's confidence in this decision: 0.0 → 1.0.
   * Drives the auto-approve vs. human-signoff gate.
   */
  confidenceScore: number;

  /**
   * The free-text chain-of-thought from Gemini explaining why
   * this alternate was selected over the others.
   */
  aiReasoning: string;

  /** Which alternate route ID Gemini selected (e.g. "ALT-A") */
  selectedAlternate: string;

  /**
   * GeoJSON LineString of the proposed new route.
   * Written to Shipment.activeRoute when status → EXECUTED.
   */
  proposedRoute: IGeoLineString;

  /** Quantitative metrics comparing original vs. proposed route */
  metrics: IOptimizationMetrics;

  /**
   * The raw action enum returned by Gemini.
   * Used to seed the initial `status` field.
   */
  geminiAction: GeminiAction;

  // ── Lifecycle ─────────────────────────────────────────────

  status: OptimizationStatus;

  /** Set when an operator approves or rejects the decision */
  resolvedBy?: string;

  /** ISO-8601 timestamp when the decision was resolved */
  resolvedAt?: Date;

  // ── Timestamps ────────────────────────────────────────────
  createdAt: Date;
  updatedAt: Date;
}

// ─────────────────────────────────────────────────────────────
// Sub-schemas
// ─────────────────────────────────────────────────────────────

const GeoLineStringSchema = new Schema<IGeoLineString>(
  {
    type: {
      type: String,
      enum: ['LineString'],
      required: true,
      default: 'LineString',
    },
    coordinates: {
      type: [[Number]],
      required: true,
      validate: {
        validator: (v: number[][]) => v.length >= 2,
        message: 'A LineString must have at least 2 coordinate pairs',
      },
    },
  },
  { _id: false }
);

const OptimizationMetricsSchema = new Schema<IOptimizationMetrics>(
  {
    originalETA_h:        { type: Number, required: true },
    proposedETA_h:        { type: Number, required: true },
    timeSavedMinutes:     { type: Number, required: true },
    spoilageAvoided_usd:  { type: Number, default: null },
    fuelDeltaPct:         { type: Number, default: null },
  },
  { _id: false }
);

// ─────────────────────────────────────────────────────────────
// Main OptimizationLog schema
// ─────────────────────────────────────────────────────────────

const OptimizationLogSchema = new Schema<IOptimizationLog>(
  {
    optId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      match: /^OPT-\d+$/,
    },

    // ── References ──────────────────────────────────────────
    shipmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Shipment',
      required: true,
    },
    alertId: {
      type: Schema.Types.ObjectId,
      ref: 'RiskAlert',
      required: true,
    },

    // Denormalized human-readable IDs (avoid extra lookups in the UI feed)
    shipmentTrackingId: { type: String, required: true, trim: true },
    alertHumanId:       { type: String, required: true, trim: true },

    // ── Gemini output ────────────────────────────────────────
    confidenceScore: {
      type: Number,
      required: true,
      min: 0,
      max: 1,
    },

    aiReasoning:      { type: String, required: true, trim: true },
    selectedAlternate: { type: String, required: true, trim: true },

    proposedRoute: { type: GeoLineStringSchema, required: true },
    metrics:       { type: OptimizationMetricsSchema, required: true },

    geminiAction: {
      type: String,
      enum: ['AUTO_APPROVED', 'REQUIRES_HUMAN_SIGNOFF', 'REJECT'] as GeminiAction[],
      required: true,
    },

    // ── Lifecycle ────────────────────────────────────────────
    status: {
      type: String,
      enum: ['PENDING', 'AUTO_APPROVED', 'EXECUTED', 'REJECTED'] as OptimizationStatus[],
      required: true,
      default: 'PENDING',
    },

    resolvedBy: { type: String, default: null },
    resolvedAt: { type: Date,   default: null },
  },
  {
    timestamps: true,
    collection: 'optimizationlogs',
  }
);

// ─────────────────────────────────────────────────────────────
// 2dsphere index — enables spatial queries on the proposed route
// ─────────────────────────────────────────────────────────────

OptimizationLogSchema.index({ proposedRoute: '2dsphere' });

// Compound indexes for common API query patterns
OptimizationLogSchema.index({ shipmentId: 1, status: 1 });
OptimizationLogSchema.index({ alertId: 1, createdAt: -1 });
OptimizationLogSchema.index({ status: 1, confidenceScore: -1 });

// ─────────────────────────────────────────────────────────────
// Model export
// ─────────────────────────────────────────────────────────────

const OptimizationLog: Model<IOptimizationLog> = model<IOptimizationLog>(
  'OptimizationLog',
  OptimizationLogSchema
);
export default OptimizationLog;
