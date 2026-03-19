/**
 * defaultJDs.ts
 * Pre-built PM job descriptions for the score checker.
 * Users can paste their own JD or pick one of these.
 */

export interface DefaultJD {
  id: string;
  label: string;
  company_type: string;
  text: string;
}

export const DEFAULT_JDS: DefaultJD[] = [
  {
    id: 'growth_pm',
    label: 'Growth PM — Consumer App',
    company_type: 'B2C / Consumer',
    text: `We are looking for a Growth Product Manager to drive user acquisition, activation, retention, and monetization for our consumer app.

Responsibilities:
- Own the growth roadmap end-to-end, from ideation to launch and iteration
- Define, track, and improve key growth metrics: DAU, MAU, retention D1/D7/D30, conversion rates, and LTV
- Design and run A/B experiments across onboarding, activation, and re-engagement flows
- Partner with data science, engineering, design, and marketing to ship high-impact growth features
- Conduct user research and analyze behavioral data (Mixpanel, Amplitude, SQL) to identify friction and opportunity
- Own the north star metric and build team alignment around growth goals
- Drive go-to-market strategy for new feature launches

Requirements:
- 2+ years of product management experience with a focus on growth or experimentation
- Strong data fluency — comfortable with SQL, A/B testing frameworks, funnel analysis
- Experience with product analytics tools (Amplitude, Mixpanel, Looker)
- Track record of improving user retention and activation metrics
- Strong stakeholder management and cross-functional collaboration skills
- Understanding of growth loops, viral coefficients, referral mechanics
- Experience with mobile-first products preferred
- OKR setting and roadmap prioritization experience`,
  },
  {
    id: 'b2b_saas_pm',
    label: 'Product Manager — B2B SaaS',
    company_type: 'B2B / Enterprise SaaS',
    text: `We are hiring a Product Manager to own our core B2B SaaS product used by enterprise customers across multiple industries.

Responsibilities:
- Define and execute the product roadmap aligned with company OKRs and enterprise customer needs
- Work closely with sales, customer success, and engineering to identify and prioritize product gaps
- Write detailed product requirements documents (PRDs) and user stories with clear acceptance criteria
- Conduct customer discovery calls and synthesize insights into actionable product decisions
- Own end-to-end product launches: internal enablement, documentation, customer communication
- Define success metrics and track product performance post-launch
- Partner with UX to design intuitive workflows for enterprise users
- Manage stakeholder expectations across engineering, sales, and leadership

Requirements:
- 3+ years of B2B SaaS product management experience
- Strong experience writing PRDs, user stories, and product specifications
- Excellent stakeholder management — ability to work with enterprise customers and internal teams
- Data-driven mindset with experience defining and tracking KPIs
- Familiarity with agile methodologies, sprint planning, and backlog grooming
- Experience with tools: JIRA, Confluence, Figma, Mixpanel or similar
- Strong analytical skills — SQL experience a plus
- Demonstrated ability to drive product from discovery through delivery`,
  },
  {
    id: 'fintech_pm',
    label: 'Product Manager — Fintech',
    company_type: 'Fintech / Payments',
    text: `We are seeking a Product Manager to build and scale financial products — including payments, lending, investment, or insurance features — for millions of users.

Responsibilities:
- Own the product roadmap for one or more fintech product verticals
- Deeply understand regulatory and compliance requirements (RBI, SEBI, PCI-DSS) and build compliant products
- Partner with risk, compliance, legal, and engineering to ship features responsibly
- Drive KYC, onboarding, and activation improvements to reduce user drop-off
- Design fraud prevention features in collaboration with the data science team
- Track financial metrics: transaction volume, loan disbursals, default rates, NPS, activation rates
- Conduct user research to understand financial behavior, trust barriers, and adoption friction
- Define go-to-market strategy for new financial products

Requirements:
- 2+ years of product management experience, preferably in fintech, payments, or lending
- Understanding of financial regulations, KYC/AML processes, and compliance workflows
- Strong analytical skills — experience with cohort analysis, funnel metrics, and financial KPIs
- Experience with API-first product development and third-party integrations
- Ability to work cross-functionally with risk, compliance, legal, engineering, and design
- Strong problem-solving and structured thinking skills
- SQL proficiency preferred
- Customer empathy and ability to simplify complex financial products for mass market users`,
  },
  {
    id: 'b2c_consumer',
    label: 'Product Manager — B2C / E-Commerce',
    company_type: 'E-Commerce / Marketplace',
    text: `We are looking for a Product Manager to drive consumer product experiences on our e-commerce or marketplace platform — from discovery and search to checkout and post-purchase.

Responsibilities:
- Own the product roadmap for consumer-facing features: search, discovery, recommendations, cart, checkout, or reviews
- Improve key e-commerce metrics: conversion rate, cart abandonment, AOV, repeat purchase rate, and NPS
- Run continuous A/B experiments to optimize user flows and increase revenue
- Analyze user behavior using tools like Amplitude, Clevertap, or Hotjar
- Partner with category teams, marketing, logistics, and engineering to ship cohesive experiences
- Conduct user research and usability studies to identify drop-off points
- Build and maintain a prioritized product backlog in collaboration with engineering and design
- Drive feature adoption through internal communication and go-to-market execution

Requirements:
- 2+ years of consumer product management experience
- Strong understanding of e-commerce funnels, conversion optimization, and UX best practices
- Hands-on experience with A/B testing and experimentation frameworks
- Data proficiency — comfortable with SQL, funnel analysis, and behavioral analytics tools
- Strong cross-functional collaboration and stakeholder alignment skills
- Ability to balance short-term business impact with long-term product quality
- Experience working in agile teams with 2-week sprint cycles
- Mobile product experience (Android/iOS) preferred`,
  },
  {
    id: 'faang_apm',
    label: 'APM / PM — Big Tech (FAANG-style)',
    company_type: 'Big Tech / FAANG',
    text: `We are hiring an Associate Product Manager or Product Manager to join one of our core product teams working on products used by hundreds of millions of users globally.

Responsibilities:
- Define the product vision, strategy, and roadmap for your product area in collaboration with senior leadership
- Work with engineering, design, data science, and research to build and ship high-quality products at scale
- Use data to inform decisions — define metrics, run experiments, analyze outcomes, and iterate
- Write clear product specifications and lead cross-functional teams through the product development lifecycle
- Conduct customer research, synthesize insights, and translate them into prioritized product requirements
- Identify and resolve ambiguity in requirements — make data-backed trade-off decisions
- Present product strategy and results to senior leadership and executive stakeholders
- Drive alignment across multiple teams and business units

Requirements:
- Strong first-principles thinking and structured problem-solving ability
- Experience defining and tracking success metrics for product features at scale
- Excellent written and verbal communication — can influence without authority
- Proficiency in data analysis — SQL, experimentation, funnel analysis
- Demonstrated track record of shipping user-facing features with measurable impact
- Ability to work in a fast-paced, ambiguous environment with competing priorities
- Deep user empathy and obsession with product quality
- MBA or technical background (CS/Engineering) preferred but not required`,
  },
  {
    id: 'startup_pm',
    label: 'Product Manager — Early-Stage Startup',
    company_type: 'Startup / 0-to-1',
    text: `We are a fast-growing startup looking for a scrappy, full-stack Product Manager to help us build 0-to-1 and iterate quickly based on customer feedback.

Responsibilities:
- Own product strategy and roadmap from day one — work directly with the founders
- Run rapid discovery: user interviews, competitor analysis, market research
- Prioritize ruthlessly with limited engineering bandwidth — define MVPs and ship fast
- Define success metrics and build a data-driven culture from scratch
- Write product specs, manage the backlog, and run sprints with the engineering team
- Work closely with sales and customer success to understand enterprise and SMB pain points
- Drive early customer adoption and feedback loops
- Shape the product narrative for fundraising, sales decks, and investor updates

Requirements:
- 1-3 years of product management experience, ideally at a startup or in a high-growth environment
- Comfortable with ambiguity — can set direction without extensive guidance
- Strong customer empathy and ability to translate feedback into product decisions
- Hands-on and execution-focused — willing to do things that don't scale initially
- Familiarity with lean startup methodology, jobs-to-be-done framework, and rapid prototyping
- Basic technical understanding — can read API docs, understand system architecture
- Strong written communication for async collaboration
- Bonus: experience with product analytics setup (Mixpanel, Segment, Amplitude from scratch)`,
  },
];

export function getDefaultJDById(id: string): DefaultJD | undefined {
  return DEFAULT_JDS.find(jd => jd.id === id);
}
