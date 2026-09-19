// src/components/DemoPilot.jsx
// Semi-transparent forward-only demo button + draggable caption.
// Tapping the button advances through the queue; wraps at the end.

import { useState, useRef, useEffect } from 'react';
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

  // Draggable caption state
  const [captionPos, setCaptionPos] = useState({ x: 0, y: 0 });
  const dragRef = useRef({ dragging: false, startX: 0, startY: 0, originX: 0, originY: 0 });

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

  // ─── Drag handlers ───
  const onPointerDown = (e) => {
    dragRef.current = {
      dragging: true,
      startX: e.clientX,
      startY: e.clientY,
      originX: captionPos.x,
      originY: captionPos.y,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e) => {
    if (!dragRef.current.dragging) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setCaptionPos({
      x: dragRef.current.originX + dx,
      y: dragRef.current.originY + dy,
    });
  };

  const onPointerUp = (e) => {
    dragRef.current.dragging = false;
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch {}
  };

  return (
    <>
      {/* Advance button — repositioned on small screens via inline style */}
      <button
        onClick={advance}
        className="absolute right-2 sm:right-4 z-[560] flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full border border-amber-500/40 bg-amber-500/20 backdrop-blur text-amber-300 shadow-lg transition hover:bg-amber-500/40 active:scale-95"
        style={{ bottom: `${bottomOffset}px` }}
        aria-label="Advance demo"
        title="Advance demo step"
      >
        <Play className="h-4 w-4 sm:h-5 sm:w-5" />
      </button>

      {/* Draggable caption */}
      {caption && (
        <div
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          className="absolute left-2 right-14 sm:right-16 z-[560] cursor-grab active:cursor-grabbing rounded-md border border-amber-500/40 bg-raptor-bg/90 backdrop-blur px-2.5 py-1.5 shadow-lg text-[11px] sm:text-xs text-amber-100 select-none touch-none"
          style={{
            bottom: `${bottomOffset}px`,
            transform: `translate(${captionPos.x}px, ${captionPos.y}px)`,
          }}
        >
          <span className="font-bold text-amber-500 mr-1.5">
            {index + 1}/{QUEUE.length}
          </span>
          <span className="text-amber-100">{caption}</span>
        </div>
      )}
    </>
  );
}