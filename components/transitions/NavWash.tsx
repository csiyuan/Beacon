'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import t from './transition.module.css';

/* ─────────────────────────────────────────────────────────────────────────
   Nav title-card transition - the source half of the editorial title-card
   wipe used for every top-level nav destination (Home / About / Contact /
   For Brands / For Creatives).

   Sequence:
     1. Cream panel sweeps in from the right edge, covering the screen.
     2. The destination's name (e.g. "About.") fades into the centre of the
        panel in big italic serif - the page's own title card.
     3. router.push() fires the moment the panel fully covers the viewport
        and the title is visible.
     4. The destination's <ArrivalWash> picks up with the panel still
        covering, holds the title for a beat, then sweeps the panel off
        to the left revealing the new page underneath.

   Usage:
     const { trigger, overlay } = useNavWash();
     <button onClick={() => trigger('/some/route')}>Go</button>
     {overlay}
   ───────────────────────────────────────────────────────────────────────── */

export const NAV_WASH_FLAG = 'beacon.navWash.v1';
export const NAV_WASH_TITLE = 'beacon.navWash.title.v1';

// Source-side sweep-in + title fade-in completes at this beat; we push
// the route here so the destination mounts under the still-covered panel.
const PUSH_AT_MS = 260;

/* Map a destination href to the title card label. Strips query + hash
   first so /about?from=splash → "About". Unknown routes fall back to an
   empty label, in which case the sweep still plays but no title shows. */
export function pageTitleFor(href: string): string {
  const path = (href.split('?')[0].split('#')[0] || '/').replace(/\/+$/, '') || '/';
  if (path === '/') return 'Home.';
  if (path === '/about') return 'About.';
  if (path === '/contact') return 'Contact.';
  if (path === '/brands') return 'For Brands.';
  if (path.startsWith('/creatives')) return 'For Creatives.';
  return '';
}

interface NavWashProps {
  href: string;
}

function NavWash({ href }: NavWashProps) {
  const router = useRouter();
  const title = pageTitleFor(href);

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    try {
      sessionStorage.setItem(NAV_WASH_FLAG, '1');
      sessionStorage.setItem(NAV_WASH_TITLE, title);
    } catch {}
    const pushTimer = window.setTimeout(() => router.push(href), PUSH_AT_MS);
    return () => {
      window.clearTimeout(pushTimer);
      document.body.style.overflow = prevOverflow;
    };
  }, [href, router, title]);

  return (
    <div className={t.titleCardOverlay} aria-hidden="true">
      <div className={t.titleCardPanel}>
        {title && <span className={t.titleCardLabel}>{title}</span>}
      </div>
    </div>
  );
}

/* React hook that exposes a `trigger` function + the overlay element to
   render. Wraps the leaving-state plumbing so callers don't have to
   manage it manually. */
export function useNavWash() {
  const [leaving, setLeaving] = useState<{ href: string } | null>(null);

  const trigger = useCallback((href: string) => {
    setLeaving((prev) => (prev ? prev : { href }));
  }, []);

  const overlay = leaving ? <NavWash href={leaving.href} /> : null;

  return { trigger, overlay, isLeaving: leaving !== null };
}

export default NavWash;
