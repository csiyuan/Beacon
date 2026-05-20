'use client';

import { useEffect, useRef, useState } from 'react';

/* ─────────────────────────────────────────────────────────────────────────
   useCountUp - parses a display value like "50+", "6+", "SG / SEA" and
   animates the leading integer from 0 to the target when the returned
   ref's element enters the viewport. Returns the formatted string +
   the ref to attach.

   Non-numeric values pass through unchanged (e.g. "SG / SEA") so it's
   safe to use on every stat tile without conditional logic at the call
   site.
   ───────────────────────────────────────────────────────────────────────── */
export function useCountUp<T extends HTMLElement = HTMLDivElement>(
  displayValue: string,
  durationMs = 1400,
) {
  // Generic so callers can attach the ref to any element type (div, li,
  // span). Defaults to HTMLDivElement for backwards compatibility with
  // the original journey-page StatTile callers.
  const ref = useRef<T>(null);
  const [text, setText] = useState(displayValue);

  // Parse out the leading integer (e.g. "50+" → 50, "10k" → 10).
  // Returns null if there's no leading number; callers render the raw
  // value in that case.
  const target = (() => {
    const m = displayValue.match(/^(\d+)/);
    return m ? parseInt(m[1], 10) : null;
  })();
  const suffix = target !== null ? displayValue.slice(String(target).length) : '';

  useEffect(() => {
    if (target === null) return;
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setText(displayValue);
      return;
    }
    const el = ref.current;
    if (!el) return;
    setText(`0${suffix}`);
    let raf = 0;
    let started = false;
    const ease = (t: number) => 1 - Math.pow(1 - t, 3); // ease-out cubic
    const start = (t0: number) => {
      const tick = (now: number) => {
        const p = Math.min(1, (now - t0) / durationMs);
        const value = Math.round(ease(p) * target);
        setText(`${value}${suffix}`);
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting && !started) {
            started = true;
            start(performance.now());
            obs.unobserve(el);
          }
        });
      },
      { threshold: 0.4 },
    );
    obs.observe(el);
    return () => {
      obs.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, [target, suffix, displayValue, durationMs]);

  return { ref, text } as const;
}
