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
            Beacon connects creative talent with brands that take craft seriously. Full-time embeds or per-project briefs, fully managed.
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
          </Link>
        </div>
      </div>
    </section>

    {/* ─── Section: Mission ─────────────────────────────────────────
        Single typographic statement. Sets the philosophy before the
        process detail below. */}
    <section className={`${s.section} ${s.missionSection}`}>
      <div className={s.container}>
        <p className={s.sectionLabel}>What we believe</p>
        <p className={s.missionLine}>
          The best work happens when the right creative lands inside the right brand, and stays long enough to <em>matter</em>.
        </p>
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
            <h4 className={s.processTitle}>Listen</h4>
            <p className={s.processBody}>
              A short call to understand the brand, the team, and what success actually looks like. No deck required.
            </p>
          </li>
          <li className={s.processStep}>
            <span className={s.processNum}>02</span>
            <h4 className={s.processTitle}>Match</h4>
            <p className={s.processBody}>
              We pair you with creatives matched on craft and culture, not just availability. Both sides interview before anyone commits.
            </p>
          </li>
          <li className={s.processStep}>
            <span className={s.processNum}>03</span>
            <h4 className={s.processTitle}>Deliver</h4>
            <p className={s.processBody}>
              Embedded full-time, or per-project. We handle payroll, contracts, and the admin; the creative ships the work.
            </p>
          </li>
          <li className={s.processStep}>
            <span className={s.processNum}>04</span>
            <h4 className={s.processTitle}>Stay</h4>
            <p className={s.processBody}>
              Quarterly check-ins for everyone in the network. The relationship doesn&rsquo;t end at delivery. That&rsquo;s where it starts.
            </p>
          </li>
        </ol>
      </div>
    </section>

    {/* ─── Section: Testimonial ─────────────────────────────────────
        Single quote to anchor the page emotionally before the closing
        CTA. The full About content lives at /about (standalone page);
        the home page just teases the brand position above. */}
    <section className={`${s.section} ${s.testimonialSection}`}>
      <div className={s.container}>
        <blockquote className={s.testimonialQuote}>
          <p>
            &ldquo;Working with Beacon gave me more than just a job. It gave me space to grow, and I finally feel like the work I make actually belongs somewhere.&rdquo;
          </p>
          <cite>A Beacon creative &middot; placed in 2024</cite>
        </blockquote>
      </div>
    </section>

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

    {/* ─── Footer ───────────────────────────────────────────────── */}
    <footer className={s.footer}>
      <div className={s.container}>
        <div className={s.footerMark}>BEACON</div>
        <div className={s.footerTagline}>EMPOWERING CREATIVES. ELEVATING BRANDS.</div>
        <div className={s.footerDivider} aria-hidden="true">
          <span className={s.footerRule}></span>
          <svg className={s.footerSpark} width="14" height="14" viewBox="0 0 14 14">
            <path d="M7 0 L8.2 5.8 L14 7 L8.2 8.2 L7 14 L5.8 8.2 L0 7 L5.8 5.8 Z" fill="currentColor" />
          </svg>
          <span className={s.footerRule}></span>
        </div>
        <div className={s.footerCols}>
          <div className={s.footerCol}>
            <div className={s.footerColLabel}>Navigate</div>
            <a href="#paths" onClick={(e) => { e.preventDefault(); document.getElementById('paths')?.scrollIntoView({ behavior: 'smooth' }); }}>Two ways in</a>
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
          <div className={s.footerCol}>
            <div className={s.footerColLabel}>Connect</div>
            <a className={s.footerEmail} href="mailto:info@beaconmediasolutions.com">info@beaconmediasolutions.com</a>
            <div className={s.footerAddress}>
              141 Cecil Street #08-07<br />
              Tung Ann Association Building<br />
              Singapore 069541
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
