'use client';

import { useAuth } from '@/lib/AuthContext';

export function UserProfile() {
  const { user, dbUser, signOut } = useAuth();

  if (!user || !dbUser) return null;

  const now = new Date();
  const hasActiveSubscription =
    dbUser.subscription_type === 'paid' &&
    dbUser.subscription_expires_at &&
    new Date(dbUser.subscription_expires_at) > now;

  const freeDownloadsRemaining = Math.max(0, 5 - dbUser.downloads_used);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">
            {user.email}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            {hasActiveSubscription ? (
              <span className="text-green-600 font-medium">
                ✓ Premium Active
              </span>
            ) : (
              <span className="text-slate-600">Free Plan</span>
            )}
          </p>
        </div>
        <button
          onClick={signOut}
          className="text-xs text-slate-500 hover:text-slate-700 font-medium">
          Sign Out
        </button>
      </div>

      {hasActiveSubscription ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <p className="text-sm font-semibold text-green-800 mb-1">
            ✨ Unlimited Downloads
          </p>
          <p className="text-xs text-green-600">
            Expires: {new Date(dbUser.subscription_expires_at!).toLocaleDateString()}
          </p>
        </div>
      ) : (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm font-semibold text-blue-800 mb-1">
            {freeDownloadsRemaining} Free Downloads Left
          </p>
          <p className="text-xs text-blue-600">
            {dbUser.downloads_used} of 5 used
          </p>
        </div>
      )}
    </div>
  );
}
