'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import s from './journey.module.css';

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
  heroEyebrow: string;
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
  // Pathway-switch transition - clicking the OTHER pathway in the switcher
  // triggers a quick warm wash that brightens the page, then navigates.
  // Mirrors the splash → destination "brighten and arrive" idiom so the
  // hop between pathways feels intentional instead of a hard nav.
  const [pathwayWashing, setPathwayWashing] = useState(false);
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
    setPathwayWashing(true);
    // ~420ms = wash reaches peak just before the route swap, so the
    // destination's own paint takes over while the screen is still bright.
    window.setTimeout(() => router.push(href), 420);
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
  // SVG paths sharing the same `d`:
  //   - dimPath: dotted full-path guide, always visible. Also used by
  //     the scroll handler for length + getPointAtLength so the orb
  //     rides along the visible dotted line.
  //   - sparkleSegments: 3 stacked paths that together form a tapered
  //     comet trail. The lead path is bright + thick, each subsequent
  //     path lags slightly behind with lower opacity and thinner stroke
  //     so the streak reads as head -> tail instead of a uniform dash.
  // The orb (HTML, not SVG) rides along dimPath as the user scrolls.
  const dimRef = useRef<SVGPathElement>(null);
  const sparkleRefs = useRef<(SVGPathElement | null)[]>([]);
  const orbRef = useRef<HTMLDivElement>(null);
  const spineSvgRef = useRef<SVGSVGElement>(null);
  // Refs to each chapter's knot element so the scroll handler can
  // imperatively toggle the .Lit class the moment the orb crosses its
  // path position. We do this outside React state because re-rendering
  // every scroll frame would be wasteful and the burst keyframe should
  // fire as a precise impact moment, not on chapter-text intersection.
  const knotRefs = useRef<(HTMLSpanElement | null)[]>([]);
  // Refs to each chapter's image element for scroll-driven parallax.
  // The scroll handler shifts each image's translateY based on the
  // chapter's vertical position in the viewport - gives the images a
  // subtle depth-of-field feel as their chapter passes through.
  const imageRefs = useRef<(HTMLImageElement | null)[]>([]);

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

  // Ambient sparkle streak with a tapered comet tail. Three stacked
  // paths share the same `d`; each gets the same dashoffset animation
  // but starts with a small delay so the trailing paths lag behind the
  // head. Combined with descending stroke-width + opacity in CSS, this
  // reads as a comet (bright head -> fading tail) instead of a uniform
  // dash. Whip-fast easing accelerates through the curve and
  // decelerates at the bottom for more dynamic motion.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const segments = sparkleRefs.current.filter(Boolean) as SVGPathElement[];
    if (segments.length === 0) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      segments.forEach((seg) => { seg.style.opacity = '0'; });
      return;
    }
    const total = segments[0].getTotalLength();
    const sparkleLen = total * 0.07;
    const cycleMs = 2000;
    const anims: Animation[] = [];
    segments.forEach((seg, i) => {
      seg.style.strokeDasharray = `${sparkleLen} ${total}`;
      // Lead segment (i=0) at full brightness, each subsequent segment
      // lags 70ms behind and fades down; with cubic-bezier easing the
      // lag reads as a tapered tail trailing the head.
      const delayMs = i * 70;
      const anim = seg.animate(
        [
          { strokeDashoffset: sparkleLen, opacity: 0, offset: 0 },
          { strokeDashoffset: sparkleLen, opacity: 1, offset: 0.02 },
          { strokeDashoffset: -total, opacity: 1, offset: 0.6 },
          { strokeDashoffset: -total, opacity: 0, offset: 0.62 },
          { strokeDashoffset: -total, opacity: 0, offset: 1 },
        ],
        {
          duration: cycleMs,
          iterations: Infinity,
          delay: delayMs,
          easing: 'cubic-bezier(0.2, 0.7, 0.2, 1)',
        },
      );
      anims.push(anim);
    });
    return () => anims.forEach((a) => a.cancel());
  }, [milestones.length]);

  // Scroll-driven orb position. The bright cumulative trail was removed
  // entirely (per user request) - now only the dotted dimPath guides
  // the orb, and the orb rides along it as the user scrolls. dimPath is
  // used solely for length measurement and getPointAtLength.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const journey = journeyRef.current;
    const path = dimRef.current;
    const svg = spineSvgRef.current;
    const orb = orbRef.current;
    if (!journey || !path) return;
    const total = path.getTotalLength();
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      if (orb) orb.style.opacity = '0';
      return;
    }
    // ViewBox of the spine SVG - keep in sync with the JSX viewBox.
    const viewBoxW = 100;
    const viewBoxH = milestones.length * 100;
    let len = total;
    let svgRect = svg ? svg.getBoundingClientRect() : null;
    const recomputeStatic = () => {
      len = path.getTotalLength();
      if (svg) svgRect = svg.getBoundingClientRect();
    };
    // Each chapter knot sits roughly at progress (i + 0.5) / count along
    // the journey. We compute that threshold once and toggle the .Lit
    // class on each knot when the orb's progress crosses it, so the
    // burst keyframe fires as a precise impact moment. Removing the
    // class on scroll-back is needed so the animation can re-fire when
    // the user scrolls forward through the point again.
    const count = milestones.length;
    const knotThresholds = Array.from({ length: count }, (_, i) => (i + 0.5) / count);
    let raf = 0;
    const update = () => {
      raf = 0;
      const rect = journey.getBoundingClientRect();
      const vh = window.innerHeight;
      const past = vh / 2 - rect.top;
      const p = Math.max(0, Math.min(1, past / rect.height));
      const orbPos = len * p;
      // Orb position along the dotted guide path.
      if (svgRect && orb) {
        const pt = path.getPointAtLength(orbPos);
        const px = (pt.x / viewBoxW) * svgRect.width;
        const py = (pt.y / viewBoxH) * svgRect.height;
        orb.style.transform = `translate3d(${px}px, ${py}px, 0) translate(-50%, -50%)`;
        const orbFade = p < 0.01 ? p / 0.01 : p > 0.99 ? (1 - p) / 0.01 : 1;
        orb.style.opacity = `${orbFade}`;
      }
      // Toggle knot Lit class based on whether the orb has crossed each
      // knot's vertical position. Compares the element's current state
      // first so we only mutate the class list when it actually changed,
      // letting the CSS animation fire cleanly on each crossing.
      const litClass = s.fullSpineKnotLit;
      for (let i = 0; i < knotRefs.current.length; i++) {
        const el = knotRefs.current[i];
        if (!el) continue;
        const shouldLit = p >= knotThresholds[i];
        const isLit = el.classList.contains(litClass);
        if (shouldLit && !isLit) el.classList.add(litClass);
        else if (!shouldLit && isLit) el.classList.remove(litClass);
      }
    };
    const schedule = () => {
      if (raf) return;
      raf = requestAnimationFrame(update);
    };
    update();
    const onResize = () => { recomputeStatic(); schedule(); };
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', onResize);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [milestones.length]);

  return (
    <main className={s.page}>
      {/* Creatives still as a fixed backdrop, with a translucent dark
          overlay so the chapter content stays readable but the warm
          landscape bleeds through. Same image the creatives landing
          uses, so navigating between /creatives and the pathway pages
          feels continuous. */}
      <div className={s.creativesBg} aria-hidden="true">
        <img
          className={s.creativesBgImg}
          src="/assets/beacon-creative-landing-page-still.png"
          alt=""
        />
        <div className={s.creativesBgOverlay} />
      </div>

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
        <Link href="/" className="wordmark wordmark-btn" aria-label="Back to home">
          <span className="wm-arrow" aria-hidden="true">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 6l-6 6 6 6" />
            </svg>
          </span>
          <img className="wm-logo" src="/assets/beacon-logo.png" alt="Beacon Media Solutions" />
        </Link>
        <nav className="top-nav" aria-label="Primary">
          <Link href="/brands">For Brands</Link>
          <Link href="/about?from=creatives">About</Link>
          <Link href="/contact?from=creatives">Contact</Link>
        </nav>
      </div>

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

        <p className={s.heroEyebrow}>{heroEyebrow}</p>
        <h1 className={s.heroTitle}>{heroTitle}</h1>
        <p className={s.heroSub}>{heroSub}</p>
        <div className={s.heroActions}>
          <Link href={primaryCta.href} className={s.cta}>
            {primaryCta.label}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </Link>
          {secondaryCta && (
            <a href={secondaryCta.href} className={`${s.cta} ${s.ctaGhost}`}>{secondaryCta.label}</a>
          )}
        </div>
      </section>

      {/* Full-bleed chapter journey - each milestone is its own viewport.
          The image fills the section as a cinematic backdrop; a warm-dark
          gradient overlays so the centred text overlay stays readable.
          Scrolling moves between chapters one screen at a time, like a
          slideshow on rails. */}
      <section ref={journeyRef} className={s.fullJourney}>
        {/* Meandering connector - a single SVG that spans the entire
            journey, snaking between alternating-side numbered markers
            (1 on left, 2 on right, 3 on left, ...). Dim full path is
            always visible behind the bright progress path that draws
            itself in as the viewer scrolls. */}
        <svg
          ref={spineSvgRef}
          className={s.fullSpine}
          viewBox={`0 0 100 ${milestones.length * 100}`}
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="fullSpineGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(255, 240, 200, 0.95)" />
              <stop offset="50%" stopColor="rgba(255, 220, 150, 1)" />
              <stop offset="100%" stopColor="rgba(201, 138, 58, 0.9)" />
            </linearGradient>
          </defs>
          {/* Only the dotted full-path guide and the periodic sparkle
              streak remain visible on the spine itself. Sparkle is now
              three stacked paths (head + 2 lagging trail segments) that
              together draw a tapered comet. */}
          <path ref={dimRef} className={s.fullSpinePathDim} d={buildFullSpinePath(milestones.length)} />
          {[0, 1, 2].map((i) => (
            <path
              key={`sparkle-${i}`}
              ref={(el) => { sparkleRefs.current[i] = el; }}
              className={`${s.fullSpineSparkle} ${i === 0 ? s.fullSpineSparkleHead : i === 1 ? s.fullSpineSparkleMid : s.fullSpineSparkleTail}`}
              d={buildFullSpinePath(milestones.length)}
            />
          ))}
        </svg>
        {/* Chapter waypoint lights - one ball of light at each milestone
            point along the path. Hidden until the orb reaches/passes the
            point. The scroll handler toggles the .Lit class imperatively
            on knotRefs once the orb's path position crosses each knot's
            threshold, so the burst keyframe fires as a precise impact
            moment. */}
        {milestones.map((_, i) => {
          const isLeft = i % 2 === 0;
          const yPct = ((i + 0.5) / milestones.length) * 100;
          return (
            <span
              key={`knot-${i}`}
              ref={(el) => { knotRefs.current[i] = el; }}
              className={s.fullSpineKnot}
              style={{ top: `${yPct}%`, left: isLeft ? '20%' : '80%' }}
              aria-hidden="true"
            >
              {/* Core dot - runs the scale-overshoot burst keyframe.
                  Separate from the wrapper so the ripple pseudo-elements
                  on the wrapper aren't dragged along by the dot's scale. */}
              <span className={s.fullSpineKnotCore} />
            </span>
          );
        })}
        {/* Traveling orb - rides the meandering path at the leading edge
            of the bright progress trail. HTML rather than SVG <circle>
            because the path SVG uses preserveAspectRatio="none" (which
            would deform a circle into an ellipse). Position is computed
            in the scroll handler via getPointAtLength → viewBox coords,
            then mapped to rendered pixels using the SVG's bounding rect.
            Sits between the SVG (z-index 0) and the content (z-index 2). */}
        <div ref={orbRef} className={s.fullSpineOrb} aria-hidden="true" />
        <div className={`${s.container} ${s.flowJourneyInner}`}>
          {milestones.map((m, i) => {
            // The path peaks at xLeft (30%) for even-i chapters and xRight
            // (70%) for odd-i. The text+image group sits on the INSIDE of
            // the curve (the concave side), so the curve reads as
            // wrapping around the content. Group always goes opposite the
            // peak: peak-left chapters → group on the right; peak-right
            // chapters → group on the left.
            const isLeft = i % 2 === 0;
            return (
              <article
                key={i}
                ref={(el) => { milestoneRefs.current[i] = el; }}
                className={`${s.flowChapter} ${isLeft ? s.flowLeft : s.flowRight} ${i === activeStep ? s.flowChapterActive : ''}`}
                data-step={i}
              >
              {/* Group wrapper - image + content sit together on the inside
                  of the curve. Image at top of the group, content below.
                  CSS places the whole group in the column opposite the
                  curve peak (.flowLeft → col 2, .flowRight → col 1). */}
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
                        ref={(el) => { imageRefs.current[i] = el; }}
                        src={m.image.src}
                        alt={m.image.alt}
                        loading={i < 2 ? undefined : 'lazy'}
                      />
                    </div>
                  </figure>
                )}
              </div>
              </article>
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
        <p className={s.extraSectionLabel}>The two pathways</p>
        <h2 className={s.extraSectionHeading}>Which one <em>fits you</em>?</h2>
        <div className={s.compareTable} role="table">
          <div className={s.compareHead} role="row">
            <div className={s.compareCorner} role="columnheader" />
            <div
              className={`${s.compareColHead} ${pathway === 'embedded' ? s.compareColActive : ''}`}
              role="columnheader"
            >
              <span className={s.compareColLabel}>Pathway 01</span>
              <span className={s.compareColName}>Embedded</span>
            </div>
            <div
              className={`${s.compareColHead} ${pathway === 'projects' ? s.compareColActive : ''}`}
              role="columnheader"
            >
              <span className={s.compareColLabel}>Pathway 02</span>
              <span className={s.compareColName}>Project-based</span>
            </div>
          </div>
          {PATHWAY_COMPARISON.map((row, i) => (
            <div key={i} className={s.compareRow} role="row">
              <div className={s.compareRowLabel} role="rowheader">{row.label}</div>
              <div
                className={`${s.compareCell} ${pathway === 'embedded' ? s.compareCellActive : ''}`}
                role="cell"
              >
                {row.embedded}
              </div>
              <div
                className={`${s.compareCell} ${pathway === 'projects' ? s.compareCellActive : ''}`}
                role="cell"
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
              <div key={i} className={s.statTile}>
                <div className={s.statValue}>{stat.value}</div>
                <div className={s.statLabel}>{stat.label}</div>
                {stat.caption && <div className={s.statCaption}>{stat.caption}</div>}
              </div>
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
            <div className={`${s.fitCol} ${s.fitColFor}`}>
              <div className={s.fitColHead}>
                <span className={s.fitMark} aria-hidden="true">✓</span>
                <span className={s.fitColTitle}>Built for</span>
              </div>
              <ul className={s.fitList}>
                {fit.forItems.map((item, i) => <li key={i}>{item}</li>)}
              </ul>
            </div>
            <div className={`${s.fitCol} ${s.fitColNot}`}>
              <div className={s.fitColHead}>
                <span className={s.fitMark} aria-hidden="true">—</span>
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
            {sectors.items.map((sec) => (
              <li key={sec} className={s.sectorTag}>{sec}</li>
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
              <details key={i} className={s.faqRow} name={`faq-${pathway}`}>
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

      {/* Cinematic footer - ported from the original creatives DestFooter:
          large centered BEACON wordmark, sans-caps tagline below, gold
          hairline divider with a four-point spark at its centre, then
          two-column nav + connect block + meta line. Same idiom as the
          rest of the destination chrome so the journey page feels like
          it lives inside the brand world, not a generic corporate footer. */}
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
              <Link href="/">Home</Link>
              <Link href="/about?from=creatives">About</Link>
              <Link href="/contact?from=creatives">Contact</Link>
            </div>
            <div className={s.ftCol}>
              <div className={s.ftLabel}>Pathways</div>
              <Link href="/creatives/embedded">Embedded</Link>
              <Link href="/creatives/projects">Project-based</Link>
              <Link href="/brands">For Brands</Link>
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
              <a href="#" aria-label="Instagram">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" stroke="none" /></svg>
              </a>
              <a href="#" aria-label="LinkedIn">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z" /><rect x="2" y="9" width="4" height="12" /><circle cx="4" cy="4" r="2" /></svg>
              </a>
              <a href="#" aria-label="TikTok">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.27 8.27 0 0 0 4.84 1.55V6.79a4.85 4.85 0 0 1-1.07-.1z" /></svg>
              </a>
              <a href="#" aria-label="YouTube">
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" /><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill="currentColor" stroke="none" /></svg>
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

      {/* Pathway-switch wash - a quick warm brightness flash that ramps in
          when the user clicks the OTHER pathway. By the time it peaks the
          router has already pushed the destination, so the next page paints
          while the screen is at maximum brightness and the transition reads
          as a single bright "blink" rather than two separate page loads. */}
      {pathwayWashing && <div className={s.pathwayWash} aria-hidden="true" />}
    </main>
  );
}

/**
 * Build the SVG path that snakes between milestones. Each milestone is
 * ~400 viewbox units tall; the path alternates direction with smooth
 * S-curves so the centre column reads as a meandering thread rather
 * than a ruler-straight pipe.
 */
function buildPath(count: number): string {
  const w = 140;          // viewBox width
  const stepY = 400;      // height per milestone
  const midX = w / 2;
  // Smaller swing → gentler S-curves that stay closer to the marker axis.
  // The path still reads as a meander but markers don't drift far off the
  // line at any given milestone's vertical centre.
  const swing = 18;       // horizontal amplitude of the snake
  let d = `M ${midX} 0`;
  for (let i = 0; i < count; i++) {
    const yStart = i * stepY;
    const yEnd = (i + 1) * stepY;
    const dir = i % 2 === 0 ? 1 : -1;
    const c1y = yStart + stepY * 0.35;
    const c2y = yStart + stepY * 0.65;
    const peakX = midX + swing * dir;
    d += ` C ${peakX} ${c1y}, ${peakX} ${c2y}, ${midX} ${yEnd}`;
  }
  return d;
}

/**
 * Build the spine path used by the sticky-image journey. Unlike buildPath
 * (which keeps milestones near a centre axis), this path treats each
 * milestone as a DESTINATION: the curve travels from the previous
 * milestone's peak, bends through the centre, and arrives at the next
 * milestone's peak on the opposite side. That gives the line the
 * "winding route on a map" feel from flyward.com - milestone 1 on the
 * right, 2 on the left, 3 on the right again, with the path snaking
 * between them rather than returning to centre every step.
 *
 * viewBox is 80 wide × (count * 100) tall. peakX is midX ± 28 (= 12 / 68),
 * which matches the marker positions at 15% / 85% of container width.
 */
/**
 * Build a meandering path that spans the FULL journey section, snaking
 * across alternating-side numbered markers. viewBox is 100 × (count * 100)
 * so progress reveals scale cleanly with section height. Marker positions:
 *   even i → (10, i*100 + 50) - left side
 *   odd  i → (90, i*100 + 50) - right side
 * The path enters from the top centre, curves to the first marker, then
 * cubic-Bezier between each adjacent marker, exiting back to centre.
 */
function buildFullSpinePath(count: number): string {
  const stepY = 100;
  // Wider swing - peaks at 20/80 so the curve bows further out from the
  // centre line, leaving more clear space INSIDE the bow for the
  // chapter group (image + content) to live without crowding the path.
  // Previously 30/70 was tight enough that the content group was kissing
  // the line; pushing peaks 10 viewBox units further out opens up a
  // noticeable breathing gap.
  const xLeft = 20;
  const xRight = 80;
  const peakX = (i: number) => (i % 2 === 0 ? xLeft : xRight);
  const peakY = (i: number) => i * stepY + stepY / 2;

  // Enter from top centre, curve down to marker 0.
  let d = `M 50 0 C 50 ${stepY * 0.25}, ${peakX(0)} ${peakY(0) - stepY * 0.3}, ${peakX(0)} ${peakY(0)}`;

  // Cubic curve between each pair of adjacent markers. Control points are
  // anchored to each marker's peakX at the midpoint Y, producing an S-curve
  // that sweeps across the centre between them.
  for (let i = 1; i < count; i++) {
    const x0 = peakX(i - 1);
    const y0 = peakY(i - 1);
    const x1 = peakX(i);
    const y1 = peakY(i);
    const cy = y0 + (y1 - y0) * 0.5;
    d += ` C ${x0} ${cy}, ${x1} ${cy}, ${x1} ${y1}`;
  }

  // Exit tail - curve from the final marker back toward centre at the
  // bottom edge so the path doesn't end mid-swing.
  const lastX = peakX(count - 1);
  const lastY = peakY(count - 1);
  d += ` C ${lastX} ${lastY + stepY * 0.3}, 50 ${lastY + stepY * 0.6}, 50 ${count * stepY}`;
  return d;
}

function buildSpinePath(count: number): string {
  const w = 80;
  const stepY = 100;
  const midX = w / 2;
  // Reduced from 28 → 22 so the curve swings less aggressively. Combined
  // with the narrower spine container (96px) this keeps the wandering
  // line entirely within the column-gap. Markers anchored at the peak
  // points are at viewBox x = 18 / 62 → 22% / 78% of the spine width,
  // which the JSX mirrors as left: 22% / 78%.
  const swing = 22;
  const peakX = (i: number) => midX + (i % 2 === 0 ? 1 : -1) * swing;
  const peakY = (i: number) => (i + 0.5) * stepY;

  // Start at top centre and curve into the first marker's peak.
  let d = `M ${midX} 0 C ${midX} ${stepY * 0.3}, ${peakX(0)} ${peakY(0) - stepY * 0.3}, ${peakX(0)} ${peakY(0)}`;

  // For each subsequent marker, draw a cubic curve from the current
  // peak to the next peak. Control points pull horizontally toward the
  // incoming/outgoing peaks so the curve bends smoothly across the
  // centre between markers.
  for (let i = 1; i < count; i++) {
    const x0 = peakX(i - 1);
    const y0 = peakY(i - 1);
    const x1 = peakX(i);
    const y1 = peakY(i);
    // Control points sit halfway down the gap, each anchored to its
    // segment's own peakX - produces a clean S-curve between markers.
    const cy = y0 + (y1 - y0) * 0.5;
    d += ` C ${x0} ${cy}, ${x1} ${cy}, ${x1} ${y1}`;
  }

  // Tail: curve from the last marker's peak back to centre at the
  // bottom edge so the path exits cleanly.
  const lastX = peakX(count - 1);
  const lastY = peakY(count - 1);
  const endY = count * stepY;
  d += ` C ${lastX} ${lastY + stepY * 0.3}, ${midX} ${endY - stepY * 0.3}, ${midX} ${endY}`;

  return d;
}
