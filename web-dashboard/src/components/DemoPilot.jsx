// src/components/DemoPilot.jsx
// Semi-transparent forward-only demo button + caption overlay.
// Tapping advances through the queue; wraps at the end.

import { useState } from 'react';
import { Play } from 'lucide-react';

const QUEUE = [
  { fn: 'heartbeat',        arg: null,        caption: 'Check-in: team member at rest, all normal.' },
  { fn: 'gpsWalking',       arg: null,        caption: 'She starts walking home — normal pace, usual route.' },
  { fn: 'gpsRunning',       arg: null,        caption: 'Speed jumps to running. Pattern break flagged.' },
  { fn: 'fusionMoving',     arg: null,        caption: 'Nearby node: motion + thermal — someone is with her.' },
  { fn: 'fusionTriple',     arg: null,        caption: 'PIR + Thermal + Seismic agree — confirmed human.' },
  { fn: 'fusionStationary', arg: null,        caption: 'Another node: someone stopped moving. Hiding.' },
  { fn: 'fusionFootsteps',  arg: null,        caption: 'Seismic only — quiet footsteps, low confidence.' },
  { fn: 'chat',             arg: ['Team is 2 minutes out.', 'Team A'], caption: 'Team coordinates over mesh chat.' },
  { fn: 'chat',             arg: ['Overwatch has eyes. Flagging contact.', 'Overwatch'], caption: 'Overwatch reports visual.' },
  { fn: 'emergency',        arg: ['SCR'],     caption: 'PIN PULLED — loud siren, GPS broadcast to team.' },
  { fn: 'clearAll',         arg: null,        caption: 'Situation resolved. Map cleared.' },
];

export function DemoPilot({ onRun, bottomOffset = 320 }) {
  const [index, setIndex] = useState(-1);
  const [caption, setCaption] = useState('');

  const advance = () => {
    const next = (index + 1) % QUEUE.length;
    const step = QUEUE[next];
    setIndex(next);
    setCaption(step.caption);
    try {
      if (Array.isArray(step.arg)) onRun(step.fn, ...step.arg);
      else if (step.arg != null) onRun(step.fn, step.arg);
      else onRun(step.fn);
    } catch (e) {
      console.warn('[DemoPilot] Step failed:', step.fn, e);
    }
  };

  return (
    <>
      <button
        onClick={advance}
        className="absolute right-4 z-[560] flex h-11 w-11 items-center justify-center rounded-full border border-amber-500/40 bg-amber-500/20 backdrop-blur text-amber-300 shadow-lg transition hover:bg-amber-500/40 active:scale-95"
        style={{ bottom: `${bottomOffset}px` }}
        aria-label="Advance demo"
        title="Advance demo step"
      >
        <Play className="h-5 w-5" />
      </button>

      {caption && (
        <div
          className="pointer-events-none absolute right-4 z-[560] max-w-[260px] rounded-lg border border-amber-500/40 bg-raptor-bg/95 px-3 py-2 backdrop-blur shadow-lg text-xs text-amber-100"
          style={{ bottom: `${bottomOffset + 56}px` }}
        >
          <div className="mb-0.5 text-[10px] uppercase tracking-widest text-amber-500">
            Step {index + 1} / {QUEUE.length}
          </div>
          {caption}
        </div>
      )}
    </>
  );
}