import { useState, useRef } from 'react';
import { saveProfile } from '../lib/entityProfiles.js';
import { ThemeSwitcher } from './ThemeSwitcher.jsx';
import { Upload, Save, MapPin } from 'lucide-react';

const MAX_IMAGE_KB = 200; // 200 KB limit for avatars

export function SettingsPage({ userGuid, meshNodeId, currentProfile, onSaved, onBack }) {
  const [nickname, setNickname] = useState(currentProfile?.nickname || '');
  const [fullName, setFullName] = useState(currentProfile?.full_name || '');
  const [role, setRole] = useState(currentProfile?.role || 'protector');
  const [pictureBlob, setPictureBlob] = useState(currentProfile?.picture_blob || null);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const fileRef = useRef(null);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_IMAGE_KB * 1024) {
      setError(`Image must be under ${MAX_IMAGE_KB} KB. Yours is ${Math.round(file.size / 1024)} KB.`);
      return;
    }
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file (JPG or PNG).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setPictureBlob(reader.result); // base64 data URL
      setError('');
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (!meshNodeId) {
      setError('No mesh node ID available yet. Try again once you have a dongle.');
      return;
    }
    const ok = saveProfile({
      user_guid: userGuid,
      mesh_node_id: meshNodeId,
      nickname,
      full_name: fullName,
      role,
      picture_blob: pictureBlob,
    });
    if (ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      onSaved?.({ nickname, full_name: fullName, role, picture_blob: pictureBlob });
    } else {
      setError('Save failed. Check the console.');
    }
  };

  return (
    <div className="mx-auto w-full max-w-md space-y-6 p-4" style={{ color: 'var(--text-primary)' }}>
      <button onClick={onBack} className="text-sm" style={{ color: 'var(--accent)' }}>
        ← Back to map
      </button>

      <h1 className="text-xl font-bold">Profile & Settings</h1>

      {/* ─── PICTURE ─── */}
      <div className="flex items-center gap-4">
        <div
          className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-2"
          style={{ borderColor: 'var(--accent)', background: 'var(--marker-bg)' }}
        >
          {pictureBlob ? (
            <img src={pictureBlob} alt="Avatar" className="h-full w-full object-cover" />
          ) : (
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>No photo</span>
          )}
        </div>
        <div>
          <button
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs"
            style={{ borderColor: 'var(--panel-border)', color: 'var(--accent)' }}
          >
            <Upload className="h-3.5 w-3.5" /> Upload photo
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handleFile}
            className="hidden"
          />
          <p className="mt-1 text-[10px]" style={{ color: 'var(--text-muted)' }}>
            Max {MAX_IMAGE_KB} KB. Shown to your vetted team only.
          </p>
        </div>
      </div>

      {/* ─── TEXT FIELDS ─── */}
      <label className="block">
        <span className="mb-1 block text-xs font-semibold">Nickname (broadcast to team)</span>
        <input
          type="text"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          maxLength={20}
          placeholder="Marcus"
          className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
          style={{ background: 'var(--marker-bg)', color: 'var(--text-primary)', borderColor: 'var(--panel-border)' }}
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-xs font-semibold">Full name (private)</span>
        <input
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          maxLength={60}
          placeholder="Marcus Williams"
          className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
          style={{ background: 'var(--marker-bg)', color: 'var(--text-primary)', borderColor: 'var(--panel-border)' }}
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-xs font-semibold">Role</span>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
          style={{ background: 'var(--marker-bg)', color: 'var(--text-primary)', borderColor: 'var(--panel-border)' }}
        >
          <option value="protector">Protector</option>
          <option value="overwatch">Overwatch</option>
          <option value="camera">Camera crew</option>
          <option value="logistics">Logistics</option>
          <option value="dependent">Dependent</option>
        </select>
      </label>

      {error && (
        <div className="rounded-lg border px-3 py-2 text-xs" style={{ background: '#ffe0dd', borderColor: '#e94b3c', color: '#c81e3f' }}>
          {error}
        </div>
      )}

      <button
        onClick={handleSave}
        className="flex w-full items-center justify-center gap-2 rounded-lg py-3 text-sm font-bold"
        style={{ background: 'var(--accent)', color: '#0c1a28' }}
      >
        <Save className="h-4 w-4" />
        {saved ? 'Saved ✓' : 'Save profile'}
      </button>

      {/* ─── THEME SWITCHER ─── */}
      <div className="border-t pt-4" style={{ borderColor: 'var(--panel-border)' }}>
        <ThemeSwitcher />
      </div>
    </div>
  );
}