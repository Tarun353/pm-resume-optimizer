'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import { useState, useEffect, useRef } from 'react';
import { LoginModal } from '@/components/LoginModal';
import { PaymentModal } from '@/components/PaymentModal';

// ── Animated counter hook ────────────────────────────────────────────────────
function useCountUp(target: number, duration = 1200, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime: number | null = null;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, start]);
  return count;
}

// ── useInView hook ───────────────────────────────────────────────────────────
function useInView(threshold = 0.2) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry?.isIntersecting) { setInView(true); observer.disconnect(); } },
      { threshold }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold]);
  return { ref, inView };
}

// ── Pricing plans ────────────────────────────────────────────────────────────
const PLANS = [
  {
    key: '1day',
    name: '1 Day Pass',
    price: 19,
    duration: '24 hours',
    emoji: '⚡',
    color: 'from-cyan-500 to-blue-500',
    glow: 'rgba(6,182,212,0.35)',
    border: 'border-cyan-500/30',
    popular: false,
    badge: null,
    features: [
      'Unlimited resume optimizations',
      'Unlimited AI analyses',
      'Unlimited PDF downloads',
      'Cover letter generation',
      'Priority AI processing',
    ],
    cta: 'Get Day Pass',
  },
  {
    key: '10days',
    name: '10 Days Pass',
    price: 49,
    duration: '10 days',
    emoji: '🚀',
    color: 'from-violet-500 to-indigo-500',
    glow: 'rgba(139,92,246,0.45)',
    border: 'border-violet-500/40',
    popular: true,
    badge: 'Most Popular',
    features: [
      'Everything in 1 Day Pass',
      'Full 10-day unlimited access',
      'Best value for job seekers',
      'Multiple role applications',
      'Tweak & re-optimize freely',
    ],
    cta: 'Get Best Value',
  },
  {
    key: '1month',
    name: '1 Month Pass',
    price: 139,
    duration: '30 days',
    emoji: '👑',
    color: 'from-amber-400 to-orange-500',
    glow: 'rgba(251,191,36,0.35)',
    border: 'border-amber-500/30',
    popular: false,
    badge: 'Maximum Access',
    features: [
      'Everything in 10 Days Pass',
      'Full 30-day unlimited access',
      'Optimize for every company',
      'Build a perfect resume library',
      'Interview prep season coverage',
    ],
    cta: 'Get Month Pass',
  },
];

// ── Particle component ───────────────────────────────────────────────────────
function FloatingOrb({ style }: { style: React.CSSProperties }) {
  return (
    <div
      className="absolute rounded-full pointer-events-none"
      style={{
        ...style,
        filter: 'blur(60px)',
        animation: `orbFloat ${3 + Math.random() * 3}s ease-in-out infinite alternate`,
      }}
    />
  );
}

export default function LandingPage() {
  const { user, dbUser } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const pricingRef = useInView(0.1);
  const statsRef = useInView(0.2);

  const stat1 = useCountUp(2400, 1500, statsRef.inView);
  const stat2 = useCountUp(94, 1200, statsRef.inView);
  const stat3 = useCountUp(60, 1000, statsRef.inView);

  const now = new Date();
  const hasActivePlan =
    dbUser?.subscription_type === 'paid' &&
    dbUser?.subscription_expires_at &&
    new Date(dbUser.subscription_expires_at) > now;

  const handlePlanClick = (planKey: string) => {
    setSelectedPlan(planKey);
    if (!user) {
      setShowLogin(true);
    } else {
      setShowPayment(true);
    }
  };

  const scrollToPricing = () => {
    document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

        @keyframes orbFloat {
          from { transform: translateY(0px) scale(1); opacity: 0.6; }
          to   { transform: translateY(-30px) scale(1.1); opacity: 0.9; }
        }
        @keyframes heroFadeUp {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmerSlide {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes cardReveal {
          from { opacity: 0; transform: translateY(40px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes glowPulse {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50%       { opacity: 0.9; transform: scale(1.08); }
        }
        @keyframes badgeBounce {
          0%, 100% { transform: translateY(0) rotate(-2deg); }
          50%       { transform: translateY(-4px) rotate(2deg); }
        }
        @keyframes statsCount {
          from { opacity: 0; transform: scale(0.8); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes borderGlow {
          0%, 100% { border-color: rgba(139,92,246,0.3); }
          50%       { border-color: rgba(139,92,246,0.7); }
        }
        @keyframes tick {
          0%   { transform: scale(0) rotate(-45deg); opacity: 0; }
          60%  { transform: scale(1.2) rotate(5deg); }
          100% { transform: scale(1) rotate(0); opacity: 1; }
        }

        .hero-text { font-family: 'Syne', sans-serif; }
        .body-text  { font-family: 'DM Sans', sans-serif; }

        .shimmer-text {
          background: linear-gradient(90deg, #4f46e5, #6366f1, #a855f7, #4f46e5);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmerSlide 4s linear infinite;
        }

        .plan-card {
          transition: transform 0.35s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.35s ease;
        }
        .plan-card:hover {
          transform: translateY(-12px) scale(1.02);
        }
        .plan-card.popular-card {
          transform: scale(1.04);
        }
        .plan-card.popular-card:hover {
          transform: translateY(-14px) scale(1.06);
        }
        .feature-tick {
          animation: tick 0.4s cubic-bezier(0.34,1.56,0.64,1) both;
        }
        .card-revealed { animation: cardReveal 0.7s cubic-bezier(0.22,1,0.36,1) both; }
      `}</style>

      <LoginModal
        isOpen={showLogin}
        onClose={() => setShowLogin(false)}
        onSuccess={() => { setShowLogin(false); setShowPayment(true); }}
      />
      <PaymentModal
        isOpen={showPayment}
        onClose={() => setShowPayment(false)}
        onSuccess={() => setShowPayment(false)}
      />

      <div className="min-h-screen bg-white text-slate-900 overflow-hidden relative body-text">

        {/* ── Global background ────────────────────────────────────────── */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(99,102,241,0.06) 1px, transparent 0)',
            backgroundSize: '36px 36px',
          }}/>
          <FloatingOrb style={{ top: '-10%', left: '10%', width: 600, height: 600, background: 'radial-gradient(circle, rgba(99,102,241,0.16), transparent 70%)' }} />
          <FloatingOrb style={{ bottom: '5%', right: '5%', width: 500, height: 500, background: 'radial-gradient(circle, rgba(59,130,246,0.14), transparent 70%)' }} />
          <FloatingOrb style={{ top: '40%', right: '30%', width: 350, height: 350, background: 'radial-gradient(circle, rgba(168,85,247,0.14), transparent 70%)', opacity: 0.15 }} />
        </div>

        {/* ── Nav ──────────────────────────────────────────────────────── */}
        <nav className="relative z-20 border-b border-slate-200/80 bg-white/95 backdrop-blur">
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <svg width="36" height="36" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <rect width="100" height="100" rx="22" fill="#2563eb"/>
                <rect x="24" y="18" width="45" height="56" rx="4" fill="white"/>
                <polygon points="56,18 69,18 69,31" fill="#93c5fd"/>
                <polygon points="56,18 56,31 69,31" fill="#dbeafe"/>
                <rect x="29" y="36" width="32" height="4" rx="2" fill="#2563eb" opacity="0.22"/>
                <rect x="29" y="44" width="24" height="4" rx="2" fill="#2563eb" opacity="0.16"/>
                <rect x="29" y="54" width="32" height="3" rx="1.5" fill="#2563eb" opacity="0.16"/>
                <rect x="29" y="61" width="26" height="3" rx="1.5" fill="#2563eb" opacity="0.16"/>
                <rect x="29" y="68" width="30" height="3" rx="1.5" fill="#2563eb" opacity="0.16"/>
                <circle cx="70" cy="72" r="16" fill="#fbbf24"/>
                <text x="70" y="79" textAnchor="middle" fontSize="17" fontWeight="700" fontFamily="sans-serif" fill="#1e3a8a">✦</text>
              </svg>
              <span className="font-bold text-slate-900 text-sm hero-text">PM Resume Optimizer</span>
            </div>

            <div className="flex items-center gap-3">
              {user ? (
                <>
                  {/* Pricing shortcut */}
                  {!hasActivePlan && (
                    <button
                      onClick={scrollToPricing}
                      className="text-slate-500 hover:text-slate-900 text-sm transition-colors hidden sm:block"
                    >
                      Pricing
                    </button>
                  )}
                  <Link href="/score" className="text-sm text-slate-500 hover:text-slate-900 transition-colors hidden sm:block">
                    Check Score
                  </Link>
                  {hasActivePlan ? (
                    <Link href="/optimize" className="text-sm font-semibold bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 px-4 py-2 rounded-xl transition-all hover:bg-emerald-500/30">
                      ✨ Premium · Optimize →
                    </Link>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={scrollToPricing}
                        className="text-sm font-bold px-4 py-2 rounded-xl text-white border border-violet-400/40 bg-violet-500/15 hover:bg-violet-500/25 transition-all"
                      >
                        ✨ Upgrade
                      </button>
                      <Link href="/optimize" className="text-sm font-semibold bg-slate-100 hover:bg-slate-200 border border-slate-200 px-4 py-2 rounded-xl transition-all text-slate-800">
                        Optimize →
                      </Link>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <button
                    onClick={scrollToPricing}
                    className="text-sm text-slate-500 hover:text-slate-900 transition-colors hidden sm:block"
                  >
                    Pricing
                  </button>
                  <button
                    onClick={() => setShowLogin(true)}
                    className="text-sm text-slate-500 hover:text-slate-900 transition-colors"
                  >
                    Sign in
                  </button>
                </>
              )}
            </div>
          </div>
        </nav>

        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <main className="relative z-10 max-w-6xl mx-auto px-6 pt-16 sm:pt-24 pb-20">

          <div className="flex justify-center mb-7" style={{ animation: 'heroFadeUp 0.6s ease both' }}>
            <span className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-400/20 text-indigo-300 text-xs font-bold px-4 py-2 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"/>
              Built exclusively for Product Managers · Free to try
            </span>
          </div>

          <div className="text-center mb-5" style={{ animation: 'heroFadeUp 0.6s 0.1s ease both' }}>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-[1.06] tracking-tight mb-5 hero-text">
              Land more<br/>
              <span className="shimmer-text">PM interviews.</span>
            </h1>
            <p className="text-slate-600 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed body-text">
              The only resume tool built for Product Managers.
              Get your real ATS match score. Optimize for any JD. Download a clean PDF in 60 seconds.
            </p>
          </div>

          {/* Profile chips */}
          <div className="flex flex-wrap justify-center gap-3 mb-10" style={{ animation: 'heroFadeUp 0.6s 0.2s ease both' }}>
            {[
              { emoji: '🎓', label: 'Aspiring PMs', sub: 'Breaking into PM' },
              { emoji: '💼', label: 'Experienced PMs', sub: 'Switching companies' },
              { emoji: '🔄', label: 'Transitioning PMs', sub: 'From another domain' },
            ].map(p => (
              <div key={p.label} className="flex items-center gap-2.5 bg-white/90 border border-slate-200 px-4 py-2.5 rounded-full shadow-sm">
                <span className="text-base">{p.emoji}</span>
                <div>
                  <p className="text-xs font-bold text-slate-700 leading-tight hero-text">{p.label}</p>
                  <p className="text-[10px] text-slate-500 leading-tight">{p.sub}</p>
                </div>
              </div>
            ))}
          </div>

          {/* CTA cards */}
          <div className="grid md:grid-cols-2 gap-5 max-w-4xl mx-auto" style={{ animation: 'heroFadeUp 0.6s 0.3s ease both' }}>

            {/* Check Score */}
            <Link href="/score"
              className="group relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white hover:bg-slate-50 p-7 sm:p-8 transition-all duration-300 hover:border-blue-300 hover:shadow-xl hover:-translate-y-1.5 block">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 via-transparent to-transparent group-hover:from-blue-500/8 transition-all duration-500 rounded-[2rem]"/>
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/30 to-blue-600/20 border border-blue-400/20 flex items-center justify-center text-2xl mb-5 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">🎯</div>
                <div className="inline-flex items-center gap-1.5 bg-blue-500/15 border border-blue-400/20 text-blue-300 text-[10px] font-black px-3 py-1 rounded-full mb-3 uppercase tracking-wide">Free · No credit card</div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 mb-3 leading-snug hero-text">Check PM Resume<br/>ATS Score</h2>
                <p className="text-slate-600 text-sm leading-relaxed mb-5">AI scores every bullet individually — what's weak, what to fix, and the exact improved version to copy.</p>
                <ul className="space-y-2 mb-7">
                  {['Per-bullet AI feedback + improved version', 'Real JD keyword match (not generic)', 'Career stage-specific feedback'].map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm text-slate-600">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400/70 shrink-0 mt-1.5"/>
                      {f}
                    </li>
                  ))}
                </ul>
                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <span className="text-xs text-slate-500">5 free analyses</span>
                  <span className="flex items-center gap-2 text-blue-300 font-bold text-sm group-hover:gap-3 transition-all hero-text">Check My Score <span>→</span></span>
                </div>
              </div>
            </Link>

            {/* Optimize */}
            <Link href="/optimize"
              className="group relative overflow-hidden rounded-[2rem] border border-indigo-200 bg-gradient-to-br from-indigo-50 to-violet-50 hover:from-indigo-100 hover:to-violet-100 p-7 sm:p-8 transition-all duration-300 hover:border-indigo-300 hover:shadow-xl hover:-translate-y-1.5 block">
              <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/15 rounded-full blur-3xl group-hover:bg-indigo-500/25 transition-all duration-500"/>
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500/30 to-violet-600/20 border border-indigo-400/25 flex items-center justify-center text-2xl mb-5 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300">✨</div>
                <div className="inline-flex items-center gap-1.5 bg-indigo-500/15 border border-indigo-400/20 text-indigo-300 text-[10px] font-black px-3 py-1 rounded-full mb-3 uppercase tracking-wide">AI-Powered · 60 seconds</div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 mb-3 leading-snug hero-text">Optimize PM Resume<br/>for Any JD</h2>
                <p className="text-slate-600 text-sm leading-relaxed mb-5">AI rewrites your summary and every bullet with the right keywords for this specific role.</p>
                <ul className="space-y-2 mb-7">
                  {['Full summary rewrite tailored to the JD', 'Every bullet rewritten with keywords injected', 'Cover letter generated in one click'].map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm text-slate-600">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400/70 shrink-0 mt-1.5"/>
                      {f}
                    </li>
                  ))}
                </ul>
                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <span className="text-xs text-slate-500">5 free optimizations</span>
                  <span className="flex items-center gap-2 text-indigo-300 font-bold text-sm group-hover:gap-3 transition-all hero-text">Optimize Now <span>→</span></span>
                </div>
              </div>
            </Link>
          </div>

          {/* Trust strip */}
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-2 mt-10" style={{ animation: 'heroFadeUp 0.6s 0.4s ease both' }}>
            {['✓ No credit card needed', '✓ Resume never stored', '✓ 60-second results', '✓ Covers Indian PM market'].map(t => (
              <span key={t} className="text-xs text-slate-500">{t}</span>
            ))}
          </div>
        </main>

        {/* ── Stats bar ────────────────────────────────────────────────── */}
        <div ref={statsRef.ref} className="relative z-10 border-y border-slate-200 bg-slate-50/80">
          <div className="max-w-4xl mx-auto px-6 py-10 grid grid-cols-3 gap-6 text-center">
            {[
              { count: stat1, suffix: '+', label: 'Resumes Optimized', prefix: '' },
              { count: stat2, suffix: '%', label: 'More Interview Callbacks', prefix: '' },
              { count: stat3, suffix: 's', label: 'Average Time to Optimize', prefix: '<' },
            ].map(({ count, suffix, label, prefix }, i) => (
              <div key={label} style={{ animation: statsRef.inView ? `statsCount 0.6s ${i * 0.15}s ease both` : 'none' }}>
                <p className="text-3xl sm:text-4xl font-black text-slate-900 hero-text">
                  {prefix}{count.toLocaleString()}{suffix}
                </p>
                <p className="text-xs text-slate-500 mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── How it works ─────────────────────────────────────────────── */}
        <section className="relative z-10 border-b border-slate-200">
          <div className="max-w-6xl mx-auto px-6 py-16">
            <h2 className="text-2xl font-black text-slate-900 text-center mb-10 hero-text">How it works</h2>
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
                  <h3 className="font-bold text-slate-700 mb-5 text-sm hero-text">{col.title}</h3>
                  <div className="space-y-4">
                    {(col.steps as [string, string][]).map(([title, sub], i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${col.color === 'blue' ? 'bg-blue-500/20 text-blue-300' : 'bg-indigo-500/20 text-indigo-300'}`}>{i + 1}</div>
                        <div>
                          <p className="text-sm font-semibold text-slate-700">{title}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{sub}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            PRICING SECTION
        ═══════════════════════════════════════════════════════════════ */}
        <section id="pricing" ref={pricingRef.ref} className="relative z-10 py-24 px-6 overflow-hidden">

          {/* Section background glow */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] rounded-full"
              style={{ background: 'radial-gradient(ellipse, rgba(99,102,241,0.12) 0%, transparent 70%)' }} />
          </div>

          <div className="max-w-6xl mx-auto">

            {/* Heading */}
            <div className="text-center mb-16">
              <div
                className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-400/20 text-violet-300 text-xs font-bold px-4 py-2 rounded-full mb-6"
                style={{ animation: pricingRef.inView ? 'heroFadeUp 0.5s ease both' : 'none' }}
              >
                <span>💳</span> Simple, one-time pricing
              </div>

              <h2
                className="text-4xl sm:text-5xl font-black hero-text mb-4"
                style={{ animation: pricingRef.inView ? 'heroFadeUp 0.5s 0.1s ease both' : 'none', opacity: pricingRef.inView ? undefined : 0 }}
              >
                No subscriptions.{' '}
                <span className="shimmer-text">No surprises.</span>
              </h2>

              <p
                className="text-slate-600 text-lg max-w-xl mx-auto body-text"
                style={{ animation: pricingRef.inView ? 'heroFadeUp 0.5s 0.2s ease both' : 'none', opacity: pricingRef.inView ? undefined : 0 }}
              >
                Buy access for exactly as long as you need. Job hunting is stressful enough — your tools shouldn't be.
              </p>

              {/* Free tier callout */}
              <div
                className="inline-flex items-center gap-3 mt-6 bg-white border border-slate-200 rounded-2xl px-5 py-3 shadow-sm"
                style={{ animation: pricingRef.inView ? 'heroFadeUp 0.5s 0.3s ease both' : 'none', opacity: pricingRef.inView ? undefined : 0 }}
              >
                <div className="flex items-center gap-1.5">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="w-2.5 h-2.5 rounded-full bg-emerald-400" style={{ opacity: 1 - i * 0.15 }} />
                  ))}
                </div>
                <span className="text-sm text-slate-600">
                  Start with <span className="text-slate-900 font-bold">5 free actions</span> — no card needed
                </span>
              </div>
            </div>

            {/* Cards */}
            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto items-center">
              {PLANS.map((plan, i) => (
                <div
                  key={plan.key}
                  className={`plan-card relative rounded-[2rem] border cursor-pointer ${plan.border} ${plan.popular ? 'popular-card' : ''}`}
                  onMouseEnter={() => setHoveredCard(plan.key)}
                  onMouseLeave={() => setHoveredCard(null)}
                  onClick={() => handlePlanClick(plan.key)}
                  style={{
                    animation: plan.popular
                      ? 'borderGlow 3s ease-in-out infinite'
                      : pricingRef.inView
                        ? `cardReveal 0.7s ${0.1 + i * 0.12}s cubic-bezier(0.22,1,0.36,1) both`
                        : 'none',
                    opacity: pricingRef.inView ? undefined : 0,
                    background: plan.popular
                      ? 'linear-gradient(145deg, rgba(109,40,217,0.18), rgba(79,70,229,0.12), rgba(255,255,255,0.98))'
                      : 'rgba(255,255,255,0.95)',
                    boxShadow: hoveredCard === plan.key || plan.popular
                      ? `0 0 40px ${plan.glow}, 0 16px 38px rgba(15,23,42,0.12)`
                      : '0 4px 20px rgba(15,23,42,0.08)',
                    borderColor: plan.popular && (hoveredCard === plan.key)
                      ? 'rgba(139,92,246,0.6)'
                      : undefined,
                  }}
                >
                  {/* Popular glow backdrop */}
                  {plan.popular && (
                    <div
                      className="absolute -inset-px rounded-[2rem] pointer-events-none"
                      style={{
                        background: `linear-gradient(135deg, ${plan.glow}, transparent 60%)`,
                        animation: 'glowPulse 3s ease-in-out infinite',
                      }}
                    />
                  )}

                  {/* Badge */}
                  {plan.badge && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                      <span
                        className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-black text-white shadow-lg ${
                          plan.popular
                            ? 'bg-gradient-to-r from-violet-500 to-indigo-500'
                            : 'bg-gradient-to-r from-amber-400 to-orange-500'
                        }`}
                        style={{ animation: plan.popular ? 'badgeBounce 2.5s ease-in-out infinite' : 'none' }}
                      >
                        {plan.popular ? '⭐' : '👑'} {plan.badge}
                      </span>
                    </div>
                  )}

                  <div className="relative z-10 p-7">
                    {/* Plan header */}
                    <div className="flex items-center gap-3 mb-6">
                      <div
                        className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${plan.color} flex items-center justify-center text-2xl shadow-lg`}
                        style={{ boxShadow: `0 8px 24px ${plan.glow}` }}
                      >
                        {plan.emoji}
                      </div>
                      <div>
                        <p className="font-black text-slate-900 hero-text">{plan.name}</p>
                        <p className="text-xs text-slate-500">{plan.duration} access</p>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="mb-6">
                      <div className="flex items-end gap-1">
                        <span className="text-slate-500 text-lg font-bold mt-1">₹</span>
                        <span
                          className={`text-6xl font-black hero-text bg-gradient-to-br ${plan.color} bg-clip-text text-transparent`}
                          style={{ WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
                        >
                          {plan.price}
                        </span>
                      </div>
                      <p className="text-slate-500 text-xs mt-1">one-time · no renewal</p>
                    </div>

                    {/* Divider */}
                    <div className="h-px bg-slate-200 mb-6" />

                    {/* Features */}
                    <ul className="space-y-3 mb-8">
                      {plan.features.map((feature, fi) => (
                        <li
                          key={feature}
                          className="flex items-start gap-3 text-sm text-slate-700"
                          style={{
                            animation: pricingRef.inView
                              ? `heroFadeUp 0.4s ${0.3 + i * 0.12 + fi * 0.05}s ease both`
                              : 'none',
                            opacity: pricingRef.inView ? undefined : 0,
                          }}
                        >
                          <span
                            className={`w-5 h-5 rounded-full bg-gradient-to-br ${plan.color} flex items-center justify-center text-white text-xs shrink-0 mt-0.5 feature-tick`}
                            style={{ animationDelay: `${0.4 + i * 0.12 + fi * 0.06}s` }}
                          >
                            ✓
                          </span>
                          {feature}
                        </li>
                      ))}
                    </ul>

                    {/* CTA */}
                    <button
                      className={`w-full py-4 rounded-2xl font-black text-sm tracking-wide transition-all duration-200 hover:scale-105 active:scale-95 ${
                        plan.popular
                          ? 'bg-gradient-to-r from-violet-500 to-indigo-500 text-white shadow-xl'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-200'
                      }`}
                      style={plan.popular ? { boxShadow: `0 8px 30px ${plan.glow}` } : {}}
                    >
                      {user ? `${plan.cta} →` : `Sign in to ${plan.cta} →`}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Comparison note */}
            <div className="mt-12 text-center">
              <div className="inline-flex flex-wrap justify-center gap-x-8 gap-y-3 bg-white border border-slate-200 rounded-2xl px-8 py-5 shadow-sm">
                {[
                  { icon: '🔒', text: 'Secured by Razorpay' },
                  { icon: '⚡', text: 'Instant activation' },
                  { icon: '💳', text: 'UPI, Cards, Net Banking' },
                  { icon: '🔁', text: 'No auto-renewal ever' },
                ].map(({ icon, text }) => (
                  <div key={text} className="flex items-center gap-2 text-sm text-slate-600">
                    <span>{icon}</span>
                    <span>{text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* FAQ teaser */}
            <div className="mt-14 max-w-2xl mx-auto">
              <h3 className="text-lg font-black text-slate-900 text-center mb-6 hero-text">Quick questions</h3>
              <div className="space-y-3">
                {[
                  ['What counts as a "free action"?', 'Each resume optimization, AI analysis, and PDF download counts as one action. You get 5 to start, completely free, no card required.'],
                  ['What happens when my plan expires?', 'You go back to the free tier. Your account and history stay safe. You can buy a new pass anytime.'],
                  ['Can I use it for multiple jobs?', 'Yes — optimize for as many roles as you want during your plan period. Each job needs its own optimization for best results.'],
                ].map(([q, a]) => (
                  <details
                    key={q}
                    className="group bg-white border border-slate-200 rounded-2xl overflow-hidden cursor-pointer shadow-sm"
                  >
                    <summary className="px-5 py-4 text-sm font-semibold text-slate-700 hover:text-slate-900 flex items-center justify-between transition-colors list-none">
                      {q}
                      <span className="text-slate-400 group-open:rotate-180 transition-transform duration-200 shrink-0 ml-4">▾</span>
                    </summary>
                    <div className="px-5 pb-4 text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                      {a}
                    </div>
                  </details>
                ))}
              </div>
            </div>

          </div>
        </section>

        {/* ── Footer ───────────────────────────────────────────────────── */}
        <footer className="relative z-10 border-t border-slate-200 px-6 py-7">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <span className="hero-text">© {new Date().getFullYear()} PM Resume Optimizer</span>
            <div className="flex gap-5">
              {[['Privacy', '/privacy'], ['Terms', '/terms'], ['Check Score', '/score'], ['Optimize', '/optimize']].map(([l, h]) => (
                <Link key={l} href={h} className="hover:text-slate-900 transition-colors">{l}</Link>
              ))}
            </div>
          </div>
        </footer>

      </div>
    </>
  );
}
