import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { buildEmailHtml, buildEmailText, type Field } from '@/lib/email-template';
import { appendSubmissionToSheet, getTabUrl } from '@/lib/sheets';

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
//   CONTACT_TO      - inbox to forward to (defaults to hello@beaconmediasolutions.com)
//   CONTACT_FROM    - sender ("Beacon <hello@yourdomain.com>" once you
//                     verify a domain in Resend; until then leave unset to
//                     fall back to Resend's onboarding sender)
// ─────────────────────────────────────────────────────────────────────────

export const runtime = 'nodejs';

type FormKind = 'brand' | 'embedded' | 'projects' | 'creatives' | 'general';

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
  general: {
    subject: 'New contact form message · Beacon',
    headline: 'A new message from the contact page.',
    intro: 'Submitted through the general contact form.',
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

/* Subject threading suffix - appended to each preset's base subject so
   Gmail's conversation view groups submissions on a sensible cadence:
   - brand / embedded / projects / creatives → per-day (today's submissions
     of the same form thread together; tomorrow's start a new thread)
   - general → per-week (the lower-volume general contact form is calmer
     if a whole week of messages threads into one conversation)
   All dates are formatted in Singapore time since that's where Beacon is
   based - submitting at 1 AM SGT shouldn't roll into "yesterday". */
const SG_TZ = 'Asia/Singapore';

function formatSGDate(d: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: SG_TZ,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(d);
}

function startOfWeekSG(now: Date): Date {
  // Pull Singapore-local Y/M/D + weekday so DST / offsets don't drift.
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: SG_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
  }).formatToParts(now);
  const year = parts.find((p) => p.type === 'year')!.value;
  const month = parts.find((p) => p.type === 'month')!.value;
  const day = parts.find((p) => p.type === 'day')!.value;
  const weekday = parts.find((p) => p.type === 'weekday')!.value;
  // ISO week starts Monday. Map weekday short name → offset from Monday.
  const offset: Record<string, number> = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 };
  const monday = new Date(`${year}-${month}-${day}T00:00:00+08:00`);
  monday.setUTCDate(monday.getUTCDate() - (offset[weekday] ?? 0));
  return monday;
}

function threadSuffix(form: FormKind): string {
  const now = new Date();
  if (form === 'general') {
    return ` · Week of ${formatSGDate(startOfWeekSG(now))}`;
  }
  return ` · ${formatSGDate(now)}`;
}

// Whitelist of allowed form kinds - anything else falls back to "brand".
function pickForm(raw: FormDataEntryValue | null): FormKind {
  const v = typeof raw === 'string' ? raw : '';
  if (v === 'embedded' || v === 'projects' || v === 'creatives' || v === 'general') return v;
  return 'brand';
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
  // creatives + general both surface the same shape (name, email, "I am a",
  // message), so they share a field order. Their distinct subjects keep
  // them in separate Gmail threads.
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

  // Subject = preset + threading suffix (per-day for most, per-week for
  // the general contact form). See threadSuffix() above for rationale.
  const subject = preset.subject + threadSuffix(form);

  // "View all submissions" CTA URL - deep-links to the right tab of the
  // Google Sheet so a single click jumps from the email to the live log.
  // Resolved best-effort; if the Sheets API is unreachable we just omit
  // the button and the email still ships.
  let viewAllUrl: string | null = null;
  try {
    viewAllUrl = await getTabUrl(form);
  } catch (err) {
    console.error('[contact] tab url lookup failed', err);
  }

  const html = buildEmailHtml({
    subject,
    headline: preset.headline,
    intro: preset.intro,
    fields,
    message,
    replyTo,
    replyToName,
    viewAllUrl: viewAllUrl ?? undefined,
  });
  const text = buildEmailText({
    subject,
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

  const to = process.env.CONTACT_TO || 'hello@beaconmediasolutions.com';
  const from = process.env.CONTACT_FROM || 'Beacon <onboarding@resend.dev>';

  // Flatten the FormData into a plain string map for the sheets helper -
  // computed up front so we can kick off the Sheets append in parallel
  // with the email send below.
  const fieldData: Record<string, string> = {};
  for (const [key, value] of data.entries()) {
    if (typeof value === 'string') fieldData[key] = value;
  }

  // Run the two slow operations concurrently. The email is the critical
  // path (we surface its result to the caller); the Sheets append is
  // best-effort logging. Total wall time = max(email, sheets) instead
  // of sum, which cuts ~half the perceived latency on every submission.
  const resend = new Resend(apiKey);
  const emailTask = resend.emails.send({
    from,
    to: [to],
    subject,
    html,
    text,
    replyTo,
    attachments: attachments.length ? attachments : undefined,
  });
  const sheetsTask = appendSubmissionToSheet(form, fieldData, message?.body);

  const [emailResult, sheetsResult] = await Promise.allSettled([emailTask, sheetsTask]);

  if (emailResult.status === 'rejected') {
    console.error('[contact] send failed', emailResult.reason);
    return NextResponse.json({ error: 'Failed to send.' }, { status: 502 });
  }
  if (emailResult.value.error) {
    console.error('[contact] resend error', emailResult.value.error);
    return NextResponse.json({ error: emailResult.value.error.message }, { status: 502 });
  }
  if (sheetsResult.status === 'rejected') {
    // Sheets is best-effort - the email already shipped, so we still
    // return success to the caller. The error surfaces in the server log.
    console.error('[contact] sheets append failed', sheetsResult.reason);
  }

  // Forms post via fetch() and show an in-page popup on success - they
  // don't navigate away. So we just return a tiny ok payload.
  return NextResponse.json({ ok: true });
}
