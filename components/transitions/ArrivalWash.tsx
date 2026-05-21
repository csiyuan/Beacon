'use client';

import { useEffect, useState } from 'react';
import t from './transition.module.css';
import { NAV_WASH_FLAG, NAV_WASH_TITLE } from './NavWash';

/* ─────────────────────────────────────────────────────────────────────────
   <ArrivalWash> - destination half of the title-card nav transition. On
   mount it reads the session flag set by <NavWash>; if present, it renders
   the cream panel still covering the viewport with the destination's
   title centred on it, holds for a brief beat, then sweeps the panel off
   to the left to reveal the new page.

   Mount once per destination page. Refreshes / deep-links don't see the
   flag so the component renders nothing.
   ───────────────────────────────────────────────────────────────────────── */

// Hold the panel + title on arrival, then run the sweep-out, then a tail
// buffer before unmounting so the `forwards` end-state holds onscreen
// while the destination paints behind it.
const HOLD_MS = 180;
const SWEEP_OUT_MS = 380;
const TAIL_MS = 60;
const TOTAL_MS = HOLD_MS + SWEEP_OUT_MS + TAIL_MS;

export default function ArrivalWash() {
  const [title, setTitle] = useState<string | null>(null);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(NAV_WASH_FLAG) === '1') {
        const savedTitle = sessionStorage.getItem(NAV_WASH_TITLE) || '';
        sessionStorage.removeItem(NAV_WASH_FLAG);
        sessionStorage.removeItem(NAV_WASH_TITLE);
        setTitle(savedTitle);
        const id = window.setTimeout(() => setTitle(null), TOTAL_MS);
        return () => window.clearTimeout(id);
      }
    } catch {}
  }, []);

  if (title === null) return null;

  return (
    <div className={t.titleCardArrivalOverlay} aria-hidden="true">
      <div className={t.titleCardArrivalPanel}>
        {title && <span className={t.titleCardArrivalLabel}>{title}</span>}
      </div>
    </div>
  );
}
