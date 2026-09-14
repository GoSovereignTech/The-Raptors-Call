// src/components/OffScreenIndicators.jsx
// Border indicators showing where off-screen markers are.
// 8 zones: N, NE, E, SE, S, SW, W, NW

import { useEffect, useState } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

const ZONES = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

// 0° = east, 90° = south (Leaflet screen coords), 180° = west, 270° = north
function angleToZone(deg) {
  const d = ((deg % 360) + 360) % 360;
  if (d >= 337.5 || d < 22.5)   return 'E';
  if (d >= 22.5  && d < 67.5)   return 'SE';
  if (d >= 67.5  && d < 112.5)  return 'S';
  if (d >= 112.5 && d < 157.5)  return 'SW';
  if (d >= 157.5 && d < 202.5)  return 'W';
  if (d >= 202.5 && d < 247.5)  return 'NW';
  if (d >= 247.5 && d < 292.5)  return 'N';
  return 'NE';
}

function threatColor(threat) {
  if (threat === 'FRIEND' || threat === 'CLEAR' || threat === 'friend') return '#10b981';
  if (threat === 'ENEMY' || threat === 'CONFIRMED_OPPOSITION' || threat === 'threat') return '#f43f5e';
  return '#eab308'; // stranger / unknown
}

function threatPriority(threat) {
  if (threat === 'threat' || threat === 'CONFIRMED_OPPOSITION') return 3;
  if (threat === 'FRIEND' || threat === 'CLEAR') return 1;
  return 2; // stranger
}

// CSS for each zone — position on border, orientation
const ZONE_STYLE = {
  N:  'top-3 left-1/2 -translate-x-1/2 w-24 h-2 rounded-full',
  NE: 'top-3 right-3 w-16 h-2 rounded-full',
  E:  'top-1/2 right-3 -translate-y-1/2 w-2 h-24 rounded-full',
  SE: 'bottom-20 right-3 w-16 h-2 rounded-full',
  S:  'bottom-20 left-1/2 -translate-x-1/2 w-24 h-2 rounded-full',
  SW: 'bottom-20 left-3 w-16 h-2 rounded-full',
  W:  'top-1/2 left-3 -translate-y-1/2 w-2 h-24 rounded-full',
  NW: 'top-3 left-3 w-16 h-2 rounded-full',
};

export function OffScreenIndicators({ markers, onZoneClick }) {
  const map = useMap();
  const [zones, setZones] = useState({});

  useEffect(() => {
    function update() {
      const bounds = map.getBounds();
      const center = bounds.getCenter();
      const centerPx = map.latLngToContainerPoint(center);
      const next = {};

      for (const m of markers) {
        if (typeof m.lat !== 'number' || typeof m.lng !== 'number') continue;

        const ll = L.latLng(m.lat, m.lng);
        if (bounds.contains(ll)) continue; // on-screen — skip

        const px = map.latLngToContainerPoint(ll);
        const dx = px.x - centerPx.x;
        const dy = px.y - centerPx.y;
        const angle = (Math.atan2(dy, dx) * 180 / Math.PI + 360) % 360;
        const zone = angleToZone(angle);

        const color = threatColor(m.threat);
        const priority = threatPriority(m.threat);

        if (!next[zone] || priority > next[zone].priority) {
          next[zone] = { ...m, color, priority, angle };
        }
      }

      setZones(next);
    }

    update();
    map.on('move', update);
    map.on('zoomend', update);
    map.on('resize', update);

    return () => {
      map.off('move', update);
      map.off('zoomend', update);
      map.off('resize', update);
    };
  }, [map, markers]);

  return (
    <div className="pointer-events-none absolute inset-0 z-[550]">
      {ZONES.map((zoneId) => {
        const marker = zones[zoneId];
        if (!marker) return null;

        return (
          <button
            key={zoneId}
            onClick={() => onZoneClick(marker)}
            className={`pointer-events-auto absolute ${ZONE_STYLE[zoneId]} animate-pulse`}
            style={{
              background: marker.color,
              boxShadow: `0 0 16px ${marker.color}, 0 0 32px ${marker.color}88`,
            }}
            aria-label={`Show marker at ${zoneId}`}
          />
        );
      })}
    </div>
  );
}