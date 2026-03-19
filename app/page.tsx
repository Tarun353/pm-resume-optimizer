'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import { useState } from 'react';
import { LoginModal } from '@/components/LoginModal';

export default function LandingPage() {
  const { user } = useAuth();
  const [showLogin, setShowLogin] = useState(false);

  return (
    <>
      <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} onSuccess={() => setShowLogin(false)} />

      <div className="min-h-screen bg-[#070d1a] text-white overflow-hidden relative">

        {/* Background effects */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(99,102,241,0.12) 1px, transparent 0)',
            backgroundSize: '36px 36px',
          }}/>
          <div className="absolute top-[-15%] left-[15%] w-[700px] h-[700px] rounded-full opacity-25 blur-[120px]"
            style={{ background: 'radial-gradient(circle, #4f46e5, transparent 70%)' }}/>
          <div className="absolute bottom-[-5%] right-[5%] w-[600px] h-[600px] rounded-full opacity-20 blur-[100px]"
            style={{ background: 'radial-gradient(circle, #1d4ed8, transparent 70%)' }}/>
          <div className="absolute top-[45%] right-[35%] w-[400px] h-[400px] rounded-full opacity-12 blur-[80px]"
            style={{ background: 'radial-gradient(circle, #7c3aed, transparent 70%)' }}/>
        </div>

        {/* Nav */}
        <nav className="relative z-20 border-b border-white/5">
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-black shadow-lg shadow-blue-500/30">PM</div>
              <span className="font-bold text-white/90 text-sm">PM Resume Optimizer</span>
            </div>
            <div className="flex items-center gap-3">
              {user ? (
                <>
                  <Link href="/score" className="text-sm text-white/50 hover:text-white transition-colors hidden sm:block">Check Score</Link>
                  <Link href="/optimize" className="text-sm font-semibold bg-white/10 hover:bg-white/15 border border-white/10 px-4 py-2 rounded-xl transition-all">Optimize →</Link>
                </>
              ) : (
                <button onClick={() => setShowLogin(true)} className="text-sm text-white/50 hover:text-white transition-colors">Sign in</button>
              )}
            </div>
          </div>
        </nav>

        {/* Hero */}
        <main className="relative z-10 max-w-6xl mx-auto px-6 pt-16 sm:pt-24 pb-20">

          <div className="flex justify-center mb-7 animate-fadeInUp">
            <span className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-400/20 text-indigo-300 text-xs font-bold px-4 py-2 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"/>
              Built exclusively for Product Managers · Free to try
            </span>
          </div>

          <div className="text-center mb-5 animate-fadeInUp stagger-1">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-[1.06] tracking-tight mb-5">
              Land more<br/>
              <span style={{
                background: 'linear-gradient(135deg, #60a5fa 0%, #818cf8 45%, #a78bfa 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}>PM interviews.</span>
            </h1>
            <p className="text-white/45 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed">
              The only resume tool built for Product Managers.
              Get your real ATS match score. Optimize for any JD. Download a clean PDF in 60 seconds.
            </p>
          </div>

          {/* Profile chips */}
          <div className="flex flex-wrap justify-center gap-3 mb-14 animate-fadeInUp stagger-2">
            {[
              { emoji: '🎓', label: 'Aspiring PMs', sub: 'Breaking into PM' },
              { emoji: '💼', label: 'Experienced PMs', sub: 'Switching companies' },
              { emoji: '🔄', label: 'Transitioning PMs', sub: 'From another domain' },
            ].map(p => (
              <div key={p.label} className="flex items-center gap-2.5 bg-white/5 border border-white/8 px-4 py-2.5 rounded-full">
                <span className="text-base">{p.emoji}</span>
                <div>
                  <p className="text-xs font-bold text-white/75 leading-tight">{p.label}</p>
                  <p className="text-[10px] text-white/35 leading-tight">{p.sub}</p>
                </div>
              </div>
            ))}
          </div>

          {/* ── Two CTA Cards ── */}
          <div className="grid md:grid-cols-2 gap-5 max-w-4xl mx-auto animate-fadeInUp stagger-3">

            {/* Card 1: Check Score */}
            <Link href="/score"
              className="group relative overflow-hidden rounded-[2rem] border border-white/8 bg-white/4 hover:bg-white/7 p-7 sm:p-8 transition-all duration-300 hover:border-blue-400/30 hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-1.5 block">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 via-transparent to-transparent group-hover:from-blue-500/8 transition-all duration-500 rounded-[2rem]"/>
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300">
                <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"/>
              </div>

              <div className="relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/30 to-blue-600/20 border border-blue-400/20 flex items-center justify-center text-2xl mb-5 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                  🎯
                </div>

                <div className="inline-flex items-center gap-1.5 bg-blue-500/15 border border-blue-400/20 text-blue-300 text-[10px] font-black px-3 py-1 rounded-full mb-3 uppercase tracking-wide">
                  Free · No credit card
                </div>

                <h2 className="text-xl sm:text-2xl font-black text-white mb-3 leading-snug">
                  Check PM Resume<br/>ATS Score
                </h2>

                <p className="text-white/45 text-sm leading-relaxed mb-5">
                  Paste your resume + any PM JD. AI scores every bullet individually —
                  what's weak, what to fix, and the exact improved version to copy.
                </p>

                <ul className="space-y-2 mb-7">
                  {[
                    'Per-bullet AI feedback + improved version',
                    'Real JD keyword match (not generic)',
                    'Metrics & action verb analysis',
                    'Career stage-specific feedback',
                  ].map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm text-white/50">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400/70 shrink-0 mt-1.5"/>
                      {f}
                    </li>
                  ))}
                </ul>

                <div className="flex items-center justify-between pt-3 border-t border-white/5">
                  <span className="text-xs text-white/25">5 free analyses</span>
                  <span className="flex items-center gap-2 text-blue-300 font-bold text-sm group-hover:gap-3 transition-all">
                    Check My Score <span>→</span>
                  </span>
                </div>
              </div>
            </Link>

            {/* Card 2: Optimize */}
            <Link href="/optimize"
              className="group relative overflow-hidden rounded-[2rem] border border-indigo-500/20 bg-gradient-to-br from-indigo-600/15 to-violet-600/8 hover:from-indigo-600/25 hover:to-violet-600/15 p-7 sm:p-8 transition-all duration-300 hover:border-indigo-400/40 hover:shadow-2xl hover:shadow-indigo-500/15 hover:-translate-y-1.5 block">
              <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/15 rounded-full blur-3xl group-hover:bg-indigo-500/25 transition-all duration-500"/>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-violet-500/10 rounded-full blur-2xl"/>

              <div className="relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500/30 to-violet-600/20 border border-indigo-400/25 flex items-center justify-center text-2xl mb-5 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300">
                  ✨
                </div>

                <div className="inline-flex items-center gap-1.5 bg-indigo-500/15 border border-indigo-400/20 text-indigo-300 text-[10px] font-black px-3 py-1 rounded-full mb-3 uppercase tracking-wide">
                  AI-Powered · 60 seconds
                </div>

                <h2 className="text-xl sm:text-2xl font-black text-white mb-3 leading-snug">
                  Optimize PM Resume<br/>for Any JD
                </h2>

                <p className="text-white/45 text-sm leading-relaxed mb-5">
                  AI rewrites your summary and every bullet with the right keywords, metrics,
                  and PM language for this specific role. Edit, then download as PDF.
                </p>

                <ul className="space-y-2 mb-7">
                  {[
                    'Full summary rewrite tailored to the JD',
                    'Every bullet rewritten with keywords injected',
                    'Cover letter generated in one click',
                    'Edit sections, reorder, download PDF',
                  ].map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm text-white/50">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400/70 shrink-0 mt-1.5"/>
                      {f}
                    </li>
                  ))}
                </ul>

                <div className="flex items-center justify-between pt-3 border-t border-white/5">
                  <span className="text-xs text-white/25">5 free optimizations</span>
                  <span className="flex items-center gap-2 text-indigo-300 font-bold text-sm group-hover:gap-3 transition-all">
                    Optimize Now <span>→</span>
                  </span>
                </div>
              </div>
            </Link>
          </div>

          {/* Trust strip */}
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-2 mt-12 animate-fadeInUp stagger-4">
            {['✓ No credit card needed', '✓ Resume never stored', '✓ 60-second results', '✓ Covers Indian PM market', '✓ Cover letter included'].map(t => (
              <span key={t} className="text-xs text-white/25">{t}</span>
            ))}
          </div>
        </main>

        {/* How it works */}
        <section className="relative z-10 border-t border-white/5">
          <div className="max-w-6xl mx-auto px-6 py-16">
            <h2 className="text-2xl font-black text-white text-center mb-10">How it works</h2>
            <div className="grid md:grid-cols-2 gap-10 max-w-4xl mx-auto">
              {[
                {
                  color: 'blue',
                  title: '🎯 Check ATS Score',
                  steps: [
                    ['Paste resume text', 'Copy from Word or Google Doc'],
                    ['Paste JD or pick a template', 'Growth PM, B2B, Fintech, FAANG & more'],
                    ['Select your career stage', 'Aspiring / Transitioning / Experienced'],
                    ['Sign in → get your score', 'AI scores every bullet with feedback'],
                    ['Click Optimize to fix gaps', 'Resume + JD carry over automatically'],
                  ],
                },
                {
                  color: 'indigo',
                  title: '✨ Optimize Resume',
                  steps: [
                    ['Paste resume + job description', 'Or auto-filled from score checker'],
                    ['AI rewrites in 60 seconds', 'Summary + bullets get keyword-injected'],
                    ['Edit in live preview', 'Change bullets, reorder sections'],
                    ['Generate a cover letter', 'One click — same JD, same profile'],
                    ['Download clean PDF', 'ATS-friendly, ready to send'],
                  ],
                },
              ].map(col => (
                <div key={col.title}>
                  <h3 className="font-bold text-white/70 mb-5 text-sm">{col.title}</h3>
                  <div className="space-y-4">
                    {(col.steps as [string, string][]).map(([title, sub], i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${col.color === 'blue' ? 'bg-blue-500/20 text-blue-300' : 'bg-indigo-500/20 text-indigo-300'}`}>{i + 1}</div>
                        <div>
                          <p className="text-sm font-semibold text-white/65">{title}</p>
                          <p className="text-xs text-white/30 mt-0.5">{sub}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="relative z-10 border-t border-white/5 px-6 py-7">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/20">
            <span>© {new Date().getFullYear()} PM Resume Optimizer</span>
            <div className="flex gap-5">
              {[['Privacy', '/privacy'], ['Terms', '/terms'], ['Check Score', '/score'], ['Optimize', '/optimize']].map(([l, h]) => (
                <Link key={l} href={h} className="hover:text-white/50 transition-colors">{l}</Link>
              ))}
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
