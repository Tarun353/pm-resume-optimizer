'use client';

interface ScoreBreakdownProps {
  breakdown: {
    pmSkills: number;
    impact: number;
    keywords: number;
  };
}

const ITEMS = [
  { key: 'pmSkills', label: 'PM Skills Match', color: 'bg-blue-500' },
  { key: 'impact', label: 'Impact / Quantification', color: 'bg-violet-500' },
  { key: 'keywords', label: 'Keyword Coverage', color: 'bg-emerald-500' },
] as const;

export function ScoreBreakdown({ breakdown }: ScoreBreakdownProps) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-900">Score Breakdown</p>
          <p className="text-xs text-slate-500">Quick explanation of what drives the headline score.</p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">Animated reveal</span>
      </div>

      <div className="space-y-4">
        {ITEMS.map((item, index) => {
          const value = breakdown[item.key];
          return (
            <div key={item.key} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-slate-700">{item.label}</span>
                <span className="font-semibold text-slate-900">{value}/100</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full ${item.color} transition-all duration-700 ease-out`}
                  style={{ width: `${value}%`, transitionDelay: `${index * 120}ms` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
