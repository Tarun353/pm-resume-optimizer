import type { Metadata } from 'next';
import Link from 'next/link';
import { SeoCta } from '@/components/SeoCta';

function toTitleCase(value: string) {
  return value
    .split('-')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function getKeywordVariations(roleLabel: string) {
  const roleLower = roleLabel.toLowerCase();

  return [
    `${roleLabel} resume`,
    `${roleLabel} resume examples`,
    `${roleLabel} resume keywords`,
    `transition to product manager from ${roleLower}`,
    `${roleLabel} to product manager career switch`,
    `ATS-friendly product manager resume`,
  ];
}

export function generateMetadata({ params }: { params: { role: string } }): Metadata {
  const roleLabel = toTitleCase(params.role);

  return {
    title: `Product Manager Resume for ${roleLabel} | ATS-Friendly Career Transition Guide`,
    description: `Learn how to position your ${roleLabel} background for product manager roles with transferable skills, ATS keywords, and resume strategy.`,
    keywords: getKeywordVariations(roleLabel),
  };
}

export default function ResumeForRolePage({ params }: { params: { role: string } }) {
  const roleLabel = toTitleCase(params.role);
  const keywords = getKeywordVariations(roleLabel);

  return (
    <main className="min-h-screen bg-slate-50 py-12">
      <article className="mx-auto max-w-4xl rounded-2xl border border-slate-200 bg-white px-6 py-10 shadow-sm sm:px-10">
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">Role Transition Guide</p>

        <h1 className="mt-2 text-3xl font-bold text-slate-900 sm:text-4xl">
          Product Manager Resume for {roleLabel}
        </h1>

        <SeoCta className="mt-6" />

        <div className="mt-8 space-y-5 text-slate-700">
          <p>
            Breaking into product management from a {roleLabel} background is absolutely possible when your resume
            clearly explains your transition story. Hiring teams are looking for candidates who can understand user
            problems, prioritize effectively, and drive cross-functional execution. Your resume should connect your
            past work to these PM expectations in a way that feels credible and measurable.
          </p>

          <p>
            A strong transition strategy starts with reframing your achievements using product language. Instead of
            listing only functional tasks, show decisions, collaboration, and outcomes. For example, explain how you
            influenced roadmap priorities, partnered with engineering and design, used customer insights, and improved
            business metrics. This helps recruiters see product potential rather than only your previous title.
          </p>

          <p>
            Transferable skills from {roleLabel} roles can be very powerful when positioned correctly: stakeholder
            communication, data-informed decision making, problem decomposition, project execution, and ownership under
            ambiguity. Match each of these skills to one concrete achievement so ATS systems and recruiters both detect
            role relevance quickly.
          </p>

          <div>
            <h2 className="text-xl font-semibold text-slate-900">Keyword variations to include</h2>
            <ul className="mt-3 list-disc space-y-2 pl-6 text-slate-700">
              {keywords.map((keyword) => (
                <li key={keyword}>{keyword}</li>
              ))}
            </ul>
          </div>

          <p>
            Customize your summary and bullets for every application, mirroring the job description where accurate.
            Clear formatting, measurable impact, and role-specific keywords together make your resume more likely to
            pass ATS filters and convert to interviews.
          </p>
        </div>

        <Link
          href="/"
          className="mt-10 inline-flex items-center text-lg font-semibold text-blue-700 hover:text-blue-800"
        >
          Try the homepage resume tool →
        </Link>
        <SeoCta className="mt-10" />
      </article>
    </main>
  );
}
