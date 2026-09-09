import React from 'react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Settings, MapPin, Compass, Radio, AlertTriangle, Loader2 } from 'lucide-react';
import RaptorMark from '../../components/RaptorMark.jsx';
import { ActiveNodeTracker } from '../../lib/localActiveNodes.js';
// Add at the top of the file
import { MeshHardwareNode } from '../../components/MeshHardwareNode';
// Add at the top of the file
import { DeviceDetector } from '../../lib/deviceDetector';


const BRAND_NAME = 'The Raptor';
const BRAND_TAGLINE = 'Scream Network';

function cardinal(deg) {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return dirs[Math.round(((deg % 360) + 360) % 360 / 45) % 8];
}

async function requestOrientationPermission() {
  if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
    try { return (await DeviceOrientationEvent.requestPermission()) === 'granted'; } catch (e) { return false; }
  }
  return true;
}
async function requestMotionPermission() {
  if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
    try { return (await DeviceMotionEvent.requestPermission()) === 'granted'; } catch (e) { return false; }
  }
  return true;
}

// ---------------------------------------------------------------------
// Live map — a real Leaflet map instead of hand-placed tile <img>s.
// Leaflet owns tile fetching/layout/zoom/pan, which is what actually
// guarantees the tiles line up: no more manual x/y pixel math to get
// wrong. onFail fires from the tile layer's own error event, so the
// "map tiles unavailable" banner still works the same way it did.
// ---------------------------------------------------------------------

function Recenter({ lat, lon }) {
  const map = useMap();
  useEffect(() => { map.setView([lat, lon], map.getZoom(), { animate: true }); }, [lat, lon]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

function beaconIcon(heading, pulseDuration, alert) {
  const color = alert ? '#f59e0b' : '#22d3ee';
  return L.divIcon({
    className: 'raptor-beacon-icon',
    html: `
      <div class="raptor-beacon">
        <span class="raptor-beacon-ring" style="--raptor-beacon-color:${color}; animation-duration:${pulseDuration}s"></span>
        <span class="raptor-beacon-ring" style="--raptor-beacon-color:${color}; animation-duration:${pulseDuration}s; animation-delay:${pulseDuration / 2}s"></span>
        <div class="raptor-beacon-dot" style="background:${color}">
          <svg viewBox="0 0 24 24" width="16" height="16" style="transform:rotate(${heading}deg); transition:transform 0.2s linear">
            <path d="M12 2 L19 21 L12 17 L5 21 Z" fill="#040611" />
          </svg>
        </div>
      </div>`,
    iconSize: [48, 48],
    iconAnchor: [24, 24],
  });
}

function HeadingMarker({ lat, lon, heading, pulseDuration, alert }) {
  const markerRef = useRef(null);
  const icon = useCallback(() => beaconIcon(heading, pulseDuration, alert), [heading, pulseDuration, alert]);

  useEffect(() => {
    if (markerRef.current) markerRef.current.setIcon(icon());
  }, [icon]);

  return <Marker position={[lat, lon]} ref={markerRef} icon={icon()} interactive={false} keyboard={false} />;
}

function LiveMap({ lat, lon, heading, pulseDuration, onFail, children }) {
  return (
    <MapContainer
      center={[lat, lon]}
      zoom={15}
      zoomControl={false}
      attributionControl={true}
      className="absolute inset-0 h-full w-full"
      style={{ background: '#0a0e1c' }}
    >
      <TileLayer
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap contributors"
        eventHandlers={{ tileerror: () => onFail() }}
      />
      <Recenter lat={lat} lon={lon} />
      <HeadingMarker lat={lat} lon={lon} heading={heading} pulseDuration={pulseDuration} alert={false} />
      
      {/* THIS LINE LETS NODES BE RENDERED INSIDE THE MAP CONTAINER */}
      {children} 
    </MapContainer>
  );
}

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

function LocationSetup({ onLocated }) {
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

function HomeField({ location, onOpenSettings }) {
  const [heading, setHeading] = useState(0);
  const [activity, setActivity] = useState(0.15);
  const [sensorsEnabled, setSensorsEnabled] = useState(false);
  const [meshConnected, setMeshConnected] = useState(false);
  const [dongleConnected, setDongleConnected] = useState(false);
  const [mapFailed, setMapFailed] = useState(false);
  const lastMag = useRef(null);
  const meshNodeRef = useRef(null);
  // --- NEW STATES FROM MOMMA RAPTOR ---
  const [alarmStatus, setAlarmStatus] = useState('CLEAR');
  const [activeNodes, setActiveNodes] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [initialAlarmLocation, setInitialAlarmLocation] = useState(null);
  const [nodeThreatDescription, setNodeThreatDescription] = useState('');

    // --- OVERLAY STATES ---
  const [showMeshOverlay, setShowMeshOverlay] = useState(false);
  const [showRadarOverlay, setShowRadarOverlay] = useState(false);
  const [showChatOverlay, setShowChatOverlay] = useState(false);

  // In the HomeField component
  const tracker = useRef(new ActiveNodeTracker());
 
    // --- UPDATE UI FUNCTION ---
  const updateUI = (stats) => {
    const nodesOnline = document.getElementById('nodes-online');
    const friendsOnline = document.getElementById('friends-online');
    const relaysOnline = document.getElementById('relays-online');
    const sensorsOnline = document.getElementById('sensors-online');
    
    if (nodesOnline) nodesOnline.textContent = stats.total;
    if (friendsOnline) friendsOnline.textContent = stats.friends;
    if (relaysOnline) relaysOnline.textContent = stats.relays;
    if (sensorsOnline) sensorsOnline.textContent = stats.sensors;
  };


  // --- USB DEVICE SETUP ---
  useEffect(() => {
    async function setupDevices() {
      try {
        // Check if Web Serial API is available
        if (!navigator.serial) {
          console.log('Web Serial API not available - running in simulation mode');
          return;
        }

        // Get available ports
        const ports = await navigator.serial.getPorts();
        
        if (ports.length === 0) {
          console.log('No USB devices detected - running in simulation mode');
          return;
        }

        // Import device detector
        const { DeviceDetector } = await import('../../lib/deviceDetector');
        const detector = new DeviceDetector();
        const assignments = await detector.assignDevices(ports);

        // Check if RAK node was found
        const hasRakNode = assignments.some(a => a.type === 'RAK_NODE');
        if (hasRakNode) {
          setDongleConnected(true);
          setMeshConnected(true);
          console.log('RAK node detected - live mode active');
          
          // ---- INSERT YOUR MESH HARDWARE CODE HERE ----
          const { MeshHardwareNode } = await import('../../components/MeshHardwareNode');
          const rakAssignment = assignments.find(a => a.type === 'RAK_NODE');
          
          
          // Assign the detected port to the mesh node
          
          if (rakAssignment) {
            meshNodeRef.current = new MeshHardwareNode();
            meshNodeRef.current.port = rakAssignment.port;
            await meshNodeRef.current.start();

            // Now listen for packets
            meshNodeRef.current.on('packet', (packet) => {
              tracker.current.processPacket(packet);
              updateUI(tracker.current.getStats());
            });
          }
          // ---- END INSERT ----
          
        } else {
          console.log('No RAK node detected - running in simulation mode');
          // Run simulation fallback here
          simulateIncomingFieldMeshNodes(location);
        }

      } catch (error) {
        console.error('USB setup failed:', error);
        // Fall back to simulation mode
        simulateIncomingFieldMeshNodes(location);
        
      }
    }

   // Cleanup function for mesh node
    const cleanup = () => {
      if (meshNodeRef.current && typeof meshNodeRef.current.stop === 'function') {
        meshNodeRef.current.stop();
      }
    };

    setupDevices();
    return cleanup;
  }, [location]);
 
 
  // --- NEW FUNCTIONS FROM MOMMA RAPTOR (MOVED OUTSIDE THE useEffect SO BUTTONS CAN SEE THEM!) ---
  const simulateIncomingFieldMeshNodes = (baseCoord) => {
    if (!baseCoord) return;
    const mockNodes = [
      { id: 'RAPTOR_NODE_01', lat: baseCoord.lat + 0.003, lng: baseCoord.lon + 0.002, alias: 'North Ridge Relay', threat: 'CLEAR', unvouchedDots: 0 },
      { id: 'RAPTOR_NODE_02', lat: baseCoord.lat - 0.002, lng: baseCoord.lon - 0.004, alias: 'South Exit Choke', threat: 'CLEAR', unvouchedDots: 0 },
      { id: 'RAPTOR_NODE_03', lat: baseCoord.lat + 0.001, lng: baseCoord.lon - 0.002, alias: 'West Treeline Perimeter', threat: 'PENDING', unvouchedDots: 3 }
    ];
    setActiveNodes(mockNodes);
       // Update UI with simulation stats
    const stats = { total: 3, friends: 2, relays: 1, sensors: 0 };
    updateUI(stats);
  };

  const engageEmergencyState = (type) => {
    setAlarmStatus(type);
    const logCoordinates = { lat: location.lat, lon: location.lon };
    if (!initialAlarmLocation) setInitialAlarmLocation(logCoordinates);
    simulateIncomingFieldMeshNodes(logCoordinates);
  };

  const cancelEmergencyState = () => {
    setAlarmStatus('CLEAR');
    setActiveNodes([]);
    setSelectedNode(null);
    setInitialAlarmLocation(null);
  };
  // --- END MOVED FUNCTIONS ---

/* commented out for deletion
  // --- USB DEVICE SETUP ---
  useEffect(() => {
    async function setupDevices() {
      try {
        // Check if Web Serial API is available
        if (!navigator.serial) {
          console.log('Web Serial API not available - running in simulation mode');
          return;
        }

        // Get available ports
        const ports = await navigator.serial.getPorts();
        
        if (ports.length === 0) {
          console.log('No USB devices detected - running in simulation mode');
          return;
        }

        // Import device detector
        const { DeviceDetector } = await import('../../lib/deviceDetector');
        const detector = new DeviceDetector();
        const assignments = await detector.assignDevices(ports);

        // Check if RAK node was found
        const hasRakNode = assignments.some(a => a.type === 'RAK_NODE');
        if (hasRakNode) {
          setDongleConnected(true);
          setMeshConnected(true);
          console.log('RAK node detected - live mode active');
        } else {
          console.log('No RAK node detected - running in simulation mode');
        }

        // If RAK node found, set up data routing
        // (Your existing MeshHardwareNode logic here)

      } catch (error) {
        console.error('USB setup failed:', error);
        // Fall back to simulation mode
      }
    }

    setupDevices();
  }, []); // Run once on mount
*/
  // -------------

  // Keep your original useEffect just for the sensors
  useEffect(() => {
    if (!sensorsEnabled) return;
    function handleOrientation(e) {
      if (typeof e.webkitCompassHeading === 'number') setHeading(e.webkitCompassHeading);
      else if (e.alpha != null) setHeading(360 - e.alpha);
    }
    function handleMotion(e) {
      const acc = e.accelerationIncludingGravity || e.acceleration;
      if (!acc) return;
      const mag = Math.sqrt((acc.x || 0) ** 2 + (acc.y || 0) ** 2 + (acc.z || 0) ** 2);
      const delta = lastMag.current == null ? 0 : Math.abs(mag - lastMag.current);
      lastMag.current = mag;
      setActivity((prev) => prev * 0.85 + Math.min(delta / 6, 1) * 0.15);
    }
    window.addEventListener('deviceorientation', handleOrientation);
    window.addEventListener('devicemotion', handleMotion);
    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
      window.removeEventListener('devicemotion', handleMotion);
    };
  }, [sensorsEnabled]);

  async function enableSensors() {
    const oriOk = await requestOrientationPermission();
    const motOk = await requestMotionPermission();
    setSensorsEnabled(oriOk || motOk);
  }

  const pulseDuration = 2.4 - activity * 1.4;

  return (
    <div className="relative min-h-screen overflow-hidden bg-raptor-void">
      {/* 1. The Map */}
            <LiveMap 
        lat={location.lat} 
        lon={location.lon} 
        heading={heading} 
        pulseDuration={pulseDuration} 
        onFail={() => setMapFailed(true)}
      >
        {/* Now the markers are children of the MapContainer! */}
        {activeNodes.map((node) => (
          <Marker
            key={node.id}
            position={[node.lat, node.lng]}
            icon={L.divIcon({
              className: 'mesh-node-marker',
              html: `<div style="background-color: ${node.unvouchedDots > 0 ? '#ef4444' : '#10b981'}; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 8px rgba(0,0,0,0.5);"></div>`,
              iconSize: [14, 14],
              iconAnchor: [7, 7]
            })}
            eventHandlers={{
              click: () => setSelectedNode(node)
            }}
          />
        ))}
      </LiveMap>

      <div className="pointer-events-none absolute inset-0 z-[400] bg-gradient-to-b from-raptor-void/70 via-transparent to-raptor-void/80" />

      <div className="absolute left-0 right-0 top-0 z-[500] flex items-center justify-between px-4 py-4">
        <div className="flex items-center gap-2 rounded-full border border-raptor-line bg-raptor-bg/90 px-3 py-1.5 backdrop-blur">
          <RaptorMark className="h-4 w-4" />
          <span className="text-xs font-medium text-slate-200">Live</span>
        </div>

        <div className="flex items-center gap-2 rounded-full border border-raptor-line bg-raptor-bg/90 px-3 py-1.5 backdrop-blur text-xs">
          <span className="text-slate-400">Nodes: <span id="nodes-online" className="text-raptor-cyan font-bold">0</span></span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400">Friends: <span id="friends-online" className="text-emerald-400 font-bold">0</span></span>
        </div>

    
        <button onClick={onOpenSettings} className="rounded-full border border-raptor-line bg-raptor-bg/90 p-2 text-slate-300 backdrop-blur hover:text-raptor-cyan">
          <Settings className="h-4 w-4" />
        </button>
      </div>

      {mapFailed && (
        <div className="absolute left-4 right-4 top-16 z-[500] flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-400 backdrop-blur">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> Map tiles unavailable — showing approximate position only.
        </div>
      )}


      {/* --- NEW OVERLAY TOOLBAR --- */}
      <div className="absolute bottom-24 left-1/2 z-[500] flex -translate-x-1/2 gap-2 rounded-full bg-raptor-bg/90 p-1.5 backdrop-blur border border-raptor-line">
        <button onClick={() => setShowMeshOverlay(!showMeshOverlay)} className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${showMeshOverlay ? 'bg-raptor-cyan/20 text-raptor-cyan' : 'text-slate-400 hover:text-slate-200'}`}>
          Meshtastic
        </button>
        <button onClick={() => setShowRadarOverlay(!showRadarOverlay)} className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${showRadarOverlay ? 'bg-raptor-cyan/20 text-raptor-cyan' : 'text-slate-400 hover:text-slate-200'}`}>
          Radar
        </button>
        <button onClick={() => setShowChatOverlay(!showChatOverlay)} className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${showChatOverlay ? 'bg-raptor-cyan/20 text-raptor-cyan' : 'text-slate-400 hover:text-slate-200'}`}>
          Chat
        </button>
      </div>
 

      <div className="absolute bottom-0 left-0 right-0 z-[500] rounded-t-2xl border-t border-raptor-line bg-raptor-bg/95 px-4 pb-6 pt-4 backdrop-blur">
        {alarmStatus === 'CLEAR' ? (
          <div className="flex flex-col gap-3">
            <div className="flex gap-3">
              <button onClick={() => engageEmergencyState('SCREAMING')} className="flex-1 rounded-lg bg-rose-600 py-3 text-sm font-bold text-white shadow-lg hover:bg-rose-500">
                🔊 ALARM SOUND
              </button>
              <button onClick={() => engageEmergencyState('SILENT')} className="flex-1 rounded-lg bg-amber-500 py-3 text-sm font-bold text-white shadow-lg hover:bg-amber-400">
                🤫 SILENT BEACON
              </button>
            </div>
            <button onClick={() => setMeshConnected((v) => !v)} className={`w-full rounded-lg border px-3 py-2 text-sm ${meshConnected ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' : 'border-raptor-line text-slate-400 hover:border-slate-600'}`}>
              <span className="flex items-center justify-center gap-2"><Radio className="h-4 w-4" /> {meshConnected ? 'Meshtastic connected' : 'Connect Meshtastic'}</span>
            </button>
          </div>
        ) : (
          // ALARM ACTIVE STATE
          <div className="flex flex-col gap-3">
            <button onClick={cancelEmergencyState} className="w-full rounded-lg bg-emerald-500 py-4 text-sm font-bold text-white shadow-lg hover:bg-emerald-400">
              ✅ CANCEL ALERT (PIN)
            </button>
            {/* Selected Node Overlay */}
            {selectedNode && (
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
                <p className="text-xs text-amber-300">Node {selectedNode.id} selected.</p>
                <input 
                  placeholder="Enter threat notes..." 
                  value={nodeThreatDescription} 
                  onChange={(e) => setNodeThreatDescription(e.target.value)}
                  className="mt-2 w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-white outline-none" 
                />
                <button onClick={() => {
                    setActiveNodes(prev => prev.map(n => n.id === selectedNode.id ? { ...n, threat: 'CONFIRMED_OPPOSITION' } : n));
                    setSelectedNode(null);
                    setNodeThreatDescription('');
                  }} 
                  className="mt-2 w-full rounded bg-rose-600 py-1 text-xs font-bold text-white">
                  CONFIRM OPPOSITION
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [view, setView] = useState('splash');
  const [location, setLocation] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const minDelay = new Promise((res) => setTimeout(res, 1100));
    (async () => {
      let loc = null;
      try {
        const storedData = localStorage.getItem('user-location');
        if (storedData) loc = JSON.parse(storedData);
      } catch (e) { /* no stored location yet */ }
      await minDelay;
      if (cancelled) return;
      if (loc && typeof loc.lat === 'number' && typeof loc.lon === 'number') {
        setLocation(loc);
        setView('home');
      } else {
        setView('setup');
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (view === 'splash') return <Splash />;
  if (view === 'setup') return <LocationSetup onLocated={(loc) => { setLocation(loc); setView('home'); }} />;
  return <HomeField location={location} onOpenSettings={() => setView('setup')} />;
}
