import { redirect } from 'next/navigation';

export const metadata = {
  title: 'For Creatives - Beacon Media Solutions',
  description:
    'Two pathways for Singapore-based creatives: embedded full-time inside a brand that takes its craft seriously, or project-based work briefed clearly and paid on delivery.',
};

// The old animated /creatives landing (descent scene + intro video) was
// retired. /creatives now redirects to the Embedded pathway page, which
// carries the pathway switcher so visitors can hop to Project-based
// directly from there. Any inbound link or bookmark to /creatives lands
// cleanly on the embedded journey without a 404.
export default function CreativesPage() {
  redirect('/creatives/embedded');
}
