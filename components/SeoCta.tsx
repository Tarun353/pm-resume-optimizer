"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';

type SeoCtaProps = {
  className?: string;
};

export function SeoCta({ className = '' }: SeoCtaProps) {
  const pathname = usePathname();
  const showCta = pathname.startsWith('/blog');

  if (!showCta) {
    return null;
  }

  return (
    <div className={`rounded-xl border border-blue-200 bg-blue-50 p-4 ${className}`.trim()}>
      <Link
        href="/score"
        className="inline-flex items-center rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-800"
      >
        Check your resume ATS score
      </Link>
    </div>
  );
}
