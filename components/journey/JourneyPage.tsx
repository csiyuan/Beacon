'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import s from './journey.module.css';
import { useNavWash } from '@/components/transitions/NavWash';
import ArrivalWash from '@/components/transitions/ArrivalWash';
import { useLenisScroll } from '@/lib/useLenisScroll';
import { useCountUp } from '@/lib/useCountUp';

/* ─────────────────────────────────────────────────────────────────────────
   <JourneyPage> - flyward.com-inspired single-page layout used by both
   creative pathway pages (Embedded and Project-based). The caller supplies
   pathway-specific copy (hero, milestones, end CTA); shared chrome (nav,
   pathway switcher, footer, scroll-driven SVG path animation) lives here.
   ───────────────────────────────────────────────────────────────────────── */

export type Milestone = {
  eyebrow: string;
  title: React.ReactNode;
  body: React.ReactNode;
  features?: string[];
  /** Optional cinematic image rendered on the opposite side of the spine
   *  from the text content - alternates left/right with the milestone
   *  layout so the page reads as a meandering reel. */
  image?: { src: string; alt: string };
};

export type Guarantee = {
  title: string;
  body: string;
};

export type Faq = {
  q: string;
  a: React.ReactNode;
};

export type PathwayKey = 'embedded' | 'projects';

export type Stat = { value: string; label: string; caption?: string };

/* Shared comparison data for the "Which one fits you?" decision table.
   Lives next to <JourneyPage> rather than at each page level so the two
   pathway pages can never drift apart - editing this single array
   updates both pages in lockstep. */
const PATHWAY_COMPARISON: { label: string; embedded: string; projects: string }[] = [
  {
    label: 'Employer',
    embedded: 'Beacon - you sit on the brand’s team',
    projects: 'Beacon - per project, per brief',
  },
  {
    label: 'Schedule',
    embedded: 'Full-time inside one brand',
    projects: 'Per-brief, when it fits your week',
  },
  {
    label: 'Pay model',
    embedded: 'Monthly salary + statutory CPF',
    projects: 'Day rate, NET-15 from delivery',
  },
  {
    label: 'Benefits',
    embedded: 'Healthcare, paid leave, training stipend',
    projects: 'Right of refusal, scope guardrails, kill fees',
  },
  {
    label: 'Commitment',
    embedded: 'Two-week notice, walk away clean',
    projects: 'None - take or skip month to month',
  },
  {
    label: 'Best for',
    embedded: 'Career inside one brand you’d return calls for',
    projects: 'Range of briefs across brands, kept the freelance flex',
  },
];

interface Props {
  pathway: PathwayKey;
  /** Optional - the pathway switcher already labels the active pathway,
   *  so the eyebrow tends to repeat the switcher on the pathway pages.
   *  Pass it only when you actually want a separate editorial label. */
  heroEyebrow?: string;
  heroTitle: React.ReactNode;
  heroSub: React.ReactNode;
  primaryCta: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  milestones: Milestone[];
  /** Optional concrete commitments rendered as a grid of promise cards
   *  after the journey - concrete numbers and policy guarantees give the
   *  page tangible credibility. */
  guarantees?: { sectionLabel: string; heading: React.ReactNode; items: Guarantee[] };
  /** Optional 3-up stats band rendered right after the journey. Concrete
   *  numbers (creatives placed, brand partners, avg tenure) carry more
   *  weight than adjectives - this is where they belong. */
  stats?: { sectionLabel?: string; heading?: React.ReactNode; items: Stat[] };
  /** Optional "built for / not built for" mini-section. Disqualifying
   *  expectations help the wrong-fit reader self-select out and make the
   *  page feel honest. */
  fit?: {
    sectionLabel: string;
    heading: React.ReactNode;
    forItems: string[];
    notForItems: string[];
  };
  /** Optional sectors-served strip - a row of industry tags that signals
   *  who Beacon already places work into. */
  sectors?: { sectionLabel: string; heading: React.ReactNode; items: string[] };
  /** Optional FAQ list - the questions creatives actually ask before
   *  applying, answered plainly. */
  faqs?: { sectionLabel: string; heading: React.ReactNode; items: Faq[] };
  /** Optional intake form rendered between the FAQ and the testimonial.
   *  Receives a fully-built form node so each pathway can ship its own
   *  field set (Embedded → CV + craft + availability; Project-based →
   *  day rate + capacity + project types). The form should use the
   *  global .cf-* classes from the destination overlay - JourneyPage
   *  wraps the prop in a .dest.show.destStatic container so those
   *  classes resolve to the same visual treatment as the brand page. */
  intakeForm?: { sectionLabel: string; heading: React.ReactNode; form: React.ReactNode };
  /** Optional testimonial rendered between the journey and the end CTA band.
   *  Both pathway pages carry the original creative-destination testimonial
   *  ("Working with Beacon gave me more than just a job...") which gives
   *  the journey a human anchor before the final call-to-action. */
  testimonial?: { quote: React.ReactNode; cite: string };
  endTitle: React.ReactNode;
  endSub: React.ReactNode;
  endActions: { label: string; href: string; ghost?: boolean }[];
}

export default function JourneyPage({
  pathway,
  heroEyebrow,
  heroTitle,
  heroSub,
  primaryCta,
  secondaryCta,
  milestones,
  guarantees,
  stats,
  fit,
  sectors,
  faqs,
  intakeForm,
  testimonial,
  endTitle,
  endSub,
  endActions,
}: Props) {
  const router = useRouter();
  const year = new Date().getFullYear();
  // Shared cream-wash transition for the top-left wordmark click. Same
  // visual treatment used on /brands, /creatives, and elsewhere - keeps
  // every "back to home" feel consistent across the site.
  const { trigger: navWash, overlay: navWashOverlay } = useNavWash();
  // Buttery smooth scroll across the whole journey page - hijacks
  // wheel/trackpad and lerps the scroll position for a weighted glide.
  useLenisScroll();

  // Mobile hamburger menu - ported from the brands page so the journey
  // pathway pages get the same nav treatment on phones (inline nav hides
  // under 760px, hamburger reveals a right-side slide-in sheet). Without
  // this the "For Brands / About / Contact" links wrap awkwardly at
  // iPhone-SE width.
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);
  // Tag the body for journey-scoped styles.
  useEffect(() => {
    document.body.classList.add('route-journey');
    return () => document.body.classList.remove('route-journey');
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen]);
  // Pathway-switch transition - clicking the OTHER pathway in the switcher
  // routes through the shared cream-flash navWash so the hop matches every
  // other inter-page transition across the site.
  const handlePathwaySwitch = (
    e: React.MouseEvent<HTMLAnchorElement>,
    target: PathwayKey,
    href: string,
  ) => {
    if (target === pathway) {
      e.preventDefault();
      return;
    }
    e.preventDefault();
    navWash(href);
  };
  // Active step index - which milestone's image is currently pinned. Driven
  // by an IntersectionObserver on the text blocks: as a block crosses the
  // viewport centre, it becomes active and its image crossfades in.
  const [activeStep, setActiveStep] = useState(0);
  // isInJourney - true when ANY chapter is on screen (any milestone
  // intersection-observer ratio > 0). Used to fade the sticky chapter
  // index in only while the user is reading the journey, hide it on
  // the hero and the sections below.
  const [isInJourney, setIsInJourney] = useState(false);
  const milestoneRefs = useRef<(HTMLElement | null)[]>([]);
  const journeyRef = useRef<HTMLElement>(null);

  // Milestone reveal is now driven by the scroll handler (below) - text and
  // images fade in as the orb passes each milestone's anchor on the path,
  // not when the article enters the viewport. This effect just handles the
  // reduced-motion fallback: instantly reveal every milestone so users who
  // opt out of animation never see empty stages.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      milestoneRefs.current.forEach((el) => el && el.classList.add(s.in));
    }
  }, []);

  // Scroll-reveal observer for everything below the journey (compare
  // table rows, stats tiles, fit cards, sector tags, etc.). Any element
  // tagged with the `.reveal` class fades + slides into place when it
  // crosses the viewport, once. Self-disconnects per element after
  // reveal so we're not paying for inactive observers on a long page.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const targets = document.querySelectorAll<HTMLElement>(`.${s.reveal}`);
    if (targets.length === 0) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add(s.revealIn);
            obs.unobserve(e.target);
          }
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.12 },
    );
    targets.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  // Programmatically scroll the nth chapter to the centre of the
  // viewport. Wired to the floating prev/next buttons + dot navigator
  // only - native scroll is left untouched, so the user's wheel/swipe
  // flows naturally through the page without being hijacked. Smoothness
  // comes from CSS scroll-behavior + the IntersectionObserver reveal
  // animations, not from JS scroll interception.
  const scrollToChapter = (index: number) => {
    const clamped = Math.max(0, Math.min(index, milestones.length - 1));
    const el = milestoneRefs.current[clamped];
    if (!el) return;
    setActiveStep(clamped);
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  // IntersectionObserver tracks which text block is currently crossing
  // the viewport's centre band. When a block enters that band, it
  // becomes the active step and its image crossfades in on the sticky
  // left column. rootMargin clips the trigger zone to roughly the
  // middle 40% of the viewport (top -30%, bottom -30%) so the active
  // step changes precisely when the reader's eye is on it, not before
  // and not after.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const obs = new IntersectionObserver(
      (entries) => {
        // Pick the entry with the highest intersection ratio - handles
        // the case where two text blocks are partially visible during
        // the crossover; whichever is more "in the band" wins.
        let best: IntersectionObserverEntry | null = null;
        let anyIntersecting = false;
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          anyIntersecting = true;
          if (!best || e.intersectionRatio > best.intersectionRatio) best = e;
        });
        // Toggle the sticky chapter index: visible only when ANY chapter
        // is in the trigger zone; hidden on the hero and the sections
        // after the journey.
        if (anyIntersecting) setIsInJourney(true);
        if (best) {
          const idx = Number((best as IntersectionObserverEntry).target.getAttribute('data-step'));
          if (!Number.isNaN(idx)) setActiveStep(idx);
        }
      },
      { rootMargin: '-30% 0px -30% 0px', threshold: [0, 0.25, 0.5, 0.75, 1] },
    );
    milestoneRefs.current.forEach((el) => el && obs.observe(el));

    // Parallel observer on the journey section itself - used to flip
    // isInJourney off once the user has scrolled past the journey
    // (the per-chapter observer can't fire a "left everything" event
    // by itself because IntersectionObserver only fires on enter/leave
    // per-target, and we don't know if a "leave" means "moved to next"
    // or "left the whole journey").
    const journey = journeyRef.current;
    let sectionObs: IntersectionObserver | null = null;
    if (journey) {
      sectionObs = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            setIsInJourney(e.isIntersecting && e.intersectionRatio > 0.1);
          });
        },
        { threshold: [0, 0.05, 0.1, 0.2] },
      );
      sectionObs.observe(journey);
    }

    return () => {
      obs.disconnect();
      sectionObs?.disconnect();
    };
  }, [milestones.length]);

  return (
    <main className={s.page}>
      {/* Dark colour matches the journey-page background so the inbound
          fade-out from /creatives's pathway transition is seamless. */}
      <ArrivalWash color="#07060a" />
      {navWashOverlay}
      {/* Cinematic top chrome - matches the destination overlay's
          wordmark-btn pattern from the original /creatives 3D scene.
          Logo doubles as a return-home button; the back-arrow slides in
          on hover. Nav links are sans-caps with wide tracking, no top
          CTA pill, so the page reads as a film title card rather than a
          corporate header. */}
      {/* Top bar - matches the creatives page chrome (global .bar / .wordmark /
          .top-nav classes). Wordmark is logo-only (no "BEACON" text), arrow
          slides in on hover. Nav has just For Brands / About / Contact. */}
      <div className="bar">
        <button
          type="button"
          className="wordmark wordmark-btn"
          aria-label="Back to home"
          onClick={() => navWash('/')}
        >
          <span className="wm-arrow" aria-hidden="true">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 6l-6 6 6 6" />
            </svg>
          </span>
          <img className="wm-logo" src="/assets/beacon-logo.png" alt="Beacon Media Solutions" />
        </button>
        <nav className={`top-nav ${s.topNavDesktop}`} aria-label="Primary">
          <Link
            href="/brands"
            onClick={(e) => {
              if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
              e.preventDefault();
              navWash('/brands');
            }}
          >
            For Brands
          </Link>
          <Link
            href="/about?from=creatives"
            onClick={(e) => {
              if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
              e.preventDefault();
              navWash('/about?from=creatives');
            }}
          >
            About
          </Link>
          <Link
            href="/contact?from=creatives"
            onClick={(e) => {
              if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
              e.preventDefault();
              navWash('/contact?from=creatives');
            }}
          >
            Contact
          </Link>
        </nav>
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
      </div>

      {/* Mobile side menu - slide-in sheet from the right with the same nav
          links plus a connect block. Backdrop dims the page and closes
          the menu on tap. Body scroll is locked while open. */}
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
            href="/brands"
            onClick={(e) => {
              if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
              e.preventDefault();
              setMenuOpen(false);
              navWash('/brands');
            }}
          >
            For Brands
          </Link>
          <Link
            href="/about?from=creatives"
            onClick={(e) => {
              if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
              e.preventDefault();
              setMenuOpen(false);
              navWash('/about?from=creatives');
            }}
          >
            About
          </Link>
          <Link
            href="/contact?from=creatives"
            onClick={(e) => {
              if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
              e.preventDefault();
              setMenuOpen(false);
              navWash('/contact?from=creatives');
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

      <section className={`${s.container} ${s.hero}`}>
        {/* Pathway switcher - sits right under the eyebrow so a creative
            who landed on the wrong pathway can swap immediately. */}
        <div className={s.switcher} role="tablist" aria-label="Pathway">
          <Link
            href="/creatives/embedded"
            role="tab"
            aria-selected={pathway === 'embedded'}
            className={`${s.switcherLink} ${pathway === 'embedded' ? s.active : ''}`}
            onClick={(e) => handlePathwaySwitch(e, 'embedded', '/creatives/embedded')}
          >
            Embedded
          </Link>
          <Link
            href="/creatives/projects"
            role="tab"
            aria-selected={pathway === 'projects'}
            className={`${s.switcherLink} ${pathway === 'projects' ? s.active : ''}`}
            onClick={(e) => handlePathwaySwitch(e, 'projects', '/creatives/projects')}
          >
            Project-based
          </Link>
        </div>

        {heroEyebrow && <p className={s.heroEyebrow}>{heroEyebrow}</p>}
        <h1 className={s.heroTitle}>{heroTitle}</h1>
        <p className={s.heroSub}>{heroSub}</p>
        <div className={s.heroActions}>
          <Link href={primaryCta.href} className={s.cta}>
            {primaryCta.label}
          </Link>
          {secondaryCta && (
            <a href={secondaryCta.href} className={`${s.cta} ${s.ctaGhost}`}>{secondaryCta.label}</a>
          )}
        </div>
      </section>

      {/* Simple stacked journey - chapters render one after another in a
          single column with no decorative spine, traveling orb, or
          connector lines between them. Each chapter is its own card with
          number, eyebrow, title, body, features, and (optionally) image. */}
      <section ref={journeyRef} id="journey" className={s.fullJourney}>
        {/* Edge fade overlays - top + bottom gradient masks that appear
            when the journey section is partially scrolled into view, so
            content fades into/out of the section boundaries instead of
            cutting hard. Same idiom as the Scroller component's edge
            overlays. */}
        <div className={`${s.journeyFadeTop} ${activeStep > 0 ? s.journeyFadeOn : ''}`} aria-hidden="true" />
        <div className={`${s.journeyFadeBottom} ${activeStep < milestones.length - 1 ? s.journeyFadeOn : ''}`} aria-hidden="true" />
        {/* Floating prev / next buttons - pinned to the right edge of
            the viewport while the user is reading the journey. Tapping
            either smooth-scrolls the previous/next chapter to centre,
            matching the Scroller's button-driven nav idiom. */}
        <div
          className={`${s.journeyNav} ${isInJourney ? s.journeyNavVisible : ''}`}
          aria-hidden={!isInJourney}
        >
          <button
            type="button"
            className={s.journeyNavBtn}
            onClick={() => scrollToChapter(activeStep - 1)}
            disabled={activeStep <= 0}
            aria-label="Previous chapter"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M3 10l5-5 5 5" />
            </svg>
          </button>
          <div className={s.journeyNavDots} aria-hidden="true">
            {milestones.map((_, i) => (
              <button
                key={i}
                type="button"
                className={`${s.journeyNavDot} ${i === activeStep ? s.journeyNavDotActive : ''}`}
                onClick={() => scrollToChapter(i)}
                aria-label={`Jump to chapter ${i + 1}`}
              />
            ))}
          </div>
          <button
            type="button"
            className={s.journeyNavBtn}
            onClick={() => scrollToChapter(activeStep + 1)}
            disabled={activeStep >= milestones.length - 1}
            aria-label="Next chapter"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M3 6l5 5 5-5" />
            </svg>
          </button>
        </div>
        <div className={`${s.container} ${s.flowJourneyInner}`}>
          {milestones.map((m, i) => {
            // Alternating image side on desktop - even chapters have the
            // image on the right (default), odd chapters on the left.
            // Adds rhythm to the column without bringing back the spine.
            const isReverse = i % 2 === 1;
            return (
              <div key={i} className={s.flowChapterWrap}>
                <article
                  ref={(el) => { milestoneRefs.current[i] = el; }}
                  className={`${s.flowChapter} ${isReverse ? s.flowChapterReverse : ''} ${i === activeStep ? s.flowChapterActive : ''}`}
                  data-step={i}
                >
                  <div className={s.flowChapterGroup}>
                    <div className={s.flowChapterContent}>
                      <span className={s.flowChapterNum} aria-hidden="true">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <p className={s.flowChapterEyebrow}>{m.eyebrow}</p>
                      <h2 className={s.flowChapterTitle}>{m.title}</h2>
                      <p className={s.flowChapterBody}>{m.body}</p>
                      {m.features && m.features.length > 0 && (
                        <ul className={s.flowChapterFeatures}>
                          {m.features.map((f, fi) => <li key={fi}>{f}</li>)}
                        </ul>
                      )}
                    </div>
                    {m.image && (
                      <figure className={s.flowChapterImage}>
                        <div className={s.flowChapterImageFrame}>
                          <img
                            src={m.image.src}
                            alt={m.image.alt}
                            loading={i < 2 ? undefined : 'lazy'}
                          />
                        </div>
                      </figure>
                    )}
                  </div>
                </article>
                {/* Hairline divider with a centred gold dot - sits between
                    consecutive chapters as a quiet "next" beat. Hidden
                    after the final chapter. */}
                {i < milestones.length - 1 && (
                  <div className={s.flowChapterDivider} aria-hidden="true">
                    <span className={s.flowChapterDividerDot} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Sticky chapter index - pinned to the bottom-right, fades in only
          while the user is reading the journey. Shows current step + total
          + the active chapter's eyebrow as a navigation anchor. */}
      <div
        className={`${s.chapterIndex} ${isInJourney ? s.chapterIndexVisible : ''}`}
        aria-hidden={!isInJourney}
      >
        <div className={s.chapterIndexNumRow}>
          <span className={s.chapterIndexNum}>
            {String(Math.min(activeStep + 1, milestones.length)).padStart(2, '0')}
          </span>
          <span className={s.chapterIndexDivider}>/</span>
          <span className={s.chapterIndexTotal}>
            {String(milestones.length).padStart(2, '0')}
          </span>
        </div>
        <span className={s.chapterIndexLabel}>
          {milestones[activeStep]?.eyebrow}
        </span>
      </div>

      {/* Pathway comparison table - sits immediately after the journey
          so the decision moment lands right when the reader has finished
          absorbing the pathway story. Shared structural data lives in
          PATHWAY_COMPARISON; only the highlighted column changes between
          pages, driven by the `pathway` prop. */}
      <section className={`${s.container} ${s.extraSection}`}>
        <p className={`${s.extraSectionLabel} ${s.reveal}`}>The two pathways</p>
        <h2 className={`${s.extraSectionHeading} ${s.reveal}`}>
          <em>Embedded</em> vs <em>Project-based</em> — which one fits you?
        </h2>
        <div className={s.compareTable} role="table">
          {/* Column header row - empty corner cell on the left, then the
              two pathway titles. Without this strip the reader can't tell
              which column maps to which pathway until they read the cells. */}
          <div className={s.compareHead} role="row">
            <div className={s.compareCorner} role="columnheader" aria-hidden="true" />
            <div
              className={`${s.compareColHead} ${pathway === 'embedded' ? s.compareColActive : ''}`}
              role="columnheader"
            >
              <span className={s.compareColLabel}>Pathway A</span>
              <span className={s.compareColName}>Embedded</span>
            </div>
            <div
              className={`${s.compareColHead} ${pathway === 'projects' ? s.compareColActive : ''}`}
              role="columnheader"
            >
              <span className={s.compareColLabel}>Pathway B</span>
              <span className={s.compareColName}>Project-based</span>
            </div>
          </div>
          {PATHWAY_COMPARISON.map((row, i) => (
            <div key={i} className={`${s.compareRow} ${s.reveal}`} role="row" style={{ transitionDelay: `${i * 60}ms` }}>
              <div className={s.compareRowLabel} role="rowheader">{row.label}</div>
              <div
                className={`${s.compareCell} ${pathway === 'embedded' ? s.compareCellActive : ''}`}
                role="cell"
                data-pathway="Embedded"
              >
                {row.embedded}
              </div>
              <div
                className={`${s.compareCell} ${pathway === 'projects' ? s.compareCellActive : ''}`}
                role="cell"
                data-pathway="Project-based"
              >
                {row.projects}
              </div>
            </div>
          ))}
        </div>
        <div className={s.compareSwitch}>
          {pathway === 'embedded' ? (
            <Link href="/creatives/projects" className={`${s.cta} ${s.ctaGhost}`}>
              Switch to project-based
            </Link>
          ) : (
            <Link href="/creatives/embedded" className={`${s.cta} ${s.ctaGhost}`}>
              Switch to embedded
            </Link>
          )}
        </div>
      </section>

      {stats && stats.items.length > 0 && (
        // Stats band - 3-up tile of concrete figures. Numbers carry the
        // weight that adjectives can't; this is where the page earns the
        // claims made above it in the journey.
        <section className={`${s.container} ${s.extraSection}`}>
          {stats.sectionLabel && <p className={s.extraSectionLabel}>{stats.sectionLabel}</p>}
          {stats.heading && <h2 className={s.extraSectionHeading}>{stats.heading}</h2>}
          <div className={s.statsBand}>
            {stats.items.map((stat, i) => (
              <StatTile key={i} stat={stat} index={i} />
            ))}
          </div>
        </section>
      )}

      {fit && (
        // Fit panel - two columns ("Built for" / "Not built for"). Honest
        // disqualification helps the wrong-fit reader self-select out and
        // makes the page feel less like marketing.
        <section className={`${s.container} ${s.extraSection}`}>
          <p className={s.extraSectionLabel}>{fit.sectionLabel}</p>
          <h2 className={s.extraSectionHeading}>{fit.heading}</h2>
          <div className={s.fitGrid}>
            <div className={`${s.fitCol} ${s.fitColFor} ${s.reveal}`}>
              <div className={s.fitColHead}>
                <span className={s.fitMark} aria-hidden="true">✓</span>
                <span className={s.fitColTitle}>Built for</span>
              </div>
              <ul className={s.fitList}>
                {fit.forItems.map((item, i) => <li key={i}>{item}</li>)}
              </ul>
            </div>
            <div className={`${s.fitCol} ${s.fitColNot} ${s.reveal}`} style={{ transitionDelay: '120ms' }}>
              <div className={s.fitColHead}>
                <span className={s.fitMark} aria-hidden="true">-</span>
                <span className={s.fitColTitle}>Not built for</span>
              </div>
              <ul className={s.fitList}>
                {fit.notForItems.map((item, i) => <li key={i}>{item}</li>)}
              </ul>
            </div>
          </div>
        </section>
      )}

      {guarantees && (
        <section className={`${s.container} ${s.extraSection}`}>
          <p className={s.extraSectionLabel}>{guarantees.sectionLabel}</p>
          <h2 className={s.extraSectionHeading}>{guarantees.heading}</h2>
          <div className={s.guaranteeGrid}>
            {guarantees.items.map((g, i) => (
              <article key={i} className={s.guaranteeCard}>
                <h3 className={s.guaranteeTitle}>{g.title}</h3>
                <p className={s.guaranteeBody}>{g.body}</p>
              </article>
            ))}
          </div>
        </section>
      )}

      {sectors && (
        <section className={`${s.container} ${s.extraSection}`}>
          <p className={s.extraSectionLabel}>{sectors.sectionLabel}</p>
          <h2 className={s.extraSectionHeading}>{sectors.heading}</h2>
          <ul className={s.sectorList}>
            {sectors.items.map((sec, i) => (
              <li key={sec} className={`${s.sectorTag} ${s.reveal}`} style={{ transitionDelay: `${i * 40}ms` }}>{sec}</li>
            ))}
          </ul>
        </section>
      )}


      {faqs && (
        // Two-column FAQ layout: section label + heading on the left,
        // accordion list on the right. Replaces the centered list under
        // a left-aligned title (which left awkward dead space on the
        // right of the title row).
        <section className={`${s.container} ${s.extraSection} ${s.faqSection}`}>
          <div className={s.faqHead}>
            <p className={s.extraSectionLabel}>{faqs.sectionLabel}</p>
            <h2 className={s.extraSectionHeading}>{faqs.heading}</h2>
            {/* Soft fallback CTA - catches the reader who scanned the
                FAQ and didn't find their question. Lives under the
                heading in the left column so it fills the empty space
                created by the (taller) accordion on the right. */}
            <div className={s.faqContact}>
              <p className={s.faqContactPrompt}>Don't see your question?</p>
              <a className={s.faqContactLink} href="mailto:info@beaconmediasolutions.com">
                info@beaconmediasolutions.com
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </a>
            </div>
          </div>
          <div className={s.faqList}>
            {faqs.items.map((f, i) => (
              // Native <details>/<summary> gives free keyboard + screen-
              // reader accessibility for the expand/collapse behaviour,
              // plus a free open/closed state that CSS can target via
              // [open]. Shared `name` makes the group behave like an
              // exclusive accordion - opening one auto-closes the others.
              <details key={i} className={`${s.faqRow} ${s.reveal}`} style={{ transitionDelay: `${i * 60}ms` }} name={`faq-${pathway}`}>
                <summary className={s.faqQ}>
                  <span className={s.faqQText}>{f.q}</span>
                  <span className={s.faqChevron} aria-hidden="true">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </span>
                </summary>
                <div className={s.faqA}>{f.a}</div>
              </details>
            ))}
          </div>
        </section>
      )}

      {testimonial && (
        <section className={`${s.container} ${s.testimonialBand}`}>
          <blockquote className={s.testimonialQuote}>
            <svg className={s.testimonialMark} width="42" height="36" viewBox="0 0 42 36" aria-hidden="true">
              <path d="M0 36V20.4c0-6.4 1.4-11.4 4.2-15S11 0 16 0v6c-3.2 0-5.6 1-7.2 3s-2.4 4.4-2.4 7.2v.6h9V36H0zm24 0V20.4c0-6.4 1.4-11.4 4.2-15S35 0 40 0v6c-3.2 0-5.6 1-7.2 3s-2.4 4.4-2.4 7.2v.6h9V36H24z" fill="currentColor"/>
            </svg>
            <p>{testimonial.quote}</p>
            <cite>{testimonial.cite}</cite>
          </blockquote>
        </section>
      )}

      {intakeForm && (
        <section className={`${s.container} ${s.extraSection}`} id="apply">
          <p className={s.extraSectionLabel}>{intakeForm.sectionLabel}</p>
          <h2 className={s.extraSectionHeading}>{intakeForm.heading}</h2>
          {/* The intake form uses the global `.cf-*` classes from the
              destination overlay so it visually matches the brand page's
              intake screen. The .dest.show.destStatic wrapper opts into
              those styles while neutralising .dest's fixed positioning
              (the global rule was authored for the immersive 3D scene).
              See journey.module.css .destStatic for the overrides. */}
          <div className={`dest show ${s.destStatic}`}>
            {intakeForm.form}
          </div>
        </section>
      )}

      <section className={s.endBand}>
        <div className={s.container}>
          <h2 className={s.endTitle}>{endTitle}</h2>
          <p className={s.endSub}>{endSub}</p>
          <div className={s.endActions}>
            {endActions.map((a, i) => (
              <Link
                key={i}
                href={a.href}
                className={`${s.cta} ${a.ghost ? s.ctaGhost : ''}`}
              >
                {a.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Cinematic footer - centered wordmark / spark divider / nav + connect
          block. Centered on every viewport so the creative side matches the
          brand side exactly. Module classes (no .dest wrapper) so we stay
          out of the destination-overlay positioning rules. */}
      <footer className={s.destFooter}>
        <div className={s.container}>
          <div className={s.ftMark}>BEACON</div>
          <div className={s.ftTagline}>EMPOWERING CREATIVES. ELEVATING BRANDS.</div>

          <div className={s.ftDivider} aria-hidden="true">
            <span className={s.ftRuleLeft}></span>
            <svg className={s.ftSpark} width="14" height="14" viewBox="0 0 14 14">
              <path d="M7 0 L8.2 5.8 L14 7 L8.2 8.2 L7 14 L5.8 8.2 L0 7 L5.8 5.8 Z" fill="currentColor" />
            </svg>
            <span className={s.ftRuleRight}></span>
          </div>

          <div className={s.ftCols}>
            <div className={s.ftCol}>
              <div className={s.ftLabel}>Navigate</div>
              <Link
                href="/"
                onClick={(e) => {
                  if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
                  e.preventDefault();
                  navWash('/');
                }}
              >
                Home
              </Link>
              <Link
                href="/about?from=creatives"
                onClick={(e) => {
                  if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
                  e.preventDefault();
                  navWash('/about?from=creatives');
                }}
              >
                About
              </Link>
              <Link
                href="/contact?from=creatives"
                onClick={(e) => {
                  if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
                  e.preventDefault();
                  navWash('/contact?from=creatives');
                }}
              >
                Contact
              </Link>
            </div>
            <div className={s.ftCol}>
              <div className={s.ftLabel}>Pathways</div>
              <Link
                href="/brands"
                onClick={(e) => {
                  if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
                  e.preventDefault();
                  navWash('/brands');
                }}
              >
                For Brands
              </Link>
              <Link
                href="/creatives/embedded"
                onClick={(e) => {
                  if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
                  e.preventDefault();
                  navWash('/creatives/embedded');
                }}
              >
                For Creatives
              </Link>
            </div>
          </div>

          <div className={s.ftConnect}>
            <div className={s.ftLabel}>Connect</div>
            <a className={s.ftEmail} href="mailto:info@beaconmediasolutions.com">info@beaconmediasolutions.com</a>
            <div className={s.ftLocation}>
              141 Cecil Street #08-07<br />
              Tung Ann Association Building<br />
              Singapore 069541
            </div>
            <div className={s.ftSocial}>
              <a href="https://www.instagram.com/beaconmediasg/" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" stroke="none" /></svg>
              </a>
              <a href="https://www.linkedin.com/company/beacon-media-solutions/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z" /><rect x="2" y="9" width="4" height="12" /><circle cx="4" cy="4" r="2" /></svg>
              </a>
            </div>
          </div>

          <div className={s.ftMeta}>
            <span>© {year} Beacon Media Solutions. All rights reserved.</span>
            <span aria-hidden="true"> · </span>
            <span>Designed by Kairos Cheng</span>
          </div>
        </div>
      </footer>

    </main>
  );
}

/* Stat tile with count-up - parses leading integer from the value
   string (e.g. "50+" → 50) and animates 0 → 50 when the tile enters
   the viewport. Non-numeric values ("SG / SEA") render unchanged. */
function StatTile({ stat, index }: { stat: Stat; index: number }) {
  const { ref, text } = useCountUp(stat.value);
  return (
    <div
      ref={ref}
      className={`${s.statTile} ${s.reveal}`}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      <div className={s.statValue}>{text}</div>
      <div className={s.statLabel}>{stat.label}</div>
      {stat.caption && <div className={s.statCaption}>{stat.caption}</div>}
    </div>
  );
}

