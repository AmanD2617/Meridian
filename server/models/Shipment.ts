import { Schema, model, Document, Model } from 'mongoose';
import type { IGeoPoint, IGeoLineString } from '../types/geo';

// ─────────────────────────────────────────────────────────────
// ETA / delay metrics sub-document
// ─────────────────────────────────────────────────────────────

export interface IETAMetrics {
  /** Human-readable relative label e.g. "T+18h 22m" — for display */
  estimatedArrival: string;
  /** Original ETA label before any disruption — for display */
  originalArrival: string;
  /** Positive = delayed, negative = early, 0 = on-time (minutes) */
  delayMinutes: number;
  /**
   * Absolute UTC timestamp for the estimated arrival.
   * Enables sorting, comparison, and "time remaining" calculations.
   * Derived from estimatedArrival + createdAt when the shipment is seeded
   * or updated by a reroute execution.
   */
  absoluteArrivalAt?: Date;
}

// ─────────────────────────────────────────────────────────────
// Shipment status enum
// ─────────────────────────────────────────────────────────────

export type ShipmentStatus =
  | 'transit'    // nominal — moving normally
  | 'risk'       // an active hazard intersects the route
  | 'delayed'    // confirmed delay, no reroute yet
  | 'rerouted'   // an OptimizationLog has been EXECUTED
  | 'delivered'; // journey complete

// ─────────────────────────────────────────────────────────────
// Shipment document interface
// ─────────────────────────────────────────────────────────────

export interface IShipment extends Document {
  /** Human-readable tracking ID, e.g. "MRD-48271" */
  trackingId: string;

  // ── Cargo ─────────────────────────────────────────────────
  cargoDescription: string;
  weightTonnes: number;

  // ── Route ─────────────────────────────────────────────────
  /** IATA / hub code for the origin city */
  fromCode: string;
  /** IATA / hub code for the destination city */
  toCode: string;

  /** GeoJSON Point: shipment departure hub */
  origin: IGeoPoint;

  /** GeoJSON Point: shipment destination hub */
  destination: IGeoPoint;

  /**
   * GeoJSON Point: live position of the shipment.
   * Updated by the monitoring agent on each tick.
   */
  currentLocation: IGeoPoint;

  /**
   * GeoJSON LineString: the currently-active route path.
   * Replaced when an OptimizationLog is EXECUTED.
   */
  activeRoute: IGeoLineString;

  // ── Progress & status ─────────────────────────────────────
  /** 0.0 → 1.0 fraction of journey completed */
  progress: number;
  status: ShipmentStatus;

  // ── ETA ───────────────────────────────────────────────────
  eta: IETAMetrics;

  // ── Timestamps ────────────────────────────────────────────
  createdAt: Date;
  updatedAt: Date;
}

// ─────────────────────────────────────────────────────────────
// Sub-schemas
// ─────────────────────────────────────────────────────────────

const GeoPointSchema = new Schema<IGeoPoint>(
  {
    type: {
      type: String,
      enum: ['Point'],
      required: true,
      default: 'Point',
    },
    coordinates: {
      type: [Number],
      required: true,
      validate: {
        validator: (v: number[]) =>
          v.length === 2 &&
          v[0] >= -180 && v[0] <= 180 &&
          v[1] >= -90  && v[1] <= 90,
        message: 'coordinates must be [longitude(-180–180), latitude(-90–90)]',
      },
    },
  },
  { _id: false }
);

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

const ETAMetricsSchema = new Schema<IETAMetrics>(
  {
    estimatedArrival:  { type: String, required: true },
    originalArrival:   { type: String, required: true },
    delayMinutes:      { type: Number, required: true, default: 0 },
    absoluteArrivalAt: { type: Date,   default: null },
  },
  { _id: false }
);

// ─────────────────────────────────────────────────────────────
// Main Shipment schema
// ─────────────────────────────────────────────────────────────

const ShipmentSchema = new Schema<IShipment>(
  {
    trackingId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      match: /^MRD-\d+$/,
    },

    cargoDescription: { type: String, required: true, trim: true },
    weightTonnes:     { type: Number, required: true, min: 0 },

    fromCode: { type: String, required: true, uppercase: true, trim: true },
    toCode:   { type: String, required: true, uppercase: true, trim: true },

    origin:          { type: GeoPointSchema,      required: true },
    destination:     { type: GeoPointSchema,      required: true },
    currentLocation: { type: GeoPointSchema,      required: true },
    activeRoute:     { type: GeoLineStringSchema, required: true },

    progress: { type: Number, required: true, min: 0, max: 1, default: 0 },

    status: {
      type: String,
      enum: ['transit', 'risk', 'delayed', 'rerouted', 'delivered'] as ShipmentStatus[],
      required: true,
      default: 'transit',
    },

    eta: { type: ETAMetricsSchema, required: true },
  },
  {
    timestamps: true, // adds createdAt / updatedAt automatically
    collection: 'shipments',
  }
);

// ─────────────────────────────────────────────────────────────
// 2dsphere indexes — required for $geoIntersects / $near queries
// ─────────────────────────────────────────────────────────────

ShipmentSchema.index({ origin:          '2dsphere' });
ShipmentSchema.index({ destination:     '2dsphere' });
ShipmentSchema.index({ currentLocation: '2dsphere' });
ShipmentSchema.index({ activeRoute:     '2dsphere' });

// Compound index for fast status-filtered list queries
ShipmentSchema.index({ status: 1, updatedAt: -1 });

// ─────────────────────────────────────────────────────────────
// Model export
// ─────────────────────────────────────────────────────────────

const Shipment: Model<IShipment> = model<IShipment>('Shipment', ShipmentSchema);
export default Shipment;
