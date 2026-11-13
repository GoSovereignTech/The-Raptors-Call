// pages/admin/AdminHome.jsx
// Landing page for admins: candidate queue + per-candidate journey view.

import { useState, useMemo } from 'react';
import {
  Users, Search, ChevronRight, ArrowLeft, CheckCircle2, Circle,
  Lock, AlertTriangle, Usb, Bell, Radio, Play, Loader2, Save,
} from 'lucide-react';
import RaptorMark from '../../components/RaptorMark.jsx';
import DeviceSetupWizard from '../../components/DeviceSetupWizard.jsx';

// ─── The 9-step journey every member walks through ───
export const JOURNEY_STEPS = [
  { key: 'trial',      label: 'Try the web app',      owner: 'user'   },
  { key: 'purchase',   label: 'Purchase a loadout',   owner: 'server' },
  { key: 'account',    label: 'Create account',       owner: 'server' },
  { key: 'interview',  label: 'Intake interview',     owner: 'admin'  },
  { key: 'background', label: 'Background check',     owner: 'admin'  },
  { key: 'gear',       label: 'Receive gear',         owner: 'server' },
  { key: 'device',     label: 'Set up device',        owner: 'admin'  },
  { key: 'training',   label: 'Training day',         owner: 'admin'  },
  { key: 'probation',  label: 'Complete probation',   owner: 'admin'  },
];

const STATUS_ICON = {
  done:     <CheckCircle2 className="h-4 w-4 text-emerald-400" />,
  active:   <Play className="h-4 w-4 text-raptor-cyan" />,
  waiting:  <Lock className="h-4 w-4 text-slate-600" />,
  failed:   <AlertTriangle className="h-4 w-4 text-rose-400" />,
};

function stepStatuses(candidate) {
  // Derive a status per step from the candidate record.
  // For now this reads from localStorage-era fields; later it will read
  // from the `journey_steps` table in Supabase.
  const s = (k, d = 'waiting') => candidate?.journeySteps?.[k] || d;
  return {
    trial:      s('trial', 'done'),
    purchase:   candidate?.purchaseConfirmedAt ? 'done' : 'waiting',
    account:    candidate?.accountCreatedAt   ? 'done' : 'waiting',
    interview:  candidate?.reviewedAt         ? 'done'
                : candidate?.interviewScheduledAt ? 'active' : 'waiting',
    background: candidate?.backgroundCheckStatus === 'clear' ? 'done'
                : candidate?.backgroundCheckStatus === 'in_progress' ? 'active'
                : candidate?.backgroundCheckStatus === 'flagged' ? 'failed'
                : 'waiting',
    gear:       candidate?.gearShippedAt ? 'done' : 'waiting',
    device:     candidate?.deviceSetupAt ? 'done' : 'waiting',
    training:   candidate?.trainingAttendedAt ? 'done' : 'waiting',
    probation:  candidate?.status === 'tier2' ? 'done'
                : candidate?.status === 'tier1' ? 'active' : 'waiting',
  };
}

function nextAction(candidate) {
  const s = stepStatuses(candidate);
  for (const step of JOURNEY_STEPS) {
    if (s[step.key] !== 'done' && s[step.key] !== 'waiting') {
      return step.owner === 'admin' ? `You: ${step.label}` : `Waiting on user: ${step.label}`;
    }
  }
  return 'All steps complete';
}

export default function AdminHome({ candidates, onSelectCandidate, onNewIntake }) {
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return candidates
      .filter((c) => c.fullName?.toLowerCase().includes(q))
      .sort((a, b) => {
        // Admin-action-needed first, then by submission date
        const aAdmin = nextAction(a).startsWith('You:') ? 1 : 0;
        const bAdmin = nextAction(b).startsWith('You:') ? 1 : 0;
        if (aAdmin !== bAdmin) return bAdmin - aAdmin;
        return new Date(b.submittedAt) - new Date(a.submittedAt);
      });
  }, [candidates, search]);

  const selected = candidates.find((c) => c.id === selectedId);
  if (selected) {
    return (
      <CandidateJourney
        candidate={selected}
        onBack={() => setSelectedId(null)}
      />
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2.5">
          <RaptorMark className="h-6 w-6" />
          <div>
            <div className="text-sm font-semibold text-slate-100">Admin Home</div>
            <div className="text-xs text-slate-500">Candidates needing your action appear first</div>
          </div>
        </div>
        <button onClick={onNewIntake}
          className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-raptor-cyan to-raptor-blue px-3 py-2 text-sm font-semibold text-raptor-void shadow-raptor-glow">
          New intake
        </button>
      </div>

      <div className="mb-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name…"
            className="w-full rounded-lg border border-slate-700 bg-slate-900 py-2 pl-9 pr-3 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-raptor-cyan" />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-800 py-14 text-center">
          <Users className="mx-auto mb-2 h-8 w-8 text-slate-700" />
          <p className="text-sm text-slate-400">No candidates yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((c) => (
            <button key={c.id} onClick={() => setSelectedId(c.id)}
              className="flex w-full items-center justify-between rounded-lg border border-slate-800 bg-slate-900/40 px-4 py-3 text-left hover:border-slate-700">
              <div>
                <div className="text-sm font-medium text-slate-100">{c.fullName || 'Unnamed'}</div>
                <div className="text-xs text-slate-500">{nextAction(c)}</div>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-600" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function CandidateJourney({ candidate, onBack }) {
  const statuses = stepStatuses(candidate);

  return (
    <div className="mx-auto max-w-3xl">
      <button onClick={onBack} className="mb-4 flex items-center gap-1 text-sm text-slate-400 hover:text-slate-200">
        <ArrowLeft className="h-4 w-4" /> Back to queue
      </button>
      <h2 className="mb-1 text-lg font-semibold text-slate-100">{candidate.fullName}</h2>
      <p className="mb-5 text-sm text-slate-500">Submitted {new Date(candidate.submittedAt).toLocaleString()}</p>

      <ol className="space-y-2">
        {JOURNEY_STEPS.map((step) => {
          const status = statuses[step.key];
          return (
            <li key={step.key}
              className={`rounded-lg border px-4 py-3 ${
                status === 'active'
                  ? 'border-raptor-cyan bg-raptor-cyan/5'
                  : 'border-slate-800 bg-slate-900/40'
              }`}>
              <div className="flex items-center gap-3">
                {STATUS_ICON[status]}
                <div className="flex-1">
                  <div className="text-sm font-medium text-slate-100">{step.label}</div>
                  <div className="text-xs text-slate-500">
                    {status === 'done' ? 'Complete'
                     : status === 'active' ? `${step.owner === 'admin' ? 'Your action required' : 'Waiting on user'}`
                     : status === 'failed' ? 'Needs attention'
                     : 'Waiting on prior step'}
                  </div>
                </div>
              </div>

              {/* Device setup step embeds the wizard */}
              {step.key === 'device' && status === 'active' && (
                <div className="mt-4">
                  <DeviceSetupWizard candidateId={candidate.id} />
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}