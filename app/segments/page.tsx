import type { Metadata } from 'next';
import Link from 'next/link';
import { SEGMENT_PAGES } from '@/lib/content/segments';
import { SeoCta } from '@/components/SeoCta';
import { createBreadcrumbSchema, createPageMetadata } from '@/lib/seo';

export const metadata: Metadata = createPageMetadata({
  title: 'PM Resume Segments: Role and Industry SEO Guides',
  description:
    'Explore segmented product manager resume guides by role, domain, and seniority with ATS-friendly recommendations and keyword strategy.',
  keywords: ['product manager resume segments', 'ATS resume guides', 'PM resume keywords by industry'],
  path: '/segments',
});

export default function SegmentIndexPage() {
  const breadcrumbSchema = createBreadcrumbSchema([
    { name: 'Home', path: '/' },
    { name: 'Segments', path: '/segments' },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
    <main className="min-h-screen bg-slate-50 py-12">
      <div className="mx-auto max-w-5xl px-6">
        <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">PM Resume Segment Library</h1>
        <p className="mt-4 text-slate-700">
          Browse role and industry specific pages to tailor your product manager resume with ATS-friendly positioning.
        </p>

        <SeoCta className="mt-6" />

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SEGMENT_PAGES.map((segment) => (
            <Link
              key={segment.slug}
              href={`/segments/${segment.slug}`}
              className="rounded-xl border border-slate-200 bg-white p-4 transition-colors hover:border-blue-300 hover:bg-blue-50"
            >
              <h2 className="text-lg font-semibold text-slate-900">{segment.title}</h2>
              <p className="mt-2 text-sm text-slate-600">{segment.description}</p>
            </Link>
          ))}
        </div>

        <SeoCta className="mt-10" />
      </div>
    </main>
    </>
  );
}
