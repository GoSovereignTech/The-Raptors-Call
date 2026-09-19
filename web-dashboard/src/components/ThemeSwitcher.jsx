// src/components/ThemeSwitcher.jsx
import { useState, useEffect } from 'react';

const THEMES = [
  { id: 'sky-blue', label: 'Sky Blue', swatch: '#38bdf8' },
  { id: 'desert',   label: 'Desert',   swatch: '#f97316' },
  { id: 'tactical', label: 'Tactical', swatch: '#4ade80' },
];

export function ThemeSwitcher() {
  const [current, setCurrent] = useState(
    () => localStorage.getItem('raptor-theme') || 'sky-blue'
  );

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', current);
    localStorage.setItem('raptor-theme', current);
    console.log(" setting data theme =",document.documentElement );
  }, [current]);

  return (
    <div className="space-y-2">
      <div className="text-[10px] uppercase tracking-widest text-slate-500">Theme</div>
      <div className="flex gap-2">
        {THEMES.map((t) => (
          <button
            key={t.id}
            onClick={() => setCurrent(t.id)}
            className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs transition ${
              current === t.id
                ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--text-primary)]'
                : 'border-slate-700 bg-slate-900/60 text-slate-400 hover:border-slate-600'
            }`}
          >
            <span
              className="h-3 w-3 rounded-full border border-white/20"
              style={{ background: t.swatch }}
            />
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}