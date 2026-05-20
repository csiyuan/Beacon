'use client';

import { useEffect } from 'react';
import Lenis from 'lenis';

/* ─────────────────────────────────────────────────────────────────────────
   useLenisScroll - drops a Lenis smooth-scroll wrapper onto the page for
   as long as the calling component is mounted. Lenis hijacks native
   wheel/touch events and animates the scroll position with a lerp,
   producing the "buttery weighted scroll" feel you see on Awwwards-tier
   sites without forcing any snap/lock.

   We deliberately scope this per-route via mount/unmount because some
   pages (the /creatives 3D scene, the splash hero) drive their own
   animations from `window.scrollY` and would fight a smoothed scroll.

   Reduced-motion users get the native scroll - skip Lenis entirely so
   their preference is honoured.
   ───────────────────────────────────────────────────────────────────────── */
export function useLenisScroll() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const lenis = new Lenis({
      // duration in seconds for inertia to settle - higher feels heavier
      duration: 1.2,
      // ease-out curve: starts fast, decelerates - the "weighted glide"
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      // Mobile keeps native scroll: smoothing on touch can feel laggy
      // on iOS and break momentum scrolling expectations.
      smoothWheel: true,
    });

    let frame = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      frame = requestAnimationFrame(raf);
    };
    frame = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(frame);
      lenis.destroy();
    };
  }, []);
}
