// src/components/RewindPanel.jsx
import { useState, useEffect, useRef } from 'react';
import { Play, Pause, X, RotateCcw } from 'lucide-react';

export function RewindPanel({ 
  isOpen, 
  onClose, 
  maxSeconds = 300, // 5 minutes of history
  currentTime, 
  onChangeTime,
  isPlaying,
  onPlayPause 
}) {
  if (!isOpen) return null;


  // Calculate time ago (e.g., "-2:30")
  const safeTime = currentTime || Date.now();
  const secondsAgo = Math.floor((Date.now() - safeTime) / 1000);
  const mins = Math.floor(Math.abs(secondsAgo) / 60);
  const secs = Math.abs(secondsAgo) % 60;
  const timeStr = `-${mins}:${secs.toString().padStart(2, '0')}`;

  return (
      <div className="js-rewind-panel-check absolute bottom-36 left-3 right-3 rounded-xl border backdrop-blur-xl p-3 shadow-2xl"
        style={{ 
          background: 'var(--panel-bg)', 
          borderColor: 'var(--panel-border)',
          zIndex: 9999 // <-- Forces it above everything
        }}>
      
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs font-bold tracking-widest uppercase" style={{ color: 'var(--accent)' }}>
          Time Rewind
        </div>
        <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-700/50">
          <X className="h-4 w-4" style={{ color: 'var(--text-muted)' }} />
        </button>
      </div>

      <div className="flex items-center gap-3">
        <button 
          onClick={onPlayPause}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white flex-shrink-0"
        >
          {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
        </button>

        <div className="flex-1 flex flex-col gap-1">
          <input 
            type="range" 
            min={Date.now() - (maxSeconds * 1000)} 
            max={Date.now()} 
            value={currentTime}
            onChange={(e) => onChangeTime(Number(e.target.value))}
            className="w-full accent-blue-500 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] font-mono text-gray-400">
            <span>-{maxSeconds / 60}m ago</span>
            <span className="font-bold text-white text-xs">{timeStr}</span>
            <span>Now</span>
          </div>
        </div>
        
        <button 
          onClick={() => onChangeTime(Date.now())}
          className="p-2 rounded-full hover:bg-gray-700/50"
          title="Return to live"
        >
          <RotateCcw className="h-5 w-5" style={{ color: 'var(--text-muted)' }} />
        </button>
      </div>
    </div>
  );
}