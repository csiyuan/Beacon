'use client';

import { useEffect, useState } from 'react';
import t from './transition.module.css';
import { NAV_WASH_FLAG } from './NavWash';

/* ─────────────────────────────────────────────────────────────────────────
   <ArrivalWash> - the destination half of a <NavWash> nav transition.
   Mounted on any page that wants to receive the cream-wash handoff from a
   logo or pathway click. On mount:
     - Reads + clears the session-storage flag set by NavWash
     - If the flag was present, renders a full-screen cream overlay starting
       at opacity 1, then fades it out over 1100ms (matches the existing
       BrandsArrivalWash duration so all arrivals feel consistent)
     - Otherwise renders nothing (refreshes / deep-links don't see the wash)

   Drop into any destination page or a shared layout component.
   ───────────────────────────────────────────────────────────────────────── */

export default function ArrivalWash({ color = '#F5E6D3' }: { color?: string }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(NAV_WASH_FLAG) === '1') {
        sessionStorage.removeItem(NAV_WASH_FLAG);
        setShow(true);
        const id = window.setTimeout(() => setShow(false), 1300);
        return () => window.clearTimeout(id);
      }
    } catch {}
  }, []);

  if (!show) return null;

  return (
    <div
      className={t.arrivalWashOverlay}
      style={{ background: color }}
      aria-hidden="true"
    />
  );
}
