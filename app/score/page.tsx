'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import { LoginModal } from '@/components/LoginModal';
import { PaymentModal } from '@/components/PaymentModal';
import { PMLoadingScreen } from '@/components/PMLoadingScreen';
import { supabase } from '@/lib/supabase';
import { DEFAULT_JDS } from '@/lib/defaultJDs';
import type { ResumeAnalysisResult, BulletAnalysis } from '@/app/api/analyse/route';

// ─── Icons ─────────────────────────────────────────────────────────────────────
function CheckIcon() {
  return <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>;
}
function CrossIcon() {
  return <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12"/></svg>;
}
function SpinnerIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return <svg className={`animate-spin ${className}`} fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>;
}
function ChevronIcon({ open }: { open: boolean }) {
  return <svg className={`w-4 h-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/></svg>;
}

// ─── Score Ring ─────────────────────────────────────────────────────────────────
function ScoreRing({ score, grade }: { score: number; grade: string }) {
  const radius = 64;
  const circ = 2 * Math.PI * radius;
  const color = score >= 80 ? '#10b981' : score >= 65 ? '#3b82f6' : score >= 50 ? '#f59e0b' : score >= 35 ? '#f97316' : '#ef4444';
  const filled = (score / 100) * circ;
  return (
    <div className="flex flex-col items-center gap-4">
      <svg width="180" height="180" viewBox="0 0 180 180">
        <circle cx="90" cy="90" r={radius} fill="none" stroke="#f1f5f9" strokeWidth="12"/>
        <circle cx="90" cy="90" r={radius} fill="none" stroke={color} strokeWidth="12"
          strokeLinecap="round" strokeDasharray={circ}
          strokeDashoffset={circ - filled} transform="rotate(-90 90 90)"
          style={{ transition: 'stroke-dashoffset 1.4s cubic-bezier(0.22,1,0.36,1)' }}/>
        <text x="90" y="82" textAnchor="middle" fontSize="36" fontWeight="800" fill="#0f172a" fontFamily="system-ui">{score}</text>
        <text x="90" y="102" textAnchor="middle" fontSize="13" fill="#94a3b8" fontFamily="system-ui">out of 100</text>
      </svg>
      <span className="text-sm font-bold px-5 py-2 rounded-full text-white" style={{ backgroundColor: color }}>{grade}</span>
    </div>
  );
}

// ─── Bullet Score Badge ─────────────────────────────────────────────────────────
function BulletScoreBadge({ score }: { score: number }) {
  const color = score >= 8 ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
    : score >= 6 ? 'bg-blue-100 text-blue-700 border-blue-200'
    : score >= 4 ? 'bg-amber-100 text-amber-700 border-amber-200'
    : 'bg-red-100 text-red-700 border-red-200';
  return (
    <span className={`inline-flex items-center justify-center w-10 h-10 rounded-xl border-2 font-bold text-sm shrink-0 ${color}`}>
      {score}
    </span>
  );
}

// ─── Tag Pill ───────────────────────────────────────────────────────────────────
function TagPill({ tag }: { tag: string }) {
  const styles: Record<string, string> = {
    has_metric:      'bg-emerald-50 text-emerald-700 border-emerald-200',
    has_action_verb: 'bg-blue-50 text-blue-700 border-blue-200',
    has_ownership:   'bg-indigo-50 text-indigo-700 border-indigo-200',
    jd_aligned:      'bg-violet-50 text-violet-700 border-violet-200',
    too_vague:       'bg-amber-50 text-amber-700 border-amber-200',
    no_impact:       'bg-red-50 text-red-700 border-red-200',
  };
  const labels: Record<string, string> = {
    has_metric:      '📈 Has metric',
    has_action_verb: '⚡ Strong verb',
    has_ownership:   '🎯 Shows ownership',
    jd_aligned:      '✓ JD aligned',
    too_vague:       '⚠️ Too vague',
    no_impact:       '✗ No impact shown',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border ${styles[tag] ?? 'bg-slate-100 text-slate-600 border-slate-200'}`}>
      {labels[tag] ?? tag}
    </span>
  );
}

// ─── Bullet Card (expandable) - UPDATED FOR SECTION GROUPING ───────────────────
function BulletCard({ bullet, index }: { bullet: BulletAnalysis; index: number }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(bullet.improved);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="transition-all duration-200 animate-fadeInUp bg-white"
      style={{ animationDelay: `${index * 20}ms` }}>

      {/* Header row */}
      <button
        onClick={() => setOpen(p => !p)}
        className="w-full flex items-start gap-3 px-4 py-4 text-left hover:bg-slate-50 transition-colors">
        <BulletScoreBadge score={bullet.score} />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-slate-700 leading-relaxed mb-2">{bullet.original}</p>
          <div className="flex flex-wrap gap-1">
            {bullet.tags.map(tag => <TagPill key={tag} tag={tag} />)}
          </div>
        </div>
        <ChevronIcon open={open} />
      </button>

      {/* Expanded detail */}
      {open && (
        <div className="border-t border-slate-100 px-4 py-4 space-y-4 animate-fadeIn bg-slate-50">
          {bullet.strength && (
            <div className="flex items-start gap-2.5 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-3">
              <span className="text-emerald-500 mt-0.5 shrink-0"><CheckIcon /></span>
              <div>
                <p className="text-xs font-bold text-emerald-700 mb-0.5">What's strong</p>
                <p className="text-sm text-emerald-800">{bullet.strength}</p>
              </div>
            </div>
          )}

          <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl px-3 py-3">
            <span className="text-red-500 mt-0.5 shrink-0"><CrossIcon /></span>
            <div>
              <p className="text-xs font-bold text-red-700 mb-0.5">What's weak</p>
              <p className="text-sm text-red-800">{bullet.weakness}</p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl px-3 py-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold text-blue-700">✨ AI-improved version</p>
              <button onClick={handleCopy}
                className="text-xs px-2.5 py-1 bg-white border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors font-medium">
                {copied ? '✓ Copied!' : 'Copy'}
              </button>
            </div>
            <p className="text-sm text-blue-900 leading-relaxed font-medium">{bullet.improved}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Keyword section ────────────────────────────────────────────────────────────
function KeywordGrid({ found, missing, label }: { found: string[]; missing: string[]; label: string }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
      <h4 className="font-bold text-slate-900">{label}</h4>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-2">✓ Found ({found.length})</p>
          <div className="flex flex-wrap gap-1.5">
            {found.length > 0
              ? found.map(w => (
                  <span key={w} className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                    <CheckIcon/> {w}
                  </span>
                ))
              : <p className="text-xs text-slate-400">None matched</p>}
          </div>
        </div>
        <div>
          <p className="text-xs font-bold text-red-600 uppercase tracking-widest mb-2">✗ Missing ({missing.length})</p>
          <div className="flex flex-wrap gap-1.5">
            {missing.length > 0
              ? missing.map(w => (
                  <span key={w} className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-red-50 text-red-600 border border-red-200 font-medium">
                    <CrossIcon/> {w}
                  </span>
                ))
              : <p className="text-xs text-emerald-600 font-medium">All matched! 🎉</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ──────────────────────────────────────────────────────────────────
export default function ScorePage() {
  const router = useRouter();
  const { user, dbUser, refreshUser } = useAuth();

  const [resumeText, setResumeText] = useState('');
  const [jdMode, setJdMode]         = useState<'paste' | 'default'>('paste');
  const [jdText, setJdText]         = useState('');
  const [selectedJD, setSelectedJD] = useState(DEFAULT_JDS[0]!.id);
  const [profile, setProfile]       = useState('experienced');
  const [isAnalysing, setIsAnalysing] = useState(false);
  const [result, setResult]         = useState<(ResumeAnalysisResult & { analysesRemaining: number }) | null>(null);
  const [error, setError]           = useState<string | null>(null);
  const [showLogin, setShowLogin]   = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [pendingAnalyse, setPendingAnalyse] = useState(false);
  const resultRef                   = useRef<HTMLDivElement>(null);

  // ── Pre-fill from /optimize (user clicked "Check ATS Score" mid-way) ──────────
  useEffect(() => {
    const saved = sessionStorage.getItem('scoreState');
    if (!saved) return;
    try {
      const state = JSON.parse(saved) as {
        resumeText?: string; jdText?: string; jdMode?: string;
        selectedJD?: string; profile?: string; timestamp?: number;
      };
      if (state.timestamp && Date.now() - state.timestamp > 30 * 60 * 1000) {
        sessionStorage.removeItem('scoreState'); return;
      }
      if (state.resumeText) setResumeText(state.resumeText);
      if (state.jdText && state.jdText.trim().length > 50) {
        setJdText(state.jdText);
        setJdMode('paste');
      }
      if (state.jdMode === 'default' && state.selectedJD) {
        setJdMode('default');
        setSelectedJD(state.selectedJD);
      }
      if (state.profile) setProfile(state.profile);
      // Don't remove — login flow also uses this key after OAuth
    } catch {
      sessionStorage.removeItem('scoreState');
    }
  }, []);

  const effectiveJD = jdMode === 'default'
    ? (DEFAULT_JDS.find(j => j.id === selectedJD)?.text ?? '')
    : jdText;

  const canAnalyse = resumeText.trim().length >= 100;

  const runAnalysis = async () => {
    setError(null);
    setResult(null);
    setIsAnalysing(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('no_session');

      const res = await fetch('/api/analyse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ resumeText, jdText: effectiveJD, profile }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error === 'quota_exceeded') { setShowPayment(true); return; }
        throw new Error(data.error ?? 'Analysis failed');
      }

      setResult(data);
      await refreshUser();

      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);

    } catch (err) {
      if (err instanceof Error && err.message === 'no_session') {
        // Save state + trigger login
        sessionStorage.setItem('scoreState', JSON.stringify({ resumeText, jdText: effectiveJD, jdMode, selectedJD, profile }));
        setPendingAnalyse(true);
        setShowLogin(true);
        return;
      }
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setIsAnalysing(false);
    }
  };

  const handleAnalyse = () => {
    if (!canAnalyse) return;
    if (!user) {
      sessionStorage.setItem('scoreState', JSON.stringify({ resumeText, jdText: effectiveJD, jdMode, selectedJD, profile }));
      setPendingAnalyse(true);
      setShowLogin(true);
      return;
    }
    runAnalysis();
  };

  const handleLoginSuccess = async () => {
    setShowLogin(false);
    await refreshUser();
    if (pendingAnalyse) {
      const saved = sessionStorage.getItem('scoreState');
      if (saved) {
        try {
          const state = JSON.parse(saved);
          setResumeText(state.resumeText ?? resumeText);
          setJdText(state.jdText ?? jdText);
          setJdMode(state.jdMode ?? jdMode);
          setSelectedJD(state.selectedJD ?? selectedJD);
          setProfile(state.profile ?? profile);
          sessionStorage.removeItem('scoreState');
        } catch {}
      }
      setPendingAnalyse(false);
      setTimeout(() => runAnalysis(), 300);
    }
  };

  const handleOptimize = () => {
    sessionStorage.setItem('optimizeState', JSON.stringify({
      resumeText,
      jdText: effectiveJD,
      profile,
      timestamp: Date.now(),
    }));
    router.push('/optimize');
  };

  const now = new Date();
  const hasActivePlan = dbUser?.subscription_type === 'paid' &&
    dbUser?.subscription_expires_at && new Date(dbUser.subscription_expires_at) > now;
  const analysesUsed = (dbUser as any)?.score_analyses_used ?? 0;
  const analysesLeft = hasActivePlan ? '∞' : Math.max(0, 5 - analysesUsed);

  return (
    <>
      <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} onSuccess={handleLoginSuccess} />
      <PaymentModal isOpen={showPayment} onClose={() => setShowPayment(false)} onSuccess={() => setShowPayment(false)} />

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/30">

        {/* Nav */}
        <nav className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-40">
          <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white text-sm font-bold">PM</div>
              <span className="font-bold text-slate-900">PM Resume Optimizer</span>
            </Link>
            <div className="flex items-center gap-3">
              {user && (
                <span className="text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full font-medium">
                  {analysesLeft === '∞' ? '∞' : `${analysesLeft} free analyses left`}
                </span>
              )}
              {/* Save current inputs before navigating to /optimize */}
              <button
                onClick={() => {
                  if (resumeText.trim() || jdText.trim()) {
                    sessionStorage.setItem('optimizeState', JSON.stringify({
                      resumeText,
                      jdText: effectiveJD,
                      profile,
                      timestamp: Date.now(),
                    }));
                  }
                  window.location.href = '/optimize';
                }}
                className="text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-xl transition-colors">
                ✨ Optimize Resume →
              </button>
            </div>
          </div>
        </nav>

        <div className="max-w-5xl mx-auto px-6 py-10">

          {/* Hero */}
          <div className="text-center mb-10 animate-fadeInUp">
            <span className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 text-xs font-bold px-4 py-2 rounded-full mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"/>
              AI-Powered · Per-Bullet Analysis
            </span>
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3 tracking-tight">
              How well does your resume match<br/>
              <span className="gradient-text">this PM job description?</span>
            </h1>
            <p className="text-slate-500 max-w-xl mx-auto text-sm leading-relaxed">
              Paste your resume + any PM JD. Our AI analyses every bullet point individually —
              what's strong, what's weak, and the exact improved version.
            </p>
          </div>

          {/* Input Card */}
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden mb-6 animate-fadeInUp stagger-1">

            {/* Profile */}
            <div className="p-6 border-b border-slate-100">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Your PM Profile</label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: 'aspiring',      emoji: '🎓', label: 'Aspiring PM',     sub: 'Student / Fresher' },
                  { value: 'transitioning', emoji: '🔄', label: 'Transitioning',   sub: 'From another domain' },
                  { value: 'experienced',   emoji: '💼', label: 'Experienced PM',  sub: '1+ years as PM' },
                ].map(opt => (
                  <button key={opt.value} onClick={() => setProfile(opt.value)}
                    className={`flex flex-col items-center gap-1.5 p-4 rounded-2xl border-2 transition-all duration-200 ${
                      profile === opt.value ? 'border-blue-500 bg-blue-50 scale-[1.02] shadow-sm' : 'border-slate-200 hover:border-slate-300'
                    }`}>
                    <span className="text-2xl">{opt.emoji}</span>
                    <span className={`text-xs font-bold ${profile === opt.value ? 'text-blue-700' : 'text-slate-700'}`}>{opt.label}</span>
                    <span className="text-[11px] text-slate-400">{opt.sub}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-0 divide-y md:divide-y-0 md:divide-x divide-slate-100">
              {/* Resume */}
              <div className="p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Your Resume</label>
                  <span className={`text-xs font-semibold tabular-nums ${resumeText.length >= 100 ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {resumeText.length >= 100 ? `${resumeText.length} chars ✓` : `${resumeText.length} / 100 min`}
                  </span>
                </div>
                <textarea
                  value={resumeText}
                  onChange={e => setResumeText(e.target.value)}
                  placeholder={`Paste your full resume text here.\n\nInclude everything: summary, work experience bullets, education, projects, skills.\n\nThe more complete, the more accurate the analysis.`}
                  className="w-full h-64 text-sm text-slate-700 placeholder-slate-300 bg-slate-50 border border-slate-200 rounded-2xl p-4 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all font-mono leading-relaxed"
                />
                <p className="text-xs text-slate-400">
                  Tip: Copy-paste from your Word doc or Google Doc for best results.
                </p>
              </div>

              {/* JD */}
              <div className="p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Job Description</label>
                  <div className="flex bg-slate-100 rounded-xl p-0.5 text-xs">
                    {[{ id: 'paste', label: 'Paste JD' }, { id: 'default', label: 'Use Template' }].map(m => (
                      <button key={m.id} onClick={() => setJdMode(m.id as 'paste' | 'default')}
                        className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${jdMode === m.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                {jdMode === 'paste' ? (
                  <textarea
                    value={jdText}
                    onChange={e => setJdText(e.target.value)}
                    placeholder={`Paste the full job description here.\n\nThis is how we know which keywords, skills, and requirements to check your resume against.\n\nThe more detailed the JD, the more accurate the analysis.`}
                    className="w-full h-64 text-sm text-slate-700 placeholder-slate-300 bg-slate-50 border border-slate-200 rounded-2xl p-4 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
                  />
                ) : (
                  <div className="space-y-3">
                    <select value={selectedJD} onChange={e => setSelectedJD(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all cursor-pointer">
                      {DEFAULT_JDS.map(jd => (
                        <option key={jd.id} value={jd.id}>{jd.label}</option>
                      ))}
                    </select>
                    <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3 text-xs text-blue-700">
                      <strong>Using:</strong> {DEFAULT_JDS.find(j => j.id === selectedJD)?.label} template JD
                    </div>
                    <div className="h-48 overflow-auto bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs text-slate-600 leading-relaxed">
                      {DEFAULT_JDS.find(j => j.id === selectedJD)?.text.substring(0, 600)}...
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* CTA */}
            <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-slate-500">
                {user
                  ? <span>{analysesLeft === '∞' ? 'Unlimited analyses (premium)' : `${analysesLeft} of 5 free analyses remaining`}</span>
                  : <span>5 free AI analyses · No credit card needed · Just sign in with Google</span>}
              </div>
              <button onClick={handleAnalyse} disabled={!canAnalyse || isAnalysing}
                className={`px-8 py-3.5 rounded-2xl text-sm font-bold transition-all duration-200 flex items-center gap-2.5 btn-press ${
                  canAnalyse && !isAnalysing
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/25 glow-blue'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}>
                {isAnalysing ? <><SpinnerIcon className="w-4 h-4 text-white"/><span>Analysing...</span></>
                  : !user ? '🔍 Analyse My Resume — Sign in Free'
                  : '🔍 Analyse My Resume'}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6 text-sm text-red-700 animate-fadeIn">
              <strong>Error:</strong> {error}
            </div>
          )}

          {/* Loading */}
          {isAnalysing && (
            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl p-8 mb-6 animate-fadeIn">
              <PMLoadingScreen mode="analyse" />
            </div>
          )}

          {/* Results */}
          {result && !isAnalysing && (
            <div ref={resultRef} className="space-y-6 scroll-mt-6">

              {/* Score header */}
              <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl overflow-hidden animate-scaleIn">
                <div className="p-6 sm:p-8">
                  <div className="flex flex-col sm:flex-row items-center gap-8">
                    <ScoreRing score={result.overallScore} grade={result.gradeLabel} />
                    <div className="flex-1 space-y-4">
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">AI Verdict</p>
                        <p className="text-slate-700 leading-relaxed">{result.executiveSummary}</p>
                      </div>
                      <div className="bg-indigo-50 border border-indigo-200 rounded-2xl px-4 py-3 text-sm text-indigo-800">
                        <strong>Profile-specific:</strong> {result.profileSpecificFeedback}
                      </div>
                      <div className="grid grid-cols-3 gap-3 text-center">
                        {[
                          { label: 'Bullets Analysed', value: result.bulletAnalysis?.length ?? 0 },
                          { label: 'Keywords Missing', value: result.keywordsMissing?.length ?? 0 },
                          { label: 'Metrics Score', value: `${result.metricsScore}%` },
                        ].map(stat => (
                          <div key={stat.label} className="bg-slate-50 rounded-xl p-3">
                            <p className="text-xl font-bold text-slate-900">{stat.value}</p>
                            <p className="text-xs text-slate-400 mt-0.5">{stat.label}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Top improvements */}
                {result.topImprovements?.length > 0 && (
                  <div className="border-t border-slate-100 px-6 sm:px-8 py-5 bg-amber-50/50">
                    <p className="text-xs font-bold text-amber-700 uppercase tracking-widest mb-3">🎯 Top 3 improvements to make right now</p>
                    <ol className="space-y-2">
                      {result.topImprovements.map((tip, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm text-amber-900 animate-fadeInUp" style={{ animationDelay: `${i * 60}ms` }}>
                          <span className="w-5 h-5 rounded-full bg-amber-200 text-amber-800 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                          {tip}
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>

              {/* Summary analysis */}
              {result.summaryAnalysis?.original && (
                <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden animate-fadeInUp">
                  <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="font-bold text-slate-900">📝 Summary Analysis</h3>
                    <BulletScoreBadge score={result.summaryAnalysis.score} />
                  </div>
                  <div className="p-6 space-y-4">
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Your current summary</p>
                      <p className="text-sm text-slate-600 bg-slate-50 border border-slate-200 rounded-xl p-3 leading-relaxed">{result.summaryAnalysis.original}</p>
                    </div>
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-800">
                      <strong>Feedback:</strong> {result.summaryAnalysis.feedback}
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-bold text-blue-700 uppercase tracking-widest">✨ AI-improved summary</p>
                        <button
                          onClick={async () => {
                            await navigator.clipboard.writeText(result.summaryAnalysis.improved);
                          }}
                          className="text-xs px-2.5 py-1 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors font-semibold">
                          Copy
                        </button>
                      </div>
                      <p className="text-sm text-blue-900 bg-blue-50 border border-blue-200 rounded-xl p-3 leading-relaxed font-medium">{result.summaryAnalysis.improved}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Bullet analysis - SECTION GROUPED */}
              {result.bulletAnalysis?.length > 0 && (
                <div className="animate-fadeInUp stagger-2">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-slate-900 text-lg">⚡ Bullet-by-Bullet Analysis ({result.bulletAnalysis.length})</h3>
                    <p className="text-xs text-slate-400">Grouped by section · Click any bullet to see full feedback</p>
                  </div>
                  
                  {/* Group bullets by section */}
                  {(() => {
                    // Group bullets by section name
                    const groupedBullets = result.bulletAnalysis.reduce((acc, bullet) => {
                      if (!acc[bullet.section]) {
                        acc[bullet.section] = [];
                      }
                      acc[bullet.section]!.push(bullet);
                      return acc;
                    }, {} as Record<string, BulletAnalysis[]>);

                    // Get section names and their stats
                    const sections = Object.keys(groupedBullets).map(sectionName => {
                      const sectionBullets = groupedBullets[sectionName]!;
                      const avgScore = Math.round(
                        sectionBullets.reduce((sum, b) => sum + b.score, 0) / sectionBullets.length
                      );
                      return { name: sectionName, bullets: sectionBullets, avgScore };
                    });

                    return (
                      <div className="space-y-6">
                        {sections.map((section, sectionIdx) => (
                          <div key={section.name} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            {/* Section header */}
                            <div className="px-5 py-3 bg-slate-50 border-b border-slate-200">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <h4 className="font-bold text-slate-900">{section.name}</h4>
                                  <span className="text-xs text-slate-500">({section.bullets.length} bullets)</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-semibold text-slate-500">Avg Score:</span>
                                  <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg font-bold text-sm ${
                                    section.avgScore >= 8 ? 'bg-emerald-100 text-emerald-700'
                                    : section.avgScore >= 6 ? 'bg-blue-100 text-blue-700'
                                    : section.avgScore >= 4 ? 'bg-amber-100 text-amber-700'
                                    : 'bg-red-100 text-red-700'
                                  }`}>
                                    {section.avgScore}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Section bullets */}
                            <div className="divide-y divide-slate-100">
                              {section.bullets.map((bullet, bulletIdx) => (
                                <BulletCard 
                                  key={`${sectionIdx}-${bulletIdx}`}
                                  bullet={bullet} 
                                  index={sectionIdx * 10 + bulletIdx}
                                />
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Keyword gaps */}
              {(result.keywordsFound?.length > 0 || result.keywordsMissing?.length > 0) && (
                <div className="animate-fadeInUp stagger-3">
                  <h3 className="font-bold text-slate-900 text-lg mb-4">🎯 JD Keyword Analysis</h3>
                  <KeywordGrid
                    found={result.keywordsFound ?? []}
                    missing={result.keywordsMissing ?? []}
                    label="Keywords from Job Description"
                  />
                </div>
              )}

              {/* PM vocab */}
              {(result.pmVocabFound?.length > 0 || result.pmVocabMissing?.length > 0) && (
                <div className="animate-fadeInUp stagger-4">
                  <h3 className="font-bold text-slate-900 text-lg mb-4">📝 PM Vocabulary</h3>
                  <KeywordGrid
                    found={result.pmVocabFound ?? []}
                    missing={result.pmVocabMissing ?? []}
                    label="PM-specific terms and vocabulary"
                  />
                </div>
              )}

              {/* CTA to optimize */}
              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2rem] p-8 text-white animate-fadeInUp stagger-5">
                <div className="max-w-2xl">
                  <p className="text-2xl font-bold mb-3">
                    {result.overallScore >= 80 ? 'Strong score — let\'s make it perfect.' : `${100 - result.overallScore} points left on the table.`}
                  </p>
                  <p className="text-blue-100 leading-relaxed mb-6">
                    The AI optimizer rewrites your summary and every bullet point using the missing JD keywords,
                    adds implied metrics, strengthens verbs — and gives you a downloadable PDF ready to send.
                    Your resume text and this JD are already loaded.
                  </p>
                  {result.keywordsMissing?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-6">
                      <span className="text-xs text-blue-200 font-medium self-center">Will inject:</span>
                      {result.keywordsMissing.slice(0, 8).map(kw => (
                        <span key={kw} className="bg-white/20 text-white text-xs px-3 py-1.5 rounded-full font-medium">+ {kw}</span>
                      ))}
                    </div>
                  )}
                  <button onClick={handleOptimize}
                    className="bg-white text-blue-700 font-bold px-8 py-4 rounded-2xl hover:bg-blue-50 transition-all shadow-xl shadow-blue-900/20 btn-press text-sm flex items-center gap-2 w-fit">
                    ✨ Optimize My Resume for This Role →
                  </button>
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </>
  );
}
