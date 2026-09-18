// src/components/FusionPacketOverlay.jsx
// Fusion SNS packet as a Leaflet marker — pans/zooms with the map.

import { Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Radio, Thermometer, Activity, Waves, Zap } from 'lucide-react';
import { useState } from 'react';
import { entityFromPacket } from './../lib/entities.js';
const SENSOR_META = {
  16:  { icon: Radio,   label: 'PIR',     color: '#f59e0b' },
  32:  { icon: Thermometer,   label: 'Thermal', color: '#f43f5e' },
  64:  { icon: Activity,   label: 'Seismic', color: '#22d3ee' },
  128: { icon: Waves,   label: 'ToF',     color: '#8b5cf6' },
  256: { icon: Zap,   label: 'IR Beam', color: '#10b981' },
};

function decodeSensors(src) {
  return Object.entries(SENSOR_META)
    .filter(([bit]) => (src & parseInt(bit)) !== 0)
    .map(([bit, meta]) => ({ bit: parseInt(bit), ...meta }));
}

function confidenceColor(conf) {
  if (conf >= 80) return '#f43f5e';
  if (conf >= 60) return '#f59e0b';
  if (conf >= 30) return '#eab308';
  return '#64748b';
}

// Simple SVG icons embedded as strings (no lucide-react dependency in divIcon)
const ICON_SVG = {
  16:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 2v20M2 12h20"/></svg>',
  32:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/></svg>',
  64:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12h3l2-6 3 12 3-9 2 5 3-3h4"/></svg>',
  128:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12c2-4 6-6 10-6s8 2 10 6c-2 4-6 6-10 6s-8-2-10-6z"/></svg>',
  256:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/></svg>',
};

export function FusionDetailPanel({ packet, onClose, onStatusChange }) {
  if (!packet || packet.typ !== 'SNS') return null;
  return <FusionDetailPanelInner packet={packet} onClose={onClose} onStatusChange={onStatusChange} />;
}

function FusionDetailPanelInner({ packet, onClose, onStatusChange }) {
  const d = packet.d || {};
  const sensors = decodeSensors(d.src || 0);
  const entity = entityFromPacket(packet);

  const [draftThreat, setDraftThreat] = useState(entity.threat);
  const [draftReason, setDraftReason] = useState('');

  const saveStatus = () => {
    if (!draftReason.trim()) {
      alert('Please enter a reason');
      return;
    }
    onStatusChange?.({
      entityId: entity.id,
      threat: draftThreat,
      reason: draftReason,
      ts: Date.now(),
    });
    setDraftReason('');
  };

  const THREAT_OPTIONS = [
    { key: 'friend',  label: 'Friend',  color: '#10b981' },
    { key: 'unknown', label: 'Unknown', color: '#eab308' },
    { key: 'enemy',   label: 'Enemy',   color: '#f43f5e' },
  ];

  return (
    <div className="absolute bottom-24 left-4 right-4 z-[600] rounded-xl border border-raptor-line bg-raptor-bg/95 p-4 backdrop-blur shadow-xl max-h-[70vh] overflow-y-auto">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs uppercase tracking-widest text-raptor-cyan">
            {packet.nid}
          </span>
          <span className="rounded-full border border-raptor-line px-2 py-0.5 text-[10px] text-slate-400">
            {packet.sim ? 'SIM' : 'LIVE'}
          </span>
        </div>
        <button onClick={onClose} className="text-slate-500 hover:text-slate-200">✕</button>
      </div>

      {/* Confidence */}
      <div className="mb-3 flex items-center gap-3">
        <div className="text-2xl font-bold" style={{ color: confidenceColor(d.conf || 0) }}>
          {d.conf}%
        </div>
        <div className="text-xs text-slate-400">
          Fused confidence
          <div className="text-slate-600">
            Magnitude: {d.mag} · Peak: {d.peak_ms}ms
          </div>
          {d.accuracy_m && (
            <div className="text-slate-600">Position accuracy: ±{d.accuracy_m}m</div>
          )}
        </div>
      </div>

      {/* Sensor list */}
      <div className="space-y-2">
        {sensors.map((s) => {
          const Icon = s.icon;
          const value = d[s.label.toLowerCase()];
          return (
            <div key={s.bit} className="flex items-center gap-2 rounded-lg border border-raptor-line/50 px-3 py-2">
              <Icon className="h-4 w-4" style={{ color: s.color }} />
              <span className="text-xs font-medium text-slate-200">{s.label}</span>
              {value != null && (
                <span className="ml-auto font-mono text-xs" style={{ color: s.color }}>{value}</span>
              )}
            </div>
          );
        })}
      </div>

      {/* ─── Threat selector ─── */}
      <div className="mt-4 border-t border-raptor-line pt-3">
        <div className="mb-2 text-[10px] uppercase tracking-widest text-slate-500">
          Threat assessment
        </div>
        <div className="flex gap-2">
          {THREAT_OPTIONS.map(({ key, label, color }) => {
            const selected = draftThreat === key;
            return (
              <button
                key={key}
                onClick={() => setDraftThreat(key)}
                className="flex-1 rounded-lg border px-2 py-2 text-xs font-semibold transition"
                style={{
                  color: selected ? '#040611' : color,
                  backgroundColor: selected ? color : 'transparent',
                  borderColor: color,
                }}
              >
                {label}
              </button>
            );
          })}
        </div>

        <div className="mt-3">
          <div className="mb-1 text-[10px] uppercase tracking-widest text-slate-500">
            Reason for change
          </div>
          <input
            type="text"
            placeholder="e.g. seen in area before, carrying something"
            value={draftReason}
            onChange={(e) => setDraftReason(e.target.value)}
            maxLength={140}
            className="w-full rounded-lg border border-raptor-line bg-raptor-bg2 px-3 py-2 text-xs text-slate-100 placeholder-slate-500 outline-none focus:border-raptor-cyan"
          />
          <button
            onClick={saveStatus}
            disabled={!draftReason.trim()}
            className="mt-2 w-full rounded-lg bg-raptor-cyan py-2 text-xs font-bold text-raptor-void disabled:opacity-40"
          >
            Save status change
          </button>
        </div>
      </div>

      {/* Metadata */}
      <div className="mt-3 flex items-center gap-3 text-[10px] text-slate-600">
        <span>Seq: {packet.seq}</span>
        <span>Hops: {packet.hops}</span>
        <span>CH: {packet.chn}</span>
        <span>ts: {new Date(packet.ts * 1000).toLocaleTimeString()}</span>
      </div>
    </div>
  );
}



/*
// ─── Detailed panel for selected packet ───
export function FusionDetailPanel({ packet, onClose }) {
  if (!packet || packet.typ !== 'SNS') return null;
  const d = packet.d || {};
  const sensors = decodeSensors(d.src || 0);
  // In FusionDetailPanel, add:

  const entity = entityFromPacket(packet);
  const [draftThreat, setDraftThreat] = useState(entity.threat);
  const [draftReason, setDraftReason] = useState('');

  const saveStatus = () => {
    if (!draftReason.trim()) {
      alert('Please enter a reason');
      return;
    }
    onStatusChange?.({
      entityId: entity.id,
      threat: draftThreat,
      reason: draftReason,
      ts: Date.now(),
    });
    setDraftReason('');
  };
  return (
    <div className="absolute bottom-24 left-4 right-4 z-[600] rounded-xl border border-raptor-line bg-raptor-bg/95 p-4 backdrop-blur shadow-xl">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs uppercase tracking-widest text-raptor-cyan">
            {packet.nid}
          </span>
          <span className="rounded-full border border-raptor-line px-2 py-0.5 text-[10px] text-slate-400">
            {packet.sim ? 'SIM' : 'LIVE'}
          </span>
        </div>
        <button onClick={onClose} className="text-slate-500 hover:text-slate-200">✕</button>
      </div>

      <div className="mb-3 flex items-center gap-3">
        <div className="text-2xl font-bold" style={{ color: confidenceColor(d.conf || 0) }}>
          {d.conf}%
        </div>
        <div className="text-xs text-slate-400">
          Fused confidence
          <div className="text-slate-600">
            Magnitude: {d.mag} · Peak: {d.peak_ms}ms
          </div>
          {d.accuracy_m && (
            <div className="text-slate-600">
              Position accuracy: ±{d.accuracy_m}m
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2">
        {sensors.map((s) => {
          const Icon = s.icon;
          const value = d[s.label.toLowerCase()];
          return (
            <div key={s.bit} className="flex items-center gap-2 rounded-lg border border-raptor-line/50 px-3 py-2">
              <Icon className="h-4 w-4" style={{ color: s.color }} />
              <span className="text-xs font-medium text-slate-200">{s.label}</span>
              <span className="text-[10px] text-slate-500">{s.desc}</span>
              {value != null && (
                <span className="ml-auto font-mono text-xs" style={{ color: s.color }}>
                  {value}
                </span>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex items-center gap-3 text-[10px] text-slate-600">
        <span>Seq: {packet.seq}</span>
        <span>Hops: {packet.hops}</span>
        <span>CH: {packet.chn}</span>
        <span>ts: {new Date(packet.ts * 1000).toLocaleTimeString()}</span>
      </div>
    </div>
  );
}
*/
/* oldest  
export function FusionPacketMarker({ packet, onSelect }) {
  if (!packet || packet.typ !== 'SNS') return null;

  const d = packet.d || {};
  const conf = d.conf || 0;
  const color = confidenceColor(conf);
  const sensors = decodeSensors(d.src || 0);
  const primary = sensors[0] || { icon: 'pir', color };
  const sensorCount = sensors.length;

  const icon = L.divIcon({
    className: 'fusion-packet-marker',
    html: `
      <div style="position:relative;width:40px;height:40px;">
        <div style="position:absolute;inset:0;border-radius:999px;background:${color};opacity:0.3;animation:fusionPulse 2s ease-out infinite;"></div>
        <div style="
          position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
          width:36px;height:36px;border-radius:999px;
          border:2px solid ${color};
          background:rgba(10,14,28,0.9);
          box-shadow:0 0 16px ${color}66;
          display:flex;align-items:center;justify-content:center;
          color:${primary.color};
        ">
          <div style="width:18px;height:18px;">${ICON_SVG[primary.icon] || ICON_SVG.pir}</div>
        </div>
        ${sensorCount > 1 ? `
          <div style="
            position:absolute;top:-4px;right:-4px;
            width:16px;height:16px;border-radius:999px;
            background:${color};color:#040611;
            font-size:10px;font-weight:700;
            display:flex;align-items:center;justify-content:center;
          ">${sensorCount}</div>
        ` : ''}
        <div style="
          position:absolute;top:100%;left:50%;transform:translateX(-50%);
          margin-top:4px;white-space:nowrap;
          font-size:10px;font-weight:600;
          background:rgba(10,14,28,0.9);
          border:1px solid #1c2540;
          border-radius:999px;
          padding:2px 8px;
          color:${color};
          backdrop-filter:blur(8px);
        ">${conf}% ${sensors.map(s => s.label).join('+')}</div>
      </div>
      <style>
        @keyframes fusionPulse {
          0% { transform: scale(0.8); opacity: 0.5; }
          100% { transform: scale(1.6); opacity: 0; }
        }
      </style>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });

  return (
    <Marker
      position={[packet.d.lat, packet.d.lon]}
      icon={icon}
      eventHandlers={{ click: () => onSelect?.(packet) }}
    />
  );
}
*/

export function FusionPacketMarker({ packet, onSelect, showVariance = true }) {
  const map = useMap();

  if (!packet || packet.typ !== 'SNS') return null;

  const d = packet.d || {};
  const lat = d.lat;
  const lon = d.lon;

  if (typeof lat !== 'number' || typeof lon !== 'number' ||
      isNaN(lat) || isNaN(lon)) {
    console.warn('[FusionPacketMarker] Skipping packet with invalid position:', packet);
    return null;
  }

  const conf = d.conf || 0;
  const color = confidenceColor(conf);
  const sensors = decodeSensors(d.src || 0);
  const primary = sensors[0] || { bit: 16, color };
  const sensorCount = sensors.length;

  // ─── Confidence-based sizing ───
  const markerSize = conf >= 80 ? 40 : conf >= 60 ? 32 : 24;
  const iconInnerSize = Math.round(markerSize * 0.9);
  const innerIconSize = Math.round(iconInnerSize * 0.5);
  const half = markerSize / 2;

  // ─── Accuracy / variance circle ───
  const accuracyM = d.accuracy_m || 0;
  let accuracyPx = 0;
  if (showVariance && accuracyM > 0) {
    const zoom = map.getZoom();
    const metersPerPixel = 156543.03392 * Math.cos(lat * Math.PI / 180) / Math.pow(2, zoom);
    const pixelsPerMeter = 1 / metersPerPixel;
    accuracyPx = accuracyM * 2 * pixelsPerMeter;
    accuracyPx = Math.min(accuracyPx, 2000);
    accuracyPx = Math.max(accuracyPx, markerSize * 2); // always at least 2× marker
  }

  const icon = L.divIcon({
    className: 'fusion-packet-marker',
    html: `
      <div style="position:relative;width:${markerSize}px;height:${markerSize}px;">

        ${showVariance ? `
          <div style="
            position:absolute;inset:0;
            border-radius:999px;
            background:${color};
            opacity:0.3;
            animation:fusionPulse 2s ease-out infinite;
          "></div>

          ${accuracyPx > 0 ? `
            <div style="
              position:absolute;top:50%;left:50%;
              transform:translate(-50%,-50%);
              width:${accuracyPx}px;height:${accuracyPx}px;
              border-radius:999px;
              border:1px dashed ${color}88;
              background:${color}11;
              animation:variancePulse 3s ease-out infinite;
              pointer-events:none;
            "></div>
          ` : ''}
        ` : ''}

        <div style="
          position:absolute;top:50%;left:50%;
          transform:translate(-50%,-50%);
          width:${iconInnerSize}px;height:${iconInnerSize}px;
          border-radius:999px;
          border:2px solid ${color};
          background:rgba(10,14,28,0.9);
          box-shadow:0 0 16px ${color}66;
          display:flex;align-items:center;justify-content:center;
          color:${primary.color};
        ">
          <div style="width:${innerIconSize}px;height:${innerIconSize}px;">
            ${ICON_SVG[primary.bit] || ICON_SVG[16]}
          </div>
        </div>

        ${sensorCount > 1 ? `
          <div style="
            position:absolute;top:-4px;right:-4px;
            width:16px;height:16px;border-radius:999px;
            background:${color};color:#040611;
            font-size:10px;font-weight:700;
            display:flex;align-items:center;justify-content:center;
          ">${sensorCount}</div>
        ` : ''}

        <div style="
          position:absolute;top:100%;left:50%;transform:translateX(-50%);
          margin-top:4px;white-space:nowrap;
          font-size:10px;font-weight:600;
          background:rgba(10,14,28,0.9);
          border:1px solid #1c2540;
          border-radius:999px;
          padding:2px 8px;
          color:${color};
          backdrop-filter:blur(8px);
        "}>${conf}%</div>
      </div>
      <style>
        @keyframes fusionPulse {
          0% { transform: scale(0.8); opacity: 0.5; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        @keyframes variancePulse {
          0% { transform: translate(-50%,-50%) scale(0.95); opacity: 0.35; }
          50% { transform: translate(-50%,-50%) scale(1.0); opacity: 0.6; }
          100% { transform: translate(-50%,-50%) scale(0.95); opacity: 0.35; }
        }
      </style>
    `,
    iconSize: [markerSize, markerSize],
    iconAnchor: [half, half],
  });

  return (
    <Marker
      position={[lat, lon]}
      icon={icon}
      eventHandlers={{ click: () => onSelect?.(packet) }}
    />
  );
}