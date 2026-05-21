'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import ArrivalWash from '@/components/transitions/ArrivalWash';
import { useNavWash } from '@/components/transitions/NavWash';
import { useCountUp } from '@/lib/useCountUp';
import s from '@/app/splash.module.css';

export default function Hero() {
  const router = useRouter();
  // Cream-flash transition for all in-site navigation.
  const { trigger: navWash, overlay: navWashOverlay } = useNavWash();
  // Hamburger menu state - inline nav collapses below 760px.
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

  // Warm both destination route bundles so navWash hands off instantly.
  useEffect(() => {
    router.prefetch('/brands?from=splash');
    router.prefetch('/creatives/embedded');
  }, [router]);

  return (
    <>
    <section className={s.hero}>
      <ArrivalWash />
      {navWashOverlay}

      {/* Planet horizon - large translucent circle with a thin glowing
          rim creating the arc at the top of the hero. */}
      <div className={s.heroHalo} aria-hidden="true" />
      {/* Atmospheric haze layered above the horizon - softens the
          transition from the bright rim into the dark space above. */}
      <div className={s.heroHaloHaze} aria-hidden="true" />

      {/* Star field - small particles drifting down from above. Each
          span gets a deterministic position + delay so the layout is
          identical on every render (no SSR hydration mismatch). */}
      <div className={s.heroStars} aria-hidden="true">
        {Array.from({ length: 70 }).map((_, i) => {
          const left = (i * 7.31) % 100;
          /* Stagger initial vertical positions so particles cluster
             toward the bottom of the hero (the dome glow source) and
             thin out toward the top. Pseudo-random distribution
             weighted to 60-100% of hero height. */
          const top = 60 + ((i * 3.7) % 40);
          const delay = (i * 0.71) % 18;
          const duration = 18 + ((i * 0.93) % 14);
          return (
            <span
              key={i}
              style={{
                left: `${left}%`,
                top: `${top}%`,
                animationDelay: `${-delay}s`,
                animationDuration: `${duration}s`,
              }}
            />
          );
        })}
      </div>

      <div className={s.overlay}>
        {/* ─── Top bar ──────────────────────────────────────────────────── */}
        <nav className={s.heroNav}>
          {/* Logo on the splash doubles as a hard-refresh - resets the page
              animation timeline since a normal Link to "/" is a no-op here. */}
          <button
            type="button"
            className={s.heroLogo}
            onClick={() => window.location.reload()}
            aria-label="Refresh home"
          >
            <img src="/assets/beacon-logo.png" alt="Beacon Media Solutions" />
          </button>
          <div className={`${s.heroNavLinks} ${s.heroNavLinksDesktop}`}>
            <Link
              href="/brands?from=splash"
              className={s.heroNavLink}
              onClick={(e) => {
                if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
                e.preventDefault();
                navWash('/brands?from=splash');
              }}
            >
              For Brands
            </Link>
            <Link
              href="/creatives/embedded"
              className={s.heroNavLink}
              onClick={(e) => {
                if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
                e.preventDefault();
                navWash('/creatives/embedded');
              }}
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
                navWash('/brands?from=splash');
              }}
            >
              For Brands
            </Link>
            <Link
              href="/creatives/embedded"
              onClick={(e) => {
                if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
                e.preventDefault();
                setMenuOpen(false);
                navWash('/creatives/embedded');
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

        {/* ─── Hero content ─────────────────────────────────────────────
            Centered, single-message position. Status pill → big serif
            headline → sans subhead → primary + ghost CTAs. The two
            audience-specific paths live in the section directly below
            this hero, not in the hero itself - forcing the choice
            upfront made the front door feel like a fork in the road
            instead of a brand statement. */}
        <div className={s.heroContent}>
          <span className={s.heroBadge}>
            <span className={s.heroBadgeDot} aria-hidden="true" />
            Singapore &middot; Southeast Asia
          </span>
          <h1 className={s.heroHeading}>
            The right creatives.<br /><em>Paired with the right brands</em>.
          </h1>
          <p className={s.heroSub}>
            50+ creatives placed across Southeast Asia. Embedded or per-project, fully managed.
          </p>
          <div className={s.heroActions}>
            <a
              href="#contact"
              className={s.cta}
              onClick={(e) => {
                if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
                e.preventDefault();
                document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
            >
              Let&rsquo;s talk
            </a>
            {/* Ghost pill - same outlined pill shape as the primary so the
                two CTAs read as a paired set, but without the filled gold
                highlight so "Let's talk" stays unambiguously primary. */}
            <a
              href="#paths"
              className={`${s.cta} ${s.ctaGhost}`}
              onClick={(e) => {
                if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
                e.preventDefault();
                document.getElementById('paths')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
            >
              How it works
            </a>
          </div>
        </div>

        {/* Mobile-only scroll hint - sits at the bottom of the hero
            and gives the visitor a clear next-move cue. Hidden on
            desktop where the section composition already implies
            scrolling. */}
        <div className={s.heroScrollHint} aria-hidden="true">
          <span className={s.heroScrollHintLabel}>Scroll</span>
          <svg width="12" height="20" viewBox="0 0 12 20" fill="none">
            <path d="M6 2 L6 16 M2 12 L6 16 L10 12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

    </section>

    {/* ─── Section: Proof numbers strip ──────────────────────────────
        Concrete credibility right after the hero positioning. Same
        numbers carried by the /about and /creatives/embedded pages,
        surfaced on the home so visitors have something to verify
        the brand promise against before being asked to pick a path. */}
    <section className={s.proofStrip}>
      <div className={s.container}>
        <ul className={s.proofList}>
          <ProofStat value="50+" label="Creatives placed" />
          <ProofStat value="6+" label="Brand partners" />
          <ProofStat value="SG · SEA" label="Singapore + Southeast Asia" />
        </ul>
      </div>
    </section>

    {/* ─── Section: For Brands / For Creatives split ──────────────────
        The two audience-specific paths live here, after the unified
        hero. Visitors who scrolled this far have bought into the brand
        statement above and are now ready to pick a door. */}
    <section id="paths" className={s.section}>
      <div className={s.container}>
        <div className={s.sectionHead}>
          <p className={s.sectionLabel}>Two ways in</p>
          <h2 className={s.sectionHeading}>
            Whichever side of the brief <em>you&rsquo;re on</em>.
          </h2>
          <p className={s.sectionLead}>
            We serve both ends of the creative economy. Pick the door that fits and we&rsquo;ll handle the rest.
          </p>
        </div>
        <div className={s.pathsGrid}>
          <Link
            href="/brands?from=splash"
            className={s.pathCard}
            onClick={(e) => {
              if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
              e.preventDefault();
              navWash('/brands?from=splash');
            }}
          >
            {/* Representative image - team / strategy meeting. Reads as
                the brand-side of the work: people deciding what gets
                made and by whom. */}
            <div className={s.pathCardImage}>
              <img
                src="https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=1200&q=80&auto=format&fit=crop"
                alt=""
                loading="lazy"
              />
            </div>
            <div className={s.pathCardContent}>
              <p className={s.pathCardLabel}>For brands</p>
              <h3 className={s.pathCardTitle}>
                Embed a creative or scope a project.
              </h3>
              <p className={s.pathCardBody}>
                Beacon places vetted creatives inside your team or delivers a tightly-scoped media project, end-to-end. Without the agency layer or freelancer churn.
              </p>
              <span className={s.pathCardCta}>
                Explore for brands <span aria-hidden="true">&rarr;</span>
              </span>
            </div>
          </Link>
          <Link
            href="/creatives/embedded"
            className={s.pathCard}
            onClick={(e) => {
              if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
              e.preventDefault();
              navWash('/creatives/embedded');
            }}
          >
            {/* Representative image - creative at work. Reads as the
                creative-side of the work: someone actually making
                the thing. */}
            <div className={s.pathCardImage}>
              <img
                src="https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=1200&q=80&auto=format&fit=crop"
                alt=""
                loading="lazy"
              />
            </div>
            <div className={s.pathCardContent}>
              <p className={s.pathCardLabel}>For creatives</p>
              <h3 className={s.pathCardTitle}>
                Build a career inside brands that get you.
              </h3>
              <p className={s.pathCardBody}>
                Two pathways - embed full-time inside a brand that takes its craft seriously, or take project briefs as they come. Either way, you get a team that has your back.
              </p>
              <span className={s.pathCardCta}>
                Explore for creatives <span aria-hidden="true">&rarr;</span>
              </span>
            </div>
          </Link>
        </div>
      </div>
    </section>

    {/* ─── Section: Mission ─────────────────────────────────────────
        Single typographic statement. Sets the philosophy before the
        process detail below. */}
    <section className={`${s.section} ${s.missionSection}`}>
      <div className={s.container}>
        {/* Editorial two-column layout - eyebrow + meta on the left,
            the mission statement on the right. Breaks the page out of
            its repeated "centered text block" rhythm and lets the
            mission read as a typeset essay opening, not another
            tagline. */}
        <div className={s.missionGrid}>
          <div className={s.missionMeta}>
            <p className={s.sectionLabel}>What we believe</p>
            <p className={s.missionMetaSub}>Mission &middot; Beacon</p>
          </div>
          <h2 className={s.missionLine}>
            The best work happens when the right creative lands inside the right brand, and stays long enough to <em>matter</em>.
          </h2>
        </div>
      </div>
    </section>

    {/* ─── Section: How we work (process strip) ─────────────────────
        Four-step process, sequential numbered. Same idiom as the
        journey page chapters but compressed into a row. */}
    <section className={s.section}>
      <div className={s.container}>
        <div className={s.sectionHead}>
          <p className={s.sectionLabel}>How we work</p>
          <h2 className={s.sectionHeading}>
            A simple <em>four-step</em> rhythm.
          </h2>
        </div>
        <ol className={s.processSteps}>
          <li className={s.processStep}>
            <span className={s.processNum}>01</span>
            <h3 className={s.processTitle}>Listen</h3>
            <p className={s.processBody}>
              A short call to understand the work, the people, and what success actually looks like. No deck required.
            </p>
          </li>
          <li className={s.processStep}>
            <span className={s.processNum}>02</span>
            <h3 className={s.processTitle}>Match</h3>
            <p className={s.processBody}>
              Both sides matched on craft and culture, not just availability. Two-way interviews before anyone commits.
            </p>
          </li>
          <li className={s.processStep}>
            <span className={s.processNum}>03</span>
            <h3 className={s.processTitle}>Deliver</h3>
            <p className={s.processBody}>
              Embedded full-time, or per-project. Beacon handles payroll, contracts, and admin while the work gets shipped.
            </p>
          </li>
          <li className={s.processStep}>
            <span className={s.processNum}>04</span>
            <h3 className={s.processTitle}>Stay</h3>
            <p className={s.processBody}>
              Quarterly check-ins for everyone in the network. The relationship doesn&rsquo;t end at delivery. That&rsquo;s where it starts.
            </p>
          </li>
        </ol>
      </div>
    </section>

    {/* Testimonial section removed - the previous quote was anonymous
        ("A Beacon creative · placed in 2024") which reads as a placeholder
        and undermines trust more than it builds it. Better to leave it
        out until a real named quote with a brand attribution is
        available. */}

    {/* ─── Section: Closing CTA ───────────────────────────────────
        Final beat before footer - pushes to /contact instead of an
        inline form. The full form lives on the standalone /contact
        page so it can carry the same depth as the other deep dives. */}
    <section className={`${s.section} ${s.closingSection}`}>
      <div className={s.container}>
        <div className={s.sectionHead}>
          <p className={s.sectionLabel}>Get in touch</p>
          <h2 className={s.sectionHeading}>
            Tell us what you&rsquo;re <em>building</em>.
          </h2>
          <p className={s.sectionLead}>
            One short message and we&rsquo;ll take it from there. We read every note personally and reply within two working days.
          </p>
        </div>
        <div className={s.heroActions} style={{ justifyContent: 'center', display: 'flex' }}>
          <Link
            href="/contact"
            className={s.cta}
            onClick={(e) => {
              if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
              e.preventDefault();
              navWash('/contact');
            }}
          >
            Start a conversation
          </Link>
        </div>
      </div>
    </section>

    {/* ─── Footer ─────────────────────────────────────────────────
        Four-column grid: brand block (logo + tagline + est.) on the
        left, then Navigate / Pathways / Connect across. Centered
        stacked column on mobile, left-aligned columns on desktop. */}
    <footer className={s.footer}>
      <div className={s.container}>
        <div className={s.footerCols}>
          {/* Column 1 - Brand block */}
          <div className={s.footerBrand}>
            <img src="/assets/beacon-logo.png" alt="Beacon Media Solutions" className={s.footerLogo} />
            <p className={s.footerBrandText}>
              Beacon Media Solutions places vetted creative talent with brands across Singapore and Southeast Asia.
            </p>
            <div className={s.footerEst}>
              <span className={s.footerEstRule} aria-hidden="true" />
              <span className={s.footerEstText}>EST. SINGAPORE &middot; 2024</span>
            </div>
          </div>

          {/* Column 2 - Navigate */}
          <div className={s.footerCol}>
            <div className={s.footerColLabel}>Navigate</div>
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
              href="/about"
              onClick={(e) => {
                if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
                e.preventDefault();
                navWash('/about');
              }}
            >
              About
            </Link>
            <Link
              href="/contact"
              onClick={(e) => {
                if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
                e.preventDefault();
                navWash('/contact');
              }}
            >
              Contact
            </Link>
          </div>

          {/* Column 3 - Pathways */}
          <div className={s.footerCol}>
            <div className={s.footerColLabel}>Pathways</div>
            <Link
              href="/brands?from=splash"
              onClick={(e) => {
                if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
                e.preventDefault();
                navWash('/brands?from=splash');
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

          {/* Column 4 - Connect */}
          <div className={s.footerCol}>
            <div className={s.footerColLabel}>Connect</div>
            <a className={s.footerEmail} href="mailto:info@beaconmediasolutions.com">info@beaconmediasolutions.com</a>
            <div className={s.footerAddress}>
              141 Cecil Street #08-07<br />
              Tung Ann Association Building<br />
              Singapore 069541
            </div>
            <div className={s.footerSocial}>
              <a href="https://www.instagram.com/beaconmediasg/" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" stroke="none" /></svg>
              </a>
              <a href="https://www.linkedin.com/company/beacon-media-solutions/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z" /><rect x="2" y="9" width="4" height="12" /><circle cx="4" cy="4" r="2" /></svg>
              </a>
            </div>
          </div>
        </div>

        <div className={s.footerMeta}>
          <span>&copy; {new Date().getFullYear()} Beacon Media Solutions. All rights reserved.</span>
          <span aria-hidden="true"> &middot; </span>
          <span>Designed by Kairos Cheng</span>
        </div>
      </div>
    </footer>
    </>
  );
}

/* Single proof stat - parses leading number from the value string
   (e.g. "50+" → 50) and animates 0 → 50 when scrolled into view.
   Non-numeric values like "SG · SEA" render unchanged. */
function ProofStat({ value, label }: { value: string; label: string }) {
  const { ref, text } = useCountUp<HTMLLIElement>(value);
  return (
    <li ref={ref}>
      <span className={s.proofNum}>{text}</span>
      <span className={s.proofLabel}>{label}</span>
    </li>
  );
}
