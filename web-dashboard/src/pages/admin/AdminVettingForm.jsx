import React from 'react'
import { useState, useEffect } from 'react';
import {
  UserPlus, Users, LayoutDashboard, CheckCircle2,
  XCircle, ChevronRight, Search, AlertTriangle, ArrowLeft,
  Save, MapPin, Phone, Compass, Loader2, Plus, Home, Radio
} from 'lucide-react';
import { storage } from '../../lib/storage.js';
import RaptorMark from '../../components/RaptorMark.jsx';
import EmergencyDashboard from '../../components/EmergencyDashboard.jsx';

const STORAGE_KEY = 'vetting-candidates';

function emptyCandidate() {
  return {
    id: (crypto.randomUUID ? crypto.randomUUID() : String(Date.now())),
    submittedAt: new Date().toISOString(),
    status: 'pending_review',
    fullName: '', address: '', timeInArea: '', phone: '',
    emergencyContactName: '', emergencyContactPhone: '',
    collaterals: [0, 1, 2].map(() => ({ name: '', relationship: '', phone: '', q1: '', q2: '', q3: '', q4: '' })),
    behavioral: { q1: '', q2: '', q3: '', q4: '' },
    schoolOrEmployer: '', fieldOfStudy: '', regularRoutes: '', hobbies: '', goals: '', upcomingTravel: '',
    aloneWalking: false, aloneDriving: false, aloneStudying: false, aloneTraveling: false, exposureNotes: '',
    consentAcknowledged: false,
    backgroundCheckStatus: 'not_started', backgroundCheckNotes: '',
    reviewerName: '', reviewOutcome: '', reasonCategory: '', reviewerNotes: '', reviewedAt: '',
    incidents: [],
  };
}

const STATUS_META = {
  pending_review: { label: 'Pending review', color: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
  tier1: { label: 'Tier 1 · Probation', color: 'bg-sky-500/15 text-sky-400 border-sky-500/30' },
  tier2: { label: 'Tier 2 · Cleared', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
  not_cleared: { label: 'Not cleared', color: 'bg-rose-500/15 text-rose-400 border-rose-500/30' },
};

function Badge({ status }) {
  const meta = STATUS_META[status] || STATUS_META.pending_review;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${meta.color}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {meta.label}
    </span>
  );
}

function Field({ label, children, hint }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-300">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
    </label>
  );
}

const inputCls = "w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-raptor-cyan focus:ring-1 focus:ring-raptor-cyan";

function TextInput(props) { return <input {...props} className={inputCls} />; }
function TextArea(props) { return <textarea {...props} rows={props.rows || 3} className={inputCls} />; }
function Select({ children, ...props }) { return <select {...props} className={inputCls}>{children}</select>; }

function SectionCard({ eyebrow, title, description, children }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
      <div className="mb-4">
        <span className="font-mono text-xs uppercase tracking-widest text-raptor-cyan">{eyebrow}</span>
        <h3 className="mt-1 text-base font-semibold text-slate-100">{title}</h3>
        {description && <p className="mt-1 text-sm text-slate-400">{description}</p>}
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Stepper({ status }) {
  const steps = [
    { key: 'intake', label: 'Intake' },
    { key: 'pending_review', label: 'Review' },
    { key: 'tier1', label: 'Tier 1' },
    { key: 'tier2', label: 'Tier 2' },
  ];
  const order = ['intake', 'pending_review', 'tier1', 'tier2'];
  const activeIdx = status === 'not_cleared' ? 1 : order.indexOf(status === 'pending_review' ? 'pending_review' : status);
  return (
    <div className="flex items-center">
      {steps.map((s, i) => {
        const reached = status === 'not_cleared' ? i <= 1 : i <= activeIdx;
        return (
          <div key={s.key} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center">
              <div className={`flex h-7 w-7 items-center justify-center rounded-full border text-xs font-mono ${reached ? 'border-raptor-cyan bg-raptor-cyan/15 text-raptor-cyan' : 'border-slate-700 text-slate-600'}`}>
                {i + 1}
              </div>
              <span className={`mt-1 text-[11px] ${reached ? 'text-slate-300' : 'text-slate-600'}`}>{s.label}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={`mx-2 h-px flex-1 ${i < activeIdx ? 'bg-raptor-cyan/50' : 'bg-slate-800'}`} />
            )}
          </div>
        );
      })}
      {status === 'not_cleared' && (
        <span className="ml-3 flex items-center gap-1 text-xs font-medium text-rose-400"><XCircle className="h-3.5 w-3.5" /> Not cleared</span>
      )}
    </div>
  );
}

function NavBar({ view, setView }) {
  const items = [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { key: 'intake', label: 'New intake', icon: UserPlus },
    { key: 'emergency', label: 'Emergency', icon: Radio },
  ];
  return (
    <div className="mb-6 flex items-center justify-between border-b border-slate-800 pb-4">
      <div className="flex items-center gap-2.5">
        <RaptorMark className="h-6 w-6" />
        <div>
          <div className="text-sm font-semibold text-slate-100">Member Intake &amp; Vetting</div>
          <div className="text-xs text-slate-500">Internal admin tool · not for candidate access</div>
        </div>
      </div>
      <div className="flex gap-1">
        {items.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setView(key)}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors ${view === key ? 'bg-raptor-cyan/15 text-raptor-cyan' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
          >
            <Icon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const [view, setView] = useState('dashboard');
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saveError, setSaveError] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [form, setForm] = useState(emptyCandidate());
  const [toast, setToast] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await storage.get(STORAGE_KEY);
        setCandidates(res ? JSON.parse(res.value) : []);
      } catch (e) {
        setCandidates([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function persist(next) {
    setCandidates(next);
    try {
      const res = await storage.set(STORAGE_KEY, JSON.stringify(next));
      if (!res) setSaveError('Save did not confirm — changes may not have synced.');
      else setSaveError('');
    } catch (e) {
      setSaveError('Could not save changes. They will be lost on refresh.');
    }
  }

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }

  function submitIntake() {
    if (!form.consentAcknowledged) return;
    const next = [...candidates, { ...form, submittedAt: new Date().toISOString() }];
    persist(next);
    setForm(emptyCandidate());
    setView('dashboard');
    showToast('Intake submitted — awaiting review.');
  }

  function updateCandidate(id, patch) {
    const next = candidates.map((c) => (c.id === id ? { ...c, ...patch } : c));
    persist(next);
  }

  function addIncident(id, note) {
    if (!note.trim()) return;
    const c = candidates.find((x) => x.id === id);
    const incidents = [...c.incidents, { date: new Date().toISOString(), note }];
    updateCandidate(id, { incidents });
  }

  const filtered = candidates.filter((c) => {
    const matchesSearch = c.fullName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const selected = candidates.find((c) => c.id === selectedId);

  const counts = candidates.reduce((acc, c) => {
    acc[c.status] = (acc[c.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-raptor-void px-4 py-6 text-slate-100 sm:px-8">
      <div className="mx-auto max-w-3xl">
        <NavBar view={view === 'review' || view === 'detail' ? '' : view} setView={(v) => { setView(v); setSelectedId(null); }} />

        {saveError && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-400">
            <AlertTriangle className="h-4 w-4 shrink-0" /> {saveError}
          </div>
        )}

        <div className="mb-4 rounded-lg border border-raptor-line bg-raptor-bg/40 px-3 py-2 text-xs text-slate-500">
          Records here are saved only in this browser, on this device — not shared with anyone else, and not backed up anywhere. Treat this as a UI prototype: it needs a real server, authentication, and access control before entering actual member data.
        </div>

        {toast && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-raptor-cyan/30 bg-raptor-cyan/10 px-3 py-2 text-sm text-raptor-cyan">
            <CheckCircle2 className="h-4 w-4" /> {toast}
          </div>
        )}

        {loading && (
          <div className="flex items-center gap-2 text-sm text-slate-400"><Loader2 className="h-4 w-4 animate-spin" /> Loading records…</div>
        )}

        {!loading && view === 'dashboard' && (
          <div>
            <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {['pending_review', 'tier1', 'tier2', 'not_cleared'].map((k) => (
                <button key={k} onClick={() => setStatusFilter(statusFilter === k ? 'all' : k)}
                  className={`rounded-lg border px-3 py-2 text-left transition-colors ${statusFilter === k ? 'border-raptor-cyan bg-raptor-cyan/10' : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'}`}>
                  <div className="text-lg font-semibold text-slate-100">{counts[k] || 0}</div>
                  <div className="text-xs text-slate-500">{STATUS_META[k].label}</div>
                </button>
              ))}
            </div>

            <div className="mb-4 flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name…"
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 py-2 pl-9 pr-3 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-raptor-cyan" />
              </div>
              <button onClick={() => { setForm(emptyCandidate()); setView('intake'); }}
                className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-raptor-cyan to-raptor-blue px-3 py-2 text-sm font-semibold text-raptor-void shadow-raptor-glow transition hover:brightness-110">
                <Plus className="h-4 w-4" /> New intake
              </button>
            </div>

            {filtered.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-800 py-14 text-center">
                <Users className="mx-auto mb-2 h-8 w-8 text-slate-700" />
                <p className="text-sm text-slate-400">No candidates yet. Start a new intake to add one.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filtered.slice().reverse().map((c) => (
                  <button key={c.id} onClick={() => { setSelectedId(c.id); setView(c.status === 'pending_review' ? 'review' : 'detail'); }}
                    className="flex w-full items-center justify-between rounded-lg border border-slate-800 bg-slate-900/40 px-4 py-3 text-left hover:border-slate-700">
                    <div>
                      <div className="text-sm font-medium text-slate-100">{c.fullName || 'Unnamed candidate'}</div>
                      <div className="text-xs text-slate-500">Submitted {new Date(c.submittedAt).toLocaleDateString()}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge status={c.status} />
                      <ChevronRight className="h-4 w-4 text-slate-600" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {!loading && view === 'intake' && (
          <div>
            <button onClick={() => setView('dashboard')} className="mb-4 flex items-center gap-1 text-sm text-slate-400 hover:text-slate-200">
              <ArrowLeft className="h-4 w-4" /> Back to dashboard
            </button>
            <h2 className="mb-4 text-lg font-semibold text-slate-100">New member intake</h2>

            <div className="space-y-4">
              <SectionCard eyebrow="01 · Identity & verification" title="Basic details" description="Collected in person or by video call.">
              {/* 
                ⚠️ PRIVACY WARNING: 
                This data is for admin vetting ONLY. 
                It is stored in your secure, offline admin database. 
                It is NEVER pushed to the mesh network or synced to user devices. 
              */}
              <Field label="Full legal name"><TextInput value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} /></Field>
              {/* ... rest of the fields ... */}
            </SectionCard>


              <SectionCard eyebrow="01 · Identity & verification" title="Basic details" description="Collected in person or by video call.">
                <Field label="Full legal name"><TextInput value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} /></Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Current address"><TextInput value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></Field>
                  <Field label="Time in area"><TextInput value={form.timeInArea} onChange={(e) => setForm({ ...form, timeInArea: e.target.value })} /></Field>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Phone"><TextInput value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
                  <Field label="Emergency contact"><TextInput value={form.emergencyContactName} onChange={(e) => setForm({ ...form, emergencyContactName: e.target.value })} /></Field>
                </div>
                <Field label="Emergency contact phone"><TextInput value={form.emergencyContactPhone} onChange={(e) => setForm({ ...form, emergencyContactPhone: e.target.value })} /></Field>
              </SectionCard>

              <SectionCard eyebrow="02 · Collateral contacts" title="2–3 independent references" description="Ask each separately. Don't let the candidate choose who's contacted first.">
                {form.collaterals.map((c, i) => (
                  <div key={i} className="rounded-lg border border-slate-800 p-3">
                    <div className="mb-2 text-xs font-mono uppercase tracking-wider text-slate-500">Contact {i + 1}</div>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <TextInput placeholder="Name" value={c.name} onChange={(e) => { const arr = [...form.collaterals]; arr[i].name = e.target.value; setForm({ ...form, collaterals: arr }); }} />
                      <TextInput placeholder="Relationship" value={c.relationship} onChange={(e) => { const arr = [...form.collaterals]; arr[i].relationship = e.target.value; setForm({ ...form, collaterals: arr }); }} />
                      <TextInput placeholder="Phone" value={c.phone} onChange={(e) => { const arr = [...form.collaterals]; arr[i].phone = e.target.value; setForm({ ...form, collaterals: arr }); }} />
                    </div>
                    <div className="mt-2 space-y-2">
                      <TextArea rows={2} placeholder="Describe a time you saw them handle conflict or anger." value={c.q1} onChange={(e) => { const arr = [...form.collaterals]; arr[i].q1 = e.target.value; setForm({ ...form, collaterals: arr }); }} />
                      <TextArea rows={2} placeholder="Would you feel comfortable if someone you cared about spent time alone with them?" value={c.q2} onChange={(e) => { const arr = [...form.collaterals]; arr[i].q2 = e.target.value; setForm({ ...form, collaterals: arr }); }} />
                      <TextArea rows={2} placeholder="Have you ever felt unsafe around them, or heard someone else say they did?" value={c.q3} onChange={(e) => { const arr = [...form.collaterals]; arr[i].q3 = e.target.value; setForm({ ...form, collaterals: arr }); }} />
                      <TextArea rows={2} placeholder="How do they react when told 'no' or when a boundary is set?" value={c.q4} onChange={(e) => { const arr = [...form.collaterals]; arr[i].q4 = e.target.value; setForm({ ...form, collaterals: arr }); }} />
                    </div>
                  </div>
                ))}
              </SectionCard>

              <SectionCard eyebrow="03 · Structured interview" title="Behavioral questions" description="Ask the candidate directly. Note specifics — the reviewer will check these against the collateral answers.">
                <TextArea placeholder="Describe a time you disagreed strongly with someone." value={form.behavioral.q1} onChange={(e) => setForm({ ...form, behavioral: { ...form.behavioral, q1: e.target.value } })} />
                <TextArea placeholder="Describe a time someone was angry with you." value={form.behavioral.q2} onChange={(e) => setForm({ ...form, behavioral: { ...form.behavioral, q2: e.target.value } })} />
                <TextArea placeholder="Describe a time you felt disrespected." value={form.behavioral.q3} onChange={(e) => setForm({ ...form, behavioral: { ...form.behavioral, q3: e.target.value } })} />
                <TextArea placeholder="Describe a time someone told you 'no' or set a boundary with you." value={form.behavioral.q4} onChange={(e) => setForm({ ...form, behavioral: { ...form.behavioral, q4: e.target.value } })} />
              </SectionCard>

              <SectionCard eyebrow="04 · Compatibility profile" title="For matching, not scoring" description="Used to pair members with similar routes, schools, or goals.">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="School / employer"><TextInput value={form.schoolOrEmployer} onChange={(e) => setForm({ ...form, schoolOrEmployer: e.target.value })} /></Field>
                  <Field label="Field of study / work"><TextInput value={form.fieldOfStudy} onChange={(e) => setForm({ ...form, fieldOfStudy: e.target.value })} /></Field>
                </div>
                <Field label="Regular routes & schedule"><TextArea value={form.regularRoutes} onChange={(e) => setForm({ ...form, regularRoutes: e.target.value })} /></Field>
                <Field label="Hobbies & interests"><TextInput value={form.hobbies} onChange={(e) => setForm({ ...form, hobbies: e.target.value })} /></Field>
                <Field label="Goals"><TextArea rows={2} value={form.goals} onChange={(e) => setForm({ ...form, goals: e.target.value })} /></Field>
                <Field label="Upcoming travel or contract work"><TextArea rows={2} value={form.upcomingTravel} onChange={(e) => setForm({ ...form, upcomingTravel: e.target.value })} /></Field>
              </SectionCard>

              <SectionCard eyebrow="05 · Safety planning" title="When are they typically alone?" description="Used to proactively suggest companions — not held against them.">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {[['aloneWalking', 'Walking'], ['aloneDriving', 'Driving'], ['aloneStudying', 'Studying'], ['aloneTraveling', 'Work travel']].map(([key, label]) => (
                    <label key={key} className="flex items-center gap-2 rounded-lg border border-slate-800 px-3 py-2 text-sm text-slate-300">
                      <input type="checkbox" checked={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.checked })} className="h-4 w-4 accent-raptor-cyan" />
                      {label}
                    </label>
                  ))}
                </div>
                <Field label="Specific times or places that feel most exposed"><TextArea rows={2} value={form.exposureNotes} onChange={(e) => setForm({ ...form, exposureNotes: e.target.value })} /></Field>
              </SectionCard>

              <SectionCard eyebrow="06 · Consent" title="Code of conduct & data use">
                <label className="flex items-start gap-2 text-sm text-slate-300">
                  <input type="checkbox" checked={form.consentAcknowledged} onChange={(e) => setForm({ ...form, consentAcknowledged: e.target.checked })} className="mt-0.5 h-4 w-4 accent-raptor-cyan" />
                  Candidate has read and acknowledged the code of conduct, the incident-reporting process, and the removal process.
                </label>
              </SectionCard>

              <button onClick={submitIntake} disabled={!form.fullName.trim() || !form.consentAcknowledged}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-raptor-cyan to-raptor-blue px-4 py-2.5 text-sm font-semibold text-raptor-void shadow-raptor-glow transition hover:brightness-110 disabled:cursor-not-allowed disabled:bg-none disabled:bg-slate-800 disabled:text-slate-500 disabled:shadow-none">
                <Save className="h-4 w-4" /> Submit intake for review
              </button>
            </div>
          </div>
        )}

        {!loading && view === 'review' && selected && (
          <ReviewPanel candidate={selected} onBack={() => { setView('dashboard'); setSelectedId(null); }} onSave={(patch) => { updateCandidate(selected.id, patch); setView('dashboard'); setSelectedId(null); showToast('Review saved.'); }} />
        )}

        {!loading && view === 'detail' && selected && (
          <DetailPanel candidate={selected} onBack={() => { setView('dashboard'); setSelectedId(null); }} onPromote={() => { updateCandidate(selected.id, { status: 'tier2' }); showToast('Promoted to Tier 2.'); }} onAddIncident={(note) => addIncident(selected.id, note)} />
        )}

        {!loading && view === 'emergency' && <EmergencyDashboard />}
      </div>
    </div>
  );
}

function ReviewPanel({ candidate: c, onBack, onSave }) {
  const [bgStatus, setBgStatus] = useState(c.backgroundCheckStatus);
  const [bgNotes, setBgNotes] = useState(c.backgroundCheckNotes);
  const [reviewerName, setReviewerName] = useState(c.reviewerName);
  const [outcome, setOutcome] = useState('');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');

  function save() {
    if (!outcome || !reviewerName.trim()) return;
    const status = outcome === 'cleared' ? 'tier1' : outcome === 'not_cleared' ? 'not_cleared' : 'pending_review';
    onSave({
      backgroundCheckStatus: bgStatus, backgroundCheckNotes: bgNotes,
      reviewerName, reviewOutcome: outcome, reasonCategory: reason, reviewerNotes: notes,
      reviewedAt: new Date().toISOString(), status,
    });
  }

  return (
    <div>
      <button onClick={onBack} className="mb-4 flex items-center gap-1 text-sm text-slate-400 hover:text-slate-200">
        <ArrowLeft className="h-4 w-4" /> Back to dashboard
      </button>
      <h2 className="mb-1 text-lg font-semibold text-slate-100">{c.fullName}</h2>
      <p className="mb-4 text-sm text-slate-500">Submitted {new Date(c.submittedAt).toLocaleString()}</p>
      <div className="mb-5"><Stepper status="pending_review" /></div>

      <div className="space-y-4">
        <SectionCard eyebrow="Intake summary" title="Collateral contact answers">
          {c.collaterals.filter((cc) => cc.name).map((cc, i) => (
            <div key={i} className="rounded-lg border border-slate-800 p-3 text-sm">
              <div className="mb-1 font-medium text-slate-200">{cc.name} <span className="font-normal text-slate-500">· {cc.relationship}</span></div>
              <p className="text-slate-400">{cc.q1}</p>
              <p className="text-slate-400">{cc.q2}</p>
              <p className="text-slate-400">{cc.q3}</p>
              <p className="text-slate-400">{cc.q4}</p>
            </div>
          ))}
          {c.collaterals.every((cc) => !cc.name) && <p className="text-sm text-slate-500">No collateral answers recorded.</p>}
        </SectionCard>

        <SectionCard eyebrow="Intake summary" title="Behavioral interview answers">
          <p className="text-sm text-slate-400">{c.behavioral.q1}</p>
          <p className="text-sm text-slate-400">{c.behavioral.q2}</p>
          <p className="text-sm text-slate-400">{c.behavioral.q3}</p>
          <p className="text-sm text-slate-400">{c.behavioral.q4}</p>
        </SectionCard>

        <SectionCard eyebrow="Verified separately" title="Background check" description="Result of an external, verified check — not self-reported.">
          <Field label="Status">
            <Select value={bgStatus} onChange={(e) => setBgStatus(e.target.value)}>
              <option value="not_started">Not started</option>
              <option value="in_progress">In progress</option>
              <option value="clear">Clear</option>
              <option value="flagged">Flagged</option>
            </Select>
          </Field>
          <Field label="Notes (high-level category only)"><TextArea rows={2} value={bgNotes} onChange={(e) => setBgNotes(e.target.value)} /></Field>
        </SectionCard>

        <SectionCard eyebrow="Decision" title="Reviewer outcome" description="Reviewer should be a different person than whoever ran the intake interview.">
          <Field label="Reviewer name"><TextInput value={reviewerName} onChange={(e) => setReviewerName(e.target.value)} /></Field>
          <Field label="Outcome">
            <Select value={outcome} onChange={(e) => setOutcome(e.target.value)}>
              <option value="">Select…</option>
              <option value="cleared">Cleared → Tier 1 (probation)</option>
              <option value="not_cleared">Not cleared at this time</option>
              <option value="needs_info">Needs more information</option>
            </Select>
          </Field>
          <Field label="Reason category"><TextInput value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. inconsistent answers, background flag, collateral concern" /></Field>
          <Field label="Reviewer notes"><TextArea value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>
        </SectionCard>

        <button onClick={save} disabled={!outcome || !reviewerName.trim()}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-raptor-cyan to-raptor-blue px-4 py-2.5 text-sm font-semibold text-raptor-void shadow-raptor-glow transition hover:brightness-110 disabled:cursor-not-allowed disabled:bg-none disabled:bg-slate-800 disabled:text-slate-500 disabled:shadow-none">
          <Save className="h-4 w-4" /> Save decision
        </button>
      </div>
    </div>
  );
}

function DetailPanel({ candidate: c, onBack, onPromote, onAddIncident }) {
  const [note, setNote] = useState('');
  return (
    <div>
      <button onClick={onBack} className="mb-4 flex items-center gap-1 text-sm text-slate-400 hover:text-slate-200">
        <ArrowLeft className="h-4 w-4" /> Back to dashboard
      </button>
      <div className="mb-1 flex items-center gap-2">
        <h2 className="text-lg font-semibold text-slate-100">{c.fullName}</h2>
        <Badge status={c.status} />
      </div>
      <p className="mb-4 text-sm text-slate-500">Reviewed {c.reviewedAt ? new Date(c.reviewedAt).toLocaleString() : '—'} by {c.reviewerName || '—'}</p>
      <div className="mb-5"><Stepper status={c.status} /></div>

      <div className="space-y-4">
        <SectionCard eyebrow="Matching profile" title="For pairing">
          <div className="grid gap-2 text-sm sm:grid-cols-2">
            <div className="flex items-center gap-2 text-slate-400"><Home className="h-3.5 w-3.5" /> {c.schoolOrEmployer || '—'}</div>
            <div className="flex items-center gap-2 text-slate-400"><Compass className="h-3.5 w-3.5" /> {c.fieldOfStudy || '—'}</div>
            <div className="flex items-center gap-2 text-slate-400"><MapPin className="h-3.5 w-3.5" /> {c.regularRoutes || '—'}</div>
            <div className="flex items-center gap-2 text-slate-400"><Phone className="h-3.5 w-3.5" /> {c.phone || '—'}</div>
          </div>
          <p className="text-sm text-slate-400">Hobbies: {c.hobbies || '—'}</p>
        </SectionCard>

        {c.status === 'tier1' && (
          <button onClick={onPromote} className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-500">
            <CheckCircle2 className="h-4 w-4" /> Mark probation complete → Tier 2
          </button>
        )}

        <SectionCard eyebrow="Ongoing" title="Incident log" description="Open to any member report — not just this reviewer.">
          {c.incidents.length === 0 && <p className="text-sm text-slate-500">No incidents logged.</p>}
          {c.incidents.map((inc, i) => (
            <div key={i} className="rounded-lg border border-slate-800 p-2 text-sm">
              <div className="text-xs text-slate-500">{new Date(inc.date).toLocaleString()}</div>
              <div className="text-slate-300">{inc.note}</div>
            </div>
          ))}
          <div className="flex gap-2">
            <TextInput placeholder="Add a note…" value={note} onChange={(e) => setNote(e.target.value)} />
            <button onClick={() => { onAddIncident(note); setNote(''); }} className="shrink-0 rounded-lg bg-slate-800 px-3 py-2 text-sm text-slate-200 hover:bg-slate-700">Add</button>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
