import Link from 'next/link';
import { SeoCta } from '@/components/SeoCta';
import type { Metadata } from 'next';

const pretty = (value: string) =>
  value
    .split('-')
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
    .join(' ');

type ProgrammaticPageProps = {
  params: Promise<{ role: string; industry: string }>;
};

export async function generateMetadata({ params }: ProgrammaticPageProps): Promise<Metadata> {
  const { role, industry } = await params;
  const roleLabel = pretty(role);
  const industryLabel = pretty(industry);
  const canonical = `https://pm-resume-optimizer.onrender.com/resume-score/${role}/${industry}`;

  return {
    title: `${roleLabel} Resume Score for ${industryLabel} Jobs`,
    description: `Check how your ${roleLabel} resume performs for ${industryLabel} roles. Get ATS keyword alignment, recruiter-focused improvements, and practical rewrite suggestions.`,
    keywords: [
      `${roleLabel} resume score`,
      `${industryLabel} PM resume`,
      'ATS keyword alignment',
      'product manager resume optimization',
    ],
    alternates: {
      canonical,
    },
  };
}

export default async function ResumeScoreProgrammaticPage({ params }: ProgrammaticPageProps) {
  const { role, industry } = await params;
  const roleLabel = pretty(role);
  const industryLabel = pretty(industry);

  const keywords = [
    `${roleLabel} resume`,
    `${industryLabel} product experience`,
    'ATS resume score',
    'keyword alignment',
    'product metrics',
  ];

  return (
    <main className="min-h-screen bg-slate-50 py-12">
      <article className="mx-auto max-w-4xl rounded-2xl border border-slate-200 bg-white px-6 py-10 shadow-sm sm:px-10">
        <SeoCta className="mb-6" />

        <h1 className="text-3xl font-bold leading-tight text-slate-900 sm:text-4xl">
          {roleLabel} Resume Score Guide for {industryLabel}
        </h1>

        <p className="mt-6 text-base leading-8 text-slate-700">
          If you are applying for {industryLabel.toLowerCase()} roles, your {roleLabel.toLowerCase()} resume needs
          to show domain understanding, measurable impact, and ATS-friendly wording. Recruiters in this market
          usually expect evidence of product decisions linked to business outcomes, not only task descriptions.
          This page helps you understand what hiring teams look for and how to position your experience.
        </p>

        <section className="mt-10">
          <h2 className="text-2xl font-semibold text-slate-900">
            What recruiters expect from a {roleLabel.toLowerCase()} resume in {industryLabel}
          </h2>
          <p className="mt-4 text-base leading-8 text-slate-700">
            Recruiters evaluate three things first: role relevance, product judgment, and execution signal. For
            {industryLabel.toLowerCase()} roles, include examples that show domain-specific problem solving,
            cross-functional collaboration, and outcome ownership. Strong resumes clearly communicate what you
            prioritized, why you prioritized it, and what business metric moved after launch.
          </p>
          <p className="mt-4 text-base leading-8 text-slate-700">
            Keep your formatting clean and ATS-friendly using a simple one-column structure with standard headings.
            Use concise bullets with measurable outcomes, and adapt your summary to match the target company stage
            and product surface. Tailoring your resume by role and industry improves shortlisting rates significantly.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="text-2xl font-semibold text-slate-900">Keywords to include naturally</h2>
          <p className="mt-4 text-base leading-8 text-slate-700">
            Add relevant keywords in context across your summary and experience bullets. For this target profile,
            prioritize terms like {keywords.join(', ')}. Use these keywords only where they are accurate and tied to
            real work. Avoid keyword stuffing and focus on evidence-backed phrasing that reads naturally.
          </p>
        </section>

        <section className="mt-10 rounded-xl border border-blue-200 bg-blue-50 p-6">
          <h2 className="text-xl font-semibold text-slate-900">Get your ATS score and tailored rewrite</h2>
          <p className="mt-3 text-slate-700">
            Paste your resume and a job description into PM Resume Optimizer to receive a role-specific score,
            keyword gap analysis, and recommended bullet rewrites for {industryLabel} opportunities.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/"
              className="inline-flex items-center rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
            >
              Open PM Resume Tool
            </Link>
            <Link
              href="/blog"
              className="inline-flex items-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              Read PM Resume Blog
            </Link>
            <Link
              href="/blog/pm-resume-keywords"
              className="inline-flex items-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              Keyword Guide
            </Link>
          </div>
        </section>
        <SeoCta className="mt-10" />
      </article>
    </main>
  );
}
