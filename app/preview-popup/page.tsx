'use client';

import { useState } from 'react';
import ThanksPopup from '@/components/ThanksPopup';

/* Dev-only preview page for the ThanksPopup component. Visit /preview-popup
   to see it in isolation against the dark site background. Delete this
   route before shipping if you don't want it accessible. */
export default function PreviewPopupPage() {
  const [open, setOpen] = useState(true);

  return (
    <main
      style={{
        minHeight: '100dvh',
        background: '#07060a',
        color: '#f3e7c8',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 18,
        padding: 32,
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      <span
        style={{
          fontSize: 10.5,
          letterSpacing: '0.42em',
          textTransform: 'uppercase',
          color: '#f0c673',
          fontWeight: 600,
        }}
      >
        Popup preview
      </span>
      <p style={{ maxWidth: 420, textAlign: 'center', color: 'rgba(243,231,200,0.7)', margin: 0 }}>
        The popup opens automatically. Dismiss it with the &times;, the
        backdrop, the Escape key, or wait 5 seconds for the auto-dismiss.
      </p>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="cta"
        style={{ marginTop: 8 }}
      >
        Reopen popup
      </button>

      <ThanksPopup open={open} onClose={() => setOpen(false)} />
    </main>
  );
}
