import { useState } from 'react';
import { UserPlus, ArrowLeft, Save } from 'lucide-react';

export function PublicIntake({ onSubmit, onCancel, initial = {} }) {
  const [form, setForm] = useState({
    fullName: '', address: '', timeInArea: '', phone: '',
    emergencyContactName: '', emergencyContactPhone: '',
    collaterals: [0, 1, 2].map(() => ({
      name: '', relationship: '', phone: '',
      q1: '', q2: '', q3: '', q4: '',
    })),
    behavioral: { q1: '', q2: '', q3: '', q4: '' },
    schoolOrEmployer: '', fieldOfStudy: '', regularRoutes: '',
    hobbies: '', goals: '', upcomingTravel: '',
    aloneWalking: false, aloneDriving: false,
    aloneStudying: false, aloneTraveling: false,
    exposureNotes: '',
    consentAcknowledged: false,
    ...initial,
  });

  const update = (patch) => setForm((f) => ({ ...f, ...patch }));
  const updateCollateral = (i, patch) => {
    const next = [...form.collaterals];
    next[i] = { ...next[i], ...patch };
    update({ collaterals: next });
  };

  const canSubmit = form.fullName.trim() && form.consentAcknowledged;

  return (
    <div className="space-y-4">
      {/* Header + sections — same visual structure as your existing form */}
      {/* Section 01: Identity */}
      {/* Section 02: Collateral references */}
      {/* Section 03: Behavioral interview */}
      {/* Section 04: Compatibility (school, hobbies, goals) */}
      {/* Section 05: Safety planning */}
      {/* Section 06: Consent */}

      <button
        disabled={!canSubmit}
        onClick={() => onSubmit(form)}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-raptor-cyan to-raptor-blue px-4 py-2.5 text-sm font-semibold text-raptor-void disabled:opacity-40"
      >
        <Save className="h-4 w-4" /> Submit for review
      </button>
    </div>
  );
}