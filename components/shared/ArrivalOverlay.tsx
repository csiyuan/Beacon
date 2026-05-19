'use client';

/* ─────────────────────────────────────────────────────────────────────────
   ArrivalOverlay - the "incoming" half of the splash → destination handoff.

   Reads a sessionStorage flag set just before navigation by the splash; if
   it matches this overlay's `route`, snap to an opaque warm-gold wash on
   first paint (useLayoutEffect prevents a flash of the destination), then
   fade to transparent revealing the underlying page.

   Cold loads (no flag) render nothing - visitors arriving directly via URL
   are not subjected to the wash.
   ───────────────────────────────────────────────────────────────────────── */

import { useEffect, useLayoutEffect, useState } from 'react';

// useLayoutEffect on the server is a noop with a warning - swap for useEffect
// in non-browser environments so SSR stays quiet.
const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

type Phase = 'idle' | 'opaque' | 'fading';

export default function ArrivalOverlay({
  route,
  duration = 950,
}: {
  route: 'brands' | 'creatives';
  duration?: number;
}) {
  const [phase, setPhase] = useState<Phase>('idle');

  // Read the flag before paint, so the overlay is opaque on the very first
  // visible frame of this route.
  useIsoLayoutEffect(() => {
    try {
      if (sessionStorage.getItem('beacon:arrival') === route) {
        sessionStorage.removeItem('beacon:arrival');
        setPhase('opaque');
      }
    } catch {
      /* sessionStorage can throw in privacy modes - ignore */
    }
  }, [route]);

  // Drive opaque → fading after two RAFs (one to commit the opaque paint,
  // one to let the CSS transition pick up the change).
  useEffect(() => {
    if (phase === 'opaque') {
      const id = requestAnimationFrame(() => {
        requestAnimationFrame(() => setPhase('fading'));
      });
      return () => cancelAnimationFrame(id);
    }
    if (phase === 'fading') {
      const id = window.setTimeout(() => setPhase('idle'), duration + 80);
      return () => window.clearTimeout(id);
    }
  }, [phase, duration]);

  if (phase === 'idle') return null;

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background:
          'radial-gradient(ellipse 70% 60% at 50% 50%, #fff6dc 0%, #f7d99a 30%, #c98a3a 70%, #2a1a0d 100%)',
        opacity: phase === 'opaque' ? 1 : 0,
        transition: `opacity ${duration}ms cubic-bezier(0.22, 0.61, 0.36, 1)`,
        pointerEvents: 'none',
      }}
    />
  );
}
