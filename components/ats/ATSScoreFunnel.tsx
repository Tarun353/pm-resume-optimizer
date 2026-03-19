'use client';

import { useMemo, useState } from 'react';
import { CTAUnlock } from '@/components/ats/CTAUnlock';
import { BlurredInsights } from '@/components/ats/BlurredInsights';
import { PersonaSelector } from '@/components/ats/PersonaSelector';
import type { ATSPersona } from '@/components/ats/PersonaSelector';
import { ResumeUpload } from '@/components/ats/ResumeUpload';
import { ScoreBreakdown } from '@/components/ats/ScoreBreakdown';
import { ScoreCard } from '@/components/ats/ScoreCard';
import { scoreResumeForPersona } from '@/lib/atsFunnel';

interface ATSScoreFunnelProps {
  isLoggedIn: boolean;
  onLogin: () => void;
  onOptimize: () => void;
}

const DEMO_RESUME_TEXT = `Product-minded builder who partnered with design and engineering to launch features, run user research, and improve activation by 18%. Built dashboards in SQL and led roadmap planning across cross-functional stakeholders.`;

export function ATSScoreFunnel({ isLoggedIn, onLogin, onOptimize }: ATSScoreFunnelProps) {
  const [persona, setPersona] = useState<ATSPersona | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Always use DEMO_RESUME_TEXT — client-side PDF binary decode is unreliable
  const result = useMemo(() => {
    if (!persona || !fileName) return null;
    return scoreResumeForPersona(persona, DEMO_RESUME_TEXT, fileName);
  }, [fileName, persona]);

  const handleFileSelect = (file: File) => {
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setUploadError('Please upload a PDF resume.');
      return;
    }

    setUploadError(null);
    setIsUploading(true);
    setFileName(file.name);

    // Simulate brief processing delay for UX feel
    window.setTimeout(() => setIsUploading(false), 600);
  };

  const currentStep = !persona ? 1 : !fileName ? 2 : isLoggedIn ? 4 : 3;

  return (
    <section className="mb-10 rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-xl shadow-slate-200/40 backdrop-blur-sm sm:p-8 animate-fadeInUp">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" />
            Free · PM Keyword Signal Checker
          </span>
          <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            See which PM keywords your resume might be missing.
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Pick your persona, upload a PDF, get a sample ATS signal — then use the{' '}
            <span className="font-semibold text-blue-600">full optimizer below</span> for a real
            JD-matched result.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-medium text-slate-500">
          {[1, 2, 3, 4].map((step) => (
            <span
              key={step}
              className={`rounded-full px-3 py-1 transition-all duration-300 ${
                currentStep >= step
                  ? 'bg-slate-900 text-white scale-105'
                  : 'bg-slate-100 text-slate-500'
              }`}
            >
              Step {step}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        {/* Left: Inputs */}
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Step 1</p>
            <h3 className="mt-2 text-lg font-semibold text-slate-900">Select your PM persona</h3>
            <p className="mt-1 text-sm text-slate-500">
              We adjust scoring emphasis based on where you are in your PM journey.
            </p>
            <div className="mt-4">
              <PersonaSelector value={persona} onChange={setPersona} />
            </div>
          </div>

          <div
            className={`rounded-3xl border p-5 transition-all duration-300 ${
              persona
                ? 'border-blue-200 bg-blue-50/40'
                : 'border-slate-200 bg-slate-50 opacity-60'
            }`}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Step 2</p>
            <h3 className="mt-2 text-lg font-semibold text-slate-900">Upload your resume</h3>
            <p className="mt-1 text-sm text-slate-500">PDF only. Instant sample keyword signal.</p>
            <div className="mt-4">
              <ResumeUpload
                fileName={fileName}
                isUploading={isUploading}
                error={uploadError}
                onFileSelect={handleFileSelect}
              />
            </div>
          </div>
        </div>

        {/* Right: Score */}
        <div className="space-y-6">
          {result ? (
            <div className="animate-scaleIn space-y-4">
              <ScoreCard score={result.score} />
              <ScoreBreakdown breakdown={result.breakdown} />
            </div>
          ) : (
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
              <p className="font-semibold text-slate-700">Step 3 · Score reveal</p>
              <p className="mt-2">
                Once a persona and PDF are in place, we show your sample ATS score and keyword
                breakdown here.
              </p>
              {/* Placeholder shimmer blocks */}
              <div className="mt-4 space-y-3">
                <div className="h-24 rounded-2xl shimmer" />
                <div className="h-16 rounded-2xl shimmer" />
              </div>
            </div>
          )}
        </div>
      </div>

      {result && (
        <div className="mt-6 space-y-4 animate-fadeInUp">
          {/* Disclaimer */}
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800 flex items-start gap-2">
            <span className="text-base leading-none mt-0.5">⚠️</span>
            <span>
              <strong>Sample signal only.</strong> This score is based on common PM resume patterns,
              not your actual resume content. For a real JD-specific keyword match, use the{' '}
              <strong>full optimizer below</strong> — paste your resume + any job description.
            </span>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <BlurredInsights insights={result.insights} unlocked={isLoggedIn} />
            <CTAUnlock isLoggedIn={isLoggedIn} onLogin={onLogin} onOptimize={onOptimize} />
          </div>
        </div>
      )}
    </section>
  );
}
