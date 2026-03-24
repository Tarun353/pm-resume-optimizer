'use client';

import { useAuth } from '@/lib/AuthContext';
import { useState } from 'react';
import { PaymentModal } from '@/components/PaymentModal';

interface NavbarProps {
  onSignInClick: () => void;
}

export function Navbar({ onSignInClick }: NavbarProps) {
  const { user, dbUser, signOut } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const [showPayment, setShowPayment] = useState(false);

  const now = new Date();
  const hasActiveSubscription =
    dbUser?.subscription_type === 'paid' &&
    dbUser?.subscription_expires_at &&
    new Date(dbUser.subscription_expires_at) > now;

  const generationsUsed = (dbUser as any)?.generations_used ?? 0;
  const downloadsUsed = dbUser?.downloads_used ?? 0;
  const actionsUsed = Math.max(generationsUsed, downloadsUsed);
  const freeLimit = 5;
  const actionsRemaining = Math.max(0, freeLimit - actionsUsed);
  const isAtLimit = actionsUsed >= freeLimit;
  const isNearLimit = actionsRemaining === 1 && !isAtLimit;

  return (
    <>
      <PaymentModal
        isOpen={showPayment}
        onClose={() => setShowPayment(false)}
        onSuccess={() => { setShowPayment(false); }}
      />

      {/* Sticky wrapper includes warning banner */}
      <div className="sticky top-0 z-40">

        {/* ── Warning Banner ───────────────────────────────────────────── */}
        {user && !hasActiveSubscription && (isAtLimit || isNearLimit) && (
          <div
            className={`w-full py-2.5 px-4 flex items-center justify-center gap-3 text-sm font-semibold ${
              isAtLimit
                ? 'bg-gradient-to-r from-red-500 via-red-600 to-red-500 text-white'
                : 'bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 text-slate-900'
            }`}
            style={{
              backgroundSize: '200% 100%',
              animation: 'navBannerShift 3s ease infinite',
            }}
          >
            <style>{`
              @keyframes navBannerShift {
                0%   { background-position: 0% 50%; }
                50%  { background-position: 100% 50%; }
                100% { background-position: 0% 50%; }
              }
              @keyframes navPulse {
                0%, 100% { opacity: 1; transform: scale(1); }
                50%       { opacity: 0.85; transform: scale(1.05); }
              }
            `}</style>

            <span style={{ animation: 'navPulse 2s ease-in-out infinite' }}>
              {isAtLimit ? '🚫' : '⚡'}
            </span>

            <span>
              {isAtLimit
                ? "You've used all 5 free actions. Upgrade to keep going."
                : 'Only 1 free action left — upgrade before you run out!'}
            </span>

            <button
              onClick={() => setShowPayment(true)}
              className={`ml-1 px-4 py-1 rounded-full text-xs font-black tracking-wide transition-all hover:scale-105 active:scale-95 ${
                isAtLimit
                  ? 'bg-white text-red-600 hover:bg-red-50 shadow-lg'
                  : 'bg-slate-900 text-blue-100 hover:bg-slate-800 shadow-lg'
              }`}
            >
              Upgrade Now →
            </button>
          </div>
        )}

        {/* ── Main Nav ─────────────────────────────────────────────────── */}
        <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200/60">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">

            {/* Logo */}
            <div className="flex items-center gap-3">
              <svg width="36" height="36" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
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
              <div>
                <h1 className="font-bold text-slate-900 tracking-tight text-lg">PM Resume Optimizer</h1>
                <p className="text-xs text-slate-500">AI-Powered · ATS-Optimized</p>
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-3">
              {user ? (
                <>
                  {/* ── Quota / Upgrade pill ─────────────────────────── */}
                  {!hasActiveSubscription && (
                    <>
                      {isAtLimit ? (
                        /* Pulsing upgrade button — hard to miss */
                        <button
                          onClick={() => setShowPayment(true)}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white transition-all hover:scale-105 active:scale-95"
                          style={{
                            background: 'linear-gradient(135deg, #2563eb, #1d4ed8, #2563eb)',
                            boxShadow: '0 0 20px rgba(37,99,235,0.45)',
                            animation: 'upgradePulse 2s ease-in-out infinite',
                          }}
                        >
                          <style>{`
                            @keyframes upgradePulse {
                              0%, 100% { box-shadow: 0 0 20px rgba(37,99,235,0.45); }
                              50%       { box-shadow: 0 0 35px rgba(37,99,235,0.65), 0 0 60px rgba(37,99,235,0.25); }
                            }
                          `}</style>
                          ✨ Upgrade
                        </button>
                      ) : (
                        /* Clickable quota pill */
                        <button
                          onClick={() => setShowPayment(true)}
                          title="Click to upgrade"
                          className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-all hover:scale-105 active:scale-95 cursor-pointer ${
                            isNearLimit
                              ? 'bg-amber-100 text-amber-700 hover:bg-amber-200 ring-1 ring-amber-300'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {isNearLimit ? '⚡ ' : ''}{actionsRemaining} free {actionsRemaining === 1 ? 'action' : 'actions'} left
                        </button>
                      )}
                    </>
                  )}

                  {/* Premium badge */}
                  {hasActiveSubscription && (
                    <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
                      Premium
                    </span>
                  )}

                  {/* User avatar / menu */}
                  <div className="relative">
                    <button
                      onClick={() => setShowMenu(!showMenu)}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-100 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-white text-sm font-semibold shadow-sm">
                        {user.email?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {showMenu && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                        <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-20 animate-in">
                          <style>{`
                            .animate-in { animation: dropIn 0.2s cubic-bezier(0.22,1,0.36,1); }
                            @keyframes dropIn {
                              from { opacity: 0; transform: translateY(-8px) scale(0.97); }
                              to   { opacity: 1; transform: translateY(0) scale(1); }
                            }
                          `}</style>

                          {/* User info */}
                          <div className="px-4 py-4 bg-slate-50 border-b border-slate-100">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-white font-bold shadow">
                                {user.email?.[0]?.toUpperCase() || 'U'}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-slate-900 truncate">{user.email}</p>
                                <p className="text-xs text-slate-500 mt-0.5">
                                  {hasActiveSubscription
                                    ? <span className="text-emerald-600 font-semibold">✓ Premium · expires {new Date(dbUser!.subscription_expires_at!).toLocaleDateString('en-IN')}</span>
                                    : `${actionsRemaining} of ${freeLimit} free actions left`
                                  }
                                </p>
                              </div>
                            </div>

                            {/* Mini quota bar */}
                            {!hasActiveSubscription && (
                              <div className="mt-3">
                                <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all duration-700 ${
                                      isAtLimit ? 'bg-red-600' : isNearLimit ? 'bg-blue-500' : 'bg-blue-500'
                                    }`}
                                    style={{ width: `${(actionsUsed / freeLimit) * 100}%` }}
                                  />
                                </div>
                                <p className="text-[10px] text-slate-500 mt-1">{actionsUsed}/{freeLimit} actions used</p>
                              </div>
                            )}
                          </div>

                          {/* Upgrade CTA (always visible for free users) */}
                          {!hasActiveSubscription && (
                            <button
                              onClick={() => { setShowMenu(false); setShowPayment(true); }}
                              className="w-full px-4 py-3 text-left text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transition-all flex items-center justify-between group border-b border-blue-700/20"
                            >
                              <span className="flex items-center gap-2">
                                ✨ Upgrade to Premium
                              </span>
                              <span className="text-xs font-normal text-blue-200 group-hover:text-white transition-colors">
                                from ₹19 →
                              </span>
                            </button>
                          )}

                          {/* Sign out */}
                          <button
                            onClick={async () => { await signOut(); setShowMenu(false); }}
                            className="w-full px-4 py-3 text-left text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                          >
                            Sign out
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </>
              ) : (
                <button
                  onClick={onSignInClick}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-blue-500/20 hover:scale-105 active:scale-95"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        </nav>
      </div>
    </>
  );
}
