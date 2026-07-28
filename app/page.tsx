'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import { useState, useEffect, useRef } from 'react';
import { LoginModal } from '@/components/LoginModal';
import { PaymentModal } from '@/components/PaymentModal';
import { SeoCta } from '@/components/SeoCta';
import Script from 'next/script';

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
    color: 'from-blue-500 to-blue-700',
    glow: 'rgba(6,182,212,0.35)',
    border: 'border-blue-500/30',
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
    color: 'from-blue-600 to-blue-700',
    glow: 'rgba(37,99,235,0.35)',
    border: 'border-blue-500/40',
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
    color: 'from-blue-500 to-blue-700',
    glow: 'rgba(37,99,235,0.28)',
    border: 'border-blue-500/30',
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

const CONTACT_METHODS = [
  { label: 'Phone', href: 'tel:+916200825883', icon: PhoneIcon },
  { label: 'Email', href: 'mailto:pmresumeoptimizer@gmail.com', icon: MailIcon },
];

const SOCIAL_LINKS = [
  { label: 'Instagram', href: 'https://www.instagram.com/pmresumeoptimizer/', icon: InstagramIcon },
  { label: 'Reddit', href: 'https://www.reddit.com/user/PM-RESUME-OPTIMIZER/', icon: RedditIcon },
  { label: 'X', href: 'https://x.com/pmresumeai', icon: XIcon },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/company/pm-resume-optimizer/about/?viewAsMember=true', icon: LinkedInIcon },
];

const webApplicationSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'PM Resume Optimizer',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  url: 'https://pm-resume-optimizer.onrender.com',
  description:
    'AI-powered product manager resume optimizer with ATS scoring, keyword analysis, and role-specific resume improvements.',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'INR',
  },
};

const faqPageSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Why is my product manager resume not getting interviews?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Most PM resumes fail because they lack measurable impact, product thinking, and keyword alignment with job descriptions. This tool identifies exactly where your resume is weak and helps fix it.',
      },
    },
    {
      '@type': 'Question',
      name: 'How does PM Resume Optimizer work?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Paste your resume and a product manager job description. The AI analyzes your resume for ATS compatibility and recruiter expectations, then rewrites it to match the role in under 60 seconds.',
      },
    },
    {
      '@type': 'Question',
      name: 'Does this help my resume pass ATS systems?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. It aligns your resume with job-specific keywords and improves formatting so it performs better in applicant tracking systems.',
      },
    },
    {
      '@type': 'Question',
      name: 'How is this different from other resume tools?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Unlike generic resume builders, this tool is built specifically for product manager roles and focuses on impact-driven bullet points, metrics, and product ownership language.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can I tailor my resume for multiple PM job roles?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. You can generate multiple tailored versions of your resume for different job descriptions instantly.',
      },
    },
    {
      '@type': 'Question',
      name: 'How long does it take to optimize a resume?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'It takes less than 60 seconds to generate a job-specific, optimized resume.',
      },
    },
    {
      '@type': 'Question',
      name: 'Does this work for aspiring product managers?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. It helps highlight projects, internships, and transferable skills in a way that aligns with PM expectations.',
      },
    },
    {
      '@type': 'Question',
      name: 'Do I need to create an account?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'You can start without a credit card. Creating an account allows you to save and manage multiple resume versions.',
      },
    },
    {
      '@type': 'Question',
      name: 'Does it also generate cover letters?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. You can generate tailored cover letters based on your resume and job description.',
      },
    },
  ],
};

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
      <Script
        id="web-application-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webApplicationSchema) }}
      />
      <Script
        id="faq-page-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqPageSchema) }}
      />

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
        @keyframes borderGlow {
          0%, 100% { border-color: rgba(37,99,235,0.25); }
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
          background: linear-gradient(90deg, #1d4ed8, #2563eb, #2563eb, #1d4ed8);
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
        <div className="mx-auto max-w-5xl px-4 pt-4">
          <SeoCta />
        </div>

        {/* ── Global background ────────────────────────────────────────── */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(37,99,235,0.06) 1px, transparent 0)',
            backgroundSize: '36px 36px',
          }}/>
          <FloatingOrb style={{ top: '-10%', left: '10%', width: 600, height: 600, background: 'radial-gradient(circle, rgba(37,99,235,0.16), transparent 70%)' }} />
          <FloatingOrb style={{ bottom: '5%', right: '5%', width: 500, height: 500, background: 'radial-gradient(circle, rgba(59,130,246,0.14), transparent 70%)' }} />
          <FloatingOrb style={{ top: '40%', right: '30%', width: 350, height: 350, background: 'radial-gradient(circle, rgba(37,99,235,0.10), transparent 70%)', opacity: 0.15 }} />
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
                        className="text-sm font-bold px-4 py-2 rounded-xl text-white border border-blue-300 bg-blue-100 hover:bg-blue-200 transition-all"
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
            <span className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-400/20 text-blue-700 text-xs font-bold px-4 py-2 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"/>
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
                <div className="inline-flex items-center gap-1.5 bg-blue-500/15 border border-blue-400/20 text-blue-700 text-[10px] font-black px-3 py-1 rounded-full mb-3 uppercase tracking-wide">Free · No credit card</div>
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
                  <span className="flex items-center gap-2 text-blue-700 font-bold text-sm group-hover:gap-3 transition-all hero-text">Check My Score <span>→</span></span>
                </div>
              </div>
            </Link>

            {/* Optimize */}
            <Link href="/optimize"
              className="group relative overflow-hidden rounded-[2rem] border border-blue-200 bg-gradient-to-br from-blue-50 to-blue-50 hover:from-blue-100 hover:to-blue-100 p-7 sm:p-8 transition-all duration-300 hover:border-blue-300 hover:shadow-xl hover:-translate-y-1.5 block">
              <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/15 rounded-full blur-3xl group-hover:bg-blue-500/25 transition-all duration-500"/>
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/30 to-blue-700/20 border border-blue-400/25 flex items-center justify-center text-2xl mb-5 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300">✨</div>
                <div className="inline-flex items-center gap-1.5 bg-blue-500/15 border border-blue-400/20 text-blue-700 text-[10px] font-black px-3 py-1 rounded-full mb-3 uppercase tracking-wide">AI-Powered · 60 seconds</div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 mb-3 leading-snug hero-text">Optimize PM Resume<br/>for Any JD</h2>
                <p className="text-slate-600 text-sm leading-relaxed mb-5">AI rewrites your summary and every bullet with the right keywords for this specific role.</p>
                <ul className="space-y-2 mb-7">
                  {['Full summary rewrite tailored to the JD', 'Every bullet rewritten with keywords injected', 'Cover letter generated in one click'].map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm text-slate-600">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400/70 shrink-0 mt-1.5"/>
                      {f}
                    </li>
                  ))}
                </ul>
                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <span className="text-xs text-slate-500">5 free optimizations</span>
                  <span className="flex items-center gap-2 text-blue-700 font-bold text-sm group-hover:gap-3 transition-all hero-text">Optimize Now <span>→</span></span>
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

          <section className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm">
            <h2 className="text-2xl font-black text-slate-900 hero-text">PM Resume Guides</h2>
            <p className="mt-2 text-sm text-slate-600">
              Pick your PM profile and explore actionable advice before your next application.
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Link
                href="/resume-for-freshers"
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-800"
              >
                Fresher PM Resume Guide →
              </Link>
              <Link
                href="/resume-for-experienced-pm"
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-800"
              >
                Experienced PM Resume Guide →
              </Link>
              <Link
                href="/resume-for-career-switch"
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-800"
              >
                Career Switch PM Guide →
              </Link>
              <Link
                href="/blog"
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-800"
              >
                Browse PM Resume Blog →
              </Link>
              <Link
                href="/segments"
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-800"
              >
                Explore PM Resume Segments →
              </Link>
            </div>

            <p className="mt-5 text-sm text-slate-600">
              Or jump into popular blog posts:
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link href="/blog" className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                Visit Blog
              </Link>
              <Link href="/blog/product-manager-resume-guide" className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                PM Resume Guide
              </Link>
              <Link href="/blog/ats-resume-mistakes" className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                ATS Mistakes
              </Link>
            </div>
          </section>
        </main>

        <section className="mt-16 px-4 max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 hero-text mb-8">
            Product Manager Resume Optimizer
          </h2>

          <div className="space-y-10 text-slate-700 leading-relaxed">
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-slate-900 hero-text">
                What is ATS (Applicant Tracking System)
              </h2>
              <p>
                An Applicant Tracking System, or ATS, is the software many companies use to collect and sort job applications.
                When you apply for a Product Manager role, your product manager resume usually goes through this system before a recruiter even sees it.
                The ATS scans your resume for important details like job titles, skills, tools, and words from the job description.
              </p>
              <p>
                If your resume does not match what the system is looking for, it may be ranked lower.
                That does not always mean you are a weak candidate. It often means the resume language and structure are not aligned with the role.
                A strong product manager resume should still sound human, but it should also be easy for an ATS to read and understand.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-slate-900 hero-text">
                Why Product Manager resumes fail screening
              </h2>
              <p>
                PM resumes often fail screening because they are too generic.
                Many candidates use the same resume for every job, even when each company is asking for different skills.
                One role may focus on growth, another on platform work, and another on B2B discovery.
                If your resume does not reflect that context, it can be filtered out early.
              </p>
              <p>
                Another common issue is unclear impact.
                Recruiters and hiring managers want to see what changed because of your work.
                If bullets only list tasks, like “managed roadmap” or “worked with engineering,” your value is hard to measure.
                PM resumes should show outcomes, ownership, and business impact in clear, simple lines.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-slate-900 hero-text">
                Common resume mistakes (keywords, formatting)
              </h2>
              <p>
                Keyword gaps are one of the biggest problems.
                If a job description repeats terms like experimentation, stakeholder management, SQL, or go-to-market, your resume should include relevant evidence for those areas.
                This does not mean stuffing random words.
                It means showing real experience using language that matches the role, which is the core of ATS resume optimization.
              </p>
              <p>
                Formatting also hurts many resumes.
                Complex tables, graphics, icons, or multi-column layouts can confuse ATS tools.
                Keep formatting clean: clear headings, simple bullets, and consistent structure.
                For PM roles, clarity beats design-heavy templates every time, and good resume keywords for product managers should be added in a natural way.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-slate-900 hero-text">
                How this tool helps
              </h2>
              <p>
                This tool helps you tailor your product manager resume for each Product Manager role without starting from zero.
                You can check your ATS match score, see where your resume is weak, and get practical rewrite suggestions.
                Instead of guessing what to fix, you get clear direction section by section and bullet by bullet.
              </p>
              <p>
                You can also optimize your resume using a real job description, improve your summary, and rewrite bullets with stronger impact and relevant keywords.
                The goal is simple: help your resume pass screening and sound like a real person wrote it.
                You stay in control, but you save time and avoid the most common PM resume mistakes.
              </p>
            </div>
          </div>
        </section>

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
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${col.color === 'blue' ? 'bg-blue-500/20 text-blue-700' : 'bg-blue-500/20 text-blue-700'}`}>{i + 1}</div>
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
              style={{ background: 'radial-gradient(ellipse, rgba(37,99,235,0.12) 0%, transparent 70%)' }} />
          </div>

          <div className="max-w-6xl mx-auto">

            {/* Heading */}
            <div className="text-center mb-16">
              <div
                className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-400/20 text-blue-700 text-xs font-bold px-4 py-2 rounded-full mb-6"
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
                      ? 'linear-gradient(145deg, rgba(37,99,235,0.18), rgba(29,78,216,0.12), rgba(255,255,255,0.98))'
                      : 'rgba(255,255,255,0.95)',
                    boxShadow: hoveredCard === plan.key || plan.popular
                      ? `0 0 40px ${plan.glow}, 0 16px 38px rgba(15,23,42,0.12)`
                      : '0 4px 20px rgba(15,23,42,0.08)',
                    borderColor: plan.popular && (hoveredCard === plan.key)
                      ? 'rgba(37,99,235,0.6)'
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
                            ? 'bg-gradient-to-r from-blue-600 to-blue-700'
                            : 'bg-gradient-to-r from-blue-500 to-blue-700'
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
                          ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-xl'
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
                      <span className="text-slate-500 group-open:rotate-180 transition-transform duration-200 shrink-0 ml-4">▾</span>
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

        <div className="mx-auto mt-10 max-w-5xl px-4">
          <SeoCta />
        </div>

        {/* ── Footer ───────────────────────────────────────────────────── */}
        <footer className="relative z-10 w-full bg-[#1E3A8A] px-6 pt-16 pb-12">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 gap-10 text-center sm:grid-cols-2 lg:grid-cols-3 lg:text-left">
              <div>
                <h3 className="hero-text text-xl font-bold text-white mb-4">About Us</h3>
                <p className="body-text text-sm leading-relaxed text-[#CBD5F5] max-w-sm mx-auto lg:mx-0">
                  Built for Product Managers to optimize resumes with real insights.
                </p>
              </div>

              <div>
                <h3 className="hero-text text-xl font-bold text-white mb-4">Contact Us</h3>
                <div className="flex flex-wrap justify-center lg:justify-start gap-3">
                  {CONTACT_METHODS.map(({ label, href, icon: Icon }) => (
                    <a
                      key={label}
                      href={href}
                      aria-label={label}
                      className="w-12 h-12 rounded-xl border border-white/20 bg-white/10 text-white flex items-center justify-center text-xl transition-all duration-200 hover:bg-white/20 hover:scale-110"
                    >
                      <Icon aria-hidden="true" />
                    </a>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="hero-text text-xl font-bold text-white mb-4">Follow Us</h3>
                <div className="flex flex-wrap justify-center lg:justify-start gap-3">
                  {SOCIAL_LINKS.map(({ label, href, icon: Icon }) => (
                    <a
                      key={label}
                      href={href}
                      aria-label={label}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-12 h-12 rounded-xl border border-white/20 bg-white/10 text-white flex items-center justify-center text-xl transition-all duration-200 hover:bg-white/20 hover:scale-110"
                    >
                      <Icon aria-hidden="true" />
                    </a>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-10 border-t border-white/20 pt-6">
              <p className="hero-text text-center text-xs text-[#CBD5F5]">© 2026 PM Resume Optimizer</p>
            </div>
          </div>
        </footer>

      </div>
    </>
  );
}
type IconProps = { className?: string };

function PhoneIcon({ className = 'w-5 h-5' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M22 16.92V20a2 2 0 0 1-2.18 2 19.84 19.84 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.84 19.84 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3.09a2 2 0 0 1 2 1.72c.12.9.33 1.78.62 2.63a2 2 0 0 1-.45 2.11L8.1 9.91a16 16 0 0 0 6 6l1.45-1.27a2 2 0 0 1 2.11-.45c.85.29 1.73.5 2.63.62A2 2 0 0 1 22 16.92Z" />
    </svg>
  );
}

function MailIcon({ className = 'w-5 h-5' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m3 7 9 6 9-6" />
    </svg>
  );
}

function InstagramIcon({ className = 'w-5 h-5' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function RedditIcon({ className = 'w-5 h-5' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
      <circle cx="12" cy="13" r="6" />
      <circle cx="9.5" cy="12.5" r="0.7" fill="currentColor" stroke="none" />
      <circle cx="14.5" cy="12.5" r="0.7" fill="currentColor" stroke="none" />
      <path strokeLinecap="round" d="M9.5 15c.6.5 1.4.8 2.5.8s1.9-.3 2.5-.8" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.7 7.7 16 5l2 1" />
      <circle cx="18.5" cy="6" r="1" />
    </svg>
  );
}

function XIcon({ className = 'w-5 h-5' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M18.244 2H21l-6.56 7.497L22 22h-6.172l-4.834-6.29L5.47 22H2.71l7.015-8.016L2 2h6.329l4.37 5.79L18.244 2Zm-2.165 18h1.698L7.401 3.894H5.58L16.079 20Z" />
    </svg>
  );
}

function LinkedInIcon({ className = 'w-5 h-5' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M6.94 8.75H3.56V20h3.38V8.75ZM5.25 3A2.01 2.01 0 0 0 3.2 5c0 1.1.9 2 2.02 2h.03a2 2 0 1 0 0-4ZM20 13.2c0-3.03-1.62-4.45-3.79-4.45-1.74 0-2.53.96-2.97 1.64v-1.4H9.86c.04.92 0 11.01 0 11.01h3.38v-6.14c0-.33.03-.65.12-.89.26-.65.85-1.31 1.85-1.31 1.31 0 1.83.99 1.83 2.44V20H20v-6.8Z" />
    </svg>
  );
}
