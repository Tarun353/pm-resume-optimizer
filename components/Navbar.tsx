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
          <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
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
