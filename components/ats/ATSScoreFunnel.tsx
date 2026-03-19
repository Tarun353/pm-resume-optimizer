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
  const [resumeText, setResumeText] = useState('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const result = useMemo(() => {
    if (!persona || !fileName) {
      return null;
    }

    return scoreResumeForPersona(persona, resumeText || DEMO_RESUME_TEXT, fileName);
  }, [fileName, persona, resumeText]);

  const handleFileSelect = async (file: File) => {
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setUploadError('Please upload a PDF resume for the ATS score checker.');
      return;
    }

    setUploadError(null);
    setIsUploading(true);
    setFileName(file.name);

    try {
      const buffer = await file.arrayBuffer();
      const decoded = new TextDecoder('utf-8').decode(buffer);
      const cleanedText = decoded.replace(/[^\x20-\x7E\n]/g, ' ').replace(/\s+/g, ' ').trim();
      setResumeText(cleanedText || DEMO_RESUME_TEXT);
    } catch (error) {
      console.error('Failed to read resume file for ATS funnel:', error);
      setResumeText(DEMO_RESUME_TEXT);
    } finally {
      window.setTimeout(() => setIsUploading(false), 450);
    }
  };

  const currentStep = !persona ? 1 : !fileName ? 2 : isLoggedIn ? 4 : 3;

  return (
    <section className="mb-10 rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-xl shadow-slate-200/40 backdrop-blur-sm sm:p-8">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <span className="inline-flex rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
            New · PM Resume ATS Score Checker
          </span>
          <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Turn a resume upload into an instant PM-fit score.
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Pick your persona, upload a PDF, get an instant ATS score, then unlock the full report after login.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-medium text-slate-500">
          {[1, 2, 3, 4].map((step) => (
            <span
              key={step}
              className={`rounded-full px-3 py-1 transition-colors ${
                currentStep >= step ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500'
              }`}
            >
              Step {step}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Step 1</p>
            <h3 className="mt-2 text-lg font-semibold text-slate-900">Select your PM persona</h3>
            <p className="mt-1 text-sm text-slate-500">We adjust the mock scoring emphasis based on where you are in your PM journey.</p>
            <div className="mt-4">
              <PersonaSelector value={persona} onChange={setPersona} />
            </div>
          </div>

          <div className={`rounded-3xl border p-5 transition-all duration-300 ${persona ? 'border-blue-200 bg-blue-50/40' : 'border-slate-200 bg-slate-50 opacity-70'}`}>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Step 2</p>
            <h3 className="mt-2 text-lg font-semibold text-slate-900">Upload your resume</h3>
            <p className="mt-1 text-sm text-slate-500">PDF only for now. We use a lightweight client-side placeholder parser for this MVP.</p>
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

        <div className="space-y-6">
          {result ? (
            <>
              <ScoreCard score={result.score} />
              <ScoreBreakdown breakdown={result.breakdown} />
            </>
          ) : (
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
              <p className="font-semibold text-slate-700">Step 3 · Score reveal</p>
              <p className="mt-2">Once a persona and PDF are in place, we animate the ATS score and breakdown here.</p>
            </div>
          )}
        </div>
      </div>

      {result && (
        <div className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <BlurredInsights insights={result.insights} unlocked={isLoggedIn} />
          <CTAUnlock isLoggedIn={isLoggedIn} onLogin={onLogin} onOptimize={onOptimize} />
        </div>
      )}
    </section>
  );
}
