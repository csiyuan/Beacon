import JourneyPage from '@/components/journey/JourneyPage';
import ProjectsIntakeForm from '@/components/journey/ProjectsIntakeForm';

export const metadata = {
  title: 'Project-based - Beacon for Creatives',
  description:
    'Project-by-project work with vetted brands. Briefed clearly, paid on delivery, no agency middle layer. Beacon brings the work to you.',
};

export default function ProjectsPathwayPage() {
  return (
    <JourneyPage
      pathway="projects"
      heroEyebrow="The project-based pathway"
      heroTitle={<>Project work - <em>without the freelance grind</em>.</>}
      heroSub={<>Briefed clearly. Paid on delivery. No chasing leads, no scoping calls that go nowhere. Beacon brings vetted brand projects to your inbox and handles the rest of the noise.</>}
      primaryCta={{ label: 'Join the roster', href: '/contact?from=creatives&pathway=projects' }}
      secondaryCta={{ label: 'How it works', href: '#journey' }}
      milestones={[
        {
          eyebrow: 'Join',
          title: <>Join the <em>roster</em>.</>,
          body: 'Send us your portfolio, your day rate, and the kind of work you want more of. Vetting takes about a week - portfolio review, two references, a short paid trial brief if it’s a senior role. Once you’re in, you’re in.',
          features: [
            'Portfolio + references review (week 1)',
            'Paid trial brief if it’s a senior placement',
            'Once you’re in, you’re in - no re-vetting per project',
          ],
          image: {
            src: 'https://images.unsplash.com/photo-1483058712412-4245e9b90334?w=1200&q=80&auto=format&fit=crop',
            alt: 'Workspace with portfolio materials and laptop',
          },
        },
        {
          eyebrow: 'Brief',
          title: <>Briefs come <em>to you</em>.</>,
          body: 'When a brand books a project that matches your craft and availability, we send you a fully-scoped brief - deliverables, deadline, budget, and the one named producer running point. Take it or pass; no penalty either way.',
          features: [
            'Fully-scoped briefs - no “quick scoping calls” to nowhere',
            'Match-rate signals so you only see briefs you’d actually want',
            'One named Beacon producer per project - your point of contact',
          ],
          image: {
            src: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=1200&q=80&auto=format&fit=crop',
            alt: 'Laptop on desk with a project brief open',
          },
        },
        {
          eyebrow: 'Deliver',
          title: <>Deliver the work, <em>that’s it</em>.</>,
          body: 'You do the work. The producer handles client comms, revisions framing, and the inevitable scope conversations. Your job is the craft - not managing the relationship.',
          features: [
            'Beacon producer handles client comms and revisions framing',
            'Defined scope, defined revision rounds, defined deadline',
            'Direct creative access - no account-manager game of telephone',
          ],
          image: {
            src: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=1200&q=80&auto=format&fit=crop',
            alt: 'Editor working in a colour-graded edit suite',
          },
        },
        {
          eyebrow: 'Roles',
          title: <>Disciplines <em>we book</em>.</>,
          body: 'The same six disciplines we place into full-time embeds - except you take projects à la carte. Pick the briefs that fit your portfolio direction; skip the rest.',
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
            src: 'https://images.unsplash.com/photo-1505739998589-00fc191ce01d?w=1200&q=80&auto=format&fit=crop',
            alt: 'Production gear flatlay - lens, film, and accessories',
          },
        },
        {
          eyebrow: 'Repeat',
          title: <>Repeat - or <em>switch pathways</em>.</>,
          body: 'Stay on the roster as long as it works for you. If a brand wants to bring you in full-time, we’ll broker the move to the Embedded pathway. Project work and embedded work draw from the same network and the same standard of vetting.',
          features: [
            'Take as much or as little work as you want, month to month',
            'Convert to a full-time Embedded placement if a brand asks',
            'Same vetting, same standard - pathway is just delivery model',
          ],
          image: {
            src: 'https://images.unsplash.com/photo-1551836022-deb4988cc6c0?w=1200&q=80&auto=format&fit=crop',
            alt: 'Open creative workspace with multiple ongoing projects',
          },
        },
      ]}
      stats={{
        sectionLabel: 'Where the numbers land',
        heading: <>The shape of the <em>project roster</em>.</>,
        items: [
          { value: '50+', label: 'Creatives engaged', caption: 'Across the roster, from embedded full-time seats to on-call project work.' },
          { value: '6+', label: 'Brand partners', caption: 'Series B to listed - across tech, lifestyle, hospitality, healthcare.' },
          { value: 'SG / SEA', label: 'Singapore + Southeast Asia', caption: 'Beacon places creatives and delivers projects across the region.' },
        ],
      }}
      fit={{
        sectionLabel: 'Honest fit check',
        heading: <>Who the project-based pathway <em>is and isn’t</em> for.</>,
        forItems: [
          'Established creatives with a portfolio and a stated day rate',
          'Freelancers who want briefs that arrive scoped, not "let’s hop on a call"',
          'Anyone tired of chasing invoices or eating mid-project scope creep',
          'Folks who want to choose what they take, month by month',
          'Creatives who keep their freelance flexibility but want a producer in their corner',
        ],
        notForItems: [
          'New creatives still building their first reel - join when you have one',
          'Anyone who needs full-time work right now - try the Embedded pathway instead',
          'Folks looking to underbid the market on day rates',
          'Creatives who prefer to manage client relationships directly with no middle layer',
          'Agencies looking to subcontract teams - this is for individual creatives only',
        ],
      }}
      guarantees={{
        sectionLabel: 'Our commitments',
        heading: <>What we <em>guarantee</em> in writing.</>,
        items: [
          {
            title: 'NET-15 from final delivery',
            body: 'Payment lands in your account 15 days after final delivery - every project, every time. Beacon pays you direct; we handle collections from the client.',
          },
          {
            title: 'Fully-scoped briefs only',
            body: 'No "quick scoping call" with the brand to figure out what they actually need. Every brief that reaches you has deliverables, deadline, budget, and revision rounds written in.',
          },
          {
            title: 'One named producer per project',
            body: 'A real human Beacon producer owns client comms, scope conversations, and revision framing. You get a single point of contact, not an account-management chain.',
          },
          {
            title: 'Right of refusal, every brief',
            body: 'See a project that doesn’t fit your portfolio direction or your week? Pass without explanation. No quota, no penalty, no signal to the system that you’re "less available".',
          },
          {
            title: 'Transparent rate card',
            body: 'You set your day rate when you join the roster; we honour it project by project. No hidden agency markup, no surprise discounts negotiated behind your back.',
          },
          {
            title: 'Scope guardrails in writing',
            body: 'Every brief includes a defined number of revision rounds and a written change-request policy. Scope creep becomes a paid scope change - not a free extension.',
          },
          {
            title: 'Portfolio rights you keep',
            body: 'You retain the right to show every project in your portfolio and reel after delivery. We handle any embargo or confidentiality terms upfront so there are no surprises at handover.',
          },
          {
            title: 'Kill-fee on every brief',
            body: 'If a brand cancels mid-project, you’re paid a defined kill fee proportional to the work completed - written into the scope agreement before you start, not negotiated after.',
          },
        ],
      }}
      sectors={{
        sectionLabel: 'Who we book for',
        heading: <>Brands we <em>book projects with</em>.</>,
        items: ['Tech', 'Finance', 'Lifestyle', 'Healthcare', 'Hospitality', 'Retail', 'Education', 'Public sector'],
      }}
      faqs={{
        sectionLabel: 'Plainly put',
        heading: <>The questions creatives <em>actually ask</em>.</>,
        items: [
          {
            q: 'How do briefs actually find me?',
            a: 'When a brand books a project that matches your craft and stated availability, our producers send you a fully-scoped brief by email. You have 48 hours to say yes or pass; no penalty for passing.',
          },
          {
            q: 'What if the brand doesn’t pay on time?',
            a: 'That’s our problem, not yours. Beacon pays you direct on NET-15 from delivery regardless of when the brand pays us. Chasing invoices is part of why we exist.',
          },
          {
            q: 'Can I convert to a full-time Embedded placement?',
            a: <>Yes - if a brand wants you on their team full-time, we broker the move to the <a href="/creatives/embedded" style={{ color: 'inherit', textDecoration: 'underline' }}>Embedded pathway</a>. Same vetting, same network, just a different delivery model.</>,
          },
          {
            q: 'Is there a minimum commitment to the roster?',
            a: 'No. Take a project or skip the month entirely. We do ask you to tell us when your monthly capacity shifts so we’re not pitching brands on roster members who can’t actually start.',
          },
          {
            q: 'Does Beacon take a cut of my day rate?',
            a: 'We charge the brand a transparent project fee on top of your rate - they see what you cost and what we cost separately. Your number doesn’t move because Beacon is in the loop.',
          },
          {
            q: 'What happens if a project goes sideways mid-flight?',
            a: 'The Beacon producer handles the client conversation. If scope shifts, it becomes a paid change order - not a free extension of your time. If the brand cancels, you get a kill fee per the scope agreement.',
          },
        ],
      }}
      intakeForm={{
        sectionLabel: 'Join the roster',
        heading: <>Apply for the <em>project-based roster</em>.</>,
        form: <ProjectsIntakeForm />,
      }}
      testimonial={{
        quote: <>The briefs land scoped, the producer holds the line on revisions, and I get paid on time, every time. I stopped chasing work and went back to making it.</>,
        cite: 'A Beacon roster creative · 2024',
      }}
      endTitle={<>Real briefs. Clear scope. <em>On-time payment.</em></>}
      endSub="Take what fits, pass on the rest, build the portfolio you actually want. If full-time inside one brand sounds more like the life you want, the embedded pathway is the other door."
      endActions={[
        { label: 'Try embedded instead', href: '/creatives/embedded', ghost: true },
      ]}
    />
  );
}
