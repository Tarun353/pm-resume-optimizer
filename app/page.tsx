'use client';

import { useState, useCallback, useRef } from 'react';
import { ResumeData, InputMode, CareerStage } from '@/lib/types';

// ─── Icons ────────────────────────────────────────────────────────────────────
function UploadIcon() {
  return (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className ?? 'w-3.5 h-3.5 shrink-0'} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg className="animate-spin h-4 w-4 text-white inline" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}

// ─── Career Stage Options ─────────────────────────────────────────────────────
const CAREER_STAGES: Array<{
  value: CareerStage;
  label: string;
  description: string;
  icon: string;
}> = [
  {
    value: 'fresher',
    label: 'Fresh Graduate',
    description: '<1 year experience · Education first',
    icon: '🎓',
  },
  {
    value: 'experienced',
    label: 'Experienced Professional',
    description: '2+ years experience · Experience first',
    icon: '💼',
  },
  {
    value: 'career-change',
    label: 'Career Transition',
    description: 'Switching industries · Skills first',
    icon: '🔄',
  },
];

// ─── Section summary chip ──────────────────────────────────────────────────────
function SectionChip({ label, count, present }: { label: string; count?: number; present: boolean }) {
  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium ${
      present ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-slate-50 text-slate-400 border border-slate-200'
    }`}>
      {present
        ? <CheckIcon className="w-3 h-3 shrink-0 text-green-500" />
        : <span className="w-3 h-3 shrink-0 rounded-full border border-slate-300 inline-block" />}
      {label}{count !== undefined && count > 0 ? ` (${count})` : ''}
    </div>
  );
}

// ─── Keywords badge list ───────────────────────────────────────────────────────
function KeywordBadges({ keywords }: { keywords: string[] }) {
  if (!keywords.length) return null;
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5">
      <p className="text-xs font-semibold text-blue-800 mb-2">🔑 Keywords Injected ({keywords.length})</p>
      <div className="flex flex-wrap gap-1.5">
        {keywords.map(kw => (
          <span key={kw} className="bg-white border border-blue-200 text-blue-700 text-xs px-2 py-0.5 rounded-full">
            {kw}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Changes list ──────────────────────────────────────────────────────────────
function ChangesList({ changes }: { changes: string[] }) {
  if (!changes?.length) return null;
  return (
    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5">
      <p className="text-xs font-semibold text-emerald-800 mb-2">✨ AI Improvements ({changes.length})</p>
      <ul className="space-y-1.5">
        {changes.map((c, i) => (
          <li key={i} className="flex items-start gap-2 text-xs text-emerald-700">
            <CheckIcon className="w-3 h-3 shrink-0 text-emerald-500 mt-0.5" />
            <span>{c}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── Resume section summary ────────────────────────────────────────────────────
function ResumeSectionSummary({ resume }: { resume: ResumeData }) {
  const sections = [
    { label: 'Name',           present: !!resume.personal?.name },
    { label: 'Summary',        present: !!resume.summary },
    { label: 'Experience',     present: (resume.experience?.length ?? 0) > 0,  count: resume.experience?.length },
    { label: 'Education',      present: (resume.education?.length ?? 0) > 0,   count: resume.education?.length },
    { label: 'Skills',         present: (resume.skills?.length ?? 0) > 0,      count: resume.skills?.length },
    { label: 'Certifications', present: (resume.certifications?.length ?? 0) > 0, count: resume.certifications?.length },
    { label: 'Awards',         present: (resume.awards?.length ?? 0) > 0,      count: resume.awards?.length },
    { label: 'Publications',   present: (resume.publications?.length ?? 0) > 0, count: resume.publications?.length },
    { label: 'Internships',    present: (resume.internships?.length ?? 0) > 0, count: resume.internships?.length },
    { label: 'Projects',       present: (resume.projects?.length ?? 0) > 0,    count: resume.projects?.length },
    { label: 'Soft Skills',    present: (resume.softSkills?.length ?? 0) > 0,  count: resume.softSkills?.length },
    { label: 'Other',          present: (resume.additionalSections?.length ?? 0) > 0, count: resume.additionalSections?.length },
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Detected Sections</p>
      <div className="flex flex-wrap gap-1.5">
        {sections.map(s => (
          <SectionChip key={s.label} label={s.label} count={s.count} present={s.present} />
        ))}
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function HomePage() {
  const [careerStage, setCareerStage]   = useState<CareerStage>('experienced');
  const [inputMode, setInputMode]       = useState<InputMode>('paste');
  const [resumeText, setResumeText]     = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [parsedResume, setParsedResume] = useState<ResumeData | null>(null);
  const [optimizedResume, setOptimizedResume] = useState<ResumeData | null>(null);
  const [changes, setChanges]           = useState<string[]>([]);
  const [keywords, setKeywords]         = useState<string[]>([]);
  const [isLoading, setIsLoading]       = useState(false);
  const [loadingStep, setLoadingStep]   = useState('');
  const [error, setError]               = useState<string | null>(null);
  const [isDragOver, setIsDragOver]     = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── File handling ────────────────────────────────────────────────────────
  const handleFile = useCallback((file: File) => {
    const name = file.name.toLowerCase();
    if (!name.endsWith('.pdf') && !name.endsWith('.docx')) {
      setError('Only PDF and DOCX files are supported.');
      return;
    }
    setUploadedFile(file);
    setError(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  // ── Parse ────────────────────────────────────────────────────────────────
  const parseResume = async (): Promise<ResumeData> => {
    setLoadingStep('LlamaParse reading your resume (~20 seconds)...');

    if (inputMode === 'upload' && uploadedFile) {
      const fd = new FormData();
      fd.append('file', uploadedFile);
      fd.append('careerStage', careerStage); // ← Send career stage
      const res = await fetch('/api/parse', { method: 'POST', body: fd });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? 'Parse failed'); }
      const d = await res.json();
      return d.resume as ResumeData;
    }

    const text = resumeText.trim();
    if (text.length < 10) throw new Error('Please enter your resume text.');
    const res = await fetch('/api/parse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, careerStage }), // ← Send career stage
    });
    if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? 'Parse failed'); }
    const d = await res.json();
    return d.resume as ResumeData;
  };

  // ── Optimize ─────────────────────────────────────────────────────────────
  const optimizeResumeData = async (resume: ResumeData) => {
    setLoadingStep('Rewriting summary and bullets (~30 seconds)...');
    const jd = jobDescription.trim();
    if (jd.length < 20) throw new Error('Please enter a job description (20+ characters).');

    const res = await fetch('/api/optimize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resume, jobDescription: jd }),
    });
    if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? 'Optimization failed'); }
    return res.json() as Promise<{ optimizedResume: ResumeData; changes: string[]; keywordsInjected: string[] }>;
  };

  // ── Main handler ──────────────────────────────────────────────────────────
  const handleOptimize = async () => {
    setError(null);
    setIsLoading(true);
    setOptimizedResume(null);
    setChanges([]);
    setKeywords([]);

    try {
      const parsed = await parseResume();
      setParsedResume(parsed);

      const result = await optimizeResumeData(parsed);
      setOptimizedResume(result.optimizedResume);
      setChanges(result.changes ?? []);
      setKeywords(result.keywordsInjected ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setIsLoading(false);
      setLoadingStep('');
    }
  };

  // ── Download PDF ──────────────────────────────────────────────────────────
  const handleDownloadPDF = async () => {
    if (!optimizedResume) return;
    setIsDownloading(true);
    setError(null);

    try {
      const res = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resume: optimizedResume }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? 'PDF failed'); }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const name = (optimizedResume.personal?.name ?? 'Resume').replace(/\s+/g, '_');
      a.href = url;
      a.download = `${name}_ATS_Optimized.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'PDF download failed.');
    } finally {
      setIsDownloading(false);
    }
  };

  // ── Derived ───────────────────────────────────────────────────────────────
  const canOptimize =
    !isLoading &&
    jobDescription.trim().length >= 20 &&
    (inputMode === 'paste' ? resumeText.trim().length > 10 : uploadedFile !== null);

  const fileExt = uploadedFile?.name.toLowerCase().endsWith('.pdf') ? 'pdf' : 'docx';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/30">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} 
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h1 className="font-bold text-slate-900 tracking-tight text-lg">ResumeForge</h1>
              <p className="text-xs text-slate-500">AI-Powered ATS Optimizer</p>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 pb-12">
        {/* Hero */}
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3 tracking-tight">
            Beat the ATS.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
              Land the Interview.
            </span>
          </h1>
          <p className="text-slate-500 max-w-lg mx-auto">
            AI rewrites your summary and bullets with JD-matched keywords, power verbs,
            and measurable impact — while preserving every section of your resume.
          </p>
        </div>

        {/* ── CAREER STAGE SELECTOR (NEW) ── */}
        <div className="max-w-3xl mx-auto mb-8">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">👤</span>
              <h2 className="font-semibold text-slate-900 text-sm">Select Your Career Stage</h2>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              This determines the professional section order in your final resume
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {CAREER_STAGES.map(stage => (
                <button
                  key={stage.value}
                  onClick={() => setCareerStage(stage.value)}
                  className={`relative p-4 rounded-xl border-2 text-left transition-all ${
                    careerStage === stage.value
                      ? 'border-blue-500 bg-blue-50 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                  }`}>
                  <div className="text-2xl mb-2">{stage.icon}</div>
                  <p className="font-semibold text-sm text-slate-900 mb-1">{stage.label}</p>
                  <p className="text-xs text-slate-500">{stage.description}</p>
                  {careerStage === stage.value && (
                    <div className="absolute top-2 right-2">
                      <CheckIcon className="w-4 h-4 text-blue-600" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

          {/* ── LEFT: Inputs ── */}
          <div className="space-y-4">

            {/* Resume input */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-slate-900 text-sm">Your Resume</h2>
                  <p className="text-xs text-slate-400 mt-0.5">All sections preserved</p>
                </div>
                <div className="flex bg-slate-100 rounded-lg p-0.5">
                  <button
                    onClick={() => { setInputMode('paste'); setUploadedFile(null); }}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                      inputMode === 'paste' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                    }`}>
                    Paste Text
                  </button>
                  <button
                    onClick={() => { setInputMode('upload'); setResumeText(''); }}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                      inputMode === 'upload' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                    }`}>
                    Upload File
                  </button>
                </div>
              </div>

              <div className="p-4">
                {inputMode === 'paste' ? (
                  <textarea
                    value={resumeText}
                    onChange={e => setResumeText(e.target.value)}
                    placeholder={`Paste your full resume here...\n\nTip: Include all sections:\n• Summary\n• Experience\n• Education\n• Skills\n• Certifications\n• Awards\n• Projects\n• etc.`}
                    className="w-full h-56 text-sm text-slate-700 placeholder-slate-300 bg-slate-50 border border-slate-200 rounded-xl p-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all font-mono"
                  />
                ) : (
                  <div>
                    <div
                      onDrop={handleDrop}
                      onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
                      onDragLeave={() => setIsDragOver(false)}
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                        isDragOver ? 'border-blue-400 bg-blue-50'
                        : uploadedFile ? 'border-green-300 bg-green-50'
                        : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-slate-100'
                      }`}>
                      {uploadedFile ? (
                        <div className="flex items-center justify-center gap-3">
                          <div className={`flex items-center justify-center w-10 h-10 rounded-lg font-bold text-xs uppercase ${
                            fileExt === 'pdf' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                            {fileExt}
                          </div>
                          <div className="text-left">
                            <p className="text-sm font-medium text-slate-900 truncate max-w-48">{uploadedFile.name}</p>
                            <p className="text-xs text-slate-400">{(uploadedFile.size / 1024).toFixed(0)} KB · Click to replace</p>
                          </div>
                        </div>
                      ) : (
                        <div className="text-slate-400">
                          <div className="flex justify-center mb-2"><UploadIcon /></div>
                          <p className="text-sm font-medium text-slate-600">Drop your resume here</p>
                          <p className="text-xs text-slate-400 mt-1">PDF or DOCX · Up to 10MB</p>
                        </div>
                      )}
                    </div>
                    <input ref={fileInputRef} type="file" accept=".pdf,.docx"
                      onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
                      className="hidden" />
                  </div>
                )}
              </div>
            </div>

            {/* Job description */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-3.5 border-b border-slate-100">
                <h2 className="font-semibold text-slate-900 text-sm">Job Description</h2>
                <p className="text-xs text-slate-400 mt-0.5">Keywords extracted automatically</p>
              </div>
              <div className="p-4">
                <textarea
                  value={jobDescription}
                  onChange={e => setJobDescription(e.target.value)}
                  placeholder="Paste the full job description here — the more detail, the better the keyword matching..."
                  className="w-full h-44 text-sm text-slate-700 placeholder-slate-300 bg-slate-50 border border-slate-200 rounded-xl p-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
                />
                <div className="flex items-center justify-between mt-1.5">
                  <p className="text-xs text-slate-400">{jobDescription.length} chars</p>
                  {jobDescription.length >= 20 && (
                    <span className="text-xs text-green-600 flex items-center gap-1 font-medium">
                      <CheckIcon /> Ready for analysis
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Optimize button */}
            <button
              onClick={handleOptimize}
              disabled={!canOptimize}
              className={`w-full py-4 rounded-2xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
                canOptimize
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/20'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}>
              {isLoading ? (
                <><SpinnerIcon /><span className="ml-1">{loadingStep || 'Working...'}</span></>
              ) : (
                <><span>✨</span> Optimize My Resume</>
              )}
            </button>

            {/* Hint */}
            {!canOptimize && !isLoading && (
              <p className="text-xs text-center text-slate-400">
                {inputMode === 'paste' && resumeText.trim().length <= 10
                  ? '① Add your resume text'
                  : inputMode === 'upload' && !uploadedFile
                  ? '① Upload a resume file'
                  : '② Add a job description (20+ chars)'}
              </p>
            )}
          </div>

          {/* ── RIGHT: Results ── */}
          <div className="space-y-4">

            {/* Empty state */}
            {!parsedResume && !isLoading && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">📄</span>
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">Your Optimized Resume Appears Here</h3>
                <p className="text-sm text-slate-400 max-w-xs mx-auto mb-6">
                  Sections ordered professionally based on your career stage. All content preserved.
                </p>
                <div className="grid grid-cols-2 gap-2.5 text-left">
                  {[
                    { icon: '📋', title: 'Pro Order', desc: `${CAREER_STAGES.find(s => s.value === careerStage)?.icon} ${CAREER_STAGES.find(s => s.value === careerStage)?.label}` },
                    { icon: '🎯', title: 'JD Match', desc: 'Keywords extracted' },
                    { icon: '💪', title: 'Power Verbs', desc: 'Weak verbs replaced' },
                    { icon: '🛡️', title: 'ATS-Safe', desc: 'All sections kept' },
                  ].map(f => (
                    <div key={f.title} className="bg-slate-50 rounded-xl p-3">
                      <div className="text-lg mb-1">{f.icon}</div>
                      <p className="text-xs font-semibold text-slate-700">{f.title}</p>
                      <p className="text-xs text-slate-400">{f.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Loading */}
            {isLoading && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center">
                <div className="flex justify-center mb-4">
                  <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                </div>
                <p className="font-semibold text-slate-900 mb-1">AI is optimizing...</p>
                <p className="text-sm text-slate-400">{loadingStep}</p>
                <div className="mt-4 space-y-1">
                  {['LlamaParse extracting layout...', 'Groq structuring sections...', 'Optimizing for ATS...'].map((step, i) => (
                    <div key={step} className="flex items-center gap-2 text-xs text-slate-400 justify-center">
                      <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: `${i * 200}ms` }}></div>
                      {step}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="text-sm font-semibold text-red-800">⚠️ Error</p>
                <p className="text-sm text-red-600 mt-1">{error}</p>
              </div>
            )}

            {/* Parsed (before optimization) */}
            {parsedResume && !optimizedResume && !isLoading && (
              <ResumeSectionSummary resume={parsedResume} />
            )}

            {/* Optimized results */}
            {optimizedResume && !isLoading && (
              <>
                <KeywordBadges keywords={keywords} />
                <ChangesList changes={changes} />
                <ResumeSectionSummary resume={optimizedResume} />

                {/* Download */}
                <button
                  onClick={handleDownloadPDF}
                  disabled={isDownloading}
                  className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:from-slate-200 disabled:to-slate-300 disabled:text-slate-400 text-white rounded-2xl text-sm font-semibold transition-all duration-200 shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2">
                  {isDownloading
                    ? <><SpinnerIcon /><span className="ml-1">Generating PDF...</span></>
                    : <><span>⬇️</span> Download ATS-Optimized PDF</>}
                </button>

                <p className="text-xs text-center text-slate-400">
                  Professional A4 PDF · Sections in {CAREER_STAGES.find(s => s.value === careerStage)?.label} order · ATS-friendly
                </p>

                {/* Re-optimize hint */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
                  <strong>Tip:</strong> Not satisfied? Edit the job description or change your career stage, then click Optimize again.
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-slate-200 text-center space-y-1">
          <p className="text-xs text-slate-400">
            ResumeForge · Next.js 14 · Groq AI · LlamaParse · Puppeteer PDF
          </p>
          <p className="text-xs text-slate-300">
            Resume data is processed server-side only and never stored.
          </p>
        </div>
      </div>
    </div>
  );
}
