// ─────────────────────────────────────────────────────────────────────────
// Branded HTML email template - sent to hello@beaconmediasolutions.com (and later,
// to the real inbox) whenever someone submits one of the four intake forms.
//
// Why inline styles only:
//   Gmail, Outlook, and most webmail clients strip <style> blocks and
//   external stylesheets. Every visual rule has to live on the element
//   itself. Tables instead of flexbox for the same reason. Gradients are
//   layered behind a solid fallback colour so Outlook desktop still
//   renders a brand-appropriate background.
//
// Visual treatment mirrors the cinematic chapter-mark feel of the site:
//   - Filmstrip dashes flanking a glowing gold dot - used in the hero
//     and footer in place of a logo image
//   - Two-line BEACON / MEDIA SOLUTIONS wordmark in serif caps
//   - Cormorant Garamond italic headline (falls back to Georgia italic in
//     clients that strip web fonts - both are intentionally elegant)
//   - Gold #f0c673 / #ffd98a hairline gradients between sections
//   - Field rows as a definition list with caps gold labels
//   - The submitter's long-form message gets its own bordered "letter"
//     card with a gold opening quotation mark, rendered in italic serif
//   - CTA pill matches .cta from globals.css
// ─────────────────────────────────────────────────────────────────────────

export type Field = { label: string; value: string };

export type EmailPayload = {
  subject: string;
  headline: string;          // big italic serif top line - e.g. "A new brand wants to talk."
  intro?: string;            // short preamble below the headline
  fields: Field[];           // rows of label/value
  message?: {                // optional long-form quote treatment (the actual letter)
    label: string;
    body: string;
  };
  replyTo?: string;          // builds the "Reply to <name>" mailto CTA
  replyToName?: string;
  viewAllUrl?: string;       // deep-link to this form's tab in the master Sheet
};

const GOLD = '#f0c673';
const GOLD_BRIGHT = '#ffd98a';
const GOLD_DEEP = '#c98a3a';
const INK = '#07060a';
const INK_CARD = '#0e0b10';
const INK_QUOTE = '#100c12';
const CREAM = '#f3e7c8';
const CREAM_DIM = 'rgba(243,231,200,0.78)';
const CREAM_FAINT = 'rgba(243,231,200,0.55)';
const HAIRLINE = 'rgba(240,198,115,0.32)';
const HAIRLINE_SOFT = 'rgba(240,198,115,0.18)';

const SERIF = "'Cormorant Garamond', Georgia, 'Iowan Old Style', 'Times New Roman', serif";
const SANS = "'Inter', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif";

const esc = (s: string): string =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

// Email addresses are valid in the mailto: path as-is; percent-encoding the
// `@` to `%40` breaks Gmail's web composer (it opens a blank "To:" instead
// of pre-filling the address). Pass `to` through unescaped and only encode
// the subject, which is a query parameter where encoding is required.
const mailtoHref = (to: string, subject: string): string =>
  `mailto:${to}?subject=${encodeURIComponent('Re: ' + subject)}`;

// Filmstrip "━ ━ ━ ● ━ ━ ━" mark used in the hero and the footer. Built
// from spans (not images) so it stays sharp at any DPI and never breaks
// when a client blocks external images for privacy.
const filmstrip = (size: 'lg' | 'sm' = 'lg'): string => {
  const dashW = size === 'lg' ? 18 : 12;
  const dashH = size === 'lg' ? 2 : 1;
  const dotSize = size === 'lg' ? 9 : 6;
  const dashColor = HAIRLINE;
  const dotShadow =
    size === 'lg'
      ? `0 0 14px ${GOLD}, 0 0 4px ${GOLD_BRIGHT}`
      : `0 0 8px ${GOLD}`;
  const dash = `<span style="display:inline-block;width:${dashW}px;height:${dashH}px;background:${dashColor};vertical-align:middle;margin:0 6px;"></span>`;
  const dot = `<span style="display:inline-block;width:${dotSize}px;height:${dotSize}px;border-radius:99px;background:${GOLD};box-shadow:${dotShadow};vertical-align:middle;margin:0 8px;"></span>`;
  return `<div style="text-align:center;line-height:1;font-size:0;">${dash}${dash}${dash}${dot}${dash}${dash}${dash}</div>`;
};

const hairline = (opts: { soft?: boolean; topMargin?: number; bottomMargin?: number } = {}): string => {
  const colour = opts.soft ? HAIRLINE_SOFT : HAIRLINE;
  const top = opts.topMargin ?? 0;
  const bottom = opts.bottomMargin ?? 0;
  return `<div style="margin:${top}px 0 ${bottom}px 0;height:1px;background:linear-gradient(90deg,rgba(240,198,115,0) 0%,${colour} 50%,rgba(240,198,115,0) 100%);font-size:0;line-height:0;">&nbsp;</div>`;
};

export function buildEmailHtml(p: EmailPayload): string {
  // Field rows - two-column definition list. Generous padding, gold caps
  // labels, cream values.
  const rows = p.fields
    .filter((f) => f.value && f.value.trim().length > 0)
    .map(
      (f, i) => `
        <tr>
          <td style="padding:18px 0;border-top:${i === 0 ? '0' : `1px solid ${HAIRLINE_SOFT}`};vertical-align:top;width:160px;">
            <span style="display:inline-block;font-family:${SANS};font-size:10px;font-weight:600;letter-spacing:0.32em;text-transform:uppercase;color:${GOLD};">
              ${esc(f.label)}
            </span>
          </td>
          <td style="padding:18px 0 18px 18px;border-top:${i === 0 ? '0' : `1px solid ${HAIRLINE_SOFT}`};vertical-align:top;">
            <span style="font-family:${SANS};font-size:15px;line-height:1.55;color:${CREAM};word-break:break-word;">
              ${esc(f.value)}
            </span>
          </td>
        </tr>`,
    )
    .join('');

  // The long-form "message" / "about you" body gets a dedicated card with
  // a giant gold opening quote, rendered in italic serif. Reads like a
  // letter, not a database row.
  const messageBlock = p.message && p.message.body.trim()
    ? `
    <tr>
      <td style="padding:36px 36px 0 36px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
               style="background:${INK_QUOTE};border:1px solid ${HAIRLINE};border-radius:10px;">
          <tr>
            <td style="padding:24px 28px 6px 28px;">
              <span style="display:inline-block;font-family:${SANS};font-size:10px;font-weight:600;letter-spacing:0.36em;text-transform:uppercase;color:${GOLD};">
                ${esc(p.message.label)}
              </span>
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 0 28px;">
              <div style="font-family:${SERIF};font-style:italic;font-weight:400;font-size:54px;line-height:0.5;color:${GOLD_BRIGHT};opacity:0.75;margin:0;">&ldquo;</div>
            </td>
          </tr>
          <tr>
            <td style="padding:6px 28px 26px 28px;">
              <p style="margin:0;font-family:${SERIF};font-style:italic;font-weight:400;font-size:18px;line-height:1.55;color:${CREAM};word-break:break-word;white-space:pre-wrap;">${esc(p.message.body)}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>`
    : '';

  // Reply CTA - solid gold fallback colour first, gradient layered on top
  // for clients that support it.
  const replyButton =
    p.replyTo && /\S+@\S+\.\S+/.test(p.replyTo)
      ? `
    <tr>
      <td style="padding:40px 36px 8px 36px;">
        ${hairline({ soft: true, bottomMargin: 28 })}
        <div style="text-align:center;">
          <p style="margin:0 0 18px 0;font-family:${SANS};font-size:10px;font-weight:600;letter-spacing:0.42em;text-transform:uppercase;color:${GOLD};">
            Respond directly
          </p>
          <!-- mso-friendly outer wrapper for Outlook button rendering -->
          <a href="${mailtoHref(p.replyTo, p.subject)}"
             style="display:inline-block;padding:15px 32px;border-radius:999px;
                    background-color:${GOLD_DEEP};
                    background-image:linear-gradient(180deg,${GOLD_BRIGHT} 0%,${GOLD_DEEP} 100%);
                    color:#1a1207;text-decoration:none;
                    font-family:${SANS};font-size:11px;font-weight:600;
                    letter-spacing:0.32em;text-transform:uppercase;
                    box-shadow:0 12px 30px -10px rgba(255,170,60,0.55);">
            Reply to ${esc(p.replyToName || p.replyTo)} &nbsp;&rarr;
          </a>
          <p style="margin:18px 0 0 0;font-family:${SANS};font-size:12px;line-height:1.6;color:${CREAM_DIM};">
            or write to
            <a href="mailto:${esc(p.replyTo)}" style="color:${GOLD_BRIGHT};text-decoration:none;border-bottom:1px solid ${HAIRLINE};">${esc(p.replyTo)}</a>
          </p>
        </div>
      </td>
    </tr>`
      : '';

  // "View all submissions" - secondary CTA below the reply pill. Opens
  // the Google Sheet at the right tab so the recipient can drop straight
  // into the cumulative log of submissions for this form kind. Skipped
  // entirely if the Sheets lookup didn't return a URL.
  const viewAllBlock = p.viewAllUrl
    ? `
    <tr>
      <td style="padding:18px 36px 0 36px;text-align:center;">
        <a href="${esc(p.viewAllUrl)}"
           style="display:inline-block;font-family:${SANS};font-size:11px;font-weight:600;
                  letter-spacing:0.36em;text-transform:uppercase;color:${GOLD};
                  text-decoration:none;border-bottom:1px solid ${HAIRLINE};padding-bottom:2px;">
          View all submissions &nbsp;&rarr;
        </a>
      </td>
    </tr>`
    : '';

  const dateLine = new Date().toLocaleDateString('en-SG', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <meta name="color-scheme" content="dark only" />
  <meta name="supported-color-schemes" content="dark only" />
  <title>${esc(p.subject)}</title>
  <!-- Progressive enhancement: clients that respect <link> in the head
       (Apple Mail, iOS Mail) get the real Cormorant Garamond. Everyone
       else falls back gracefully to Georgia via the inline font-family. -->
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400;1,500&family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
</head>
<body style="margin:0;padding:0;background:${INK};color:${CREAM};font-family:${SANS};">
  <!-- Preheader: hidden inbox preview text -->
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:${INK};opacity:0;">
    ${esc(p.intro || p.headline)} &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;
  </div>

  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${INK};">
    <tr>
      <td align="center" style="padding:48px 16px 56px 16px;">

        <!-- ─── Card ─────────────────────────────────────────────── -->
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="620"
               style="max-width:620px;width:100%;background:${INK_CARD};border:1px solid ${HAIRLINE};border-radius:16px;overflow:hidden;">

          <!-- Gold hairline (top edge) -->
          <tr>
            <td style="height:2px;line-height:2px;font-size:0;background:linear-gradient(90deg,rgba(240,198,115,0) 0%,${GOLD_BRIGHT} 50%,rgba(240,198,115,0) 100%);">&nbsp;</td>
          </tr>

          <!-- ─── Hero: filmstrip + wordmark ────────────────────── -->
          <tr>
            <td style="padding:44px 36px 0 36px;">
              ${filmstrip('lg')}
            </td>
          </tr>
          <tr>
            <td style="padding:22px 36px 0 36px;text-align:center;">
              <div style="font-family:${SERIF};font-weight:400;font-size:30px;letter-spacing:0.46em;text-transform:uppercase;color:${GOLD_BRIGHT};line-height:1;">
                Beacon
              </div>
              <div style="margin-top:10px;font-family:${SANS};font-size:9.5px;font-weight:500;letter-spacing:0.52em;text-transform:uppercase;color:${CREAM_FAINT};">
                Media &middot; Solutions
              </div>
            </td>
          </tr>

          <tr>
            <td style="padding:32px 36px 0 36px;">
              ${hairline()}
            </td>
          </tr>

          <!-- ─── Eyebrow + headline + intro ────────────────────── -->
          <tr>
            <td style="padding:28px 36px 0 36px;text-align:center;">
              <span style="font-family:${SANS};font-size:10px;font-weight:600;letter-spacing:0.5em;text-transform:uppercase;color:${GOLD};">
                New submission &nbsp;&middot;&nbsp; ${dateLine}
              </span>
            </td>
          </tr>
          <tr>
            <td style="padding:18px 36px 0 36px;text-align:center;">
              <h1 style="margin:0;padding:0;font-family:${SERIF};font-weight:400;font-style:italic;font-size:40px;line-height:1.12;color:${GOLD_BRIGHT};letter-spacing:-0.005em;">
                ${esc(p.headline)}
              </h1>
            </td>
          </tr>
          ${
            p.intro
              ? `
          <tr>
            <td style="padding:18px 48px 0 48px;text-align:center;">
              <p style="margin:0;font-family:${SANS};font-size:14px;line-height:1.65;color:${CREAM_DIM};">
                ${esc(p.intro)}
              </p>
            </td>
          </tr>`
              : ''
          }

          <!-- ─── Filmstrip divider before the fields ───────────── -->
          <tr>
            <td style="padding:36px 36px 0 36px;">
              ${filmstrip('sm')}
            </td>
          </tr>

          <!-- ─── Fields ────────────────────────────────────────── -->
          <tr>
            <td style="padding:22px 36px 0 36px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                ${rows}
              </table>
            </td>
          </tr>

          <!-- ─── Optional long-form message card ───────────────── -->
          ${messageBlock}

          <!-- ─── Reply CTA section ─────────────────────────────── -->
          ${replyButton}

          <!-- ─── View-all-submissions deep link to Google Sheet ── -->
          ${viewAllBlock}

          <!-- ─── Footer ────────────────────────────────────────── -->
          <tr>
            <td style="padding:42px 36px 14px 36px;">
              ${hairline()}
            </td>
          </tr>
          <tr>
            <td style="padding:18px 36px 0 36px;">
              ${filmstrip('sm')}
            </td>
          </tr>
          <tr>
            <td style="padding:18px 36px 8px 36px;text-align:center;">
              <p style="margin:0;font-family:${SANS};font-size:10px;font-weight:600;letter-spacing:0.46em;text-transform:uppercase;color:${GOLD};">
                Beacon Media Solutions
              </p>
              <p style="margin:8px 0 0 0;font-family:${SANS};font-size:11px;line-height:1.7;color:${CREAM_FAINT};">
                141 Cecil Street &middot; #08-07 &middot; Singapore 069541<br />
                <a href="mailto:hello@beaconmediasolutions.com" style="color:${GOLD_BRIGHT};text-decoration:none;border-bottom:1px solid ${HAIRLINE_SOFT};">hello@beaconmediasolutions.com</a>
              </p>
              <p style="margin:18px 0 0 0;font-family:${SERIF};font-style:italic;font-size:12px;color:${CREAM_FAINT};">
                Sent automatically when a form was submitted on
                <a href="https://www.beaconmediasolutions.com" style="color:${GOLD_BRIGHT};text-decoration:none;">beaconmediasolutions.com</a>.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 36px 0 36px;">&nbsp;</td>
          </tr>

          <!-- Gold hairline (bottom edge) -->
          <tr>
            <td style="height:2px;line-height:2px;font-size:0;background:linear-gradient(90deg,rgba(240,198,115,0) 0%,${GOLD_BRIGHT} 50%,rgba(240,198,115,0) 100%);">&nbsp;</td>
          </tr>

        </table>
        <!-- /Card -->

      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function buildEmailText(p: EmailPayload): string {
  const fields = p.fields
    .filter((f) => f.value && f.value.trim().length > 0)
    .map((f) => `${f.label.toUpperCase()}\n${f.value}\n`)
    .join('\n');
  const msg = p.message && p.message.body.trim()
    ? `\n${p.message.label.toUpperCase()}\n"${p.message.body}"\n`
    : '';
  return [
    'BEACON MEDIA SOLUTIONS',
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    '',
    p.headline,
    p.intro ? `\n${p.intro}` : '',
    '',
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    '',
    fields,
    msg,
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    '141 Cecil Street · #08-07 · Singapore 069541',
    'hello@beaconmediasolutions.com',
    '',
    'Sent automatically from beaconmediasolutions.com',
  ]
    .filter(Boolean)
    .join('\n');
}
