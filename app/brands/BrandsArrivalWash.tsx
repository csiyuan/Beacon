'use client';

import { useEffect, useState } from 'react';
import s from './brands.module.css';

export default function BrandsArrivalWash() {
  const [show, setShow] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.history.replaceState({}, '', window.location.pathname);
    }
    // Hold the div until shortly after the CSS keyframe (1100ms) finishes
    // so the `forwards` end-state holds onscreen until we tear it down.
    const t = window.setTimeout(() => setShow(false), 1300);
    return () => window.clearTimeout(t);
  }, []);

  if (!show) return null;
  return <div className={s.arrivalWash} aria-hidden="true" />;
}
