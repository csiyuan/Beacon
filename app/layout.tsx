import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import './globals.css';

export const metadata: Metadata = {
  title: 'Beacon — Empowering creatives. Elevating brands.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600&family=Inter:wght@300;400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {/* image-slot.js registers the <image-slot> custom element used by
            CreativesApp's destination overlay. Must load on every route —
            /about and /contact render the same overlay, so loading this
            only on /creatives/layout broke their image rendering. */}
        <Script src="/image-slot.js" strategy="beforeInteractive" />
        {children}
      </body>
    </html>
  );
}
