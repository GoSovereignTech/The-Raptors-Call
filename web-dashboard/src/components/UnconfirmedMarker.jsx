// src/components/UnconfirmedMarker.jsx
import { Marker } from 'react-leaflet';
import L from 'leaflet';

export function UnconfirmedMarker({ entity, onSelect }) {
  const ageSec = (Date.now() - (entity.createdAt || Date.now())) / 1000;
  const opacity = Math.max(0.15, 1 - ageSec / 30);
  const size = 14;
  const half = size / 2;

  const icon = L.divIcon({
    className: 'unconfirmed-marker',
    html: `
      <div style="
        width:${size}px;height:${size}px;
        border-radius:50%;
        background:var(--threat-unknown);
        opacity:${opacity.toFixed(2)};
        border:1.5px solid var(--marker-outline);
        box-shadow:0 0 6px var(--threat-unknown);
      "></div>
    `,
    iconSize: [size, size],
    iconAnchor: [half, half],
  });

  return (
    <Marker
      position={[entity.lat, entity.lng ?? entity.lon]}
      icon={icon}
      eventHandlers={{ click: () => onSelect?.(entity) }}
      zIndexOffset={-50}
    />
  );
}