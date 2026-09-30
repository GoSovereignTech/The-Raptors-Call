// src/lib/simulation.js
// Console-triggerable simulations with 5-sensor fusion support.
// Payload shape matches real dongle output — drop-in compatible.

const SIM_PREFIX = 'SIM_';
const SIM_LAT = 39.2838;
const SIM_LON = -76.6216;
let SIM_BASE_LAT = 39.2838;
let SIM_BASE_LON = -76.6216;

// ─── Multi-character path simulators ───
// Each step is [deltaLat, deltaLon]. Base is SIM_BASE_LAT/LON.
// intervalMs is the delay between HBT packets — shorter = smoother movement.

async function _emitPath(nid, path, {
  intervalMs = 1400,
  mot = 'walk',
  nickname = null,
  bat = 90,
  entityType = 'friend',   // 'friend' | 'stranger' | 'enemy' | 'unknown'
} = {}) {
  for (let i = 0; i < path.length; i++) {
    const [dLat, dLon] = path[i];
    const packet = envelope('HBT', {
      bat,
      lat: SIM_BASE_LAT + dLat,
      lon: SIM_BASE_LON + dLon,
      mot,
      nickname,
      entityType,
    }, { nid, cap: CAP.GPS | CAP.MOTION, team_id: 1 });
    if (simHandler) simHandler(packet);
    if (i < path.length - 1) {
      await new Promise((r) => setTimeout(r, intervalMs));
    }
  }
}

/*
 
  // ─── FRIENDS ───
  Sim.sequence.maya(); 
  Sim.sequence.marcus(); 
  Sim.sequence.tanisha();  
  // ─── STRANGER — unknown person, slow approach, no name ───
  Sim.sequence.stranger();  
  // ─── ENEMY — fast approach, from a distance, no name ───
  Sim.sequence.enemy(); 
  // ─── SCENARIO: Ambush setup ───
  // Maya walks. A stranger approaches. An enemy cuts her off.
  Sim.sequence.ambushSetup();

  // ─── SCENARIO: All friends ───
  Sim.sequence.allThree();
  Sim.sequence.escalation();
  Sim.sequence.tasia();


  // --------
   skit 1.
  Sim.clearAll();
       Juliana Umba Nzita, a 16-year-old girl who originally moved to the U.S. from the Democratic Republic of the Congo, was found dead on May 8, 2026, 
       hanging from a tree on a church property in Charlotte, North Carolina.
       
       Let's recreate that scene and demonstrate how we can prevent that next time with this
       community tech network system - the Raptors Network aka the Raptors call 

       This is her normal pattern every morning and every evening.
  Sim.sequence.tasia(); // she walks to school by herself and walks home.
 
     unbeknownst to her she had a stalker 
  Sim.sequence.potasia();
     this is what the stalker intended to do.

     Sim.clearAll();
  Sim.sequence.ambushSetup(); 
     but the app notices the pattern
      if you don't 
      It might requests info  
     who is that person?   
     They have been there several times. 

     or APP: I noticed you walk to school alone I found  three girls you can walk to school with.
     would you like to meet them?  
      that's prevention. 

     but one day a person from that location follows her. 
     Either the app triggers the alarm, 
     or  she pulled the pin to trigger her alarm. 
    
       She was in danger - her friends saw the same thing on their dashboard and drove 
         or ran to where she was. Instead of being killed she was rescued
  Sim.emergency('SCR');
  Sim.sequence.ambushSetupRescue();
    That's how the app works
    it detects people around you - before they even see you.
    it looks for patterns of vulnerability & stalkers 
    it warn you or sound the alarm amnd yure eams alarm 
    it allows quick messaging. 
    no wifi is required. 

    That is the most common pattern of attacks 
  This app prevents it to drop our statistics for when we are alone s such s 
  murders, 
  abductions,
  sexual assaults, 
  lynchings 
  hate crimes 

  This is the Raptors Network. 
  With this system you are never really alone as you travel across communities.


  ///////////////
 // skit 2 - abducted in a car This is based on the story of
    19-year-old Dacara Thompson case.  
    Let's recreate that scene and demonstrate how we can prevent that next time with this
    community tech network system - the Raptors Network aka the Raptors Call.
    
    Dacara was 19 years old and went in someone's car 
    Sim.clearAll(); 

    Sim.sequence.dacaraWalkThenDrive();  
    but the person was driving her 90 minutes away. 
    She never consented to driving ger this far 
     so she triggered the silent alarm  

    Sim.emergency('SCR'); 

    bot her phone and personal alarm were sharing her position. 

    Her teammate saw where she wasa going and sent cars to intercept 
    Sim.sequence.dacaraDriveRescue(); 
    

   
     
    
    


  */
export const SimSequences = {
  // --- DACARA 
   dacaraWalkThenDrive:() => _emitPath('SIM_DACRARA_01',
    [[-0.002363,0.001142],[-0.001233,0.000026]],
     { intervalMs: 1400, mot: 'walk', 
      nickname: 'Dacara', entityType: 'friend' }
  ),
    dacaraDriveRescue1:() => _emitPath('SIM_DACRARA_01',
    [ 
      [-0.001233,0.000026],
      [-0.002363,0.001142],[-0.001233,0.000026],
      [-0.001516,0.000154],[-0.00115,-0.000189],
      [-0.000751,-0.000639],
      [-0.000386,-0.001069],[-0.000086,-0.001519] 
    ], { intervalMs: 1400, mot: 'car', 
      nickname: 'Dacara Friends1', entityType: 'enemy' }
  ),
      dacaraDriveRescue2:() => _emitPath('SIM_DACRARA_FRIEND_02',
    [ [0.001593,-0.003645],[0.000629,-0.003237],
       [0.000463,-0.002078],[0.00028,-0.001499],
       [-0.000268,-0.000727],[-0.000833,-0.000147], 
    ], { intervalMs: 1400, mot: 'car', 
      nickname: 'Dacara Friends 2', entityType: 'friend' }
  ),

      dacaraDriveRescue3:() => _emitPath('SIM_DACRARA_FRIEND_03',
      [[0.003707,-0.000742],[0.003076,-0.001086],[0.002677,-0.001193],
      [0.001696,-0.001322],[0.000799,-0.001644],[0.000134,-0.001901]], 
      { intervalMs: 1400, mot: 'car', 
      nickname: 'Dacara Friends 3', entityType: 'friend' }
  ),
        dacaraDriveRescue4:() => _emitPath('SIM_DACRARA_FRIEND_04',
        [[-0.002325,-0.002094],[-0.001877,-0.002416],
        [-0.000996,-0.002845],[-0.000231,-0.003124],
        [0.00035,-0.003424],[0.000267,-0.002867],
        [0.000267,-0.002373]], { intervalMs: 1400, mot: 'car', 
      nickname: 'Dacara Friends 4', entityType: 'friend' }
  ),
       dacaraDriveRescue5:() => _emitPath('SIM_DACRARA_FRIEND_04',
    [[0.000134,0.002305],[-0.000198,0.001618],
    [-0.000431,0.001039],
    [-0.000697,0.000674],[-0.000863,0.000266],
    [-0.000996,-0.000034]], { intervalMs: 1400, mot: 'car', 
      nickname: 'Dacara Friends 4', entityType: 'friend' }
  ),
  // ─── FRIENDS ───
  rescueTasia1:() => _emitPath('SIM_TASIA_FRIEND_01',
    [ [0.001593,-0.003645],[0.000629,-0.003237],
       [0.000463,-0.002078],[0.00028,-0.001499],
       [-0.000268,-0.000727],[-0.000833,-0.000147],
       [-0.000052,0.001205],[0.000297,0.002192],
       [0.000596,0.00275],[-0.000435,0.003222]
    ], { intervalMs: 1400, mot: 'car', 
      nickname: 'TASIA Friend 1', entityType: 'friend' }
  ),
  rescueTasia2:() => _emitPath('SIM_TASIA_FRIEND_02',
    [
      [0.003354,-0.000877], 
      [0.00038,-0.001735],[0.000047,-0.001113],
      [-0.000185,-0.000619],[-0.000734,-0.000169],
      [-0.001099,0.000089],[-0.000717,0.000368],
      [-0.001099,0.000797],[-0.001731,0.001269],
      [-0.002213,0.001784],[-0.001947,0.002728],
      [-0.001565,0.003543] 
    ], { intervalMs: 1400, mot: 'car', 
        nickname: 'TASIA Friend 2', entityType: 'friend' }
  ),
  rescueTasia3:() => _emitPath('SIM_TASIA_FRIEND_03',
    [
      [-0.001165,0.005282],[-0.001231,0.005111],
      [-0.001331,0.004875],
      [-0.001364,0.004681],[-0.001397,0.004402],
      [-0.001431,0.004081],[-0.001215,0.004038],
      [-0.000866,0.003995]
    ], { intervalMs: 1400, mot: 'run', 
      nickname: 'TASIA Friend 3', entityType: 'friend' }
  ),
  rescueTasia4:() => _emitPath('SIM_TASIA_FRIEND_04',
    [
      [-0.000082,0.007911],[-0.000065,0.007696],
      [0.000134,0.006816],[0.000234,0.006301],
      [0.00045,0.005572],[0.000483,0.004907],
      [0.000616,0.004284],[0.000782,0.003855],
      [0.000882,0.003641]
    ], { intervalMs: 1400, mot: 'run', 
      nickname: 'TASIA Friend 4', entityType: 'friend' }
  ),
  rescueTasia5:() => _emitPath('SIM_TASIA_FRIEND_05',
  [
    [-0.00069,0.006633],[-0.000574,0.005968],
    [-0.000491,0.005582],[-0.000441,0.005153],
    [-0.000308,0.004681],[-0.000058,0.004402],
    [0.000374,0.004316],
    [0.000656,0.004123],[0.000756,0.003694],
    [0.00054,0.003608],[0.000091,0.003651]
  ], { intervalMs: 1400, mot: 'walk', 
      nickname: 'TASIA Friend 5', entityType: 'friend' }
  ),
  tasia:() => _emitPath('SIM_TASIA_01',
    [
      [-0.000457,0.000413],[-0.000141,0.001292],[0.000191,0.002022],
      [0.000407,0.002494],[0.00059,0.002945],
      [0.000623,0.003309],[0.000241,0.003588],
      [-0.000175,0.003717],[-0.000524,0.003738]
    ], { intervalMs: 1400, mot: 'walk', 
     nickname: 'TASIA', entityType: 'friend' }
  ),
  potasia: ()=> _emitPath('SIM_POTASIA_01',
    [
    [0.001029,0.003691],[0.001029,0.003591],
    [0.001029,0.003691],[0.001029,0.003691],
    [0.001029,0.003691],[0.001029,0.003691],
    [0.001029,0.003691],[-0.000001,0.003906],
    ],
    { intervalMs: 1400, mot: 'walk', 
     nickname: 'TASIA ENEMY', entityType: 'enemy' }
  ),
  trickster: () => _emitPath('SIM_TRICK_01', 
    [
      [0.000572,-0.003182],[0.000306,-0.001723],[0.001054,-0.001444],
      [0.003181,-0.000844],[0.003929,-0.0005],[0.004211,-0.000243],
      [0.00456,0.001324],  [0.00446,0.002675],[0.004111,0.002933],
      [0.003613,0.003298], [0.003264,0.003255],[0.002782,0.003469],
      [0.002416,0.003362], [0.002184,0.00319],[0.001818,0.002954],
      [0.000655,0.002096]
  ], { intervalMs: 2400, mot: 'car', nickname: 'trickster', entityType: 'enemy' }),
  maya: () => _emitPath('SIM_MAYA_01', [
    [0.0003, 0.0005], [0.0006, 0.0009], [0.0009, 0.0013],
    [0.0012, 0.0017], [0.0015, 0.0021], [0.0018, 0.0025],
  ], { intervalMs: 1400, mot: 'walk', nickname: 'Maya', entityType: 'friend' }),

  marcus: () => _emitPath('SIM_MARCUS_02', [
    [-0.0020, 0.0000], [-0.0014, 0.0005], [-0.0008, 0.0010],
    [-0.0002, 0.0015], [0.0004, 0.0020], [0.0010, 0.0025],
  ], { intervalMs: 900, mot: 'run', nickname: 'Marcus', entityType: 'friend' }),

  tanisha: () => _emitPath('SIM_TANISHA_03', [
    [0.0030, -0.0030], [0.0020, -0.0018], [0.0010, -0.0006],
    [0.0000, 0.0006], [-0.0010, 0.0018], [-0.0020, 0.0030],
  ], { intervalMs: 700, mot: 'car', nickname: 'Tanisha', entityType: 'friend' }),

  // ─── STRANGER — unknown person, slow approach, no name ───
  stranger: () => _emitPath('SIM_STRANGER_04', [
    [0.0006, -0.0006], [0.0005, -0.0005], [0.0004, -0.0004],
    [0.0003, -0.0003], [0.0002, -0.0002], [0.0001, -0.0001],
  ], { intervalMs: 1200, mot: 'walk', nickname: null, entityType: 'stranger' }),

  // ─── ENEMY — fast approach, from a distance, no name ───
  enemy: () => _emitPath('SIM_ENEMY_05', [
    [0.0050, -0.0050], [0.0038, -0.0038], [0.0026, -0.0026],
    [0.0014, -0.0014], [0.0005, -0.0005], [0.0001, -0.0001],
  ], { intervalMs: 700, mot: 'car', nickname: null, entityType: 'enemy' }),

  // ─── SCENARIO: Ambush setup ───
  // Maya walks. A stranger approaches. An enemy cuts her off.
  ambushSetup: async () => {
    await Promise.all([
      SimSequences.tasia(),
      SimSequences.potasia(),
    ]);
  },
  ambushSetupRescue: async () => {
    const tasia = SimSequences.tasia();
    const enemy = SimSequences.potasia();
    // Let them play for 3.5 seconds
    await new Promise((r) => setTimeout(r, 3500));
    // NOW fire the alarm — right when the enemy closes in
    Sim.emergency('SCR');
    await new Promise((r) => setTimeout(r, 1500));

    await Promise.all([
      SimSequences.rescueTasia1(),
      SimSequences.rescueTasia2(),
      SimSequences.rescueTasia3(),
      SimSequences.rescueTasia4(),
      SimSequences.rescueTasia5(),
      tasia,
      enemy,
    ]);
  },
    ambushSetupRescueAllAtOnce: async () => {
    // Phase 1 — Tasia walks (let it run mostly through)
    await SimSequences.tasia();

    // Small pause before danger enters
    await new Promise((r) => setTimeout(r, 1000));

    // Phase 2 — enemy lingers, trickster circles
    const potasia = SimSequences.potasia();
    await new Promise((r) => setTimeout(r, 2000));
    const trickster = SimSequences.trickster();

    // Phase 3 — alarm fires 3.5s in
    await new Promise((r) => setTimeout(r, 1500));
    Simulations.emergency('SCR');
    Simulations.chat('Team standby. Alarm active.', 'Overwatch');

    // Phase 4 — all five rescuers converge while enemies keep moving
    await Promise.all([
      SimSequences.rescueTasia1(),
      SimSequences.rescueTasia2(),
      SimSequences.rescueTasia3(),
      SimSequences.rescueTasia4(),
      SimSequences.rescueTasia5(),
      potasia,
      trickster,
    ]);

    // Wrap-up
    await new Promise((r) => setTimeout(r, 1500));
    Simulations.chat('Target vehicle exiting. Tasia is safe.', 'Rescue A');
  },


  // ─── SCENARIO: All friends ───
  allThree: async () => {
    await Promise.all([
      SimSequences.maya(),
      SimSequences.marcus(),
      SimSequences.tanisha(),
    ]);
  },

  // ─── SCENARIO: Stranger → Enemy escalation ───
  escalation: async () => {
    await SimSequences.stranger();
    await new Promise((r) => setTimeout(r, 2000));
    await SimSequences.enemy();
  },
};


export function setSimBase(lat, lon) {
  if (typeof lat === 'number' && typeof lon === 'number' &&
      !isNaN(lat) && !isNaN(lon)) {
    SIM_BASE_LAT = lat;
    SIM_BASE_LON = lon;
    console.log('[Sim] Base updated to', lat.toFixed(5), lon.toFixed(5));
  }
}

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
      lat: opts.lat ?? SIM_BASE_LAT,
      lon: opts.lon ?? SIM_BASE_LON,
      mot: opts.mot ?? 'still',
    }, opts),

  gpsWalking: (offset = 0.0005) =>
    envelope('HBT', {
      bat: 91,
      lat: SIM_BASE_LAT + offset,
      lon: SIM_BASE_LON + offset,
      mot: 'walk',
    }, { prio: 1, cap: CAP.GPS | CAP.MOTION }),

  gpsRunning: (offset = 0.002) =>
    envelope('HBT', {
      bat: 88,
      lat: SIM_BASE_LAT + offset,
      lon: SIM_BASE_LON + offset,
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
      lat: SIM_BASE_LAT + 0.001,
      lon: SIM_BASE_LON + 0.001,
      accuracy_m: 30,
    }, {
      nid: opts.nid ?? 'TRIGGER_03',
      prio: 2,
      cap: CAP.MOTION,
    }),

  // ═══════════════════════════════════════════════════════════
  // FUSION PACKETS — Multi-sensor confirmed detection
  // ═══════════════════════════════════════════════════════════

  // ─── SNS: All 3 sensors agree — confirmed human ───
    // ═══════════════════════════════════════════════════════════
  // FUSION PACKETS — Multi-sensor confirmed detection
  // ═══════════════════════════════════════════════════════════

  // ─── SNS: All 3 sensors agree — confirmed human ───
fusionTriple: () =>
  envelope('SNS', {
    src: 112, conf: 94, mag: 87, peak_ms: 42,
    pir: 89, thm: 78, geo: 45,
    lat: SIM_BASE_LAT + 0.001,
    lon: SIM_BASE_LON + 0.001,
    accuracy_m: 15,                     // ← add this
  }, { nid: 'NODE_FOREST_01', prio: 3, cap: NODE_CAPS.TRIPLE_SENSOR }),

  // ─── SNS: Thermal + Geophone — stationary hider ───
  fusionStationary: () =>
    envelope('SNS', {
      src: 96,
      conf: 82,
      mag: 72,
      peak_ms: 18,
      thm: 78,
      geo: 41,
      lat: SIM_BASE_LAT + 0.002,
      lon: SIM_BASE_LON - 0.001,
      accuracy_m: 25,           
    }, {
      nid: 'NODE_FOREST_02',
      prio: 3,
      cap: NODE_CAPS.TRIPLE_SENSOR,
    }),

  // ─── SNS: Geophone only — quiet footsteps ───
  fusionFootsteps: () =>
    envelope('SNS', {
      src: 64,
      conf: 65,
      mag: 55,
      peak_ms: 92,
      geo: 55,
      lat: SIM_BASE_LAT - 0.001,
      lon: SIM_BASE_LON + 0.002,
      accuracy_m: 40,           
    }, {
      nid: 'NODE_TRAIL_03',
      prio: 2,
      cap: NODE_CAPS.TRIPLE_SENSOR,
    }),

  // ─── SNS: PIR + Thermal — moving person ───
  fusionMoving: () =>
    envelope('SNS', {
      src: 48,
      conf: 78,
      mag: 83,
      peak_ms: 25,
      pir: 85,
      thm: 80,
      lat: SIM_BASE_LAT + 0.003,
      lon: SIM_BASE_LON + 0.003,
    }, {
      nid: 'NODE_PATH_04',
      prio: 2,
      cap: NODE_CAPS.TRIPLE_SENSOR,
    }),

  // ─── SNS: ToF path crossing ───
  fusionToF: () =>
    envelope('SNS', {
      src: 128,
      conf: 90,
      mag: 180,
      peak_ms: 5,
      tof: 8,
      lat: SIM_BASE_LAT + 0.004,
      lon: SIM_BASE_LON,
      accuracy_m: 5,           
    }, {
      nid: 'NODE_TRAIL_04',
      prio: 2,
      cap: CAP.TOF | CAP.MOTION,
    }),

  // ─── SNS: IR beam broken ───
  fusionIRBeam: () =>
    envelope('SNS', {
      src: 256,
      conf: 100,
      mag: 255,
      peak_ms: 1,
      irb: 1,
      lat: SIM_BASE_LAT - 0.002,
      lon: SIM_BASE_LON - 0.002,
      accuracy_m: 2,           
    }, {
      nid: 'NODE_CHOKE_05',
      prio: 3,
      cap: CAP.IR_BEAM,
    }),

  // ─── SNS: Full 5-sensor forest node ───
  fusionFullForest: () =>
    envelope('SNS', {
      src: 496,
      conf: 98,
      mag: 92,
      peak_ms: 33,
      pir: 89,
      thm: 78,
      geo: 45,
      tof: 12,
      irb: 1,
      lat: SIM_BASE_LAT,
      lon: SIM_BASE_LON,
      accuracy_m: 10,           
    }, {
      nid: 'NODE_FOREST_FULL_01',
      prio: 3,
      cap: NODE_CAPS.FULL_FOREST,
    }),
  // ─── ALM: Alarm ───
  emergency: (mode = 'SCR') =>
    envelope('ALM', {
      mode,
      tts: mode === 'SCR' ? 1 : 0,
      lat: SIM_BASE_LAT,
      lon: SIM_BASE_LON,
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
      lat: SIM_BASE_LAT + 0.003,
      lon: SIM_BASE_LON + 0.002,
      mot: 'walk',
    }, { nid: 'FRIEND_02', team_id: 1, cap: CAP.GPS | CAP.MOTION }),
};

 
/*
Sim.fusionTriple(); //      — 3 sensors confirm human');
Sim.fusionStationary(); //  — hidden in bush');
Sim.fusionFootsteps();//   — quiet walker');
Sim.fusionFullForest();// — all 5 sensors');
Sim.emergency("SCR");//    — loud alarm');

*/
// ─── Clear handler ───
let clearHandler = null;

export function registerClearHandler(handler) {
  clearHandler = handler;
}
// simulator.js
// ✅ simulation.js — just delegates
export function clearAll() {
  if (clearHandler) clearHandler();
  console.log('[Sim] All markers cleared.');
}

 


// ─── Sim → App bridge ───
// The app registers a handler; Sim functions call it automatically.
let simHandler = null;

export function registerSimHandler(handler) {
  simHandler = handler;
}

// Functions that DO NOT emit packets — should not be wrapped
const NON_PACKET_FNS = new Set(['clearAll']);

// In simulation.js, above the Proxy

Simulations.sequence = (name) => {
  const fn = SimSequences[name];
  if (typeof fn === 'function') fn();
};
const _originalSim = Simulations;
export const Sim = new Proxy(_originalSim, {
  get(target, prop) {
    const fn = target[prop];
    if (typeof fn !== 'function') return fn;
    if (NON_PACKET_FNS.has(prop)) return fn;   // ← pass through unwrapped
    return (...args) => {
      const packet = fn(...args);
      if (simHandler && packet && packet.typ) simHandler(packet);  // ← also guard
      return packet;
    };
  },
});
/*
// Register the sequence dispatcher so DemoPilot can call Sim.sequence('maya')
Simulations.sequence = (name) => {
  const fn = SimSequences[name];
  if (typeof fn === 'function') fn();
};
*/
// Console exposure uses the wrapped version
if (typeof window !== 'undefined') {
  window.Sim = Sim;
  window.Sim.clearAll = clearAll;
  window.Sim.CAP = CAP;
  window.Sim.NODE_CAPS = NODE_CAPS;
  console.log('[Sim] Ready. Try:');
  console.log('  Sim.fusionTriple()');
  console.log('  Sim.fusionStationary()');
  console.log('  Sim.fusionFootsteps()');
  console.log('  Sim.fusionFullForest()');
  console.log('  Sim.emergency("SCR")');


 
  window.Sim.sequence = SimSequences;
 
}
/* 

Sim.fusionTriple();
Sim.Stationary();
Sim.Footsteps();
Sim.ToF();
Sim.IRBeam();
Sim.FullForest();

Sim.emergency('SCR');
Sim.emergency('SIL');
Sim.clearAll();

Sim.gpsWalking(); 
Sim.Running();
*/

