import type { Vehicle } from '@/lib/types';

export const FLEET: Vehicle[] = [
  { id: 'VEH-118', mode: 'OCEAN', callsign: 'MV Meridian 07',   carrier: 'Maersk',          capacityTonnes: 155_000, utilisation: 0.87, location: 'North Pacific',      status: 'active',      lastSeen: new Date(Date.now() - 90_000).toISOString() },
  { id: 'VEH-204', mode: 'OCEAN', callsign: 'MV Aurora',          carrier: 'CMA CGM',         capacityTonnes: 180_000, utilisation: 0.62, location: 'Suez Canal',          status: 'active',      lastSeen: new Date(Date.now() - 60_000).toISOString() },
  { id: 'VEH-311', mode: 'AIR',   callsign: 'LH-8801',            carrier: 'Lufthansa Cargo', capacityTonnes: 112,     utilisation: 0.94, location: 'FL-340 · 38°N 52°E', status: 'active',      lastSeen: new Date(Date.now() - 30_000).toISOString() },
  { id: 'VEH-327', mode: 'AIR',   callsign: 'CX-2042',            carrier: 'Cathay Cargo',    capacityTonnes: 103,     utilisation: 0.77, location: 'HKG apron',           status: 'idle',        lastSeen: new Date(Date.now() - 1_200_000).toISOString() },
  { id: 'VEH-412', mode: 'ROAD',  callsign: 'DB-EU-4412',         carrier: 'DB Schenker',     capacityTonnes: 40,      utilisation: 0.80, location: 'A7 · Würzburg',       status: 'active',      lastSeen: new Date(Date.now() - 45_000).toISOString() },
  { id: 'VEH-418', mode: 'ROAD',  callsign: 'DHL-EU-1882',        carrier: 'DHL Freight',     capacityTonnes: 24,      utilisation: 0.45, location: 'Antwerp hub',         status: 'idle',        lastSeen: new Date(Date.now() - 600_000).toISOString() },
  { id: 'VEH-501', mode: 'RAIL',  callsign: 'CNR-PVG-BLR-01',     carrier: 'Concor',          capacityTonnes: 5_800,   utilisation: 0.66, location: 'En route SE Asia',    status: 'active',      lastSeen: new Date(Date.now() - 120_000).toISOString() },
  { id: 'VEH-522', mode: 'RAIL',  callsign: 'EU-FRA-IST-09',      carrier: 'DB Cargo',        capacityTonnes: 4_200,   utilisation: 0.0,  location: 'Frankfurt yard',      status: 'maintenance', lastSeen: new Date(Date.now() - 3_600_000 * 2).toISOString() },
  { id: 'VEH-608', mode: 'OCEAN', callsign: 'MV Himalaya',        carrier: 'ONE',             capacityTonnes: 140_000, utilisation: 0.92, location: 'Indian Ocean',        status: 'active',      lastSeen: new Date(Date.now() - 80_000).toISOString() },
  { id: 'VEH-634', mode: 'AIR',   callsign: 'EK-9204',            carrier: 'Emirates SkyCargo', capacityTonnes: 95,    utilisation: 0.88, location: 'DXB departure',       status: 'active',      lastSeen: new Date(Date.now() - 20_000).toISOString() },
  { id: 'VEH-702', mode: 'ROAD',  callsign: 'Concor-IN-332',      carrier: 'Concor',          capacityTonnes: 28,      utilisation: 0.0,  location: 'Offline · Chennai',   status: 'offline',     lastSeen: new Date(Date.now() - 3_600_000 * 14).toISOString() },
];
