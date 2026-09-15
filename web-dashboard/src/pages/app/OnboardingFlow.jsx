import React from 'react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Crosshair } from 'lucide-react';
import { Settings, MapPin, Compass, Radio, AlertTriangle, Loader2 } from 'lucide-react';
import RaptorMark from '../../components/RaptorMark.jsx';
import { ActiveNodeTracker } from '../../lib/localActiveNodes.js';
// Add at the top of the file
import { FusionDetailPanel, FusionPacketMarker } from '../../components/FusionPacketOverlay.jsx';
import { OffScreenIndicators } from '../../components/OffScreenIndicators.jsx';
import { MeshHardwareNode } from '../../components/MeshHardwareNode';
// Add at the top of the file
import { DeviceDetector } from '../../lib/deviceDetector';
import { registerSimHandler, registerClearHandler, setSimBase } from '../../lib/simulation.js';
import '../../styles/raptor-ui.css';
import { NUDGES, getLoadout } from '../../lib/loadouts.js';
import { playSiren, stopSiren } from '../../lib/alarmAudio.js';
import { useLiveLocation } from '../../hooks/useLiveLocation';
import 'maplibre-gl/dist/maplibre-gl.css';
import '@maplibre/maplibre-gl-leaflet';

const BRAND_NAME = 'The Raptor';
const BRAND_TAGLINE = 'Scream Network';


function VectorBaseMap() {
  const map = useMap();
  useEffect(() => {
    const gl = L.maplibreGL({
      style: 'https://tiles.openfreemap.org/styles/dark'
    }).addTo(map);
    return () => { map.removeLayer(gl); };
  }, [map]);
  return null;
}

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
        <div class="raptor-beacon-label">You</div>
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


// NEW -- Radar rendered as a Leaflet marker so it moves with the map
function RadarSweepMarker({ lat, lon, size = 340 }) {
  const icon = L.divIcon({
    className: 'raptor-radar-icon',
    html: `<div class="raptor-radar-sweep" style="width:${size}px;height:${size}px"></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2], // center on the lat/lon point
  });
  return (
    <Marker
      position={[lat, lon]}
      icon={icon}
      interactive={false}
      keyboard={false}
      zIndexOffset={-100} // sit behind the beacon and node markers
    />
  );
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
        url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenTopoMap"
        eventHandlers={{ tileerror: () => onFail() }}
      />
 

      {/* 
        <VectorBaseMap />
        <TileLayer
            url="https://tiles.openfreemap.org/styles/liberty/{z}/{x}/{y}.png"
            attribution="&copy; OpenFreeMap &copy; OpenMapTiles &copy; OpenStreetMap contributors"
            eventHandlers={{ tileerror: () => onFail() }}
        />

        {(() => {
          const map = useMap();
          useEffect(() => {
            const gl = L.maplibreGL({
              style: 'https://tiles.openfreemap.org/styles/liberty'
            }).addTo(map);
            return () => { map.removeLayer(gl); };
          }, [map]);
          return null;
        })()}

        <TileLayer
          url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenTopoMap"
          eventHandlers={{ tileerror: () => onFail() }}
        />
        <TileLayer
          url="https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png"
          attribution="&copy; CARTO"
          eventHandlers={{ tileerror: () => onFail() }}
        />
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          attribution="&copy; Esri"
          eventHandlers={{ tileerror: () => onFail() }}
        />
        <TileLayer
          url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenTopoMap"
          eventHandlers={{ tileerror: () => onFail() }}
        />
      */}

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
  const live = useLiveLocation(location);
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
  const [showVariance, setShowVariance] = useState(true);

  // In the HomeField component
  const tracker = useRef(new ActiveNodeTracker());
  // --- TOAST / NUDGE STATE ---
  const [toasts, setToasts] = useState([]);
  
  const [selectedFusion, setSelectedFusion] = useState(null);
  const [fusionPackets, setFusionPackets] = useState([]);


  const showToast = (text, opts = {}) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, text, ...opts }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, opts.duration || 6000);
  };

  const showNudge = (key) => {
    const nudge = NUDGES[key];
    if (!nudge) return;
    const loadout = getLoadout(nudge.loadout);
    showToast(nudge.message, {
      title: nudge.title,
      loadout,
      duration: 8000,
    });
  };

  useEffect(() => {
    setSimBase(live.lat, live.lon);
  }, [live.lat, live.lon]);
 
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

    useEffect(() => {
      registerClearHandler(() => {
        setFusionPackets([]);
        // setActiveNodes([]);
        // DO NOT clear activeNodes — infrastructure stays visible
        setSelectedFusion(null);
        setSelectedNode(null);
      });
    }, []);
    
    function MapInstanceGetter({ onMap }) {
      const map = useMap();
      useEffect(() => { onMap(map); }, [map, onMap]);
      return null;
    }
    // ─── Sim → Map bridge ───
    useEffect(() => {
      registerSimHandler((packet) => {
        console.log('[SIM IN]', packet.typ, packet.nid, packet.d);

        // Route by packet type
        if (packet.typ === 'SNS') {
          // Add to fusion packets → renders as FusionPacketMarker on map
          setFusionPackets((prev) => [...prev.slice(-50), packet]);
        }
        else if (packet.typ === 'ALM') {
          // Trigger alarm UI
          setAlarmStatus(packet.d.mode === 'SCR' ? 'SCREAMING' : 'SILENT');
          if (packet.d.mode === 'SCR') playSiren();
        }
        else if (packet.typ === 'HBT') {
          // Add or update a friendly node on map
          const nodeId = packet.nid;
          setActiveNodes((prev) => {
            const existing = prev.findIndex((n) => n.id === nodeId);
            const node = {
              id: nodeId,
              lat: packet.d.lat,
              lng: packet.d.lon,
              alias: nodeId,
              threat: 'CLEAR',
              unvouchedDots: 0,
            };
            if (existing >= 0) {
              const next = [...prev];
              next[existing] = { ...next[existing], ...node };
              return next;
            }
            return [...prev, node];
          });
        }
        else if (packet.typ === 'CHT') {
          // Optional: log to chat drawer later
          console.log('[CHAT]', packet.d.from, ':', packet.d.txt);
        }
      });
    }, []);

  


  // --- USB DEVICE SETUP ---
  useEffect(() => {
    async function setupDevices() {
      try {
        // Check if Web Serial API is available
        // Check if Web Serial API is available
        if (!navigator.serial) {
          console.log('Web Serial API not available - running in simulation mode');
          simulateIncomingFieldMeshNodes(location);
          return;
        }

        // Get available ports
        const ports = await navigator.serial.getPorts();
        
        if (ports.length === 0) {
          console.log('No USB devices detected - running in simulation mode');
          simulateIncomingFieldMeshNodes(location);
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
                if (packet.typ === 'SNS') {
                  setFusionPackets(prev => [...prev.slice(-50), packet]);
                }
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
const [leafletMap, setLeafletMap] = useState(null);
  const engageEmergencyState = (type) => {
    setAlarmStatus(type);
    const logCoordinates = { lat: live.lat, lon: live.lon };
    if (!initialAlarmLocation) setInitialAlarmLocation(logCoordinates);
    simulateIncomingFieldMeshNodes(logCoordinates);

    // Loud alarm plays the siren; silent does not.
    if (type === 'SCREAMING') {
      playSiren();
    } else {
      stopSiren();
    }

    // Outgoing mesh payload (real hardware sends this; simulation logs it).
    const payload = {
      type: 'ALARM',
      alarmType: type,
      gpsOrigin: logCoordinates,
      gpsCurrent: logCoordinates,
      timestamp: Date.now(),
      audioFile: type === 'SCREAMING' ? 'bigHypnotize' : null,
      playAt: Date.now() + 2000,
      ttsText:
        type === 'SCREAMING'
          ? 'Help! I am under attack!'
          : 'Silent alert triggered.',
    };

    if (meshNodeRef.current && typeof meshNodeRef.current.sendAlert === 'function') {
      meshNodeRef.current.sendAlert(payload).catch((err) =>
        console.warn('Failed to send alarm:', err)
      );
    } else {
      console.log('Alarm sent (simulation):', payload);
    }

    // Nudge the user about what gear makes this real.
    showNudge('alarm');
  };

  const cancelEmergencyState = () => {
    setAlarmStatus('CLEAR');
    setActiveNodes([]);
    setSelectedNode(null);
    setInitialAlarmLocation(null);
    stopSiren();
  };
  
 

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
        lat={live.lat} 
        lon={live.lon} 
        heading={live.heading} 
        pulseDuration={pulseDuration} 
        onFail={() => setMapFailed(true)}
      >


      <OffScreenIndicators
        markers={[
          // Fusion packets
          ...fusionPackets.map((p) => ({
            id: p.id,
            lat: p.d?.lat,
            lng: p.d?.lon,
            threat: p.d?.conf >= 80 ? 'threat' : 'stranger',
            data: p,
            type: 'fusion',
          })),
          // Active nodes
          ...activeNodes.map((n) => ({
            id: n.id,
            lat: n.lat,
            lng: n.lng,
            threat: n.threat === 'CONFIRMED_OPPOSITION' ? 'threat' : 'CLEAR',
            data: n,
            type: 'node',
          })),
        ]}
        onZoneClick={(marker) => {
          if (!leafletMap) return;
          leafletMap.flyTo([marker.lat, marker.lng], 16, { duration: 0.8 });
          if (marker.type === 'fusion') setSelectedFusion(marker.data);
          if (marker.type === 'node') setSelectedNode(marker.data);
        }}
      />

       <MapInstanceGetter onMap={setLeafletMap} />
       {/* 
       TODO: I need to figure out how to get thia to show raster OpenFreeMap
       <VectorBaseMap />
        */}

        {/* Radar sweep — appears centered on your position */}
        {showRadarOverlay && (
          <RadarSweepMarker lat={live.lat} lon={live.lon} size={340} />
        )}
        {/* Fusion packets — as Leaflet markers */}
        {fusionPackets.map((p) => (
          <FusionPacketMarker
            key={`${p.id}-${showVariance ? 'v' : 'nv'}`}   // ← key changes with toggle
            packet={p}
            onSelect={setSelectedFusion}
            showVariance={showVariance} 
          />
        ))}
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
      
      {/* Radar sweep overlay — appears centered when toggled */} 
      {leafletMap && (
        <button
          onClick={() => {
            leafletMap.flyTo([live.lat, live.lon], 16, { duration: 0.8 });
          }}
          className="absolute bottom-[220px] right-4 z-[560] flex h-11 w-11 items-center justify-center rounded-full border border-raptor-line bg-raptor-bg/95 backdrop-blur shadow-lg transition hover:border-raptor-cyan hover:text-raptor-cyan"
          aria-label="Return to my position"
        >
          <Crosshair className="h-5 w-5" />
        </button>
      )}

      {/* Radar sweep overlay — appears centered when toggled */}
     
      {/* Detail panel is OUTSIDE LiveMap — it's a floating panel, not a marker */}
      {selectedFusion && (
        <FusionDetailPanel
          packet={selectedFusion}
          onClose={() => setSelectedFusion(null)}
        />
      )}

      <div className="pointer-events-none absolute inset-0 z-[400] bg-gradient-to-b from-raptor-void/70 via-transparent to-raptor-void/80" />

      <div className="absolute left-0 right-0 top-0 z-[500] flex items-center justify-between px-4 py-4">
        <div className={`flex items-center gap-2 rounded-full border px-3 py-1.5 backdrop-blur ${
          dongleConnected 
            ? 'border-emerald-500/30 bg-emerald-500/10' 
            : 'border-amber-500/30 bg-amber-500/10'
        }`}>
          <RaptorMark className="h-4 w-4" />
          <span className={`text-xs font-medium ${
            dongleConnected ? 'text-emerald-300' : 'text-amber-300'
          }`}>
            {dongleConnected ? 'Live' : 'Simulation'}
          </span>
        </div>

        <div className="flex items-center gap-2 rounded-full border border-raptor-line bg-raptor-bg/90 px-3 py-1.5 backdrop-blur text-xs">
          <span className="text-slate-400">Nodes: <span id="nodes-online" className="text-raptor-cyan font-bold">0</span></span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400">Friends: <span id="friends-online" className="text-emerald-400 font-bold">0</span></span>
        </div>

    

        <div className="flex items-center gap-2">
            {/* Variance toggle — NEW */}
            <button
              onClick={() => {
                const next = !showVariance;
                console.log('[Variance toggle]', next ? 'ON' : 'OFF');
                setShowVariance(next);
              }}

              className={`flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs backdrop-blur transition ${
                showVariance
                  ? 'border-raptor-cyan/50 bg-raptor-cyan/10 text-raptor-cyan'
                  : 'border-raptor-line bg-raptor-bg/90 text-slate-400'
              }`}
              aria-label="Toggle variance circles"
            >
              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="9" strokeDasharray="3 3" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              <span>Variance</span>
            </button>

            <button onClick={onOpenSettings} className="rounded-full border border-raptor-line bg-raptor-bg/90 p-2 text-slate-300 backdrop-blur hover:text-raptor-cyan">
              <Settings className="h-4 w-4" />
            </button>
          </div>

      </div>

      {mapFailed && (
        <div className="absolute left-4 right-4 top-16 z-[500] flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-400 backdrop-blur">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> Map tiles unavailable — showing approximate position only.
        </div>
      )}


      {/* --- NEW OVERLAY TOOLBAR --- */}

 
 

     <div className="absolute bottom-0 left-0 right-0 z-[500] rounded-t-2xl border-t border-raptor-line bg-raptor-bg/95 px-4 pb-6 pt-4 backdrop-blur">

  {/* ─── PANEL 1: overlay toggles + mesh connect ─── */}
  <div className="raptor-panel-row">
    <button
      className={`raptor-chip ${showMeshOverlay ? 'active' : ''}`}
      onClick={() => {
        const next = !showMeshOverlay;
        setShowMeshOverlay(next);
        if (next) showNudge('mesh');
      }}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 11.5a11.5 11.5 0 0 1 16 0" />
        <path d="M7.3 15a7 7 0 0 1 9.4 0" />
        <circle cx="12" cy="19" r="1.3" fill="currentColor" stroke="none" />
      </svg>
      <span>Mesh</span>
    </button>

    <button
      className={`raptor-chip ${showRadarOverlay ? 'active' : ''}`}
      onClick={() =>  {
        const next = !showRadarOverlay;
        setShowRadarOverlay(next);
        if (next) showNudge('radar');
      }}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="2.3" fill="currentColor" stroke="none" />
        <circle cx="12" cy="12" r="6.5" />
        <circle cx="12" cy="12" r="10.5" opacity="0.5" />
      </svg>
      <span>Radar</span>
    </button>

    <button
      className={`raptor-chip ${showChatOverlay ? 'active' : ''}`}
      onClick={() => {
        const next = !showChatOverlay;
        setShowChatOverlay(next);
        if (next) showNudge('chat');
      }}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 11.5a8.4 8.4 0 0 1-8.4 8.4 8.3 8.3 0 0 1-3.8-.9L3 21l1.9-5.8a8.3 8.3 0 0 1-.9-3.8A8.4 8.4 0 0 1 12.5 3h.1a8.4 8.4 0 0 1 8.4 8.4z" />
      </svg>
      <span>Chat</span>
    </button>

    <button
      className={`raptor-chip raptor-chip-connect ${meshConnected ? 'connected' : ''}`}
      onClick={() => {
        const next = !meshConnected;
        setMeshConnected(next);
        if (next && !dongleConnected) showNudge('connect');
      }}
    >
      <Radio className="raptor-icon-14" />
      <span>{meshConnected ? 'Connected' : 'Connect Meshtastic'}</span>
    </button>
  </div>

  {/* ─── PANEL 2: alarm ─── */}
  {alarmStatus === 'CLEAR' ? (
    <div className="raptor-alarmrow">
      <button
        className="raptor-btn-alarm raptor-btn-loud"
        onClick={() => engageEmergencyState('SCREAMING')}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="raptor-icon-16">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.7 21a2 2 0 0 1-3.4 0" />
        </svg>
        <span>Loud Alarm</span>
      </button>

      <button
        className="raptor-btn-alarm raptor-btn-silent"
        onClick={() => engageEmergencyState('SILENT')}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="raptor-icon-16">
          <path d="M8.7 3.7A6 6 0 0 1 18 8c0 3.5.9 5.8 1.6 7.1" />
          <path d="M6.3 6.3C6 6.9 6 7.9 6 8c0 7-3 9-3 9h13" />
          <path d="M13.7 21a2 2 0 0 1-3.4 0" />
          <line x1="2" y1="2" x2="22" y2="22" />
        </svg>
        <span>Silent</span>
      </button>
    </div>
  ) : (
    <div className="flex flex-col gap-3">
      <button onClick={cancelEmergencyState} className="raptor-btn-stop">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="raptor-icon-16">
          <line x1="6" y1="6" x2="18" y2="18" />
          <line x1="18" y1="6" x2="6" y2="18" />
        </svg>
        <span>Cancel Alert (PIN)</span>
      </button>
      {selectedNode && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
          <p className="text-xs text-amber-300">Node {selectedNode.id} selected.</p>
          <input
            placeholder="Enter threat notes..."
            value={nodeThreatDescription}
            onChange={(e) => setNodeThreatDescription(e.target.value)}
            className="mt-2 w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-white outline-none"
          />
          <button
            onClick={() => {
              setActiveNodes(prev => prev.map(n => n.id === selectedNode.id ? { ...n, threat: 'CONFIRMED_OPPOSITION' } : n));
              setSelectedNode(null);
              setNodeThreatDescription('');
            }}
            className="mt-2 w-full rounded bg-rose-600 py-1 text-xs font-bold text-white"
          >
                        CONFIRM OPPOSITION
          </button>
        </div>
      )}
    </div>
  )}
</div>

{/* ─── TOASTS (nudges) ─── */}
<div className="pointer-events-none absolute left-3 right-3 top-20 z-[700] flex flex-col gap-2">
  {toasts.map((t) => (
    <div
      key={t.id}
      className="pointer-events-auto relative rounded-xl border border-raptor-line bg-raptor-bg/95 px-3 py-2 pr-8 backdrop-blur shadow-lg"
    >
      <button
        onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
        className="absolute right-2 top-2 text-slate-500 hover:text-slate-200 transition-colors"
        aria-label="Close"
      >
        ✕
      </button>
      {t.title && (
        <div className="mb-0.5 text-xs font-semibold text-raptor-cyan">
          {t.title}
        </div>
      )}
      <div className="text-xs leading-relaxed text-slate-300">{t.text}</div>
      {t.loadout && (
        <a
          href={t.loadout.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1.5 inline-block text-xs font-semibold text-raptor-cyan underline underline-offset-2"
        >
          Get {t.loadout.title} →
        </a>
      )}
    </div>
  ))}
</div>

{/* ─── CHAT DRAWER ─── */}
<div
  className={`absolute right-0 top-0 bottom-0 z-[600] w-[min(340px,88vw)] border-l border-raptor-line bg-raptor-bg/95 backdrop-blur transition-transform duration-300 ${
    showChatOverlay ? 'translate-x-0' : 'translate-x-full'
  }`}
>
  <div className="flex items-center justify-between border-b border-raptor-line px-4 py-3">
    <b className="text-sm text-slate-100">Mesh Chat</b>
    <button
      onClick={() => setShowChatOverlay(false)}
      className="text-slate-400 hover:text-slate-100"
      aria-label="Close chat"
    >
      ✕
    </button>
  </div>
  <div className="flex h-[calc(100%-56px)] flex-col">
    <div className="flex-1 space-y-2 overflow-y-auto p-3">
      <div className="rounded-lg border border-amber-500/25 bg-amber-500/10 p-2 text-center text-[11px] text-amber-300">
        Simulation — connect a C2 Dongle to enable live mesh chat.
      </div>
    </div>
    <div className="flex gap-2 border-t border-raptor-line p-3">
      <input
        type="text"
        placeholder="Message the mesh…"
        maxLength={140}
        className="flex-1 rounded-lg border border-raptor-line bg-raptor-bg2 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-raptor-cyan"
      />
      <button
        className="rounded-lg bg-raptor-cyan px-4 text-sm font-bold text-raptor-void"
        onClick={() => showNudge('chat')}
      >
        Send
      </button>
    </div>
  </div>
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
