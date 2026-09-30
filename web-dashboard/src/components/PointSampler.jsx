// src/components/PointSampler.jsx
// Dev-only tool: hover the map, see delta from base, click to drop a point.
// Copy the whole array to clipboard when done.

import { useState, useEffect } from 'react';
import { useMap } from 'react-leaflet';

export function PointSampler({ baseLat, baseLon, enabled = true }) {
  const map = useMap();
  const [cursor, setCursor] = useState({ dLat: 0, dLon: 0 });
  const [points, setPoints] = useState([]);
  const [copied, setCopied] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  // Track cursor position and convert to delta from base
  useEffect(() => {
    if (!enabled || collapsed) return;
    const onMove = (e) => {
      setCursor({
        dLat: e.latlng.lat - baseLat,
        dLon: e.latlng.lng - baseLon,
      });
    };
    map.on('mousemove', onMove);
    return () => map.off('mousemove', onMove);
  }, [map, baseLat, baseLon, enabled, collapsed]);

  // Click the map to drop a point (skip clicks that came from our own panel)
  useEffect(() => {
    if (!enabled) return;
    const onClick = (e) => {
      const target = e.originalEvent?.target;
      if (target && target.closest('.point-sampler-panel')) return;
      const dLat = Number((e.latlng.lat - baseLat).toFixed(6));
      const dLon = Number((e.latlng.lng - baseLon).toFixed(6));
      setPoints((prev) => [...prev, [dLat, dLon]]);
    };
    map.on('click', onClick);
    return () => map.off('click', onClick);
  }, [map, baseLat, baseLon, enabled]);

  if (!enabled) return null;

  const copyAll = async () => {
    const text = JSON.stringify(points);
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    console.log(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (collapsed) {
    return (
      <div
        className="point-sampler-panel absolute right-3 top-20 z-[900] pointer-events-auto"
        onClick={() => setCollapsed(false)}
        style={{
          background: 'rgba(0,0,0,0.9)',
          border: '1px solid rgba(245,158,11,0.6)',
          borderRadius: 8,
          padding: '6px 10px',
          color: '#fbbf24',
          fontSize: 11,
          cursor: 'pointer',
          fontFamily: 'ui-monospace, monospace',
        }}
      >
        📍 {points.length}
      </div>
    );
  }

  return (
    <div className="point-sampler-panel absolute left-3 top-20 z-[900] pointer-events-auto"
         style={{ maxWidth: 260 }}>
      <div
        style={{
          background: 'rgba(0,0,0,0.92)',
          border: '1px solid rgba(245,158,11,0.6)',
          borderRadius: 12,
          padding: 10,
          color: '#fff',
          fontSize: 11,
          fontFamily: 'ui-monospace, monospace',
          boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <span style={{ color: '#fbbf24', fontWeight: 700, letterSpacing: '0.1em', fontSize: 10 }}>
            DEV · POINT SAMPLER
          </span>
          <button
            onClick={() => setCollapsed(true)}
            style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 14 }}
          >−</button>
        </div>

        <div style={{ marginBottom: 8, padding: '4px 6px', background: 'rgba(251,191,36,0.15)', borderRadius: 6 }}>
          <div style={{ color: '#94a3b8', fontSize: 9, marginBottom: 2 }}>DELTA FROM BASE</div>
          <div style={{ color: '#fbbf24', fontSize: 13, fontWeight: 700 }}>
            [{cursor.dLat.toFixed(6)}, {cursor.dLon.toFixed(6)}]
          </div>
        </div>

        <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
          <button
            onClick={copyAll}
            disabled={points.length === 0}
            style={{
              flex: 1, padding: '6px 8px', background: copied ? '#22c55e' : '#f59e0b',
              color: '#000', border: 'none', borderRadius: 6, fontWeight: 700, cursor: 'pointer',
              fontSize: 11,
            }}
          >
            {copied ? '✓ COPIED' : `COPY (${points.length})`}
          </button>
          <button
            onClick={() => setPoints([])}
            disabled={points.length === 0}
            style={{
              padding: '6px 10px', background: '#1f2937', color: '#fff',
              border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 11,
            }}
          >
            CLEAR
          </button>
        </div>

        <div
          style={{
            maxHeight: 140, overflowY: 'auto', background: 'rgba(15,23,42,0.8)',
            borderRadius: 6, padding: 6, fontSize: 10, lineHeight: 1.5, color: '#cbd5e1',
          }}
        >
          {points.length === 0 ? (
            <div style={{ color: '#64748b', textAlign: 'center', padding: 8 }}>
              Click the map to drop points
            </div>
          ) : (
            points.map((p, i) => (
              <div key={i} style={{ color: i === points.length - 1 ? '#fbbf24' : '#cbd5e1' }}>
                [{p[0]}, {p[1]}],
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}