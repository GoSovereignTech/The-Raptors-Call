// src/lib/personIcons.js
// Movement icons + threat colors + speed-to-movement mapping.
// Icons use `currentColor` so they inherit the parent's text color —
// this is what lets us recolor them (friend/enemy/unknown/self) with one prop.

export const MOVEMENT_SVG = {
  idle: `
    <svg viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="4.5" r="2.5"/>
      <path d="M9.5 8 L14.5 8 L15.5 14 L14 14 L13.5 20 L12.5 20 L12 15 L11.5 20 L10.5 20 L10 14 L8.5 14 Z"/>
    </svg>`,

  walk: `
    <svg viewBox="0 0 24 24" fill="currentColor">
      <circle cx="13" cy="4" r="2.2"/>
      <path d="M13.5 6.5 L10 11.5 L11 15.5 L8 21 L9.3 21 L12 16.5 L13 12.5 L15 16 L14.5 21 L15.8 21 L16.3 15.5 L13.5 11 Z"/>
      <path d="M11.5 9 L15 12 L18 11 L18 12.3 L14.7 13.5 L11 10.5 Z"/>
    </svg>`,

  run: `
    <svg viewBox="0 0 24 24" fill="currentColor">
      <circle cx="15.5" cy="4" r="2"/>
      <path d="M15 6.5 L11 11 L13.5 14 L10 21 L11.3 21 L14.5 15 L16 11.5 L18 15 L17.5 21 L18.8 21 L19.3 15 L15 10 Z"/>
      <path d="M12.5 9 L16 12 L20 10.5 L20 11.8 L16 13.5 L12 10.5 Z"/>
    </svg>`,

  bike: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="6.5" cy="16.5" r="3.5"/>
      <circle cx="17.5" cy="16.5" r="3.5"/>
      <path d="M6.5 16.5 L10 8 L14.5 8 L17.5 16.5"/>
      <path d="M10 8 L13.5 8"/>
      <circle cx="12.5" cy="5.5" r="1.5" fill="currentColor" stroke="none"/>
      <path d="M12.5 7 L12 8"/>
    </svg>`,

  car: `
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M5 15 L6.5 9.5 C6.8 8.6 7.6 8 8.5 8 L15.5 8 C16.4 8 17.2 8.6 17.5 9.5 L19 15 L19 17 C19 17.6 18.6 18 18 18 L17 18 C16.4 18 16 17.6 16 17 L16 16 L8 16 L8 17 C8 17.6 7.6 18 7 18 L6 18 C5.4 18 5 17.6 5 17 Z M7.5 11 L16.5 11 L15.5 9.5 L8.5 9.5 Z"/>
    </svg>`,

  plane: `
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2 L13 10 L22 12.5 L22 14 L13 13 L13 18.5 L16 20.5 L16 21.5 L12 20.5 L8 21.5 L8 20.5 L11 18.5 L11 13 L2 14 L2 12.5 L11 10 Z"/>
    </svg>`,
};

// Speed (m/s) → movement state
export function movementFromSpeed(mps) {
  if (mps == null) return null;
  if (mps < 0.3) return 'idle';
  if (mps < 2.0) return 'walk';
  if (mps < 5.0) return 'run';
  if (mps < 8.0) return 'bike';
  if (mps < 30) return 'car';
  return 'plane';
}

// Threat level → color. `self` and abduction-pattern override.
export const THREAT_COLORS = {
  friend: '#10b981',
  enemy: '#f43f5e',
  unknown: '#eab308',
  self: '#22d3ee',
};

export function colorForEntity(entity) {
  // Self
  if (entity.isSelf) {
    // Abduction pattern: self moving at car/plane speed unexpectedly
    if (entity.movement === 'car' || entity.movement === 'plane') {
      return THREAT_COLORS.enemy;
    }
    return THREAT_COLORS.self;
  }
  // Enemies
  if (entity.threat === 'enemy' || entity.threat === 'CONFIRMED_OPPOSITION' || entity.threat === 'threat') {
    return THREAT_COLORS.enemy;
  }
  // Friends
  if (entity.threat === 'friend' || entity.threat === 'CLEAR') {
    return THREAT_COLORS.friend;
  }
  // Unknown / stranger
  return THREAT_COLORS.unknown;
}

// Speed label for accessibility / tooltips
export function movementLabel(movement) {
  return {
    idle: 'Idle',
    walk: 'Walking',
    run: 'Running',
    bike: 'Cycling',
    car: 'In vehicle',
    plane: 'In air',
  }[movement] || 'Unknown';
}