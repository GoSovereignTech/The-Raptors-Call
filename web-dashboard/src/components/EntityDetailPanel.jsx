// src/components/EntityDetailPanel.jsx
// Universal entity detail panel — friends, unknowns, enemies.
// Supports category switching, cycling, pictures, alarm status.

import { useState, useEffect } from 'react';
import {
  ChevronLeft, ChevronRight, Bell, BellOff, MapPin,
  Crosshair, CheckCircle2, XCircle, AlertTriangle, Users
} from 'lucide-react';

const CATEGORY_META = {
  friend:  { key: 'friend',  label: 'Friends',  singular: 'Friend',  color: 'var(--threat-friend)',  icon: Users },
  unknown: { key: 'unknown', label: 'Unknown',  singular: 'Unknown', color: 'var(--threat-unknown)', icon: AlertTriangle },
  enemy:   { key: 'enemy',   label: 'Enemies',  singular: 'Enemy',   color: 'var(--threat-enemy)',   icon: XCircle },
};

function classifyEntity(entity) {
  if (entity.threat === 'enemy' || entity.threat === 'CONFIRMED_OPPOSITION' || entity.threat === 'threat') {
    return 'enemy';
  }
  if (entity.threat === 'friend' || entity.threat === 'CLEAR' || entity.isSelf) {
    return 'friend';
  }
  return 'unknown';
}

export function EntityDetailPanel({
  entity,
  allEntities = [],
  activeCategory = 'friend',
  onCategoryChange,
  onNavigate,
  onCenter,
  onClose,
  onStatusChange,
}) {
  const [draftThreat, setDraftThreat] = useState('unknown');
  const [draftReason, setDraftReason] = useState('');

  // Sync draft when entity changes
  useEffect(() => {
    if (entity) {
      setDraftThreat(classifyEntity(entity));
      setDraftReason('');
    }
  }, [entity?.id]);

  if (!entity) return null;

  const meta = CATEGORY_META[activeCategory] || CATEGORY_META.friend;
  const CategoryIcon = meta.icon;

  const categoryEntities = allEntities.filter((e) => classifyEntity(e) === activeCategory);
  const currentIndex = categoryEntities.findIndex((e) => e.id === entity.id);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < categoryEntities.length - 1;
  const position = currentIndex >= 0 ? `${currentIndex + 1}/${categoryEntities.length}` : '—';

  const alarmActive = entity.alarm && entity.alarm !== 'off';
  const isLoud = entity.alarm === 'loud' || entity.alarm === 'SCREAMING';

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
    <div
      className="absolute bottom-24 left-3 right-3 z-[600] rounded-xl border backdrop-blur-xl p-3 shadow-2xl"
      style={{
        background: 'var(--panel-bg)',
        borderColor: 'var(--panel-border)',
        color: 'var(--text-primary)',
      }}
    >
      {/* ─── CATEGORY SELECTOR ─── */}
      <div className="mb-3 flex gap-2">
        {Object.values(CATEGORY_META).map((cat) => {
          const CatIcon = cat.icon;
          const count = allEntities.filter((e) => classifyEntity(e) === cat.key).length;
          const active = cat.key === activeCategory;
          return (
            <button
              key={cat.key}
              onClick={() => onCategoryChange?.(cat.key)}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-2 py-1.5 text-xs font-semibold transition"
              style={{
                borderColor: active ? cat.color : 'var(--panel-border)',
                background: active ? `${cat.color}22` : 'transparent',
                color: active ? cat.color : 'var(--text-muted)',
              }}
            >
              <CatIcon className="h-3.5 w-3.5" />
              <span>{cat.label}</span>
              <span className="ml-0.5 rounded-full px-1.5 text-[10px]" style={{ background: active ? cat.color : 'var(--panel-border)', color: active ? '#0c1a28' : 'var(--text-primary)' }}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ─── HEADER: cycle left/right ─── */}
      <div className="mb-3 flex items-center justify-between gap-2">
        <button
          onClick={() => hasPrev && onNavigate?.(-1)}
          disabled={!hasPrev}
          className="flex h-9 w-9 items-center justify-center rounded-full border disabled:opacity-30"
          style={{ borderColor: 'var(--panel-border)', color: 'var(--text-primary)' }}
          aria-label="Previous entity"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <div className="flex-1 text-center">
          <div className="text-[10px] uppercase tracking-widest" style={{ color: meta.color }}>
            {meta.label} · {position}
          </div>
          <div className="mt-0.5 font-mono text-xs truncate" style={{ color: 'var(--text-muted)' }}>
            {entity.id}
          </div>
        </div>

        <button
          onClick={() => hasNext && onNavigate?.(1)}
          disabled={!hasNext}
          className="flex h-9 w-9 items-center justify-center rounded-full border disabled:opacity-30"
          style={{ borderColor: 'var(--panel-border)', color: 'var(--text-primary)' }}
          aria-label="Next entity"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* ─── MAIN BODY: picture + info ─── */}
      <div className="flex items-start gap-3">
        {/* Picture */}
        <div
          className="flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border-2"
          style={{ borderColor: meta.color, background: 'var(--marker-bg)' }}
        >
          {entity.picture_blob ? (
            <img
              src={entity.picture_blob}
              alt={entity.nickname || entity.id}
              className="h-full w-full object-cover"
            />
          ) : (
            <CategoryIcon className="h-7 w-7" style={{ color: meta.color }} />
          )}
        </div>

        {/* Info stack */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <div className="truncate text-base font-bold" style={{ color: 'var(--text-primary)' }}>
              {entity.nickname || entity.alias || 'Unnamed'}
            </div>
            {alarmActive && (
              <span
                className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold"
                style={{
                  background: isLoud ? 'var(--threat-enemy)' : 'var(--threat-unknown)',
                  color: '#fff',
                }}
              >
                {isLoud ? <Bell className="h-3 w-3" /> : <BellOff className="h-3 w-3" />}
                {isLoud ? 'LOUD ALARM' : 'SILENT'}
              </span>
            )}
          </div>

          {entity.role && (
            <div className="text-[10px] uppercase tracking-widest" style={{ color: meta.color }}>
              {entity.role}
            </div>
          )}

          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px]" style={{ color: 'var(--text-muted)' }}>
            <span className="font-mono">
              {entity.lat?.toFixed(5)}, {(entity.lng ?? entity.lon)?.toFixed(5)}
            </span>
            {entity.movement && (
              <span className="capitalize">{entity.movement}</span>
            )}
            {entity.battery != null && <span>{entity.battery}% batt</span>}
          </div>

          {/* Center map button */}
          <button
            onClick={() => onCenter?.(entity)}
            className="mt-2 flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] font-semibold"
            style={{ borderColor: 'var(--panel-border)', color: 'var(--accent)' }}
          >
            <Crosshair className="h-3 w-3" />
            Center on map
          </button>
        </div>

        {/* Close */}
        <button
          onClick={onClose}
          className="flex-shrink-0 text-lg leading-none"
          style={{ color: 'var(--text-muted)' }}
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      {/* ─── THREAT ASSESSMENT ─── */}
      <div className="mt-3 border-t pt-3" style={{ borderColor: 'var(--panel-border)' }}>
        <div className="mb-2 text-[10px] uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
          Reclassify
        </div>
        <div className="flex gap-2">
          {Object.values(CATEGORY_META).map((cat) => {
            const selected = draftThreat === cat.key;
            return (
              <button
                key={cat.key}
                onClick={() => setDraftThreat(cat.key)}
                className="flex-1 rounded-lg border px-2 py-1.5 text-xs font-semibold transition"
                style={{
                  color: selected ? '#0c1a28' : cat.color,
                  backgroundColor: selected ? cat.color : 'transparent',
                  borderColor: cat.color,
                }}
              >
               {cat.singular}
              </button>
            );
          })}
        </div>

        <input
          type="text"
          placeholder="Reason for change (required)"
          value={draftReason}
          onChange={(e) => setDraftReason(e.target.value)}
          maxLength={120}
          className="mt-2 w-full rounded-lg border px-3 py-2 text-xs outline-none"
          style={{
            background: 'var(--marker-bg)',
            borderColor: 'var(--panel-border)',
            color: 'var(--text-primary)',
          }}
        />

        <button
          onClick={saveStatus}
          disabled={!draftReason.trim()}
          className="mt-2 w-full rounded-lg py-2 text-xs font-bold disabled:opacity-40"
          style={{ background: 'var(--accent)', color: '#0c1a28' }}
        >
          Save reclassification
        </button>
      </div>
    </div>
  );
}