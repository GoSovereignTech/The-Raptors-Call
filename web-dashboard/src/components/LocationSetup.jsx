 import React, { useState, useRef } from 'react';

const BRAND_NAME = 'The Raptor';
const BRAND_TAGLINE = 'Scream Network';
// ---------------------------------------------------------------------
// Shared page chrome
// ---------------------------------------------------------------------

function BrandBackdrop({ children, dim = true }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-raptor-void">
      <div className="pointer-events-none absolute inset-0 bg-raptor-radial" />
      {dim && (
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{ backgroundImage: 'linear-gradient(rgba(148,163,184,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.4) 1px, transparent 1px)', backgroundSize: '36px 36px' }}
        />
      )}
      <div className="relative">{children}</div>
    </div>
  );
}
/* removing 
function Splash() {
  return (
    <BrandBackdrop>
      <div className="flex min-h-screen flex-col items-center justify-center px-6">
        <RaptorMark className="mb-5 h-14 w-14" />
        <h1 className="text-xl font-bold tracking-[0.3em] text-slate-50">{BRAND_NAME.toUpperCase()}</h1>
        <p className="mt-1.5 text-[11px] font-medium uppercase tracking-[0.35em] text-raptor-cyan">{BRAND_TAGLINE}</p>
        <div className="mt-8 flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <span key={i} className="h-2 w-2 animate-bounce rounded-full bg-raptor-cyan" style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
      </div>
    </BrandBackdrop>
  );
}
*/



export default function LocationSetup({ onLocated }) {
  const [manual, setManual] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function saveAndContinue(loc) {
    try {
      localStorage.setItem('user-location', JSON.stringify(loc));
    } catch (e) { /* ignore storage quota errors */ }
    onLocated(loc);
  }

  function usePrecise() {
    setError(''); setLoading(true);
    if (!navigator.geolocation) { setError('Location services are not available in this browser.'); setLoading(false); return; }
    navigator.geolocation.getCurrentPosition(
      async (pos) => { await saveAndContinue({ lat: pos.coords.latitude, lon: pos.coords.longitude, source: 'gps' }); setLoading(false); },
      () => { setError('Location permission was denied or unavailable — try entering a ZIP code or city below.'); setLoading(false); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  async function useManual() {
    if (!manual.trim()) return;
    setError(''); setLoading(true);
    try {
      const resp = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(manual)}`);
      const data = await resp.json();
      if (data && data[0]) {
        await saveAndContinue({ lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon), source: 'manual', label: manual });
      } else {
        setError("Couldn't find that location — try a full city name or ZIP code.");
      }
    } catch (e) {
      setError("Couldn't reach the location lookup service. Try again in a moment.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <BrandBackdrop dim={false}>
      <div className="flex min-h-screen flex-col">
        {/* Hero banner using the raptor artwork, faded into the page bg */}
        <div className="relative h-52 shrink-0 overflow-hidden sm:h-64">
          <img src="/raptor-hero.jpg" alt="" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-raptor-void/30 via-raptor-void/70 to-raptor-void" />
          <div className="absolute inset-x-0 bottom-3 flex flex-col items-center">
            <RaptorMark className="h-8 w-8" />
            <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.35em] text-raptor-cyan">{BRAND_NAME}</span>
          </div>
        </div>

        <div className="flex flex-1 flex-col justify-center px-6 pb-10 pt-2">
          <div className="mx-auto w-full max-w-sm">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-raptor-line bg-raptor-bg2 shadow-raptor-glow">
              <MapPin className="h-5 w-5 text-raptor-cyan" />
            </div>
            <h1 className="text-xl font-semibold text-slate-50">Share your location</h1>
            <p className="mt-2 text-sm text-slate-400">Used once to load a map of your area. You can change this anytime in settings.</p>

            <button onClick={usePrecise} disabled={loading}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-raptor-cyan to-raptor-blue px-4 py-3 text-sm font-semibold text-raptor-void shadow-raptor-glow transition hover:brightness-110 disabled:opacity-60">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />} Use precise location
            </button>

            <div className="my-5 flex items-center gap-3 text-xs text-slate-600">
              <div className="h-px flex-1 bg-raptor-line" /> or <div className="h-px flex-1 bg-raptor-line" />
            </div>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-300">ZIP code or city</span>
              <div className="flex gap-2">
                <input value={manual} onChange={(e) => setManual(e.target.value)} placeholder="e.g. 30303 or Atlanta, GA"
                  className="w-full rounded-lg border border-raptor-line bg-raptor-bg2 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-raptor-cyan focus:ring-1 focus:ring-raptor-cyan" />
                <button onClick={useManual} disabled={loading} className="shrink-0 rounded-lg border border-raptor-line bg-raptor-bg2 px-4 py-2 text-sm font-medium text-slate-200 hover:border-raptor-cyan/50 hover:text-raptor-cyan disabled:opacity-60">Go</button>
              </div>
            </label>

            {error && (
              <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-400">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
              </div>
            )}
          </div>
        </div>
      </div>
    </BrandBackdrop>
  );
}