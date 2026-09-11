// src/lib/simulation.js
// Console-triggerable simulations. All payloads match the real dongle shape.

const NODE_ID = 'SIM_NODE_01';
const SIM_LAT = 39.2838;
const SIM_LON = -76.6216;

function makePacket(type, payload, opts = {}) {
  return {
    v: 1,
    msg_id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    node_id: opts.node_id || NODE_ID,
    node_type: opts.node_type || 'tag',
    capabilities: opts.capabilities || ['gps', 'motion'],
    type,
    sim: true,
    ts: Date.now(),
    gps: opts.gps || { lat: SIM_LAT, lon: SIM_LON, heading: 0 },
    motion: opts.motion || { state: 'still', speed_mps: 0 },
    payload,
    ack_required: !!opts.ack_required,
  };
}

export const Simulations = {
  // GPS: person starts walking
  gpsWalking: (offset = 0.0005) =>
    makePacket('HEARTBEAT', {}, {
      gps: { lat: SIM_LAT + offset, lon: SIM_LON + offset, heading: 45 },
      motion: { state: 'walking', speed_mps: 1.4 },
    }),

  // GPS: person runs
  gpsRunning: (offset = 0.002) =>
    makePacket('HEARTBEAT', {}, {
      gps: { lat: SIM_LAT + offset, lon: SIM_LON + offset, heading: 45 },
      motion: { state: 'running', speed_mps: 4.2 },
    }),

  // GPS: sudden jump (spoof attempt)
  gpsSpoof: () =>
    makePacket('HEARTBEAT', { alert: 'SPOOF_SUSPECTED' }, {
      gps: { lat: 25.7617, lon: -80.1918, heading: 0 }, // Miami coords
      motion: { state: 'driving', speed_mps: 55 },
    }),

  // Node: new friend online
  friendOnline: () =>
    makePacket('HEARTBEAT', { action: 'FRIEND_ONLINE', nickname: 'Marcus' }, {
      node_id: 'FRIEND_02',
      gps: { lat: SIM_LAT + 0.003, lon: SIM_LON + 0.002, heading: 0 },
    }),

  // Node: trigger sensor fires
  triggerSensor: () =>
    makePacket('EVENT', { sensor: 'motion', confidence: 0.94 }, {
      node_id: 'TRIGGER_03',
      node_type: 'sensor',
      capabilities: ['motion', 'thermal'],
      gps: { lat: SIM_LAT + 0.001, lon: SIM_LON + 0.001, heading: 0 },
    }),

  // Node: emergency alarm
  emergency: (type = 'SCREAMING') =>
    makePacket('ALARM', { alarm_type: type, tts: 'Help! I am under attack!' }, {
      gps: { lat: SIM_LAT, lon: SIM_LON, heading: 0 },
      ack_required: true,
    }),

  // Chat message
  chat: (text = 'Team is 2 minutes out.') =>
    makePacket('CHAT', { text, from: 'Team A' }, { node_type: 'c2' }),
};

// Expose to window for console access
if (typeof window !== 'undefined') {
  window.Sim = Simulations;
  console.log('[Sim] Console simulations ready. Try: Sim.gpsWalking()');
}