'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { ResumeData, InputMode, CareerStage, ParseResponse } from '@/lib/types';
import { useAuth } from '@/lib/AuthContext';
import { LoginModal } from '@/components/LoginModal';
import { PaymentModal } from '@/components/PaymentModal';
import { supabase } from '@/lib/supabase';
import { Navbar } from '@/components/Navbar';
import { PMLoadingScreen } from '@/components/PMLoadingScreen';
import { detectMissingPMKeywords } from '@/lib/pmAnalyzer';

export const dynamic = 'force-dynamic';

// ─── Sample resume for demo ────────────────────────────────────────────────────
const SAMPLE_PM_RESUME = `Rahul Sharma
rahul.sharma@email.com | +91 98765 43210 | Bangalore, India
linkedin.com/in/rahulsharmapm

PROFESSIONAL SUMMARY
Product Manager with 3 years of experience at early-stage startups, driving 0-to-1 product development and scaling features across fintech and edtech domains. Led cross-functional teams of 8+ to ship data-driven features improving user retention by 22%.

WORK EXPERIENCE
Product Manager — FinEdge Technologies, Bangalore (Jan 2022 – Present)
• Owned end-to-end roadmap for lending product serving 150K+ users, increasing loan disbursals by 35%
• Conducted 40+ user interviews to identify friction in KYC flow, reducing drop-off by 28%
• Led A/B testing framework rollout across 3 product verticals; drove 18% improvement in activation
• Collaborated with engineering and design to ship 12 features in 4 quarters with <5% rollback rate

Associate Product Manager — Learnify, Bangalore (Jun 2020 – Dec 2021)
• Defined and prioritized features for B2B dashboard used by 200+ schools
• Built go-to-market strategy for new assessment module, achieving 60% adoption in 3 months
• Worked with data team to create retention dashboards tracking DAU/MAU, churn, and NPS

EDUCATION
B.Tech Computer Science — VIT University (2016–2020) | CGPA: 8.4

SKILLS
Product Strategy, Roadmap Planning, A/B Testing, SQL, User Research, Agile/Scrum, JIRA, Mixpanel, Amplitude, Figma, Go-to-Market, Stakeholder Management

CERTIFICATIONS
Product Management Certificate — Reforge (2022)`;

// ─── Derive CareerStage from pmProfile ────────────────────────────────────────
function getCareerStageFromProfile(profile: string): CareerStage {
  if (profile === 'aspiring') return 'fresher';
  if (profile === 'transitioning') return 'career-change';
  return 'experienced';
}

// ─── Icons ─────────────────────────────────────────────────────────────────────
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

function CloseIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  );
}

function GripIcon() {
  return (
    <svg className="w-5 h-5 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
      <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

// ─── AI Rewrite Button ─────────────────────────────────────────────────────────
function AIButton({
  text,
  onRewrite,
  sectionType,
}: {
  text: string;
  onRewrite: (newText: string) => void;
  sectionType: string;
}) {
  const [showModal, setShowModal] = useState(false);
  const [originalText, setOriginalText] = useState('');
  const [instruction, setInstruction] = useState('');
  const [isRewriting, setIsRewriting] = useState(false);

  const openRewriteModal = () => {
    setOriginalText(text || '');
    setInstruction('');
    setShowModal(true);
  };

  useEffect(() => {
    if (showModal) setOriginalText(text || '');
  }, [showModal, text]);

  const handleRewrite = async () => {
    if (!originalText.trim() || !instruction.trim()) return;
    setIsRewriting(true);
    try {
      const res = await fetch('/api/ai-rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: originalText, instruction, context: { sectionType } }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to rewrite text');
      onRewrite(data.rewritten);
      setShowModal(false);
      setInstruction('');
    } catch (err) {
      console.error('AI rewrite failed:', err);
    } finally {
      setIsRewriting(false);
    }
  };

  return (
    <>
      <button
        onClick={openRewriteModal}
        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
        title="Rewrite with AI">
        ✨
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full mx-4 shadow-2xl animate-scaleIn">
            <h3 className="font-bold text-lg mb-4">✨ AI Rewrite</h3>

            <div className="mb-4">
              <label className="text-sm font-medium text-slate-700 block mb-2">Original:</label>
              <div className="p-3 bg-slate-50 rounded-xl text-sm text-slate-600 border border-slate-200">
                {originalText.substring(0, 200)}{originalText.length > 200 && '...'}
              </div>
            </div>

            <div className="mb-4">
              <label className="text-sm font-medium text-slate-700 block mb-2">
                What changes do you want?
              </label>
              <textarea
                value={instruction}
                onChange={e => setInstruction(e.target.value)}
                placeholder="e.g., Make it more senior, add metrics, align with PM role..."
                className="w-full h-24 p-3 border border-slate-300 rounded-xl text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              />
            </div>

            <div className="flex gap-2 mb-4 flex-wrap">
              {['Make it more senior level', 'Add specific metrics and impact', 'Make it more product management focused'].map(s => (
                <button
                  key={s}
                  onClick={() => setInstruction(s)}
                  className="px-3 py-1.5 text-xs bg-slate-100 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-colors">
                  {s}
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setShowModal(false); setInstruction(''); }}
                className="flex-1 py-2.5 border border-slate-300 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors">
                Cancel
              </button>
              <button
                onClick={handleRewrite}
                disabled={isRewriting || !instruction.trim()}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-xl text-sm font-semibold transition-colors">
                {isRewriting ? 'Rewriting...' : '✨ Rewrite'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Section constants ─────────────────────────────────────────────────────────
const SECTION_NAMES: Record<string, string> = {
  summary: '📝 Professional Summary',
  experience: '💼 Work Experience',
  internships: '🎓 Internships',
  education: '🎓 Education',
  certifications: '🏆 Certifications',
  awards: '🥇 Awards & Honors',
  publications: '📚 Publications',
  projects: '🚀 Projects',
  skills: '⚙️ Technical Skills',
  softSkills: '💡 Core Competencies',
};

const DEFAULT_SECTIONS = [
  'summary', 'experience', 'internships', 'education', 'skills',
  'projects', 'certifications', 'awards', 'publications', 'softSkills',
  'additional:Achievements', 'additional:Languages',
];

const OPTIONAL_MODAL_SECTIONS = [
  { key: 'summary', label: 'Professional Summary' },
  { key: 'projects', label: 'Projects' },
  { key: 'certifications', label: 'Certifications' },
  { key: 'awards', label: 'Awards' },
  { key: 'publications', label: 'Publications' },
  { key: 'skills', label: 'Skills' },
  { key: 'additional:Languages', label: 'Languages' },
  { key: 'additional:Volunteer Experience', label: 'Volunteer Experience' },
  { key: 'additional:Leadership Experience', label: 'Leadership Experience' },
];

const REQUIRED_SECTIONS = ['experience'];

// ─── Helper components ─────────────────────────────────────────────────────────
function SectionChip({ label, count, present }: { label: string; count?: number; present: boolean }) {
  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
      present
        ? 'bg-green-50 text-green-700 border border-green-200'
        : 'bg-slate-50 text-slate-400 border border-slate-200'
    }`}>
      {present
        ? <CheckIcon className="w-3 h-3 shrink-0 text-green-500" />
        : <span className="w-3 h-3 shrink-0 rounded-full border border-slate-300 inline-block" />}
      {label}{count !== undefined && count > 0 ? ` (${count})` : ''}
    </div>
  );
}

function KeywordBadges({ keywords }: { keywords: string[] }) {
  if (!keywords.length) return null;
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 animate-fadeInUp">
      <p className="text-xs font-semibold text-blue-800 mb-3">
        🔑 Keywords Injected ({keywords.length})
      </p>
      <div className="flex flex-wrap gap-1.5">
        {keywords.map((kw, i) => (
          <span
            key={kw}
            className="bg-white border border-blue-200 text-blue-700 text-xs px-2.5 py-1 rounded-full animate-popIn"
            style={{ animationDelay: `${i * 40}ms` }}
          >
            {kw}
          </span>
        ))}
      </div>
    </div>
  );
}

function ChangesList({ changes }: { changes: string[] }) {
  if (!changes?.length) return null;
  return (
    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 animate-fadeInUp stagger-2">
      <p className="text-xs font-semibold text-emerald-800 mb-3">
        ✨ AI Improvements ({changes.length})
      </p>
      <ul className="space-y-2">
        {changes.map((c, i) => (
          <li
            key={i}
            className="flex items-start gap-2 text-xs text-emerald-700 animate-fadeInUp"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <CheckIcon className="w-3 h-3 shrink-0 text-emerald-500 mt-0.5" />
            <span>{c}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ResumeSectionSummary({ resume }: { resume: ResumeData }) {
  const sections = [
    { label: 'Name',           present: !!resume.personal?.name },
    { label: 'Summary',        present: !!resume.summary },
    { label: 'Experience',     present: (resume.experience?.length ?? 0) > 0,    count: resume.experience?.length },
    { label: 'Education',      present: (resume.education?.length ?? 0) > 0,     count: resume.education?.length },
    { label: 'Skills',         present: (resume.skills?.length ?? 0) > 0,        count: resume.skills?.length },
    { label: 'Certifications', present: (resume.certifications?.length ?? 0) > 0, count: resume.certifications?.length },
    { label: 'Awards',         present: (resume.awards?.length ?? 0) > 0,        count: resume.awards?.length },
    { label: 'Publications',   present: (resume.publications?.length ?? 0) > 0,  count: resume.publications?.length },
    { label: 'Internships',    present: (resume.internships?.length ?? 0) > 0,   count: resume.internships?.length },
    { label: 'Projects',       present: (resume.projects?.length ?? 0) > 0,      count: resume.projects?.length },
    { label: 'Soft Skills',    present: (resume.softSkills?.length ?? 0) > 0,    count: resume.softSkills?.length },
    { label: 'Other',          present: (resume.additionalSections?.length ?? 0) > 0, count: resume.additionalSections?.length },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 animate-fadeInUp">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Detected Sections</p>
      <div className="flex flex-wrap gap-1.5">
        {sections.map(s => (
          <SectionChip key={s.label} label={s.label} count={s.count} present={s.present} />
        ))}
      </div>
    </div>
  );
}

function OriginalResumeTextFallback({ rawText }: { rawText: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'failed'>('idle');

  if (!rawText.trim()) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(rawText);
      setCopyStatus('copied');
    } catch {
      setCopyStatus('failed');
    }
    setTimeout(() => setCopyStatus('idle'), 2000);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className="w-full text-left text-sm font-semibold text-slate-800 hover:text-slate-950 transition-colors flex items-center justify-between"
      >
        <span>{isOpen ? 'Hide Original Resume Text' : 'Show Original Resume Text'}</span>
        <span className="text-slate-400 text-xs">{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div className="space-y-2 animate-fadeIn">
          <div className="max-h-56 overflow-auto rounded-xl border border-slate-200 bg-slate-50 p-3">
            <pre className="whitespace-pre-wrap break-words text-xs text-slate-700 font-mono">{rawText}</pre>
          </div>
          <button
            type="button"
            onClick={handleCopy}
            className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
          >
            {copyStatus === 'copied' ? '✓ Copied!' : copyStatus === 'failed' ? 'Copy Failed' : 'Copy Text'}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Section Reorder ───────────────────────────────────────────────────────────
interface SectionReorderProps {
  sectionOrder: string[];
  onReorder: (newOrder: string[]) => void;
}

function SectionReorder({ sectionOrder, onReorder }: SectionReorderProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = (index: number) => setDraggedIndex(index);

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null); setDragOverIndex(null); return;
    }
    const newOrder = [...sectionOrder];
    const [removed] = newOrder.splice(draggedIndex, 1);
    newOrder.splice(dropIndex, 0, removed!);
    onReorder(newOrder);
    setDraggedIndex(null); setDragOverIndex(null);
  };

  const handleDragEnd = () => { setDraggedIndex(null); setDragOverIndex(null); };

  const getSectionName = (key: string): string => {
    if (key.startsWith('additional:')) return `📄 ${key.replace('additional:', '')}`;
    return SECTION_NAMES[key] || key;
  };

  return (
    <div className="space-y-2">
      {sectionOrder.map((section, index) => {
        const isDragging = draggedIndex === index;
        const isOver = dragOverIndex === index;
        return (
          <div
            key={section}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
            className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all cursor-move ${
              isDragging ? 'opacity-40 scale-95 border-blue-300 bg-blue-50'
              : isOver    ? 'border-blue-500 bg-blue-50 shadow-md'
              : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
            }`}>
            <div className="cursor-grab active:cursor-grabbing"><GripIcon /></div>
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-900">{getSectionName(section)}</p>
            </div>
            <span className="text-xs text-slate-400 font-mono">#{index + 1}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Section helpers ───────────────────────────────────────────────────────────
function getInitialActiveSections(resume: ResumeData): string[] {
  const base = resume.sectionOrder?.length ? [...resume.sectionOrder] : [...DEFAULT_SECTIONS];
  for (const sec of resume.additionalSections ?? []) {
    const key = `additional:${sec.heading}`;
    if (sec.heading?.trim() && !base.includes(key)) base.push(key);
  }
  return Array.from(new Set(base));
}

function sectionHasContent(resume: ResumeData, section: string): boolean {
  if (section.startsWith('additional:')) {
    const heading = section.replace(/^additional:/, '').trim();
    const entry = (resume.additionalSections ?? []).find(s => s.heading.trim() === heading);
    return !!entry && ((entry.items?.length ?? 0) > 0 || !!entry.rawContent?.trim());
  }
  switch (section) {
    case 'summary':        return !!resume.summary?.trim();
    case 'experience':     return (resume.experience?.length ?? 0) > 0;
    case 'internships':    return (resume.internships?.length ?? 0) > 0;
    case 'education':      return (resume.education?.length ?? 0) > 0;
    case 'skills':         return (resume.skills?.length ?? 0) > 0;
    case 'projects':       return (resume.projects?.length ?? 0) > 0;
    case 'certifications': return (resume.certifications?.length ?? 0) > 0;
    case 'awards':         return (resume.awards?.length ?? 0) > 0;
    case 'publications':   return (resume.publications?.length ?? 0) > 0;
    case 'softSkills':     return (resume.softSkills?.length ?? 0) > 0;
    default:               return false;
  }
}

// ─── Editable Preview Modal ────────────────────────────────────────────────────
interface EditablePreviewModalProps {
  resume: ResumeData;
  rawResumeText: string;
  onClose: () => void;
  onDownload: () => void;
  onResumeChange: (newResume: ResumeData) => void;
  isDownloading: boolean;
  isDocxUpload: boolean;
  isLocked: boolean;
  onUpgrade: () => void;
}

function EditablePreviewModal({
  resume, rawResumeText, onClose, onDownload, onResumeChange,
  isDownloading, isDocxUpload, isLocked, onUpgrade,
}: EditablePreviewModalProps) {
  const [editedResume, setEditedResume] = useState<ResumeData>(JSON.parse(JSON.stringify(resume)));
  const [previewHTML, setPreviewHTML] = useState<string>('');
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [activeTab, setActiveTab] = useState<'edit' | 'reorder'>('edit');
  const [showOriginalText, setShowOriginalText] = useState(false);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'failed'>('idle');
  const [activeSections, setActiveSections] = useState<string[]>(() => getInitialActiveSections(resume));
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [showAddSectionModal, setShowAddSectionModal] = useState(false);
  const [customSectionName, setCustomSectionName] = useState('');

  const previewDebounceRef = useRef<NodeJS.Timeout | null>(null);

  const handleCopyOriginalText = async () => {
    if (isLocked) return;
    try {
      await navigator.clipboard.writeText(rawResumeText);
      setCopyStatus('copied');
    } catch {
      setCopyStatus('failed');
    }
    setTimeout(() => setCopyStatus('idle'), 2000);
  };

  const regeneratePreview = useCallback(async () => {
    setIsLoadingPreview(true);
    try {
      const response = await fetch('/api/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resume: editedResume }),
      });
      if (response.ok) setPreviewHTML(await response.text());
    } catch (err) {
      console.error('Preview generation failed:', err);
    } finally {
      setIsLoadingPreview(false);
    }
  }, [editedResume]);

  const debouncedRegeneratePreview = useCallback(() => {
    if (previewDebounceRef.current) clearTimeout(previewDebounceRef.current);
    previewDebounceRef.current = setTimeout(() => { regeneratePreview(); }, 1200);
  }, [regeneratePreview]);

  useEffect(() => { regeneratePreview(); }, []);

  const applyResumeUpdate = async (updated: ResumeData) => {
    setEditedResume(updated);
    onResumeChange(updated);
    debouncedRegeneratePreview();
  };

  const updateSummary = (newSummary: string) => {
    const updated = { ...editedResume, summary: newSummary };
    setEditedResume(updated);
    onResumeChange(updated);
    debouncedRegeneratePreview();
  };

  const updateExperienceBullet = (expIndex: number, bulletIndex: number, newText: string) => {
    const updated = { ...editedResume };
    if (updated.experience[expIndex]) {
      updated.experience[expIndex]!.bullets[bulletIndex] = newText;
      setEditedResume(updated); onResumeChange(updated);
      debouncedRegeneratePreview();
    }
  };

  const addExperienceBullet = (expIndex: number) => {
    const updated = { ...editedResume };
    if (updated.experience[expIndex]) {
      updated.experience[expIndex]!.bullets.push('New bullet point - click to edit');
      setEditedResume(updated); onResumeChange(updated); regeneratePreview();
    }
  };

  const deleteExperienceBullet = (expIndex: number, bulletIndex: number) => {
    const updated = { ...editedResume };
    if (updated.experience[expIndex]) {
      updated.experience[expIndex]!.bullets = updated.experience[expIndex]!.bullets.filter((_, i) => i !== bulletIndex);
      setEditedResume(updated); onResumeChange(updated); regeneratePreview();
    }
  };

  const updateInternshipBullet = (intIndex: number, bulletIndex: number, newText: string) => {
    const updated = { ...editedResume };
    if (updated.internships && updated.internships[intIndex]) {
      updated.internships[intIndex]!.bullets[bulletIndex] = newText;
      setEditedResume(updated); onResumeChange(updated);
      debouncedRegeneratePreview();
    }
  };

  const addInternshipBullet = (intIndex: number) => {
    const updated = { ...editedResume };
    if (updated.internships && updated.internships[intIndex]) {
      updated.internships[intIndex]!.bullets.push('New bullet point - click to edit');
      setEditedResume(updated); onResumeChange(updated); regeneratePreview();
    }
  };

  const deleteInternshipBullet = (intIndex: number, bulletIndex: number) => {
    const updated = { ...editedResume };
    if (updated.internships && updated.internships[intIndex]) {
      updated.internships[intIndex]!.bullets = updated.internships[intIndex]!.bullets.filter((_, i) => i !== bulletIndex);
      setEditedResume(updated); onResumeChange(updated); regeneratePreview();
    }
  };

  const updateField = async (section: keyof ResumeData, value: unknown) => {
    const updated = { ...editedResume, [section]: value } as ResumeData;
    await applyResumeUpdate(updated);
  };

  const updateArrayEntry = async (section: keyof ResumeData, index: number, field: string, value: string) => {
    const list = ([...(((editedResume as unknown as Record<string, unknown>)[section] as Record<string, unknown>[]) ?? [])]);
    const row = { ...(list[index] ?? {}) };
    row[field] = value;
    list[index] = row;
    await updateField(section, list);
  };

  const addArrayEntry = async (section: keyof ResumeData, entry: Record<string, unknown>) => {
    const list = ([...(((editedResume as unknown as Record<string, unknown>)[section] as Record<string, unknown>[]) ?? [])]);
    list.push(entry);
    await updateField(section, list);
  };

  const deleteArrayEntry = async (section: keyof ResumeData, index: number) => {
    const list = ([...(((editedResume as unknown as Record<string, unknown>)[section] as Record<string, unknown>[]) ?? [])]);
    await updateField(section, list.filter((_, i) => i !== index));
  };

  const getEntryText = (entry: unknown, fields: string[]): string => {
    const objectEntry = (entry ?? {}) as Record<string, unknown>;
    for (const field of fields) {
      const value = objectEntry[field];
      if (typeof value === 'string') return value;
    }
    return '';
  };

  const getAdditionalSection = (section: string) => {
    if (!section.startsWith('additional:')) return null;
    const heading = section.replace(/^additional:/, '').trim();
    return (editedResume.additionalSections || []).find(sec => sec.heading.trim() === heading) ?? null;
  };

  const getAdditionalSectionItems = (section: string): string[] => {
    const entry = getAdditionalSection(section);
    if (!entry) return [];
    if (Array.isArray(entry.items) && entry.items.length > 0) {
      return entry.items.filter(item => typeof item === 'string' && item.trim().length > 0);
    }
    if (typeof entry.rawContent === 'string' && entry.rawContent.trim().length > 0) {
      return entry.rawContent.split('\n').map(item => item.trim()).filter(Boolean);
    }
    return [];
  };

  const updateAdditionalSectionItems = async (section: string, items: string[]) => {
    const updated: ResumeData = { ...editedResume };
    const heading = section.replace(/^additional:/, '').trim();
    const existing = [...(updated.additionalSections ?? [])];
    const idx = existing.findIndex(item => item.heading.trim() === heading);
    const sanitizedItems = items.map(item => item.trim()).filter(Boolean);
    const next = { heading, items: sanitizedItems, rawContent: sanitizedItems.join('\n') };
    if (idx >= 0) existing[idx] = next; else existing.push(next);
    updated.additionalSections = existing;
    await applyResumeUpdate(updated);
  };

  const updateAdditionalSectionItem = async (section: string, itemIndex: number, value: string) => {
    const current = getAdditionalSectionItems(section);
    current[itemIndex] = value;
    await updateAdditionalSectionItems(section, current);
  };

  const updateAliasedArrayEntry = async (
    section: keyof ResumeData, index: number,
    primaryField: string, aliases: string[], value: string,
  ) => {
    const list = ([...(((editedResume as unknown as Record<string, unknown>)[section] as Record<string, unknown>[]) ?? [])]);
    const row = { ...(list[index] ?? {}) };
    row[primaryField] = value;
    aliases.forEach(alias => { if (alias !== primaryField && typeof row[alias] === 'string') row[alias] = value; });
    list[index] = row;
    await updateField(section, list);
  };

  const updateProjectBullet = async (projectIndex: number, bulletIndex: number, value: string) => {
    const projects = ([...(((editedResume.projects as unknown as Record<string, unknown>[]) ?? []))]);
    const project = { ...(projects[projectIndex] ?? {}) };
    const bullets = Array.isArray(project.bullets) ? [...(project.bullets as string[])] : [];
    bullets[bulletIndex] = value;
    project.bullets = bullets;
    projects[projectIndex] = project;
    await updateField('projects', projects);
  };

  const deleteProjectBullet = async (projectIndex: number, bulletIndex: number) => {
    const projects = ([...(((editedResume.projects as unknown as Record<string, unknown>[]) ?? []))]);
    const project = { ...(projects[projectIndex] ?? {}) };
    const bullets = Array.isArray(project.bullets) ? [...(project.bullets as string[])] : [];
    bullets.splice(bulletIndex, 1);
    project.bullets = bullets;
    projects[projectIndex] = project;
    await updateField('projects', projects);
  };

  const addProjectBullet = async (projectIndex: number) => {
    const projects = ([...(((editedResume.projects as unknown as Record<string, unknown>[]) ?? []))]);
    const project = { ...(projects[projectIndex] ?? {}) };
    const bullets = Array.isArray(project.bullets) ? [...(project.bullets as string[])] : [];
    bullets.push('New bullet point - click to edit');
    project.bullets = bullets;
    projects[projectIndex] = project;
    await updateField('projects', projects);
  };

  const addSection = async (sectionName: string) => {
    if (activeSections.includes(sectionName)) return;
    const nextActive = [...activeSections, sectionName];
    setActiveSections(nextActive);
    setSelectedSection(sectionName);
    const updated: ResumeData = {
      ...editedResume,
      sectionOrder: [...editedResume.sectionOrder.filter(s => s !== sectionName), sectionName],
    };
    if (sectionName.startsWith('additional:')) {
      const heading = sectionName.replace(/^additional:/, '').trim();
      updated.additionalSections = updated.additionalSections ?? [];
      if (!updated.additionalSections.find(sec => sec.heading.trim() === heading)) {
        updated.additionalSections.push({ heading, items: [], rawContent: '' });
      }
    }
    await applyResumeUpdate(updated);
  };

  const addCustomSection = async () => {
    const heading = customSectionName.trim();
    if (!heading) return;
    await addSection(`additional:${heading}`);
    setCustomSectionName(''); setShowAddSectionModal(false);
  };

  const removeSection = async (sectionName: string) => {
    if (REQUIRED_SECTIONS.includes(sectionName)) return;
    if (!window.confirm('Remove this section from the resume?')) return;
    const nextActive = activeSections.filter(s => s !== sectionName);
    setActiveSections(nextActive);
    if (selectedSection === sectionName) setSelectedSection(null);
    const updated: ResumeData = {
      ...editedResume,
      sectionOrder: editedResume.sectionOrder.filter(s => s !== sectionName),
    };
    if (sectionName.startsWith('additional:')) {
      const heading = sectionName.replace(/^additional:/, '').trim();
      updated.additionalSections = (updated.additionalSections ?? []).filter(s => s.heading.trim() !== heading);
    }
    await applyResumeUpdate(updated);
  };

  const updateSectionOrder = async (newOrder: string[]) => {
    const filteredOrder = newOrder.filter(section => activeSections.includes(section));
    const updated = { ...editedResume, sectionOrder: filteredOrder };
    setEditedResume(updated); onResumeChange(updated);
    regeneratePreview();
  };

  return (
    <div className="fixed inset-0 z-50 flex bg-black/60 backdrop-blur-sm animate-fadeIn">
      {isLocked && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/65 backdrop-blur-sm">
          <div className="rounded-2xl border border-indigo-200 bg-white p-6 text-center shadow-xl animate-scaleIn">
            <p className="text-sm font-semibold text-slate-900">Upgrade to unlock preview</p>
            <p className="mt-1 text-xs text-slate-600">Generation quota exhausted.</p>
            <button onClick={onUpgrade} className="mt-4 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors">
              Upgrade Now
            </button>
          </div>
        </div>
      )}

      {/* LEFT: Editor */}
      <div className={`w-1/2 bg-white overflow-auto flex flex-col ${isLocked ? 'blur-sm pointer-events-none select-none' : ''}`}>
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold text-slate-900 text-xl flex items-center gap-2">
                <EditIcon /> Edit Your Resume
              </h2>
              <p className="text-sm text-slate-500 mt-1">Edit content or drag to reorder sections</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
              <CloseIcon />
            </button>
          </div>

          <div className="flex gap-2">
            {[
              { id: 'edit' as const, icon: <EditIcon />, label: 'Edit Content' },
              { id: 'reorder' as const, icon: <MenuIcon />, label: 'Reorder Sections' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                  activeTab === tab.id
                    ? 'bg-blue-100 text-blue-700 shadow-sm'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}>
                {tab.icon}{tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6">
          {activeTab === 'edit' && (
            <>
              {!selectedSection ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-slate-900">Sections</h3>
                    <button
                      onClick={() => setShowAddSectionModal(true)}
                      className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition-colors">
                      <PlusIcon /> Add Section
                    </button>
                  </div>
                  <div className="space-y-2">
                    {activeSections.map((section) => (
                      <div key={section} className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-2.5 hover:border-slate-300 transition-colors">
                        <button
                          onClick={() => setSelectedSection(section)}
                          className="text-sm font-medium text-slate-700 hover:text-blue-700 transition-colors">
                          {SECTION_NAMES[section] || section.replace('additional:', '')} →
                        </button>
                        <button
                          onClick={() => removeSection(section)}
                          disabled={REQUIRED_SECTIONS.includes(section)}
                          className="text-xs text-red-500 hover:text-red-700 disabled:text-slate-300 transition-colors">
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <button onClick={() => setSelectedSection(null)} className="mb-4 text-sm text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1">
                    ← Back to sections
                  </button>
                  <div className="mb-4 flex items-center justify-between gap-2">
                    <h3 className="text-lg font-semibold text-slate-900">
                      {SECTION_NAMES[selectedSection] || selectedSection.replace('additional:', '')}
                    </h3>
                  </div>

                  {selectedSection === 'summary' && (
                    <div className="flex items-start gap-2">
                      <textarea value={editedResume.summary} onChange={(e) => updateSummary(e.target.value)}
                        className="w-full min-h-[120px] rounded-xl border border-slate-300 p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none transition" />
                      <AIButton text={editedResume.summary || ''} onRewrite={(newText) => updateSummary(newText)} sectionType="summary" />
                    </div>
                  )}

                  {selectedSection === 'skills' && (
                    <textarea value={(editedResume.skills || []).join('\n')}
                      onChange={(e) => updateField('skills', e.target.value.split('\n').map(v => v.trim()).filter(Boolean))}
                      className="w-full min-h-[140px] rounded-xl border border-slate-300 p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none transition"
                      placeholder="One skill per line" />
                  )}

                  {selectedSection === 'softSkills' && (
                    <textarea value={(editedResume.softSkills || []).join('\n')}
                      onChange={(e) => updateField('softSkills', e.target.value.split('\n').map(v => v.trim()).filter(Boolean))}
                      className="w-full min-h-[120px] rounded-xl border border-slate-300 p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none transition"
                      placeholder="One competency per line" />
                  )}

                  {selectedSection === 'education' && (
                    <div className="space-y-4">
                      {(editedResume.education || []).map((edu, index) => (
                        <div key={index} className="rounded-xl border border-slate-200 p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-slate-700">Education {index + 1}</p>
                            <button onClick={() => deleteArrayEntry('education', index)} className="text-xs text-red-500 hover:text-red-700 transition-colors">Delete</button>
                          </div>
                          {[['degree', 'Degree'], ['institution', 'Institution'], ['location', 'Location'], ['gpa', 'GPA'], ['notes', 'Notes']].map(([field, placeholder]) => (
                            <input key={field} value={(edu as any)[field] || ''} onChange={(e) => updateArrayEntry('education', index, field, e.target.value)}
                              placeholder={placeholder} className="w-full rounded-lg border border-slate-200 p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition" />
                          ))}
                          <div className="grid grid-cols-2 gap-2">
                            <input value={edu.startDate || ''} onChange={(e) => updateArrayEntry('education', index, 'startDate', e.target.value)}
                              placeholder="Start Date" className="rounded-lg border border-slate-200 p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition" />
                            <input value={edu.endDate || ''} onChange={(e) => updateArrayEntry('education', index, 'endDate', e.target.value)}
                              placeholder="End Date" className="rounded-lg border border-slate-200 p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition" />
                          </div>
                        </div>
                      ))}
                      <button onClick={() => addArrayEntry('education', { degree: '', institution: '', startDate: '', endDate: '', gpa: '', notes: '', bullets: [] })}
                        className="text-sm text-blue-600 hover:text-blue-800 transition-colors">+ Add Education</button>
                    </div>
                  )}

                  {selectedSection === 'experience' && (
                    <div className="space-y-4">
                      {(editedResume.experience || []).map((exp, expIndex) => (
                        <div key={expIndex} className="rounded-xl border border-slate-200 p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-slate-700">Experience {expIndex + 1}</p>
                            <button onClick={() => deleteArrayEntry('experience', expIndex)} className="text-xs text-red-500 hover:text-red-700 transition-colors">Delete</button>
                          </div>
                          <input value={exp.company || ''} onChange={(e) => updateArrayEntry('experience', expIndex, 'company', e.target.value)}
                            placeholder="Company" className="w-full rounded-lg border border-slate-200 p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition" />
                          <input value={exp.title || ''} onChange={(e) => updateArrayEntry('experience', expIndex, 'title', e.target.value)}
                            placeholder="Role" className="w-full rounded-lg border border-slate-200 p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition" />
                          <div className="grid grid-cols-2 gap-2">
                            <input value={exp.startDate || ''} onChange={(e) => updateArrayEntry('experience', expIndex, 'startDate', e.target.value)}
                              placeholder="Start Date" className="rounded-lg border border-slate-200 p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition" />
                            <input value={exp.endDate || ''} onChange={(e) => updateArrayEntry('experience', expIndex, 'endDate', e.target.value)}
                              placeholder="End Date" className="rounded-lg border border-slate-200 p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition" />
                          </div>
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide pt-1">Bullets</p>
                          {(exp.bullets || []).map((bullet, bulletIndex) => (
                            <div key={bulletIndex} className="flex items-center gap-2">
                              <input value={bullet} onChange={(e) => updateExperienceBullet(expIndex, bulletIndex, e.target.value)}
                                className="flex-1 rounded-lg border border-slate-200 p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition" />
                              <AIButton text={bullet} onRewrite={(newText) => updateExperienceBullet(expIndex, bulletIndex, newText)} sectionType="bullet" />
                              <button onClick={() => deleteExperienceBullet(expIndex, bulletIndex)} className="text-xs text-red-500 hover:text-red-700 transition-colors">✕</button>
                            </div>
                          ))}
                          <button onClick={() => addExperienceBullet(expIndex)} className="text-sm text-blue-600 hover:text-blue-800 transition-colors">+ Add bullet</button>
                        </div>
                      ))}
                      <button onClick={() => addArrayEntry('experience', { company: '', title: '', startDate: '', endDate: '', bullets: [] })}
                        className="text-sm text-blue-600 hover:text-blue-800 transition-colors">+ Add Work Experience</button>
                    </div>
                  )}

                  {selectedSection === 'internships' && (
                    <div className="space-y-4">
                      {(editedResume.internships || []).map((item, intIndex) => (
                        <div key={intIndex} className="rounded-xl border border-slate-200 p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-slate-700">Internship {intIndex + 1}</p>
                            <button onClick={() => deleteArrayEntry('internships', intIndex)} className="text-xs text-red-500 hover:text-red-700 transition-colors">Delete</button>
                          </div>
                          <input value={item.company || ''} onChange={(e) => updateArrayEntry('internships', intIndex, 'company', e.target.value)}
                            placeholder="Company" className="w-full rounded-lg border border-slate-200 p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition" />
                          <input value={item.title || ''} onChange={(e) => updateArrayEntry('internships', intIndex, 'title', e.target.value)}
                            placeholder="Role" className="w-full rounded-lg border border-slate-200 p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition" />
                          <div className="grid grid-cols-2 gap-2">
                            <input value={item.startDate || ''} onChange={(e) => updateArrayEntry('internships', intIndex, 'startDate', e.target.value)}
                              placeholder="Start Date" className="rounded-lg border border-slate-200 p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition" />
                            <input value={item.endDate || ''} onChange={(e) => updateArrayEntry('internships', intIndex, 'endDate', e.target.value)}
                              placeholder="End Date" className="rounded-lg border border-slate-200 p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition" />
                          </div>
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide pt-1">Bullets</p>
                          {(item.bullets || []).map((bullet, bulletIndex) => (
                            <div key={bulletIndex} className="flex items-center gap-2">
                              <input value={bullet} onChange={(e) => updateInternshipBullet(intIndex, bulletIndex, e.target.value)}
                                className="flex-1 rounded-lg border border-slate-200 p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition" />
                              <AIButton text={bullet} onRewrite={(newText) => updateInternshipBullet(intIndex, bulletIndex, newText)} sectionType="bullet" />
                              <button onClick={() => deleteInternshipBullet(intIndex, bulletIndex)} className="text-xs text-red-500">✕</button>
                            </div>
                          ))}
                          <button onClick={() => addInternshipBullet(intIndex)} className="text-sm text-blue-600 hover:text-blue-800 transition-colors">+ Add bullet</button>
                        </div>
                      ))}
                      <button onClick={() => addArrayEntry('internships', { company: '', title: '', startDate: '', endDate: '', bullets: [] })}
                        className="text-sm text-blue-600 hover:text-blue-800 transition-colors">+ Add Internship</button>
                    </div>
                  )}

                  {selectedSection === 'certifications' && (
                    <div className="space-y-3">
                      {(editedResume.certifications || []).map((cert, index) => (
                        <div key={index} className="rounded-xl border border-slate-200 p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-slate-700">Certification {index + 1}</p>
                            <button onClick={() => deleteArrayEntry('certifications', index)} className="text-xs text-red-500">Delete</button>
                          </div>
                          <div className="flex gap-2">
                            <input value={getEntryText(cert, ['name', 'title'])} onChange={(e) => updateAliasedArrayEntry('certifications', index, 'name', ['title'], e.target.value)}
                              placeholder="Certification Name" className="w-full rounded-lg border border-slate-200 p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition" />
                            <AIButton text={getEntryText(cert, ['name', 'title'])} onRewrite={(newText) => { void updateAliasedArrayEntry('certifications', index, 'name', ['title'], newText); }} sectionType="generic" />
                          </div>
                          <input value={cert.issuer || ''} onChange={(e) => updateArrayEntry('certifications', index, 'issuer', e.target.value)}
                            placeholder="Issuer" className="w-full rounded-lg border border-slate-200 p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition" />
                          <input value={cert.date || ''} onChange={(e) => updateArrayEntry('certifications', index, 'date', e.target.value)}
                            placeholder="Date" className="w-full rounded-lg border border-slate-200 p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition" />
                        </div>
                      ))}
                      <button onClick={() => addArrayEntry('certifications', { name: '', issuer: '', date: '' })} className="text-sm text-blue-600 hover:text-blue-800 transition-colors">+ Add Certification</button>
                    </div>
                  )}

                  {selectedSection === 'awards' && (
                    <div className="space-y-3">
                      {(editedResume.awards || []).map((award, index) => (
                        <div key={index} className="rounded-xl border border-slate-200 p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-slate-700">Award {index + 1}</p>
                            <button onClick={() => deleteArrayEntry('awards', index)} className="text-xs text-red-500">Delete</button>
                          </div>
                          <input value={getEntryText(award, ['title', 'name'])} onChange={(e) => updateAliasedArrayEntry('awards', index, 'title', ['name'], e.target.value)}
                            placeholder="Award Title" className="w-full rounded-lg border border-slate-200 p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition" />
                          <input value={award.issuer || ''} onChange={(e) => updateArrayEntry('awards', index, 'issuer', e.target.value)}
                            placeholder="Issuer" className="w-full rounded-lg border border-slate-200 p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition" />
                          <input value={award.date || ''} onChange={(e) => updateArrayEntry('awards', index, 'date', e.target.value)}
                            placeholder="Date" className="w-full rounded-lg border border-slate-200 p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition" />
                          <div className="flex gap-2">
                            <textarea value={award.description || ''} onChange={(e) => updateArrayEntry('awards', index, 'description', e.target.value)}
                              placeholder="Description" className="w-full rounded-lg border border-slate-200 p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition resize-none" />
                            <AIButton text={award.description || ''} onRewrite={(newText) => { void updateArrayEntry('awards', index, 'description', newText); }} sectionType="generic" />
                          </div>
                        </div>
                      ))}
                      <button onClick={() => addArrayEntry('awards', { title: '', issuer: '', date: '', description: '' })} className="text-sm text-blue-600 hover:text-blue-800 transition-colors">+ Add Award</button>
                    </div>
                  )}

                  {selectedSection === 'projects' && (
                    <div className="space-y-3">
                      {(editedResume.projects || []).map((project, index) => (
                        <div key={index} className="rounded-xl border border-slate-200 p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-slate-700">Project {index + 1}</p>
                            <button onClick={() => deleteArrayEntry('projects', index)} className="text-xs text-red-500">Delete</button>
                          </div>
                          <input value={getEntryText(project, ['name', 'title'])} onChange={(e) => updateAliasedArrayEntry('projects', index, 'name', ['title'], e.target.value)}
                            placeholder="Project Name" className="w-full rounded-lg border border-slate-200 p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition" />
                          <input value={project.link || ''} onChange={(e) => updateArrayEntry('projects', index, 'link', e.target.value)}
                            placeholder="Project Link (optional)" className="w-full rounded-lg border border-slate-200 p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition" />
                          <div className="flex gap-2">
                            <textarea value={project.description || ''} onChange={(e) => updateArrayEntry('projects', index, 'description', e.target.value)}
                              placeholder="Description" className="w-full rounded-lg border border-slate-200 p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none transition" />
                            <AIButton text={project.description || ''} onRewrite={(newText) => { void updateArrayEntry('projects', index, 'description', newText); }} sectionType="generic" />
                          </div>
                          {(project.bullets || []).map((bullet, bulletIndex) => (
                            <div key={bulletIndex} className="flex gap-2">
                              <textarea value={bullet} onChange={(e) => updateProjectBullet(index, bulletIndex, e.target.value)}
                                className="w-full rounded-lg border border-slate-200 p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none transition" />
                              <AIButton text={bullet} onRewrite={(newText) => { void updateProjectBullet(index, bulletIndex, newText); }} sectionType="bullet" />
                              <button onClick={() => deleteProjectBullet(index, bulletIndex)} className="text-xs text-red-500 mt-1">✕</button>
                            </div>
                          ))}
                          <button onClick={() => addProjectBullet(index)} className="text-sm text-blue-600 hover:text-blue-800 transition-colors">+ Add bullet</button>
                        </div>
                      ))}
                      <button onClick={() => addArrayEntry('projects', { name: '', description: '', technologies: [], bullets: [], link: '' })}
                        className="text-sm text-blue-600 hover:text-blue-800 transition-colors">+ Add Project</button>
                    </div>
                  )}

                  {selectedSection.startsWith('additional:') && (
                    <div className="space-y-2">
                      {getAdditionalSectionItems(selectedSection).map((item, itemIndex) => (
                        <div key={itemIndex} className="flex gap-2">
                          <input value={item} onChange={(e) => updateAdditionalSectionItem(selectedSection, itemIndex, e.target.value)}
                            className="flex-1 rounded-lg border border-slate-200 p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition" />
                          <AIButton text={item} onRewrite={(newText) => { void updateAdditionalSectionItem(selectedSection, itemIndex, newText); }} sectionType="generic" />
                        </div>
                      ))}
                      <button onClick={() => { void updateAdditionalSectionItems(selectedSection, [...getAdditionalSectionItems(selectedSection), 'New bullet - click to edit']); }}
                        className="text-sm text-blue-600 hover:text-blue-800 transition-colors">+ Add bullet</button>
                    </div>
                  )}
                </div>
              )}

              {showAddSectionModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                  <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl animate-scaleIn">
                    <div className="mb-3 flex items-center justify-between">
                      <h4 className="text-lg font-semibold">Add Section</h4>
                      <button onClick={() => setShowAddSectionModal(false)}><CloseIcon /></button>
                    </div>
                    <div className="space-y-2">
                      {OPTIONAL_MODAL_SECTIONS.map((section) => (
                        <button key={section.key} onClick={async () => { await addSection(section.key); setShowAddSectionModal(false); }}
                          className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-left text-sm hover:bg-slate-50 hover:border-blue-300 transition-all">
                          {section.label}
                        </button>
                      ))}
                    </div>
                    <div className="mt-5 border-t border-slate-200 pt-4">
                      <h5 className="text-sm font-semibold text-slate-800 mb-2">Create Custom Section</h5>
                      <input value={customSectionName} onChange={(e) => setCustomSectionName(e.target.value)}
                        placeholder="Section name (e.g., Volunteering)"
                        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition" />
                      <button onClick={addCustomSection} disabled={!customSectionName.trim()}
                        className="mt-2 w-full rounded-xl bg-blue-600 px-3 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:bg-slate-300 transition-colors">
                        Add Section
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700 mt-4">
                <strong>💡 Tip:</strong> Click ✨ next to any bullet or summary to rewrite it with AI.
              </div>
            </>
          )}

          {activeTab === 'reorder' && (
            <>
              <div className="mb-5">
                <div className="flex items-center gap-2 mb-2">
                  <LockIcon />
                  <p className="text-sm font-semibold text-slate-900">Personal Info (Always First)</p>
                </div>
                <div className="p-3 bg-slate-100 border-2 border-slate-300 rounded-xl">
                  <p className="text-sm font-medium text-slate-700">
                    👤 {editedResume.personal?.name || 'Your Name'}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">Contact info always appears first</p>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-sm font-semibold text-slate-900 mb-1 flex items-center gap-2">
                  <GripIcon /> Drag to Reorder
                </p>
                <p className="text-xs text-slate-500">Changes appear in the preview instantly.</p>
              </div>

              <SectionReorder
                sectionOrder={editedResume.sectionOrder.filter(section => activeSections.includes(section))}
                onReorder={updateSectionOrder}
              />

              <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">
                <strong>💡 Pro Tip:</strong> Put your strongest section near the top — Experience for senior PMs, Education for freshers.
              </div>
            </>
          )}
        </div>
      </div>

      {/* RIGHT: Live Preview */}
      <div className="w-1/2 bg-slate-100 flex flex-col">
        <div className="bg-white border-b border-slate-200 px-6 py-4">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <EyeIcon />
              <h2 className="font-bold text-slate-900 text-lg">Live Preview</h2>
            </div>
            <div className="flex items-center gap-2">
              {rawResumeText.trim() && (
                <button onClick={() => setShowOriginalText(prev => !prev)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors">
                  {showOriginalText ? 'Hide Original' : 'Show Original Text'}
                </button>
              )}
              <button onClick={() => regeneratePreview()} disabled={isLoadingPreview}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-lg text-xs font-medium transition-colors">
                {isLoadingPreview ? <><SpinnerIcon /><span>Refreshing...</span></> : '↻ Refresh'}
              </button>
            </div>
          </div>
          <p className="text-xs text-slate-500">Updates ~1.2s after you finish typing</p>

          {showOriginalText && rawResumeText.trim() && (
            <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2 animate-fadeIn">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Original Resume Text</p>
                <button onClick={handleCopyOriginalText}
                  className="px-2.5 py-1 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors">
                  {copyStatus === 'copied' ? '✓ Copied!' : 'Copy'}
                </button>
              </div>
              <div className="max-h-40 overflow-auto rounded-lg border border-slate-200 bg-white p-2.5">
                <pre className="whitespace-pre-wrap break-words text-xs text-slate-700 font-mono">{rawResumeText}</pre>
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-auto p-6">
          {isLoadingPreview ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="relative w-14 h-14 mx-auto mb-4">
                  <div className="w-14 h-14 border-4 border-blue-100 rounded-full" />
                  <div className="w-14 h-14 border-4 border-blue-600 border-t-transparent rounded-full animate-spin absolute inset-0" />
                </div>
                <p className="text-slate-600 text-sm font-medium">Updating preview...</p>
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto bg-white shadow-xl rounded-lg overflow-hidden">
              <iframe srcDoc={previewHTML} className="w-full h-[800px] border-0" title="Resume Preview" />
            </div>
          )}
        </div>

        <div className="bg-white border-t border-slate-200 px-6 py-4 flex items-center justify-between">
          <p className="text-xs text-slate-500">
            {isDocxUpload ? '📄 Format preserved · Download keeps your template' : 'ATS-friendly template · Ready to download'}
          </p>
          <div className="flex gap-3">
            <button onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-xl transition-colors">
              Close
            </button>
            <button onClick={onDownload} disabled={isDownloading || isLocked}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-slate-300 disabled:to-slate-400 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2 btn-press">
              {isDownloading ? <><SpinnerIcon /><span className="ml-1">Generating...</span></> : <><span>⬇️</span> Download PDF</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Feedback Form ─────────────────────────────────────────────────────────────
function FeedbackForm() {
  const [text, setText] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  const handleSubmit = async () => {
    if (!text.trim()) return;
    setStatus('sending');
    try {
      await fetch('https://formspree.io/f/mkoqvkrr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });
      setStatus('sent'); setText('');
    } catch { setStatus('error'); }
  };

  if (status === 'sent') {
    return (
      <div className="flex items-center gap-2 py-4 text-emerald-600 animate-fadeIn">
        <span className="text-xl">✓</span>
        <p className="text-sm font-medium">Thanks! We'll look into it.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <textarea value={text} onChange={e => setText(e.target.value)}
        placeholder="e.g. The internship section didn't show up..."
        rows={3}
        className="w-full text-sm border border-slate-200 rounded-xl p-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all placeholder-slate-300 text-slate-700" />
      {status === 'error' && <p className="text-xs text-red-500">Something went wrong. Try WhatsApp instead.</p>}
      <button onClick={handleSubmit} disabled={!text.trim() || status === 'sending'}
        className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl text-sm font-semibold transition-all btn-press">
        {status === 'sending' ? 'Sending...' : 'Send Feedback'}
      </button>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function HomePage() {
  const [inputMode, setInputMode]           = useState<InputMode>('paste');
  const [resumeText, setResumeText]         = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [uploadedFile, setUploadedFile]     = useState<File | null>(null);
  const [parsedResume, setParsedResume]     = useState<ResumeData | null>(null);
  const [optimizedResume, setOptimizedResume] = useState<ResumeData | null>(null);
  const [changes, setChanges]               = useState<string[]>([]);
  const [keywords, setKeywords]             = useState<string[]>([]);
  const [isLoading, setIsLoading]           = useState(false);
  const [loadingStep, setLoadingStep]       = useState('');
  const [error, setError]                   = useState<string | null>(null);
  const [isDragOver, setIsDragOver]         = useState(false);
  const [isDownloading, setIsDownloading]   = useState(false);
  const [showPreview, setShowPreview]       = useState(false);
  const [uploadSubMode, setUploadSubMode]   = useState<'pdf' | 'docx'>('pdf');
  const [coverLetter, setCoverLetter]       = useState<string>('');
  const [showCoverLetterPreview, setShowCoverLetterPreview] = useState(false);
  const [rawResumeText, setRawResumeText]   = useState('');
  const [pmProfile, setPmProfile]           = useState('aspiring');
  const [originalDocx, setOriginalDocx]     = useState<string | null>(null);
  const [originalResume, setOriginalResume] = useState<ResumeData | null>(null);
  const [isDocxUpload, setIsDocxUpload]     = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const { user, dbUser, refreshUser } = useAuth();
  const fileInputRef  = useRef<HTMLInputElement>(null);
  const optimizerRef  = useRef<HTMLDivElement>(null);

  // ── Pre-fill from /score page ────────────────────────────────────────────────
  useEffect(() => {
    const saved = sessionStorage.getItem('optimizeState');
    if (!saved) return;
    try {
      const state = JSON.parse(saved) as {
        resumeText?: string; jdText?: string; profile?: string; timestamp?: number;
      };
      if (state.timestamp && Date.now() - state.timestamp > 30 * 60 * 1000) {
        sessionStorage.removeItem('optimizeState'); return;
      }
      if (state.resumeText) setResumeText(state.resumeText);
      if (state.jdText)     setJobDescription(state.jdText);
      if (state.profile)    setPmProfile(state.profile);
      setInputMode('paste');
      sessionStorage.removeItem('optimizeState');
    } catch {
      sessionStorage.removeItem('optimizeState');
    }
  }, []);

  const saveStateBeforeLogin = () => {
    const state = {
      resumeText, jobDescription, parsedResume, optimizedResume,
      coverLetter, rawResumeText, uploadedFileName: uploadedFile?.name || null,
      inputMode, pmProfile, timestamp: Date.now(),
    };
    sessionStorage.setItem('resumeState', JSON.stringify(state));
  };

  const restoreStateAfterLogin = () => {
    const savedState = sessionStorage.getItem('resumeState');
    if (!savedState) return false;
    try {
      const state = JSON.parse(savedState);
      if (Date.now() - state.timestamp > 10 * 60 * 1000) {
        sessionStorage.removeItem('resumeState'); return false;
      }
      setResumeText(state.resumeText || '');
      setJobDescription(state.jobDescription || '');
      setParsedResume(state.parsedResume || null);
      setOptimizedResume(state.optimizedResume || null);
      setCoverLetter(state.coverLetter || '');
      setRawResumeText(state.rawResumeText || '');
      setInputMode(state.inputMode || 'paste');
      setPmProfile(state.pmProfile || 'aspiring');
      sessionStorage.removeItem('resumeState');
      return true;
    } catch {
      sessionStorage.removeItem('resumeState'); return false;
    }
  };

  useEffect(() => {
    const handleLoginComplete = async () => {
      const restored = restoreStateAfterLogin();
      if (restored) {
        let attempts = 0;
        let session = null;
        while (!session && attempts < 20) {
          const { data } = await supabase.auth.getSession();
          session = data.session;
          if (!session) { await new Promise(resolve => setTimeout(resolve, 500)); attempts++; }
        }
        if (!session) return;
        if (optimizedResume) await handleDownloadPDF();
        else if (coverLetter) await handleDownloadCoverLetterPDF();
      }
    };
    window.addEventListener('login-complete', handleLoginComplete);
    return () => window.removeEventListener('login-complete', handleLoginComplete);
  }, [optimizedResume, coverLetter]);

  // ── File handling ────────────────────────────────────────────────────────────
  const handleFile = useCallback((file: File) => {
    const name = file.name.toLowerCase();
    if (uploadSubMode === 'pdf' && !name.endsWith('.pdf')) { setError('Please upload a PDF file.'); return; }
    if (uploadSubMode === 'docx' && !name.endsWith('.docx')) { setError('Please upload a DOCX file.'); return; }
    if (!name.endsWith('.pdf') && !name.endsWith('.docx')) { setError('Only PDF and DOCX files are supported.'); return; }
    setUploadedFile(file); setError(null);
  }, [uploadSubMode]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  // ── Parse resume ─────────────────────────────────────────────────────────────
  const parseResume = async (): Promise<ResumeData> => {
    const pastedText = resumeText.trim();
    const careerStage = getCareerStageFromProfile(pmProfile);

    if (pastedText.length > 10) {
      setLoadingStep('Parsing your resume text...');
      const res = await fetch('/api/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: pastedText, careerStage }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? 'Parse failed'); }
      const d = await res.json() as ParseResponse;
      setOriginalDocx(null); setOriginalResume(null); setIsDocxUpload(false);
      setRawResumeText(d.rawText ?? '');
      return d.resume;
    }

    setLoadingStep('Reading your resume (~20 seconds)...');

    if (inputMode === 'upload' && uploadedFile) {
      const fd = new FormData();
      fd.append('file', uploadedFile);
      fd.append('careerStage', careerStage);
      const res = await fetch('/api/parse', { method: 'POST', body: fd });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? 'Parse failed'); }
      const d = await res.json() as ParseResponse & { isDocxUpload?: boolean; originalDocx?: string };
      if (d.isDocxUpload && d.originalDocx) {
        setOriginalDocx(d.originalDocx); setOriginalResume(d.resume); setIsDocxUpload(true);
      } else {
        setOriginalDocx(null); setOriginalResume(null); setIsDocxUpload(false);
      }
      setRawResumeText(d.rawText ?? '');
      return d.resume;
    }

    throw new Error('Please upload your resume or paste resume text.');
  };

  // ── Optimize ─────────────────────────────────────────────────────────────────
  const optimizeResumeData = async (resume: ResumeData) => {
    setLoadingStep('AI is rewriting your summary and bullets (~30 seconds)...');
    const jd = jobDescription.trim();
    if (jd.length < 20) throw new Error('Please enter a job description (20+ characters).');

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) throw new Error('Please sign in to continue.');

    const res = await fetch('/api/optimize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ resume, jobDescription: jd, pmProfile }),
    });

    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      if (d.error === 'quota_exceeded') { setShowPaymentModal(true); throw new Error('quota_exceeded'); }
      throw new Error(d.error ?? 'Optimization failed');
    }
    return res.json() as Promise<{ optimizedResume: ResumeData; changes: string[]; keywordsInjected: string[] }>;
  };

  // ── Cover Letter — now self-contained, works without optimizing first ────────
  const handleGenerateCoverLetter = async () => {
    if (!user) { saveStateBeforeLogin(); setShowLoginModal(true); return; }

    setIsLoading(true);
    setError(null);
    setLoadingStep('Generating your cover letter (~20 seconds)...');

    try {
      // Parse resume first if not already done (user skipped optimization)
      let resume = parsedResume;
      if (!resume) {
        setLoadingStep('Reading your resume...');
        resume = await parseResume();
        setParsedResume(resume);
        setLoadingStep('Generating your cover letter (~20 seconds)...');
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Please sign in to continue.');

      const res = await fetch('/api/generate-cover-letter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          resume,
          jobDescription: jobDescription.trim(),
          userProfile: pmProfile,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data.error === 'quota_exceeded') { setShowPaymentModal(true); throw new Error('quota_exceeded'); }
        throw new Error(data.error ?? 'Failed to generate cover letter');
      }

      const data = await res.json();
      setCoverLetter(data.coverLetter);
      setShowCoverLetterPreview(true);
    } catch (err) {
      if (err instanceof Error && err.message === 'quota_exceeded') return;
      setError(err instanceof Error ? err.message : 'Cover letter generation failed');
    } finally {
      setIsLoading(false);
      setLoadingStep('');
    }
  };

  // ── Cover Letter PDF download ─────────────────────────────────────────────────
  const handleDownloadCoverLetterPDF = async () => {
    if (!coverLetter) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) { saveStateBeforeLogin(); setShowLoginModal(true); return; }

    try {
      const trackRes = await fetch('/api/download/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify({ type: 'coverletter' }),
      });
      if (!trackRes.ok) {
        const data = await trackRes.json();
        if (data.reason === 'limit_exceeded') { setShowPaymentModal(true); return; }
      }
    } catch {}

    setIsDownloading(true); setError(null);
    try {
      const name = parsedResume?.personal?.name || 'Applicant';
      const fileName = `${name.replace(/\s+/g, '_')}_Cover_Letter.pdf`;
      const res = await fetch('/api/generate-cover-letter-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coverLetter, fileName }),
      });
      if (!res.ok) { const data = await res.json(); throw new Error(data.error ?? 'PDF generation failed'); }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = fileName;
      document.body.appendChild(a); a.click();
      document.body.removeChild(a); URL.revokeObjectURL(url);
      await refreshUser(); setShowCoverLetterPreview(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'PDF download failed');
    } finally { setIsDownloading(false); }
  };

  // ── Main generate ─────────────────────────────────────────────────────────────
  const handleGenerate = async () => {
    setError(null);
    if (!user) { saveStateBeforeLogin(); setShowLoginModal(true); return; }

    setIsLoading(true);
    setOptimizedResume(null); setChanges([]); setKeywords([]);
    setCoverLetter(''); setRawResumeText('');

    try {
      const parsed = await parseResume();
      setParsedResume(parsed);
      const result = await optimizeResumeData(parsed);
      setOptimizedResume(result.optimizedResume);
      setChanges(result.changes ?? []);
      setKeywords(result.keywordsInjected ?? []);
    } catch (err) {
      if (err instanceof Error && err.message === 'quota_exceeded') return;
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setIsLoading(false); setLoadingStep('');
    }
  };

  // ── PDF Download ──────────────────────────────────────────────────────────────
  const handleResumeChange = (newResume: ResumeData) => setOptimizedResume(newResume);

  const handleDownloadPDF = async () => {
    if (!optimizedResume) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) { saveStateBeforeLogin(); setShowLoginModal(true); return; }

    try {
      const trackRes = await fetch('/api/download/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify({ type: 'resume' }),
      });
      if (!trackRes.ok) {
        const data = await trackRes.json();
        if (data.reason === 'limit_exceeded') { setShowPaymentModal(true); return; }
      }
    } catch {}

    setIsDownloading(true); setError(null);
    try {
      const requestBody: Record<string, unknown> = { resume: optimizedResume };
      if (isDocxUpload && originalDocx && originalResume) {
        requestBody.originalDocx = originalDocx;
        requestBody.originalResume = originalResume;
      }
      const res = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? 'PDF failed'); }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const name = (optimizedResume.personal?.name ?? 'Resume').replace(/\s+/g, '_');
      a.href = url; a.download = `${name}_ATS_Optimized.pdf`;
      document.body.appendChild(a); a.click();
      document.body.removeChild(a); URL.revokeObjectURL(url);
      await refreshUser(); setShowPreview(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'PDF download failed.');
    } finally { setIsDownloading(false); }
  };

  // ── Derived values ────────────────────────────────────────────────────────────
  const canOptimize = !isLoading && jobDescription.trim().length >= 20 &&
    (resumeText.trim().length > 10 || uploadedFile !== null);

  const analyzedResumeText = rawResumeText || resumeText;
  const pmAnalysis = detectMissingPMKeywords(analyzedResumeText);
  const pmScore = Math.max(0, 100 - (pmAnalysis.missingKeywords.length * 5));
  const showRightPanel = isLoading || !!error || !!parsedResume || !!optimizedResume || !!coverLetter;

  const now = new Date();
  const hasActivePaidPlan = dbUser?.subscription_type === 'paid' &&
    dbUser?.subscription_expires_at && new Date(dbUser.subscription_expires_at) > now;
  const isPreviewLocked = !!dbUser && !hasActivePaidPlan && (dbUser.downloads_used ?? 0) >= 5;

  const fileIsDocx = uploadedFile?.name.toLowerCase().endsWith('.docx') ?? false;
  const fileIsPdf  = uploadedFile?.name.toLowerCase().endsWith('.pdf')  ?? false;

  return (
    <>
      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)}
        onSuccess={async () => {
          setShowLoginModal(false); await refreshUser();
          window.dispatchEvent(new Event('login-complete'));
        }} />

      <PaymentModal isOpen={showPaymentModal} onClose={() => setShowPaymentModal(false)}
        onSuccess={() => setShowPaymentModal(false)} />

      {showPreview && optimizedResume && (
        <EditablePreviewModal
          resume={optimizedResume} rawResumeText={rawResumeText}
          onClose={() => setShowPreview(false)} onDownload={handleDownloadPDF}
          onResumeChange={handleResumeChange} isDownloading={isDownloading}
          isDocxUpload={isDocxUpload} isLocked={isPreviewLocked}
          onUpgrade={() => setShowPaymentModal(true)} />
      )}

      {/* Cover Letter Modal */}
      {showCoverLetterPreview && coverLetter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl mx-4 max-h-[90vh] flex flex-col animate-scaleIn">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-slate-900 text-xl">✉️ Your Cover Letter</h2>
                <p className="text-sm text-slate-500 mt-1">Review and download</p>
              </div>
              <button onClick={() => setShowCoverLetterPreview(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                <CloseIcon />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-6">
              <div className="relative max-w-3xl mx-auto bg-white shadow-lg p-12 rounded-xl">
                {isPreviewLocked && (
                  <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/70 backdrop-blur-sm rounded-xl">
                    <div className="rounded-2xl border border-indigo-200 bg-white p-6 text-center shadow-xl">
                      <p className="text-sm font-semibold text-slate-900">Upgrade to copy or download</p>
                      <p className="mt-1 text-xs text-slate-600">You've used all 5 free downloads.</p>
                      <button onClick={() => setShowPaymentModal(true)} className="mt-4 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors">
                        Upgrade Now
                      </button>
                    </div>
                  </div>
                )}
                <div className={isPreviewLocked ? 'blur-sm pointer-events-none select-none' : ''}>
                  <textarea value={coverLetter} onChange={(e) => setCoverLetter(e.target.value)}
                    disabled={isPreviewLocked}
                    className="w-full min-h-[500px] text-sm border border-slate-200 rounded-xl p-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none font-mono transition"
                    style={{ lineHeight: '1.6' }} />
                  {!isPreviewLocked && (
                    <div className="flex justify-end mt-2">
                      <AIButton text={coverLetter} onRewrite={(newText) => setCoverLetter(newText)} sectionType="generic" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between bg-slate-50">
              <p className="text-xs text-slate-500">Edit if needed, then download as PDF</p>
              <div className="flex gap-3">
                <button onClick={() => setShowCoverLetterPreview(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 rounded-xl transition-colors">
                  Close
                </button>
                <button onClick={handleDownloadCoverLetterPDF} disabled={isDownloading || isPreviewLocked}
                  className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-slate-300 disabled:to-slate-400 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2 btn-press">
                  {isDownloading ? <><SpinnerIcon /><span className="ml-1">Generating...</span></> : <><span>⬇️</span> Download PDF</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isDownloading && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/40 backdrop-blur-sm px-4">
          <div className="w-full max-w-2xl">
            <PMLoadingScreen mode="download" message="Preparing your PDF download" />
          </div>
        </div>
      )}

      {/* ── Main Layout ── */}
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/30">
        <Navbar onSignInClick={() => setShowLoginModal(true)} />

        <div className="max-w-7xl mx-auto px-6 py-10">

          {/* ── Page nav ── */}
          <div className="flex items-center justify-between mb-8 animate-fadeIn">
            <a href="/"
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-700 transition-colors bg-white border border-slate-200 hover:border-slate-300 px-3 py-1.5 rounded-full">
              ← Home
            </a>
            <button
              onClick={() => {
                if (resumeText.trim() || jobDescription.trim()) {
                  sessionStorage.setItem('scoreState', JSON.stringify({
                    resumeText,
                    jdText: jobDescription,
                    jdMode: 'paste',
                    profile: pmProfile,
                    timestamp: Date.now(),
                  }));
                }
                window.location.href = '/score';
              }}
              className="inline-flex items-center gap-2 text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 hover:border-blue-300 px-4 py-2 rounded-full transition-all">
              🎯 Check ATS Score for this resume →
            </button>
          </div>

          {/* ── Hero ── */}
          <div className="text-center mb-10 animate-fadeInUp">
            <span className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold px-4 py-2 rounded-full mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              Built exclusively for Product Managers
            </span>

            <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4 tracking-tight leading-tight">
              Optimize your resume for<br />
              <span className="gradient-text">this specific PM role.</span>
            </h1>

            <p className="text-lg text-slate-600 max-w-xl mx-auto mb-4 font-medium">
              Paste your resume + any PM job description.<br />
              AI rewrites summary + bullets, or generates a cover letter. Download in 60 seconds.
            </p>

            <div className="flex flex-wrap justify-center gap-4 mt-4 text-sm text-slate-500">
              {['✓ Aspiring PMs breaking in', '✓ PMs switching companies', '✓ Career changers moving to PM'].map(text => (
                <span key={text} className="flex items-center gap-1.5 font-medium">{text}</span>
              ))}
            </div>

            <p className="text-xs text-slate-400 mt-4">
              5 free actions · No credit card required · Results in under 60 seconds
            </p>
          </div>

          {/* ── Main Form + Results ── */}
          <div className={`grid grid-cols-1 ${showRightPanel ? 'lg:grid-cols-2' : ''} gap-6 items-start`}>

            {/* LEFT: Inputs */}
            <div className="space-y-4 animate-fadeInUp stagger-3" ref={optimizerRef}>

              {/* Resume + JD side by side */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* Resume Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden card-hover">
                  <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                    <div>
                      <h2 className="font-semibold text-slate-900">Your Resume</h2>
                      <p className="text-xs text-slate-400 mt-0.5">Paste text for best accuracy</p>
                    </div>
                    <div className="flex bg-slate-100 rounded-xl p-0.5 text-xs">
                      {[
                        { mode: 'paste' as InputMode, sub: null, label: 'Paste' },
                        { mode: 'upload' as InputMode, sub: 'pdf', label: 'PDF' },
                        { mode: 'upload' as InputMode, sub: 'docx', label: 'DOCX' },
                      ].map(({ mode, sub, label }) => {
                        const active = inputMode === mode && (sub === null ? true : uploadSubMode === sub);
                        return (
                          <button key={label}
                            onClick={() => {
                              setInputMode(mode);
                              if (sub) setUploadSubMode(sub as 'pdf' | 'docx');
                              setUploadedFile(null); setIsDocxUpload(false);
                              setOriginalDocx(null); setOriginalResume(null);
                              if (mode === 'paste') setResumeText('');
                            }}
                            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${active ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="p-4 space-y-3">
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
                      <strong>Tip:</strong> Paste text for highest accuracy. Upload if you prefer.
                    </div>

                    {inputMode === 'paste' ? (
                      <>
                        <textarea value={resumeText} onChange={e => setResumeText(e.target.value)}
                          placeholder="Paste your full resume here..."
                          className="w-full h-48 text-sm text-slate-700 placeholder-slate-300 bg-slate-50 border border-slate-200 rounded-xl p-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all font-mono" />
                        <button
                          type="button"
                          onClick={() => { setResumeText(SAMPLE_PM_RESUME); setInputMode('paste'); }}
                          className="text-xs text-blue-600 hover:text-blue-800 underline underline-offset-2 transition-colors">
                          Try with a sample PM resume →
                        </button>
                      </>
                    ) : (
                      <div className="space-y-3">
                        <div
                          onDrop={handleDrop}
                          onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
                          onDragLeave={() => setIsDragOver(false)}
                          onClick={() => fileInputRef.current?.click()}
                          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                            isDragOver     ? 'border-blue-400 bg-blue-50 scale-[1.01]'
                            : uploadedFile ? 'border-green-300 bg-green-50'
                            : 'border-slate-200 bg-slate-50 hover:border-blue-300 hover:bg-blue-50/40'
                          }`}>
                          {uploadedFile ? (
                            <div className="flex items-center justify-center gap-3">
                              <div className={`flex items-center justify-center w-10 h-10 rounded-xl font-bold text-xs uppercase ${
                                fileIsPdf ? 'bg-red-100 text-red-600' : fileIsDocx ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-600'
                              }`}>
                                {fileIsPdf ? 'PDF' : fileIsDocx ? 'DOCX' : 'FILE'}
                              </div>
                              <div className="text-left">
                                <p className="text-sm font-medium text-slate-900 truncate max-w-40">{uploadedFile.name}</p>
                                <p className="text-xs text-slate-400">{(uploadedFile.size / 1024).toFixed(0)} KB · Click to replace</p>
                              </div>
                            </div>
                          ) : (
                            <div className="text-slate-400">
                              <div className="flex justify-center mb-2 animate-float"><UploadIcon /></div>
                              <p className="text-sm font-medium text-slate-600">
                                {uploadSubMode === 'docx' ? 'Drop your Word (.docx) file here' : 'Drop your PDF here'}
                              </p>
                              <p className="text-xs text-slate-400 mt-1">Up to 10MB</p>
                            </div>
                          )}
                        </div>
                        <input ref={fileInputRef} type="file" accept={uploadSubMode === 'docx' ? '.docx' : '.pdf'}
                          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} className="hidden" />

                        <textarea value={resumeText} onChange={e => setResumeText(e.target.value)}
                          placeholder="Optional: also paste resume text to improve parsing"
                          className="w-full h-24 text-sm text-slate-700 placeholder-slate-300 bg-slate-50 border border-slate-200 rounded-xl p-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all" />
                      </div>
                    )}
                  </div>
                </div>

                {/* JD Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden card-hover">
                  <div className="px-5 py-4 border-b border-slate-100">
                    <h2 className="font-semibold text-slate-900">Job Description</h2>
                    <p className="text-xs text-slate-400 mt-0.5">Keywords extracted automatically</p>
                  </div>
                  <div className="p-4">
                    <textarea value={jobDescription} onChange={e => setJobDescription(e.target.value)}
                      placeholder={`Paste the job description here.\nThe more detail, the better the keyword matching.`}
                      className="w-full h-52 text-sm text-slate-700 placeholder-slate-300 bg-slate-50 border border-slate-200 rounded-xl p-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all" />
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-xs text-slate-400">{jobDescription.length} chars</p>
                      {jobDescription.length >= 20 && (
                        <span className="text-xs text-green-600 flex items-center gap-1 font-medium animate-fadeIn">
                          <CheckIcon /> Ready
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Profile Card */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 card-hover">
                <label htmlFor="pmProfile" className="block text-sm font-semibold text-slate-900 mb-3">
                  Your PM Profile
                </label>
                <select id="pmProfile" value={pmProfile} onChange={e => setPmProfile(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all cursor-pointer">
                  <option value="aspiring">🎓 Aspiring Product Manager (Student / Fresher)</option>
                  <option value="transitioning">🔄 Transitioning Into Product Management</option>
                  <option value="experienced">💼 Experienced Product Manager</option>
                </select>
                <p className="text-xs text-slate-400 mt-2">
                  This personalizes the AI tone, bullet style, and summary length for your career stage.
                </p>
              </div>

              {/* ── DUAL CTA — Optimize + Cover Letter side by side ── */}
              <div className="flex flex-col items-center gap-3">

                {isLoading ? (
                  <div className="w-full">
                    <PMLoadingScreen
                      mode={loadingStep.toLowerCase().includes('cover letter') ? 'cover-letter' : 'optimize'}
                      message={loadingStep || undefined}
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3 w-full">

                    {/* Optimize Resume */}
                    <button
                      onClick={handleGenerate}
                      disabled={!canOptimize}
                      className={`py-5 rounded-2xl text-sm font-bold transition-all duration-200 flex flex-col items-center justify-center gap-1.5 btn-press ${
                        canOptimize
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-xl shadow-blue-500/25 glow-blue'
                          : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      }`}>
                      <span className="text-xl">✨</span>
                      <span>Optimize Resume</span>
                      <span className={`text-xs font-normal ${canOptimize ? 'text-blue-200' : 'text-slate-400'}`}>
                        AI rewrites every bullet
                      </span>
                    </button>

                    {/* Generate Cover Letter — works independently */}
                    <button
                      onClick={handleGenerateCoverLetter}
                      disabled={!canOptimize}
                      className={`py-5 rounded-2xl text-sm font-bold transition-all duration-200 flex flex-col items-center justify-center gap-1.5 btn-press border-2 ${
                        canOptimize
                          ? 'border-blue-300 bg-white hover:bg-blue-50 hover:border-blue-500 text-blue-700 shadow-sm'
                          : 'border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed'
                      }`}>
                      <span className="text-xl">✉️</span>
                      <span>Cover Letter</span>
                      <span className={`text-xs font-normal ${canOptimize ? 'text-blue-400' : 'text-slate-400'}`}>
                        No optimization needed
                      </span>
                    </button>

                  </div>
                )}

                {!canOptimize && !isLoading && (
                  <p className="text-xs text-slate-400 text-center">
                    {inputMode === 'paste' && resumeText.trim().length <= 10
                      ? '① Add your resume text or try the sample resume'
                      : inputMode === 'upload' && !uploadedFile
                      ? `① Upload a ${uploadSubMode === 'docx' ? 'DOCX' : 'PDF'} file`
                      : '② Add a job description (20+ characters)'}
                  </p>
                )}

                <p className="text-xs text-slate-400 text-center">
                  Both use your resume + JD · 5 free actions · No card needed
                </p>
              </div>
            </div>

            {/* RIGHT: Results */}
            {showRightPanel && (
              <div className="space-y-4 animate-slideInRight">

                {/* Empty state */}
                {!parsedResume && !isLoading && (
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-float">
                      <span className="text-3xl">🎨</span>
                    </div>
                    <h3 className="font-semibold text-slate-900 mb-2">Full Control Over Your Documents</h3>
                    <p className="text-sm text-slate-400 max-w-xs mx-auto mb-6">
                      AI-optimized resume · Cover letter · Inline editing · Professional PDF
                    </p>
                    <div className="grid grid-cols-2 gap-2.5 text-left">
                      {[
                        { icon: '📄', title: 'Resume', desc: 'ATS-optimized' },
                        { icon: '✉️', title: 'Cover Letter', desc: 'AI-generated' },
                        { icon: '✏️', title: 'Edit', desc: 'Full control' },
                        { icon: '⬇️', title: 'Download', desc: 'Clean PDF' },
                      ].map((f, i) => (
                        <div key={f.title} className={`bg-slate-50 rounded-xl p-3 animate-fadeInUp stagger-${i + 1}`}>
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
                  <PMLoadingScreen
                    mode={loadingStep.toLowerCase().includes('cover letter') ? 'cover-letter' : 'optimize'}
                    message={loadingStep || undefined}
                  />
                )}

                {/* Error */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-2xl p-4 animate-fadeIn">
                    <p className="text-sm font-semibold text-red-800 mb-1">⚠️ Error</p>
                    <p className="text-sm text-red-600">{error}</p>
                    <ul className="mt-2 list-disc pl-5 text-xs text-red-700 space-y-1">
                      <li>Try again in 20–30 seconds.</li>
                      <li>If upload fails, switch to Paste Text mode.</li>
                      <li>Files must be under 10MB and in the correct format.</li>
                    </ul>
                  </div>
                )}

                {/* Parsed but not yet optimized */}
                {parsedResume && !optimizedResume && !coverLetter && !isLoading && (
                  <>
                    <ResumeSectionSummary resume={parsedResume} />
                    <OriginalResumeTextFallback rawText={rawResumeText} />
                  </>
                )}

                {/* Optimized results */}
                {optimizedResume && !isLoading && (
                  <>
                    {/* PM Score */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-4 animate-fadeInUp flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">PM Keyword Score</p>
                        <p className="text-2xl font-bold text-blue-900 mt-1">{pmScore}<span className="text-sm font-normal text-blue-600">/100</span></p>
                      </div>
                      <div className="text-4xl">
                        {pmScore >= 80 ? '🎯' : pmScore >= 60 ? '📈' : '⚡'}
                      </div>
                    </div>

                    {/* Missing keywords */}
                    {pmAnalysis.missingKeywords.length > 0 && (
                      <div className="bg-white border border-slate-200 rounded-2xl p-4 animate-fadeInUp stagger-1">
                        <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Missing PM Keywords</p>
                        <div className="flex flex-wrap gap-1.5">
                          {pmAnalysis.missingKeywords.map((k, i) => (
                            <span key={i} className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full border border-slate-200">
                              {k}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <KeywordBadges keywords={keywords} />
                    <ChangesList changes={changes} />
                    <ResumeSectionSummary resume={optimizedResume} />
                    <OriginalResumeTextFallback rawText={rawResumeText} />

                    {/* Preview & Edit button */}
                    <button onClick={() => setShowPreview(true)}
                      className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-2xl text-sm font-bold transition-all duration-200 shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 btn-press animate-fadeInUp">
                      <EditIcon />
                      Edit, Reorder & Preview Resume
                    </button>

                    {/* Cover Letter — still available after optimization */}
                    {!coverLetter && (
                      <button onClick={handleGenerateCoverLetter} disabled={isLoading}
                        className="w-full py-3.5 bg-white border-2 border-blue-300 hover:border-blue-500 hover:bg-blue-50 text-blue-700 rounded-2xl text-sm font-semibold transition-all flex items-center justify-center gap-2 animate-fadeInUp stagger-2 btn-press">
                        ✉️ Generate Cover Letter for This Role
                      </button>
                    )}

                    <p className="text-xs text-center text-slate-400">
                      Edit bullets, reorder sections, preview — then download as PDF
                    </p>

                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
                      <strong>Tip:</strong> Not satisfied? Refine the JD or switch profiles, then click Optimize again.
                    </div>
                  </>
                )}

                {/* Cover letter generated */}
                {coverLetter && !isLoading && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 animate-scaleIn">
                    <p className="text-sm font-semibold text-emerald-800 mb-1">✉️ Cover Letter Ready!</p>
                    <p className="text-xs text-emerald-700 mb-4">Personalized for this role. Review and download below.</p>
                    <button onClick={() => setShowCoverLetterPreview(true)}
                      className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-emerald-500/20 btn-press">
                      📄 Preview & Download Cover Letter
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="mt-16 border-t border-slate-200 max-w-7xl mx-auto px-6">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl px-6 py-5 mt-10 mb-10 animate-fadeInUp">
            <div className="flex items-start gap-4">
              <div className="text-2xl">🚀</div>
              <div>
                <p className="text-sm font-semibold text-slate-800 mb-1">More features coming soon</p>
                <p className="text-xs text-slate-500 leading-relaxed">
                  LinkedIn profile optimizer · Interview prep questions · Resume score benchmarking · ATS keyword density checker · Multi-language support
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <h3 className="text-sm font-semibold text-slate-800 mb-1">Share your feedback</h3>
              <p className="text-xs text-slate-400 mb-3">Facing an issue? Got a suggestion? We read every message.</p>
              <FeedbackForm />
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-800 mb-1">Contact support</h3>
                <p className="text-xs text-slate-400 mb-4">Need help? Reach out directly.</p>
                <div className="space-y-3">
                  {[
                    { href: 'tel:+916200825883', icon: '📞', label: 'Call / WhatsApp', value: '+91 6200825883', hoverClass: 'hover:bg-blue-50' },
                    { href: 'https://wa.me/916200825883', icon: '💬', label: 'Message on WhatsApp', value: 'Chat with us', hoverClass: 'hover:bg-green-50' },
                  ].map(link => (
                    <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer"
                      className={`flex items-center gap-3 p-3 bg-slate-50 ${link.hoverClass} rounded-xl transition-colors group`}>
                      <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center shadow-sm text-lg">{link.icon}</div>
                      <div>
                        <p className="text-xs text-slate-500">{link.label}</p>
                        <p className="text-sm font-semibold text-slate-800">{link.value}</p>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-4">Typical response: within a few hours</p>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-6 pb-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <svg width="18" height="18" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                  <rect width="100" height="100" rx="22" fill="#2563eb"/>
                  <rect x="24" y="18" width="45" height="56" rx="4" fill="white"/>
                  <polygon points="56,18 69,18 69,31" fill="#93c5fd"/>
                  <polygon points="56,18 56,31 69,31" fill="#dbeafe"/>
                  <rect x="29" y="36" width="32" height="4" rx="2" fill="#2563eb" opacity="0.22"/>
                  <rect x="29" y="44" width="24" height="4" rx="2" fill="#2563eb" opacity="0.16"/>
                  <rect x="29" y="54" width="32" height="3" rx="1.5" fill="#2563eb" opacity="0.16"/>
                  <circle cx="70" cy="72" r="16" fill="#fbbf24"/>
                  <text x="70" y="79" textAnchor="middle" fontSize="17" fontWeight="700" fontFamily="sans-serif" fill="#1e3a8a">✦</text>
                </svg>
                <span className="font-medium text-slate-500">PM Resume Optimizer</span>
              </div>
              <span>© {new Date().getFullYear()} PM Resume Optimizer. All rights reserved.</span>
              <div className="flex items-center gap-4">
                <a href="/privacy" className="hover:text-slate-600 transition-colors">Privacy Policy</a>
                <a href="/terms" className="hover:text-slate-600 transition-colors">Terms of Service</a>
              </div>
            </div>
            <p className="text-center text-xs text-slate-300 mt-3">
              Your data is processed securely and never stored · Resume content never shared · 256-bit encrypted
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
