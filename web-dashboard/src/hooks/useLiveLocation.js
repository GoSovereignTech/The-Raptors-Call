// src/hooks/useLiveLocation.js
// Watches GPS + falls back to accelerometer when GPS is stalled.

import { useEffect, useRef, useState } from 'react';

export function useLiveLocation(initialLocation) {
  const [live, setLive] = useState({
    lat: initialLocation?.lat ?? 0,
    lon: initialLocation?.lon ?? 0,
    heading: 0,
    speed: 0,
    source: 'initial', // 'gps' | 'accelerometer' | 'initial'
  });

  const lastGpsRef = useRef({ lat: 0, lon: 0, ts: 0 });
  const accelRef = useRef({ x: 0, y: 0, z: 0 });
  const headingRef = useRef(0);

  // GPS watch
  useEffect(() => {
    if (!navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, heading, speed } = pos.coords;
        lastGpsRef.current = { lat: latitude, lon: longitude, ts: Date.now() };

        setLive((prev) => ({
          lat: latitude,
          lon: longitude,
          heading: heading != null ? heading : prev.heading,
          speed: speed != null ? speed : 0,
          source: 'gps',
        }));
      },
      (err) => console.warn('GPS watch error:', err),
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 15000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  // Accelerometer/compass fallback — runs when GPS hasn't updated in 5s
  useEffect(() => {
    function handleOrientation(e) {
      if (typeof e.webkitCompassHeading === 'number') {
        headingRef.current = e.webkitCompassHeading;
      } else if (e.alpha != null) {
        headingRef.current = 360 - e.alpha;
      }

      // If GPS is stale, use accelerometer heading
      const stale = Date.now() - lastGpsRef.current.ts > 5000;
      if (stale) {
        setLive((prev) => ({
          ...prev,
          heading: headingRef.current,
          source: 'accelerometer',
        }));
      }
    }

    function handleMotion(e) {
      const acc = e.accelerationIncludingGravity || e.acceleration;
      if (!acc) return;
      accelRef.current = { x: acc.x || 0, y: acc.y || 0, z: acc.z || 0 };

      // Derive rough movement from acceleration change
      const mag = Math.sqrt(
        accelRef.current.x ** 2 +
        accelRef.current.y ** 2 +
        accelRef.current.z ** 2
      );

      const stale = Date.now() - lastGpsRef.current.ts > 5000;
      if (stale) {
        setLive((prev) => ({
          ...prev,
          // Fake tiny movement: nudge lat/lon by micro-degrees scaled to activity
          lat: prev.lat + (accelRef.current.y || 0) * 0.000001,
          lon: prev.lon + (accelRef.current.x || 0) * 0.000001,
          speed: Math.min(mag / 10, 5), // clamp to 5 m/s
          source: 'accelerometer',
        }));
      }
    }

    window.addEventListener('deviceorientation', handleOrientation);
    window.addEventListener('devicemotion', handleMotion);
    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
      window.removeEventListener('devicemotion', handleMotion);
    };
  }, []);

  return live;
}