'use client';

import { useEffect, useMemo, useRef } from 'react';
import styles from './ThanksPopup.module.css';

/* ─────────────────────────────────────────────────────────────────────────
   <ThanksPopup> - confirmation card that overlays the page after any of
   the four intake forms successfully POSTs to /api/contact.

   Visual treatment:
     - Dark ink card with gold hairline top/bottom edges
     - Four thin gold film-cel corner brackets framing the composition
     - A brief warm gold bloom radiates from the centre on appear,
       then fades, like a flashbulb
     - Cinematic entrance: eyebrow hairlines draw outward from the dot,
       headline glyphs settle in letter-by-letter, body and signature
       fade in last
     - Hand-signed note moments: italic timestamp under the eyebrow,
       italic "- the Beacon team" signature at the bottom

   Behaviour:
     - Auto-dismisses after `autoDismissMs` (default 5000ms)
     - Click ×, click backdrop, or press Escape to dismiss early
     - Page scroll locks while open
   ───────────────────────────────────────────────────────────────────────── */

const HEADLINE_LINE_1 = 'Your Form has been';
const HEADLINE_LINE_2 = 'Received!';

// Cascade timing (ms). Tightened so the entire entrance settles well
// before the default 3s auto-dismiss starts feeling pressured. Sequence:
// chrome → eyebrow → headline glyphs → divider → body → signature.
const TIMING = {
  eyebrow: 140,
  headline: 320,
  glyph: 20,
  divider: 0,   // computed below from headline length
  body: 0,
  signature: 0,
} as const;

// Compute the trailing-phase delays so the body and signature line up
// after the last headline glyph has finished its 480ms animation.
const computedTiming = (() => {
  const lastGlyph =
    TIMING.headline +
    (HEADLINE_LINE_1.length + 4 + HEADLINE_LINE_2.length) * TIMING.glyph;
  return {
    ...TIMING,
    divider: lastGlyph + 80,
    body: lastGlyph + 180,
    signature: lastGlyph + 360,
  };
})();

interface GlyphsProps {
  text: string;
  baseDelay: number;
}

// Splits a string into per-character spans, each with its own cascade
// delay. Spaces become non-breaking so the line layout doesn't collapse.
function Glyphs({ text, baseDelay }: GlyphsProps) {
  return (
    <>
      {Array.from(text).map((ch, i) => (
        <span
          key={`${ch}-${i}`}
          className={styles.glyph}
          style={{ animationDelay: `${baseDelay + i * TIMING.glyph}ms` }}
          aria-hidden
        >
          {ch === ' ' ? ' ' : ch}
        </span>
      ))}
    </>
  );
}

export interface ThanksPopupProps {
  open: boolean;
  onClose: () => void;
  autoDismissMs?: number;
}

export default function ThanksPopup({
  open,
  onClose,
  autoDismissMs = 5000,
}: ThanksPopupProps) {
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => onCloseRef.current(), autoDismissMs);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseRef.current();
    };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.clearTimeout(t);
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, autoDismissMs]);

  // Formatted date for the letterhead stamp under the eyebrow. Recompute
  // on each open so the date is fresh if the popup persists across days.
  const dateStamp = useMemo(
    () =>
      new Date().toLocaleDateString('en-SG', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
    [open],
  );

  if (!open) return null;

  return (
    <div className={styles.backdrop} onClick={onClose} role="presentation">
      <div
        className={styles.card}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="thanks-popup-title"
      >
        {/* Warm gold bloom - radiates from centre then fades */}
        <span className={styles.bloom} aria-hidden />

        {/* Hairline edges */}
        <span className={styles.edgeTop} aria-hidden />
        <span className={styles.edgeBottom} aria-hidden />

        {/* Film-cel corner brackets */}
        <span className={`${styles.corner} ${styles.cornerTL}`} aria-hidden />
        <span className={`${styles.corner} ${styles.cornerTR}`} aria-hidden />
        <span className={`${styles.corner} ${styles.cornerBL}`} aria-hidden />
        <span className={`${styles.corner} ${styles.cornerBR}`} aria-hidden />

        <button
          type="button"
          className={styles.close}
          onClick={onClose}
          aria-label="Close"
        >
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        <div className={styles.inner}>
          {/* Eyebrow - hairlines draw outward from centre */}
          <div
            className={styles.eyebrow}
            aria-hidden
            style={{ animationDelay: `${computedTiming.eyebrow}ms` }}
          >
            <span className={styles.eyebrowRule} />
            <span className={styles.eyebrowDot} />
            <span className={styles.eyebrowText}>Message received</span>
            <span className={styles.eyebrowDot} />
            <span className={styles.eyebrowRule} />
          </div>

          {/* Letterhead timestamp */}
          <p
            className={styles.timestamp}
            aria-hidden
            style={{ animationDelay: `${computedTiming.eyebrow + 120}ms` }}
          >
            Singapore <span className={styles.timestampSep}>&middot;</span>{' '}
            {dateStamp}
          </p>

          {/* Headline - per-glyph cascade. aria-label preserves the full
              phrase for screen readers since each glyph is aria-hidden. */}
          <h2
            id="thanks-popup-title"
            className={styles.title}
            aria-label="Your form has been received."
          >
            <span className={styles.titleLine} aria-hidden>
              <Glyphs text={HEADLINE_LINE_1} baseDelay={computedTiming.headline} />
            </span>
            <span
              className={`${styles.titleLine} ${styles.titleLineItalic}`}
              aria-hidden
            >
              <Glyphs
                text={HEADLINE_LINE_2}
                baseDelay={
                  computedTiming.headline +
                  (HEADLINE_LINE_1.length + 4) * TIMING.glyph
                }
              />
            </span>
          </h2>

          <span
            className={styles.divider}
            aria-hidden
            style={{ animationDelay: `${computedTiming.divider}ms` }}
          />

          <p
            className={styles.body}
            style={{ animationDelay: `${computedTiming.body}ms` }}
          >
            We&rsquo;ll reply from a real person within 2 working days -{' '}
            <span className={styles.bodyAccent}>usually sooner.</span>
          </p>

          {/* Signature flourish */}
          <p
            className={styles.signature}
            aria-hidden
            style={{ animationDelay: `${computedTiming.signature}ms` }}
          >
            - the Beacon team
          </p>
        </div>

        {/* Auto-dismiss progress bar */}
        <span
          className={styles.progress}
          style={{ animationDuration: `${autoDismissMs}ms` }}
          aria-hidden
        />
      </div>
    </div>
  );
}
