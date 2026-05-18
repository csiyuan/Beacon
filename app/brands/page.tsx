import BrandsClient from './BrandsClient';

export const metadata = {
  title: 'For Brands - Beacon Media Solutions',
  description:
    'Vetted creative talent embedded inside your team, or end-to-end media production at scale. Without the agency layer, freelancer churn, or in-house overhead.',
  openGraph: {
    title: 'For Brands - Beacon Media Solutions',
    description:
      'Vetted creative talent embedded inside your team, or end-to-end media production at scale. Without the agency layer, freelancer churn, or in-house overhead.',
    siteName: 'Beacon Media Solutions',
    locale: 'en_SG',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'For Brands - Beacon Media Solutions',
    description:
      'Vetted creative talent embedded inside your team, or end-to-end media production at scale.',
  },
};

export default function BrandsPage({
  searchParams,
}: {
  searchParams?: { from?: string };
}) {
  const fromSplash = searchParams?.from === 'splash';
  return <BrandsClient fromSplash={fromSplash} />;
}
