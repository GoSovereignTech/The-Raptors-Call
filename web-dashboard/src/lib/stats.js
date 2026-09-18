// src/lib/stats.js
// All public-facing statistics with sources.
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

export const LOADOUTS = [
  {
    id: 1,
    name: 'Personal Alarm & Off-Grid Beacon Tag',
    tagline: 'Wearable panic button + GPS beacon. Works with zero cell signal.',
    price: 89,
    priceLabel: '$89+',
    benefits: [
      'Instant alarm to your entire team',
      'Silent mode for discreet alerts',
      'Disguised as jewelry — necklace, bracelet, hairpin',
      'Rechargeable via solar',
    ],
    href: 'https://sparklesnovel.gumroad.com/l/personalAlarm',
  },
  {
    id: 2,
    name: "The Raptor's Key — Off-Grid Mesh Interface",
    tagline: '3-port USB-C adapter. Turns any phone into a mesh+radar station.',
    price: 98,
    priceLabel: '$98+',
    benefits: [
      'Accepts the C2 Node, Radar Module, and charging',
      'Detects people through walls and foliage',
      'Encrypted team messaging',
      'No monthly fees, no subscription',
    ],
    href: 'https://sparklesnovel.gumroad.com/l/teamwork',
  },
  {
    id: 3,
    name: 'Raptor-Relay Tree Canopy Solar Node',
    tagline: 'Solar-powered repeater extends your neighborhood range for free.',
    price: 95,
    priceLabel: '$95+',
    benefits: [
      'Extends mesh coverage by miles',
      'Runs indefinitely on solar',
      'Weatherproof — mounts in tree canopy',
      'Relays traffic without seeing your data',
    ],
    href: 'https://sparklesnovel.gumroad.com/l/l_3_relays',
  },
];

export const MORE_LOADOUTS = [
  {
    id: 4,
    name: 'Raptor-Grid 3-Pack Perimeter Nodes',
    priceLabel: '$229+',
    href: 'https://sparklesnovel.gumroad.com/l/Triple-SensorNodes',
  },
  {
    id: 5,
    name: 'Raptor-Command Full Security System',
    priceLabel: '$698–$848',
    href: 'https://sparklesnovel.gumroad.com/l/l_5_c2',
  },
];