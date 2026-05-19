'use client';

import { useEffect, useState } from 'react';

/* ─────────────────────────────────────────────────────────────────────────
   useResponsiveSrc(mobileSrc, desktopSrc, breakpoint = 768)

   Picks between two URLs based on viewport width. Used for <video src>
   because <video><source media>...</video> is unreliable in Chrome -
   browsers don't always honour the media attribute on <source> inside
   <video> (only <picture> guarantees that behaviour).

   SSR: server renders the desktop src on first paint. Client swaps to
   mobile after mount if the viewport is narrow. Brief flash is fine
   here since these videos mount on demand (intro overlay, transition)
   - the user clicks, the component mounts, the hook runs synchronously
   in the same tick as the first paint, no visible mismatch.
   ───────────────────────────────────────────────────────────────────────── */
export function useResponsiveSrc(
  mobileSrc: string,
  desktopSrc: string,
  breakpoint = 768,
): string {
  const [src, setSrc] = useState<string>(desktopSrc);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia(`(max-width: ${breakpoint}px)`);
    const update = () => setSrc(mq.matches ? mobileSrc : desktopSrc);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, [mobileSrc, desktopSrc, breakpoint]);
  return src;
}
