'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useNavWash } from '@/components/transitions/NavWash';
import ArrivalWash from '@/components/transitions/ArrivalWash';
import s from '@/app/splash.module.css';

export default function ContactClient() {
  const { trigger: navWash, overlay: navWashOverlay } = useNavWash();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  return (
    <div className={s.page}>
      <ArrivalWash />
      {navWashOverlay}

      {/* ─── Top nav ─────────────────────────────────────────────── */}
      <nav className={s.utilityNav}>
        <Link
          href="/"
          className={s.utilityNavLogo}
          onClick={(e) => {
            if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
            e.preventDefault();
            navWash('/');
          }}
        >
          <img src="/assets/beacon-logo.png" alt="Beacon Media Solutions" />
        </Link>
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
            href="/about"
            className={s.heroNavLink}
            onClick={(e) => {
              if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
              e.preventDefault();
              navWash('/about');
            }}
          >
            About
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
        <button type="button" className={s.sideMenuClose} onClick={() => setMenuOpen(false)} aria-label="Close menu">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
        <nav className={s.sideMenuNav} aria-label="Primary mobile">
          <Link href="/" onClick={(e) => { if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return; e.preventDefault(); setMenuOpen(false); navWash('/'); }}>Home</Link>
          <Link href="/brands?from=splash" onClick={(e) => { if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return; e.preventDefault(); setMenuOpen(false); navWash('/brands?from=splash'); }}>For Brands</Link>
          <Link href="/creatives/embedded" onClick={(e) => { if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return; e.preventDefault(); setMenuOpen(false); navWash('/creatives/embedded'); }}>For Creatives</Link>
          <Link href="/about" onClick={(e) => { if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return; e.preventDefault(); setMenuOpen(false); navWash('/about'); }}>About</Link>
        </nav>
      </aside>

      {/* ─── Hero ─────────────────────────────────────────────────── */}
      <section className={s.utilityHero}>
        <div className={s.container}>
          <p className={s.sectionLabel}>Get in touch</p>
          <h1 className={s.utilityHeroTitle}>
            Let&rsquo;s <em>talk</em>.
          </h1>
          <p className={s.sectionLead}>
            Tell us a little about you. We read every message personally and reply within two working days.
          </p>
        </div>
      </section>

      {/* ─── Contact form ─────────────────────────────────────────── */}
      <section className={`${s.section} ${s.contactSection}`}>
        <div className={s.container}>
          <form className={s.contactForm} method="POST" action="/api/contact">
            <input type="hidden" name="kind" value="general" />
            <div className={s.contactRow}>
              <label className={s.contactField}>
                <span className={s.contactLabel}>Name</span>
                <input type="text" name="name" required autoComplete="name" className={s.contactInput} placeholder="Your full name" />
              </label>
              <label className={s.contactField}>
                <span className={s.contactLabel}>Email</span>
                <input type="email" name="email" required autoComplete="email" className={s.contactInput} placeholder="you@email.com" />
              </label>
            </div>
            <label className={s.contactField}>
              <span className={s.contactLabel}>I am a&hellip;</span>
              <select name="i_am_a" required className={s.contactInput} defaultValue="">
                <option value="" disabled>Select one</option>
                <option value="brand">Brand looking for creative talent</option>
                <option value="creative">Creative looking for placements</option>
                <option value="other">Just saying hello</option>
              </select>
            </label>
            <label className={s.contactField}>
              <span className={s.contactLabel}>Message</span>
              <textarea name="message" required rows={6} className={s.contactInput} placeholder="A few lines about what you're looking for" />
            </label>
            <button type="submit" className={s.cta}>
              Send message
            </button>
          </form>
        </div>
      </section>

      {/* ─── Contact alternatives ──────────────────────────────────
          For visitors who want a more specific intake (full brand
          discovery / embedded application / project roster), point
          them to the dedicated deep-dive pages. */}
      <section className={s.section}>
        <div className={s.container}>
          <div className={s.sectionHead}>
            <p className={s.sectionLabel}>Or pick a door</p>
            <h2 className={s.sectionHeading}>
              Looking for something <em>specific</em>?
            </h2>
            <p className={s.sectionLead}>
              The brand page and the two creative pathway pages each carry their own intake form with the fields that matter for that conversation.
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
              <h3 className={s.pathCardTitle}>Embed or scope a project.</h3>
              <p className={s.pathCardBody}>Brand-side intake with the right fields for service, roles, timeline, and scope.</p>
              <span className={s.pathCardCta}>Open the brand page <span aria-hidden="true">&rarr;</span></span>
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
              <h3 className={s.pathCardTitle}>Apply or join the roster.</h3>
              <p className={s.pathCardBody}>Two pathways - embedded full-time or per-project. Each has its own application form.</p>
              <span className={s.pathCardCta}>See the pathways <span aria-hidden="true">&rarr;</span></span>
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
              <Link href="/" onClick={(e) => { if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return; e.preventDefault(); navWash('/'); }}>Home</Link>
              <Link href="/about" onClick={(e) => { if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return; e.preventDefault(); navWash('/about'); }}>About</Link>
              <Link href="/contact" onClick={(e) => { if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return; e.preventDefault(); navWash('/contact'); }}>Contact</Link>
            </div>
            <div className={s.footerCol}>
              <div className={s.footerColLabel}>Pathways</div>
              <Link href="/brands?from=splash" onClick={(e) => { if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return; e.preventDefault(); navWash('/brands?from=splash'); }}>For Brands</Link>
              <Link href="/creatives/embedded" onClick={(e) => { if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return; e.preventDefault(); navWash('/creatives/embedded'); }}>For Creatives</Link>
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
    </div>
  );
}
