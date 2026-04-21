/**
 * ============================================================
 * scripts/seed.ts — Meridian Database Seeder
 * ============================================================
 * Populates MongoDB with a complete, realistic world state so
 * the React map renders meaningful data immediately and the
 * triggerSimulation endpoint has a valid shipment to target.
 *
 * Run:
 *   npx ts-node --project tsconfig.json scripts/seed.ts
 *
 * What this script does:
 *   1. Validates environment variables.
 *   2. Connects to MongoDB and synchronises 2dsphere indexes.
 *   3. Wipes Shipment, RiskAlert, OptimizationLog collections.
 *   4. Inserts 5 shipments with realistic GeoJSON routes.
 *   5. Inserts 2 active RiskAlerts (hazard polygons).
 *   6. Inserts 1 pre-existing OptimizationLog (EXECUTED) so
 *      the Reasoning Panel has history on first load.
 *   7. Exits with code 0.
 *
 * ── CRITICAL GEOSPATIAL NOTE ─────────────────────────────────
 * Shipment MRD-48265 (PVG → LAX) contains 4 waypoints that
 * fall INSIDE the cyclone polygon hardcoded in triggerSimulation:
 *
 *   Polygon:  [-175,48] [-160,50] [-150,46] [-145,38]
 *             [-155,34] [-170,36] [-178,42] [-175,48]
 *
 *   Route waypoints confirmed inside (ray-cast verified):
 *     [-170.0, 48.5]  ✅
 *     [-162.0, 47.0]  ✅
 *     [-155.0, 44.5]  ✅
 *     [-147.0, 41.0]  ✅
 *
 * This guarantees the MongoDB $geoIntersects query in the
 * Risk Agent will return a positive match and trigger Gemini.
 * ============================================================
 */

// ── Preload environment variables ───────────────────────────
// MUST be the first import. Same preload pattern as server.ts —
// see ../config/env.ts for full rationale. Without this, any
// module in the import graph that reads process.env at module
// scope (e.g. the MONGODB_URI guard below) fires before
// dotenv.config() runs, due to CommonJS import hoisting.
import '../config/env';

// Force Node.js to use Google DNS so mongodb+srv:// SRV lookups
// work even when the system DNS / ISP blocks SRV record queries.
import dns from 'dns';
dns.setServers(['8.8.8.8', '8.8.4.4']);

import mongoose, { Types } from 'mongoose';

import Shipment        from '../models/Shipment';
import RiskAlert       from '../models/RiskAlert';
import OptimizationLog from '../models/OptimizationLog';

// ─────────────────────────────────────────────────────────────
// Environment guard
// ─────────────────────────────────────────────────────────────

if (!process.env.MONGODB_URI) {
  console.error('❌  MONGODB_URI is not set. Ensure .env exists at the repo root.');
  process.exit(1);
}

const MONGODB_URI = process.env.MONGODB_URI;

// ─────────────────────────────────────────────────────────────
// Utility: mask password in log output
// ─────────────────────────────────────────────────────────────

function maskUri(uri: string): string {
  try {
    const u = new URL(uri);
    if (u.password) u.password = '***';
    return u.toString();
  } catch {
    return uri.slice(0, 30) + '…';
  }
}

// ─────────────────────────────────────────────────────────────
// ETA helper
// ─────────────────────────────────────────────────────────────

/**
 * Parses a relative ETA label like "T+32h 10m" or "T+6d 02h"
 * and returns the absolute Date by adding the duration to `now`.
 * Used to populate the new absoluteArrivalAt field.
 */
function parseRelativeEta(label: string, now = new Date()): Date {
  let totalMs = 0;
  const dayMatch  = label.match(/(\d+)d/);
  const hourMatch = label.match(/(\d+)h/);
  const minMatch  = label.match(/(\d+)m/);
  if (dayMatch)  totalMs += parseInt(dayMatch[1],  10) * 24 * 60 * 60 * 1000;
  if (hourMatch) totalMs += parseInt(hourMatch[1], 10) * 60 * 60 * 1000;
  if (minMatch)  totalMs += parseInt(minMatch[1],  10) * 60 * 1000;
  return new Date(now.getTime() + totalMs);
}

// ─────────────────────────────────────────────────────────────
// Seed data
// ─────────────────────────────────────────────────────────────

/**
 * Pre-mint ObjectIds so we can cross-reference them in
 * OptimizationLog without a second DB round-trip.
 */
const IDS = {
  // Shipments
  pvg_lax: new Types.ObjectId(),   // MRD-48265  primary simulation target
  fra_bom: new Types.ObjectId(),   // MRD-48271  at-risk (pharma)
  nrt_jfk: new Types.ObjectId(),   // MRD-48259  already rerouted
  sin_rot: new Types.ObjectId(),   // MRD-48238  long-haul transit
  dxb_los: new Types.ObjectId(),   // MRD-48221  delayed

  // RiskAlerts
  hz021: new Types.ObjectId(),     // Arabian Sea cyclone
  hz019: new Types.ObjectId(),     // Rotterdam congestion
};

// ─────────────────────────────────────────────────────────────
// SHIPMENTS
// ─────────────────────────────────────────────────────────────

/**
 * All coordinates are [longitude, latitude] — GeoJSON standard.
 *
 * Great-circle arcs are approximated with intermediate waypoints
 * so the 2dsphere index can run meaningful intersection queries.
 * Routes crossing the antimeridian (±180°) use a continuous
 * waypoint sequence; MongoDB's spherical engine resolves the
 * shortest-arc segment automatically.
 */
const SHIPMENTS = [

  // ── 1. PVG → LAX  (primary simulation target) ────────────
  // Trans-Pacific great circle. Ascends to ~50°N over the
  // Aleutians then descends to California.
  //
  // Waypoints [-170,48.5], [-162,47], [-155,44.5], [-147,41]
  // are INSIDE the triggerSimulation cyclone polygon — verified.
  {
    _id:             IDS.pvg_lax,
    trackingId:      'MRD-48265',
    cargoDescription:'Electronics / semiconductor chips',
    weightTonnes:    4.8,
    fromCode:        'PVG',
    toCode:          'LAX',

    origin: {
      type:        'Point' as const,
      coordinates: [121.4, 31.2] as [number, number],
    },
    destination: {
      type:        'Point' as const,
      coordinates: [-118.2, 34.0] as [number, number],
    },
    // Progress 0.41 → current position is the 6th waypoint
    // [160.0, 47.0] — still in the Western Pacific, approaching
    // the antimeridian but not yet inside the hazard zone.
    currentLocation: {
      type:        'Point' as const,
      coordinates: [160.0, 47.0] as [number, number],
    },

    activeRoute: {
      type: 'LineString' as const,
      coordinates: [
        [121.4,  31.2],   // PVG Shanghai
        [130.0,  34.5],   // Korea Strait
        [140.0,  38.5],   // Sea of Japan
        [150.0,  43.0],   // North Pacific approach
        [160.0,  47.0],   // ← current position
        [170.0,  49.5],   // Near Aleutians (positive lon)
        [-178.0, 49.0],   // Crosses antimeridian
        [-170.0, 48.5],   // ✅ INSIDE cyclone polygon
        [-162.0, 47.0],   // ✅ INSIDE cyclone polygon
        [-155.0, 44.5],   // ✅ INSIDE cyclone polygon
        [-147.0, 41.0],   // ✅ INSIDE cyclone polygon
        [-135.0, 38.0],   // East Pacific
        [-125.0, 36.0],   // Off California coast
        [-118.2, 34.0],   // LAX Los Angeles
      ] as [number, number][],
    },

    progress: 0.41,
    status:   'transit' as const,
    eta: {
      estimatedArrival:  'T+32h 10m',
      originalArrival:   'T+32h 10m',
      delayMinutes:      0,
      absoluteArrivalAt: parseRelativeEta('T+32h 10m'),
    },
  },

  // ── 2. FRA → BOM  (at-risk — Arabian Sea cyclone) ─────────
  // Europe to Mumbai over Turkey, Middle East, and Arabian Sea.
  // Intersects the HZ-021 cyclone hazard zone.
  {
    _id:             IDS.fra_bom,
    trackingId:      'MRD-48271',
    cargoDescription:'Refrigerated pharmaceuticals (cold-chain)',
    weightTonnes:    12.4,
    fromCode:        'FRA',
    toCode:          'BOM',

    origin: {
      type:        'Point' as const,
      coordinates: [8.7, 50.1] as [number, number],
    },
    destination: {
      type:        'Point' as const,
      coordinates: [72.8, 19.0] as [number, number],
    },
    // Progress 0.62 → over the Arabian Sea, inside HZ-021
    currentLocation: {
      type:        'Point' as const,
      coordinates: [60.0, 21.0] as [number, number],
    },

    activeRoute: {
      type: 'LineString' as const,
      coordinates: [
        [8.7,  50.1],   // FRA Frankfurt
        [18.0, 43.0],   // Adriatic
        [28.0, 39.0],   // Aegean / Anatolia
        [38.0, 36.5],   // Eastern Mediterranean
        [46.0, 32.0],   // Mesopotamia
        [53.0, 27.0],   // Persian Gulf approach
        [58.0, 23.0],   // Gulf of Oman
        [63.0, 20.0],   // Arabian Sea (inside HZ-021)
        [68.0, 19.0],   // Approaching Goa
        [72.8, 19.0],   // BOM Mumbai
      ] as [number, number][],
    },

    progress: 0.62,
    status:   'risk' as const,
    eta: {
      estimatedArrival:  'T+18h 22m',
      originalArrival:   'T+14h 50m',
      delayMinutes:      212,
      absoluteArrivalAt: parseRelativeEta('T+18h 22m'),
    },
  },

  // ── 3. NRT → JFK  (already rerouted via Anchorage) ────────
  // Standard trans-Pacific route was blocked by storm front.
  // Routing agent selected northern arc via Anchorage (+4h 35m
  // versus direct, but storm avoidance saves cold-chain risk).
  {
    _id:             IDS.nrt_jfk,
    trackingId:      'MRD-48259',
    cargoDescription:'Automotive parts (precision stamped)',
    weightTonnes:    28.1,
    fromCode:        'NRT',
    toCode:          'JFK',

    origin: {
      type:        'Point' as const,
      coordinates: [140.3, 35.7] as [number, number],
    },
    destination: {
      type:        'Point' as const,
      coordinates: [-73.8, 40.6] as [number, number],
    },
    // Progress 0.58 → over western Canada after Anchorage detour
    currentLocation: {
      type:        'Point' as const,
      coordinates: [-120.0, 52.0] as [number, number],
    },

    // This is the REROUTED path (via Anchorage) already applied
    activeRoute: {
      type: 'LineString' as const,
      coordinates: [
        [140.3,  35.7],   // NRT Tokyo
        [148.0,  40.0],   // North Pacific ascent
        [158.0,  46.0],   // North Pacific
        [168.0,  52.0],   // Approaching Aleutians
        [178.0,  55.0],   // Near dateline
        [-175.0, 57.0],   // Crosses antimeridian
        [-160.0, 59.5],   // Gulf of Alaska
        [-149.9, 61.2],   // Anchorage ANC waypoint (the detour)
        [-135.0, 57.0],   // Inside Passage
        [-120.0, 52.0],   // ← current position (BC, Canada)
        [-100.0, 47.0],   // Canadian Prairies
        [-85.0,  44.5],   // Great Lakes
        [-73.8,  40.6],   // JFK New York
      ] as [number, number][],
    },

    progress: 0.58,
    status:   'rerouted' as const,
    eta: {
      estimatedArrival:  'T+19h 05m',
      originalArrival:   'T+23h 40m',
      delayMinutes:      -275,
      absoluteArrivalAt: parseRelativeEta('T+19h 05m'),
    },
  },

  // ── 4. SIN → ROT  (long-haul transit, Indian Ocean) ───────
  // Singapore to Rotterdam via Indian Ocean, Suez Canal,
  // and Mediterranean. The world's longest regular freight lane.
  {
    _id:             IDS.sin_rot,
    trackingId:      'MRD-48238',
    cargoDescription:'Textiles and apparel (non-perishable)',
    weightTonnes:    22.0,
    fromCode:        'SIN',
    toCode:          'ROT',

    origin: {
      type:        'Point' as const,
      coordinates: [103.8, 1.3] as [number, number],
    },
    destination: {
      type:        'Point' as const,
      coordinates: [4.5, 51.9] as [number, number],
    },
    // Progress 0.28 → crossing the Indian Ocean, south of India
    currentLocation: {
      type:        'Point' as const,
      coordinates: [72.0, 7.0] as [number, number],
    },

    activeRoute: {
      type: 'LineString' as const,
      coordinates: [
        [103.8, 1.3],    // SIN Singapore
        [96.0,  6.0],    // Malacca Strait exit
        [85.0,  8.0],    // Bay of Bengal
        [75.0,  8.0],    // South India
        [65.0, 14.0],    // Arabian Sea
        [53.0, 14.0],    // Gulf of Aden approach
        [45.5, 11.5],    // Gulf of Aden
        [43.0, 12.5],    // Djibouti
        [40.0, 15.0],    // Bab-el-Mandeb
        [37.0, 20.0],    // Red Sea mid
        [34.0, 27.5],    // Red Sea north
        [32.5, 30.5],    // Suez Canal entry
        [32.3, 31.5],    // Port Said
        [24.0, 34.5],    // Eastern Med
        [14.0, 37.0],    // Central Med
        [5.0,  38.5],    // Western Med
        [0.0,  44.5],    // Bay of Biscay approach
        [4.5,  51.9],    // ROT Rotterdam
      ] as [number, number][],
    },

    progress: 0.28,
    status:   'transit' as const,
    eta: {
      estimatedArrival:  'T+6d 02h',
      originalArrival:   'T+6d 02h',
      delayMinutes:      0,
      absoluteArrivalAt: parseRelativeEta('T+6d 02h'),
    },
  },

  // ── 5. DXB → LOS  (delayed — headwind band) ───────────────
  // Dubai to Lagos over the Arabian Sea, East Africa, and the
  // Gulf of Guinea. Weather agent detected persistent headwinds
  // over the Gulf of Aden adding 1h 50m to block time.
  {
    _id:             IDS.dxb_los,
    trackingId:      'MRD-48221',
    cargoDescription:'Heavy industrial machinery (turbine components)',
    weightTonnes:    44.5,
    fromCode:        'DXB',
    toCode:          'LOS',

    origin: {
      type:        'Point' as const,
      coordinates: [55.3, 25.2] as [number, number],
    },
    destination: {
      type:        'Point' as const,
      coordinates: [3.4, 6.5] as [number, number],
    },
    // Progress 0.52 → crossing Ethiopia / Somalia coast
    currentLocation: {
      type:        'Point' as const,
      coordinates: [36.0, 8.0] as [number, number],
    },

    activeRoute: {
      type: 'LineString' as const,
      coordinates: [
        [55.3, 25.2],   // DXB Dubai
        [50.0, 20.0],   // Gulf of Aden approach
        [44.5, 14.0],   // Gulf of Aden (headwind zone)
        [40.5, 10.5],   // Somali coast
        [36.0,  8.0],   // ← current position (Ethiopia coast)
        [28.0,  2.0],   // East Africa
        [18.0, -3.0],   // Central Africa
        [10.0,  4.0],   // Cameroon coast
        [3.4,   6.5],   // LOS Lagos
      ] as [number, number][],
    },

    progress: 0.52,
    status:   'delayed' as const,
    eta: {
      estimatedArrival:  'T+11h 40m',
      originalArrival:   'T+9h 50m',
      delayMinutes:      110,
      absoluteArrivalAt: parseRelativeEta('T+11h 40m'),
    },
  },

];

// ─────────────────────────────────────────────────────────────
// RISK ALERTS
// ─────────────────────────────────────────────────────────────

const RISK_ALERTS = [

  // ── HZ-021: Arabian Sea Cyclone ────────────────────────────
  // Affects MRD-48271 (FRA→BOM refrigerated pharma).
  // Polygon covers the Arabian Sea corridor where the route passes.
  {
    _id:         IDS.hz021,
    alertId:     'HZ-021',
    agentSource: 'Weather' as const,
    severity:    'High' as const,
    title:       'Cyclone Arwen — Arabian Sea',
    description: (
      'Category 3 cyclone with sustained winds of 82 kt and central pressure of 958 mb. ' +
      'Forecast track intersects the FRA→BOM shipping corridor between 60°E and 68°E ' +
      'at latitudes 10°N–22°N. Expected landfall in 14 hours. ' +
      'Cold-chain cargo breach probability estimated at 0.92.'
    ),
    hazardZone: {
      type:        'Polygon' as const,
      // Closed polygon (first = last) over the Arabian Sea
      // Covers the lat/lon window the FRA→BOM route transits
      coordinates: [
        [
          [54.0, 20.0],
          [62.0, 23.0],
          [70.0, 20.0],
          [72.0, 13.0],
          [68.0,  7.0],
          [60.0,  6.0],
          [55.0, 10.0],
          [53.0, 16.0],
          [54.0, 20.0],   // closed
        ] as [number, number][],
      ],
    },
    affectedShipmentIds: ['MRD-48271', 'MRD-48221'],
    isActive:            true,
    expectedClearanceAt: new Date(Date.now() + 14 * 60 * 60 * 1000), // +14 h
  },

  // ── HZ-019: Rotterdam Port Congestion ─────────────────────
  // Traffic alert — port dwell time 38h vs 14h baseline.
  // Will affect MRD-48238 (SIN→ROT) when it arrives.
  {
    _id:         IDS.hz019,
    alertId:     'HZ-019',
    agentSource: 'Traffic' as const,
    severity:    'Medium' as const,
    title:       'Port of Rotterdam — Severe Berth Congestion',
    description: (
      'Port dwell time has risen to 38 hours against a 30-day baseline of 14 hours (+171%). ' +
      'Vessel queue depth: 23 ships. Crane outage on Maasvlakte II reducing throughput by 35%. ' +
      'No reroute recommended — holding pattern advised until berth queue clears at 16:00 UTC.'
    ),
    hazardZone: {
      type:        'Polygon' as const,
      // Closed polygon over the port approach area
      coordinates: [
        [
          [2.5,  52.5],
          [6.5,  53.0],
          [7.5,  51.5],
          [5.5,  50.5],
          [1.5,  51.2],
          [2.5,  52.5],   // closed
        ] as [number, number][],
      ],
    },
    affectedShipmentIds: ['MRD-48238'],
    isActive:            true,
    expectedClearanceAt: new Date(Date.now() + 8 * 60 * 60 * 1000), // +8 h
  },

];

// ─────────────────────────────────────────────────────────────
// OPTIMIZATION LOGS (pre-existing history)
// ─────────────────────────────────────────────────────────────

const OPTIMIZATION_LOGS = [

  // ── OPT-4920: EXECUTED — NRT→JFK rerouted via Anchorage ───
  // Shows a completed reroute in the Reasoning Panel.
  // The proposedRoute matches the activeRoute already applied
  // to MRD-48259 above.
  {
    optId: 'OPT-4920',

    shipmentId:         IDS.nrt_jfk,
    alertId:            IDS.hz021,          // storm front triggered this
    shipmentTrackingId: 'MRD-48259',
    alertHumanId:       'HZ-021',

    confidenceScore:   0.97,
    aiReasoning:       (
      'Storm front HZ-014 blocks the primary 38°N Pacific corridor with wind gusts ' +
      'exceeding 95 kt. The Anchorage northern arc was selected from 3 evaluated alternates. ' +
      'Risk score 0.06 vs 0.91 on the direct route. Fuel delta +3.1% is within carrier tolerance. ' +
      'Automotive parts are non-perishable — delay penalty applies at $400/hr. ' +
      'Total delay cost of the detour ($1,740) is far below storm damage exposure ($280,000). ' +
      'Confidence 0.97 exceeds the 0.85 auto-approve threshold.'
    ),
    selectedAlternate: 'Northern arc via ANC (Anchorage)',

    proposedRoute: {
      type: 'LineString' as const,
      coordinates: [
        [140.3,  35.7],
        [148.0,  40.0],
        [158.0,  46.0],
        [168.0,  52.0],
        [178.0,  55.0],
        [-175.0, 57.0],
        [-160.0, 59.5],
        [-149.9, 61.2],
        [-135.0, 57.0],
        [-120.0, 52.0],
        [-100.0, 47.0],
        [-85.0,  44.5],
        [-73.8,  40.6],
      ] as [number, number][],
    },

    metrics: {
      originalETA_h:       23.67,
      proposedETA_h:       19.08,
      timeSavedMinutes:    -275,
      spoilageAvoided_usd: 0,
      fuelDeltaPct:        3.1,
    },

    geminiAction: 'AUTO_APPROVED' as const,
    status:       'EXECUTED' as const,
    resolvedBy:   'system (auto-approved)',
    resolvedAt:   new Date(Date.now() - 90 * 60 * 1000), // 90 min ago
  },

];

// ─────────────────────────────────────────────────────────────
// Main seeder function
// ─────────────────────────────────────────────────────────────

async function seed(): Promise<void> {
  console.log('');
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║         Meridian — Database Seeder               ║');
  console.log('╚══════════════════════════════════════════════════╝');
  console.log('');

  // ── Connect ──────────────────────────────────────────────
  console.log(`🔌  Connecting to MongoDB…`);
  console.log(`    URI: ${maskUri(MONGODB_URI)}`);

  await mongoose.connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 8_000,
  });

  console.log('✅  Connected.\n');

  // Ensure 2dsphere indexes exist before we insert GeoJSON data
  await mongoose.connection.syncIndexes();
  console.log('📐  2dsphere indexes synchronized.\n');

  // ── Clear collections ────────────────────────────────────
  console.log('🗑   Clearing existing documents…');

  const [delShipments, delAlerts, delLogs] = await Promise.all([
    Shipment       .deleteMany({}),
    RiskAlert      .deleteMany({}),
    OptimizationLog.deleteMany({}),
  ]);

  console.log(`    Shipments removed:        ${delShipments.deletedCount}`);
  console.log(`    RiskAlerts removed:       ${delAlerts.deletedCount}`);
  console.log(`    OptimizationLogs removed: ${delLogs.deletedCount}`);
  console.log('');

  // ── Insert Shipments ─────────────────────────────────────
  console.log('🚢  Inserting shipments…');
  const insertedShipments = await Shipment.insertMany(SHIPMENTS);
  insertedShipments.forEach(s => {
    const indicator =
      s.status === 'risk'     ? '🔴' :
      s.status === 'delayed'  ? '🟠' :
      s.status === 'rerouted' ? '🟣' : '🟢';
    console.log(`    ${indicator}  ${s.trackingId}  ${s.fromCode} → ${s.toCode}  [${s.status}]`);
  });
  console.log('');

  // ── Insert RiskAlerts ────────────────────────────────────
  console.log('⚠️   Inserting risk alerts…');
  const insertedAlerts = await RiskAlert.insertMany(RISK_ALERTS);
  insertedAlerts.forEach(a => {
    const icon = a.severity === 'High' ? '🔴' : a.severity === 'Medium' ? '🟠' : '🟡';
    console.log(`    ${icon}  ${a.alertId}  [${a.agentSource}/${a.severity}]  ${a.title}`);
  });
  console.log('');

  // ── Insert OptimizationLogs ──────────────────────────────
  console.log('🤖  Inserting optimization logs…');
  const insertedLogs = await OptimizationLog.insertMany(OPTIMIZATION_LOGS);
  insertedLogs.forEach(l => {
    const icon = l.status === 'EXECUTED' ? '✅' : l.status === 'PENDING' ? '⏳' : '❌';
    console.log(`    ${icon}  ${l.optId}  → ${l.shipmentTrackingId}  [${l.status}]  confidence: ${l.confidenceScore}`);
  });
  console.log('');

  // ── Geospatial intersection smoke-test ───────────────────
  console.log('📍  Smoke-testing geospatial intersection…');

  const cyclonePolygon = {
    type:        'Polygon' as const,
    coordinates: [
      [
        [-175, 48], [-160, 50], [-150, 46], [-145, 38],
        [-155, 34], [-170, 36], [-178, 42], [-175, 48],
      ] as [number, number][],
    ],
  };

  const intersectingShipments = await Shipment.find({
    activeRoute: {
      $geoIntersects: { $geometry: cyclonePolygon },
    },
  }).select('trackingId fromCode toCode');

  if (intersectingShipments.length === 0) {
    console.log('');
    console.error('❌  CRITICAL: No shipment routes intersect the cyclone polygon!');
    console.error('    The triggerSimulation endpoint will fail to find a target.');
    console.error('    Check the PVG→LAX activeRoute coordinates in this seeder.');
    process.exit(1);
  }

  intersectingShipments.forEach(s => {
    console.log(`    ✅  ${s.trackingId} (${s.fromCode} → ${s.toCode}) intersects the cyclone zone`);
  });

  console.log('');
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║  ✅  Seed complete — Meridian is ready           ║');
  console.log('╠══════════════════════════════════════════════════╣');
  console.log(`║  Shipments:        ${String(insertedShipments.length).padEnd(29)}║`);
  console.log(`║  Risk Alerts:      ${String(insertedAlerts.length).padEnd(29)}║`);
  console.log(`║  Opt. Logs:        ${String(insertedLogs.length).padEnd(29)}║`);
  console.log('╠══════════════════════════════════════════════════╣');
  console.log('║  Next steps:                                     ║');
  console.log('║  1. npx ts-node server.ts  (start the API)       ║');
  console.log('║  2. GET  /api/map-state    (verify data loads)   ║');
  console.log('║  3. POST /api/simulate     (trigger Gemini)      ║');
  console.log('╚══════════════════════════════════════════════════╝');
  console.log('');

  await mongoose.connection.close();
  console.log('🔌  MongoDB connection closed.');
}

// ─────────────────────────────────────────────────────────────
// Entry point
// ─────────────────────────────────────────────────────────────

seed()
  .then(() => process.exit(0))
  .catch((err: unknown) => {
    console.error('\n❌  Seeder failed:');
    console.error(err instanceof Error ? err.stack : err);
    mongoose.connection.close().finally(() => process.exit(1));
  });
