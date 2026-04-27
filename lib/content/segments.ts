export type SegmentPage = {
  slug: string;
  title: string;
  description: string;
  keywords: string[];
};

export const SEGMENT_PAGES: SegmentPage[] = [
  { slug: 'b2b-saas-pm-resume', title: 'B2B SaaS PM Resume Guide', description: 'Optimize your B2B SaaS product manager resume for ATS, enterprise buying cycles, and measurable business outcomes.', keywords: ['B2B SaaS PM resume', 'enterprise product manager resume', 'ATS resume optimization'] },
  { slug: 'fintech-pm-resume', title: 'Fintech Product Manager Resume Guide', description: 'Build a fintech product manager resume with compliance-aware storytelling, payments metrics, and ATS keywords.', keywords: ['fintech product manager resume', 'payments PM resume', 'ATS keywords fintech'] },
  { slug: 'ecommerce-pm-resume', title: 'Ecommerce PM Resume Guide', description: 'Tailor your ecommerce product manager resume around conversion, retention, and funnel optimization outcomes.', keywords: ['ecommerce PM resume', 'conversion optimization resume', 'product manager ATS score'] },
  { slug: 'ai-pm-resume', title: 'AI Product Manager Resume Guide', description: 'Position your AI product manager resume for model-powered features, experimentation, and product impact metrics.', keywords: ['AI product manager resume', 'ML product manager resume', 'ATS resume guide'] },
  { slug: 'growth-pm-resume', title: 'Growth PM Resume Guide', description: 'Create a growth PM resume with activation, retention, and monetization achievements recruiters want to see.', keywords: ['growth PM resume', 'activation retention resume', 'product growth ATS'] },
  { slug: 'platform-pm-resume', title: 'Platform PM Resume Guide', description: 'Show platform product manager impact with reliability, scalability, and developer experience achievements.', keywords: ['platform PM resume', 'developer platform product resume', 'platform ATS keywords'] },
  { slug: 'consumer-pm-resume', title: 'Consumer PM Resume Guide', description: 'Write a consumer product manager resume focused on user behavior insights, engagement, and lifecycle wins.', keywords: ['consumer PM resume', 'engagement product manager resume', 'ATS consumer roles'] },
  { slug: 'enterprise-pm-resume', title: 'Enterprise PM Resume Guide', description: 'Craft an enterprise PM resume with stakeholder alignment, roadmap governance, and measurable adoption results.', keywords: ['enterprise PM resume', 'B2B product resume', 'ATS enterprise product manager'] },
  { slug: 'mobile-pm-resume', title: 'Mobile Product Manager Resume Guide', description: 'Improve your mobile PM resume with app growth metrics, release quality, and funnel optimization examples.', keywords: ['mobile product manager resume', 'app PM resume', 'mobile ATS score'] },
  { slug: 'data-pm-resume', title: 'Data Product Manager Resume Guide', description: 'Highlight data PM strengths with instrumentation, analytics decisions, and outcome-driven product strategy.', keywords: ['data product manager resume', 'analytics PM resume', 'data ATS resume'] },
  { slug: 'healthtech-pm-resume', title: 'Healthtech Product Manager Resume Guide', description: 'Build a healthtech PM resume that balances product impact, compliance awareness, and user-centered execution.', keywords: ['healthtech PM resume', 'digital health product manager', 'ATS healthtech resume'] },
  { slug: 'edtech-pm-resume', title: 'Edtech Product Manager Resume Guide', description: 'Tailor your edtech PM resume for learning outcomes, user adoption, and product-led growth in education.', keywords: ['edtech PM resume', 'education product manager resume', 'ATS edtech'] },
  { slug: 'marketplace-pm-resume', title: 'Marketplace PM Resume Guide', description: 'Show two-sided marketplace PM experience with supply-demand balance, conversion, and retention metrics.', keywords: ['marketplace PM resume', 'two-sided platform resume', 'ATS marketplace PM'] },
  { slug: 'zero-to-one-pm-resume', title: 'Zero-to-One PM Resume Guide', description: 'Present zero-to-one product manager experience with discovery, MVP launch, and early traction outcomes.', keywords: ['zero-to-one PM resume', 'MVP product manager resume', 'ATS startup PM'] },
  { slug: 'senior-pm-resume', title: 'Senior PM Resume Guide', description: 'Strengthen your senior PM resume with strategic ownership, cross-functional leadership, and business impact.', keywords: ['senior PM resume', 'lead product manager resume', 'ATS senior product roles'] },
  { slug: 'associate-pm-resume', title: 'Associate PM Resume Guide', description: 'Build an associate PM resume that proves execution fundamentals, product thinking, and measurable impact.', keywords: ['associate PM resume', 'APM resume guide', 'entry level product manager ATS'] },
  { slug: 'startup-pm-resume', title: 'Startup PM Resume Guide', description: 'Optimize your startup PM resume for ambiguity handling, rapid experimentation, and ownership across functions.', keywords: ['startup PM resume', 'early-stage product manager resume', 'ATS startup hiring'] },
  { slug: 'international-pm-resume', title: 'International PM Resume Guide', description: 'Adapt your PM resume for global roles with localization, cross-market launches, and international growth signals.', keywords: ['international PM resume', 'global product manager resume', 'ATS global roles'] },
];

export const SEGMENT_BY_SLUG = Object.fromEntries(SEGMENT_PAGES.map((segment) => [segment.slug, segment]));
