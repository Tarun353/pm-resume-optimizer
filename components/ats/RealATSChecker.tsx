'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { scoreResume, type ATSScoreResult } from '@/lib/atsScorer';

interface RealATSCheckerProps {
  isLoggedIn: boolean;
  onLogin: () => void;
  /** Called when user clicks "Fix this →" — passes resume text + JD so main form pre-fills */
  onPrefillAndOptimize: (resumeText: string, jdText: string, profile: string) => void;
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function ScoreRing({ score, grade }: { score: number; grade: ATSScoreResult['grade'] }) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const filled = (score / 100) * circumference;
  const [animated, setAnimated] = useState(0);

  const color =
    grade === 'A' ? '#10b981' :
    grade === 'B' ? '#3b82f6' :
    grade === 'C' ? '#f59e0b' :
    grade === 'D' ? '#f97316' : '#ef4444';

  const label =
    grade === 'A' ? 'Strong Match' :
    grade === 'B' ? 'Good Match' :
    grade === 'C' ? 'Needs Work' :
    grade === 'D' ? 'Significant Gaps' : 'Major Rewrite Needed';

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(score), 50);
    return () => clearTimeout(timer);
  }, [score]);

  const animatedFilled = (animated / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <svg width="140" height="140" viewBox="0 0 140 140">
          {/* Track */}
          <circle
            cx="70" cy="70" r={radius}
            fill="none" stroke="#f1f5f9" strokeWidth="10"
          />
          {/* Progress */}
          <circle
            cx="70" cy="70" r={radius}
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${circumference}`}
            strokeDashoffset={circumference - animatedFilled}
            transform="rotate(-90 70 70)"
            style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.22,1,0.36,1)' }}
          />
          {/* Score text */}
          <text x="70" y="65" textAnchor="middle" fontSize="28" fontWeight="700" fill="#0f172a" fontFamily="system-ui">
            {animated}
          </text>
          <text x="70" y="82" textAnchor="middle" fontSize="11" fill="#94a3b8" fontFamily="system-ui">
            out of 100
          </text>
        </svg>
      </div>
      <div className="text-center">
        <span
          className="inline-block px-4 py-1.5 rounded-full text-xs font-bold text-white"
          style={{ backgroundColor: color }}
        >
          {label}
        </span>
      </div>
    </div>
  );
}

function BreakdownBar({
  label, score, maxScore, icon, delay = 0,
}: {
  label: string;
  score: number;
  maxScore: number;
  icon: string;
  delay?: number;
}) {
  const [width, setWidth] = useState(0);
  const pct = Math.round((score / maxScore) * 100);

  useEffect(() => {
    const t = setTimeout(() => setWidth(pct), 100 + delay);
    return () => clearTimeout(t);
  }, [pct, delay]);

  const barColor =
    pct >= 75 ? 'bg-emerald-500' :
    pct >= 50 ? 'bg-blue-500' :
    pct >= 30 ? 'bg-amber-500' : 'bg-red-400';

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-1.5 font-medium text-slate-700">
          <span>{icon}</span> {label}
        </span>
        <span className="font-bold text-slate-900 tabular-nums">
          {score}
          <span className="text-xs font-normal text-slate-400">/{maxScore}</span>
        </span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${barColor} transition-all duration-700 ease-out`}
          style={{ width: `${width}%`, transitionDelay: `${delay}ms` }}
        />
      </div>
    </div>
  );
}

function KeywordPill({ word, matched }: { word: string; matched: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
      matched
        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
        : 'bg-red-50 text-red-600 border-red-200'
    }`}>
      {matched ? '✓' : '✗'} {word}
    </span>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export function RealATSChecker({ isLoggedIn, onLogin, onPrefillAndOptimize }: RealATSCheckerProps) {
  const [resumeText, setResumeText] = useState('');
  const [jdText, setJDText]         = useState('');
  const [profile, setProfile]       = useState('experienced');
  const [result, setResult]         = useState<ATSScoreResult | null>(null);
  const [hasScored, setHasScored]   = useState(false);
  const [activeTab, setActiveTab]   = useState<'keywords' | 'pm' | 'metrics' | 'verbs'>('keywords');
  const debounceRef                 = useRef<NodeJS.Timeout | null>(null);

  const canScore = resumeText.trim().length > 100;

  // Auto-score with debounce as user types
  const runScore = useCallback(() => {
    if (!canScore) { setResult(null); setHasScored(false); return; }
    const r = scoreResume(resumeText, jdText, profile);
    setResult(r);
    setHasScored(true);
  }, [resumeText, jdText, profile, canScore]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(runScore, 600);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [runScore]);

  const handleFixThis = () => {
    if (!isLoggedIn) {
      onLogin();
      return;
    }
    onPrefillAndOptimize(resumeText, jdText, profile);
  };

  const scoreColor =
    !result ? '#94a3b8' :
    result.grade === 'A' ? '#10b981' :
    result.grade === 'B' ? '#3b82f6' :
    result.grade === 'C' ? '#f59e0b' :
    result.grade === 'D' ? '#f97316' : '#ef4444';

  return (
    <section className="mb-10 rounded-[2rem] border border-slate-200 bg-white shadow-xl shadow-slate-200/50 overflow-hidden animate-fadeInUp">

      {/* Header */}
      <div className="px-6 pt-6 pb-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-blue-50/40">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700 mb-3">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
              FREE · No login needed
            </span>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              PM Resume ↔ JD Match Score
            </h2>
            <p className="mt-1.5 text-sm text-slate-500 max-w-xl leading-relaxed">
              Paste your resume + job description below. See your real keyword match score,
              what's missing, and where the gaps are — instantly, client-side, no AI needed.
            </p>
          </div>
          <div className="hidden sm:flex flex-col items-end gap-1 text-right shrink-0">
            <span className="text-xs text-slate-400">Score updates as you type</span>
            <span className="text-xs text-slate-400">100% client-side · Private · No data sent</span>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_420px]">

        {/* LEFT: Inputs */}
        <div className="p-6 space-y-5 border-r border-slate-100">

          {/* Profile */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
              Your PM Profile
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'aspiring',      label: 'Aspiring PM',       emoji: '🎓', desc: 'Student / Fresher' },
                { value: 'transitioning', label: 'Transitioning',     emoji: '🔄', desc: 'From another domain' },
                { value: 'experienced',   label: 'Experienced PM',    emoji: '💼', desc: '1+ years in PM' },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setProfile(opt.value)}
                  className={`flex flex-col items-center gap-1 p-3 rounded-2xl border-2 text-center transition-all duration-200 ${
                    profile === opt.value
                      ? 'border-blue-500 bg-blue-50 shadow-sm scale-[1.02]'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-xl">{opt.emoji}</span>
                  <span className={`text-xs font-bold leading-tight ${profile === opt.value ? 'text-blue-700' : 'text-slate-700'}`}>
                    {opt.label}
                  </span>
                  <span className="text-[10px] text-slate-400 leading-tight">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Resume Text */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                Your Resume Text
              </label>
              <span className={`text-xs font-medium tabular-nums ${
                resumeText.length > 100 ? 'text-emerald-600' : 'text-slate-400'
              }`}>
                {resumeText.length > 100 ? `${resumeText.length} chars ✓` : `${resumeText.length} / 100+ needed`}
              </span>
            </div>
            <textarea
              value={resumeText}
              onChange={e => setResumeText(e.target.value)}
              placeholder={`Paste your full resume text here.\n\nTip: Copy-paste from your Word doc or PDF. The more complete, the more accurate the score.`}
              className="w-full h-52 text-sm text-slate-700 placeholder-slate-300 bg-slate-50 border border-slate-200 rounded-2xl p-4 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all font-mono leading-relaxed"
            />
          </div>

          {/* JD Text */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                Job Description
                <span className="ml-2 text-[10px] normal-case font-normal text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                  Highly recommended
                </span>
              </label>
              <span className={`text-xs font-medium ${
                jdText.length >= 50 ? 'text-emerald-600' : 'text-slate-400'
              }`}>
                {jdText.length >= 50 ? 'JD active ✓' : 'Optional but improves score accuracy'}
              </span>
            </div>
            <textarea
              value={jdText}
              onChange={e => setJDText(e.target.value)}
              placeholder={`Paste the job description here.\n\nWithout a JD: we score against PM best practices.\nWith a JD: we score against the actual keywords, skills, and requirements of this specific role.`}
              className="w-full h-44 text-sm text-slate-700 placeholder-slate-300 bg-slate-50 border border-slate-200 rounded-2xl p-4 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
            />
          </div>

          {!canScore && (
            <p className="text-xs text-slate-400 text-center py-2">
              Paste at least 100 characters of your resume to see your score
            </p>
          )}
        </div>

        {/* RIGHT: Score */}
        <div className="p-6 flex flex-col gap-5 bg-slate-50/50">

          {!hasScored || !result ? (
            /* Placeholder */
            <div className="flex-1 flex flex-col items-center justify-center text-center gap-4 py-8">
              <div className="w-24 h-24 rounded-full border-4 border-slate-200 flex items-center justify-center">
                <span className="text-4xl opacity-30">📊</span>
              </div>
              <div>
                <p className="font-semibold text-slate-400">Your score appears here</p>
                <p className="text-sm text-slate-300 mt-1">Paste your resume to begin</p>
              </div>
              <div className="space-y-2 w-full mt-4">
                {['JD Keyword Match', 'PM Vocabulary', 'Metrics Presence', 'Action Verbs'].map(l => (
                  <div key={l} className="flex items-center gap-3">
                    <div className="flex-1 h-2 bg-slate-200 rounded-full shimmer" />
                    <span className="text-xs text-slate-300 w-8 text-right">—</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* Score Ring */}
              <ScoreRing score={result.totalScore} grade={result.grade} />

              {/* Breakdown Bars */}
              <div className="space-y-3 bg-white rounded-2xl border border-slate-200 p-4">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Score Breakdown</p>
                <BreakdownBar
                  label={result.hasJD ? 'JD Keyword Match' : 'JD Match (no JD pasted)'}
                  score={result.breakdown.jdKeywords.score}
                  maxScore={result.breakdown.jdKeywords.maxScore}
                  icon="🎯"
                  delay={0}
                />
                <BreakdownBar
                  label="PM Vocabulary"
                  score={result.breakdown.pmVocab.score}
                  maxScore={result.breakdown.pmVocab.maxScore}
                  icon="📝"
                  delay={100}
                />
                <BreakdownBar
                  label="Metrics & Impact"
                  score={result.breakdown.metrics.score}
                  maxScore={result.breakdown.metrics.maxScore}
                  icon="📈"
                  delay={200}
                />
                <BreakdownBar
                  label="Action Verbs"
                  score={result.breakdown.actionVerbs.score}
                  maxScore={result.breakdown.actionVerbs.maxScore}
                  icon="⚡"
                  delay={300}
                />
              </div>

              {/* Fix CTA */}
              {result.totalScore < 85 && (
                <button
                  onClick={handleFixThis}
                  className="w-full py-4 rounded-2xl text-sm font-bold text-white transition-all duration-200 shadow-lg btn-press relative overflow-hidden group"
                  style={{ background: `linear-gradient(135deg, #2563eb, #4f46e5)` }}
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {isLoggedIn ? '✨ Fix All of This Automatically →' : '✨ Fix This with AI — Sign in Free →'}
                  </span>
                  <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              )}

              {result.totalScore >= 85 && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center">
                  <p className="text-sm font-bold text-emerald-700">🎉 Strong match!</p>
                  <p className="text-xs text-emerald-600 mt-1">
                    Still want to fine-tune? The optimizer can sharpen your summary and bullets further.
                  </p>
                  <button onClick={handleFixThis} className="mt-3 text-xs font-semibold text-emerald-700 underline">
                    Optimize anyway →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* BOTTOM: Detailed breakdown tabs — only shown after scoring */}
      {hasScored && result && (
        <div className="border-t border-slate-100 animate-fadeInUp">

          {/* Tabs */}
          <div className="flex border-b border-slate-100 overflow-x-auto">
            {[
              { id: 'keywords' as const, label: `🎯 JD Keywords`, count: result.breakdown.jdKeywords.missing.length, warn: result.breakdown.jdKeywords.missing.length > 5 },
              { id: 'pm'       as const, label: '📝 PM Vocabulary', count: result.breakdown.pmVocab.missing.length, warn: result.breakdown.pmVocab.found.length < 8 },
              { id: 'metrics'  as const, label: '📈 Metrics',       count: result.breakdown.metrics.bulletCount - result.breakdown.metrics.bulletsWithMetrics, warn: result.breakdown.metrics.score < 10 },
              { id: 'verbs'    as const, label: '⚡ Action Verbs',  count: result.breakdown.actionVerbs.verbsFound.length, warn: result.breakdown.actionVerbs.score < 8 },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-all ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-700 bg-blue-50/50'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                {tab.label}
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  tab.warn ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="p-6 animate-fadeIn">

            {/* JD Keywords tab */}
            {activeTab === 'keywords' && (
              <div className="space-y-5">
                {!result.hasJD ? (
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-800">
                    <strong>No job description pasted.</strong> Paste the JD above to see which specific keywords
                    are missing from your resume for this role. Without a JD, we score against general PM vocabulary only.
                  </div>
                ) : (
                  <>
                    <div className="grid sm:grid-cols-2 gap-5">
                      <div>
                        <p className="text-xs font-bold text-emerald-700 uppercase tracking-widest mb-3">
                          ✓ Found in your resume ({result.breakdown.jdKeywords.matched.length})
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {result.breakdown.jdKeywords.matched.length > 0
                            ? result.breakdown.jdKeywords.matched.map(kw => <KeywordPill key={kw} word={kw} matched />)
                            : <p className="text-xs text-slate-400">None matched yet</p>}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-red-600 uppercase tracking-widest mb-3">
                          ✗ Missing from your resume ({result.breakdown.jdKeywords.missing.length})
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {result.breakdown.jdKeywords.missing.length > 0
                            ? result.breakdown.jdKeywords.missing.map(kw => <KeywordPill key={kw} word={kw} matched={false} />)
                            : <p className="text-xs text-emerald-600 font-medium">All keywords matched! 🎉</p>}
                        </div>
                      </div>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-sm text-blue-800">
                      <strong>What this means:</strong> ATS systems scan for exact keyword matches.
                      The missing keywords above appear in the JD but not in your resume.
                      The optimizer injects them naturally into your summary and bullet points.
                    </div>
                  </>
                )}
              </div>
            )}

            {/* PM Vocab tab */}
            {activeTab === 'pm' && (
              <div className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <p className="text-xs font-bold text-emerald-700 uppercase tracking-widest mb-3">
                      ✓ PM Terms Found ({result.breakdown.pmVocab.found.length})
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {result.breakdown.pmVocab.found.length > 0
                        ? result.breakdown.pmVocab.found.map(t => <KeywordPill key={t} word={t} matched />)
                        : <p className="text-xs text-slate-400">None found yet</p>}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-red-600 uppercase tracking-widest mb-3">
                      ✗ Missing PM Terms ({result.breakdown.pmVocab.missing.length})
                    </p>
                    <div className="flex flex-wrap gap-1.5 max-h-44 overflow-y-auto">
                      {result.breakdown.pmVocab.missing.slice(0, 20).map(t => (
                        <KeywordPill key={t} word={t} matched={false} />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-sm text-blue-800">
                  <strong>What this means:</strong> Recruiters and ATS systems for PM roles scan for standard PM
                  vocabulary like "roadmap", "stakeholder", "A/B test", "PRD", "OKR". Each term you're missing is
                  a missed signal to the reviewer that you speak the language of product.
                </div>
              </div>
            )}

            {/* Metrics tab */}
            {activeTab === 'metrics' && (
              <div className="space-y-4">
                <div className="grid sm:grid-cols-3 gap-4">
                  {[
                    {
                      value: result.breakdown.metrics.bulletCount,
                      label: 'Total bullet lines detected',
                      color: 'text-slate-700',
                      bg: 'bg-slate-50',
                    },
                    {
                      value: result.breakdown.metrics.bulletsWithMetrics,
                      label: 'Bullets with numbers/metrics',
                      color: 'text-emerald-700',
                      bg: 'bg-emerald-50',
                    },
                    {
                      value: result.breakdown.metrics.bulletCount - result.breakdown.metrics.bulletsWithMetrics,
                      label: 'Bullets without metrics',
                      color: 'text-red-600',
                      bg: 'bg-red-50',
                    },
                  ].map(stat => (
                    <div key={stat.label} className={`${stat.bg} rounded-2xl p-4 text-center border border-slate-200`}>
                      <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
                      <p className="text-xs text-slate-500 mt-1 leading-snug">{stat.label}</p>
                    </div>
                  ))}
                </div>

                {result.breakdown.metrics.examples.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                      Examples of good metric bullets we found:
                    </p>
                    <ul className="space-y-2">
                      {result.breakdown.metrics.examples.map((ex, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
                          <span className="text-emerald-500 font-bold mt-0.5">✓</span>
                          <span className="line-clamp-2">{ex}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-800">
                  <strong>Target:</strong> At least 40–50% of your bullets should contain a number,
                  percentage, or scale indicator. The AI optimizer adds or surfaces implied metrics from your
                  bullet context.
                </div>
              </div>
            )}

            {/* Verbs tab */}
            {activeTab === 'verbs' && (
              <div className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <p className="text-xs font-bold text-emerald-700 uppercase tracking-widest mb-3">
                      ✓ Strong verbs found ({result.breakdown.actionVerbs.verbsFound.length})
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {result.breakdown.actionVerbs.verbsFound.length > 0
                        ? result.breakdown.actionVerbs.verbsFound.map(v => <KeywordPill key={v} word={v} matched />)
                        : <p className="text-xs text-slate-400">None found</p>}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-red-600 uppercase tracking-widest mb-3">
                      Suggested verbs to add
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {result.breakdown.actionVerbs.verbsMissing.slice(0, 15).map(v => (
                        <KeywordPill key={v} word={v} matched={false} />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-sm text-blue-800">
                  <strong>Why this matters:</strong> PM resumes should start every bullet with a power verb
                  that signals ownership — "Led", "Drove", "Launched", "Owned". Weak starters like "Worked on",
                  "Helped with", or "Involved in" signal a support role, not a product owner.
                </div>
              </div>
            )}

            {/* Profile tips */}
            {result.profileTips.length > 0 && (
              <div className="mt-5 space-y-2.5">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  Tips for your profile
                </p>
                {result.profileTips.map((tip, i) => (
                  <div key={i} className="flex items-start gap-3 bg-indigo-50 border border-indigo-100 rounded-2xl px-4 py-3 text-sm text-indigo-800">
                    <span className="text-lg shrink-0 leading-none mt-0.5">💡</span>
                    <span className="leading-relaxed">{tip}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Final CTA */}
            <div className="mt-6 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-5 text-white">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-bold text-base mb-1">
                    {result.totalScore >= 80 ? 'Fine-tune your resume further' : 'Fix all gaps with one click'}
                  </p>
                  <p className="text-sm text-blue-100 leading-relaxed">
                    {result.hasJD
                      ? `The AI optimizer injects the ${result.topMissingKeywords.length} missing JD keywords, rewrites weak bullets with metrics, and tailors your summary to this exact role.`
                      : 'The AI optimizer rewrites your summary and bullets to match any PM job description — specific to your profile and the role.'}
                  </p>
                  {result.topMissingKeywords.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {result.topMissingKeywords.slice(0, 6).map(kw => (
                        <span key={kw} className="bg-white/20 text-white text-xs px-2.5 py-1 rounded-full">
                          + {kw}
                        </span>
                      ))}
                      {result.topMissingKeywords.length > 6 && (
                        <span className="bg-white/20 text-white text-xs px-2.5 py-1 rounded-full">
                          +{result.topMissingKeywords.length - 6} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <button
                  onClick={handleFixThis}
                  className="shrink-0 bg-white text-blue-700 font-bold text-sm px-5 py-3 rounded-xl hover:bg-blue-50 transition-all shadow-lg btn-press whitespace-nowrap"
                >
                  {isLoggedIn ? '✨ Fix This →' : '✨ Sign in & Fix →'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
