// src/hooks/useScrollReveal.js
// Adds .reveal-visible class when an element scrolls into view.
// Optional: replays when the user scrolls back up.

import { useEffect, useRef, useState } from 'react';

export function useScrollReveal({ threshold = 0.15, replay = true } = {}) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
        } else if (replay) {
          setVisible(false);
        }
      },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, replay]);

  return { ref, visible };
}