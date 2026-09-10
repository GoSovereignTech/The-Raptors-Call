// src/lib/alarmAudio.js
// Siren playback — tries MP3 first, falls back to Web Audio oscillator.

const ALARM_MP3 = '/bigHypnotize.mp3';
const SIREN_VOLUME = 0.5;
const SIREN_FREQ_MIN = 350;
const SIREN_FREQ_MAX = 850;

let audioEl = null;
let audioCtx = null;
let oscNodes = null;
let sweepTimer = null;
let usingFallback = false;

export function playSiren() {
  if (audioEl || usingFallback) return; // already running
  try {
    audioEl = new Audio(ALARM_MP3);
    audioEl.loop = true;
    audioEl.volume = SIREN_VOLUME;
    audioEl.addEventListener('error', () => {
      audioEl = null;
      startFallbackSiren();
    });
    const p = audioEl.play();
    if (p && p.catch) {
      p.catch(() => {
        audioEl = null;
        startFallbackSiren();
      });
    }
  } catch (e) {
    startFallbackSiren();
  }
}

export function stopSiren() {
  if (audioEl) {
    try {
      audioEl.pause();
      audioEl.currentTime = 0;
    } catch (e) {}
    audioEl = null;
  }
  if (usingFallback) {
    usingFallback = false;
    if (oscNodes) {
      try { oscNodes.osc.stop(); } catch (e) {}
      oscNodes = null;
    }
    if (sweepTimer) {
      cancelAnimationFrame(sweepTimer);
      sweepTimer = null;
    }
  }
}

function startFallbackSiren() {
  if (usingFallback) return;
  usingFallback = true;
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sawtooth';
    gain.gain.value = 0.05;
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    oscNodes = { osc, gain };

    let t = 0;
    const sweep = () => {
      if (!usingFallback) return;
      t += 0.05;
      const f = SIREN_FREQ_MIN + ((Math.sin(t) + 1) / 2) * (SIREN_FREQ_MAX - SIREN_FREQ_MIN);
      osc.frequency.setValueAtTime(f, audioCtx.currentTime);
      sweepTimer = requestAnimationFrame(sweep);
    };
    sweep();
  } catch (e) {
    console.warn('Audio unavailable:', e);
  }
}

export function isSirenPlaying() {
  return !!audioEl || usingFallback;
}