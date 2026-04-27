import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Optimize Your Product Manager Resume with AI',
  description:
    'Use AI to rewrite, structure, and optimize your product manager resume for ATS systems and recruiter expectations.',
  keywords: ['AI resume optimizer', 'product manager resume optimization', 'ATS-friendly resume rewrite'],
};

export default function OptimizeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
