// src/lib/entityMatcher.js
// Decides which existing person (if any) a sensor trigger belongs to.
// Also computes movement state from speed.

import { movementFromSpeed } from './personIcons.js';

// Max plausible speed (m/s) per movement state.
// Used to compute "where could this person have travelled since last update?"
export const SPEED_TABLE = {
  idle:  0.5,
  walk:  1.5,
  run:   4.5,
  bike:  7.0,
  car:   25,
  plane: 200,
};

// Buffer factor — allow more travel than strictly possible,
// because real humans accelerate, and packets can arrive out of order.
const BUFFER = 1.5;
const MIN_RADIUS_M = 20;

// Haversine distance in meters.
export function haversineMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Given a sensor trigger and the current list of entities,
// return the ID of the nearest plausible person, or null.
export function findNearestPlausiblePerson(trigger, entities) {
  if (!trigger || trigger.lat == null || trigger.lng == null) return null;

  const now = trigger.ts || Math.floor(Date.now() / 1000);
  let best = null;
  let bestDist = Infinity;

  for (const e of entities) {
    // Never move infrastructure
    if (e.isInfrastructure) continue;
    // Never move "self" from a sensor trigger
    if (e.isSelf) continue;
    // Only match against identified friends. Unknowns don't absorb other unknowns.
    const isFriend = e.threat === 'friend' || e.threat === 'CLEAR';
    if (!isFriend) continue;

    const lastTs = e.lastUpdate || now;
    const elapsed = Math.max(0, now - lastTs);
    const maxSpeed = SPEED_TABLE[e.movement] || SPEED_TABLE.walk;
    const maxDist = Math.max(maxSpeed * elapsed * BUFFER, MIN_RADIUS_M);

    const dist = haversineMeters(e.lat, e.lng ?? e.lon, trigger.lat, trigger.lng);
    if (dist <= maxDist && dist < bestDist) {
      best = e;
      bestDist = dist;
    }
  }

  return best;
}

// Derive a movement state from an entity, given an optional explicit mot/speed.
export function resolveMovement(mot, speed, fallback = 'idle') {
  if (mot) return mot;
  if (speed != null) return movementFromSpeed(speed) || fallback;
  return fallback;
}

// Generate a stable ID for a new entity.
export function generateEntityId(prefix = 'UNK') {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}