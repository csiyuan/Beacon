import CreativesClient from './CreativesClient';

export const metadata = {
  title: 'For Creatives - Beacon Media Solutions',
  description:
    'Two pathways for Singapore-based creatives: embedded full-time inside a brand that takes its craft seriously, or project-based work briefed clearly and paid on delivery. Beacon places you with the right room and stays in your corner.',
};

export default function CreativesPage({
  searchParams,
}: {
  searchParams?: { from?: string };
}) {
  const fromBeam = searchParams?.from === 'beam';
  return <CreativesClient fromBeam={fromBeam} />;
}
