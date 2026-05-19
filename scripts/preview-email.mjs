// Renders a sample of each form's email to /tmp/beacon-email-<form>.html
// so you can preview the design in a browser before wiring Resend up.
//
// Usage:  node scripts/preview-email.mjs
// Then:   open /tmp/beacon-email-brand.html  (etc)

import { buildEmailHtml } from '../lib/email-template.ts';
import { writeFileSync } from 'node:fs';

const samples = {
  // ─── "Normal" submissions - typical first-touch enquiries ───────────
  brand: {
    subject: 'New brand enquiry · Beacon',
    headline: 'A new brand wants to talk.',
    intro: 'Submitted through the brands page intake form.',
    replyTo: 'kairos@beaconmediasolutions.com',
    replyToName: 'Kairos Cheng',
    fields: [
      { label: 'Name', value: 'Kairos Cheng' },
      { label: 'Email', value: 'kairos@beaconmediasolutions.com' },
      { label: 'Organisation', value: 'Beacon Media Solutions' },
      { label: 'Service', value: 'Embedded creative + production' },
      { label: 'Roles needed', value: 'Videographer, Editor, Designer' },
      { label: 'Timeline', value: '1-3 months' },
    ],
    message: {
      label: 'Message',
      body: 'We’re launching a new vertical in Q3 and want a creative who can live inside our marketing team for the run-up. Two-day discovery sprint to start, then weekly - would love to talk about how Beacon would scope this.',
    },
  },
  embedded: {
    subject: 'New embedded pathway application · Beacon',
    headline: 'A creative wants to embed.',
    intro: 'Submitted through the embedded creative pathway intake form.',
    replyTo: 'mei@example.com',
    replyToName: 'Mei Tan',
    fields: [
      { label: 'Name', value: 'Mei Tan' },
      { label: 'Email', value: 'mei@example.com' },
      { label: 'Portfolio / Showreel', value: 'https://meitan.work' },
      { label: 'Craft', value: 'Editor' },
      { label: 'Availability', value: '1 month notice' },
    ],
    message: {
      label: 'About them',
      body: 'Six years cutting brand films at a Singapore agency, recently freelance. Looking to embed somewhere I can own a brand’s visual rhythm end-to-end - not just deliver to a brief, but help shape what gets made.',
    },
  },
  projects: {
    subject: 'New project-based roster application · Beacon',
    headline: 'A creative wants to join the roster.',
    intro: 'Submitted through the project-based pathway intake form.',
    replyTo: 'aaron@example.com',
    replyToName: 'Aaron Lim',
    fields: [
      { label: 'Name', value: 'Aaron Lim' },
      { label: 'Email', value: 'aaron@example.com' },
      { label: 'Portfolio / Showreel', value: 'https://aaronlim.tv' },
      { label: 'Day rate', value: 'SGD 800 / day' },
      { label: 'Disciplines', value: 'Videographer, Editor, Photographer' },
      { label: 'Capacity', value: '5-10 days / month' },
      { label: 'Project types wanted', value: 'Brand films, Campaign work, Documentary / long-form' },
    ],
    message: {
      label: 'About them',
      body: 'Documentary instinct, commercial polish. Strongest on intimate, character-led pieces - the kind of work where the camera notices something a director didn’t plan for.',
    },
  },
  creatives: {
    subject: 'New enquiry from the creatives page · Beacon',
    headline: 'A new signal from the creatives page.',
    intro: 'Submitted through the creatives destination contact form.',
    replyTo: 'rin@example.com',
    replyToName: 'Rin Park',
    fields: [
      { label: 'Name', value: 'Rin Park' },
      { label: 'Email', value: 'rin@example.com' },
      { label: 'They are a', value: 'creative' },
    ],
    message: {
      label: 'Message',
      body: 'Hello - I’m a motion designer based in Tokyo, interested in the embedded pathway. Happy to share a reel.',
    },
  },

  // ─── Maxed-out submissions - stress-test layout with every field
  //     filled and a multi-paragraph message body ────────────────────────
  'brand-full': {
    subject: 'New brand enquiry · Beacon',
    headline: 'A new brand wants to talk.',
    intro: 'Submitted through the brands page intake form.',
    replyTo: 'amelia.tan@northwind-collective.com',
    replyToName: 'Amelia Tan',
    fields: [
      { label: 'Name', value: 'Amelia Tan' },
      { label: 'Email', value: 'amelia.tan@northwind-collective.com' },
      { label: 'Organisation', value: 'Northwind Collective - a hospitality group operating six restaurants and two hotels across Singapore, Bali, and Bangkok' },
      { label: 'Service', value: 'Embedded creative + end-to-end production (both)' },
      {
        label: 'Roles needed',
        value:
          'Videographer, Editor, Designer, Content creator, Photographer, Motion designer, Copywriter, Social producer, Brand strategist',
      },
      { label: 'Timeline', value: 'ASAP - ideally onboarding within 3 weeks, kickoff workshop in week 4' },
    ],
    message: {
      label: 'Message',
      body:
        'We’re consolidating creative output across the whole group - currently six restaurants and two hotels, all with their own freelancers, no shared visual rhythm, and a brand book that hasn’t been touched since 2021. The board has approved a full rebuild for next year.\n\nWhat we need is someone who can sit inside our marketing team three days a week for the first six months: rebuilding the system, training our in-house producer, and quietly shaping every piece of content that ships during the relaunch. Then we’d like to scale them into a Director of Brand role if it’s the right fit on both sides.\n\nWe’ve looked at the three big agencies in Singapore. The fit isn’t there - we need someone embedded, not pitching to us once a quarter. Saw your work for the F&B group last year and the tone is exactly right. Would love a first call.',
    },
  },

  'projects-full': {
    subject: 'New project-based roster application · Beacon',
    headline: 'A creative wants to join the roster.',
    intro: 'Submitted through the project-based pathway intake form.',
    replyTo: 'jordan.okafor@studio-meridian.tv',
    replyToName: 'Jordan Okafor',
    fields: [
      { label: 'Name', value: 'Jordan Okafor' },
      { label: 'Email', value: 'jordan.okafor@studio-meridian.tv' },
      { label: 'Portfolio / Showreel', value: 'https://studio-meridian.tv/reel-2026 - most recent work is from a Tag Heuer regional campaign, finalists at AdFest 2025' },
      { label: 'Day rate', value: 'SGD 1,200 / day for principal, SGD 800 / day for self-shooting cuts. Negotiable for longer engagements.' },
      {
        label: 'Disciplines',
        value:
          'Videographer, Editor, Designer, Content creator, Photographer, Frontend developer, Full-stack developer, AI specialist',
      },
      { label: 'Capacity', value: '10-20 days / month - currently winding down a retainer, full capacity from June 2026' },
      {
        label: 'Project types wanted',
        value:
          'Brand films, Social content, Product / commerce, Campaign work, Documentary / long-form, Event coverage, Web / digital builds',
      },
    ],
    message: {
      label: 'About them',
      body:
        'I run a two-person operation out of Singapore - myself on direction and edit, my partner Mira on cinematography. Our specialty is the gap between brand film and short documentary: anchored, character-led pieces that still answer to a commercial brief. Past five years have been mostly luxury watch and skincare clients.\n\nWhat draws me to Beacon is the curation. I’ve seen too many roster decks where the work is technically fine but the editorial voice isn’t there. The pieces you’ve helped place - especially the Aesop spot last winter - feel like they were made by people who actually care about what they’re putting into the world. That’s the rooms I want to be in.\n\nHappy to work fully scoped or to come in earlier on strategy. I’ve been on both sides of the brief and prefer the side where the framing is still being decided.',
    },
  },
};

for (const [form, payload] of Object.entries(samples)) {
  const html = buildEmailHtml(payload);
  const path = `/tmp/beacon-email-${form}.html`;
  writeFileSync(path, html);
  console.log(`wrote ${path}`);
}
