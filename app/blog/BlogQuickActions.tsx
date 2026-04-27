import Link from 'next/link';

type BlogQuickActionsProps = {
  className?: string;
};

export function BlogQuickActions({ className }: BlogQuickActionsProps) {
  return (
    <div className={className}>
      <div className="flex flex-wrap gap-3">
        <Link
          href="/score"
          className="inline-flex items-center rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
        >
          Check ATS score
        </Link>
        <Link
          href="/optimize"
          className="inline-flex items-center rounded-lg border border-blue-300 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100"
        >
          Optimize resume
        </Link>
        <Link
          href="/"
          className="inline-flex items-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
        >
          Home
        </Link>
      </div>
    </div>
  );
}
