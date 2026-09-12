// src/lib/loadouts.js
// Central registry for loadout links and nudge messages.
// Update URLs here — they propagate through the entire app.
/*
How to add TTS?	Pre-generate WAV files with espeak-ng, map command IDs to files
*/
export const AUDIO_COMMANDS = {
  1: { file: 'WAV_SIREN_130DB.wav',          label: 'Loud siren' },
  2: { file: 'WAV_WARNING_LEGAL.wav',        label: 'Legal warning' },
  3: { file: 'WAV_TACTICAL_EXTRACTION.wav',  label: 'Extraction route' },
  4: { file: 'TTS_HELP_UNDER_ATTACK.wav',    label: 'TTS: Help under attack' },
  5: { file: 'TTS_TEAM_2_MIN_OUT.wav',       label: 'TTS: Team 2 min out' },
};

export const LOADOUTS = {
  personalAlarm: {
    id: 'loadout-1',
    title: 'Personal Alarm & Off-Grid Beacon Tag',
    url: 'https://sparklesnovel.gumroad.com/l/personalAlarm',
    description: 'Wearable 130dB siren + silent GPS beacon',
  },
  c2Dongle: {
    id: 'loadout-2',
    title: 'Raptor-C2 Pocket Mesh Dongle',
    url: 'https://sparklesnovel.gumroad.com/l/teamwork',
    description: 'Turns your phone into an off-grid command unit',
  },
  solarRelay: {
    id: 'loadout-3',
    title: 'Raptor-Relay Tree Canopy Solar Node',
    url: 'https://sparklesnovel.gumroad.com/l/l_3_relays',
    description: 'Extends mesh coverage across miles',
  },
  sensorGrid: {
    id: 'loadout-4',
    title: 'Raptor-Grid 3-Pack Triple-Sensor Perimeter Nodes',
    url: 'https://sparklesnovel.gumroad.com/l/Triple-SensorNodes',
    description: 'Motion, thermal, seismic early-warning perimeter',
  },
  fullSystem: {
    id: 'loadout-5',
    title: 'Raptor-Command Full Security System',
    url: 'https://sparklesnovel.gumroad.com/l/l_5_c2',
    description: 'Complete kit — every device in one box',
  },
};

export const NUDGES = {
  alarm: {
    title: 'Alarm triggered',
    message:
      'In the real world, this instantly sounds your 130dB siren and broadcasts your GPS to your team.',
    loadout: 'personalAlarm',
  },
  mesh: {
    title: 'Mesh overlay',
    message:
      'To detect and see LIVE people on the map you need, the OTG adapter and the Meshtastic RAKWireless Node.',
    loadout: 'c2Dongle',
  },
  radar: {
    title: 'Radar overlay',
    message:
      'A Radar / Camera Dongle powers this overlay in the real world.',
    loadout: 'sensorGrid',
  },
  chat: {
    title: 'Mesh chat',
    message:
      'Live chat requires a Smartphone Node with Command Interface.',
    loadout: 'c2Dongle',
  },
  connect: {
    title: 'No dongle detected',
    message:
      'Connect a Raptor-C2 Pocket Mesh Dongle to go live on the mesh. Until then, you are viewing simulation data.',
    loadout: 'c2Dongle',
  },
};

export function getLoadout(key) {
  return LOADOUTS[key] || null;
}