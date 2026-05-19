'use client';

import Link from 'next/link';
import { useRef, useState, useEffect, type FormEvent } from 'react';
import s from './brands.module.css';
import BrandsArrivalWash from './BrandsArrivalWash';
import { FORM_ENDPOINT, submitForm } from '@/lib/forms';
import ThanksPopup from '@/components/ThanksPopup';
import { useNavWash } from '@/components/transitions/NavWash';

// Option lists for the toggle groups. Tuple is [internal code, human label].
// The hidden inputs send the LABEL (so the email reads "1-3 months" instead
// of "1-3m"); the state holds the code for compactness.
const BRAND_SERVICE = [
  ['embedded', 'Embedded talent'],
  ['production', 'Project delivery'],
  ['both', 'Both'],
] as const;
const BRAND_TIMELINE = [
  ['asap', 'ASAP'],
  ['1-3m', '1-3 months'],
  ['3-6m', '3-6 months'],
  ['flexible', 'Flexible'],
] as const;
const labelFor = <T extends readonly (readonly [string, string])[]>(list: T, code: string): string =>
  list.find(([v]) => v === code)?.[1] ?? code;

// Static-page port of the brand destination overlay from the immersive
// /creatives scene. Uses the global `.dest` design language verbatim, with
// brand-page nav + footer chrome wrapped around it. The .destStatic class on
// brands.module.css overrides .dest's fixed positioning so the content lays
// out as a normal scrolling page.
export default function BrandsClient({ fromSplash }: { fromSplash: boolean }) {
  const year = new Date().getFullYear();

  // Brand intake form state - ported from CreativesApp.jsx Destination()
  const [brandService, setBrandService] = useState<'embedded' | 'production' | 'both'>('embedded');
  const [brandRoles, setBrandRoles] = useState<string[]>([]);
  const [brandTimeline, setBrandTimeline] = useState<'asap' | '1-3m' | '3-6m' | 'flexible'>('flexible');
  const [submitting, setSubmitting] = useState(false);
  const [thanksOpen, setThanksOpen] = useState(false);
  const { trigger: navWash, overlay: navWashOverlay } = useNavWash();
  const toggleBrandRole = (role: string) =>
    setBrandRoles((prev) => (prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]));

  const handleBrandSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting) return;
    const formEl = e.currentTarget;
    setSubmitting(true);
    const ok = await submitForm(formEl, 'brand');
    if (ok) {
      formEl.reset();
      setBrandService('embedded');
      setBrandRoles([]);
      setBrandTimeline('flexible');
      setThanksOpen(true);
    } else {
      alert('Sorry - something went wrong. Please email info@beaconmediasolutions.com directly.');
    }
    setSubmitting(false);
  };

  // Mobile sidebar menu state. On screens < 760px the inline top-nav is
  // hidden in favour of a hamburger toggle that slides in a right-side
  // sheet. The desktop nav (.top-nav) and the hamburger live in the same
  // .bar - CSS swaps which one is visible at the breakpoint.
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  const scrollRef = useRef<HTMLDivElement>(null);

  // IntersectionObserver-driven reveal: the .dest CSS animates .anim → .anim.in.
  // We mirror the CreativesApp behavior so the same staggered entrances fire on
  // this static page.
  useEffect(() => {
    const root = scrollRef.current;
    if (!root) return;
    root.querySelectorAll('.anim').forEach((el) => el.classList.remove('in'));
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('in');
            obs.unobserve(e.target);
          }
        });
      },
      { rootMargin: '0px 0px -60px 0px', threshold: 0.07 },
    );
    root.querySelectorAll('.anim').forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  const scrollToForm = () => {
    scrollRef.current?.querySelector('.contact-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <main className={s.page}>
      <ThanksPopup open={thanksOpen} onClose={() => setThanksOpen(false)} />
      {navWashOverlay}
      {fromSplash && <BrandsArrivalWash />}

      {/* Top bar - unified with the creative pathway pages (.bar / .wordmark /
          .top-nav globals). Desktop shows the inline three-link nav. Mobile
          (< 760px) hides the inline nav and shows a hamburger button instead;
          tapping it opens a slide-in side sheet with the same links. */}
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
            href="/creatives/embedded"
            onClick={(e) => {
              if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
              e.preventDefault();
              navWash('/creatives/embedded');
            }}
          >
            For Creatives
          </Link>
          <Link
            href="/about?from=brands"
            onClick={(e) => {
              if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
              e.preventDefault();
              navWash('/about?from=brands');
            }}
          >
            About
          </Link>
          <Link
            href="/contact?from=brands"
            onClick={(e) => {
              if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
              e.preventDefault();
              navWash('/contact?from=brands');
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
          links plus the connect block. Backdrop dims the page and closes the
          menu on tap. Body scroll is locked while open. */}
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
            href="/about?from=brands"
            onClick={(e) => {
              if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
              e.preventDefault();
              setMenuOpen(false);
              navWash('/about?from=brands');
            }}
          >
            About
          </Link>
          <Link
            href="/contact?from=brands"
            onClick={(e) => {
              if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
              e.preventDefault();
              setMenuOpen(false);
              navWash('/contact?from=brands');
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

      {/* Destination-overlay content port. The `dest show` classes pull the
          full global typography + grid system in; .destStatic overrides .dest's
          fixed positioning so it scrolls as part of the page. */}
      <div className={`dest show ${s.destStatic}`}>
        <div className="scroll" ref={scrollRef}>

          {/* Hero */}
          <section className="hero-section">
            <div className="container">
              <div className="kicker anim" style={{ transitionDelay: '0ms' }}>For Brands</div>
              <h1 className="display anim" style={{ transitionDelay: '160ms' }}>
                One partner. <em>Two ways</em> to scale your creative output.
              </h1>
              <p className="lead anim" style={{ transitionDelay: '380ms' }}>
                Some teams need ongoing, in-house creative capability. Others need a full project delivered, end-to-end. Beacon does both - without the agency layer, the freelancer churn, or the cost of building a creative team from scratch.
              </p>
              <div className="actions anim" style={{ transitionDelay: '560ms' }}>
                <button type="button" className="cta" onClick={scrollToForm}>
                  Start the conversation
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
                </button>
                <a href="#process" className="cta ghost">How we work</a>
              </div>
            </div>
          </section>

          {/* SERVICE 01 - Embedded Solutions */}
          <div id="services" className="container">
            <div className="section-rule anim">
              <div className="label">01 · Embedded Solutions</div>
              <div className="line"></div>
            </div>
            <div className="case split anim">
              <div className="slot-frame tall">
                <img
                  alt="Designer working in a creative workspace"
                  src="https://images.unsplash.com/photo-1497032628192-86f99bcd76bc?w=1600&q=80&auto=format&fit=crop"
                  loading="lazy"
                />
              </div>
              <div>
                <div className="meta">Beacon Media Solutions</div>
                <h3>A dedicated creative <em>inside your team</em>. None of the hiring overhead.</h3>
                <p>
                  We place full-time creatives directly into your organisation - across video, design, photography, web, and content. They work as part of your internal brand, aligned to your workflows, your tone, your goals, while Beacon handles payroll, HR, training, and admin.
                </p>
                <p>
                  The result is in-house consistency without the cost of building in-house, and zero churn from unreliable freelancers.
                </p>
                <ul className="features anim">
                  <li>Full-time creatives matched on skill set AND organisational fit.</li>
                  <li>End-to-end backend support - hiring, onboarding, day-to-day operations.</li>
                  <li>Scalable as you grow: start with one creative, build to a regional team.</li>
                </ul>
                <div className="actions">
                  <button type="button" className="cta" onClick={scrollToForm}>
                    Embed a creative
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* SERVICE 02 - Media Production */}
          <div className="container">
            <div className="section-rule anim">
              <div className="label">02 · Media Production</div>
              <div className="line"></div>
            </div>
            <div className="case split-flip anim">
              <div>
                <div className="meta">Beacon Media Productions</div>
                <h3>End-to-end media projects - <em>delivered.</em></h3>
                <p>
                  When you need a project shipped at scale, our in-house production team takes it from brief to final cut. Thoughtful creative direction. Disciplined execution. Built for organisations that need consistency without managing the people who produce it.
                </p>
                <ol className="capabilities anim">
                  <li>
                    <span className="cap-n">01</span>
                    <span className="cap-title">Video production</span>
                    <span className="cap-tag">Brand films · Campaign work · Social-first formats</span>
                  </li>
                  <li>
                    <span className="cap-n">02</span>
                    <span className="cap-title">Social media content</span>
                    <span className="cap-tag">Vertical-native · Platform-fluent · Ship-ready</span>
                  </li>
                  <li>
                    <span className="cap-n">03</span>
                    <span className="cap-title">Content strategy</span>
                    <span className="cap-tag">Tied to outcomes · Not just deliverables</span>
                  </li>
                  <li>
                    <span className="cap-n">04</span>
                    <span className="cap-title">Studio rentals</span>
                    <span className="cap-tag">Fully-equipped · Shoots, interviews, content days</span>
                  </li>
                  <li>
                    <span className="cap-n">05</span>
                    <span className="cap-title">Virtual production</span>
                    <span className="cap-tag">LED volume · Real-time workflows</span>
                  </li>
                </ol>
                <div className="actions" style={{ marginTop: 32 }}>
                  <button type="button" className="cta" onClick={scrollToForm}>
                    Brief a project
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
                  </button>
                </div>
              </div>
              <div className="slot-frame tall">
                <img
                  alt="Production set"
                  src="https://images.unsplash.com/photo-1528306831262-6ac4d8b54a43?w=1600&q=80&auto=format&fit=crop"
                  loading="lazy"
                />
              </div>
            </div>
          </div>

          {/* Embedded vs Projects - decision-aid table. Sits right after
              the two service blocks so a reader who's just absorbed both
              can decide which fits before diving into How It Works. */}
          <div className="container">
            <div className="section-rule anim">
              <div className="label">Which Service Fits</div>
              <div className="line"></div>
            </div>
            <div className={`${s.compareTable} anim`} role="table" aria-label="Embedded vs Project Delivery">
              <div className={s.compareRow} role="row">
                <div className={s.compareLabel} role="rowheader" />
                <div className={s.compareColHead} role="columnheader">Embedded</div>
                <div className={s.compareColHead} role="columnheader">Projects</div>
              </div>
              <div className={s.compareRow} role="row">
                <div className={s.compareLabel} role="rowheader">Engagement</div>
                <div className={s.compareCell} role="cell">Ongoing - creative joins your team</div>
                <div className={s.compareCell} role="cell">Per project - we deliver, you sign off</div>
              </div>
              <div className={s.compareRow} role="row">
                <div className={s.compareLabel} role="rowheader">Timeline</div>
                <div className={s.compareCell} role="cell">21-day match + onboarding</div>
                <div className={s.compareCell} role="cell">Project kick-off in 1-2 weeks</div>
              </div>
              <div className={s.compareRow} role="row">
                <div className={s.compareLabel} role="rowheader">Output</div>
                <div className={s.compareCell} role="cell">Sustained content, every week</div>
                <div className={s.compareCell} role="cell">A scoped deliverable, shipped</div>
              </div>
              <div className={s.compareRow} role="row">
                <div className={s.compareLabel} role="rowheader">Team</div>
                <div className={s.compareCell} role="cell">Sits inside your org</div>
                <div className={s.compareCell} role="cell">Beacon team you don't manage</div>
              </div>
              <div className={s.compareRow} role="row">
                <div className={s.compareLabel} role="rowheader">Billing</div>
                <div className={s.compareCell} role="cell">Monthly retainer</div>
                <div className={s.compareCell} role="cell">Fixed project fee</div>
              </div>
              <div className={s.compareRow} role="row">
                <div className={s.compareLabel} role="rowheader">Best for</div>
                <div className={s.compareCell} role="cell">Brand-aligned ongoing creative capacity</div>
                <div className={s.compareCell} role="cell">Tightly-scoped media deliverables</div>
              </div>
            </div>
          </div>

          {/* How it works - horizontal step flow with connecting hairlines.
              Sequential process reads better as a journey than parallel
              cards (visual variety from the Vetting box grid below). */}
          <div id="process" className="container">
            <div className="section-rule anim">
              <div className="label">How It Works</div>
              <div className="line"></div>
            </div>
            <div className={`${s.processFlow} anim`}>
              <div className={`${s.processStep} anim`}>
                <div className={s.processNum}>01</div>
                <h4 className={s.processTitle}>Discovery call</h4>
                <p className={s.processBody}>We understand your goals, team structure, and content needs.</p>
              </div>
              <div className={`${s.processStep} anim`}>
                <div className={s.processNum}>02</div>
                <h4 className={s.processTitle}>Match or scope</h4>
                <p className={s.processBody}>For Embedded, we match you with vetted creatives. For Projects, we scope the work.</p>
              </div>
              <div className={`${s.processStep} anim`}>
                <div className={s.processNum}>03</div>
                <h4 className={s.processTitle}>Onboard or kick off</h4>
                <p className={s.processBody}>Seamless integration into your team, or rapid project kick-off.</p>
              </div>
              <div className={`${s.processStep} anim`}>
                <div className={s.processNum}>04</div>
                <h4 className={s.processTitle}>Deliver and scale</h4>
                <p className={s.processBody}>Consistent output, measurable impact, room to grow.</p>
              </div>
            </div>
          </div>

          {/* The Vetting - 3-card grid (overrides the 4-col pillars layout) */}
          <div className="container">
            <div className="section-rule anim">
              <div className="label">The Vetting</div>
              <div className="line"></div>
            </div>
            <p className="lead anim" style={{ marginBottom: 32 }}>
              Three things separate a Beacon creative from the open freelance market.
            </p>
            <div className={`pillars ${s.vettingGrid}`}>
              <div className="pillar anim">
                <div className="pillar-n">01</div>
                <h4>Skill-tested</h4>
                <p>Every creative is portfolio-reviewed and skill-assessed before joining the Beacon network.</p>
              </div>
              <div className="pillar anim">
                <div className="pillar-n">02</div>
                <h4>Brand-aligned</h4>
                <p>We match based on aesthetic, discipline, and working style - not just availability.</p>
              </div>
              <div className="pillar anim">
                <div className="pillar-n">03</div>
                <h4>Reliable</h4>
                <p>No ghosting, no missed deadlines. We back the people we place.</p>
              </div>
            </div>
          </div>

          {/* Why Beacon - editorial numbered list with hairline dividers.
              Four value props read more deliberately as prose-style rows
              than as parallel cards (visual variety from the boxed Vetting
              grid above). */}
          <div className="container">
            <div className="section-rule anim">
              <div className="label">Why Beacon</div>
              <div className="line"></div>
            </div>
            <div className={`${s.editorialList} anim`}>
              <div className={s.editorialItem}>
                <div className={s.editorialNum}>01</div>
                <div className={s.editorialBody}>
                  <h4 className={s.editorialTitle}>Strategic alignment</h4>
                  <p>We match talent on skillset AND organisational fit, so they integrate as a real teammate from day one.</p>
                </div>
              </div>
              <div className={s.editorialItem}>
                <div className={s.editorialNum}>02</div>
                <div className={s.editorialBody}>
                  <h4 className={s.editorialTitle}>End-to-end support</h4>
                  <p>From onboarding to day-to-day operations, we handle the backend so you can focus on the work.</p>
                </div>
              </div>
              <div className={s.editorialItem}>
                <div className={s.editorialNum}>03</div>
                <div className={s.editorialBody}>
                  <h4 className={s.editorialTitle}>Scalable model</h4>
                  <p>Whether you&rsquo;re building an in-house team or supplementing an existing one, we grow with your needs.</p>
                </div>
              </div>
              <div className={s.editorialItem}>
                <div className={s.editorialNum}>04</div>
                <div className={s.editorialBody}>
                  <h4 className={s.editorialTitle}>Creative integrity</h4>
                  <p>Our consultants are handpicked for professionalism, creativity, and commitment to the standard we hold.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Honest fit check - "Built for / Not built for". Same self-
              selection pattern used on the creative pathway pages, adapted
              for brand procurement readers. Disqualifying the wrong-fit
              reader is the strongest move on a page like this. */}
          <div className="container">
            <div className="section-rule anim">
              <div className="label">Honest Fit Check</div>
              <div className="line"></div>
            </div>
            <div className={`${s.fitGrid} anim`}>
              <div className={`${s.fitCol} ${s.fitFor}`}>
                <div className={s.fitHead}>
                  <span className={s.fitMark} aria-hidden="true">✓</span>
                  <span className={s.fitTitle}>Built for</span>
                </div>
                <ul className={s.fitList}>
                  <li>Brands with sustained content needs that one freelancer can't cover</li>
                  <li>Teams scaling past what an internal hire can deliver alone</li>
                  <li>Organisations that want craft consistency without managing freelancer churn</li>
                  <li>Operators who want a creative who lives the brand, not someone passing through</li>
                  <li>Companies ready to invest in long-term creative capacity, not just deliverables</li>
                </ul>
              </div>
              <div className={`${s.fitCol} ${s.fitNot}`}>
                <div className={s.fitHead}>
                  <span className={s.fitMark} aria-hidden="true">-</span>
                  <span className={s.fitTitle}>Not built for</span>
                </div>
                <ul className={s.fitList}>
                  <li>One-off pitch decks or single-deliverable projects</li>
                  <li>Work that needs to start tomorrow with no scoping conversation</li>
                  <li>Pure agency-style production with no in-team integration</li>
                  <li>Brands looking to underbid market rates on creative work</li>
                  <li>Teams that prefer to manage a freelance roster directly</li>
                </ul>
              </div>
            </div>
          </div>

          {/* By The Numbers */}
          <div className="container">
            <div className="section-rule anim">
              <div className="label">By The Numbers</div>
              <div className="line"></div>
            </div>
            <div className="brand-stats anim">
              {/* Stats unified across brands, /creatives/embedded, and
                  /creatives/projects so the same numbers tell the same
                  story everywhere on the site. */}
              <div className="brand-stat">
                <span className="brand-stat-num">50+</span>
                <span className="brand-stat-label">Creatives engaged</span>
              </div>
              <div className="brand-stat">
                <span className="brand-stat-num">6+</span>
                <span className="brand-stat-label">Brand partners</span>
              </div>
              <div className="brand-stat">
                <span className="brand-stat-num">SG / SEA</span>
                <span className="brand-stat-label">Singapore + Southeast Asia</span>
              </div>
            </div>
          </div>

          {/* Brand-side testimonial - one quoted brand operator carries more
              weight on a procurement page than another pillar. Replace with
              a real quote once you have permission - the structure is in
              place. */}
          <div className="container">
            <div className="section-rule anim">
              <div className="label">From a brand operator</div>
              <div className="line"></div>
            </div>
            <blockquote className={`${s.brandQuote} anim`}>
              <svg className={s.brandQuoteMark} width="42" height="36" viewBox="0 0 42 36" aria-hidden="true">
                <path d="M0 36V20.4c0-6.4 1.4-11.4 4.2-15S11 0 16 0v6c-3.2 0-5.6 1-7.2 3s-2.4 4.4-2.4 7.2v.6h9V36H0zm24 0V20.4c0-6.4 1.4-11.4 4.2-15S35 0 40 0v6c-3.2 0-5.6 1-7.2 3s-2.4 4.4-2.4 7.2v.6h9V36H24z" fill="currentColor"/>
              </svg>
              <p>
                We tried agencies and we tried freelance. Both broke down at the same place - nobody was inside our team long enough to actually get the brand. Beacon embedded a creative who's now shipping more polished content in a month than we used to get in a quarter.
              </p>
              <cite>A Beacon brand partner · placement ongoing</cite>
            </blockquote>
          </div>

          {/* FAQ - the questions procurement actually asks before signing.
              Native <details>/<summary> for accessibility + free keyboard
              support; shared `name` makes it an exclusive accordion. */}
          <div className="container">
            <div className="section-rule anim">
              <div className="label">Plainly Put</div>
              <div className="line"></div>
            </div>
            <div className={`${s.faqGrid} anim`}>
              <div className={s.faqIntro}>
                <p className={s.faqIntroText}>
                  The questions brand operators ask before signing.
                </p>
                <p className={s.faqIntroFallback}>
                  Don&apos;t see your question?
                </p>
                <a className={s.faqIntroLink} href="mailto:info@beaconmediasolutions.com">
                  info@beaconmediasolutions.com
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </a>
              </div>
              <div className={s.faqList}>
                <details className={s.faqRow} name="brand-faq">
                  <summary className={s.faqQ}>
                    <span>Who actually employs the creative?</span>
                    <span className={s.faqChev} aria-hidden="true">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
                    </span>
                  </summary>
                  <div className={s.faqA}>
                    Beacon. We write the contract, run payroll, handle CPF + statutory contributions, and cover leave and healthcare. You direct the day-to-day work; we handle the employment side. No 1099-style misclassification, no hidden HR exposure on your end.
                  </div>
                </details>
                <details className={s.faqRow} name="brand-faq">
                  <summary className={s.faqQ}>
                    <span>What if the placement isn&apos;t working out?</span>
                    <span className={s.faqChev} aria-hidden="true">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
                    </span>
                  </summary>
                  <div className={s.faqA}>
                    48-hour swap-out window in the first two days, no penalty either way. Beyond that, raise it with your Beacon lead - we either resolve it or re-match. Long-term, you can end the engagement with two weeks&apos; notice. No claw-backs.
                  </div>
                </details>
                <details className={s.faqRow} name="brand-faq">
                  <summary className={s.faqQ}>
                    <span>How fast can we get a creative on the team?</span>
                    <span className={s.faqChev} aria-hidden="true">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
                    </span>
                  </summary>
                  <div className={s.faqA}>
                    For Embedded, plan on ~21 days from first call to onboarded creative on your team - the slow step is matching for craft AND culture fit, which we don&apos;t shortcut. For project work, kick-off is usually 1-2 weeks from a signed scope.
                  </div>
                </details>
                <details className={s.faqRow} name="brand-faq">
                  <summary className={s.faqQ}>
                    <span>How does pricing work?</span>
                    <span className={s.faqChev} aria-hidden="true">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
                    </span>
                  </summary>
                  <div className={s.faqA}>
                    Embedded is a monthly retainer that covers the creative&apos;s salary, statutory contributions, and the Beacon support layer. Project work is quoted per scope on a fixed fee. We share a transparent breakdown - you see the creative cost and the Beacon margin separately.
                  </div>
                </details>
                <details className={s.faqRow} name="brand-faq">
                  <summary className={s.faqQ}>
                    <span>Who owns the work and IP?</span>
                    <span className={s.faqChev} aria-hidden="true">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
                    </span>
                  </summary>
                  <div className={s.faqA}>
                    You do. Every contract assigns full IP and usage rights of work produced during the placement to your organisation. Creatives retain portfolio rights to show the work after delivery; we agree any embargo period upfront so there are no surprises.
                  </div>
                </details>
                <details className={s.faqRow} name="brand-faq">
                  <summary className={s.faqQ}>
                    <span>Can we hire the creative directly after a placement?</span>
                    <span className={s.faqChev} aria-hidden="true">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
                    </span>
                  </summary>
                  <div className={s.faqA}>
                    Yes. If a placement converts to a direct hire on your payroll, we broker the move - no placement fee, no claw-back. The model only works if the creative and the brand both feel free to take the right next step.
                  </div>
                </details>
              </div>
            </div>
          </div>

          {/* Brand intake form */}
          <div id="work-with-us" className="container">
            <div className="section-rule anim">
              <div className="label">Work With Us</div>
              <div className="line"></div>
            </div>
            <div className="cf-wrap anim">
              <div className="contact-form">
                <div className="cf-info">
                  <span className="cf-label">For brands</span>
                  <p className="cf-info-title">One partner. Two ways to scale your creative output.</p>
                  <p className="cf-info-body">
                    Tell us what you&rsquo;re building. We&rsquo;ll match you with the right creative talent - embedded in your team or delivered as a project.
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
                    <div className="cf-detail">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                      <a href="mailto:info@beaconmediasolutions.com">info@beaconmediasolutions.com</a>
                    </div>
                    <div className="cf-detail">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0z"/><circle cx="12" cy="10" r="3"/></svg>
                      <span>141 Cecil Street #08-07<br/>Tung Ann Association Building<br/>Singapore 069541</span>
                    </div>
                  </div>
                  <div className="cf-social">
                    <a href="https://www.instagram.com/beaconmediasg/" target="_blank" rel="noopener noreferrer" aria-label="Instagram"><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" stroke="none"/></svg></a>
                    <a href="https://www.linkedin.com/company/beacon-media-solutions/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn"><svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg></a>
                  </div>
                </div>
                <form
                  className="cf-fields"
                  action={FORM_ENDPOINT}
                  method="POST"
                  onSubmit={handleBrandSubmit}
                >
                  {/* Form-kind discriminator. /api/contact uses this to
                      pick the right subject line + email preset. */}
                  <input type="hidden" name="form" value="brand" />
                  <div className="cf-row two">
                    <div className="cf-field">
                      <span className="cf-label">Name</span>
                      <input type="text" name="name" placeholder="Your name" required />
                    </div>
                    <div className="cf-field">
                      <span className="cf-label">Email</span>
                      <input type="email" name="email" placeholder="your@email.com" required />
                    </div>
                  </div>
                  <div className="cf-field">
                    <span className="cf-label">Organisation</span>
                    <input type="text" name="organisation" placeholder="Your company or brand name" />
                  </div>
                  <div className="cf-field">
                    <span className="cf-label">I need</span>
                    <div className="cf-toggle wide">
                      {BRAND_SERVICE.map(([v, l]) => (
                        <button key={v} type="button" className={`cf-toggle-btn${brandService === v ? ' on' : ''}`} onClick={() => setBrandService(v)}>{l}</button>
                      ))}
                    </div>
                    <input type="hidden" name="service" value={labelFor(BRAND_SERVICE, brandService)} />
                  </div>
                  <div className="cf-field">
                    <span className="cf-label">Creative roles needed</span>
                    <div className="cf-toggle wide">
                      {['Videographer', 'Editor', 'Designer', 'Content creator', 'Photographer', 'Frontend developer', 'Backend developer', 'Full-stack developer', 'AI specialist'].map((role) => (
                        <button key={role} type="button" className={`cf-toggle-btn${brandRoles.includes(role) ? ' on' : ''}`} onClick={() => toggleBrandRole(role)}>{role}</button>
                      ))}
                    </div>
                    <input type="hidden" name="roles" value={brandRoles.join(', ')} />
                  </div>
                  <div className="cf-field">
                    <span className="cf-label">Timeline</span>
                    <div className="cf-toggle wide">
                      {BRAND_TIMELINE.map(([v, l]) => (
                        <button key={v} type="button" className={`cf-toggle-btn${brandTimeline === v ? ' on' : ''}`} onClick={() => setBrandTimeline(v)}>{l}</button>
                      ))}
                    </div>
                    <input type="hidden" name="timeline" value={labelFor(BRAND_TIMELINE, brandTimeline)} />
                  </div>
                  <div className="cf-field">
                    <span className="cf-label">Tell us more</span>
                    <textarea name="message" rows={4} placeholder="What are you trying to build, and what's the context?" />
                  </div>
                  <div>
                    <button type="submit" className="cta" disabled={submitting} aria-busy={submitting}>
                      {submitting ? 'Sending…' : 'Submit enquiry'}
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* Closing */}
          <div className="container narrow closing">
            <h2 className="anim">One creative or a regional team - we make it seamless, strategic, and scalable.</h2>
          </div>

          {/* Cinematic footer - unified with the creative pathway pages. Lives
              inside the .dest wrapper so the global .dest .dest-footer styles
              apply (large centered BEACON wordmark, sans-caps tagline, gold
              hairline divider with a four-point spark at its centre, then
              two-column nav + connect block + meta line). */}
          <footer className="dest-footer">
            <div className="container">
              <div className="ft-mark">BEACON</div>
              <div className="ft-tagline">EMPOWERING CREATIVES. ELEVATING BRANDS.</div>

              <div className="ft-divider" aria-hidden="true">
                <span className="ft-rule-left"></span>
                <svg className="ft-spark" width="14" height="14" viewBox="0 0 14 14">
                  <path d="M7 0 L8.2 5.8 L14 7 L8.2 8.2 L7 14 L5.8 8.2 L0 7 L5.8 5.8 Z" fill="currentColor" />
                </svg>
                <span className="ft-rule-right"></span>
              </div>

              <div className="ft-cols">
                <div className="ft-col">
                  <div className="ft-label">Navigate</div>
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
                    href="/about?from=brands"
                    onClick={(e) => {
                      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
                      e.preventDefault();
                      navWash('/about?from=brands');
                    }}
                  >
                    About
                  </Link>
                  <Link
                    href="/contact?from=brands"
                    onClick={(e) => {
                      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
                      e.preventDefault();
                      navWash('/contact?from=brands');
                    }}
                  >
                    Contact
                  </Link>
                </div>
                <div className="ft-col">
                  <div className="ft-label">Pathways</div>
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

              <div className="ft-connect">
                <div className="ft-label">Connect</div>
                <a className="ft-email" href="mailto:info@beaconmediasolutions.com">info@beaconmediasolutions.com</a>
                <div className="ft-location">
                  141 Cecil Street #08-07<br />
                  Tung Ann Association Building<br />
                  Singapore 069541
                </div>
                <div className="ft-social">
                  <a href="https://www.instagram.com/beaconmediasg/" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" stroke="none" /></svg>
                  </a>
                  <a href="https://www.linkedin.com/company/beacon-media-solutions/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z" /><rect x="2" y="9" width="4" height="12" /><circle cx="4" cy="4" r="2" /></svg>
                  </a>
                </div>
              </div>

              <div className="ft-meta">
                <span>© {year} Beacon Media Solutions. All rights reserved.</span>
                <span aria-hidden="true"> · </span>
                <span>Designed by Kairos Cheng</span>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </main>
  );
}
