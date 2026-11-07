// src/pages/app/Tts.jsx
import React, { useState, useEffect, useRef } from 'react';
import { openDB } from 'idb';

const DB_NAME = 'audio-stories-db';
const STORE_NAME = 'stories';

// ---------- IndexedDB helpers ----------
async function getDB() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    },
  });
}
async function getAllStories() {
  const db = await getDB();
  return db.getAll(STORE_NAME);
}
async function saveStory(story) {
  const db = await getDB();
  await db.put(STORE_NAME, story);
}
async function deleteStory(id) {
  const db = await getDB();
  await db.delete(STORE_NAME, id);
}

// ---------- Utility ----------
function estimateReadingTime(text) {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.ceil(words / 150); // 150 wpm
  return minutes < 1 ? '< 1 min' : `${minutes} min`;
}
function formatDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

// ---------- Constants ----------
const COMMANDS = [
  { label: 'Pause (comma)', value: ', ' },
  { label: 'Long pause (ellipsis)', value: '… ' },
  { label: 'Emphatic stop', value: '. ' },
  { label: 'Question rising', value: '? ' },
  { label: 'Exclamation energy', value: '! ' },
  { label: 'Quoted dialogue', value: '“”' },
  { label: 'Dash (dramatic break)', value: '— ' },
];

const VOICES = [
  { id: 'en-US-AndrewNeural', label: 'Andrew (US Male, confident)' },
  { id: 'en-US-AriaNeural', label: 'Aria (US Female, natural)' },
  { id: 'en-US-GuyNeural', label: 'Guy (US Male, news)' },
  { id: 'en-US-JennyNeural', label: 'Jenny (US Female, friendly)' },
  { id: 'en-GB-SoniaNeural', label: 'Sonia (UK Female)' },
];

export default function Tts() {
  const [stories, setStories] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [isEditing, setIsEditing] = useState(false); // NEW: Fixes the "New Story" button
  const [editingText, setEditingText] = useState('');
  const [editingTitle, setEditingTitle] = useState('');
  const [voice, setVoice] = useState('en-US-AndrewNeural');
  const [rate, setRate] = useState('0%');
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [showCommands, setShowCommands] = useState(false);
  
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const audioRef = useRef(null);

  // Load stories on mount
  useEffect(() => {
    getAllStories().then((s) => {
      setStories(s.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)));
    });
  }, []);

  // Load selected story into editor
  useEffect(() => {
    if (selectedId) {
      const story = stories.find((s) => s.id === selectedId);
      if (story) {
        setEditingText(story.text);
        setEditingTitle(story.title);
        setVoice(story.voice || 'en-US-AndrewNeural');
        setRate(story.rate || '0%');
        setIsEditing(true);
      }
    }
  }, [selectedId, stories]);

  const handleNewStory = () => {
    setSelectedId(null);
    setEditingText('');
    setEditingTitle('');
    setAudioUrl(null);
    setIsEditing(true); // Show the editor
  };

  const handleSave = async () => {
    if (!editingText.trim()) return;
    const now = new Date().toISOString();
    
    let story;
    if (selectedId) {
      const existing = stories.find((s) => s.id === selectedId);
      story = { ...existing, title: editingTitle || 'Untitled', text: editingText, updatedAt: now, voice, rate };
    } else {
      story = {
        id: crypto.randomUUID(),
        title: editingTitle || 'Untitled',
        text: editingText,
        createdAt: now,
        updatedAt: now,
        thumbnail: null,
        voice,
        rate,
      };
    }

    await saveStory(story);
    const updated = await getAllStories();
    setStories(updated.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)));
    setSelectedId(story.id);
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!confirm('Delete this story?')) return;
    await deleteStory(id);
    setStories(stories.filter((s) => s.id !== id));
    if (selectedId === id) {
      setIsEditing(false);
      setSelectedId(null);
    }
  };

  const insertCommand = (value) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    setEditingText(editingText.slice(0, start) + value + editingText.slice(end));
    setTimeout(() => {
      ta.selectionStart = ta.selectionEnd = start + value.length;
      ta.focus();
    }, 0);
  };

  const synthesize = async () => {
    if (!editingText.trim()) return;
    setIsPlaying(true);
    setAudioUrl(null);
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: editingText, voice, rate, pitch: '0Hz' }),
      });
      if (!res.ok) throw new Error(await res.text());
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.play();
      }
    } catch (err) {
      alert('Synthesis failed: ' + err.message);
    } finally {
      setIsPlaying(false);
    }
  };

  const downloadAudio = () => {
    if (!audioUrl) return;
    const a = document.createElement('a');
    a.href = audioUrl;
    a.download = `${editingTitle || 'audio'}.mp3`;
    a.click();
  };

  // Tailwind helper classes bound to your themes.css variables
  const panelClass = "bg-[var(--panel-bg)] border border-[var(--panel-border)] text-[var(--text-primary)] rounded-lg";
  const inputClass = "w-full bg-[var(--panel-bg-deep)] border border-[var(--panel-border)] text-[var(--text-primary)] rounded p-2 focus:outline-none focus:border-[var(--accent)]";
  const btnClass = "px-4 py-2 rounded font-semibold transition-colors cursor-pointer";
  const btnPrimary = `${btnClass} bg-[var(--accent)] text-[var(--panel-bg-deep)] hover:bg-[var(--accent-glow)]`;

  return (
    <div className="max-w-4xl mx-auto p-4 min-h-screen bg-[var(--panel-bg-deep)] text-[var(--text-primary)]">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        🎙️ Audio Story Studio
      </h1>

      {/* Story List */}
      {!isEditing && (
        <div className="space-y-4">
          <button onClick={handleNewStory} className={btnPrimary}>
            + New Story
          </button>

          {stories.length === 0 && <p className="text-[var(--text-muted)] mt-4">No stories yet. Create one above.</p>}

          {stories.map((story) => (
            <div
              key={story.id}
              onClick={() => setSelectedId(story.id)}
              className={`flex items-center gap-4 p-4 cursor-pointer ${panelClass} hover:border-[var(--accent)] transition-colors`}
            >
              <div className="w-14 h-14 bg-[var(--panel-bg-deep)] rounded flex items-center justify-center text-2xl border border-[var(--panel-border)] overflow-hidden shrink-0">
                {story.thumbnail ? <img src={story.thumbnail} alt="" className="w-full h-full object-cover" /> : '🖼️'}
              </div>

              <div className="flex-1 min-w-0">
                <div className="font-semibold text-lg">{story.title}</div>
                <div className="text-sm text-[var(--text-muted)] truncate">{story.text}</div>
                <div className="text-xs text-[var(--accent)] mt-1">
                  {formatDate(story.updatedAt)} · {estimateReadingTime(story.text)}
                </div>
              </div>

              <div className="flex gap-2">
                <button onClick={(e) => handleDelete(story.id, e)} className="p-2 hover:text-[var(--threat-enemy)]">🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Editor */}
      {isEditing && (
        <div className={`p-6 ${panelClass}`}>
          <div className="flex justify-between items-center mb-4">
            <input
              value={editingTitle}
              onChange={(e) => setEditingTitle(e.target.value)}
              placeholder="Story title..."
              className={`${inputClass} text-xl font-bold`}
            />
            <button onClick={() => setIsEditing(false)} className="text-[var(--text-muted)] hover:text-white ml-4">
              ✖ Close
            </button>
          </div>

          <div className="flex gap-4 mb-4">
            <select value={voice} onChange={(e) => setVoice(e.target.value)} className={inputClass}>
              {VOICES.map((v) => <option key={v.id} value={v.id}>{v.label}</option>)}
            </select>
            <div className="flex items-center gap-2">
              <span className="text-sm text-[var(--text-muted)]">Rate:</span>
              <input type="range" min="-50" max="50" value={parseInt(rate)} onChange={(e) => setRate(`${e.target.value}%`)} className="accent-[var(--accent)]" />
              <span className="text-sm w-10">{rate}</span>
            </div>
          </div>

          <textarea
            ref={textareaRef}
            value={editingText}
            onChange={(e) => setEditingText(e.target.value)}
            placeholder="Write your script here..."
            rows={12}
            className={`${inputClass} font-mono text-sm leading-relaxed mb-4`}
          />

          <div className="mb-4">
            <button onClick={() => setShowCommands(!showCommands)} className="text-sm text-[var(--accent)] mb-2 hover:underline">
              {showCommands ? '▲ Hide' : '▼ Show'} pause & punctuation panel
            </button>
            {showCommands && (
              <div className="flex flex-wrap gap-2 p-3 bg-[var(--panel-bg-deep)] rounded border border-[var(--panel-border)]">
                {COMMANDS.map((cmd) => (
                  <button key={cmd.label} onClick={() => insertCommand(cmd.value)} className="px-3 py-1 bg-[var(--chip-bg)] border border-[var(--chip-border)] text-[var(--chip-text)] rounded text-sm hover:border-[var(--accent)]">
                    {cmd.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-4 pt-4 border-t border-[var(--panel-border)]">
            <button onClick={handleSave} className={btnPrimary}>💾 Save</button>
            <button onClick={synthesize} disabled={isPlaying} className={`${btnClass} border border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent-soft)]`}>
              {isPlaying ? '⏳ Synthesizing...' : '▶️ Play Audio'}
            </button>
            {audioUrl && (
              <button onClick={downloadAudio} className={`${btnClass} bg-[var(--threat-friend)] text-[var(--panel-bg-deep)]`}>
                ⬇️ Download MP3
              </button>
            )}
          </div>
          <audio ref={audioRef} className="hidden" />
        </div>
      )}
    </div>
  );
}