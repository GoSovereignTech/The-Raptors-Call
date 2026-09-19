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
export function PersonMarker({ entity, onSelect }) {
  const color = colorForEntity(entity);
  const movement = entity.movement || movementFromSpeed(entity.speed) || 'idle';
  const svg = MOVEMENT_SVG[movement] || MOVEMENT_SVG.idle;
  const size = entity.isSelf ? 48 : 40;
  const innerSize = Math.round(size * 0.72);
  const half = size / 2;

  // ─── Badge for enemy/unknown (colorblind-safe signal) ───
  const isEnemy = entity.threat === 'enemy'
    || entity.threat === 'CONFIRMED_OPPOSITION'
    || entity.threat === 'threat';
  const isUnknown = !isEnemy
    && !entity.isSelf
    && entity.threat !== 'friend'
    && entity.threat !== 'CLEAR';

  const badge = isEnemy
    ? `<div style="position:absolute;top:-4px;left:-4px;width:16px;height:16px;border-radius:50%;background:var(--threat-enemy);color:#040b14;font-size:11px;font-weight:900;display:flex;align-items:center;justify-content:center;border:2px solid var(--beacon-stroke);">!</div>`
    : isUnknown
    ? `<div style="position:absolute;top:-4px;left:-4px;width:16px;height:16px;border-radius:50%;background:var(--threat-unknown);color:#040b14;font-size:11px;font-weight:900;display:flex;align-items:center;justify-content:center;border:2px solid var(--beacon-stroke);">?</div>`
    : '';

  const alarmBadge = entity.alarm && entity.alarm !== 'off'
    ? `<div style="position:absolute;top:-8px;right:-8px;width:18px;height:18px;border-radius:50%;background:var(--threat-enemy);color:#fff;display:flex;align-items:center;justify-content:center;border:2px solid var(--beacon-stroke);animation:personAlarmPulse 1s ease-in-out infinite;">
         <svg viewBox="0 0 24 24" width="10" height="10" fill="currentColor">
           <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/>
           <path d="M13.7 21a2 2 0 0 1-3.4 0"/>
         </svg>
       </div>`
    : '';

  const nicknameLabel = entity.nickname
  ? `<div style="position:absolute;top:100%;left:50%;
      transform:translateX(-50%);margin-top:2px;
      white-space:nowrap;font-size:9px;
      font-weight:600;
      color:var(--badge-text, #0c1a28);
      background:var(--badge-bg, #ffffff);
      padding:1px 6px;border-radius:8px;
      border:1px solid var(--badge-border, rgba(12,26,40,0.15));">${entity.nickname}</div>`
  : '';

  const icon = L.divIcon({
    className: 'person-marker',
    html: `
      <div style="position:relative;width:${size}px;height:${size}px;">
        <div style="
          position:absolute;inset:0;
          border-radius:50%;
          background:var(--marker-bg);
          border:2px solid ${color};
          box-shadow:0 0 14px ${color}, 0 4px 12px rgba(0,0,0,0.4);
        "></div>
        <div style="
          position:absolute;top:50%;left:50%;
          transform:translate(-50%,-50%);
          width:${innerSize}px;height:${innerSize}px;
          display:flex;align-items:center;justify-content:center;
          color:${color};
        ">${svg}</div>
        ${badge}
        ${alarmBadge}
        ${nicknameLabel}
      </div>
      <style>
        @keyframes personAlarmPulse {
          0%,100% { transform:scale(1); }
          50% { transform:scale(1.25); }
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
        border-radius:50%;
        background:var(--marker-bg);
        border:1.5px solid ${color};
        opacity:${opacity.toFixed(2)};
        display:flex;align-items:center;justify-content:center;
        color:${color};
        box-shadow:0 0 6px ${color};
      ">
        <div style="width:70%;height:70%;display:flex;align-items:center;justify-content:center;">
          ${svg}
        </div>
      </div>
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