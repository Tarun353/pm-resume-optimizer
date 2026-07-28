import type { Metadata } from 'next';
import { SeoCta } from '@/components/SeoCta';
import { createPageMetadata } from '@/lib/seo';

export const metadata: Metadata = createPageMetadata({
  title: 'Optimize Your Product Manager Resume with AI',
  description:
    'Use AI to rewrite, structure, and optimize your product manager resume for ATS systems and recruiter expectations.',
  keywords: ['AI resume optimizer', 'product manager resume optimization', 'ATS-friendly resume rewrite'],
  path: '/optimize',
});

export default function OptimizeLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="mx-auto mt-4 w-full max-w-5xl px-4">
        <SeoCta />
      </div>
      {children}
      <div className="mx-auto mb-8 mt-8 w-full max-w-5xl px-4">
        <SeoCta />
      </div>
    </>
  );
}
