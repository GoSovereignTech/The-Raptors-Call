// src/lib/simulation.js
// Console-triggerable simulations with 5-sensor fusion support.
// Payload shape matches real dongle output — drop-in compatible.

const SIM_PREFIX = 'SIM_';
const SIM_LAT = 39.2838;
const SIM_LON = -76.6216;

// ─── Capability bitmask ───
// 1=GPS, 2=RADAR, 4=AUDIO, 8=CAMERA, 16=PIR, 32=THERMAL,
// 64=SEISMIC, 128=ToF, 256=IR_BEAM, 512=FUSION
export const CAP = {
  GPS:     1 << 0,   // 1
  RADAR:   1 << 1,   // 2
  AUDIO:   1 << 2,   // 4
  CAMERA:  1 << 3,   // 8
  MOTION:  1 << 4,   // 16  ← PIR
  THERMAL: 1 << 5,   // 32  ← MLX90640
  SEISMIC: 1 << 6,   // 64  ← Geophone
  TOF:     1 << 7,   // 128 ← TF-Luna
  IR_BEAM: 1 << 8,   // 256 ← Break-beam
  FUSION:  1 << 9,   // 512 ← Multi-sensor fusion
};

// ─── Pre-composed capability values for common node types ───
export const NODE_CAPS = {
  TRIPLE_SENSOR: CAP.MOTION | CAP.THERMAL | CAP.SEISMIC | CAP.FUSION,  // 624
  TRIPLE_PLUS_TOF: CAP.MOTION | CAP.THERMAL | CAP.SEISMIC | CAP.TOF | CAP.FUSION, // 752
  TRIPLE_PLUS_IR: CAP.MOTION | CAP.THERMAL | CAP.SEISMIC | CAP.IR_BEAM | CAP.FUSION, // 880
  FULL_FOREST: CAP.MOTION | CAP.THERMAL | CAP.SEISMIC | CAP.TOF | CAP.IR_BEAM | CAP.FUSION, // 1008
};

let seqCounter = 10000;

function makeId() {
  return Math.random().toString(16).slice(2, 10).padEnd(8, '0');
}
function fakeSig() {
  return Math.random().toString(16).slice(2, 10).padEnd(8, '0');
}

// ─── Envelope builder ───
function envelope(typ, payload, opts = {}) {
  return {
    // ─── Envelope (always present) ───
    v: 1,
    id: makeId(),
    nid: (opts.sim !== false ? SIM_PREFIX : '') + (opts.nid || 'N049A'),
    typ,
    sim: opts.sim !== false ? 1 : 0,
    ts: Math.floor(Date.now() / 1000),
    seq: ++seqCounter,
    sig: fakeSig(),
    algo: 1,
    prio: opts.prio ?? 1,
    ack: opts.ack ?? 0,
    hops: opts.hops ?? 0,
    chn: opts.chn ?? 1,
    cap: opts.cap ?? (CAP.GPS | CAP.MOTION),
    team_id: opts.team_id ?? 1,
    d: payload,
  };
}

export const Simulations = {
  // ─── HBT: Heartbeat ───
  heartbeat: (opts = {}) =>
    envelope('HBT', {
      bat: opts.bat ?? 94,
      lat: opts.lat ?? SIM_LAT,
      lon: opts.lon ?? SIM_LON,
      mot: opts.mot ?? 'still',
    }, opts),

  gpsWalking: (offset = 0.0005) =>
    envelope('HBT', {
      bat: 91,
      lat: SIM_LAT + offset,
      lon: SIM_LON + offset,
      mot: 'walk',
    }, { prio: 1, cap: CAP.GPS | CAP.MOTION }),

  gpsRunning: (offset = 0.002) =>
    envelope('HBT', {
      bat: 88,
      lat: SIM_LAT + offset,
      lon: SIM_LON + offset,
      mot: 'run',
    }, { prio: 2, cap: CAP.GPS | CAP.MOTION }),

  gpsSpoof: () =>
    envelope('HBT', {
      bat: 85,
      lat: 25.7617,
      lon: -80.1918,
      mot: 'drive',
    }, { prio: 3, nid: 'UNKNOWN_01', cap: CAP.GPS }),

  // ─── SNS: Single-sensor (legacy) ───
  triggerSensor: (opts = {}) =>
    envelope('SNS', {
      src: 16,
      sid: opts.sid ?? 'PIR_01',
      mag: opts.mag ?? 89,
      conf: opts.conf ?? 92,
      trig: 1,
    }, {
      nid: opts.nid ?? 'TRIGGER_03',
      prio: 2,
      cap: CAP.MOTION,
      lat: SIM_LAT + 0.001,
      lon: SIM_LON + 0.001,
    }),

  // ═══════════════════════════════════════════════════════════
  // FUSION PACKETS — Multi-sensor confirmed detection
  // ═══════════════════════════════════════════════════════════

  // ─── SNS: All 3 sensors agree — confirmed human ───
  fusionTriple: () =>
    envelope('SNS', {
      src: 112,          // 16(PIR) + 32(THERMAL) + 64(GEO)
      conf: 94,
      mag: 87,
      peak_ms: 42,
      pir: 89,
      thm: 78,
      geo: 45,
    }, {
      nid: 'NODE_FOREST_01',
      prio: 3,
      cap: NODE_CAPS.TRIPLE_SENSOR,
      lat: SIM_LAT + 0.001,
      lon: SIM_LON + 0.001,
    }),

  // ─── SNS: Thermal + Geophone — stationary hider in bush ───
  fusionStationary: () =>
    envelope('SNS', {
      src: 96,           // 32(THERMAL) + 64(GEO)
      conf: 82,
      mag: 72,
      peak_ms: 18,
      thm: 78,
      geo: 41,
    }, {
      nid: 'NODE_FOREST_02',
      prio: 3,
      cap: NODE_CAPS.TRIPLE_SENSOR,
      lat: SIM_LAT + 0.002,
      lon: SIM_LON - 0.001,
    }),

  // ─── SNS: Geophone only — quiet footsteps ───
  fusionFootsteps: () =>
    envelope('SNS', {
      src: 64,           // 64(GEO)
      conf: 65,
      mag: 55,
      peak_ms: 92,
      geo: 55,
    }, {
      nid: 'NODE_TRAIL_03',
      prio: 2,
      cap: NODE_CAPS.TRIPLE_SENSOR,
      lat: SIM_LAT - 0.001,
      lon: SIM_LON + 0.002,
    }),

  // ─── SNS: PIR + Thermal — moving person, no ground vibration ───
  fusionMoving: () =>
    envelope('SNS', {
      src: 48,           // 16(PIR) + 32(THERMAL)
      conf: 78,
      mag: 83,
      peak_ms: 25,
      pir: 85,
      thm: 80,
    }, {
      nid: 'NODE_PATH_04',
      prio: 2,
      cap: NODE_CAPS.TRIPLE_SENSOR,
      lat: SIM_LAT + 0.003,
      lon: SIM_LON + 0.003,
    }),

  // ─── SNS: ToF path crossing ───
  fusionToF: () =>
    envelope('SNS', {
      src: 128,          // 128(TOF)
      conf: 90,
      mag: 180,
      peak_ms: 5,
      tof: 8,            // 0.8m distance
    }, {
      nid: 'NODE_TRAIL_04',
      prio: 2,
      cap: CAP.TOF | CAP.MOTION,
      lat: SIM_LAT + 0.004,
      lon: SIM_LON,
    }),

  // ─── SNS: IR beam broken ───
  fusionIRBeam: () =>
    envelope('SNS', {
      src: 256,          // 256(IR_BEAM)
      conf: 100,
      mag: 255,
      peak_ms: 1,
      irb: 1,
    }, {
      nid: 'NODE_CHOKE_05',
      prio: 3,
      cap: CAP.IR_BEAM,
      lat: SIM_LAT - 0.002,
      lon: SIM_LON - 0.002,
    }),

  // ─── SNS: Full 5-sensor forest node ───
  fusionFullForest: () =>
    envelope('SNS', {
      src: 496,          // 16+32+64+128+256 = 496
      conf: 98,
      mag: 92,
      peak_ms: 33,
      pir: 89,
      thm: 78,
      geo: 45,
      tof: 12,
      irb: 1,
    }, {
      nid: 'NODE_FOREST_FULL_01',
      prio: 3,
      cap: NODE_CAPS.FULL_FOREST,
      lat: SIM_LAT,
      lon: SIM_LON,
    }),

  // ─── ALM: Alarm ───
  emergency: (mode = 'SCR') =>
    envelope('ALM', {
      mode,
      tts: mode === 'SCR' ? 1 : 0,
      lat: SIM_LAT,
      lon: SIM_LON,
    }, { prio: 3, ack: 1, cap: CAP.GPS | CAP.AUDIO }),

  // ─── CHT: Chat ───
  chat: (text = 'Team is 2 minutes out.', from = 'Team A') =>
    envelope('CHT', { txt: text, from }, { prio: 1, cap: 0 }),

  // ─── CMD: Remote command ───
  command: (cmdId = 1) =>
    envelope('CMD', { cmd: cmdId }, { prio: 2, ack: 1, cap: 0 }),

  // ─── ACK ───
  ack: (refId, ok = 1) =>
    envelope('ACK', { ref: refId, ok }, { prio: 1, cap: 0 }),

  friendOnline: () =>
    envelope('HBT', {
      bat: 96,
      lat: SIM_LAT + 0.003,
      lon: SIM_LON + 0.002,
      mot: 'walk',
    }, { nid: 'FRIEND_02', team_id: 1, cap: CAP.GPS | CAP.MOTION }),
};

// ─── Console exposure ───
if (typeof window !== 'undefined') {
  window.Sim = Simulations;
  window.Sim.CAP = CAP;
  window.Sim.NODE_CAPS = NODE_CAPS;
  console.log('[Sim] Ready. Try:');
  console.log('  Sim.fusionTriple()      — 3 sensors confirm human');
  console.log('  Sim.fusionStationary()  — hidden in bush');
  console.log('  Sim.fusionFootsteps()   — quiet walker');
  console.log('  Sim.fusionFullForest()  — all 5 sensors');
  console.log('  Sim.emergency("SCR")    — loud alarm');
}
/*
Sim.fusionTriple(); //      — 3 sensors confirm human');
Sim.fusionStationary(); //  — hidden in bush');
Sim.fusionFootsteps();//   — quiet walker');
Sim.fusionFullForest();// — all 5 sensors');
Sim.emergency("SCR");//    — loud alarm');

*/

// ─── Sim → App bridge ───
// The app registers a handler; Sim functions call it automatically.
let simHandler = null;

export function registerSimHandler(handler) {
  simHandler = handler;
}

// Wrap every Sim function so it auto-dispatches
const _originalSim = Simulations;
export const Sim = new Proxy(_originalSim, {
  get(target, prop) {
    const fn = target[prop];
    if (typeof fn !== 'function') return fn;
    return (...args) => {
      const packet = fn(...args);
      if (simHandler) simHandler(packet);
      return packet;
    };
  },
});

// Console exposure uses the wrapped version
if (typeof window !== 'undefined') {
  window.Sim = Sim;
  window.Sim.CAP = CAP;
  window.Sim.NODE_CAPS = NODE_CAPS;
  console.log('[Sim] Ready. Try:');
  console.log('  Sim.fusionTriple()');
  console.log('  Sim.fusionStationary()');
  console.log('  Sim.fusionFootsteps()');
  console.log('  Sim.fusionFullForest()');
  console.log('  Sim.emergency("SCR")');
}