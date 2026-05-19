import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { buildEmailHtml, buildEmailText, type Field } from '@/lib/email-template';

// ─────────────────────────────────────────────────────────────────────────
// /api/contact - single endpoint for all four intake forms.
//
// Flow:
//   1. Browser POSTs a normal HTML <form> (multipart/form-data so the
//      Embedded form's CV attachment passes through).
//   2. We read the `form` field to decide which preset (subject + headline)
//      to use, then fan the remaining fields out into a rows array for the
//      branded HTML email.
//   3. Resend ships the message; we 303-redirect to /thanks so the form
//      keeps working without JS.
//
// Env:
//   RESEND_API_KEY  - get one free at resend.com/api-keys
//   CONTACT_TO      - inbox to forward to (defaults to biz.siiyuan@gmail.com)
//   CONTACT_FROM    - sender ("Beacon <hello@yourdomain.com>" once you
//                     verify a domain in Resend; until then leave unset to
//                     fall back to Resend's onboarding sender)
// ─────────────────────────────────────────────────────────────────────────

export const runtime = 'nodejs';

type FormKind = 'brand' | 'embedded' | 'projects' | 'creatives';

const PRESETS: Record<
  FormKind,
  { subject: string; headline: string; intro: string }
> = {
  brand: {
    subject: 'New brand enquiry · Beacon',
    headline: 'A new brand wants to talk.',
    intro: 'Submitted through the brands page intake form.',
  },
  embedded: {
    subject: 'New embedded pathway application · Beacon',
    headline: 'A creative wants to embed.',
    intro: 'Submitted through the embedded creative pathway intake form.',
  },
  projects: {
    subject: 'New project-based roster application · Beacon',
    headline: 'A creative wants to join the roster.',
    intro: 'Submitted through the project-based pathway intake form.',
  },
  creatives: {
    subject: 'New enquiry from the creatives page · Beacon',
    headline: 'A new signal from the creatives page.',
    intro: 'Submitted through the creatives destination contact form.',
  },
};

const FIELD_LABELS: Record<string, string> = {
  name: 'Name',
  email: 'Email',
  organisation: 'Organisation',
  service: 'Service',
  roles: 'Roles needed',
  timeline: 'Timeline',
  portfolio: 'Portfolio / Showreel',
  day_rate: 'Day rate',
  disciplines: 'Disciplines',
  capacity: 'Capacity',
  project_types: 'Project types wanted',
  craft: 'Craft',
  availability: 'Availability',
  about: 'About them',
  message: 'Message',
  i_am_a: 'They are a',
};

// Fields we never want to leak into the email (Formsubmit holdovers, form-kind tag, file).
const OMIT = new Set(['_subject', '_captcha', '_template', '_next', 'form', 'cv']);

// Whitelist of allowed form kinds - anything else falls back to "brand".
function pickForm(raw: FormDataEntryValue | null): FormKind {
  const v = typeof raw === 'string' ? raw : '';
  return v === 'embedded' || v === 'projects' || v === 'creatives' ? v : 'brand';
}

function fieldOrder(form: FormKind): string[] {
  if (form === 'brand') {
    return ['name', 'email', 'organisation', 'service', 'roles', 'timeline', 'message'];
  }
  if (form === 'embedded') {
    return ['name', 'email', 'portfolio', 'craft', 'availability', 'about'];
  }
  if (form === 'projects') {
    return ['name', 'email', 'portfolio', 'day_rate', 'disciplines', 'capacity', 'project_types', 'about'];
  }
  return ['name', 'email', 'i_am_a', 'message'];
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'RESEND_API_KEY is not configured on the server.' },
      { status: 500 },
    );
  }

  const data = await req.formData();
  const form = pickForm(data.get('form'));
  const preset = PRESETS[form];

  // Build the ordered fields list in the canonical order for this form
  // kind, then append anything unexpected at the end so we never silently
  // drop a field a future form adds.
  // The long-form body ("Message" on brand/creatives, "About them" on
  // embedded/projects) gets pulled into its own quoted card so the email
  // reads like a letter, not a table. The remaining fields become rows.
  const MESSAGE_KEYS = new Set(['message', 'about']);

  const order = fieldOrder(form);
  const seen = new Set<string>();
  const fields: Field[] = [];
  let message: { label: string; body: string } | undefined;

  const pickField = (key: string, value: string) => {
    if (MESSAGE_KEYS.has(key) && !message) {
      message = { label: FIELD_LABELS[key] ?? key, body: value };
    } else {
      fields.push({ label: FIELD_LABELS[key] ?? key, value });
    }
  };

  for (const key of order) {
    if (OMIT.has(key)) continue;
    const value = data.get(key);
    if (typeof value !== 'string') continue;
    if (!value.trim()) continue;
    pickField(key, value);
    seen.add(key);
  }
  for (const [key, value] of data.entries()) {
    if (OMIT.has(key) || seen.has(key)) continue;
    if (typeof value !== 'string') continue;
    if (!value.trim()) continue;
    pickField(key, value);
  }

  const replyTo = (data.get('email') as string | null) || undefined;
  const replyToName = (data.get('name') as string | null) || undefined;

  const html = buildEmailHtml({
    subject: preset.subject,
    headline: preset.headline,
    intro: preset.intro,
    fields,
    message,
    replyTo,
    replyToName,
  });
  const text = buildEmailText({
    subject: preset.subject,
    headline: preset.headline,
    intro: preset.intro,
    fields,
    message,
  });

  // CV attachment (only sent on the Embedded form).
  const cv = data.get('cv');
  const attachments: { filename: string; content: Buffer }[] = [];
  if (cv && typeof cv !== 'string' && 'arrayBuffer' in cv) {
    const buf = Buffer.from(await cv.arrayBuffer());
    if (buf.byteLength > 0) {
      attachments.push({
        filename: (cv as File).name || 'cv.pdf',
        content: buf,
      });
    }
  }

  const to = process.env.CONTACT_TO || 'biz.siiyuan@gmail.com';
  const from = process.env.CONTACT_FROM || 'Beacon <onboarding@resend.dev>';

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from,
      to: [to],
      subject: preset.subject,
      html,
      text,
      replyTo,
      attachments: attachments.length ? attachments : undefined,
    });

    if (error) {
      console.error('[contact] resend error', error);
      return NextResponse.json({ error: error.message }, { status: 502 });
    }
  } catch (err) {
    console.error('[contact] send failed', err);
    return NextResponse.json({ error: 'Failed to send.' }, { status: 502 });
  }

  // Forms post via fetch() and show an in-page popup on success - they
  // don't navigate away. So we just return a tiny ok payload.
  return NextResponse.json({ ok: true });
}
