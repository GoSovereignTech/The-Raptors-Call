import { useState, useRef } from 'react';
import { saveProfile } from '../lib/entityProfiles.js';
import { ThemeSwitcher } from './ThemeSwitcher.jsx';
import { 
  Upload, Save, MapPin, Shield, Eye, EyeOff, 
  User, Lock, AlertTriangle, Users, CheckCircle2 
} from 'lucide-react';

const MAX_IMAGE_KB = 200;

export function SettingsPage({ userGuid, meshNodeId, currentProfile, onSaved, onBack }) {
  const [nickname, setNickname] = useState(currentProfile?.nickname || '');
  const [role, setRole] = useState(currentProfile?.role || 'protector');
  const [pictureBlob, setPictureBlob] = useState(currentProfile?.picture_blob || null);
  
  // New Privacy & Safety State
  const [visibility, setVisibility] = useState(currentProfile?.visibility || 'always'); // 'always', 'home_hidden', 'ghost'
  const [homeRadius, setHomeRadius] = useState(currentProfile?.home_radius || 50);
  const [isMinor, setIsMinor] = useState(currentProfile?.is_minor || false);
  const [allowOnBehalf, setAllowOnBehalf] = useState(currentProfile?.allow_on_behalf || true);

  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const fileRef = useRef(null);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_IMAGE_KB * 1024) {
      setError(`Image must be under ${MAX_IMAGE_KB} KB.`);
      return;
    }
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file (JPG or PNG).');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setPictureBlob(reader.result);
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
      role,
      picture_blob: pictureBlob,
      visibility: isMinor ? 'ghost' : visibility, // Minors are forced to ghost mode
      home_radius: homeRadius,
      is_minor: isMinor,
      allow_on_behalf: allowOnBehalf,
    });
    if (ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      onSaved?.({ 
        nickname, role, picture_blob: pictureBlob,
        visibility: isMinor ? 'ghost' : visibility,
        home_radius: homeRadius, is_minor: isMinor, allow_on_behalf: allowOnBehalf
      });
    } else {
      setError('Save failed. Check the console.');
    }
  };

  return (
    <div className="mx-auto w-full max-w-md space-y-6 p-4 pb-20" style={{ color: 'var(--text-primary)', backgroundColor: 'var(--panel-bg)'   }}>
      <button onClick={onBack} className="text-sm flex items-center gap-1" style={{ color: 'var(--accent)' }}>
        ← Back to map
      </button>

      <h1 className="text-xl font-bold flex items-center gap-2">
        <User className="h-5 w-5" /> Profile & Settings
      </h1>

      {/* ─── IDENTITY CARD ─── */}
      <div className="rounded-xl border p-4 space-y-4" style={{ borderColor: 'var(--panel-border)', background: 'var(--marker-bg)' }}>
        <div className="flex items-center gap-4">
          <div
            className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border-2"
            style={{ borderColor: 'var(--accent)', background: 'var(--panel-bg)' }} 
          >
            {pictureBlob ? (
              <img src={pictureBlob} alt="Avatar" className="h-full w-full object-cover" />
            ) : (
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>No photo</span>
            )}
          </div>
          <div className="flex-1">
            <button
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors"
              style={{ borderColor: 'var(--panel-border)', color: 'var(--panel-bg)' }}
            >
              <Upload className="h-3.5 w-3.5" /> Upload photo
            </button>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
            <p className="mt-1 text-[10px]" style={{ color: 'var(--panel-bg)'}}>
              Max {MAX_IMAGE_KB} KB. Shown to your vetted team only.
            </p>
          </div>
        </div>

        <label className="block">
          <span className="mb-1 block text-xs font-semibold" style={{ color: 'var(--panel-bg)'}}>Nickname (broadcast to team)</span>
          <input
            type="text" value={nickname} onChange={(e) => setNickname(e.target.value)} maxLength={20}
            placeholder="Your Nickname"
            className="w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors focus:border-[var(--accent)]"
            style={{ background: 'var(--panel-bg)', color: 'var(--text-primary)', borderColor: 'var(--panel-border)' }}
          />
        </label>
 

        <label className="block">
          <span className="mb-1 block text-xs font-semibold"  style={{ color: 'var(--panel-bg)'}}>Role</span>
          <select
            value={role} onChange={(e) => setRole(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors focus:border-[var(--accent)]"
            style={{ background: 'var(--panel-bg)', color: 'var(--text-primary)', borderColor: 'var(--panel-border)' }}
          >
            <option value="protector">Protector</option>
            <option value="overwatch">Overwatch</option>
            <option value="camera">Camera crew</option>
            <option value="logistics">Logistics</option>
            <option value="dependent">Dependent</option>
          </select>
        </label>
      </div>

      {/* ─── PRIVACY & VISIBILITY CARD ─── */}
      <div className="rounded-xl border p-4 space-y-4" style={{ borderColor: 'var(--panel-border)', background: 'var(--marker-bg)' }}>
        <div className="flex items-center gap-2 border-b pb-2" style={{ borderColor: 'var(--panel-border)' }}>
          <Shield className="h-4 w-4" style={{ color: 'var(--accent)' }} />
          <h2 className="text-sm font-bold"  style={{ color: 'var(--panel-bg)'}}>Privacy & Visibility</h2>
        </div>

        <div className="space-y-3">
          <p className="text-xs"  style={{ color: 'var(--panel-bg)'}}>
            Choose how your icon appears to your vetted team. Threat detection and alarms always run in the background.
          </p>

          {/* Visibility Options */}
          <div className="space-y-2">
            <label className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${visibility === 'always' && !isMinor ? 'border-[var(--accent)] bg-[var(--accent)]/5' : ''}`}
              style={{ borderColor: visibility === 'always' && !isMinor ? 'var(--accent)' : 'var(--panel-border)' }}>
              <input type="radio" name="visibility" value="always" checked={visibility === 'always' && !isMinor} 
                onChange={() => setVisibility('always')} className="mt-1" />
              <div>
                <div className="text-sm font-semibold flex items-center gap-1.5"><Eye className="h-3.5 w-3.5" /> Always Visible</div>
                <div className="text-[11px]"  style={{ color: 'var(--panel-bg)'}}>Team sees your exact location at all times. Best for active defenders.</div>
              </div>
            </label>

            <label className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${visibility === 'home_hidden' && !isMinor ? 'border-[var(--accent)] bg-[var(--accent)]/5' : ''}`}
              style={{ borderColor: visibility === 'home_hidden' && !isMinor ? 'var(--accent)' : 'var(--panel-border)' }}>
              <input type="radio" name="visibility" value="home_hidden" checked={visibility === 'home_hidden' && !isMinor} 
                onChange={() => setVisibility('home_hidden')} className="mt-1" />
              <div>
                <div className="text-sm font-semibold flex items-center gap-1.5"  style={{ color: 'var(--panel-bg)'}}><EyeOff className="h-3.5 w-3.5" /> Hide my Icon at My Home</div>
                <div className="text-[11px]"  style={{ color: 'var(--panel-bg)'}}>Icon disappears within your chosen radius of home. Reappears on alarm.</div>
              </div>
            </label>

            {/* Home Radius Slider (Conditional) */}
            {visibility === 'home_hidden' && !isMinor && (
              <div className="ml-7 mt-2 space-y-2">
                <div className="flex justify-between text-xs">
                  <span  style={{ color: 'var(--panel-bg)'}}>Home Radius</span>
                  <span className="font-mono font-bold" style={{ color: 'var(--accent)' }}>{homeRadius}m</span>
                </div>
                <input type="range" min="50" max="200" step="50" value={homeRadius} 
                  onChange={(e) => setHomeRadius(Number(e.target.value))}
                  className="w-full accent-[var(--accent)]" />
                <div className="flex justify-between text-[10px]"  style={{ color: 'var(--panel-bg)'}}>
                  <span>50m</span><span>100m</span><span>150m</span><span>200m</span>
                </div>
              </div>
            )}

            <label className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${visibility === 'ghost' || isMinor ? 'border-[var(--accent)] bg-[var(--accent)]/5' : ''}`}
              style={{ borderColor: visibility === 'ghost' || isMinor ? 'var(--accent)' : 'var(--panel-border)' }}>
              <input type="radio" name="visibility" value="ghost" checked={visibility === 'ghost' || isMinor} 
                onChange={() => setVisibility('ghost')} disabled={isMinor} className="mt-1" />
              <div>
                <div className="text-sm font-semibold flex items-center gap-1.5"  style={{ color: 'var(--panel-bg)'}}><Lock className="h-3.5 w-3.5" /> Ghost Mode</div>
                <div className="text-[11px]"  style={{ color: 'var(--panel-bg)'}}>Always hidden. Alarm and threat detection still work. Best for high-risk individuals.</div>
              </div>
            </label>
          </div>
        </div>

        {/* Minor Toggle */}
        <div className="border-t pt-3" style={{ borderColor: 'var(--panel-border)' }}>
          <label className="flex items-center justify-between">
            <div className="flex items-center gap-2"  style={{ color: 'var(--panel-bg)'}}>
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <div>
                <div className="text-sm font-semibold">Minor Account (Under 18)</div>
                <div className="text-[11px]"  style={{ color: 'var(--panel-bg)'}}>Forces Ghost Mode. Alarm only.</div>
              </div>
            </div>
            <input type="checkbox" checked={isMinor} onChange={(e) => {
              setIsMinor(e.target.checked);
              if (e.target.checked) setVisibility('ghost');
            }} className="h-4 w-4 accent-[var(--accent)]" />
          </label>
        </div>
      </div>

      {/* ─── SAFETY PREFERENCES CARD ─── */}
      <div className="rounded-xl border p-4 space-y-4" style={{ borderColor: 'var(--panel-border)', background: 'var(--marker-bg)' }}>
        <div className="flex items-center gap-2 border-b pb-2" style={{ borderColor: 'var(--panel-border)' }}>
          <Users className="h-4 w-4"  style={{ color: 'var(--panel-bg)'}}/>
          <h2 className="text-sm font-bold"  style={{ color: 'var(--panel-bg)'}}>Team Safety</h2>
        </div>

        <label className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" style={{ color: 'var(--accent)' }} />
            <div>
              <div className="text-sm font-semibold"  style={{ color: 'var(--panel-bg)'}}>Allow "On Behalf Of" Alarms</div>
              <div className="text-[11px]"  style={{ color: 'var(--panel-bg)'}}>Teammates can trigger an alarm for you if they see you in danger.</div>
            </div>
          </div>
          <input type="checkbox" checked={allowOnBehalf} onChange={(e) => setAllowOnBehalf(e.target.checked)} 
            className="h-4 w-4 accent-[var(--accent)]" />
        </label>
      </div>

      {error && (
        <div className="rounded-lg border px-3 py-2 text-xs" style={{ background: '#ffe0dd', borderColor: '#e94b3c', color: '#c81e3f' }}>
          {error}
        </div>
      )}

      <button
        onClick={handleSave}
        className="flex w-full items-center justify-center gap-2 rounded-lg py-3 text-sm font-bold transition-transform active:scale-[0.98]"
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