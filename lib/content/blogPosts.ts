export type BlogSection = {
  heading: string;
  paragraphs: string[];
};

export type BlogPost = {
  slug: string;
  title: string;
  description: string;
  keywords: string[];
  publishedAt: string;
  readTime: string;
  sections: BlogSection[];
};

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: 'product-manager-resume-guide',
    title: 'Product Manager Resume Guide: How to Build a PM Resume That Gets Interviews',
    description:
      'A practical product manager resume guide with ATS-friendly formatting, impact-focused bullet writing, and role-specific positioning tips to help you get shortlisted faster.',
    keywords: [
      'product manager resume guide',
      'product manager resume',
      'PM resume tips',
      'ATS resume optimization',
    ],
    publishedAt: '2026-04-25',
    readTime: '9 min read',
    sections: [
      {
        heading: 'Why PM resumes get rejected before a recruiter interview',
        paragraphs: [
          'Most product manager resumes fail because they are written as responsibility logs instead of decision-impact stories. Hiring teams do not just want to know that you attended standups, wrote PRDs, or managed sprint planning. They want evidence that your product thinking changed a business outcome. If your bullet points read like generic job descriptions, recruiters cannot quickly map you to the role, and your resume gets filtered out early.',
          'A second reason is that many PM candidates submit one resume to every application. A growth PM role, a platform PM role, and a fintech PM role are evaluated differently. Recruiters look for domain relevance, specific product metrics, and the language used in the job description. Without this alignment, your resume may be technically strong but still appear mismatched. Customization is no longer optional in a competitive market.',
          'Finally, readability matters more than candidates expect. Hiring managers often spend less than a minute on first pass. Dense text, long paragraphs, and unclear section hierarchy reduce comprehension. The strongest product manager resume is one that can be skimmed quickly while still proving strategy, execution, cross-functional influence, and measurable impact.',
        ],
      },
      {
        heading: 'Use a PM-friendly structure that works for ATS and humans',
        paragraphs: [
          'Start with a concise professional summary tailored to the role. In three to four lines, explain the type of products you have built, your years of experience, and the outcomes you repeatedly drive. A good summary includes one domain anchor like SaaS, fintech, ecommerce, or AI and one metrics anchor such as retention growth, conversion improvement, or revenue impact. This helps both ATS systems and recruiters understand your fit immediately.',
          'For the experience section, use reverse chronological order and keep each role focused on outcomes. Include company, title, dates, and then three to five bullets that follow action + context + measurable result. Example: Launched onboarding experiments for first-time users, improving activation from 34 percent to 47 percent in two quarters. This format demonstrates ownership and business value in one line and keeps your product manager resume easy to evaluate.',
          'Use a dedicated skills section, but treat it as support evidence, not your main story. Group skills by category: product execution, analytics, research, and collaboration tools. Include only skills you can defend in interviews. ATS optimization works best when keywords appear naturally in both your skills section and your experience bullets, because context signals credibility and prevents keyword stuffing.',
        ],
      },
      {
        heading: 'How to write PM bullet points that show real ownership',
        paragraphs: [
          'Weak PM bullets describe activity, while strong bullets describe decisions and consequences. Compare these two lines: Managed roadmap for mobile app versus Prioritized mobile checkout roadmap based on funnel drop-offs, reducing checkout abandonment by 12 percent. The second version shows the problem, your decision, and a business result. Recruiters trust this style because it reflects real product ownership.',
          'Each bullet should answer one of three questions: What problem did you solve, how did you solve it, and what changed after launch? Mention collaboration when relevant, but keep the focus on your contribution. Instead of saying worked with design and engineering, say aligned design and engineering on scoped MVP that shipped in six weeks and lifted trial-to-paid conversion by 9 percent. Clear contribution language makes your profile more interview ready.',
          'Use numbers carefully and honestly. You do not need massive percentages for every bullet. Credible metrics include baseline-to-final improvements, time reduction, quality improvements, NPS movement, adoption rates, churn reduction, and cost savings. Even directional outcomes are useful when exact values are confidential, as long as you remain specific. The goal is to show that your product decisions produced measurable movement.',
        ],
      },
      {
        heading: 'ATS resume optimization without sounding robotic',
        paragraphs: [
          'ATS systems scan for role relevance, not just raw keyword count. Start by extracting repeated terms from the job description: discovery, roadmap prioritization, experimentation, SQL, stakeholder management, monetization, and go-to-market collaboration. Then match those terms to projects where you actually used them. When keywords are tied to achievements, your resume remains natural while still passing automated screening thresholds.',
          'Formatting choices also affect ATS parsing. Use standard headings like Summary, Experience, Skills, and Education. Avoid tables, graphics, and unusual layouts that can break text extraction. A clean single-column format is usually safest. Keep dates and role titles consistent, and avoid abbreviations unless you also include the expanded term. Good formatting improves both parser accuracy and recruiter readability.',
          'Tailoring should happen at the story level, not only at the keyword level. If the role emphasizes experimentation and growth loops, prioritize bullets that show hypothesis-driven iteration. If the role emphasizes platform reliability or internal tools, highlight technical collaboration, systems thinking, and release quality. This strategic tailoring improves interview conversion more than keyword insertion alone.',
        ],
      },
      {
        heading: 'Keywords that matter for modern product manager roles',
        paragraphs: [
          'High-performing PM resumes include a mix of strategic and execution keywords. Strategic terms include product strategy, market research, user segmentation, and prioritization frameworks. Execution terms include A/B testing, PRD writing, sprint planning, analytics instrumentation, and release management. Together they signal that you can think long-term and deliver short-term outcomes.',
          'Domain keywords are equally important when a role is specialized. Fintech jobs may look for payments, compliance, risk workflows, and fraud prevention. SaaS roles may prioritize activation, expansion revenue, and self-serve onboarding. Ecommerce teams often emphasize catalog quality, checkout conversion, and repeat purchase behavior. Add domain terms only when your experience supports them; authenticity always beats broad but shallow coverage.',
          'Tool keywords should be treated as secondary proof. Mention tools such as Amplitude, Mixpanel, SQL, Looker, Jira, Figma, or Tableau when they are part of your real workflow. Recruiters care less about tool lists in isolation and more about how you used them to make decisions. Pair tools with outcomes to keep your resume persuasive and ATS-friendly at the same time.',
        ],
      },
      {
        heading: 'Final PM resume checklist before you apply',
        paragraphs: [
          'Before sending any application, run a fast quality check. Confirm your headline matches the role, your summary is customized, and your top bullets reflect the core requirements from the job description. Check that your first page includes concrete product outcomes, not only responsibilities. If a recruiter can understand your fit in under sixty seconds, your resume is structured correctly.',
          'Next, validate consistency and polish. Ensure tense consistency, metric formatting, and section spacing are clean. Keep bullet length tight and remove repeated phrasing. Use active verbs and avoid vague filler language like helped, involved in, or supported unless absolutely necessary. Strong PM resumes are concise because concise writing reflects prioritization and clear thinking.',
          'A winning product manager resume is not built once and reused forever. Treat it as a living artifact that evolves with each target role. When you tailor your narrative, align role-specific keywords, and prove measurable impact, you dramatically improve your chances of landing recruiter screens and final-round interviews.',
        ],
      },
    ],
  },
  {
    slug: 'ats-resume-mistakes',
    title: 'Top ATS Resume Mistakes Product Managers Make (and How to Fix Them)',
    description:
      'Learn the most common ATS resume mistakes for product managers and how to fix formatting, keyword alignment, and bullet quality to improve your interview rate.',
    keywords: [
      'ATS resume mistakes',
      'product manager resume mistakes',
      'ATS-friendly PM resume',
      'resume keyword optimization',
    ],
    publishedAt: '2026-04-25',
    readTime: '10 min read',
    sections: [
      {
        heading: 'Mistake 1: Treating ATS like a keyword game only',
        paragraphs: [
          'A common misconception is that ATS screening can be beaten by stuffing keywords into a long skills section. In reality, modern parsers and recruiters evaluate context. If you list experimentation, monetization, SQL, and product strategy but none of your bullets demonstrate those capabilities, your resume appears inflated and low credibility. A keyword list without evidence rarely converts into interviews.',
          'The fix is to place high-priority keywords where they naturally belong: your summary and your impact bullets. For example, if the job asks for cross-functional stakeholder management, show where you aligned engineering, design, legal, or sales to ship a feature and what outcome followed. Contextual usage signals authentic skill application and improves ATS plus human evaluation at the same time.',
          'Build a short keyword map before applying. Pull repeated terms from the job description, then map each term to one supporting bullet. If you cannot map a term honestly, do not force it. This process keeps your product manager resume truthful, targeted, and easier to defend in interviews.',
        ],
      },
      {
        heading: 'Mistake 2: Using layouts that ATS parsers struggle to read',
        paragraphs: [
          'Many visually impressive templates fail when parsed by applicant tracking systems. Multi-column layouts, nested tables, icons as bullet markers, and text inside graphics can cause missing data or scrambled sections. When parsing fails, your title history, dates, or skills may not appear correctly in recruiter systems, even if the PDF looks perfect on your laptop.',
          'Use a simple single-column resume format with standard headings: Summary, Experience, Skills, Education. Stick to clear text bullets and consistent date formatting. Avoid unusual fonts or decorative symbols that might not encode cleanly. If an application specifically asks for DOCX, provide DOCX. If PDF is accepted, use an ATS-friendly export that preserves selectable text.',
          'You do not need a flashy design to stand out for product manager roles. Hiring teams care more about product judgment, execution signal, and measurable outcomes. A clean structure improves scan speed and reduces parsing risk, which often has more impact than visual styling.',
        ],
      },
      {
        heading: 'Mistake 3: Writing responsibility-heavy bullets with no outcomes',
        paragraphs: [
          'Bullets like managed roadmap, collaborated with teams, and led sprint planning are too generic. They do not differentiate you from hundreds of other PM applicants. Recruiters want to see the product problem, your decision, and business impact. Without that chain, your contributions are hard to evaluate and your resume gets deprioritized.',
          'Rewrite each bullet with a measurable outcome. Start with an action verb, add the context, and finish with a result. Example: Defined experiment backlog for new-user onboarding and partnered with analytics to instrument activation funnel, increasing activation by 11 percent over one quarter. This structure communicates ownership and execution clarity.',
          'If exact numbers are confidential, use direction with specificity: reduced support tickets materially, shortened release cycle by multiple days, improved conversion across key steps. Specificity is better than vague claims. Outcome-focused writing is one of the fastest ways to improve ATS and recruiter performance.',
        ],
      },
      {
        heading: 'Mistake 4: Sending the same PM resume to every company',
        paragraphs: [
          'Generic resumes underperform because PM roles are not interchangeable. One company may need a zero-to-one discovery PM, another may need a growth PM, and another may need a platform PM working on internal systems. If your resume does not reflect the mission and metrics of the target team, you look misaligned even when your background is strong.',
          'Create a role-specific version for each application. Adjust your summary, reorder bullets, and highlight relevant projects first. For growth-heavy roles, prioritize activation, retention, and monetization results. For platform roles, emphasize reliability, scalability, developer experience, and cross-team dependencies. Tailoring at this level significantly improves shortlisting odds.',
          'You can speed this process by maintaining a master resume with rich bullet inventory, then assembling focused versions per role. This prevents rewrite fatigue and ensures consistency while still giving each application the relevance recruiters expect.',
        ],
      },
      {
        heading: 'Mistake 5: Ignoring seniority signals and leadership context',
        paragraphs: [
          'Product manager resumes often fail because they do not clearly indicate level. A senior PM resume should show strategic ownership, trade-off decisions, and cross-functional influence beyond a single squad. An associate PM resume should show execution quality, rapid learning, and strong collaboration. When level signals are unclear, recruiters struggle to place you and may pass.',
          'Fix this by adding scope indicators to your bullets: team size, product surface, user base, geography, or revenue context. Mention decisions you drove, not just tasks completed. For senior candidates, include examples of mentoring, operating cadence design, or initiative prioritization across teams. For early-career candidates, show progression and increased responsibility over time.',
          'Level alignment also helps during interviews. If your resume positions you correctly, conversations focus on fit rather than qualification gaps. Strong seniority signaling is an underrated part of ATS optimization because it influences both automated ranking and human confidence.',
        ],
      },
      {
        heading: 'Mistake 6: Skipping a final quality and relevance audit',
        paragraphs: [
          'Even good resumes lose opportunities due to small quality issues: inconsistent tense, typo-heavy bullet points, uneven punctuation, or metrics that appear contradictory. These details create doubt about attention to detail, which is a critical PM competency. Before submitting, run a deliberate quality pass instead of a quick skim.',
          'Use a final checklist: Does the headline match the role? Are top bullets aligned with the job description? Are outcomes visible in every experience section? Are ATS keywords present naturally? Is formatting consistent and easy to parse? This checklist can be completed in ten minutes and materially improves application quality.',
          'ATS optimization is not about gaming software. It is about clear communication of product value. When your resume combines relevance, readability, and credible outcomes, you increase your probability of recruiter outreach and move faster toward interview loops.',
        ],
      },
    ],
  },
  {
    slug: 'pm-resume-keywords',
    title: 'PM Resume Keywords: The Terms Recruiters and ATS Actually Look For',
    description:
      'A practical guide to product manager resume keywords by role type, industry, and seniority so you can optimize your resume naturally and improve ATS match rates.',
    keywords: [
      'PM resume keywords',
      'product manager keywords',
      'ATS keywords for resumes',
      'resume keywords for product managers',
    ],
    publishedAt: '2026-04-25',
    readTime: '9 min read',
    sections: [
      {
        heading: 'Why keywords matter in PM hiring',
        paragraphs: [
          'Keywords help ATS systems and recruiters quickly identify relevance between your profile and an open role. For product manager hiring, relevance is especially important because PM jobs vary widely by product stage, domain, and team structure. A strong keyword strategy ensures your resume reflects the language the company uses to define success for that specific position.',
          'That said, keywords should support your story, not replace it. Recruiters can easily detect keyword-heavy resumes with thin evidence. The most effective product manager resume uses keywords in context: tied to projects, decisions, and measurable outcomes. This approach improves screening performance while preserving credibility in interviews.',
          'Think of keywords as signals across three layers: strategic thinking, execution capability, and domain context. When your resume covers all three layers, hiring teams can map you to the role faster and with higher confidence.',
        ],
      },
      {
        heading: 'Core strategic PM keywords to include',
        paragraphs: [
          'Strategic keywords communicate that you can define what to build and why. Common examples include product strategy, customer research, opportunity sizing, roadmap prioritization, market analysis, and go-to-market planning. These terms are frequently present in job descriptions and should appear in your summary or top experience bullets where they are most visible.',
          'Do not list strategic terms without proof. Instead, show where strategy changed outcomes. Example: Led product strategy for self-serve onboarding segment, prioritizing activation experiments that increased first-week retention by 8 percent. This line uses a strategic keyword while proving execution and business impact.',
          'If you are targeting senior PM or group PM roles, include language around cross-functional leadership, portfolio prioritization, and trade-off decisions. Senior hiring panels look for strategic judgment under constraints, so keyword selection should reflect role level as well as function.',
        ],
      },
      {
        heading: 'Execution and analytics keywords for ATS alignment',
        paragraphs: [
          'Execution keywords demonstrate that you can deliver outcomes, not just ideas. High-value terms include PRD development, sprint planning, backlog prioritization, experiment design, release management, and stakeholder communication. Analytics keywords include SQL, funnel analysis, cohort retention, KPI dashboards, and conversion optimization. Together, these indicate practical PM operating ability.',
          'Place execution keywords in bullets that show cadence and impact. Example: Partnered with engineering and analytics to prioritize experiment backlog, shipping weekly tests that improved checkout conversion by 6.4 percent. This style signals operational reliability and measurable progress, both of which are critical in product manager hiring.',
          'Avoid inflating technical depth if it is not accurate. It is better to state used SQL for exploratory analysis and metric validation than to imply full data engineering ownership. Honest, specific phrasing performs better in interviews and still satisfies ATS relevance requirements.',
        ],
      },
      {
        heading: 'Industry-specific PM keywords by target role',
        paragraphs: [
          'Industry context helps recruiters understand fit quickly. For fintech PM resumes, useful keywords include payments, KYC, risk controls, fraud prevention, transaction success rate, and regulatory compliance. For SaaS roles, include activation, expansion, churn reduction, onboarding, pricing experiments, and self-serve conversion. For ecommerce PM roles, include catalog discovery, merchandising, checkout funnel, AOV, and repeat purchase rate.',
          'Select industry terms based on your actual project history. If you are transitioning industries, highlight transferable patterns first, then include adjacent domain language from side projects or previous collaborations. For example, a marketplace PM moving into fintech can emphasize trust flows, transaction reliability, and user risk communication as bridges to payments or compliance work.',
          'Industry keywords are strongest when paired with concrete outcomes. Saying led payments optimization is weaker than saying optimized payment failure recovery flow, improving transaction success by 3.1 percent. Specific evidence turns domain keywords into hiring signals.',
        ],
      },
      {
        heading: 'Keyword placement: where each term should appear',
        paragraphs: [
          'Place high-priority keywords in four areas: headline or summary, top third of experience section, role-specific skills section, and project highlights. The first page is crucial because both ATS extraction and recruiter scan behavior are front-loaded. If your most relevant terms are buried at the bottom, you lose visibility.',
          'Use semantic variation to avoid repetition. If a job description says stakeholder management, you can also use cross-functional alignment or executive communication where appropriate. If it says experimentation, related terms like A/B testing and hypothesis validation can reinforce relevance. Natural variation improves readability while preserving keyword coverage.',
          'After drafting, run a relevance audit. Compare your resume against the target job description and ensure that repeated terms are represented in authentic contexts. If one critical requirement is missing from your experience, consider adding a short project bullet or adjusting emphasis so the signal becomes visible.',
        ],
      },
      {
        heading: 'Build a keyword system you can reuse for every application',
        paragraphs: [
          'The fastest way to scale applications is to create a reusable keyword framework. Maintain a master document with categorized keywords: strategy, execution, analytics, leadership, and industry. For each new role, select a subset and map it to specific bullets from your experience library. This keeps your resume tailored without rewriting from scratch every time.',
          'You should also maintain multiple summary templates by role type, such as growth PM, platform PM, and product operations PM. Rotating these templates with matched keyword sets allows faster customization and better alignment. Over time, track which versions generate higher response rates and refine your framework based on real outcomes.',
          'A high-performing PM resume is not built on random buzzwords. It is built on role-specific language, clear structure, and measurable product outcomes. When keywords are deliberate and evidence-backed, your resume passes ATS checks and makes recruiters want to schedule interviews.',
        ],
      },
    ],
  },
];

export const BLOG_POST_BY_SLUG = Object.fromEntries(
  BLOG_POSTS.map((post) => [post.slug, post]),
) as Record<string, BlogPost>;
