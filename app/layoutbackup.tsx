import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'ATS Resume Optimizer — Land More Interviews',
  description:
    'Optimize your resume for Applicant Tracking Systems using AI. Upload your resume and job description to get ATS-optimized content instantly.',
  keywords: ['ATS', 'resume optimizer', 'AI resume', 'job application', 'resume builder'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
