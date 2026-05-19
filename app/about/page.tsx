import CreativesClient from '../creatives/CreativesClient';

export const metadata = {
  title: 'About - Beacon',
  description:
    'The bridge between great creatives and the brands that need them. Built in Singapore, scaling across the region.',
};

// Restricts ?from values to known routes so a malformed param can't be
// used as an open redirect via the back-arrow nav.
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

export default function AboutPage({
  searchParams,
}: {
  searchParams?: { from?: string };
}) {
  const from = searchParams?.from ?? '';
  // Back-arrow routes to wherever the user came from. Default "/" covers
  // direct navigation (typed URL, bookmark).
  const homeRoute = FROM_TO_ROUTE[from] ?? '/';
  // Backdrop matches the originating page so /about feels like an overlay
  // on the context the user was already in (splash hero, brand corporate,
  // or the creatives descent scene).
  const bgFrom = FROM_TO_BG[from] ?? 'creatives';
  return <CreativesClient initialScene="about" homeRoute={homeRoute} bgFrom={bgFrom} />;
}
