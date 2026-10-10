// src/hooks/useFunnelStatus.js
import React, {useEffect, useState} from 'react';
export function useFunnelStatus() {
  const [status, setStatus] = useState({ current: 1, done: {} });

  useEffect(() => {
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
  }, []);

  return status;
}