import JourneyPage from '@/components/journey/JourneyPage';
import EmbeddedIntakeForm from '@/components/journey/EmbeddedIntakeForm';

export const metadata = {
  title: 'Embedded - Beacon for Creatives',
  description:
    'A full-time creative career inside brands that take their craft seriously. Beacon places you on the team, handles the admin, and stays in your corner.',
};

export default function EmbeddedPathwayPage() {
  return (
    <JourneyPage
      pathway="embedded"
      heroTitle={<>Build a creative career inside<br /><em>brands that actually want you</em>.</>}
      heroSub={<>Beacon is for videographers, editors, designers, and content creators who&rsquo;d rather grow inside a brand than rotate through gig work. We place you full-time, support you long-term, and pair you with organisations that take their creative seriously.</>}
      primaryCta={{ label: 'Apply now', href: '/contact?from=creatives&pathway=embedded' }}
      secondaryCta={{ label: 'How it works', href: '#journey' }}
      milestones={[
        {
          eyebrow: 'Apply',
          title: <>Tell us about <em>your craft</em>.</>,
          body: 'Send your portfolio, reel, and a short note about what you want to be making in two years. We read every application personally - no recruiter middleware, no keyword filter.',
          features: [
            'Portfolio + reel review by a creative on the Beacon team',
            'A 30-minute call to understand your goals and constraints',
            'Honest feedback either way - even if there isn’t a fit today',
          ],
          image: {
            src: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1200&q=80&auto=format&fit=crop',
            alt: 'A creative reviewing their portfolio at a desk',
          },
        },
        {
          eyebrow: 'Match',
          title: <>We pair you with a <em>brand that fits</em>.</>,
          body: 'We match on craft AND culture - you won’t end up cranking out content for someone who doesn’t get it. You get the same context we do: team, scope, budget, why. Both sides interview both sides before anyone commits.',
          features: [
            'Matched on craft AND organisational fit, not just availability',
            'Full context on the team and brief before you say yes',
            'Two-way interview - both sides decide before anyone commits',
          ],
          image: {
            src: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=1200&q=80&auto=format&fit=crop',
            alt: 'Two professionals in a planning conversation',
          },
        },
        {
          eyebrow: 'Embed',
          title: <>Embed full-time. <em>We stay your employer.</em></>,
          body: 'Not a temp agency. Not a production house. You slot into the brand’s team - aligned to their workflows, tone, and goals - while Beacon handles payroll, HR, training, and admin. In-house consistency without the cost of building in-house.',
          features: [
            'Stable, full-time work - no chasing invoices, no feast-or-famine',
            'Beacon writes the contract, runs the payroll, handles the statutory side',
            'A 48-hour swap-out if the placement isn’t the right fit',
            'A team that has your back - day-to-day questions, contract issues, career conversations',
          ],
          image: {
            src: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=1200&q=80&auto=format&fit=crop',
            alt: 'A creative working as part of a brand team',
          },
        },
        {
          eyebrow: 'Roles',
          title: <>Disciplines <em>we place</em>.</>,
          body: 'We place senior creatives across the six disciplines most brands struggle to staff in-house. Each role gets matched to a brand whose work and culture genuinely fit.',
          features: [
            'Videographers - DSLR, cinema, studio, run-and-gun',
            'Video editors - long-form, social cuts, motion polish',
            'Content creators - on-camera and behind-the-scenes hybrids',
            'Designers - brand systems, social, motion-adjacent',
            'Photographers - editorial, product, behind-the-scenes',
            'Web developers - frontend, backend, and full-stack builds',
            'AI-content specialists - generative workflows, asset pipelines',
          ],
          image: {
            src: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=1200&q=80&auto=format&fit=crop',
            alt: 'Camera lens and creative production gear',
          },
        },
        {
          eyebrow: 'Grow',
          title: <>Grow your career, <em>not just your invoice book</em>.</>,
          body: 'Training, mentorship, project rotation. Stay long, grow deep with the brand. Or move to a new placement when you’re ready. The body of work you build is only possible when you actually belong somewhere - the best stories aren’t outsourced, they’re lived from within.',
          features: [
            'Training stipend + access to the Beacon mentor network',
            'Quarterly career conversations with the Beacon team',
            'Move to a new placement at any time, no penalty',
          ],
          image: {
            src: 'https://images.unsplash.com/photo-1543269865-cbf427effbad?w=1200&q=80&auto=format&fit=crop',
            alt: 'A mentor and mentee in conversation',
          },
        },
      ]}
      stats={{
        sectionLabel: 'Where the numbers land',
        heading: <>The shape of the <em>embedded network</em>.</>,
        items: [
          { value: '50+', label: 'Creatives engaged', caption: 'Across the roster, from embedded full-time seats to on-call project work.' },
          { value: '6+', label: 'Brand partners', caption: 'Series B to listed - across tech, lifestyle, hospitality, healthcare.' },
          { value: 'SG / SEA', label: 'Singapore + Southeast Asia', caption: 'Beacon places creatives and delivers projects across the region.' },
        ],
      }}
      fit={{
        sectionLabel: 'Honest fit check',
        heading: <>Who the embedded pathway <em>is and isn’t</em> for.</>,
        forItems: [
          'Senior creatives ready to commit to one brand’s story for the long arc',
          'People who want a team behind them - producers, peers, mentors',
          'Anyone tired of feast-or-famine income and chasing invoices',
          'Creatives who care more about the body of work than the variety of logos',
          'Folks who want statutory benefits without giving up creative ownership',
        ],
        notForItems: [
          'Hobbyists or career-changers without a portfolio yet',
          'Creatives who need 3+ projects running in parallel to feel alive',
          'Anyone looking for purely remote, asynchronous-only work',
          'Folks who want to skip the matching process and pick a brand themselves',
          'Agencies looking to subcontract teams - this is for individual creatives only',
        ],
      }}
      guarantees={{
        sectionLabel: 'Our commitments',
        heading: <>What we <em>guarantee</em> in writing.</>,
        items: [
          {
            title: '48-hour swap-out window',
            body: 'If the placement isn’t the right fit in the first 48 hours, both sides walk away clean. We re-match without penalty and without a billable handover.',
          },
          {
            title: 'Full statutory employment',
            body: 'CPF contributions, paid leave, healthcare coverage - every Beacon embed is a real employee with the protections that come with it, not a freelancer in employee clothing.',
          },
          {
            title: 'Comp benchmarked, openly',
            body: 'Your salary is benchmarked against in-house market rates for your craft and seniority, and the number is on the table before you accept the placement. No mystery bands, no "we’ll discuss it later".',
          },
          {
            title: 'Quarterly career check-ins',
            body: 'A scheduled conversation with the Beacon team every quarter. Where the work is taking you, what you want to learn next, when it’s time to move.',
          },
          {
            title: 'No client-side micro-tracking',
            body: 'You answer to the brand for the work; you answer to Beacon for the career. No timesheet surveillance, no productivity-tracker installs.',
          },
          {
            title: 'Walk-away at any time',
            body: 'Two weeks’ notice; no claw-backs, no non-competes, no penalties. We stay invested in your growth even when you’re ready to leave.',
          },
          {
            title: 'Real reference loops',
            body: 'Before any placement, we speak to two past clients on your behalf. You see what they say. So does the receiving brand. No surprises either side.',
          },
        ],
      }}
      sectors={{
        sectionLabel: 'Where you’ll land',
        heading: <>Brands we <em>place into</em>.</>,
        items: ['Tech', 'Finance', 'Lifestyle', 'Healthcare', 'Hospitality', 'Retail', 'Education', 'Public sector'],
      }}
      faqs={{
        sectionLabel: 'Plainly put',
        heading: <>The questions creatives <em>actually ask</em>.</>,
        items: [
          {
            q: 'Am I a Beacon employee or the brand’s employee?',
            a: 'You’re a Beacon employee, embedded inside the brand. Beacon writes the contract, runs payroll, files your CPF, and covers leave + healthcare. The brand directs the day-to-day work; you sit on their team.',
          },
          {
            q: 'What if I don’t click with the brand once I’m in?',
            a: 'You have a 48-hour swap-out window for any reason - no questions asked, no penalty. After that, raise it with your Beacon lead and we’ll either resolve it or find you a different placement.',
          },
          {
            q: 'How long do embedded placements typically last?',
            a: <>Beacon embeds stay an average of 2+ years. Some convert to direct hires on the brand’s payroll (we don’t take a placement fee for that); others rotate to a new brand once they&rsquo;re ready for a different challenge.</>,
          },
          {
            q: 'Do I get equity, bonuses, or perks from the brand?',
            a: 'You get any performance incentives the brand has agreed with Beacon (subject to client approval), but stock options and direct equity sit outside the Beacon model. If a brand wants to grant you equity, we broker a conversion to a direct hire.',
          },
          {
            q: 'Can I take freelance projects on the side?',
            a: 'Within reason - yes. We ask you to flag anything that touches the same client or competing brands so we can avoid conflicts. Otherwise your nights and weekends are your own.',
          },
          {
            q: 'What if the brand wants to hire me direct?',
            a: 'We help broker the move. There’s no placement fee charged to you and no claw-back from us. Our model only works if creatives feel free to take the right next step - including off our books.',
          },
        ],
      }}
      intakeForm={{
        sectionLabel: 'Apply now',
        heading: <>Apply for the <em>embedded pathway</em>.</>,
        form: <EmbeddedIntakeForm />,
      }}
      testimonial={{
        quote: <>Working with Beacon gave me more than just a job - it gave me space to grow. I finally feel like the work I make actually belongs somewhere.</>,
        cite: 'A Beacon creative · placed in 2024',
      }}
      endTitle={<>Creativity that <em>belongs</em>.</>}
      endSub="Bring yours; we'll bring the room it deserves. If embedded life isn't quite the shape you're looking for, the project-based pathway is the other door."
      endActions={[
        { label: 'Try project-based instead', href: '/creatives/projects', ghost: true },
      ]}
    />
  );
}
