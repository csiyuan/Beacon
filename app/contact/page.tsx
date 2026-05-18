import CreativesClient from '../creatives/CreativesClient';

export const metadata = {
  title: 'Contact — Beacon',
  description:
    'Reach Beacon Media Solutions — for embedded creative placements, end-to-end production, or to say hello.',
};

const FROM_TO_ROUTE: Record<string, string> = {
  creatives: '/creatives',
  brands: '/brands',
  splash: '/',
};

const FROM_TO_BG: Record<string, 'splash' | 'brands' | 'creatives'> = {
  splash: 'splash',
  brands: 'brands',
  creatives: 'creatives',
};

export default function ContactPage({
  searchParams,
}: {
  searchParams?: { from?: string };
}) {
  const from = searchParams?.from ?? '';
  const homeRoute = FROM_TO_ROUTE[from] ?? '/';
  // Source-aware backdrop — see about/page.tsx for rationale.
  const bgFrom = FROM_TO_BG[from] ?? 'creatives';
  return <CreativesClient initialScene="contact" homeRoute={homeRoute} bgFrom={bgFrom} />;
}
