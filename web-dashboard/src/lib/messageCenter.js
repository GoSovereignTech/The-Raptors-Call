// src/lib/messageCenter.js
// Central message bus — one place for on-screen captions + background notifications.

let _handler = null;
let _notificationPermission = 'default';

// ─── Message categories ───
// event   → neutral narration ("Tasia walks home.")
// risk    → app-detected anomaly, may offer confirm/deny
// offer   → friendly suggestion ("I found teammates nearby — want info?")
// action  → recommendation ("Converge north. Block the exit.")
// alarm   → highest priority, siren + border + notification
// resolved → outcome ("Rescued.")
export const PRIORITY = {
  event:    { color: '#94a3b8', notify: false, sound: false },
  risk:     { color: '#f59e0b', notify: true,  sound: false },
  offer:    { color: '#38bdf8', notify: false, sound: false },
  action:   { color: '#f97316', notify: true,  sound: false },
  alarm:    { color: '#f43f5e', notify: true,  sound: true  },
  resolved: { color: '#10b981', notify: false, sound: false },
};

// ─── Register the on-screen renderer ───
export function registerMessageHandler(fn) {
  _handler = fn;
}

// ─── Ask for notification permission (call once, on user gesture) ───
export async function requestNotificationPermission() {
  if (typeof Notification === 'undefined') return 'unsupported';
  if (Notification.permission === 'granted') {
    _notificationPermission = 'granted';
    return 'granted';
  }
  if (Notification.permission === 'denied') {
    _notificationPermission = 'denied';
    return 'denied';
  }
  try {
    const result = await Notification.requestPermission();
    _notificationPermission = result;
    return result;
  } catch {
    return 'error';
  }
}

// ─── Fire a message ───
// msg = { text, title?, priority?, id?, actions?, durationMs? }
//   actions: [{ label, value }] — optional buttons like [Yes] [No]
export function showMessage(msg) {
  const priority = PRIORITY[msg.priority] ? msg.priority : 'event';

  // 1. On-screen
  if (_handler) {
    _handler({
      id: msg.id || `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      text: msg.text,
      title: msg.title || null,
      priority,
      color: PRIORITY[priority].color,
      actions: msg.actions || null,
      durationMs: msg.durationMs ?? (priority === 'alarm' ? 12000 : 8000),
      ts: Date.now(),
    });
  }

  // 2. Background notification (only for elevated priorities)
  if (PRIORITY[priority].notify && _notificationPermission === 'granted') {
    try {
      const n = new Notification(msg.title || 'The Raptor\'s Call', {
        body: msg.text,
        tag: msg.id || priority,            // collapses duplicates
        silent: !PRIORITY[priority].sound,  // browser handles sound
        requireInteraction: priority === 'alarm',
        icon: '/android-chrome-192x192.png',
      });
      // Auto-close non-alarm notifications after 8s
      if (priority !== 'alarm') {
        setTimeout(() => { try { n.close(); } catch {} }, 8000);
      }
    } catch (e) {
      console.warn('[messageCenter] notification failed:', e);
    }
  }

  console.log(`[MSG:${priority}]`, msg.title || '', msg.text);
}

// ─── Convenience wrappers ───
export const msg = {
  event:    (text, opts = {}) => showMessage({ ...opts, text, priority: 'event' }),
  risk:     (text, opts = {}) => showMessage({ ...opts, text, priority: 'risk' }),
  offer:    (text, opts = {}) => showMessage({ ...opts, text, priority: 'offer' }),
  action:   (text, opts = {}) => showMessage({ ...opts, text, priority: 'action' }),
  alarm:    (text, opts = {}) => showMessage({ ...opts, text, priority: 'alarm' }),
  resolved: (text, opts = {}) => showMessage({ ...opts, text, priority: 'resolved' }),
};