'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import t from './transition.module.css';
import { NAV_WASH_FLAG } from './NavWash';
import { useResponsiveSrc } from '@/lib/useResponsiveSrc';

/* ─────────────────────────────────────────────────────────────────────────
   <PathwayWash> - cinematic transition for the two pathway options on
   /creatives (Embedded / Projects).

   Three stacked layers over a dark backdrop:
     1. Dark #07060a backdrop covers the page edge-to-edge
     2. The cinematic MP4 plays cropped to a centered card (not full
        screen) - feels like a film clip introducing the chosen journey
     3. A solid dark wash fades in over the video at the end so the
        handoff to the destination's <ArrivalWash> is seamless

   Each pathway gets its own video so the transition reads as a
   thematic preview of where the user is heading.
   ───────────────────────────────────────────────────────────────────────── */

type Mode = 'desktop' | 'mobile' | 'reduced';

const PATHWAY_VIDEOS = {
  embedded: '/assets/beacon-brand-transition.mp4',
  projects: '/assets/beacon-creative-transition.mp4',
} as const;
const PATHWAY_VIDEOS_MOBILE = {
  embedded: '/assets/beacon-brand-transition-mobile.mp4',
  projects: '/assets/beacon-creative-transition-mobile.mp4',
} as const;

const WASH_FADE_START_MS = 2400;
const PUSH_AT_MS = 2900;
const FALLBACK_MS = 700;

type PathwayKind = keyof typeof PATHWAY_VIDEOS;

function pickMode(_videoEl: HTMLVideoElement | null): Mode {
  if (typeof window === 'undefined') return 'desktop';
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return 'reduced';
  // Phones get the same centered video card as desktop - the user
  // wanted a single unified transition experience across viewports
  // rather than a separate full-screen mobile treatment.
  return 'desktop';
}

interface PathwayWashCardProps {
  href: string;
  pathway: PathwayKind;
}

function PathwayWashCard({ href, pathway }: PathwayWashCardProps) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [washVisible, setWashVisible] = useState(false);
  const [mode, setMode] = useState<Mode | null>(null);
  // ~150KB mobile vs full 1080p on desktop.
  const videoSrc = useResponsiveSrc(
    PATHWAY_VIDEOS_MOBILE[pathway],
    PATHWAY_VIDEOS[pathway],
  );

  useEffect(() => {
    const m = pickMode(videoRef.current);
    setMode(m);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    try { sessionStorage.setItem(NAV_WASH_FLAG, '1'); } catch {}

    let washTimer: number | undefined;
    let pushTimer: number | undefined;

    if (m === 'desktop' || m === 'mobile') {
      const v = videoRef.current;
      if (v) {
        // If autoplay is blocked (rare with muted+playsinline, but iOS
        // is sometimes finicky), reduced-motion timing takes over so
        // the user isn't stuck on a frozen frame.
        v.play().catch(() => setMode('reduced'));
      }
      washTimer = window.setTimeout(() => setWashVisible(true), WASH_FADE_START_MS);
      pushTimer = window.setTimeout(() => router.push(href), PUSH_AT_MS);
    } else {
      pushTimer = window.setTimeout(() => router.push(href), FALLBACK_MS);
    }

    return () => {
      if (washTimer) window.clearTimeout(washTimer);
      if (pushTimer) window.clearTimeout(pushTimer);
      document.body.style.overflow = prevOverflow;
    };
  }, [href, router]);

  if (mode === null) {
    return <div className={t.pathwayOverlay} aria-hidden="true" />;
  }

  if (mode === 'desktop') {
    return (
      <div className={t.pathwayOverlay} aria-hidden="true">
        <div className={t.pathwayBackdrop} />
        <div className={t.pathwayVideoFrame}>
          <video
            ref={videoRef}
            className={t.pathwayVideo}
            src={videoSrc}
            autoPlay
            muted
            playsInline
            preload="auto"
          />
        </div>
        <div
          className={`${t.pathwayCloseWash} ${washVisible ? t.pathwayCloseWashVisible : ''}`}
        />
      </div>
    );
  }

  if (mode === 'mobile') {
    // Full-screen video that center-crops the widescreen source to fill
    // the portrait viewport. No centered card chrome - mobile gets the
    // immersive treatment because there's no room for a card on a phone.
    return (
      <div className={`${t.pathwayOverlay} ${t.pathwayOverlayMobile}`} aria-hidden="true">
        <video
          ref={videoRef}
          className={t.pathwayMobileVideo}
          src={videoSrc}
          autoPlay
          muted
          playsInline
          preload="auto"
        />
        <div
          className={`${t.pathwayCloseWash} ${washVisible ? t.pathwayCloseWashVisible : ''}`}
        />
      </div>
    );
  }

  // Reduced-motion fallback: skip the video entirely, just a dark wash
  // + gold beam scan so the transition still reads as cinematic without
  // any moving image.
  return (
    <div className={t.pathwayOverlay} aria-hidden="true">
      <div className={t.pathwayWash} />
      <div className={t.pathwayBeam} />
    </div>
  );
}

export function usePathwayWash() {
  const [leaving, setLeaving] = useState<{ href: string; pathway: PathwayKind } | null>(null);

  const trigger = useCallback((href: string, pathway: PathwayKind) => {
    setLeaving((prev) => (prev ? prev : { href, pathway }));
  }, []);

  const overlay = leaving ? (
    <PathwayWashCard href={leaving.href} pathway={leaving.pathway} />
  ) : null;

  return { trigger, overlay, isLeaving: leaving !== null };
}

export default PathwayWashCard;
