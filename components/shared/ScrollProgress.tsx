'use client';

import { useEffect, useState } from 'react';

/* ─────────────────────────────────────────────────────────────────────────
   <ScrollProgress> - a slim gold gradient bar pinned to the top of the
   viewport that fills horizontally as the user scrolls toward the
   bottom of the page. Subtle "where am I in the page" signal you see
   on long-form content sites. ~2px tall; no layout impact.
   ───────────────────────────────────────────────────────────────────────── */
export default function ScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const update = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? window.scrollY / max : 0;
      setProgress(Math.max(0, Math.min(1, p)));
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: 2,
        zIndex: 40,
        pointerEvents: 'none',
        background: 'rgba(240, 198, 115, 0.06)',
      }}
    >
      <div
        style={{
          width: `${progress * 100}%`,
          height: '100%',
          background: 'linear-gradient(90deg, rgba(255, 220, 150, 0.85) 0%, rgba(255, 200, 120, 1) 50%, rgba(201, 138, 58, 0.85) 100%)',
          boxShadow: '0 0 12px rgba(255, 200, 120, 0.5)',
          transition: 'width 80ms linear',
        }}
      />
    </div>
  );
}
