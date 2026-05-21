'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useNavWash } from '@/components/transitions/NavWash';
import ArrivalWash from '@/components/transitions/ArrivalWash';
import s from '@/app/splash.module.css';

export default function AboutClient() {
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

      {/* ─── Top nav - mirrors the home page header (splash.module.css
          .heroNav + .heroLogo + .heroNavLinks). About-specific links:
          Home, For Brands, For Creatives, Contact (About is the current
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
            href="/contact"
            className={s.heroNavLink}
            onClick={(e) => {
              if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
              e.preventDefault();
              navWash('/contact');
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
          <Link href="/contact" onClick={(e) => { if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return; e.preventDefault(); setMenuOpen(false); navWash('/contact'); }}>Contact</Link>
        </nav>
        <div className={s.sideMenuConnect}>
          <p className={s.sideMenuLabel}>Connect</p>
          <a href="mailto:info@beaconmediasolutions.com">info@beaconmediasolutions.com</a>
        </div>
      </aside>

      {/* ─── Hero ─────────────────────────────────────────────────── */}
      <section className={s.utilityHero}>
        <div className={s.container}>
          <p className={s.sectionLabel}>About Beacon</p>
          <h1 className={s.utilityHeroTitle}>
            The bridge between great creatives and the <em>brands that need them</em>.
          </h1>
          <p className={s.sectionLead}>
            Beacon Media Solutions is built in Singapore and serves Southeast Asia. We sit between brand and creative and make the match work.
          </p>
        </div>
      </section>

      {/* ─── About body ───────────────────────────────────────────── */}
      <section className={s.section}>
        <div className={s.container}>
          <div className={s.aboutGrid}>
            <div className={s.aboutGridLeft}>
              <div>
                <p className={s.sectionLabel}>Why we exist</p>
                <h2 className={s.sectionHeading}>
                  Closing the gap between <em>craft and brief</em>.
                </h2>
              </div>
              {/* Founder card - signs the manifesto column. Sits at the
                  bottom of the left column on desktop so the heading and
                  the founder credit anchor the same vertical axis as
                  the body copy on the right. Stacks below the heading
                  on mobile. */}
              <a
                className={s.founderCard}
                href="https://www.linkedin.com/in/wayneczx/"
                target="_blank"
                rel="noopener noreferrer"
              >
                <img
                  className={s.founderPhoto}
                  src="/assets/founder-wayne.jpg"
                  alt="Wayne Chia"
                  loading="lazy"
                />
                <span className={s.founderInfo}>
                  <span className={s.founderName}>Wayne Chia</span>
                  <span className={s.founderRole}>Founder</span>
                </span>
              </a>
            </div>
            <div className={s.aboutCopy}>
              <p>
                We started Beacon because the gap between brand and creative kept producing the same losses on both sides. Brands burning budget on misaligned hires, creatives bouncing between gigs that didn&rsquo;t fit. The match wasn&rsquo;t failing because of the people. It was failing because nobody owned the introduction.
              </p>
              <p>
                Every Beacon creative is vetted on craft and culture. Every brand we place into has been briefed honestly about the role, the rate, and the rhythm. No recruiter middleware, no keyword filter, no &ldquo;maybe one day&rdquo; pipelines.
              </p>
              <p>
                The body of work that follows isn&rsquo;t freelance output, and it isn&rsquo;t outsourced production. It&rsquo;s the work that only happens when someone actually <em>belongs</em> somewhere, long enough to learn the brand, to push back when it matters, and to build the kind of body of work you can point to two years from now.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Quick facts strip ───────────────────────────────────── */}
      <section className={s.section}>
        <div className={s.container}>
          <div className={s.sectionHead}>
            <p className={s.sectionLabel}>The shape of Beacon</p>
            <h2 className={s.sectionHeading}>
              Numbers, plainly put.
            </h2>
          </div>
          {/* Editorial stat row - big italic serif values + small-caps
              labels, no card chrome. Same treatment as the journey-page
              stats band but on the about page. */}
          <div className={s.numbersGrid}>
            <div className={s.numberItem}>
              <span className={s.numberValue}>50+</span>
              <span className={s.numberLabel}>Creatives engaged</span>
            </div>
            <div className={s.numberItem}>
              <span className={s.numberValue}>6+</span>
              <span className={s.numberLabel}>Brand partners</span>
            </div>
            <div className={s.numberItem}>
              <span className={s.numberValue}>SG / SEA</span>
              <span className={s.numberLabel}>Singapore + Southeast Asia</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Closing CTA ─────────────────────────────────────────── */}
      <section className={`${s.section} ${s.closingSection}`}>
        <div className={s.container}>
          <div className={s.sectionHead}>
            <p className={s.sectionLabel}>Talk to us</p>
            <h2 className={s.sectionHeading}>
              Whichever side of the brief <em>you&rsquo;re on</em>.
            </h2>
            <p className={s.sectionLead}>
              Tell us what you&rsquo;re building. We&rsquo;ll take it from there.
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
