// ─────────────────────────────────────────────────────────────────────────
// Form submission destination.
//
// All four intake forms on the site POST to our own /api/contact route,
// which sends a branded HTML email via Resend and then 303-redirects to
// /thanks.
//
// To change the recipient: set CONTACT_TO in your environment (.env.local
// for dev, Vercel Project Settings → Environment Variables for prod).
// Default falls back to biz.siiyuan@gmail.com - see app/api/contact/route.ts.
//
// Getting set up:
//   1. Sign up at resend.com (free, no card required)
//   2. Create an API key at resend.com/api-keys
//   3. Add RESEND_API_KEY=re_... to .env.local locally, and to Vercel's
//      Environment Variables in production
//   4. (Later, optional) verify a domain in Resend and set CONTACT_FROM
//      to something like "Beacon <hello@beaconmediasolutions.com>" so the
//      email isn't sent from Resend's onboarding sender
// ─────────────────────────────────────────────────────────────────────────

export const FORM_ENDPOINT = '/api/contact';

// Inbox the mailto: fallback targets when the API is not configured (or
// fails for any reason). Same default as the API's `to` field.
export const CONTACT_INBOX = 'info@beaconmediasolutions.com';

/* ─────────────────────────────────────────────────────────────────────────
   submitForm(form, kind)

   Single submit pipeline shared by all four intake forms. Tries the API
   first - which, when RESEND_API_KEY is configured, ships a branded HTML
   email to the inbox. If the API is missing/misconfigured (e.g. local dev
   without Resend), we fall back to opening the user's mail client with a
   pre-filled message so the enquiry still gets through.

   Returns `true` on success (either path), `false` only if the user has
   no mail client and the API is unreachable - the caller can then decide
   whether to show a hard error.
   ───────────────────────────────────────────────────────────────────────── */
export async function submitForm(
  formEl: HTMLFormElement,
  kind: 'brand' | 'embedded' | 'projects' | 'creatives',
): Promise<boolean> {
  const fd = new FormData(formEl);
  try {
    const res = await fetch(FORM_ENDPOINT, { method: 'POST', body: fd });
    if (res.ok) return true;
  } catch {
    /* network failure - falls through to mailto */
  }
  // Mailto fallback - assemble a readable plain-text body from the form
  // data and hand the user off to their mail client.
  const lines: string[] = [];
  for (const [key, value] of fd.entries()) {
    if (key === 'form' || key === 'cv' || typeof value !== 'string') continue;
    const trimmed = value.trim();
    if (!trimmed) continue;
    lines.push(`${humanize(key)}: ${trimmed}`);
  }
  const subjects: Record<typeof kind, string> = {
    brand: 'New brand enquiry · Beacon',
    embedded: 'New embedded pathway application · Beacon',
    projects: 'New project-based roster application · Beacon',
    creatives: 'New enquiry · Beacon',
  };
  const url =
    `mailto:${CONTACT_INBOX}` +
    `?subject=${encodeURIComponent(subjects[kind])}` +
    `&body=${encodeURIComponent(lines.join('\n'))}`;
  try {
    window.location.href = url;
    return true;
  } catch {
    return false;
  }
}

function humanize(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
