// src/components/DemoPilot.jsx
// Semi-transparent forward-only demo button + draggable caption.
// Tapping the button advances through the queue; wraps at the end.

import { useState, useRef, useEffect } from 'react';
import { Play } from 'lucide-react';




const QUEUE = [
  // ═══════════════════════════════════════════════════════════
  // PHASE 1 — ROUTINE
  // ═══════════════════════════════════════════════════════════
  { fn: 'clearAll', arg: null,
    caption: 'Setup — clean map. Three relay nodes online.' },

  { fn: 'sequence', arg: ['tasia'],
    caption: 'Phase 1 — Tasia walks her usual evening route home.' },

  // ═══════════════════════════════════════════════════════════
  // PHASE 2 — DANGER APPEARS
  // ═══════════════════════════════════════════════════════════
  { fn: 'sequence', arg: ['potasia'],
    caption: 'Phase 2 — An unknown vehicle idles near her route. Pattern flagged.' },

  { fn: 'sequence', arg: ['trickster'],
    caption: 'APP: Second vehicle circling the block. Two unknowns coordinating.' },

  { fn: 'chat', arg: ['Overwatch: suspicious vehicle parked at corner 4 min.', 'Overwatch'],
    caption: 'Overwatch reports visual. Team placed on standby.' },

  // ═══════════════════════════════════════════════════════════
  // PHASE 3 — ABDUCTION TRIGGERED
  // ═══════════════════════════════════════════════════════════
  { fn: 'emergency', arg: ['SCR'],
    caption: 'Phase 3 — PIN PULLED. Siren active. GPS broadcast to team.' },

  { fn: 'sequence', arg: ['rescueTasia1'],
    caption: 'Rescue A — inbound by car. ETA 40 seconds.' },

  { fn: 'sequence', arg: ['rescueTasia2'],
    caption: 'Rescue B — closing from the north. Intercepting route.' },

  { fn: 'sequence', arg: ['rescueTasia3'],
    caption: 'Rescue C — on foot, converging from the east.' },

  { fn: 'sequence', arg: ['rescueTasia4'],
    caption: 'Rescue D — sprinting from the north across the field.' },

  { fn: 'sequence', arg: ['rescueTasia5'],
    caption: 'Rescue E — approaching from the south on foot.' },

  // ═══════════════════════════════════════════════════════════
  // PHASE 4 — RESCUE COMPLETE
  // ═══════════════════════════════════════════════════════════
  { fn: 'chat', arg: ['Target vehicle exiting. 5 friendly contacts on scene.', 'Rescue A'],
    caption: 'Attacker flees. Team controls the location.' },

  { fn: 'chat', arg: ['Tasia is safe. Clear.', 'Rescue B'],
    caption: 'RESCUED — Tasia recovered within 90 seconds of the pin pull.' },

  { fn: 'clearAll', arg: null,
    caption: 'Map cleared. Report filed. Evidence preserved.' },
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
        className="absolute right-2 sm:right-4 z-[560] flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full border backdrop-blur transition active:scale-95"
        style={{
          bottom: `${bottomOffset}px`,
          background: 'var(--caption-bg)',
          borderColor: 'var(--caption-border)',
          color: 'var(--caption-accent)',
        }}
        aria-label="Advance demo"
      >
        <Play className="h-4 w-4 sm:h-5 sm:w-5" />
      </button>

      {/* Draggable caption */}
          {/*  prev.
               style={{
              bottom: `${bottomOffset}px`,
              transform: `translate(${captionPos.x}px, ${captionPos.y}px)`,
              background: 'var(--caption-bg)',
              borderColor: 'var(--caption-border)',
              color: 'var(--caption-text)',
            }}

          */}  

      {caption && (
        <div
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          className="absolute left-2 right-14 sm:right-16 z-[560] cursor-grab active:cursor-grabbing rounded-md border px-2.5 py-1.5 shadow-lg text-[11px] sm:text-xs select-none touch-none"
 
          style={{
            bottom: `150px`,
            left: `auto`,
            width: `auto`,
            maxWidth: `250px`,
            minWidth: `150px`,
            right: `12px`,
            transform: `unset`,
            background: 'var(--caption-bg)',
            borderColor: 'var(--caption-border)',
            color: 'var(--caption-text)',
          }} 
        >
          <span className="font-bold mr-1.5" style={{ color: 'var(--caption-accent)' }}>
            {index + 1}/{QUEUE.length}
          </span>
          <span>{caption}</span>
        </div>
      )}
    </>
  );
}