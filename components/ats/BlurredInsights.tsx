'use client';

interface BlurredInsightsProps {
  insights: {
    missingKeywords: string[];
    bulletImprovements: string[];
    sectionFeedback: string[];
  };
  unlocked: boolean;
}

function InsightGroup({ title, items, blur }: { title: string; items: string[]; blur: boolean }) {
  return (
    <div className={`rounded-2xl border border-slate-200 bg-slate-50 p-4 transition-all duration-300 ${blur ? 'blur-[5px]' : 'blur-0'}`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
      <ul className="mt-3 space-y-2 text-sm text-slate-700">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <span className="mt-1 text-blue-500">•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function BlurredInsights({ insights, unlocked }: BlurredInsightsProps) {
  return (
    <div className="relative rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">Detailed ATS Insights</p>
          <p className="text-xs text-slate-500">
            {unlocked ? 'Full report unlocked.' : 'Preview the structure now, unlock the specifics after login.'}
          </p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${unlocked ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
          {unlocked ? 'Unlocked' : 'Locked preview'}
        </span>
      </div>

      <div className="space-y-4">
        <InsightGroup title="Missing Keywords" items={insights.missingKeywords} blur={!unlocked} />
        <InsightGroup title="Bullet Improvements" items={insights.bulletImprovements} blur={!unlocked} />
        <InsightGroup title="Section Feedback" items={insights.sectionFeedback} blur={!unlocked} />
      </div>

      {!unlocked && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-3xl bg-gradient-to-b from-white/10 via-white/35 to-white/80">
          <div className="rounded-2xl border border-white/80 bg-white/90 px-5 py-3 text-center shadow-lg backdrop-blur-sm">
            <p className="text-sm font-semibold text-slate-900">Unlock the full ATS report</p>
            <p className="mt-1 text-xs text-slate-500">Missing keywords, rewrite cues, and section-by-section feedback are ready.</p>
          </div>
        </div>
      )}
    </div>
  );
}
