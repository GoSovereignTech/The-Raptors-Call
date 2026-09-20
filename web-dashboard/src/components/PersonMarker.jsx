// src/components/PersonMarker.jsx
// Person icon with movement state, threat color, alarm bell, and optional trail.
// Use for any entity that represents a human (self, friend, unknown, enemy).

import { Marker } from 'react-leaflet';
import L from 'leaflet';
import {
  MOVEMENT_SVG,
  movementFromSpeed,
  colorForEntity,
} from '../lib/personIcons.js';
 

// ─── The main marker ───
export function PersonMarker({ entity, onSelect, highlighted = false }) {
  const color = colorForEntity(entity);
  const movement = entity.movement || movementFromSpeed(entity.speed) || 'idle';
  const svg = MOVEMENT_SVG[movement] || MOVEMENT_SVG.idle;
  const size = entity.isSelf ? 44 : 36;
  const half = size / 2;

  const isEnemy = entity.threat === 'enemy'
    || entity.threat === 'CONFIRMED_OPPOSITION'
    || entity.threat === 'threat';
  const isUnknown = !isEnemy
    && !entity.isSelf
    && entity.threat !== 'friend'
    && entity.threat !== 'CLEAR';

  const badge = isEnemy
    ? `<div style="position:absolute;top:-3px;left:-3px;width:14px;height:14px;border-radius:50%;background:var(--threat-enemy);color:#fff;font-size:10px;font-weight:900;display:flex;align-items:center;justify-content:center;border:1.5px solid var(--marker-outline);">!</div>`
    : isUnknown
    ? `<div style="position:absolute;top:-3px;left:-3px;width:14px;height:14px;border-radius:50%;background:var(--threat-unknown);color:#0c1a28;font-size:10px;font-weight:900;display:flex;align-items:center;justify-content:center;border:1.5px solid var(--marker-outline);">?</div>`
    : '';

  const alarmBadge = entity.alarm && entity.alarm !== 'off'
    ? `<div style="position:absolute;top:-6px;right:-6px;width:16px;height:16px;border-radius:50%;background:var(--threat-enemy);color:#fff;display:flex;align-items:center;justify-content:center;border:1.5px solid var(--marker-outline);animation:personAlarmPulse 1s ease-in-out infinite;">
         <svg viewBox="0 0 24 24" width="9" height="9" fill="currentColor">
           <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/>
           <path d="M13.7 21a2 2 0 0 1-3.4 0"/>
         </svg>
       </div>`
    : '';

  const highlightRing = highlighted
    ? `<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:${size + 16}px;height:${size + 16}px;border-radius:50%;border:2px solid ${color};animation:highlightPulse 1.5s ease-in-out infinite;pointer-events:none;"></div>`
    : '';

  const icon = L.divIcon({
    className: 'person-marker',
    html: `
      <div style="position:relative;width:${size}px;height:${size}px;">
        ${highlightRing}
        <div style="
          position:absolute;inset:0;
          display:flex;align-items:center;justify-content:center;
          color:${color};
          filter:
            drop-shadow(1px 0 0 var(--marker-outline))
            drop-shadow(-1px 0 0 var(--marker-outline))
            drop-shadow(0 1px 0 var(--marker-outline))
            drop-shadow(0 -1px 0 var(--marker-outline))
            drop-shadow(1px 1px 0 var(--marker-outline))
            drop-shadow(-1px -1px 0 var(--marker-outline))
            drop-shadow(1px -1px 0 var(--marker-outline))
            drop-shadow(-1px 1px 0 var(--marker-outline))
            drop-shadow(0 2px 4px rgba(0,0,0,0.5));
        ">${svg}</div>
        ${badge}
        ${alarmBadge}
      </div>
      <style>
        @keyframes personAlarmPulse {
          0%,100% { transform:scale(1); }
          50% { transform:scale(1.25); }
        }
        @keyframes highlightPulse {
          0%,100% { transform:translate(-50%,-50%) scale(0.95); opacity:0.8; }
          50% { transform:translate(-50%,-50%) scale(1.15); opacity:0.2; }
        }
        .person-marker svg { width:100%; height:100%; }
      </style>
    `,
    iconSize: [size, size],
    iconAnchor: [half, half],
  });

  return (
    <Marker
      position={[entity.lat, entity.lon ?? entity.lng]}
      icon={icon}
      eventHandlers={{ click: () => onSelect?.(entity) }}
    />
  );
}

export function PersonGhost({ entity, ageSec }) {
  const opacity = Math.max(0, 1 - ageSec / 3);
  if (opacity <= 0.02) return null;

  const color = colorForEntity(entity);
  const movement = entity.movement || 'idle';
  const svg = MOVEMENT_SVG[movement] || MOVEMENT_SVG.idle;
  const size = 28;
  const half = size / 2;

  const icon = L.divIcon({
  className: 'person-ghost',
  html: `
    <div style="
      width:${size}px;height:${size}px;
      display:flex;align-items:center;justify-content:center;
      color:${color};
      opacity:${opacity.toFixed(2)};
      filter:
        drop-shadow(1px 0 0 var(--marker-outline))
        drop-shadow(-1px 0 0 var(--marker-outline))
        drop-shadow(0 1px 0 var(--marker-outline))
        drop-shadow(0 -1px 0 var(--marker-outline));
    ">${svg}</div>
    <style>.person-ghost svg { width:100%; height:100%; }</style>
  `,
  iconSize: [size, size],
  iconAnchor: [half, half],
});

  return (
    <Marker
      position={[entity.lat, entity.lon ?? entity.lng]}
      icon={icon}
      interactive={false}
      keyboard={false}
      zIndexOffset={-150}
    />
  );
}

// ─── Trail — fading dots behind the current position ───
export function PersonTrail({ points, entity, maxPoints = 12 }) {
  if (!points || points.length < 2) return null;

  const recent = points.slice(-maxPoints);
  const color = colorForEntity(entity);

  return recent.map((p, i) => {
    const t = i / (recent.length - 1); // 0 = oldest, 1 = newest
    const opacity = 0.08 + t * 0.5;
    const size = Math.round(3 + t * 6);
    const half = size / 2;

    const icon = L.divIcon({
      className: 'person-trail-dot',
      html: `<div style="
        width:${size}px;height:${size}px;
        border-radius:50%;
        background:${color};
        opacity:${opacity.toFixed(2)};
        box-shadow:0 0 ${size}px ${color}55;
      "></div>`,
      iconSize: [size, size],
      iconAnchor: [half, half],
    });

    return (
      <Marker
        key={`${p.lat}-${p.lon ?? p.lng}-${i}`}
        position={[p.lat, p.lon ?? p.lng]}
        icon={icon}
        interactive={false}
        keyboard={false}
        zIndexOffset={-200 + i}
      />
    );
  });
}