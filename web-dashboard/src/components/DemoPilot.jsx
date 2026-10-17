// src/components/DemoPilot.jsx
// Semi-transparent forward-only demo button + draggable caption.
// Tapping the button advances through the queue; wraps at the end.

import { useState, useRef, useEffect } from 'react';
import { Play } from 'lucide-react';

import { setSimBase } from '../lib/simulation.js';


const QUEUE = [
  // ── SCENE 1 ─────────────────────────────────────────
  {
    scene: 'Routine Walk',
    fn: 'sequence',
    arg: ['maya'],
    caption: 'Scene 1 — Maya walks her usual route home. All normal.',
  },

  // ── SCENE 2 ─────────────────────────────────────────
  {
    scene: 'Dacara Rescue',
    fn: 'sequence',
    arg: ['dacaraFullScene'],
    caption: 'Scene 2 — Dacara is lured into a vehicle. She pulls the pin. Team rescues.',
  },

  // ── SCENE 3 ─────────────────────────────────────────
  {
    scene: 'Ambush Intercept',
    fn: 'sequence',
    arg: ['ambushSetupRescueAllAtOnce'],
    caption: 'Scene 3 — Stalker ambush. Five teammates converge in under 90 seconds.',
  },

  // ── SCENE 4 ─────────────────────────────────────────
  {
    scene: 'All Friends',
    fn: 'sequence',
    arg: ['allThree'],
    caption: 'Scene 4 — Three teammates moving at once. Walk, run, and drive.',
  },

  // ── SCENE 5 ─────────────────────────────────────────
  {
    scene: 'End',
    fn: 'clearAll',
    arg: null,
    caption: 'End of demo. Press Rewind to review any scene.',
  },
];



export function DemoPilot({ onRun, 
  anchorLat,          // ← new
  anchorLon,  
  bottomOffset = 320 }) {
  const [index, setIndex] = useState(-1);
  const [caption, setCaption] = useState('');

  // Draggable caption state
  const [captionPos, setCaptionPos] = useState({ x: 0, y: 0 });
  const dragRef = useRef({ dragging: false, startX: 0, startY: 0, originX: 0, originY: 0 });

  const advance = () => {
    const next = (index + 1) % QUEUE.length;
    const step = QUEUE[next];
    console.log('index=',index, ' step =',step );
    setIndex(next);
    setCaption(step.caption);

    // ── Re-anchor sim base to the user's current location ──
    if (typeof anchorLat === 'number' && typeof anchorLon === 'number') {
      setSimBase(anchorLat, anchorLon);
    }
    // ── Clear previous scene before loading the next (skip on very first run) ──
    if (index >= 0) {
      try { window.Sim?.clearAll?.(); } catch {}
    }

    // Small delay so clear settles before new packets fly
    setTimeout(() => {
      try {
        if (Array.isArray(step.arg)) onRun(step.fn, ...step.arg);
        else if (step.arg != null) onRun(step.fn, step.arg);
        else onRun(step.fn);
      } catch (e) {
        console.warn('[DemoPilot] Step failed:', step.fn, e);
      }
    }, 150);


  
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
      
      
      {index === -1 && (
        <div className="absolute left-2 right-14 sm:right-16 z-[560] rounded-md border border-amber-500/40 bg-raptor-bg/90 backdrop-blur px-2.5 py-1.5 text-[11px] sm:text-xs text-amber-100 shadow-lg"
            style={{ bottom: `${bottomOffset}px` }}>
          <span className="font-bold text-amber-500 mr-1.5">▶</span>
          Press the play button to watch a rescue scenario. Each scene runs at your current location.
        </div>
      )}
      
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
           Scene {index + 1} of {QUEUE.length}
          </span>
          <span>{caption}</span>
        </div>
      )}
    </>
  );
}