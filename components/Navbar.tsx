'use client';

import { useAuth } from '@/lib/AuthContext';
import { useState } from 'react';

interface NavbarProps {
  onSignInClick: () => void;
}

export function Navbar({ onSignInClick }: NavbarProps) {
  const { user, dbUser, signOut } = useAuth();
  const [showMenu, setShowMenu] = useState(false);

  const now = new Date();
  const hasActiveSubscription =
    dbUser?.subscription_type === 'paid' &&
    dbUser?.subscription_expires_at &&
    new Date(dbUser.subscription_expires_at) > now;

  const freeDownloadsRemaining = dbUser ? Math.max(0, 5 - dbUser.downloads_used) : 5;

  return (
    <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200/60">
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
        <div className="flex items-center gap-4">
          {user ? (
            <div className="relative">
              {/* User Info - Click to toggle menu */}
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors">
                {/* Avatar */}
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white text-sm font-semibold">
                  {user.email?.[0]?.toUpperCase() || 'U'}
                </div>
                {/* Status */}
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-medium text-slate-900">
                    {hasActiveSubscription ? '✨ Premium' : `${freeDownloadsRemaining} free left`}
                  </p>
                  <p className="text-xs text-slate-500">{user.email}</p>
                </div>
                {/* Dropdown arrow */}
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {showMenu && (
                <>
                  {/* Backdrop */}
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowMenu(false)}
                  />
                  
                  {/* Menu */}
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-20">
                    {/* User Info */}
                    <div className="px-4 py-3 border-b border-slate-100">
                      <p className="text-sm font-semibold text-slate-900">{user.email}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        {hasActiveSubscription ? (
                          <span className="text-green-600 font-medium">
                            Premium until {new Date(dbUser.subscription_expires_at!).toLocaleDateString()}
                          </span>
                        ) : (
                          <span>
                            {freeDownloadsRemaining} of 5 free downloads remaining
                          </span>
                        )}
                      </p>
                    </div>

                    {/* Sign Out */}
                    <button
                      onClick={async () => {
                        await signOut();
                        setShowMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                      Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <button
              onClick={onSignInClick}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg text-sm font-semibold transition-all shadow-lg shadow-blue-500/20">
              Sign In
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
