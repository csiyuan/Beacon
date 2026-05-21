'use client';

import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';
import { useNavWash } from '@/components/transitions/NavWash';
import ArrivalWash from '@/components/transitions/ArrivalWash';
import { FORM_ENDPOINT, submitForm } from '@/lib/forms';
import ThanksPopup from '@/components/ThanksPopup';
import s from '@/app/splash.module.css';

const I_AM_A: ReadonlyArray<readonly [string, string]> = [
  ['brand', 'A brand'],
  ['creative', 'A creative'],
  ['other', 'Just saying hello'],
];

export default function ContactClient() {
  const { trigger: navWash, overlay: navWashOverlay } = useNavWash();
  const [menuOpen, setMenuOpen] = useState(false);
  const [iAmA, setIAmA] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [thanksOpen, setThanksOpen] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting) return;
    const formEl = e.currentTarget;
    setSubmitting(true);
    const ok = await submitForm(formEl, 'general');
    if (ok) {
      formEl.reset();
      setIAmA('');
      setThanksOpen(true);
    } else {
      alert('Sorry - something went wrong. Please email info@beaconmediasolutions.com directly.');
    }
    setSubmitting(false);
  };

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

      {/* ─── Top nav - mirrors the home page header (splash.module.css
          .heroNav + .heroLogo + .heroNavLinks). Contact-specific links:
          Home, For Brands, For Creatives, About (Contact is the current
          page so it's omitted). Mobile uses the same .sideMenu /
          .menuBackdrop slide-in sheet that the home page uses. */}
      <nav className={s.heroNav}>
        <button
          type="button"
          className={s.heroLogo}
          onClick={() => navWash('/')}
          aria-label="Back to home"
        >
          <img src="/assets/beacon-logo.png" alt="Beacon Media Solutions" />
        </button>
        <div className={`${s.heroNavLinks} ${s.heroNavLinksDesktop}`}>
          <Link
            href="/"
            className={s.heroNavLink}
            onClick={(e) => {
              if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
              e.preventDefault();
              navWash('/');
            }}
          >
            Home
          </Link>
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

      {/* Mobile side menu - matches the home page .sideMenu pattern. */}
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
          <Link href="/" onClick={(e) => { if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return; e.preventDefault(); setMenuOpen(false); navWash('/'); }}>Home</Link>
          <Link href="/brands?from=splash" onClick={(e) => { if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return; e.preventDefault(); setMenuOpen(false); navWash('/brands?from=splash'); }}>For Brands</Link>
          <Link href="/creatives/embedded" onClick={(e) => { if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return; e.preventDefault(); setMenuOpen(false); navWash('/creatives/embedded'); }}>For Creatives</Link>
          <Link href="/about" onClick={(e) => { if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return; e.preventDefault(); setMenuOpen(false); navWash('/about'); }}>About</Link>
        </nav>
        <div className={s.sideMenuConnect}>
          <p className={s.sideMenuLabel}>Connect</p>
          <a href="mailto:info@beaconmediasolutions.com">info@beaconmediasolutions.com</a>
        </div>
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

      {/* ─── Contact form ───────────────────────────────────────────
          Uses the same glassmorphism `.cf-*` form treatment as the
          creative pathway intake forms. Wrapped in `dest show` so
          the global .dest-scoped styles in globals.css cascade in;
          `destStatic` flips .dest from position:fixed to static so
          the form lays out as ordinary scrolling content. */}
      <section className={`${s.section} ${s.contactSection}`}>
        <div className={s.container}>
          <ThanksPopup open={thanksOpen} onClose={() => setThanksOpen(false)} />
          <div className={`dest show ${s.destStatic}`}>
            <div className="cf-wrap">
              <div className="contact-form">
                {/* Left info panel */}
                <div className="cf-info">
                  <span className="cf-label">Contact &middot; Beacon</span>
                  <p className="cf-info-title">Tell us what you&rsquo;re building.</p>
                  <p className="cf-info-body">
                    Whether you&rsquo;re a brand looking for creative capacity, a creative looking for placements, or just saying hello, we read every message personally and reply within two working days.
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
                    <div className="cf-detail">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
                      <a href="mailto:info@beaconmediasolutions.com">info@beaconmediasolutions.com</a>
                    </div>
                    <div className="cf-detail">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0z" /><circle cx="12" cy="10" r="3" /></svg>
                      <span>141 Cecil Street #08-07<br />Tung Ann Association Building<br />Singapore 069541</span>
                    </div>
                  </div>
                  <div className="cf-social">
                    <a href="https://www.instagram.com/beaconmediasg/" target="_blank" rel="noopener noreferrer" aria-label="Instagram"><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" stroke="none" /></svg></a>
                    <a href="https://www.linkedin.com/company/beacon-media-solutions/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn"><svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z" /><rect x="2" y="9" width="4" height="12" /><circle cx="4" cy="4" r="2" /></svg></a>
                  </div>
                </div>

                {/* Right form fields */}
                <form
                  className="cf-fields"
                  action={FORM_ENDPOINT}
                  method="POST"
                  encType="multipart/form-data"
                  onSubmit={handleSubmit}
                >
                  <input type="hidden" name="form" value="general" />
                  <div className="cf-row two">
                    <div className="cf-field">
                      <span className="cf-label">Name</span>
                      <input type="text" name="name" placeholder="Your name" autoComplete="name" required />
                    </div>
                    <div className="cf-field">
                      <span className="cf-label">Email</span>
                      <input type="email" name="email" placeholder="your@email.com" autoComplete="email" required />
                    </div>
                  </div>
                  <div className="cf-field">
                    <span className="cf-label">I am a&hellip;</span>
                    <div className="cf-toggle wide">
                      {I_AM_A.map(([v, l]) => (
                        <button
                          key={v}
                          type="button"
                          className={`cf-toggle-btn${iAmA === v ? ' on' : ''}`}
                          onClick={() => setIAmA(v)}
                        >
                          {l}
                        </button>
                      ))}
                    </div>
                    <input type="hidden" name="i_am_a" value={I_AM_A.find(([v]) => v === iAmA)?.[1] ?? ''} />
                  </div>
                  <div className="cf-field cf-field-grow">
                    <span className="cf-label">Message</span>
                    <textarea name="message" rows={5} placeholder="A few lines about what you're looking for" required />
                  </div>
                  <div>
                    <button type="submit" className="cta" disabled={submitting} aria-busy={submitting}>
                      {submitting ? 'Sending…' : 'Send message'}
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
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
              <div className={s.pathCardImage}>
                <img
                  src="https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=1200&q=80&auto=format&fit=crop"
                  alt=""
                  loading="lazy"
                />
              </div>
              <div className={s.pathCardContent}>
                <p className={s.pathCardLabel}>For brands</p>
                <h3 className={s.pathCardTitle}>Embed or scope a project.</h3>
                <p className={s.pathCardBody}>Brand-side intake with the right fields for service, roles, timeline, and scope.</p>
                <span className={s.pathCardCta}>Open the brand page <span aria-hidden="true">&rarr;</span></span>
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
              <div className={s.pathCardImage}>
                <img
                  src="https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=1200&q=80&auto=format&fit=crop"
                  alt=""
                  loading="lazy"
                />
              </div>
              <div className={s.pathCardContent}>
                <p className={s.pathCardLabel}>For creatives</p>
                <h3 className={s.pathCardTitle}>Apply or join the roster.</h3>
                <p className={s.pathCardBody}>Two pathways. Embedded full-time or per-project, each with its own application form.</p>
                <span className={s.pathCardCta}>See the pathways <span aria-hidden="true">&rarr;</span></span>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Footer ───────────────────────────────────────────────── */}
      <footer className={s.footer}>
        <div className={s.container}>
          <div className={s.footerCols}>
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
    </div>
  );
}
