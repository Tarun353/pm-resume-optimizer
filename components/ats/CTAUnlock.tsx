'use client';

interface CTAUnlockProps {
  isLoggedIn: boolean;
  onLogin: () => void;
  onOptimize: () => void;
}

export function CTAUnlock({ isLoggedIn, onLogin, onOptimize }: CTAUnlockProps) {
  return (
    <div className="rounded-3xl border border-blue-200 bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-700">
        {isLoggedIn ? 'Next step' : 'Unlock gate'}
      </p>
      <h3 className="mt-2 text-xl font-semibold text-slate-900">
        {isLoggedIn ? 'Optimize with AI' : 'Unlock Full Report'}
      </h3>
      <p className="mt-2 text-sm text-slate-600">
        {isLoggedIn
          ? 'Continue into the paid optimization flow once you are happy with the ATS analysis.'
          : 'Sign in to reveal missing keywords, bullet rewrites, and section-level recommendations.'}
      </p>
      <button
        type="button"
        onClick={isLoggedIn ? onOptimize : onLogin}
        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-slate-800"
      >
        <span>{isLoggedIn ? '✨' : '🔓'}</span>
        {isLoggedIn ? 'Optimize with AI' : 'Unlock Full Report'}
      </button>
    </div>
  );
}
