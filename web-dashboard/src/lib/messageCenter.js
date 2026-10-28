import { raptorVoice } from './RaptorsVoice.js';

let _handler = null;
let _notificationPermission = 'default';
const messageQueue = [];
let isProcessing = false;

export const PRIORITY = {
  event:    { color: '#94a3b8', notify: false, sound: false },
  risk:     { color: '#f59e0b', notify: true,  sound: false },
  offer:    { color: '#38bdf8', notify: false, sound: false },
  action:   { color: '#f97316', notify: true,  sound: false },
  alarm:    { color: '#f43f5e', notify: true,  sound: true  },
  resolved: { color: '#10b981', notify: false, sound: false },
};

export function registerMessageHandler(fn) {
  _handler = fn;
}

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

// This is the core function that handles the queue
export function showMessage(msg) {
  const priority = PRIORITY[msg.priority] ? msg.priority : 'event';

  // 1. Push to the queue
  messageQueue.push({
    ...msg,
    priority,
    id: msg.id || `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
  });

  // 2. Start processing if not already running
  if (!isProcessing) {
    processQueue();
  }
}

async function processQueue() {
  if (messageQueue.length === 0) {
    isProcessing = false;
    return;
  }

  isProcessing = true;
  const currentMsg = messageQueue[0]; // Peek at the first item

  // ─── 1. Update the UI Screen ───
  if (_handler) {
    _handler({
      id: currentMsg.id,
      text: currentMsg.text,
      title: currentMsg.title || null,
      priority: currentMsg.priority,
      color: PRIORITY[currentMsg.priority].color,
      actions: currentMsg.actions || null,
      durationMs: currentMsg.durationMs ?? (currentMsg.priority === 'alarm' ? 12000 : 8000),
      ts: Date.now(),
    });
  }

  // ─── 2. Background Notifications (Optional, based on priority) ───
  if (PRIORITY[currentMsg.priority].notify && _notificationPermission === 'granted') {
    try {
      const n = new Notification(currentMsg.title || 'The Raptor\'s Call', {
        body: currentMsg.text,
        tag: currentMsg.id || currentMsg.priority,
        silent: !PRIORITY[currentMsg.priority].sound,
        requireInteraction: currentMsg.priority === 'alarm',
        icon: '/android-chrome-192x192.png',
      });
      if (currentMsg.priority !== 'alarm') {
        setTimeout(() => { try { n.close(); } catch {} }, 8000);
      }
    } catch (e) {
      console.warn('[messageCenter] notification failed:', e);
    }
  }

  // ─── 3. Speak the Text and WAIT for it to finish ───
  const textToSpeak = currentMsg.title ? `${currentMsg.title}. ${currentMsg.text}` : currentMsg.text;
  await raptorVoice.speakAndWait(textToSpeak);

  // ─── 4. Remove from queue and move to the next one ───
  console.log(`[MSG:${currentMsg.priority}]`, currentMsg.title || '', currentMsg.text);
  messageQueue.shift();
  processQueue();
}

// ─── Convenience wrappers (This fixes the missing export!) ───
export const msg = {
  event:    (text, opts = {}) => showMessage({ ...opts, text, priority: 'event' }),
  risk:     (text, opts = {}) => showMessage({ ...opts, text, priority: 'risk' }),
  offer:    (text, opts = {}) => showMessage({ ...opts, text, priority: 'offer' }),
  action:   (text, opts = {}) => showMessage({ ...opts, text, priority: 'action' }),
  alarm:    (text, opts = {}) => showMessage({ ...opts, text, priority: 'alarm' }),
  resolved: (text, opts = {}) => showMessage({ ...opts, text, priority: 'resolved' }),
};