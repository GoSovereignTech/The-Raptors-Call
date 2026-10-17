// src/hooks/useFunnelStatus.js
import React, {useEffect, useState} from 'react';



// Export this helper so other components can mark steps as done
export function markFunnelStepDone(stateKey) {
  try {
    const raw = localStorage.getItem('raptor:funnel');
    const state = raw ? JSON.parse(raw) : {};
    state[stateKey] = true;
    localStorage.setItem('raptor:funnel', JSON.stringify(state));
    
    // Dispatch a custom event to tell the hook to re-render
    window.dispatchEvent(new Event('raptor:funnel-update'));
  } catch (e) {
    console.warn('Failed to update funnel state', e);
  }
}

export function useFunnelStatus() {
  const [status, setStatus] = useState({ current: 1, done: {} });

  useEffect(() => {
    const evaluateStatus = () => {
      const raw = localStorage.getItem('raptor:funnel');
      const state = raw ? JSON.parse(raw) : {};
      const done = {
        1: !!state.triedDemo,
        2: !!state.purchased,
        3: !!state.intakeScheduled,
        4: !!state.gearReceived,
        5: !!state.trained,
      };
      const current = [1,2,3,4,5].find((n) => !done[n]) || 6;
      setStatus({ current, done });
    };

    // Run once on mount
    evaluateStatus();

    // Listen for updates from markFunnelStepDone
    window.addEventListener('raptor:funnel-update', evaluateStatus);
    return () => window.removeEventListener('raptor:funnel-update', evaluateStatus);
  }, []);

  return status;
}