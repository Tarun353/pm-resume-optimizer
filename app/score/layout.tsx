import type { Metadata } from 'next';
import { SeoCta } from '@/components/SeoCta';
import { createPageMetadata } from '@/lib/seo';

export const metadata: Metadata = createPageMetadata({
  title: 'Resume ATS Score Checker for Product Managers',
  description:
    'Check your product manager resume ATS score, keyword match quality, and recruiter-readiness with actionable recommendations.',
  keywords: ['resume ATS score checker', 'product manager resume score', 'ATS keyword match'],
  path: '/score',
});

export default function ScoreLayout({ children }: { children: React.ReactNode }) {
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
