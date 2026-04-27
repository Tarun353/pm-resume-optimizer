import type { Metadata } from 'next';
import { SeoCta } from '@/components/SeoCta';

export const metadata: Metadata = {
  title: 'Resume ATS Score Checker for Product Managers',
  description:
    'Check your product manager resume ATS score, keyword match quality, and recruiter-readiness with actionable recommendations.',
  keywords: ['resume ATS score checker', 'product manager resume score', 'ATS keyword match'],
};

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
