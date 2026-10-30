// src/App.jsx
import React, { useState, useEffect } from 'react';
import { initDatabase } from './lib/db';
import { registerSW } from 'virtual:pwa-register';
import SplashPage from './components/SplashPage'; // Adjust imports as needed
import LocationSetup from './components/LocationSetup'; // Adjust imports as needed
import HomeField from './components/HomeField'; // Adjust imports as needed
import SettingsPage from './components/SettingsPage'; // Adjust imports as needed

const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm('New version available. Reload?')) updateSW(true);
  },
  onOfflineReady() {
    console.log('App ready for offline use.');
  },
});

export default function App() {
  const [view, setView] = useState('splash'); // 'splash' | 'setup' | 'home' | 'settings'
  const [location, setLocation] = useState(null);
  const [dbReady, setDbReady] = useState(false);
  const [dbError, setDbError] = useState(null);

  // Initialize Database
  useEffect(() => {
    initDatabase()
      .then(() => setDbReady(true))
      .catch((err) => setDbError(err.message));
  }, []);

  // 1. Load the cached location immediately so the UI isn't blank
  useEffect(() => {
    const stored = localStorage.getItem('user-location');
    if (stored) {
      try {
        const loc = JSON.parse(stored);
        if (typeof loc.lat === 'number' && typeof loc.lon === 'number') {
          setLocation(loc);
          setView('home'); 
        }
      } catch (e) {}
    }
  }, []);

  // 2. SILENTLY fetch fresh GPS on startup to fix the map
  useEffect(() => {
    if (!navigator.geolocation || view === 'splash' || view === 'setup') return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const freshLoc = {
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          source: 'gps',
        };
        setLocation(freshLoc);
        localStorage.setItem('user-location', JSON.stringify(freshLoc));
      },
      (err) => {
        console.warn("Fresh GPS failed, using cached location", err);
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  }, [view]); // Re-run when view changes (e.g., coming back from setup)

  if (dbError) return <div className="p-4 text-red-500">Database error: {dbError}</div>;
  if (!dbReady) return <div className="p-4 text-white">Initializing secure database...</div>;

  // --- ROUTING ---
  if (view === 'settings') {
    return <SettingsPage
      userGuid={localStorage.getItem('raptor:user-guid') || null}
      meshNodeId={localStorage.getItem('raptor:mesh-node-id') || null}
      onBack={() => setView('home')}
      onSaved={() => {}}
    />;
  }

  if (view === 'setup') {
    return <LocationSetup onLocated={(loc) => {
      setLocation(loc);
      localStorage.setItem('user-location', JSON.stringify(loc));
      setView('home');
    }} />;
  }

  if (view === 'splash') {
    return (
      <SplashPage
        onEnterPrecise={() => setView('setup')}
        onEnterDemo={() => {
          const demoLoc = { lat: 39.2838, lon: -76.6216, source: 'demo', label: 'Demo Mode' };
          localStorage.setItem('user-location', JSON.stringify(demoLoc));
          setLocation(demoLoc);
          setView('home');
        }}
      />
    );
  }

  // view === 'home'
  return (
    <HomeField 
      location={location} 
      onOpenSettings={() => setView('settings')} 
    />
  );
}


/* old  from OnboardingFlow.jsx 

export default function App() {
  const [view, setView] = useState('splash'); // 'splash' | 'setup' | 'home' | 'settings'
  const [location, setLocation] = useState(null);

  // Check for stored location on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('user-location');
      if (stored) {
        const loc = JSON.parse(stored);
        if (typeof loc.lat === 'number' && typeof loc.lon === 'number') {
          setLocation(loc);
          setView('home');
        }
      }
    } catch (e) {   }
  }, []);

  if (view === 'splash') {
    return (
      <SplashPage
        onEnterPrecise={() => setView('setup')}
        onEnterDemo={() => {
          // Use a fixed demo location (downtown Baltimore in your sim area)
          const demoLoc = { lat: 39.2838, lon: -76.6216, source: 'demo', label: 'Demo Mode' };
          localStorage.setItem('user-location', JSON.stringify(demoLoc));
          setLocation(demoLoc);
          setView('home');
        }}
      />
    );
  }
  if (view === 'settings') {
    return <SettingsPage
      userGuid={localStorage.getItem('raptor:user-guid') || null}
      meshNodeId={localStorage.getItem('raptor:mesh-node-id') || null}
      onBack={() => setView('home')}
      onSaved={() => { }}
    />;
  }
  if (view === 'setup') {
    return <LocationSetup onLocated={(loc) => {
      setLocation(loc);
      setView('home');
    }} />;
  }

  return <HomeField location={location} onOpenSettings={() => setView('settings')} />
}

*/