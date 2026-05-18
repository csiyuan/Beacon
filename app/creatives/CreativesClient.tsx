'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import s from './creatives.module.css';

const CreativesApp = dynamic(() => import('./CreativesApp'), { ssr: false });

// localStorage key used to remember whether the user has already watched
// the intro through to the end. Returning visitors skip the cinematic and
// land directly on the page. Bump the version suffix if the intro is
// re-shot and you want everyone to see it once more.
const INTRO_SEEN_KEY = 'beacon.creatives.introSeen.v1';
// sessionStorage key used to suppress a double-play within a single tab
// session for *direct* nav (back from /about, /contact, or a refresh). The
// fromBeam splash CTA and the replay button both bypass this — clicking
// "I'm a Creative" on the splash is a strong intent signal, so the intro
// should replay every time it's chosen explicitly.
const INTRO_SESSION_KEY = 'beacon.creatives.introSession.v1';

function IntroOverlay({
  onDismissed,
  forceReplay,
  fromBeam,
}: {
  onDismissed: () => void;
  forceReplay?: boolean;
  fromBeam?: boolean;
}) {
  const [show, setShow] = useState(true);
  const [fadingOut, setFadingOut] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Decision tree on mount:
  //   • reduced-motion              → skip (accessibility)
  //   • forceReplay OR fromBeam     → PLAY (explicit user intent —
  //                                     splash CTA or replay button)
  //   • sessionStorage flag set     → skip (returning via SPA nav from
  //                                     /about or /contact, or refresh)
  //   • localStorage flag set       → skip (returning visitor across sessions)
  //   • otherwise                   → play (first arrival)
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setShow(false);
      onDismissed();
      return;
    }
    // Explicit-intent paths (replay button, splash CTA) bypass storage
    // flags. Direct nav / refresh still honors them so the intro doesn't
    // replay every time the user pops back from /about or /contact.
    const explicit = forceReplay || fromBeam;
    if (!explicit) {
      try {
        if (window.sessionStorage.getItem(INTRO_SESSION_KEY) === '1') {
          setShow(false);
          onDismissed();
          return;
        }
      } catch {}
      try {
        if (window.localStorage.getItem(INTRO_SEEN_KEY) === '1') {
          setShow(false);
          onDismissed();
          return;
        }
      } catch {}
    }
    try { window.sessionStorage.setItem(INTRO_SESSION_KEY, '1'); } catch {}
    document.body.classList.add('intro-active');
    return () => document.body.classList.remove('intro-active');
  }, [onDismissed, forceReplay, fromBeam]);

  const handleEnded = () => {
    // Mark as seen only when the user lets the intro play through. People
    // who hit Skip will see the intro again on their next visit, which
    // mirrors the YouTube/Netflix model — skipping is a "not this time"
    // signal, not a permanent dismissal.
    try { window.localStorage.setItem(INTRO_SEEN_KEY, '1'); } catch {}
    dismiss();
  };

  const dismiss = () => {
    if (fadingOut) return;
    // Freeze the intro on its current frame so it doesn't keep advancing
    // (or worse, snap back to a different frame) while the overlay fades.
    // The frozen frame is what the loop crossfades against.
    if (videoRef.current) {
      try { videoRef.current.pause(); } catch {}
    }
    // No video seek needed anymore — the background is now a static JPG
    // extracted from the intro's final frame, so the handoff is pixel-
    // identical without any cross-decoding work.
    setFadingOut(true);
    // Decoupled reveal timeline:
    //   • T+0     overlay starts its 2400ms fade-out
    //   • T+1400  body.intro-active flips off — fires the page hero
    //             stagger 1s before the overlay is fully gone, so the
    //             BEACON title cascade materialises *through* the dimming
    //             overlay instead of waiting for it to clear completely
    //   • T+1500  dawn vignette begins its longer fade
    //   • T+2400  overlay fully transparent
    //   • T+6900  unmount — dawn vignette has had time to clear too
    window.setTimeout(() => {
      document.body.classList.remove('intro-active');
      onDismissed();
    }, 1400);
    window.setTimeout(() => setShow(false), 6900);
  };

  if (!show) return null;

  return (
    <>
      {/* Dawn vignette — sits below the overlay (z-index 8999). Becomes
          visible only as the overlay fades out, then lingers and clears
          its own dark edges so the world feels like it's lighting up
          rather than just being uncovered. */}
      <div
        className={`${s.dawnVignette} ${fadingOut ? s.clearing : ''}`}
        aria-hidden="true"
      />
      <div
        className={`${s.introOverlay} ${fadingOut ? s.fadeOut : ''}`}
        onClick={dismiss}
        role="presentation"
      >
        <video
          ref={videoRef}
          className={s.introVideo}
          src="/assets/beacon-creative-landing-page-entry.mp4"
          autoPlay
          muted
          playsInline
          preload="auto"
          onEnded={handleEnded}
          aria-hidden="true"
        />
        <button type="button" className={s.introSkip} onClick={dismiss}>
          Skip
        </button>
      </div>
    </>
  );
}

type Scene = 'descent' | 'about' | 'contact' | 'brand' | 'creative';

export default function CreativesClient({
  fromBeam = false,
  initialScene = 'descent',
  homeRoute = null,
  bgFrom = 'creatives',
}: {
  fromBeam?: boolean;
  initialScene?: Scene;
  homeRoute?: string | null;
  /** Source page the visitor came from. Controls which still image gets
   *  painted behind the destination overlay so /about and /contact feel
   *  like they belong to the originating context (splash hero, brand
   *  corporate, or the creatives descent scene). */
  bgFrom?: 'splash' | 'brands' | 'creatives';
}) {
  // When initialScene is not 'descent' we're mounting on a standalone
  // route (/about or /contact). Skip the cinematic intro entirely — the
  // intro belongs to the creatives landing, not to utility pages — and
  // start the hero reveal immediately so the in-page animations fire.
  const skipIntro = initialScene !== 'descent';
  // Held false while the intro overlay is still on screen. Flipped true
  // once the overlay has fully faded — that's the signal for CreativesApp
  // to start its original staggered hero reveal (title letter-by-letter,
  // then tagline, then hint) instead of running on mount where it would
  // finish while the intro is still covering everything.
  const [introDismissed, setIntroDismissed] = useState(skipIntro);
  // Bumped each time the user hits "Replay intro" — remounts the
  // IntroOverlay with a fresh key so the video starts from frame 0 and
  // the dismiss state resets. forcePlay=true skips the localStorage
  // check so the replay always runs even for returning visitors.
  const [replayKey, setReplayKey] = useState(0);
  const replayIntro = () => {
    setIntroDismissed(false);
    setReplayKey(k => k + 1);
  };

  // Strip ?from=beam from the URL after the initial load. The query param
  // means "the user just arrived from the splash CTA" — it forces the
  // intro to play. If we leave it in the URL, refreshing the page would
  // re-trigger the force-play because the URL still says "just arrived".
  // history.replaceState is used (not router.replace) so we don't bump
  // a new history entry — the back button still goes to / cleanly.
  const router = useRouter();
  useEffect(() => {
    if (fromBeam && typeof window !== 'undefined') {
      const cleaned = window.location.pathname;
      window.history.replaceState({}, '', cleaned);
    }
  }, [fromBeam]);

  return (
    <>
      <div className="matte" id="matte"></div>
      <div className="cloud-drift" id="cloud-drift"></div>
      <div className="birds" id="birds" aria-hidden="true">
        <div className="bird b1">
          <svg viewBox="0 0 42 28" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
            <g className="body" fill="#1a120a">
              <ellipse cx="21" cy="15" rx="6.5" ry="2.1" />
              <path d="M27 15 L33 14 L33 16 Z" />
              <circle cx="14" cy="14" r="1.6" />
              <path d="M12.4 14 L11 13.6 L12 14.4 Z" />
            </g>
            <path className="wing left" d="M14 13 Q 6 4, 0 10 Q 5 11, 14 13 Z" fill="#1a120a" />
            <path className="wing right" d="M28 13 Q 36 4, 42 10 Q 37 11, 28 13 Z" fill="#1a120a" />
          </svg>
        </div>
        <div className="bird b2 f-slow">
          <svg viewBox="0 0 42 28" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
            <g className="body" fill="#1a120a">
              <ellipse cx="21" cy="15" rx="6.5" ry="2.1" />
              <path d="M27 15 L33 14 L33 16 Z" />
              <circle cx="14" cy="14" r="1.6" />
              <path d="M12.4 14 L11 13.6 L12 14.4 Z" />
            </g>
            <path className="wing left" d="M14 13 Q 6 4, 0 10 Q 5 11, 14 13 Z" fill="#1a120a" />
            <path className="wing right" d="M28 13 Q 36 4, 42 10 Q 37 11, 28 13 Z" fill="#1a120a" />
          </svg>
        </div>
        <div className="bird b3 f-fast">
          <svg viewBox="0 0 42 28" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
            <g className="body" fill="#1a120a">
              <ellipse cx="21" cy="15" rx="6.5" ry="2.1" />
              <path d="M27 15 L33 14 L33 16 Z" />
              <circle cx="14" cy="14" r="1.6" />
              <path d="M12.4 14 L11 13.6 L12 14.4 Z" />
            </g>
            <path className="wing left" d="M14 13 Q 6 4, 0 10 Q 5 11, 14 13 Z" fill="#1a120a" />
            <path className="wing right" d="M28 13 Q 36 4, 42 10 Q 37 11, 28 13 Z" fill="#1a120a" />
          </svg>
        </div>
      </div>
      <svg
        style={{ position: 'absolute', width: 0, height: 0, pointerEvents: 'none' }}
        aria-hidden="true"
      >
        <defs>
          <filter id="sharpen" x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
            <feConvolveMatrix
              order="3"
              preserveAlpha="true"
              kernelMatrix="0 -0.22 0  -0.22 1.88 -0.22  0 -0.22 0"
            />
          </filter>
        </defs>
      </svg>
      {/* Persistent background — the exact final frame of the intro video,
          extracted to a JPG so the intro→page handoff is pixel-identical
          and seams invisibly. Replaces the previous AI-generated loop
          video which had a visible mismatch with the intro's end frame.
          Motion is now code-driven: the cloud-wisps overlay drifts, the
          existing Three.js scene + cloud-drift layer breathe, and the
          ambient mood is preserved without the fake-looking video seam. */}
      {/* Source-aware backdrop. Defaults to the creatives descent still so
          existing entry paths (?from=beam, replay) look unchanged. When
          /about or /contact is opened from the splash or the brand page,
          we paint the matching context image instead so the user feels
          like the destination overlay is sitting on top of the page they
          came from. Brand path renders no image — a plain dark color is
          painted by the body so the corporate palette reads through. */}
      {bgFrom !== 'brands' && (
        <img
          id="main-loop"
          className={s.mainLoop}
          src={
            bgFrom === 'splash'
              ? '/assets/beacon-landing-page.png'
              : '/assets/beacon-creative-landing-page-still.png'
          }
          alt=""
          aria-hidden="true"
        />
      )}
      {bgFrom === 'brands' && (
        <div className={s.brandBackdrop} aria-hidden="true" />
      )}

      {/* Drifting wisps overlay — fakes clouds and smoke moving through the
          scene since the video itself is nearly static. Sits just above the
          loop video, below the vignette. */}
      <div className={s.cloudWisps} aria-hidden="true" />

      {/* Cinematic motion — vertical light beams + floating motes, same
          treatment as the splash. Sit between the still image (z 0) and
          the hero text (z 20). Use globals.css .creatives-beams / .mote
          classes so they share rendering with the rest of the creatives
          chrome and the per-element animations stay CSS-only. */}
      <div className="creatives-beams" aria-hidden="true">
        <span className="cbeam cbeam-1"></span>
        <span className="cbeam cbeam-2"></span>
        <span className="cbeam cbeam-3"></span>
        <span className="cbeam cbeam-4"></span>
        <span className="cbeam cbeam-5"></span>
      </div>
      <div className="creatives-motes" aria-hidden="true">
        {Array.from({ length: 22 }).map((_, i) => (
          <span
            key={i}
            className="cmote"
            style={{
              left: `${48 + (i * 37) % 18 - 9}%`,
              animationDelay: `${(i * 0.43) % 7}s`,
              animationDuration: `${6 + (i * 0.31) % 5}s`,
            }}
          />
        ))}
      </div>

      <div className="vignette"></div>

      <div className="static-hero">
        <div className="hero">
          <div className="eyebrow show">Beacon</div>
          <div
            className="title"
            style={{ background: 'linear-gradient(180deg,#fff6dc,#f7d99a 50%,#d99846)' }}
          >
            BEACON
          </div>
          <div className="tagline show">Empowering creatives. Elevating brands.</div>
        </div>
      </div>

      <CreativesApp
        introDismissed={introDismissed}
        initialPhase={initialScene}
        homeRoute={homeRoute}
      />

      <div className="grain"></div>

      {fromBeam && <div className={s.arrivalWash} aria-hidden="true" />}

      {/* Intro + replay are only wired on the creatives landing. On
          standalone /about and /contact routes the intro is skipped and
          the replay affordance would be confusing, so we suppress both. */}
      {!skipIntro && (
        <>
          <IntroOverlay
            key={replayKey}
            onDismissed={() => setIntroDismissed(true)}
            // forceReplay → user hit replay button (bypasses every storage
            //   flag, ALWAYS plays).
            // fromBeam → user just arrived from the splash CTA (bypasses
            //   localStorage "seen ever" check, but still honors the
            //   sessionStorage "seen this session" flag — so a refresh
            //   after arrival doesn't replay the intro).
            forceReplay={replayKey > 0}
            fromBeam={fromBeam}
          />

          {introDismissed && (
            <button
              type="button"
              className={s.replayIntro}
              onClick={replayIntro}
              aria-label="Replay intro"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polygon points="5 3 19 12 5 21 5 3"/>
              </svg>
              <span>Replay intro</span>
            </button>
          )}
        </>
      )}
    </>
  );
}
