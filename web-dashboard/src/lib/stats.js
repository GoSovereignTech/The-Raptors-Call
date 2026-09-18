// src/lib/stats.js
// All public-facing statistics, loadouts, and prices.
// Update numbers here — they propagate to the splash page.

export const STATS = [
  {
    id: 'missing',
    number: '600,000+',
    label: 'people reported missing in the US every year',
    source: 'NCIC Missing Person File, FBI',
    sourceUrl: 'https://www.fbi.gov/services/cjis/ncic',
  },
  {
    id: 'hateCrimes',
    number: '3,004',
    label: 'anti-Black hate crimes reported to the FBI in 2024',
    source: 'FBI Hate Crime Statistics, 2024',
    sourceUrl: 'https://www.fbi.gov/services/cjis/ucr/hate-crime',
  },
  {
    id: 'lynchings',
    number: '70+',
    label: 'suspected modern-day lynchings across 7 Southern states, 2000–2025',
    source: '"A Crimson Record" report, 2025',
    sourceUrl: null,
  },
  {
    id: 'alone',
    number: '1 in 3',
    label: 'homicides happen when the victim is alone and unwitnessed',
    source: 'FBI Uniform Crime Report (aggregate)',
    sourceUrl: 'https://ucr.fbi.gov/',
  },
];

// ─── The challenge — used on the splash to qualify the audience ───
export const CHALLENGE = [
  'Do you want to be an active part of stopping the epidemic of missing persons, lynchings, and hate crimes?',
  'Are you willing to be visible to a vetted team — and to see them in return?',
  'Can you respond when a neighbor is in danger, even if you do not know them personally?',
  'Are you willing to go through vetting — references, background check, and an in-person interview?',
];

// ─── Free vs. paid — what the dashboard gives you vs. the Key ───
export const FREE_TIER = {
  name: 'The Dashboard (Free)',
  bullets: [
    'Full map with your position and community overlay',
    'See team members and detections from any paired node',
    'Simulation mode for training and demos',
    'Works on any modern phone browser',
  ],
};

// ─── Loadouts — prices from updated BOM (2026) ───
export const LOADOUTS = [
  {
    id: 1,
    name: 'Personal Alarm & Off-Grid Beacon Tag',
    tagline:
      'Wearable panic button + GPS beacon. Works with zero cell signal. Sounds the alarm that brings your entire team to your exact location.',
    priceLabel: '$149',
    benefits: [
      'Instant alarm to your whole team',
      'Silent mode for discreet alerts',
      'Disguised as jewelry — necklace, bracelet, hairpin, waist beads',
      'Rechargeable via solar',
      'Reduces missing-person, lynching, and hate-crime outcomes',
    ],
    href: 'https://sparklesnovel.gumroad.com/l/personalAlarm',
  },
  {
    id: 2,
    name: "The Raptor's Key — Off-Grid Mesh Interface",
    tagline:
      'Three-port USB-C interface. Plug in the mesh node, radar, and power. Turns any phone into a detection station.',
    priceLabel: '$129',
    benefits: [
      'Accepts the C2 Node, Radar Module, and charging',
      'Detects people through walls and foliage',
      'Encrypted team messaging — no monthly fees',
      'Works when paired with the free dashboard',
      'This is what unlocks real-world detection',
    ],
    href: 'https://sparklesnovel.gumroad.com/l/teamwork',
  },
  {
    id: 3,
    name: 'Raptor-Relay Tree Canopy Solar Node',
    tagline:
      'Solar-powered repeater that extends your neighborhood mesh range for free — indefinitely.',
    priceLabel: '$149',
    benefits: [
      'Extends mesh coverage by miles',
      'Runs indefinitely on solar',
      'Weatherproof — mounts in tree canopy',
      'Relays traffic without seeing your data',
      'Essential for rural and forested areas',
    ],
    href: 'https://sparklesnovel.gumroad.com/l/l_3_relays',
  },
];

export const MORE_LOADOUTS = [
  {
    id: 4,
    name: 'Raptor-Grid 3-Pack Perimeter Nodes',
    priceLabel: '$529',
    href: 'https://sparklesnovel.gumroad.com/l/Triple-SensorNodes',
  },
  {
    id: 5,
    name: 'Raptor-Command Full Security System',
    priceLabel: '$949',
    href: 'https://sparklesnovel.gumroad.com/l/l_5_c2',
  },
  {
    id: 6,
    name: 'Raptor-Radar Pocket Sensor',
    priceLabel: '$119',
    href: 'https://sparklesnovel.gumroad.com/l/l_6_radar',
  },
];