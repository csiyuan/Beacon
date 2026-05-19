'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import t from './transition.module.css';

/* ─────────────────────────────────────────────────────────────────────────
   Nav wash transition - reusable cream colour wash for the two non-splash
   navigation moments:
     1. The two pathway options inside /creatives (Embedded / Projects)
     2. Every top-left Beacon wordmark click across the site

   It's a lighter cousin of <TransitionOverlay> (which plays an MP4 for the
   splash → brand/creative moments). No video here - just a clean cream
   #F5E6D3 wash that fades in over 600ms, pushes the route at peak opacity,
   and hands off to the destination's <ArrivalWash> for a seamless cut.

   Usage:
     const { trigger, overlay } = useNavWash();
     <button onClick={() => trigger('/some/route')}>Go</button>
     {overlay}
   ───────────────────────────────────────────────────────────────────────── */

// Session-storage flag - <ArrivalWash> reads + clears this on mount to
// decide whether to play. Means refreshes and deep-links don't trigger
// the wash, but a wash-initiated route change does.
export const NAV_WASH_FLAG = 'beacon.navWash.v1';
const WASH_COLOR = '#F5E6D3';
const PUSH_AT_MS = 600;

interface NavWashProps {
  href: string;
  color?: string;
}

function NavWash({ href, color = WASH_COLOR }: NavWashProps) {
  const router = useRouter();
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    try { sessionStorage.setItem(NAV_WASH_FLAG, '1'); } catch {}
    const pushTimer = window.setTimeout(() => router.push(href), PUSH_AT_MS);
    return () => {
      window.clearTimeout(pushTimer);
      document.body.style.overflow = prevOverflow;
    };
  }, [href, router]);

  return (
    <div className={t.overlay} aria-hidden="true">
      <div
        className={t.fallbackWash}
        style={{
          background: color,
          ['--fallback-duration' as string]: `${PUSH_AT_MS}ms`,
        }}
      />
    </div>
  );
}

/* React hook that exposes a `trigger` function + the overlay element to
   render. Wraps the leaving-state plumbing so callers don't have to
   manage it manually. */
export function useNavWash() {
  const [leaving, setLeaving] = useState<{ href: string; color?: string } | null>(null);

  // Functional-update form keeps trigger's identity stable across renders,
  // so callers can safely include it in useCallback / useEffect deps.
  const trigger = useCallback((href: string, color?: string) => {
    setLeaving((prev) => (prev ? prev : { href, color }));
  }, []);

  const overlay = leaving ? <NavWash href={leaving.href} color={leaving.color} /> : null;

  return { trigger, overlay, isLeaving: leaving !== null };
}

export default NavWash;
