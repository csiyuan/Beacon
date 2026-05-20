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
          <Link href="/contact" onClick={(e) => { if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return; e.preventDefault(); setMenuOpen(false); navWash('/contact'); }}>Contact</Link>
        </nav>
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
            <div>
              <p className={s.sectionLabel}>Why we exist</p>
              <h2 className={s.sectionHeading}>
                Closing the gap between <em>craft and brief</em>.
              </h2>
            </div>
            <div className={s.aboutCopy}>
              <p>
                We started Beacon because the gap between brand and creative kept producing the same losses on both sides &mdash; brands burning budget on misaligned hires, creatives bouncing between gigs that didn&rsquo;t fit. The match wasn&rsquo;t failing because of the people. It was failing because nobody owned the introduction.
              </p>
              <p>
                Every Beacon creative is vetted on craft and culture. Every brand we place into has been briefed honestly about the role, the rate, and the rhythm. No recruiter middleware, no keyword filter, no &ldquo;maybe one day&rdquo; pipelines.
              </p>
              <p>
                The body of work that follows isn&rsquo;t freelance output, and it isn&rsquo;t outsourced production. It&rsquo;s the work that only happens when someone actually <em>belongs</em> somewhere &mdash; long enough to learn the brand, to push back when it matters, and to build the kind of body of work you can point to two years from now.
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
          <ol className={s.processSteps}>
            <li className={s.processStep}>
              <span className={s.processNum}>01</span>
              <h4 className={s.processTitle}>50+ creatives</h4>
              <p className={s.processBody}>
                Vetted across the roster &mdash; videographers, editors, designers, photographers, content creators, web developers.
              </p>
            </li>
            <li className={s.processStep}>
              <span className={s.processNum}>02</span>
              <h4 className={s.processTitle}>6+ brand partners</h4>
              <p className={s.processBody}>
                From Series B startups to listed companies, across tech, lifestyle, hospitality and healthcare.
              </p>
            </li>
            <li className={s.processStep}>
              <span className={s.processNum}>03</span>
              <h4 className={s.processTitle}>SG &middot; SEA</h4>
              <p className={s.processBody}>
                Built in Singapore. We place creatives and deliver projects across Southeast Asia.
              </p>
            </li>
            <li className={s.processStep}>
              <span className={s.processNum}>04</span>
              <h4 className={s.processTitle}>2+ years</h4>
              <p className={s.processBody}>
                Average tenure for an embedded creative. The relationship isn&rsquo;t a placement, it&rsquo;s a career chapter.
              </p>
            </li>
          </ol>
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
