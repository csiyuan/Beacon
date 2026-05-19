'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import TransitionOverlay, { type TransitionPath } from '@/components/transitions/TransitionOverlay';
import ArrivalWash from '@/components/transitions/ArrivalWash';
import { useNavWash } from '@/components/transitions/NavWash';
import s from '@/app/splash.module.css';

export default function Hero() {
  const router = useRouter();
  const [hover, setHover] = useState<TransitionPath | null>(null);
  const [leaving, setLeaving] = useState<TransitionPath | null>(null);
  // Cream-flash transition for non-path links (About / Contact).
  const { trigger: navWash, overlay: navWashOverlay } = useNavWash();
  // Enable the ambient mist loop only on desktop with motion allowed.
  // Mobile keeps the PNG (battery/bandwidth); reduced-motion users see the
  // PNG too. Decided after mount so SSR is consistent.
  const [enableLoop, setEnableLoop] = useState(false);
  // Mobile hamburger menu - the four nav links wrap awkwardly at iPhone-SE
  // width. Below 760px we hide the inline nav and reveal a right-side
  // slide-in sheet, same pattern as the brands page.
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    if (menuOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  // Prefetch both destination routes so the post-transition navigation isn't
  // gated on a cold bundle.
  useEffect(() => {
    router.prefetch('/brands?from=splash');
    router.prefetch('/creatives?from=beam');
  }, [router]);

  useEffect(() => {
    const ok =
      window.matchMedia('(min-width: 768px)').matches &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setEnableLoop(ok);
  }, []);

  const onPathClick = (path: TransitionPath) => (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Modifier-clicks open in a new tab - leave default behaviour intact.
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    if (leaving) return;
    // Clear the creatives intro's "seen this session" flag whenever the
    // user re-enters via the cinematic transition. Without this, a
    // splash → creatives → splash → creatives cycle in the same tab
    // would skip the intro on the second arrival even though the user
    // just sat through the 3.2s transition expecting it. IntroOverlay
    // re-writes the flag the moment it starts, so React strict-mode's
    // double-mount protection still works.
    if (path === 'creative') {
      try { sessionStorage.removeItem('beacon.creatives.introSession.v1'); } catch {}
    }
    setLeaving(path);
  };

  return (
    <section className={s.hero} data-hover={hover ?? 'none'}>
      <ArrivalWash />
      {navWashOverlay}
      {/* Preload the transition videos as soon as the splash mounts so they
          play instantly when a path is clicked. Browser caches both MP4s
          opportunistically alongside the hero image. Also warm the cache
          for the creatives-page intro so the user lands into a fully
          loaded cinematic on the destination, not a buffering one. */}
      {/* Preload the version the visitor will actually play. Mobile gets
          the ~150-260KB variants; desktop gets the 1080p originals. Media
          queries on <link rel=preload> are honoured by all evergreen
          browsers, so the wrong variant is never fetched. */}
      <link rel="preload" as="video" href="/assets/beacon-creative-transition-mobile.mp4" media="(max-width: 768px)" />
      <link rel="preload" as="video" href="/assets/beacon-brand-transition-mobile.mp4" media="(max-width: 768px)" />
      <link rel="preload" as="video" href="/assets/beacon-creative-landing-page-entry-mobile.mp4" media="(max-width: 768px)" />
      <link rel="preload" as="video" href="/assets/beacon-creative-transition.mp4" media="(min-width: 769px)" />
      <link rel="preload" as="video" href="/assets/beacon-brand-transition.mp4" media="(min-width: 769px)" />
      <link rel="preload" as="video" href="/assets/beacon-creative-landing-page-entry.mp4" media="(min-width: 769px)" />

      {/* Hero image - served via next/image for auto-WebP/AVIF and responsive
          sizing. priority puts it in the LCP critical path. Acts as the
          poster while the video loop loads, and as the persistent canvas on
          mobile / reduced-motion. */}
      <div className={s.heroImageWrap}>
        <Image
          src="/assets/beacon-landing-page.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className={s.heroImage}
        />
        {/* Ambient mist loop - palindromic, plays forever without a snap.
            Mounts only on desktop with motion allowed. Crossfades in once
            it has data so the swap from PNG to video is invisible. */}
        {enableLoop && (
          <video
            className={s.heroLoop}
            src="/assets/beacon-landing-loop.mp4"
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            aria-hidden="true"
          />
        )}
        <div className={s.heroGradient} aria-hidden="true" />
        {/* Soft warm-dark vignette that covers the AI-tool watermark burned
            into the source PNG's bottom-right corner. */}
        <div className={s.heroWatermarkCover} aria-hidden="true" />
      </div>

      <div className={s.overlay}>
        {/* ─── Top bar ──────────────────────────────────────────────────── */}
        <nav className={s.heroNav}>
          {/* Logo doubles as a hard-refresh button. We're already on "/", so
              a normal Link does nothing on click. window.location.reload()
              gives the user the "reset the experience" affordance - page
              re-fades-in, cards re-stagger, etc. The arrow + warm glow on
              hover mirrors the creatives page wordmark so the affordance
              reads consistently across the site. */}
          <button
            type="button"
            className={s.heroLogo}
            onClick={() => window.location.reload()}
            aria-label="Refresh home"
          >
            {/* Arrow chevron removed - it was a "back" affordance that
                made no sense on the home page itself. Matches the
                /creatives mobile wordmark which also reads as just the
                logo image (its arrow is hover-only and never shown on
                touch devices). */}
            <img src="/assets/beacon-logo.png" alt="Beacon Media Solutions" />
          </button>
          <div className={`${s.heroNavLinks} ${s.heroNavLinksDesktop}`}>
            <Link
              href="/brands?from=splash"
              className={s.heroNavLink}
              onClick={onPathClick('brand')}
            >
              For Brands
            </Link>
            <Link
              href="/creatives?from=beam"
              className={s.heroNavLink}
              onClick={onPathClick('creative')}
            >
              For Creatives
            </Link>
            <Link
              href="/about?from=splash"
              className={s.heroNavLink}
              onClick={(e) => {
                if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
                e.preventDefault();
                navWash('/about?from=splash');
              }}
            >
              About
            </Link>
            <Link
              href="/contact?from=splash"
              className={s.heroNavLink}
              onClick={(e) => {
                if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
                e.preventDefault();
                navWash('/contact?from=splash');
              }}
            >
              Contact
            </Link>
          </div>
          <button
            type="button"
            className={s.hamburger}
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            aria-expanded={menuOpen}
          >
            <span aria-hidden="true" />
            <span aria-hidden="true" />
          </button>
        </nav>

        {/* Mobile side menu */}
        <div
          className={`${s.menuBackdrop} ${menuOpen ? s.menuBackdropOpen : ''}`}
          onClick={() => setMenuOpen(false)}
          aria-hidden={!menuOpen}
        />
        <aside
          className={`${s.sideMenu} ${menuOpen ? s.sideMenuOpen : ''}`}
          aria-hidden={!menuOpen}
          aria-label="Mobile navigation"
        >
          <button
            type="button"
            className={s.sideMenuClose}
            onClick={() => setMenuOpen(false)}
            aria-label="Close menu"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
          <nav className={s.sideMenuNav} aria-label="Primary mobile">
            <Link
              href="/brands?from=splash"
              onClick={(e) => {
                if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
                e.preventDefault();
                setMenuOpen(false);
                if (!leaving) setLeaving('brand');
              }}
            >
              For Brands
            </Link>
            <Link
              href="/creatives?from=beam"
              onClick={(e) => {
                if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
                e.preventDefault();
                setMenuOpen(false);
                try { sessionStorage.removeItem('beacon.creatives.introSession.v1'); } catch {}
                if (!leaving) setLeaving('creative');
              }}
            >
              For Creatives
            </Link>
            <Link
              href="/about?from=splash"
              onClick={(e) => {
                if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
                e.preventDefault();
                setMenuOpen(false);
                navWash('/about?from=splash');
              }}
            >
              About
            </Link>
            <Link
              href="/contact?from=splash"
              onClick={(e) => {
                if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
                e.preventDefault();
                setMenuOpen(false);
                navWash('/contact?from=splash');
              }}
            >
              Contact
            </Link>
          </nav>
          <div className={s.sideMenuConnect}>
            <p className={s.sideMenuLabel}>Connect</p>
            <a href="mailto:info@beaconmediasolutions.com">info@beaconmediasolutions.com</a>
          </div>
        </aside>

        {/* ─── Wordmark + tagline ───────────────────────────────────────── */}
        <div className={s.heroWordmark}>
          <h1 className={s.heroTitle}>BEACON</h1>
          <p className={s.heroTagline}>Empowering creatives. Elevating brands.</p>
        </div>

        {/* ─── Two path cards ───────────────────────────────────────────── */}
        <div className={s.paths}>
          <Link
            href="/brands?from=splash"
            className={s.pathMarker}
            onMouseEnter={() => setHover('brand')}
            onMouseLeave={() => setHover(null)}
            onFocus={() => setHover('brand')}
            onBlur={() => setHover(null)}
            onClick={onPathClick('brand')}
            aria-describedby="brand-sub"
          >
            <span className={s.pathLabel}>I&rsquo;m a Brand</span>
            <span className={s.pathSub} id="brand-sub">
              Find creative talent or production services for your team
            </span>
            <span className={s.pathArrow}>
              Enter <span aria-hidden="true">→</span>
            </span>
          </Link>

          <Link
            href="/creatives?from=beam"
            className={s.pathMarker}
            onMouseEnter={() => setHover('creative')}
            onMouseLeave={() => setHover(null)}
            onFocus={() => setHover('creative')}
            onBlur={() => setHover(null)}
            onClick={onPathClick('creative')}
            aria-describedby="creative-sub"
          >
            <span className={s.pathLabel}>I&rsquo;m a Creative</span>
            <span className={s.pathSub} id="creative-sub">
              Get connected with vetted clients and ongoing work
            </span>
            <span className={s.pathArrow}>
              Enter <span aria-hidden="true">→</span>
            </span>
          </Link>
        </div>

        {/* ─── Copyright ──────────────────────────────────────────────────
            Quiet corner mark - signals "real business" without competing
            with the centred tagline or the two path cards. Designer
            credit sits on the same line so the footer stays one piece
            of chrome, not two stacked items. */}
        <p className={s.copyright}>
          © {new Date().getFullYear()} Beacon Media Solutions. All rights reserved.
          <span className={s.copyrightSep} aria-hidden="true"> · </span>
          Designed by Kairos Cheng
        </p>
      </div>

      {/* Cinematic transition - mounts only after a path is clicked. Plays
          the path-specific MP4, fades a color wash to full opacity at the
          right beat, then pushes the route. Mobile + reduced-motion skip
          the video and fall back to a 600ms color fade. */}
      {leaving && <TransitionOverlay path={leaving} />}
    </section>
  );
}
