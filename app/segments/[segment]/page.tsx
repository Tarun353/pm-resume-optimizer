import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SEGMENT_BY_SLUG, SEGMENT_PAGES } from '@/lib/content/segments';
import { SeoCta } from '@/components/SeoCta';

type SegmentProps = {
  params: Promise<{ segment: string }>;
};

export async function generateStaticParams() {
  return SEGMENT_PAGES.map((segment) => ({ segment: segment.slug }));
}

export async function generateMetadata({ params }: SegmentProps): Promise<Metadata> {
  const { segment } = await params;
  const item = SEGMENT_BY_SLUG[segment];

  if (!item) {
    return { title: 'Segment Not Found', description: 'This PM resume segment page does not exist.' };
  }

  const canonical = `https://pm-resume-optimizer.onrender.com/segments/${item.slug}`;
  return {
    title: item.title,
    description: item.description,
    keywords: item.keywords,
    alternates: { canonical },
  };
}

export default async function SegmentPage({ params }: SegmentProps) {
  const { segment } = await params;
  const item = SEGMENT_BY_SLUG[segment];

  if (!item) notFound();

  return (
    <main className="min-h-screen bg-slate-50 py-12">
      <article className="mx-auto max-w-4xl rounded-2xl border border-slate-200 bg-white px-6 py-10 shadow-sm sm:px-10">
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">Segment Resume Guide</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900 sm:text-4xl">{item.title}</h1>
        <p className="mt-6 text-base leading-8 text-slate-700">{item.description}</p>

        <SeoCta className="mt-8" />

        <section className="mt-10">
          <h2 className="text-2xl font-semibold text-slate-900">How to optimize this PM resume segment</h2>
          <p className="mt-4 text-base leading-8 text-slate-700">
            Focus on role-relevant product outcomes, ATS keyword alignment, and clear decision ownership. Tailor your summary and top bullets to match the job description language naturally, then quantify business impact with reliable metrics.
          </p>
          <p className="mt-4 text-base leading-8 text-slate-700">
            Add segment-specific terminology only when it reflects real projects. Keep formatting ATS-safe with standard headings and one-column layout so both recruiters and applicant tracking systems can parse your resume correctly.
          </p>
        </section>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/segments" className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">
            View all segments
          </Link>
          <Link href="/blog" className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">
            Explore PM blog
          </Link>
        </div>

        <SeoCta className="mt-10" />
      </article>
    </main>
  );
}
