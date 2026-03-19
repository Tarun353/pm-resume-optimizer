'use client';

import { useEffect, useState } from 'react';

interface ScoreCardProps {
  score: number;
}

export function ScoreCard({ score }: ScoreCardProps) {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    let frame = 0;
    const duration = 900;
    const stepMs = 16;
    const totalFrames = Math.max(1, Math.round(duration / stepMs));

    const interval = window.setInterval(() => {
      frame += 1;
      const nextValue = Math.round((score * frame) / totalFrames);
      setAnimatedScore(nextValue >= score ? score : nextValue);

      if (frame >= totalFrames) {
        window.clearInterval(interval);
      }
    }, stepMs);

    return () => window.clearInterval(interval);
  }, [score]);

  const ringColor = score >= 80 ? 'text-emerald-500' : score >= 65 ? 'text-amber-500' : 'text-rose-500';

  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-950 p-6 text-white shadow-xl shadow-slate-900/10">
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-blue-200">Instant ATS score</p>
      <div className="mt-5 flex items-end justify-between gap-4">
        <div>
          <div className={`text-6xl font-bold tracking-tight transition-all duration-500 ${ringColor}`}>
            {animatedScore}
          </div>
          <p className="mt-2 text-sm text-slate-300">Mock PM-fit benchmark for your uploaded resume.</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-right backdrop-blur-sm">
          <p className="text-xs text-slate-400">Range</p>
          <p className="text-sm font-semibold text-white">0–100</p>
        </div>
      </div>
    </div>
  );
}
