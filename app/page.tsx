import Hero from '@/components/splash/Hero';
import s from './splash.module.css';

export const metadata = {
  title: 'Beacon — Empowering creatives. Elevating brands.',
  description:
    'A guiding light for creatives and the brands they build. Choose your path: embed a creative or partner on production.',
};

export default function Home() {
  // The splash is a single-screen choice point — Hero is the whole page.
  // The Below sections that used to render here have been removed: once
  // the user has the two-path decision and About/Contact in the nav,
  // anything below was redundant chrome.
  return (
    <div className={s.page}>
      <Hero />
    </div>
  );
}
