/**
 * ============================================================
 * types/geo.ts — Shared GeoJSON type definitions
 * ============================================================
 * Single source of truth for all GeoJSON interfaces used across
 * Mongoose models and the OrchestratorAgent Zod schema.
 *
 * Previously these were duplicated in:
 *   - models/Shipment.ts       (IGeoPoint, IGeoLineString)
 *   - models/RiskAlert.ts      (IGeoPolygon)
 *   - models/OptimizationLog.ts (IGeoLineString)
 * ============================================================
 */

/** GeoJSON Point — origin, destination, currentLocation */
export interface IGeoPoint {
  type: 'Point';
  /** [longitude, latitude] */
  coordinates: [number, number];
}

/** GeoJSON LineString — active route and proposed reroute paths */
export interface IGeoLineString {
  type: 'LineString';
  /** Ordered array of [longitude, latitude] pairs */
  coordinates: [number, number][];
}

/**
 * GeoJSON Polygon — hazard zone boundary.
 *
 * MongoDB 2dsphere requires:
 *   - coordinates[0] = exterior ring (counter-clockwise)
 *   - Ring must be closed: first coord === last coord
 *   - Minimum 4 positions per ring
 */
export interface IGeoPolygon {
  type: 'Polygon';
  /** Array of rings; each ring is an array of [lon, lat] pairs */
  coordinates: [number, number][][];
}
