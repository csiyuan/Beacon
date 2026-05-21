'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import t from './transition.module.css';
import { useResponsiveSrc } from '@/lib/useResponsiveSrc';

export type TransitionPath = 'brand' | 'creative';

type Mode = 'desktop' | 'mobile' | 'reduced';

interface Spec {
  videoSrc: string;
  videoSrcMobile: string;
  href: string;
  washColor: string;
  /** When (ms into the transition) the color wash starts fading in over the video. */
  washFadeInStartMs: number;
  /** Duration of the wash fade-in. */
  washFadeInMs: number;
  /** Total transition length on the splash side - at this beat we router.push(). */
  totalMs: number;
  /** Fallback transition length (mobile / reduced-motion). */
  fallbackMs: number;
  /** When false, skip the 3s transition video and always use the fast color
   *  wash. Used for paths where the destination has its own cinematic intro
   *  (e.g. /creatives) - two videos back-to-back read as the intro playing
   *  twice. The wash hands off cleanly to the destination's dark intro
   *  overlay on arrival. */
  useVideo: boolean;
}

const SPECS: Record<TransitionPath, Spec> = {
  brand: {
    videoSrc: '/assets/beacon-brand-transition.mp4',
    videoSrcMobile: '/assets/beacon-brand-transition-mobile.mp4',
    href: '/brands?from=splash',
    washColor: '#F5E6D3',
    washFadeInStartMs: 2700,
    washFadeInMs: 500,
    totalMs: 3200,
    fallbackMs: 600,
    useVideo: true,
  },
  creative: {
    videoSrc: '/assets/beacon-creative-transition.mp4',
    videoSrcMobile: '/assets/beacon-creative-transition-mobile.mp4',
    href: '/creatives/embedded',
    /* Dark wash seam-matches the creatives intro's #07060a backdrop so
       the transition → intro handoff has no visible colour shift. */
    washColor: '#07060a',
    washFadeInStartMs: 2700,
    washFadeInMs: 500,
    totalMs: 3200,
    fallbackMs: 600,
    useVideo: true,
  },
};

function pickMode(_videoEl: HTMLVideoElement | null): Mode {
  if (typeof window === 'undefined') return 'desktop';
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return 'reduced';
  // Phones get the video too - object-fit:cover on the same video
  // element center-crops the widescreen source to fill the portrait
  // viewport without needing a separate portrait asset.
  return 'desktop';
}

export default function TransitionOverlay({ path }: { path: TransitionPath }) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [washVisible, setWashVisible] = useState(false);
  const [mode, setMode] = useState<Mode | null>(null);
  const spec = SPECS[path];
  // ~150KB mobile, full 1080p on desktop. Cuts the cinematic transition
  // payload by ~12x on phones without changing the feel.
  const videoSrc = useResponsiveSrc(spec.videoSrcMobile, spec.videoSrc);

  useEffect(() => {
    // Decide mode on mount once we can peek at the (possibly cached) video
    // element. Specs with useVideo:false force the fast color-wash path so
    // their destinations (which carry their own cinematic intro) don't
    // play two videos back-to-back.
    const m = spec.useVideo ? pickMode(videoRef.current) : 'mobile';
    setMode(m);

    // Lock page scroll while the overlay is up.
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    let washTimer: number | undefined;
    let pushTimer: number | undefined;

    if (m === 'desktop') {
      const v = videoRef.current;
      if (v) {
        // Best-effort autoplay; muted+playsinline should satisfy modern browsers.
        v.play().catch(() => {
          // If autoplay fails (rare with muted), bail to the fallback fade.
          setMode('mobile');
        });
      }
      washTimer = window.setTimeout(() => setWashVisible(true), spec.washFadeInStartMs);
      pushTimer = window.setTimeout(() => router.push(spec.href), spec.totalMs);
    } else {
      // Fallback: pure CSS fade-in via the .fallbackWash class. Push at the
      // animation's peak (when the wash is fully opaque) so the destination's
      // arrivalWash takes over from full color.
      pushTimer = window.setTimeout(() => router.push(spec.href), spec.fallbackMs);
    }

    return () => {
      if (washTimer) window.clearTimeout(washTimer);
      if (pushTimer) window.clearTimeout(pushTimer);
      document.body.style.overflow = prevOverflow;
    };
  }, [path, router, spec.fallbackMs, spec.href, spec.totalMs, spec.washFadeInStartMs]);

  // Until the mode is resolved we render an invisible placeholder so the
  // overlay covers the page (scroll lock + click capture) without flashing.
  if (mode === null) {
    return <div className={t.overlay} aria-hidden="true" />;
  }

  if (mode === 'desktop') {
    return (
      <div className={t.overlay} aria-hidden="true">
        <video
          ref={videoRef}
          className={t.video}
          src={videoSrc}
          autoPlay
          muted
          playsInline
          preload="auto"
        />
        {/* Bottom-right vignette that covers the AI-tool watermark baked
            into the source MP4. Painted over the video, under the wash so
            it disappears when the wash peaks. */}
        <div className={t.watermarkCover} aria-hidden="true" />
        <div
          className={`${t.wash} ${washVisible ? t.washVisible : ''}`}
          style={{
            background: spec.washColor,
            transitionDuration: `${spec.washFadeInMs}ms`,
          }}
        />
      </div>
    );
  }

  // mobile + reduced-motion: solid wash that fades in over fallbackMs.
  return (
    <div className={t.overlay} aria-hidden="true">
      <div
        className={t.fallbackWash}
        style={{
          background: spec.washColor,
          ['--fallback-duration' as string]: `${spec.fallbackMs}ms`,
        }}
      />
    </div>
  );
}
