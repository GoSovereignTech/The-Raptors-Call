import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { UnconfirmedMarker } from './UnconfirmedMarker.jsx';
import {
  findNearestPlausiblePerson,
  resolveMovement,
  generateEntityId,
} from './../lib/entityMatcher.js';
import { PointSampler } from './PointSampler.jsx';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Crosshair, Bell } from 'lucide-react';
import { Settings, MapPin, Compass, Radio, AlertTriangle, Loader2 } from 'lucide-react';
import RaptorMark from './RaptorMark.jsx';
import { ActiveNodeTracker } from './../lib/localActiveNodes.js';
// Add at the top of the file
import { registerMessageHandler, requestNotificationPermission } from './../lib/messageCenter.js';
import { DemoPilot } from './DemoPilot.jsx';
import SplashPage from './SplashPage.jsx';
import { FusionDetailPanel, FusionPacketMarker } from './FusionPacketOverlay.jsx';
import { OffScreenIndicators } from './OffScreenIndicators.jsx';
import { MeshHardwareNode } from './MeshHardwareNode';
import { EntityDetailPanel } from './EntityDetailPanel.jsx';
// Add at the top of the file
import { DeviceDetector } from './../lib/deviceDetector';
import { registerSimHandler, registerClearHandler, setSimBase } from './../lib/simulation.js';
import './../styles/raptor-ui.css';
import { NUDGES, getLoadout } from './../lib/loadouts.js';
import { playSiren, stopSiren } from './../lib/alarmAudio.js';
import { useLiveLocation } from './../hooks/useLiveLocation';
import { useFunnelStatus, markFunnelStepDone } from './../hooks/useFunnelStatus.js';
import 'maplibre-gl/dist/maplibre-gl.css';
import '@maplibre/maplibre-gl-leaflet'; 
import { PersonMarker, PersonGhost } from './PersonMarker.jsx';
import { movementFromSpeed } from './../lib/personIcons.js';

import { enrichEntity, sortEntities, setProfileDb } from './../lib/entityProfiles.js';
import { saveProfile } from './../lib/entityProfiles.js';
import SettingsPage from './SettingsPage.jsx';

import { RewindPanel } from './RewindPanel';
 

const BRAND_NAME = 'The Raptor';
const BRAND_TAGLINE = 'Scream Network';
const SHOW_DEV_TOOL = 0; 
 
const NODE_COLORS = {
  sensor: '#4b5563',   // dark grey
  relay:  '#9ca3af',   // light grey
  bridge: '#1f2937',   // near black
};

// ─── Funnel step copy ───
const STEP_LABELS = {
  1: 'Try the web app',
  2: 'Buy a loadout',
  3: 'Book your intake call',
  4: 'Receive your gear',
  5: 'Join a training day',
};

const STEP_LINKS = {
  1: 'https://theraptors.netlify.app',
  2: 'https://sparklesnovel.gumroad.com',
  3: 'https://calendly.com/stephensutherlandmd/30min',      // ← replace with your Calendly link
  4: '#',                                              // no action — just wait
  5: 'https://calendly.com/stephensutherlandmd/training',    // ← replace with training event link
};

const STEP_KEYS = {
  1: 'triedDemo',
  2: 'purchased',
  3: 'intakeScheduled',
  // 4: 'gearReceived', (No link for this one, handled elsewhere)
  5: 'trained',
};


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


function beaconIcon(heading, pulseDuration, alert) {
  const color = alert ? 'var(--threat-unknown)' : 'var(--beacon-fill)';
  return L.divIcon({
    className: 'raptor-beacon-icon',
    html: `
      <div class="raptor-beacon">
        <span class="raptor-beacon-ring" style="--raptor-beacon-color:${color}; animation-duration:${pulseDuration}s"></span>
        <span class="raptor-beacon-ring" style="--raptor-beacon-color:${color}; animation-duration:${pulseDuration}s; animation-delay:${pulseDuration / 2}s"></span>
        <div class="raptor-beacon-dot" style="background:${color}">
          <svg viewBox="0 0 24 24" width="16" height="16" style="transform:rotate(${heading}deg); transition:transform 0.2s linear">
            <path d="M12 2 L19 21 L12 17 L5 21 Z" fill="var(--beacon-stroke)" />
          </svg>
        </div>
        <div class="raptor-beacon-label">You</div>
      </div>`,
    iconSize: [48, 48],
    iconAnchor: [24, 24],
  });
}




// NEW -- Radar rendered as a Leaflet marker so it moves with the map
const RadarSweepMarker = React.memo(function RadarSweepMarker({
  lat,
  lon,
  radiusMeters = 30,   // tune this: 10 = accurate to sensor, 30 = visible
  minPx = 40,
  maxPx = 900,
}) {
  const markerRef = useRef(null);
  const map = useMap();
  const [scale, setScale] = useState(1);

  // Compute pixel diameter for the target radius at current zoom
  const computeScale = useCallback(() => {
    const zoom = map.getZoom();
    const metersPerPixel =
      156543.03392 * Math.cos((lat * Math.PI) / 180) / Math.pow(2, zoom);
    const rawDiameter = (radiusMeters * 2) / metersPerPixel;
    const clampedDiameter = Math.max(minPx, Math.min(maxPx, rawDiameter));
    // Base HTML size is 400px; scale to reach clampedDiameter
    return clampedDiameter / 400;
  }, [map, lat, radiusMeters, minPx, maxPx]);

  // Recompute on zoom/pan
  useEffect(() => {
    setScale(computeScale());
    const onMove = () => setScale(computeScale());
    map.on('zoomend', onMove);
    map.on('moveend', onMove);
    return () => {
      map.off('zoomend', onMove);
      map.off('moveend', onMove);
    };
  }, [map, computeScale]);

  // Apply scale to the inner element WITHOUT touching the icon HTML,
  // so the CSS rotation animation never restarts.
  useEffect(() => {
    if (!markerRef.current) return;
    const el = markerRef.current.getElement();
    if (!el) return;
    const inner = el.querySelector('.raptor-radar-scaler');
    if (inner) inner.style.transform = `scale(${scale})`;
  }, [scale]);

  // Icon built ONCE — never regenerated, so no animation restart
  const icon = useMemo(
    () =>
      L.divIcon({
        className: 'raptor-radar-icon',
        html: `
          <div class="raptor-radar-scaler" style="
            width:400px;height:400px;
            transform-origin:center center;
            transition:transform 0.15s ease-out;
          ">
            <div class="raptor-radar-sweep" style="width:400px;height:400px"></div>
          </div>
        `,
        iconSize: [400, 400],
        iconAnchor: [200, 200],
      }),
    []
  );

  useEffect(() => {
    if (markerRef.current) markerRef.current.setLatLng([lat, lon]);
  }, [lat, lon]);

  return (
    <Marker
      ref={markerRef}
      position={[lat, lon]}
      icon={icon}
      interactive={false}
      keyboard={false}
      zIndexOffset={-100}
    />
  );
});

function VectorBaseMap() {
  const map = useMap();
  useEffect(() => {
    let gl;
    try {
      gl = L.maplibreGL({
        style: 'https://tiles.openfreemap.org/styles/liberty'
      }).addTo(map);
    } catch (e) {
      console.warn('[VectorBaseMap] maplibre failed:', e);
    }
    return () => { if (gl) map.removeLayer(gl); };
  }, [map]);
  return null;
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
      {/* 
      <TileLayer
        url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenTopoMap"
        eventHandlers={{ tileerror: () => onFail() }}
      />
 
      */}
      
        <VectorBaseMap />
      {/*
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

     
      <HeadingMarker lat={lat} lon={lon} heading={heading} pulseDuration={pulseDuration} alert={false} />
      
      {/* THIS LINE LETS NODES BE RENDERED INSIDE THE MAP CONTAINER */}
      {children} 
    </MapContainer>
  );
}



function InitialRecenter({ lat, lon }) {
  const map = useMap();
  const hasCentered = useRef(false);
  useEffect(() => {
    if (!hasCentered.current) {
      map.setView([lat, lon], 16);
      hasCentered.current = true;
    }
  }, [map, lat, lon]);
  return null;
}


export default function HomeField({ location, onOpenSettings }) {
  const live = useLiveLocation(location);
  const status = useFunnelStatus();
  const [heading, setHeading] = useState(0);
  const [activity, setActivity] = useState(0.15);
  const [sensorsEnabled, setSensorsEnabled] = useState(false);
  const [meshConnected, setMeshConnected] = useState(false);
  const [dongleConnected, setDongleConnected] = useState(false);
  const [mapFailed, setMapFailed] = useState(false);
  // message center  
  const [appMessage, setAppMessage] = useState(null);

  const [rewindTime, setRewindTime] = useState(Date.now());
  const [isPlayingRewind, setIsPlayingRewind] = useState(false);


  const appMsgTimeoutRef = useRef(null);

  const lastMag = useRef(null);
  const meshNodeRef = useRef(null);
  const activeNodesRef = useRef([]);
  // Add this state/ref near your other refs at the top of HomeField
    const lastCenteredRef = useRef(null);
    const CENTER_THRESHOLD_METERS = 15; // ~50 feet. Adjust this to your liking.


  // --- NEW STATES FROM MOMMA RAPTOR ---
  const [alarmStatus, setAlarmStatus] = useState('CLEAR');
  const [activeNodes, setActiveNodes] = useState([]); 
  const [initialAlarmLocation, setInitialAlarmLocation] = useState(null); 
  const [chatMessages, setChatMessages] = useState([]);

  // -- state for personal detail.
  const [detailEntity, setDetailEntity] = useState(null);
  const [detailCategory, setDetailCategory] = useState('friend');
  const [highlightedId, setHighlightedId] = useState(null);
  // --- OVERLAY STATES ---
  const [showMeshOverlay, setShowMeshOverlay] = useState(false);
  const [showRadarOverlay, setShowRadarOverlay] = useState(false);
  const [showChatOverlay, setShowChatOverlay] = useState(false);
  const [showVariance, setShowVariance] = useState(true);
  const [ghosts, setGhosts] = useState([]);
  const [leafletMap, setLeafletMap] = useState(null);
 // Add this near your other useState calls in HomeField
 const [alarmIndex, setAlarmIndex] = useState(0);

  // In the HomeField component
  const tracker = useRef(new ActiveNodeTracker());
  // Position history per node for trail rendering 
  // --- TOAST / NUDGE STATE ---
  const [toasts, setToasts] = useState([]);
  
  const [selectedFusion, setSelectedFusion] = useState(null);
  const [fusionPackets, setFusionPackets] = useState([]);

  /* states for person icon smooth movement */
  const [unconfirmedMarkers, setUnconfirmedMarkers] = useState([]);
  const entityHistoryRef = useRef(new Map());   // entityId → [{lat, lng, ts, movement}, ...]

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

  const SHOW_GHOSTS = false; 
  
  const [isRewinding, setIsRewinding] = useState(false);
  
  // two helper callbacks inside HomeFields
  // ─── Record a position update into history for this entity ───
  const recordHistory = (entity) => {
    const hist = entityHistoryRef.current.get(entity.id) || [];
    hist.push({
      lat: entity.lat,
      lng: entity.lng ?? entity.lon,
      ts: entity.lastUpdate || Math.floor(Date.now() / 1000),
      movement: entity.movement,
    });
    if (hist.length > 500) hist.shift();
    entityHistoryRef.current.set(entity.id, hist);
  };

  // ─── Move an existing entity to a new position ───
  // Records previous position in history, then updates the entity.
  // PersonMarker's useEffect picks up the lat/lng change and interpolates.
  const moveEntity = (entityId, lat, lng, mot, speed) => {
    setActiveNodes((prev) =>
      prev.map((n) => {
        if (n.id !== entityId) return n;
        recordHistory(n);  // save old position BEFORE updating
        return {
          ...n,
          lat,
          lng,
          movement: resolveMovement(mot, speed, n.movement),
          speed: speed != null ? speed : n.speed,
          lastUpdate: Math.floor(Date.now() / 1000),
        };
      })
    );
  };


  useEffect(() => {
    setSimBase(live.lat, live.lon);
  }, [live.lat, live.lon]);
 
  useEffect(() => {
    activeNodesRef.current = activeNodes;
  }, [activeNodes]);

  useEffect(() => {
    registerMessageHandler((incoming) => {
      // Replace whatever's on screen
      if (appMsgTimeoutRef.current) clearTimeout(appMsgTimeoutRef.current);
      setAppMessage(incoming);
      // Auto-dismiss after duration unless it's an alarm
      if (incoming.priority !== 'alarm') {
        appMsgTimeoutRef.current = setTimeout(() => setAppMessage(null), incoming.durationMs);
      }
      return;
    });

    // Ask for notification permission on first user interaction
    const askOnce = () => {
      requestNotificationPermission();
      window.removeEventListener('click', askOnce);
      window.removeEventListener('touchstart', askOnce);
    };
    window.addEventListener('click', askOnce, { once: true });
    window.addEventListener('touchstart', askOnce, { once: true });

    return () => {
      if (appMsgTimeoutRef.current) clearTimeout(appMsgTimeoutRef.current);
    };
  }, []);

  // -- send 
  // After your other hooks:

const allEntities = useMemo(() => {
  const friends = activeNodes
    .filter((n) => !n.isSelf)
    .map((n) => ({ ...enrichEntity(n), _type: 'node' }));
  const fusions = fusionPackets.map((p) => ({
    id: p.id,
    nid: p.nid,
    lat: p.d?.lat,
    lng: p.d?.lon,
    threat: p.d?.conf >= 80 ? 'threat' : 'unknown',
    movement: p.d?.mot,
    alarm: p.d?.mode === 'SCR' ? 'loud' : p.d?.mode === 'SIL' ? 'silent' : 'off',
    _type: 'fusion',
    _packet: p,
  }));
  return sortEntities([...friends, ...fusions], { lat: live.lat, lon: live.lon });
}, [activeNodes, fusionPackets, live.lat, live.lon]);

const navigateCategory = (direction) => {
  const current = detailEntity;
  if (!current) return;
  const inCategory = allEntities.filter((e) => {
    const cat = e.threat === 'enemy' || e.threat === 'threat' ? 'enemy'
      : e.threat === 'friend' || e.threat === 'CLEAR' ? 'friend'
      : 'unknown';
    return cat === detailCategory;
  });
  const idx = inCategory.findIndex((e) => e.id === current.id);
  const next = inCategory[idx + direction];
  if (next) {
    setDetailEntity(next);
    setHighlightedId(next.id);
    if (leafletMap) {
      leafletMap.flyTo([next.lat, next.lng ?? next.lon], Math.max(leafletMap.getZoom(), 16), { duration: 0.6 });
    }
  }
};

const openDetail = (entity) => {
  setDetailEntity(entity);
  setHighlightedId(entity.id);
  // Auto-detect category
  const cat = entity.threat === 'enemy' || entity.threat === 'threat' ? 'enemy'
    : entity.threat === 'friend' || entity.threat === 'CLEAR' ? 'friend'
    : 'unknown';
  setDetailCategory(cat);
};

// -- end of the block 

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
      const interval = setInterval(() => {
        const cutoff = Date.now() - 30000;
        setUnconfirmedMarkers((prev) => prev.filter((m) => m.createdAt > cutoff));
      }, 1000);
      return () => clearInterval(interval);
    }, []);

    useEffect(() => {
      registerClearHandler(() => {
        setActiveNodes((prev) => prev.filter((n) => n.isInfrastructure));
        setFusionPackets([]);
        setUnconfirmedMarkers([]);
        setChatMessages([]);
        setGhosts([]);
        setSelectedFusion(null);
       
        setDetailEntity(null);
        setHighlightedId(null);
        setAlarmStatus('CLEAR');
        stopSiren();
        // Leave entityHistoryRef intact so Rewind can still see cleared entities
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
      const now = packet.ts || Math.floor(Date.now() / 1000);

      // ─── SNS: sensor trigger ───
      if (packet.typ === 'SNS') {
        const conf = packet.d?.conf || 0;
        const lat = packet.d?.lat;
        const lng = packet.d?.lon;
        if (lat == null || lng == null) return;

        // Low confidence → small unconfirmed circle, no person
        if (conf < 80) {
          setUnconfirmedMarkers((prev) => [
            ...prev.slice(-40),
            {
              id: generateEntityId('UNC'),
              lat,
              lng,
              conf,
              packet,
              createdAt: Date.now(),
            },
          ]);
          return;
        }

        // High confidence → try to match an existing friend
        const candidate = findNearestPlausiblePerson(
          { lat, lng, ts: now },
          activeNodesRef.current
        );

        if (candidate) {
          // Move that friend's icon to the trigger position
          moveEntity(candidate.id, lat, lng, null, null);
        } else {
          // No friend nearby → brand-new unknown person
          setActiveNodes((prev) => [
            ...prev,
            {
              id: generateEntityId('UNK'),
              lat,
              lng,
              alias: 'Unknown',
              nickname: null,
              threat: 'unknown',
              movement: 'idle',
              speed: 0,
              alarm: 'off',
              isSelf: false,
              isInfrastructure: false,
              fromSensor: true,
              lastUpdate: now,
            },
          ]);
        }
        return;
      }

      // ─── ALM: emergency alarm ───
      if (packet.typ === 'ALM') {
        setAlarmStatus(packet.d.mode === 'SCR' ? 'SCREAMING' : 'SILENT');
        if (packet.d.mode === 'SCR') playSiren();
        return;
      }

      // ─── HBT: heartbeat / GPS update ───
      if (packet.typ === 'HBT') {
        const nodeId = packet.nid;
        const lat = packet.d.lat;
        const lng = packet.d.lon;
        if (lat == null || lng == null || !nodeId) return;

        // Capture mesh node ID once for the Settings page
        if (!localStorage.getItem('raptor:mesh-node-id')) {
          localStorage.setItem('raptor:mesh-node-id', nodeId);
        }

        const existing = activeNodesRef.current.find((n) => n.id === nodeId);

        if (existing) {
          // Known friend → move the icon
          moveEntity(nodeId, lat, lng, packet.d.mot, packet.d.speed);
        } else {
          // New entity — determine threat from payload or default to friend
          const typeMap = {
            friend: 'CLEAR',
            stranger: 'unknown',
            unknown: 'unknown',
            enemy: 'CONFIRMED_OPPOSITION',
          };
          const threat = typeMap[packet.d.entityType] || 'CLEAR';

          setActiveNodes((prev) => [
            ...prev,
            {
              id: nodeId,
              lat,
              lng,
              alias: packet.d.nickname || nodeId,
              nickname: packet.d.nickname || null,
              threat,
              movement: resolveMovement(packet.d.mot, packet.d.speed, 'idle'),
              speed: packet.d.speed || 0,
              alarm: packet.d.alarm || 'off',
              isSelf: false,
              isInfrastructure: false,
              lastUpdate: now,
            },
          ]);
        }
        return;
      }

      // ─── CHT: chat ───
      if (packet.typ === 'CHT') {
        setChatMessages((prev) => [
          ...prev.slice(-50),
          {
            id: packet.id,
            from: packet.d.from || 'Unknown',
            text: packet.d.txt,
            ts: packet.ts,
          },
        ]);
        if (chatMessages.length === 0) setShowChatOverlay(true);
      }
    });
  }, []);

  
  useEffect(() => {
    const interval = setInterval(() => {
      const cutoff = Date.now() - 3000;
      setGhosts((g) => g.filter((gh) => gh.ts > cutoff));
    }, 500);
    return () => clearInterval(interval);
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
        const { DeviceDetector } = await import('./../lib/deviceDetector');
        const detector = new DeviceDetector();
        const assignments = await detector.assignDevices(ports);

        // Check if RAK node was found
        const hasRakNode = assignments.some(a => a.type === 'RAK_NODE');
        if (hasRakNode) {
          setDongleConnected(true);
          setMeshConnected(true);
          console.log('RAK node detected - live mode active');
          
          // ---- INSERT YOUR MESH HARDWARE CODE HERE ----
          const { MeshHardwareNode } = await import('./MeshHardwareNode');
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
      { id: 'RAPTOR_NODE_01', lat: baseCoord.lat + 0.003, lng: baseCoord.lon + 0.002, alias: 'North Ridge Relay', threat: 'CLEAR', unvouchedDots: 0, isInfrastructure: true, nodeType: 'relay' },
      { id: 'RAPTOR_NODE_02', lat: baseCoord.lat - 0.002, lng: baseCoord.lon - 0.004, alias: 'South Exit Choke', threat: 'CLEAR', unvouchedDots: 0, isInfrastructure: true, nodeType: 'relay' },
      { id: 'RAPTOR_NODE_03', lat: baseCoord.lat + 0.001, lng: baseCoord.lon - 0.002, alias: 'West Treeline Perimeter', threat: 'CLEAR', unvouchedDots: 0, isInfrastructure: true, nodeType: 'sensor' },
    ];
    setActiveNodes(mockNodes);
    const stats = { total: 3, friends: 2, relays: 1, sensors: 0 };
    updateUI(stats);
  };

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
   // setActiveNodes([]);
   
   // setInitialAlarmLocation(null);
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
// Add these inside HomeField, before the return ()
const activeAlarms = activeNodes.filter(n => n.alarm && n.alarm !== 'off');

const handleCenterOnMe = () => {
  if (leafletMap) {
    // animate: false makes it instant, solving the "laggy" feel
    leafletMap.setView([live.lat, live.lon], 16, { animate: false });
  }
};


const handleCenterOnAlarm = () => {
  if (activeAlarms.length === 0 || !leafletMap) return;
  
  // Cycle through active alarms
  const target = activeAlarms[alarmIndex % activeAlarms.length];
  leafletMap.setView([target.lat, target.lng ?? target.lon], 16, { animate: false });
  
  // Optional: open the detail panel for this alarm
  openDetail(target);
  
  // Increment for the next tap
  setAlarmIndex(prev => prev + 1);
};

/* version 3 */
useEffect(() => {
  if (!leafletMap || !live.lat || !live.lon) return;


  const currentLatLng = [live.lat, live.lon];

  // 1. If we haven't centered yet, do it immediately
  if (!lastCenteredRef.current) {
    leafletMap.setView(currentLatLng, 16, { animate: false });
    lastCenteredRef.current = currentLatLng;
    return;
  }

  // 2. Calculate the distance (in meters) between the last center and current position
  const lastLatLng = lastCenteredRef.current;
  
  // leafletMap.distance() calculates the real-world distance in meters
  const distanceMoved = leafletMap.distance(
    [lastLatLng[0], lastLatLng[1]],
    [currentLatLng[0], currentLatLng[1]]
  );

  // 3. Only recenter if the user has moved further than the threshold
  if (distanceMoved > CENTER_THRESHOLD_METERS) {
    leafletMap.setView(currentLatLng, 16, { animate: false });
    lastCenteredRef.current = currentLatLng; // Update the anchor point
  }
}, [leafletMap, live.lat, live.lon]);



/*

version 2 
const hasCenteredRef = useRef(false);

useEffect(() => {
  if (leafletMap && live.lat && live.lon && !hasCenteredRef.current) {
    leafletMap.setView([live.lat, live.lon], 16, { animate: false });
    hasCenteredRef.current = true;
  }
}, [leafletMap, live.lat, live.lon]);
 
version 1 

useEffect(() => {
  if (leafletMap && live.lat && live.lon) {
    leafletMap.setView([live.lat, live.lon], 16, { animate: false });
  }
}, [leafletMap, live.lat, live.lon]);
*/ 



// Calculate where entities were at `rewindTime`
const getHistoricalPosition = (entityId, targetTime) => {
  const history = entityHistoryRef.current.get(entityId);
  if (!history || history.length === 0) return null;
  
  let closest = history[0];
  for (let i = 0; i < history.length; i++) {
    if (history[i].ts <= targetTime) {
      closest = history[i];
    } else {
      break; 
    }
  }
  return closest; 
};

// Determine which entities to render based on mode
const entitiesToRender = useMemo(() => {
  if (!isRewinding) return allEntities; // Live mode
  
  return allEntities.map(e => {
    const historical = getHistoricalPosition(e.id, rewindTime);
    if (historical) {
      return { ...e, lat: historical.lat, lng: historical.lng, movement: historical.movement };
    }
    return e;
  });
}, [allEntities, isRewinding, rewindTime]);

  return (
    <div className="map-page relative min-h-screen overflow-hidden bg-raptor-void">
      {/* 1. The Map */}
      <LiveMap 
        lat={live.lat} 
        lon={live.lon} 
        heading={live.heading} 
        pulseDuration={pulseDuration} 
        onFail={() => setMapFailed(true)}
      >
       
      <InitialRecenter lat={live.lat} lon={live.lon} />

      <OffScreenIndicators
        markers={[
          ...unconfirmedMarkers.map((m) => ({
            id: m.id,
            lat: m.lat,
            lng: m.lng,
            threat: 'stranger',
            data: m,
            type: 'unconfirmed',
          })),
          ...activeNodes
            .filter((n) => !n.isInfrastructure)
            .map((n) => ({
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
          setDetailEntity(marker.data);
        }}
      />
 
       <MapInstanceGetter onMap={setLeafletMap} />
          {/* 
            TODO: I need to figure out how to get thia to show raster OpenFreeMap
            <VectorBaseMap />
          */}

        {/* Radar sweep — appears centered on your position */}
        {showRadarOverlay && (
          <RadarSweepMarker lat={live.lat} lon={live.lon} size={50} />
        )}
        {SHOW_DEV_TOOL && (
          <PointSampler baseLat={live.lat} baseLon={live.lon} />
        )}

         {ghosts.map((g) => (
          <PersonGhost
            key={g.id}
            entity={g}
            ageSec={(Date.now() - g.ts) / 1000}
          />
        ))}
        {/* Fusion packets — as Leaflet markers */}
        {/* Unconfirmed low-confidence triggers — small fading circles */}
{unconfirmedMarkers.map((m) => (
  <UnconfirmedMarker
    key={m.id}
    entity={m}
    onSelect={(e) => {
      setSelectedFusion(e.packet);
      setDetailEntity(e);
    }}
  />
))}
 
{/* Infrastructure nodes — small relay dots */}
{activeNodes
  .filter((n) => n.isInfrastructure)
  .map((node) => {
    const nodeColor = NODE_COLORS[node.nodeType] || NODE_COLORS.relay;
    const nodeLetter = (node.nodeType || 'relay').charAt(0).toUpperCase();

    return (
      <Marker
        key={node.id}
        position={[node.lat, node.lng]}
        icon={L.divIcon({
          className: 'mesh-node-marker',
          html: `<div style="
            background-color: ${nodeColor};
            width: 16px; height: 16px;
            border-radius: 50%;
            border: 2px solid white;
            box-shadow: 0 0 8px rgba(0,0,0,0.5);
            display: flex; align-items: center; justify-content: center;
            font-size: 9px; font-weight: 900; color: #fff;
            font-family: -apple-system, system-ui, sans-serif;
          ">${nodeLetter}</div>`,
          iconSize: [16, 16],
          iconAnchor: [8, 8],
        })}
        eventHandlers={{ click: () => openDetail(node) }}
      />
    );
  })}

  {/* Persons — self, friends, unknowns, enemies — each is ONE moving icon */}
  {activeNodes
    .filter((n) => !n.isInfrastructure)
    .map((node) => (
      <PersonMarker
        key={node.id}
        entity={node}
        isRewinding={isRewinding}
        onSelect={openDetail}
        highlighted={node.id === highlightedId}
      />
    ))}
      </LiveMap>
      
      {/* Radar sweep overlay — appears centered when toggled */} 
      {leafletMap && (
        <> 
        {/* Center on Me Button */}
        <button
          onClick={handleCenterOnMe}
          className="absolute bottom-[180px] right-2 z-[560] flex h-11 w-11 items-center justify-center rounded-full border backdrop-blur shadow-lg transition active:scale-95"
          style={{
            background: 'var(--panel-bg)',
            borderColor: 'var(--panel-border)',
            color: 'var(--accent)',
          }}
          aria-label="Center on My Location"
        >
          <Crosshair className="h-5 w-5" />
          <small>Center You</small>
        </button>

        {/* Center on Alarm Button (Only shows if there's an active alarm) */}
        {activeAlarms.length > 0 && (
          <button
            onClick={handleCenterOnAlarm}
            className="absolute bottom-[220px] right-2 z-[560] flex h-11 w-11 items-center justify-center rounded-full border backdrop-blur shadow-lg transition active:scale-95 animate-pulse"
            style={{
              background: 'var(--threat-enemy)', // Red background for alarm
              borderColor: 'var(--panel-border)',
              color: '#fff',
            }}
            aria-label="Center on Active Alarm"
          >
            <Bell className="h-5 w-5" />
            <small>Alarms</small>
          </button>
        )}
       
        
        {appMessage && (
          <div
            className="absolute left-3 right-3 z-[590] rounded-lg border px-3 py-2 backdrop-blur shadow-xl pointer-events-auto"
            style={{
              bottom: '150px',                 // 120px above the DemoPilot caption
              background: 'var(--panel-bg)',
              borderColor: appMessage.color,
              borderLeftWidth: 4,
              color: 'var(--text-primary)',
              maxWidth: 480,
              margin: '0 auto',
            }}
          >
            {appMessage.title && (
              <div
                className="mb-0.5 text-[10px] font-bold uppercase tracking-widest"
                style={{ color: appMessage.color }}
              >
                {appMessage.title}
              </div>
            )}
            <div className="text-xs leading-relaxed">{appMessage.text}</div>
            {appMessage.actions && (
              <div className="mt-2 flex gap-2">
                {appMessage.actions.map((a, i) => (
                  <button
                    key={i}
                    onClick={() => { setAppMessage(null); a.onClick?.(); }}
                    className="rounded-md px-3 py-1 text-[11px] font-bold"
                    style={{ background: appMessage.color, color: '#0c1a28' }}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
     
        {/* Demo pilot — above Crosshair */}
        
        <RewindPanel 
            isOpen={isRewinding}
            onClose={() => setIsRewinding(false)}
            maxSeconds={300} 
            currentTime={rewindTime}
            onChangeTime={(t) => {
                setRewindTime(t);
                setIsPlayingRewind(false);
            }}
            isPlaying={isPlayingRewind}
            onPlayPause={() => setIsPlayingRewind(!isPlayingRewind)}
        />


        <DemoPilot
          bottomOffset={280}
          anchorLat={live.lat}
          anchorLon={live.lon}
          onRun={(fn, ...args) => {
              // Mark step 1 as done the first time they run a scene
              markFunnelStepDone('triedDemo'); 
            const target = window.Sim?.[fn];
            if (typeof target === 'function') target(...args);
          }}
        />





         </>
      )}

      {/* Radar sweep overlay — appears centered when toggled */}
     
      {/* Detail panel is OUTSIDE LiveMap — it's a floating panel, not a marker */}
      
      {detailEntity && (
  <EntityDetailPanel
    entity={detailEntity}
    allEntities={allEntities}
    activeCategory={detailCategory}
    onCategoryChange={(cat) => {
      setDetailCategory(cat);
      // Auto-select first entity in that category
      const first = allEntities.find((e) => {
        const c = e.threat === 'enemy' || e.threat === 'threat' ? 'enemy'
          : e.threat === 'friend' || e.threat === 'CLEAR' ? 'friend'
          : 'unknown';
        return c === cat;
      });
      if (first) {
        setDetailEntity(first);
        setHighlightedId(first.id);
        if (leafletMap) leafletMap.flyTo([first.lat, first.lng ?? first.lon], 16, { duration: 0.6 });
      }
    }}
    onNavigate={navigateCategory}
    onCenter={(e) => {
      if (leafletMap) leafletMap.flyTo([e.lat, e.lng ?? e.lon], 17, { duration: 0.6 });
    }}
    onClose={() => {
      setDetailEntity(null);
      setHighlightedId(null);
    }}
    onStatusChange={(change) => {
      setActiveNodes((prev) =>
        prev.map((n) => (n.id === change.entityId ? { ...n, threat: change.threat, threatReason: change.reason } : n))
      );
      showToast(`Reclassified as ${change.threat}`, { title: 'Status saved' });
    }}
  />
)}

      <div className="pointer-events-none absolute inset-0 z-[400] bg-gradient-to-b from-raptor-void/20 via-transparent to-raptor-void/45" />

      <div className="absolute left-0 right-0 top-0 z-[500] flex items-center justify-between gap-1.5 px-2 py-3 sm:px-4 sm:py-4">

  {/* Left: Simulation pill — compress on small */}
  <div
    className="flex flex-shrink-0 items-center gap-1.5 rounded-full border px-2 py-1 backdrop-blur sm:px-3 sm:py-1.5"
    style={{
      background: 'var(--panel-bg)',
      borderColor: dongleConnected ? 'var(--threat-friend)' : 'var(--panel-border)',
    }}
  >
    <RaptorMark className="h-3 w-3 sm:h-4 sm:w-4" />
    <span
      className="text-[10px] sm:text-xs font-medium"
      style={{ color: dongleConnected ? 'var(--threat-friend)' : 'var(--text-muted)' }}
    >
      <span className="hidden sm:inline">{dongleConnected ? 'Live' : 'Simulation'}</span>
      <span className="sm:hidden">{dongleConnected ? 'LIVE' : 'SIM'}</span>
    </span>
  </div>

  {/* Center: Nodes + Friends — compress */}
     <button
        onClick={() => {
          const first = allEntities.find((e) => e.threat === 'friend' || e.threat === 'CLEAR');
          if (first) openDetail(first);
        }}
        className="flex min-w-0 flex-shrink items-center gap-1 rounded-full border px-2 py-1 backdrop-blur text-[12px] sm:gap-2 sm:px-3 sm:py-1.5 sm:text-xs"
        style={{ background: 'var(--panel-bg)', borderColor: 'var(--panel-border)' }}
      >
        <span className="whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
          <span className="hidden sm:inline">Nodes: </span>
          <span className="sm:hidden">N:</span>
          <span id="nodes-online" className="font-bold" style={{ color: 'var(--accent)' }}>0</span>
        </span>
        <span style={{ color: 'var(--panel-border)' }}>|</span>
        <span className="whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
          <span className="hidden sm:inline">Friends: </span>
          <span className="sm:hidden">F:</span>
          <span id="friends-online" className="font-bold" style={{ color: 'var(--threat-friend)' }}>0</span>
        </span>
      </button>
 

  {/* Right: Variance + Settings */}
  <div className="flex flex-shrink-0 items-center gap-1.5">
      <button
        onClick={() => setShowVariance((v) => !v)}
        className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full border backdrop-blur transition"
        style={{
          background: showVariance ? 'var(--accent-soft)' : 'var(--panel-bg)',
          borderColor: showVariance ? 'var(--accent)' : 'var(--panel-border)',
          color: showVariance ? 'var(--accent)' : 'var(--text-muted)',
        }}
        aria-label="Toggle variance circles"
        title="Toggle variance circles"
      >
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" className="sm:hidden">
          <circle cx="12" cy="12" r="9" strokeDasharray="3 3" />
          <circle cx="12" cy="12" r="3" />
        </svg>
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" className="hidden sm:block">
          <circle cx="12" cy="12" r="9" strokeDasharray="3 3" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      </button>

      <button
        onClick={onOpenSettings}
        className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full border backdrop-blur transition"
        style={{
          background: 'var(--panel-bg)',
          borderColor: 'var(--panel-border)',
          color: 'var(--text-primary)',
        }}
        aria-label="Settings"
      >
        <Settings className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
      </button>
  </div>

</div>

      {/** funnel stats   */}
      {/* Funnel stats */}
      {status.current <= 5 && status.current !== 4 && (
        <div className="absolute left-3 right-3 top-20 z-[560] rounded-lg border border-amber-500/40 bg-amber-500/10 backdrop-blur px-3 py-1.5 text-xs text-amber-100 flex items-center justify-between">
          <span>Step {status.current} of 5 · {STEP_LABELS[status.current]}</span>
          
          <a 
            href={STEP_LINKS[status.current]} 
            target={status.current === 1 ? "_self" : "_blank"} // Don't open a new tab for step 1
            rel="noopener noreferrer"
            onClick={() => {
              const key = STEP_KEYS[status.current];
              if (key) markFunnelStepDone(key);
            }}
            className="font-bold underline"
          >
            Continue →
          </a>
        </div>
      )}
            


      {mapFailed && (
        <div className="absolute left-4 right-4 top-16 z-[500] flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-400 backdrop-blur">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> Map tiles unavailable — showing approximate position only.
        </div>
      )}


      {/* --- NEW OVERLAY TOOLBAR --- */} 
    <div
    className="absolute bottom-0 left-0 right-0 z-[500] rounded-t-2xl px-4 pb-6 pt-4 backdrop-blur-xl"
    style={{
      background: 'var(--panel-bg)',
      borderTop: '1px solid var(--panel-border)',
      boxShadow: `0 -12px 40px ${'var(--panel-glow)'}`,
    }}
>
        {/* ─── PANEL 1: overlay toggles + mesh connect ─── */}
        <div className="raptor-panel-row">
          {/* Rewind */}
          <button
            className={`raptor-chip ${isRewinding ? 'active' : ''}`}
            onClick={() => {
              setIsRewinding(!isRewinding);
              if (!isRewinding) showNudge('rewind');
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 5 3 12l8 7V5z" />
              <path d="M21 5l-8 7 8 7V5z" />
            </svg>
            <span>Rewind</span>
          </button>

          {/* Mesh */}
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

          {/* Radar */}
          <button
            className={`raptor-chip ${showRadarOverlay ? 'active' : ''}`}
            onClick={() => {
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

          {/* Chat */}
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
       
    </div>
  )}
</div>

{/* ─── TOASTS (nudges) ─── */}
<div className="pointer-events-none absolute left-3 right-3 top-20 z-[700] flex flex-col gap-2">
  {toasts.map((t) => (
    <div
      key={t.id}
      className="pointer-events-auto relative rounded-xl border px-3 py-2 pr-8 backdrop-blur shadow-lg"
      style={{ background: 'var(--panel-bg)', borderColor: 'var(--panel-border)' }}
    >
    <button
      onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
      className="absolute right-2 top-2 transition-colors"
      style={{ color: 'var(--text-muted)' }}
      aria-label="Close"
    >
      ✕
    </button>
      {t.title && (
        <div className="mb-0.5 text-xs font-semibold" style={{ color: 'var(--accent)' }}>
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
  className={`absolute right-0 top-0 bottom-0 z-[600] w-[min(340px,88vw)] border-l backdrop-blur transition-transform duration-300 ${
    showChatOverlay ? 'translate-x-0' : 'translate-x-full'
  }`}
  style={{
    background: 'var(--panel-bg-deep)',
    borderLeftColor: 'var(--panel-border)',
  }}
>
   <div
      className="flex items-center justify-between border-b px-4 py-3"
      style={{ background: 'var(--chat-header-bg)', borderColor: 'var(--panel-border)' }}
    >
      <b className="text-sm" style={{ color: 'var(--chat-header-text)' }}>Mesh Chat</b>
      <button
        onClick={() => setShowChatOverlay(false)}
        style={{ color: 'var(--chat-header-text)', opacity: 0.7 }}
        aria-label="Close chat"
      >
        ✕
      </button>
    </div>
  <div className="flex h-[calc(100%-56px)] flex-col">
    <div className="flex-1 space-y-2 overflow-y-auto p-3">

      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {chatMessages.length === 0 ? (
          <div className="rounded-lg border border-amber-500/25 bg-amber-500/10 p-2 text-center text-[11px] text-amber-300">
            Simulation — connect a C2 Dongle to enable live mesh chat.
          </div>
        ) : (
          chatMessages.map((m) => (
            <div
              key={m.id}
              className="rounded-lg px-3 py-2 text-xs"
              style={{ background: 'var(--chat-bubble-bg)', color: 'var(--chat-bubble-text)' }}
            >
              <div className="mb-0.5 text-[10px] font-semibold" style={{ color: 'var(--accent)' }}>
                {m.from} · {new Date(m.ts * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
              <div>{m.text}</div>
            </div>
          ))
        )}
      </div>
    </div>
    <div className="flex gap-2 border-t p-3" style={{ borderColor: 'var(--panel-border)' }}>
      <input
        type="text"
        placeholder="Message the mesh…"
        maxLength={140}
        className="flex-1 rounded-lg border px-3 py-2 text-sm outline-none"
        style={{
          background: 'var(--chat-input-bg)',
          color: 'var(--chat-input-text)',
          borderColor: 'var(--panel-border)',
        }}
      />
      <button
        className="rounded-lg px-4 text-sm font-bold"
        style={{ background: 'var(--chat-send-bg)', color: 'var(--chat-send-text)' }}
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
 