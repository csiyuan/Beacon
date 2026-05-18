'use client';

import { useState } from 'react';

/* ─────────────────────────────────────────────────────────────────────────
   <ProjectsIntakeForm> - application form for the project-based creative
   pathway. Same visual treatment as the brand intake form, but the field
   set is geared at freelance creatives joining the roster: portfolio +
   day rate + disciplines + capacity + project types they'd like more of.
   ───────────────────────────────────────────────────────────────────────── */

const DISCIPLINES = ['Videographer', 'Editor', 'Designer', 'Content creator', 'Photographer', 'Frontend developer', 'Backend developer', 'Full-stack developer', 'AI specialist'];

const CAPACITY: ReadonlyArray<readonly [string, string]> = [
  ['1-5', '1–5 days / month'],
  ['5-10', '5–10 days / month'],
  ['10-20', '10–20 days / month'],
  ['20+', '20+ days / month'],
];

const PROJECT_TYPES = [
  'Brand films',
  'Social content',
  'Product / commerce',
  'Campaign work',
  'Documentary / long-form',
  'Event coverage',
  'Web / digital builds',
];

export default function ProjectsIntakeForm() {
  const [disciplines, setDisciplines] = useState<string[]>([]);
  const [capacity, setCapacity] = useState<string>('5-10');
  const [projectTypes, setProjectTypes] = useState<string[]>([]);

  const toggle = (val: string, list: string[], setter: (v: string[]) => void) => {
    setter(list.includes(val) ? list.filter((v) => v !== val) : [...list, val]);
  };

  return (
    <div className="cf-wrap">
      <div className="contact-form">
        {/* ─── Info panel ───────────────────────────────────────────── */}
        <div className="cf-info">
          <span className="cf-label">For creatives · Project-based</span>
          <p className="cf-info-title">Project work that fits your craft and your week.</p>
          <p className="cf-info-body">
            Join the roster once. We&rsquo;ll send you fully-scoped briefs that match your discipline, your day rate, and your stated availability - take what fits, pass on the rest.
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
            <a href="#" aria-label="Instagram"><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" stroke="none" /></svg></a>
            <a href="#" aria-label="LinkedIn"><svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z" /><rect x="2" y="9" width="4" height="12" /><circle cx="4" cy="4" r="2" /></svg></a>
            <a href="#" aria-label="TikTok"><svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.27 8.27 0 0 0 4.84 1.55V6.79a4.85 4.85 0 0 1-1.07-.1z" /></svg></a>
            <a href="#" aria-label="YouTube"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" /><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill="currentColor" stroke="none" /></svg></a>
          </div>
        </div>

        {/* ─── Form fields ──────────────────────────────────────────── */}
        <form className="cf-fields" onSubmit={(e) => e.preventDefault()}>
          <div className="cf-row two">
            <div className="cf-field">
              <span className="cf-label">Name</span>
              <input type="text" placeholder="Your name" />
            </div>
            <div className="cf-field">
              <span className="cf-label">Email</span>
              <input type="email" placeholder="your@email.com" />
            </div>
          </div>
          <div className="cf-row two">
            <div className="cf-field">
              <span className="cf-label">Portfolio / Showreel</span>
              <input type="url" placeholder="https://yourportfolio.com" />
            </div>
            <div className="cf-field">
              <span className="cf-label">Day rate (SGD)</span>
              <input type="text" placeholder="e.g. 800 / day" inputMode="numeric" />
            </div>
          </div>
          <div className="cf-field">
            <span className="cf-label">Disciplines (pick all that apply)</span>
            <div className="cf-toggle wide">
              {DISCIPLINES.map((d) => (
                <button
                  key={d}
                  type="button"
                  className={`cf-toggle-btn${disciplines.includes(d) ? ' on' : ''}`}
                  onClick={() => toggle(d, disciplines, setDisciplines)}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
          <div className="cf-field">
            <span className="cf-label">Capacity</span>
            <div className="cf-toggle wide">
              {CAPACITY.map(([v, l]) => (
                <button
                  key={v}
                  type="button"
                  className={`cf-toggle-btn${capacity === v ? ' on' : ''}`}
                  onClick={() => setCapacity(v)}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
          <div className="cf-field">
            <span className="cf-label">Project types you want more of</span>
            <div className="cf-toggle wide">
              {PROJECT_TYPES.map((p) => (
                <button
                  key={p}
                  type="button"
                  className={`cf-toggle-btn${projectTypes.includes(p) ? ' on' : ''}`}
                  onClick={() => toggle(p, projectTypes, setProjectTypes)}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div className="cf-field">
            <span className="cf-label">About you</span>
            <textarea rows={4} placeholder="A short note on the kind of briefs that get you excited, brands you've worked with, signature style..." />
          </div>
          <div>
            <button type="submit" className="cta">
              Join the roster
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
