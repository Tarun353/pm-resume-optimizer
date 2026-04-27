import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Resume ATS Score Checker for Product Managers',
  description:
    'Check your product manager resume ATS score, keyword match quality, and recruiter-readiness with actionable recommendations.',
  keywords: ['resume ATS score checker', 'product manager resume score', 'ATS keyword match'],
};

export default function ScoreLayout({ children }: { children: React.ReactNode }) {
  return children;
}
