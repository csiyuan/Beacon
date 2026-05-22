'use client';

import { useState, type FormEvent } from 'react';
import { FORM_ENDPOINT, submitForm } from '@/lib/forms';
import ThanksPopup from '@/components/ThanksPopup';

/* ─────────────────────────────────────────────────────────────────────────
   <EmbeddedIntakeForm> - application form for the full-time embedded
   creative pathway. Mirrors the brand intake form's two-column layout
   (info panel + form fields) and reuses the global .cf-* classes so the
   visual treatment matches the brands corporate page intake screen.
   ───────────────────────────────────────────────────────────────────────── */

const CRAFTS = ['Videographer', 'Editor', 'Designer', 'Content creator', 'Photographer', 'Frontend developer', 'Backend developer', 'Full-stack developer', 'AI specialist'];

const AVAILABILITY: ReadonlyArray<readonly [string, string]> = [
  ['now', 'Available now'],
  ['1m', '1 month notice'],
  ['2-3m', '2-3 months'],
  ['exploring', 'Just exploring'],
];

export default function EmbeddedIntakeForm() {
  const [craft, setCraft] = useState<string>('');
  const [avail, setAvail] = useState<string>('exploring');
  const [cv, setCv] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [thanksOpen, setThanksOpen] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting) return;
    const formEl = e.currentTarget;
    setSubmitting(true);
    const ok = await submitForm(formEl, 'embedded');
    if (ok) {
      formEl.reset();
      setCraft('');
      setAvail('exploring');
      setCv(null);
      setThanksOpen(true);
    } else {
      alert('Sorry - something went wrong. Please email hello@beaconmediasolutions.com directly.');
    }
    setSubmitting(false);
  };

  return (
    <div className="cf-wrap">
      <ThanksPopup open={thanksOpen} onClose={() => setThanksOpen(false)} />
      <div className="contact-form">
        {/* ─── Info panel ───────────────────────────────────────────── */}
        <div className="cf-info">
          <span className="cf-label">For creatives · Embedded</span>
          <p className="cf-info-title">Build a creative career inside brands that actually want you.</p>
          <p className="cf-info-body">
            Apply once. We&rsquo;ll keep your portfolio on file and reach out the moment we see a brand built for the kind of work you want to make.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
            <div className="cf-detail">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
              <a href="mailto:hello@beaconmediasolutions.com">hello@beaconmediasolutions.com</a>
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

        {/* ─── Form fields ──────────────────────────────────────────── */}
        <form
          className="cf-fields"
          action={FORM_ENDPOINT}
          method="POST"
          encType="multipart/form-data"
          onSubmit={handleSubmit}
        >
          <input type="hidden" name="form" value="embedded" />
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
            <span className="cf-label">Portfolio / Showreel</span>
            <input type="url" name="portfolio" placeholder="https://yourportfolio.com" />
          </div>
          <div className="cf-field">
            <span className="cf-label">CV / Résumé</span>
            <label className="cf-upload">
              <input
                type="file"
                name="cv"
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={(e) => setCv(e.target.files?.[0] ?? null)}
              />
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
              <span className="cf-upload-text">{cv ? cv.name : 'Upload PDF or Word doc'}</span>
            </label>
          </div>
          <div className="cf-field">
            <span className="cf-label">My craft</span>
            <div className="cf-toggle wide">
              {CRAFTS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`cf-toggle-btn${craft === c ? ' on' : ''}`}
                  onClick={() => setCraft(c)}
                >
                  {c}
                </button>
              ))}
            </div>
            <input type="hidden" name="craft" value={craft} />
          </div>
          <div className="cf-field">
            <span className="cf-label">Availability</span>
            <div className="cf-toggle wide">
              {AVAILABILITY.map(([v, l]) => (
                <button
                  key={v}
                  type="button"
                  className={`cf-toggle-btn${avail === v ? ' on' : ''}`}
                  onClick={() => setAvail(v)}
                >
                  {l}
                </button>
              ))}
            </div>
            <input type="hidden" name="availability" value={AVAILABILITY.find(([v]) => v === avail)?.[1] ?? avail} />
          </div>
          <div className="cf-field">
            <span className="cf-label">About you</span>
            <textarea name="about" rows={4} placeholder="Tell us about the kind of work, brands, and environments you're drawn to..." />
          </div>
          <div>
            <button type="submit" className="cta" disabled={submitting} aria-busy={submitting}>
              {submitting ? 'Sending…' : 'Submit application'}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
