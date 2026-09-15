// src/lib/entities.js
// Shared shape for any detected object on the map.

export const THREAT = {
  FRIEND: 'friend',      // green
  UNKNOWN: 'unknown',    // yellow (default)
  ENEMY: 'enemy',        // red
};

export const MOVEMENT = {
  IDLE: 'idle',
  WALK: 'walk',
  RUN: 'run',
  BIKE: 'bike',
  CAR: 'car',
  PLANE: 'plane',
};

export const ALARM = {
  OFF: 'off',
  LOUD: 'loud',
  SILENT: 'silent',
};

// Build a normalized entity from a raw packet
export function entityFromPacket(packet) {
  const d = packet.d || {};
  return {
    id: packet.id,
    nid: packet.nid,
    sim: !!packet.sim,
    lat: d.lat,
    lon: d.lon,
    accuracy_m: d.accuracy_m ?? null,     // for variance circle
    threat: THREAT.UNKNOWN,                // default
    movement: d.mot || MOVEMENT.IDLE,
    nickname: d.nickname || null,
    battery: d.bat ?? null,
    alarm: d.mode === 'SCR' ? ALARM.LOUD : d.mode === 'SIL' ? ALARM.SILENT : ALARM.OFF,
    alarmOrigin: d.ts_origin ? { lat: d.lat, lon: d.lon, ts: d.ts_origin } : null,
    sensors: d.src || null,                // bitmask
    confidence: d.conf || null,
    tts: d.tts || null,
    lastUpdate: packet.ts,
    statusHistory: [],                     // [{threat, reason, ts}]
  };
}

// Merge a new packet into an existing entity
export function mergeEntity(existing, packet) {
  const next = entityFromPacket(packet);
  return {
    ...existing,
    ...next,
    // Preserve user-set fields
    threat: existing.threat,               // user's choice persists
    statusHistory: existing.statusHistory,
  };
}

export function threatColor(threat) {
  if (threat === THREAT.FRIEND) return '#10b981';
  if (threat === THREAT.ENEMY) return '#f43f5e';
  return '#eab308';                        // UNKNOWN
}

// Simple SVG path strings for movement (used in divIcon HTML)
export const MOVEMENT_SVG = {
  idle:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="7" r="3"/><path d="M12 10v9M8 22h8"/></svg>',
  walk:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="13" cy="4" r="2"/><path d="M13 6l-2 6 3 3 1 6M11 12l-4 4M14 15l3 4"/></svg>',
  run:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="15" cy="4" r="2"/><path d="M15 6l-3 5 4 3 1 7M12 11l-5 3M16 14l3 3"/></svg>',
  bike:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="6" cy="17" r="3"/><circle cx="18" cy="17" r="3"/><path d="M6 17l3-8h6l3 8M9 9h6"/></svg>',
  car:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M5 15h14l-2-5H7z"/><circle cx="8" cy="17" r="1.5"/><circle cx="16" cy="17" r="1.5"/></svg>',
  plane: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M12 2l2 8 8 3v3l-8-1-1 5-2 2-1-7-7-1v-3l8-3z"/></svg>',
};

// Derive movement from speed (m/s) if not provided
export function movementFromSpeed(mps) {
  if (mps == null) return null;
  if (mps < 0.3) return 'idle';
  if (mps < 2.0) return 'walk';
  if (mps < 5.0) return 'run';
  if (mps < 8.0) return 'bike';
  if (mps < 100) return 'car';
  return 'plane';
}