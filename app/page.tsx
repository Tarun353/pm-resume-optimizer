'use client';

import { useState, useCallback, useRef } from 'react';
import { ResumeData, InputMode, CareerStage, ParseResponse } from '@/lib/types';
import { useAuth } from '@/lib/AuthContext';
import { LoginModal } from '@/components/LoginModal';
import { PaymentModal } from '@/components/PaymentModal';
import { UserProfile } from '@/components/UserProfile';
import { supabase } from '@/lib/supabase';
import { Navbar } from '@/components/Navbar';
import { calculateATSScoreWithSuggestions } from '@/lib/atsScore';
import { useEffect } from 'react'; // Add useEffect if not already imported

export const dynamic = 'force-dynamic';


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

// ─── AI Rewrite Button ────────────────────────────────────────────────────────
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
    if (showModal) {
      setOriginalText(text || '');
    }
  }, [showModal, text]);

  const handleRewrite = async () => {
    if (!originalText.trim()) return;
    if (!instruction.trim()) return;
    setIsRewriting(true);
    try {
      const res = await fetch('/api/ai-rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: originalText,
          instruction,
          context: { sectionType },
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || 'Failed to rewrite text');
      }

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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full mx-4">
            <h3 className="font-bold text-lg mb-4">✨ AI Rewrite</h3>

            <div className="mb-4">
              <label className="text-sm font-medium text-slate-700 block mb-2">Original:</label>
              <div className="p-3 bg-slate-50 rounded text-sm text-slate-600">
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
                className="w-full h-24 p-3 border border-slate-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex gap-2 mb-4 flex-wrap">
              <button
                onClick={() => setInstruction('Make it more senior level')}
                className="px-3 py-1 text-xs bg-slate-100 hover:bg-slate-200 rounded">
                More Senior
              </button>
              <button
                onClick={() => setInstruction('Add specific metrics and impact')}
                className="px-3 py-1 text-xs bg-slate-100 hover:bg-slate-200 rounded">
                Add Metrics
              </button>
              <button
                onClick={() => setInstruction('Make it more product management focused')}
                className="px-3 py-1 text-xs bg-slate-100 hover:bg-slate-200 rounded">
                PM Focused
              </button>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setShowModal(false); setInstruction(''); }}
                className="flex-1 py-2 border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50">
                Cancel
              </button>
              <button
                onClick={handleRewrite}
                disabled={isRewriting || !instruction.trim()}
                className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-lg text-sm font-medium">
                {isRewriting ? 'Rewriting...' : '✨ Rewrite'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
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

// ─── Section Names Mapping ────────────────────────────────────────────────────
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
  'summary',
  'experience',
  'internships',
  'education',
  'skills',
  'projects',
  'certifications',
  'awards',
  'publications',
  'softSkills',
  'additional:Achievements',
  'additional:Languages',
];

const ADDABLE_SECTIONS = [
  { key: 'summary', label: 'Professional Summary' },
  { key: 'experience', label: 'Work Experience' },
  { key: 'internships', label: 'Internships' },
  { key: 'education', label: 'Education' },
  { key: 'skills', label: 'Skills' },
  { key: 'projects', label: 'Projects' },
  { key: 'certifications', label: 'Certifications' },
  { key: 'awards', label: 'Awards' },
  { key: 'publications', label: 'Publications' },
  { key: 'softSkills', label: 'Core Competencies' },
  { key: 'additional:Achievements', label: 'Achievements' },
  { key: 'additional:Languages', label: 'Languages' },
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

function OriginalResumeTextFallback({ rawText }: { rawText: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'failed'>('idle');

  if (!rawText.trim()) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(rawText);
      setCopyStatus('copied');
    } catch (err) {
      console.error('Failed to copy original resume text:', err);
      setCopyStatus('failed');
    }

    setTimeout(() => setCopyStatus('idle'), 2000);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className="w-full text-left text-sm font-semibold text-slate-800 hover:text-slate-950 transition-colors"
      >
        {isOpen ? 'Hide Original Resume Text' : 'Show Original Resume Text'}
      </button>

      {isOpen && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Original Resume Text</p>
          <div className="max-h-56 overflow-auto rounded-lg border border-slate-200 bg-slate-50 p-3">
            <pre className="whitespace-pre-wrap break-words text-xs text-slate-700 font-mono">{rawText}</pre>
          </div>
          <button
            type="button"
            onClick={handleCopy}
            className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
          >
            {copyStatus === 'copied' ? 'Copied!' : copyStatus === 'failed' ? 'Copy Failed' : 'Copy Text'}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── SECTION REORDER COMPONENT ────────────────────────────────────────────────
interface SectionReorderProps {
  sectionOrder: string[];
  onReorder: (newOrder: string[]) => void;
}

function SectionReorder({ sectionOrder, onReorder }: SectionReorderProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();

    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newOrder = [...sectionOrder];
    const [removed] = newOrder.splice(draggedIndex, 1);
    newOrder.splice(dropIndex, 0, removed!);

    onReorder(newOrder);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const getSectionName = (key: string): string => {
    if (key.startsWith('additional:')) {
      const heading = key.replace('additional:', '');
      return `📄 ${heading}`;
    }
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
            className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all cursor-move ${
              isDragging
                ? 'opacity-50 scale-95'
                : isOver
                ? 'border-blue-500 bg-blue-50'
                : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
            }`}>
            <div className="cursor-grab active:cursor-grabbing">
              <GripIcon />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-900">
                {getSectionName(section)}
              </p>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              #{index + 1}
            </span>
          </div>
        );
      })}
    </div>
  );
}



function getInitialActiveSections(resume: ResumeData): string[] {
  const base = resume.sectionOrder?.length ? [...resume.sectionOrder] : [...DEFAULT_SECTIONS];

  for (const sec of resume.additionalSections ?? []) {
    const key = `additional:${sec.heading}`;
    if (sec.heading?.trim() && !base.includes(key)) {
      base.push(key);
    }
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
    case 'summary': return !!resume.summary?.trim();
    case 'experience': return (resume.experience?.length ?? 0) > 0;
    case 'internships': return (resume.internships?.length ?? 0) > 0;
    case 'education': return (resume.education?.length ?? 0) > 0;
    case 'skills': return (resume.skills?.length ?? 0) > 0;
    case 'projects': return (resume.projects?.length ?? 0) > 0;
    case 'certifications': return (resume.certifications?.length ?? 0) > 0;
    case 'awards': return (resume.awards?.length ?? 0) > 0;
    case 'publications': return (resume.publications?.length ?? 0) > 0;
    case 'softSkills': return (resume.softSkills?.length ?? 0) > 0;
    default: return false;
  }
}

const REQUIRED_SECTIONS = ['experience'];
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

// ─── EDITABLE PREVIEW MODAL ───────────────────────────────────────────────────
interface EditablePreviewModalProps {
  resume: ResumeData;
  rawResumeText: string;
  onClose: () => void;
  onDownload: () => void;
  onResumeChange: (newResume: ResumeData) => void;
  isDownloading: boolean;
  isDocxUpload: boolean;
}

function EditablePreviewModal({ resume, rawResumeText, onClose, onDownload, onResumeChange, isDownloading, isDocxUpload }: EditablePreviewModalProps) {
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
  const atsResult = calculateATSScoreWithSuggestions(editedResume);

  const handleCopyOriginalText = async () => {
    try {
      await navigator.clipboard.writeText(rawResumeText);
      setCopyStatus('copied');
    } catch (err) {
      console.error('Failed to copy original resume text:', err);
      setCopyStatus('failed');
    }

    setTimeout(() => setCopyStatus('idle'), 2000);
  };

  // Generate preview whenever editedResume changes
  const regeneratePreview = useCallback(async () => {
    setIsLoadingPreview(true);
    try {
      const response = await fetch('/api/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resume: editedResume }),
      });

      if (response.ok) {
        const html = await response.text();
        setPreviewHTML(html);
      }
    } catch (err) {
      console.error('Preview generation failed:', err);
    } finally {
      setIsLoadingPreview(false);
    }
  }, [editedResume]);

  // Initial load
  useEffect(() => {
    regeneratePreview();
  }, []);

  // Update summary
  const updateSummary = (newSummary: string) => {
    const updated = { ...editedResume, summary: newSummary };
    setEditedResume(updated);
    onResumeChange(updated);
    regeneratePreview();
  };

  // Update experience bullet
  const updateExperienceBullet = (expIndex: number, bulletIndex: number, newText: string) => {
    const updated = { ...editedResume };
    if (updated.experience[expIndex]) {
      updated.experience[expIndex]!.bullets[bulletIndex] = newText;
      setEditedResume(updated);
      onResumeChange(updated);
      regeneratePreview();
    }
  };

  // Add experience bullet
  const addExperienceBullet = (expIndex: number) => {
    const updated = { ...editedResume };
    if (updated.experience[expIndex]) {
      updated.experience[expIndex]!.bullets.push('New bullet point - click to edit');
      setEditedResume(updated);
      onResumeChange(updated);
      regeneratePreview();
    }
  };

  // Delete experience bullet
  const deleteExperienceBullet = (expIndex: number, bulletIndex: number) => {
    const updated = { ...editedResume };
    if (updated.experience[expIndex]) {
      updated.experience[expIndex]!.bullets = updated.experience[expIndex]!.bullets.filter((_, i) => i !== bulletIndex);
      setEditedResume(updated);
      onResumeChange(updated);
      regeneratePreview();
    }
  };

  // Update internship bullet
  const updateInternshipBullet = (intIndex: number, bulletIndex: number, newText: string) => {
    const updated = { ...editedResume };
    if (updated.internships && updated.internships[intIndex]) {
      updated.internships[intIndex]!.bullets[bulletIndex] = newText;
      setEditedResume(updated);
      onResumeChange(updated);
      regeneratePreview();
    }
  };

  // Add internship bullet
  const addInternshipBullet = (intIndex: number) => {
    const updated = { ...editedResume };
    if (updated.internships && updated.internships[intIndex]) {
      updated.internships[intIndex]!.bullets.push('New bullet point - click to edit');
      setEditedResume(updated);
      onResumeChange(updated);
      regeneratePreview();
    }
  };

  // Delete internship bullet
  const deleteInternshipBullet = (intIndex: number, bulletIndex: number) => {
    const updated = { ...editedResume };
    if (updated.internships && updated.internships[intIndex]) {
      updated.internships[intIndex]!.bullets = updated.internships[intIndex]!.bullets.filter((_, i) => i !== bulletIndex);
      setEditedResume(updated);
      onResumeChange(updated);
      regeneratePreview();
    }
  };

  const applyResumeUpdate = async (updated: ResumeData) => {
    setEditedResume(updated);
    onResumeChange(updated);
    await regeneratePreview();
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
      return entry.rawContent
        .split('\n')
        .map(item => item.trim())
        .filter(Boolean);
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

    if (idx >= 0) existing[idx] = next;
    else existing.push(next);

    updated.additionalSections = existing;
    await applyResumeUpdate(updated);
  };

  const updateAdditionalSectionItem = async (section: string, itemIndex: number, value: string) => {
    const current = getAdditionalSectionItems(section);
    current[itemIndex] = value;
    await updateAdditionalSectionItems(section, current);
  };

  const updateAliasedArrayEntry = async (
    section: keyof ResumeData,
    index: number,
    primaryField: string,
    aliases: string[],
    value: string,
  ) => {
    const list = ([...(((editedResume as unknown as Record<string, unknown>)[section] as Record<string, unknown>[]) ?? [])]);
    const row = { ...(list[index] ?? {}) };
    row[primaryField] = value;
    aliases.forEach(alias => {
      if (alias !== primaryField && typeof row[alias] === 'string') {
        row[alias] = value;
      }
    });
    list[index] = row;
    await updateField(section, list);
  };

  const updateProjectBullet = async (projectIndex: number, bulletIndex: number, value: string) => {
    const projects = ([...(((editedResume.projects as unknown as Record<string, unknown>[]) ?? []))]);
    const project = { ...(projects[projectIndex] ?? {}) };
    const bullets = Array.isArray(project.bullets)
      ? [...(project.bullets as string[])]
      : [];
    bullets[bulletIndex] = value;
    project.bullets = bullets;
    projects[projectIndex] = project;
    await updateField('projects', projects);
  };

  const handleSectionUpdate = async (section: string, rawValue: string) => {
    const updated: ResumeData = { ...editedResume };

    if (section === 'summary') {
      updated.summary = rawValue;
      await applyResumeUpdate(updated);
      return;
    }

    if (section === 'skills' || section === 'softSkills') {
      const parsed = rawValue.split('\n').map(v => v.trim()).filter(Boolean);
      (updated as unknown as Record<string, unknown>)[section] = parsed;
      await applyResumeUpdate(updated);
      return;
    }

    if (section.startsWith('additional:')) {
      const heading = section.replace(/^additional:/, '').trim();
      const existing = [...(updated.additionalSections ?? [])];
      const idx = existing.findIndex(item => item.heading.trim() === heading);
      const items = rawValue.split('\n').map(v => v.trim()).filter(Boolean);
      const next = { heading, items, rawContent: rawValue };
      if (idx >= 0) existing[idx] = next;
      else existing.push(next);
      updated.additionalSections = existing;
      await applyResumeUpdate(updated);
      return;
    }

    const listSections = ['education', 'certifications', 'awards', 'publications', 'projects'];
    if (listSections.includes(section)) {
      try {
        const lines = rawValue.trim();
        const parsed = lines ? JSON.parse(lines) : [];
        if (Array.isArray(parsed)) {
          (updated as unknown as Record<string, unknown>)[section] = parsed;
        }
      } catch {
        // Preserve current value if JSON is invalid while typing.
      }
      await applyResumeUpdate(updated);
      return;
    }

    await applyResumeUpdate(updated);
  };

  const addSection = async (sectionName: string) => {
    if (activeSections.includes(sectionName)) return;

    const nextActive = [...activeSections, sectionName];
    setActiveSections(nextActive);
    setSelectedSection(sectionName);

    const updated: ResumeData = {
      ...editedResume,
      sectionOrder: [...editedResume.sectionOrder.filter(sectionHas => sectionHas !== sectionName), sectionName],
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
    setCustomSectionName('');
    setShowAddSectionModal(false);
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

    await applyResumeUpdate(updated);
  };

  // Update section order
  const updateSectionOrder = async (newOrder: string[]) => {
    const filteredOrder = newOrder.filter(section => activeSections.includes(section));
    const updated = { ...editedResume, sectionOrder: filteredOrder };
    setEditedResume(updated);
    onResumeChange(updated);
    await regeneratePreview();
  };

  return (
    <div className="fixed inset-0 z-50 flex bg-black/60 backdrop-blur-sm">

      {/* LEFT PANEL: Editor */}
      <div className="w-1/2 bg-white overflow-auto flex flex-col">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold text-slate-900 text-xl flex items-center gap-2">
                <EditIcon />
                Edit Your Resume
              </h2>
              <p className="text-sm text-slate-500 mt-1">Edit content or reorder sections</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <CloseIcon />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('edit')}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'edit'
                  ? 'bg-blue-100 text-blue-700 shadow-sm'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}>
              <span className="flex items-center justify-center gap-2">
                <EditIcon />
                Edit Content
              </span>
            </button>
            <button
              onClick={() => setActiveTab('reorder')}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'reorder'
                  ? 'bg-blue-100 text-blue-700 shadow-sm'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}>
              <span className="flex items-center justify-center gap-2">
                <MenuIcon />
                Reorder Sections
              </span>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6">
          {/* EDIT TAB */}
          {activeTab === 'edit' && (
            <>
              <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                <p className="text-sm font-semibold text-emerald-800">ATS Resume Score: {atsResult.score}/100</p>
                {atsResult.suggestions.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs font-semibold text-emerald-900">Improve your score:</p>
                    <ul className="mt-1 space-y-1 text-xs text-emerald-800">
                      {atsResult.suggestions.map((suggestion) => (
                        <li key={suggestion}>• {suggestion}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {!selectedSection ? (
                <div className="space-y-4 xl:col-span-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-slate-900">Edit Content</h3>
                    <button
                      onClick={() => setShowAddSectionModal(true)}
                      className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700">
                      <PlusIcon /> Add Section
                    </button>
                  </div>

                  <div className="space-y-2">
                    {activeSections.map((section) => (
                      <div key={section} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2">
                        <button
                          onClick={() => setSelectedSection(section)}
                          className="text-sm font-medium text-slate-700 hover:text-blue-700">
                          {SECTION_NAMES[section] || section.replace('additional:', '')} &gt;
                        </button>
                        <button
                          onClick={() => removeSection(section)}
                          disabled={REQUIRED_SECTIONS.includes(section)}
                          className="text-xs text-red-600 disabled:text-slate-300">
                          Delete
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <button onClick={() => setSelectedSection(null)} className="mb-4 text-sm text-blue-600">&lt; Back</button>
                  <div className="mb-4 flex items-center justify-between gap-2">
                    <h3 className="text-lg font-semibold text-slate-900">{SECTION_NAMES[selectedSection] || selectedSection.replace('additional:', '')}</h3>
                    {selectedSection.startsWith('additional:') && (
                      <AIButton
                        text={getAdditionalSectionItems(selectedSection).join('\n')}
                        onRewrite={(newText) => { void handleSectionUpdate(selectedSection, newText); }}
                        sectionType="custom-section"
                      />
                    )}
                  </div>

                  {selectedSection === 'summary' && (
                    <div className="flex items-start gap-2">
                      <textarea value={editedResume.summary} onChange={(e) => updateSummary(e.target.value)} className="w-full min-h-[120px] rounded-lg border border-slate-300 p-3 text-sm" />
                      <AIButton
                        text={editedResume.summary || ''}
                        onRewrite={(newText) => updateSummary(newText)}
                        sectionType="summary"
                      />
                    </div>
                  )}

                  {selectedSection === 'skills' && (
                    <textarea
                      value={(editedResume.skills || []).join('\n')}
                      onChange={(e) => updateField('skills', e.target.value.split('\n').map(v => v.trim()).filter(Boolean))}
                      className="w-full min-h-[140px] rounded-lg border border-slate-300 p-3 text-sm"
                      placeholder="One skill per line"
                    />
                  )}

                  {selectedSection === 'education' && (
                    <div className="space-y-4 xl:col-span-1">
                      {(editedResume.education || []).map((edu, index) => (
                        <div key={index} className="rounded-lg border border-slate-200 p-3 space-y-2">
                          <input value={edu.degree || ''} onChange={(e) => updateArrayEntry('education', index, 'degree', e.target.value)} placeholder="Degree" className="w-full rounded border p-2 text-sm" />
                          <input value={edu.institution || ''} onChange={(e) => updateArrayEntry('education', index, 'institution', e.target.value)} placeholder="Institution" className="w-full rounded border p-2 text-sm" />
                          <input value={edu.location || ''} onChange={(e) => updateArrayEntry('education', index, 'location', e.target.value)} placeholder="Location" className="w-full rounded border p-2 text-sm" />
                          <div className="grid grid-cols-2 gap-2">
                            <input value={edu.startDate || ''} onChange={(e) => updateArrayEntry('education', index, 'startDate', e.target.value)} placeholder="Start Date" className="w-full rounded border p-2 text-sm" />
                            <input value={edu.endDate || ''} onChange={(e) => updateArrayEntry('education', index, 'endDate', e.target.value)} placeholder="End Date" className="w-full rounded border p-2 text-sm" />
                          </div>
                          <input value={edu.gpa || ''} onChange={(e) => updateArrayEntry('education', index, 'gpa', e.target.value)} placeholder="GPA" className="w-full rounded border p-2 text-sm" />
                          <input value={edu.notes || ''} onChange={(e) => updateArrayEntry('education', index, 'notes', e.target.value)} placeholder="Notes" className="w-full rounded border p-2 text-sm" />
                          <button onClick={() => deleteArrayEntry('education', index)} className="text-xs text-red-600">Delete Entry</button>
                        </div>
                      ))}
                      <button onClick={() => addArrayEntry('education', { degree: '', institution: '', bullets: [] })} className="text-sm text-blue-600">Add Education Entry</button>
                    </div>
                  )}

                  {selectedSection === 'experience' && (
                    <div className="space-y-4">
                      {(editedResume.experience || []).map((exp, expIndex) => (
                        <div key={expIndex} className="rounded-lg border border-slate-200 p-3">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium text-slate-700">Experience {expIndex + 1}</p>
                              <button onClick={() => deleteArrayEntry('experience', expIndex)} className="text-xs text-red-600">Delete Experience</button>
                            </div>
                            <input value={exp.company || ''} onChange={(e) => updateArrayEntry('experience', expIndex, 'company', e.target.value)} placeholder="Company" className="w-full rounded border p-2 text-sm" />
                            <input value={exp.title || ''} onChange={(e) => updateArrayEntry('experience', expIndex, 'title', e.target.value)} placeholder="Role" className="w-full rounded border p-2 text-sm" />
                            <div className="grid grid-cols-2 gap-2">
                              <input value={exp.startDate || ''} onChange={(e) => updateArrayEntry('experience', expIndex, 'startDate', e.target.value)} placeholder="Start Date" className="w-full rounded border p-2 text-sm" />
                              <input value={exp.endDate || ''} onChange={(e) => updateArrayEntry('experience', expIndex, 'endDate', e.target.value)} placeholder="End Date" className="w-full rounded border p-2 text-sm" />
                            </div>
                            <p className="text-sm font-medium text-slate-700">Responsibilities</p>
                            {(exp.bullets || []).map((bullet, bulletIndex) => (
                              <div key={bulletIndex} className="flex items-center gap-2">
                                <input value={bullet} onChange={(e) => updateExperienceBullet(expIndex, bulletIndex, e.target.value)} className="flex-1 rounded border p-2 text-sm" />
                                <AIButton
                                  text={bullet}
                                  onRewrite={(newText) => updateExperienceBullet(expIndex, bulletIndex, newText)}
                                  sectionType="experience-bullet"
                                />
                                <button onClick={() => deleteExperienceBullet(expIndex, bulletIndex)} className="text-xs text-red-600">Delete</button>
                              </div>
                            ))}
                            <button onClick={() => addExperienceBullet(expIndex)} className="text-sm text-blue-600">Add bullet</button>
                          </div>
                        </div>
                      ))}
                      <button
                        onClick={() => addArrayEntry('experience', { company: '', title: '', startDate: '', endDate: '', bullets: [] })}
                        className="text-sm text-blue-600"
                      >
                        + Add Work Experience
                      </button>
                    </div>
                  )}

                  {selectedSection === 'internships' && (
                    <div className="space-y-4">
                      {(editedResume.internships || []).map((item, intIndex) => (
                        <div key={intIndex} className="rounded-lg border border-slate-200 p-3 space-y-2">
                          <input value={item.company || ''} onChange={(e) => updateArrayEntry('internships', intIndex, 'company', e.target.value)} placeholder="Company" className="w-full rounded border p-2 text-sm" />
                          <input value={item.title || ''} onChange={(e) => updateArrayEntry('internships', intIndex, 'title', e.target.value)} placeholder="Role" className="w-full rounded border p-2 text-sm" />
                          {(item.bullets || []).map((bullet, bulletIndex) => (
                            <div key={bulletIndex} className="flex items-center gap-2">
                              <input value={bullet} onChange={(e) => updateInternshipBullet(intIndex, bulletIndex, e.target.value)} className="flex-1 rounded border p-2 text-sm" />
                              <AIButton
                                text={bullet}
                                onRewrite={(newText) => updateInternshipBullet(intIndex, bulletIndex, newText)}
                                sectionType="bullet"
                              />
                              <button onClick={() => deleteInternshipBullet(intIndex, bulletIndex)} className="text-xs text-red-600">Delete</button>
                            </div>
                          ))}
                          <button onClick={() => addInternshipBullet(intIndex)} className="text-sm text-blue-600">Add bullet</button>
                        </div>
                      ))}
                    </div>
                  )}

                  {selectedSection === 'certifications' && (
                    <div className="space-y-3">
                      {(editedResume.certifications || []).map((cert, index) => (
                        <div key={index} className="rounded-lg border border-slate-200 p-3 space-y-2">
                          <div className="flex items-center gap-2">
                            <input value={getEntryText(cert, ['name', 'title'])} onChange={(e) => updateAliasedArrayEntry('certifications', index, 'name', ['title'], e.target.value)} placeholder="Certification" className="w-full rounded border p-2 text-sm" />
                            <AIButton
                              text={getEntryText(cert, ['name', 'title'])}
                              onRewrite={(newText) => { void updateAliasedArrayEntry('certifications', index, 'name', ['title'], newText); }}
                              sectionType="certification-name"
                            />
                          </div>
                          <input value={cert.issuer || ''} onChange={(e) => updateArrayEntry('certifications', index, 'issuer', e.target.value)} placeholder="Issuer" className="w-full rounded border p-2 text-sm" />
                        </div>
                      ))}
                    </div>
                  )}

                  {selectedSection === 'awards' && (
                    <div className="space-y-3">
                      {(editedResume.awards || []).map((award, index) => (
                        <div key={index} className="rounded-lg border border-slate-200 p-3 space-y-2">
                          <input value={getEntryText(award, ['title', 'name'])} onChange={(e) => updateAliasedArrayEntry('awards', index, 'title', ['name'], e.target.value)} placeholder="Award Title" className="w-full rounded border p-2 text-sm" />
                          <input value={award.issuer || ''} onChange={(e) => updateArrayEntry('awards', index, 'issuer', e.target.value)} placeholder="Issuer" className="w-full rounded border p-2 text-sm" />
                          <input value={award.date || ''} onChange={(e) => updateArrayEntry('awards', index, 'date', e.target.value)} placeholder="Date" className="w-full rounded border p-2 text-sm" />
                          <div className="flex items-start gap-2">
                            <textarea value={award.description || ''} onChange={(e) => updateArrayEntry('awards', index, 'description', e.target.value)} placeholder="Description" className="w-full rounded border p-2 text-sm" />
                            <AIButton
                              text={award.description || ''}
                              onRewrite={(newText) => { void updateArrayEntry('awards', index, 'description', newText); }}
                              sectionType="award-description"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {selectedSection === 'publications' && (
                    <div className="space-y-3">
                      {(editedResume.publications || []).map((publication, index) => (
                        <div key={index} className="rounded-lg border border-slate-200 p-3 space-y-2">
                          <input value={getEntryText(publication, ['title', 'name'])} onChange={(e) => updateAliasedArrayEntry('publications', index, 'title', ['name'], e.target.value)} placeholder="Publication Title" className="w-full rounded border p-2 text-sm" />
                          <input value={publication.publisher || ''} onChange={(e) => updateArrayEntry('publications', index, 'publisher', e.target.value)} placeholder="Publisher" className="w-full rounded border p-2 text-sm" />
                          <input value={publication.date || ''} onChange={(e) => updateArrayEntry('publications', index, 'date', e.target.value)} placeholder="Date" className="w-full rounded border p-2 text-sm" />
                          <input value={publication.link || ''} onChange={(e) => updateArrayEntry('publications', index, 'link', e.target.value)} placeholder="Link" className="w-full rounded border p-2 text-sm" />
                          <div className="flex items-start gap-2">
                            <textarea value={publication.description || ''} onChange={(e) => updateArrayEntry('publications', index, 'description', e.target.value)} placeholder="Description" className="w-full rounded border p-2 text-sm" />
                            <AIButton
                              text={publication.description || ''}
                              onRewrite={(newText) => { void updateArrayEntry('publications', index, 'description', newText); }}
                              sectionType="publication-description"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {selectedSection === 'projects' && (
                    <div className="space-y-3">
                      {(editedResume.projects || []).map((project, index) => (
                        <div key={index} className="rounded-lg border border-slate-200 p-3 space-y-2">
                          <input value={getEntryText(project, ['name', 'title'])} onChange={(e) => updateAliasedArrayEntry('projects', index, 'name', ['title'], e.target.value)} placeholder="Project Name" className="w-full rounded border p-2 text-sm" />
                          <div className="flex items-start gap-2">
                            <textarea value={project.description || ''} onChange={(e) => updateArrayEntry('projects', index, 'description', e.target.value)} placeholder="Description" className="w-full rounded border p-2 text-sm" />
                            <AIButton
                              text={project.description || ''}
                              onRewrite={(newText) => { void updateArrayEntry('projects', index, 'description', newText); }}
                              sectionType="project-description"
                            />
                          </div>
                          {(project.bullets || []).map((bullet, bulletIndex) => (
                            <div key={bulletIndex} className="flex items-start gap-2">
                              <textarea value={bullet} onChange={(e) => updateProjectBullet(index, bulletIndex, e.target.value)} className="w-full rounded border p-2 text-sm" placeholder={`Bullet ${bulletIndex + 1}`} />
                              <AIButton
                                text={bullet}
                                onRewrite={(newText) => { void updateProjectBullet(index, bulletIndex, newText); }}
                                sectionType="project-bullet"
                              />
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}

                  {selectedSection === 'softSkills' && (
                    <textarea
                      value={(editedResume.softSkills || []).join('\n')}
                      onChange={(e) => updateField('softSkills', e.target.value.split('\n').map(v => v.trim()).filter(Boolean))}
                      className="w-full min-h-[120px] rounded-lg border border-slate-300 p-3 text-sm"
                      placeholder="One competency per line"
                    />
                  )}

                  {selectedSection.startsWith('additional:') && (
                    <div className="space-y-2">
                      {getAdditionalSectionItems(selectedSection).map((item, itemIndex) => (
                        <div key={itemIndex} className="flex items-start gap-2">
                          <input
                            value={item}
                            onChange={(e) => updateAdditionalSectionItem(selectedSection, itemIndex, e.target.value)}
                            className="flex-1 rounded border p-2 text-sm"
                            placeholder={`Bullet ${itemIndex + 1}`}
                          />
                          <AIButton
                            text={item}
                            onRewrite={(newText) => { void updateAdditionalSectionItem(selectedSection, itemIndex, newText); }}
                            sectionType="custom-section-item"
                          />
                        </div>
                      ))}

                      <button
                        onClick={() => { void updateAdditionalSectionItems(selectedSection, [...getAdditionalSectionItems(selectedSection), 'New bullet point - click to edit']); }}
                        className="text-sm text-blue-600"
                      >
                        Add bullet
                      </button>
                    </div>
                  )}
                </div>
              )}

              {showAddSectionModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
                  <div className="w-full max-w-md rounded-xl bg-white p-5">
                    <div className="mb-3 flex items-center justify-between">
                      <h4 className="text-lg font-semibold">Add Section</h4>
                      <button onClick={() => setShowAddSectionModal(false)}><CloseIcon /></button>
                    </div>
                    <div className="space-y-2">
                      {OPTIONAL_MODAL_SECTIONS.map((section) => (
                        <button key={section.key} onClick={async () => { await addSection(section.key); setShowAddSectionModal(false); }} className="w-full rounded border border-slate-200 px-3 py-2 text-left text-sm hover:bg-slate-50">
                          {section.label}
                        </button>
                      ))}
                    </div>

                    <div className="mt-5 border-t border-slate-200 pt-4">
                      <h5 className="text-sm font-semibold text-slate-800">Create Custom Section</h5>
                      <input
                        value={customSectionName}
                        onChange={(e) => setCustomSectionName(e.target.value)}
                        placeholder="Section name (e.g., Soft Skills)"
                        className="mt-2 w-full rounded border border-slate-300 px-3 py-2 text-sm"
                      />
                      <button
                        onClick={addCustomSection}
                        disabled={!customSectionName.trim()}
                        className="mt-2 w-full rounded bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:bg-slate-300">
                        Add Section
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700 mt-4">
                <strong>💡 Tip:</strong> Click ✨ next to any bullet or summary to rewrite it with AI.
                {isDocxUpload && ' Your original DOCX formatting will be preserved in the output.'}
              </div>
            </>
          )}

          {/* REORDER TAB */}
          {activeTab === 'reorder' && (
            <>
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <LockIcon />
                  <p className="text-sm font-semibold text-slate-900">Personal Info (Always First)</p>
                </div>
                <div className="p-3 bg-slate-100 border-2 border-slate-300 rounded-lg">
                  <p className="text-sm font-medium text-slate-700">
                    👤 {editedResume.personal?.name || 'Your Name'}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">Contact info always appears first</p>
                </div>
              </div>

              <div className="mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <GripIcon />
                  <p className="text-sm font-semibold text-slate-900">Drag to Reorder Sections</p>
                </div>
                <p className="text-xs text-slate-500 mb-4">
                  Click and drag sections to change their order in the resume. Changes appear in the preview instantly.
                </p>
              </div>

              <SectionReorder
                sectionOrder={editedResume.sectionOrder.filter(section => activeSections.includes(section))}
                onReorder={updateSectionOrder}
              />

              <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-700">
                <strong>💡 Pro Tip:</strong> Place your strongest sections (Experience for professionals, Education for fresh graduates) near the top for maximum impact.
              </div>
            </>
          )}
        </div>
      </div>

      {/* RIGHT PANEL: Live Preview */}
      <div className="w-1/2 bg-slate-100 flex flex-col">
       <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <EyeIcon />
            <h2 className="font-bold text-slate-900 text-lg">Live Preview</h2>
          </div>
          <div className="flex items-center gap-2">
            {rawResumeText.trim() && (
              <button
                onClick={() => setShowOriginalText(prev => !prev)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-all"
                title="Show original parsed resume text"
              >
                {showOriginalText ? 'Hide Original Text' : 'Show Original Resume Text'}
              </button>
            )}
            <button
              onClick={() => regeneratePreview()}
              disabled={isLoadingPreview}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-lg text-xs font-medium transition-all"
              title="Refresh preview">
              {isLoadingPreview ? (
                <>
                <SpinnerIcon />
                <span>Refreshing...</span>
                </>
              ) : (
                <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Refresh</span>
                </>
            )}
            </button>
          </div>
        </div>
        <p className="text-xs text-slate-500">Updates automatically as you edit or reorder</p>
        {showOriginalText && rawResumeText.trim() && (
          <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Original Resume Text</p>
              <button
                onClick={handleCopyOriginalText}
                className="px-2.5 py-1 rounded-md border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
              >
                {copyStatus === 'copied' ? 'Copied!' : copyStatus === 'failed' ? 'Copy Failed' : 'Copy Text'}
              </button>
            </div>
            <div className="max-h-40 overflow-auto rounded-md border border-slate-200 bg-white p-2.5">
              <pre className="whitespace-pre-wrap break-words text-xs text-slate-700 font-mono">{rawResumeText}</pre>
            </div>
          </div>
        )}
       </div>

        <div className="flex-1 overflow-auto p-6">
          {isLoadingPreview ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-slate-600">Updating preview...</p>
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto bg-white shadow-xl">
              <iframe
                srcDoc={previewHTML}
                className="w-full h-[800px] border-0"
                title="Resume Preview"
              />
            </div>
          )}
        </div>

        <div className="bg-white border-t border-slate-200 px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500">
              {isDocxUpload
                ? '📄 Format preserved · Download keeps your original template'
                : 'Professional template · ATS-friendly · Ready to download'}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
              Close
            </button>
            <button
              onClick={onDownload}
              disabled={isDownloading}
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-slate-300 disabled:to-slate-400 text-white rounded-lg text-sm font-semibold transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2">
              {isDownloading ? (
                <><SpinnerIcon /><span className="ml-1">Generating...</span></>
              ) : isDocxUpload ? (
                <><span>⬇️</span> Download PDF (Your Format)</>
              ) : (
                <><span>⬇️</span> Download PDF</>
              )}
            </button>
          </div>
        </div>
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
  const [showPreview, setShowPreview]   = useState(false);


  // ── DOCX state ────────────────────────────────────────────────────────────
  const [originalDocx, setOriginalDocx]         = useState<string | null>(null);
  const [originalResume, setOriginalResume]     = useState<ResumeData | null>(null);
  const [isDocxUpload, setIsDocxUpload]         = useState(false);
  const [uploadSubMode, setUploadSubMode]       = useState<'pdf' | 'docx'>('pdf');

  // ── ✨ NEW: Cover Letter States ──────────────────────────────────────────
  const [generationType, setGenerationType] = useState<'resume' | 'coverletter'>('resume');
  const [coverLetter, setCoverLetter] = useState<string>('');
  const [showCoverLetterPreview, setShowCoverLetterPreview] = useState(false);
  const [rawResumeText, setRawResumeText] = useState('');

  // ── Auth states ───────────────────────────────────────────────────────────
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const { user, dbUser, refreshUser } = useAuth();

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Save state before OAuth redirect ──────────────────────────────────────
const saveStateBeforeLogin = () => {
  const state = {
    resumeText,
    jobDescription,
    parsedResume,
    optimizedResume,
    coverLetter,
    rawResumeText,
    uploadedFileName: uploadedFile?.name || null,
    inputMode,
    careerStage,
    generationType,
    timestamp: Date.now(),
  };
  sessionStorage.setItem('resumeState', JSON.stringify(state));
  console.log('State saved before login');
};

// ── Restore state after OAuth redirect ────────────────────────────────────
const restoreStateAfterLogin = () => {
  const savedState = sessionStorage.getItem('resumeState');
  if (!savedState) return false;

  try {
    const state = JSON.parse(savedState);
    
    // Only restore if saved within last 10 minutes
    if (Date.now() - state.timestamp > 10 * 60 * 1000) {
      sessionStorage.removeItem('resumeState');
      return false;
    }

    // Restore state
    setResumeText(state.resumeText || '');
    setJobDescription(state.jobDescription || '');
    setParsedResume(state.parsedResume || null);
    setOptimizedResume(state.optimizedResume || null);
    setCoverLetter(state.coverLetter || '');
    setRawResumeText(state.rawResumeText || '');
    setInputMode(state.inputMode || 'paste');
    setCareerStage(state.careerStage || 'experienced');
    setGenerationType(state.generationType || 'resume');

    // Clear saved state
    sessionStorage.removeItem('resumeState');
    
    console.log('State restored after login');
    return true;
  } catch (err) {
    console.error('Failed to restore state:', err);
    sessionStorage.removeItem('resumeState');
    return false;
  }
};

// ── Listen for login completion ───────────────────────────────────────────
useEffect(() => {
  const handleLoginComplete = async () => {
    console.log('Login completed, restoring state...');
    
    const restored = restoreStateAfterLogin();
    
    if (restored) {
      console.log('State restored, waiting for session...');
      
      // ✅ Wait for session to be available
      let attempts = 0;
      const maxAttempts = 20;
      let session = null;
      
      while (!session && attempts < maxAttempts) {
        const { data } = await supabase.auth.getSession();
        session = data.session;
        if (!session) {
          await new Promise(resolve => setTimeout(resolve, 500));
          attempts++;
        }
      }
      
      if (!session) {
        console.error('Session not available after login');
        return;
      }
      
      console.log('Session available, triggering download');
      
      // Trigger download
      if (optimizedResume && generationType === 'resume') {
        console.log('Auto-downloading resume');
        await handleDownloadPDF();
      } else if (coverLetter && generationType === 'coverletter') {
        console.log('Auto-downloading cover letter');
        await handleDownloadCoverLetterPDF();
      }
    }
  };

  window.addEventListener('login-complete', handleLoginComplete);
  
  return () => {
    window.removeEventListener('login-complete', handleLoginComplete);
  };
}, [optimizedResume, coverLetter, generationType]);


  // ── File handling ────────────────────────────────────────────────────────
  const handleFile = useCallback((file: File) => {
    const name = file.name.toLowerCase();

    // Validate against the selected sub-mode
    if (uploadSubMode === 'pdf' && !name.endsWith('.pdf')) {
      setError('Please upload a PDF file for this mode.');
      return;
    }
    if (uploadSubMode === 'docx' && !name.endsWith('.docx')) {
      setError('Please upload a DOCX (Word) file for this mode.');
      return;
    }
    if (!name.endsWith('.pdf') && !name.endsWith('.docx')) {
      setError('Only PDF and DOCX files are supported.');
      return;
    }

    setUploadedFile(file);
    setError(null);
  }, [uploadSubMode]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  // ── Parse ────────────────────────────────────────────────────────────────
  const parseResume = async (): Promise<ResumeData> => {
    const pastedText = resumeText.trim();

    if (pastedText.length > 10) {
      setLoadingStep('Parsing your pasted resume text...');
      const res = await fetch('/api/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: pastedText, careerStage }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? 'Parse failed'); }
      const d = await res.json() as ParseResponse;
      setOriginalDocx(null);
      setOriginalResume(null);
      setIsDocxUpload(false);
      setRawResumeText(d.rawText ?? '');
      return d.resume;
    }

    setLoadingStep('LlamaParse reading your resume (~20 seconds)...');

    if (inputMode === 'upload' && uploadedFile) {
      const fd = new FormData();
      fd.append('file', uploadedFile);
      fd.append('careerStage', careerStage);
      const res = await fetch('/api/parse', { method: 'POST', body: fd });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? 'Parse failed'); }
      const d = await res.json() as ParseResponse & { isDocxUpload?: boolean; originalDocx?: string };

      // Capture DOCX data if parse route returns it
      if (d.isDocxUpload && d.originalDocx) {
        setOriginalDocx(d.originalDocx);
        setOriginalResume(d.resume);
        setIsDocxUpload(true);
        console.log('[page] DOCX upload detected — format will be preserved');
      } else {
        setOriginalDocx(null);
        setOriginalResume(null);
        setIsDocxUpload(false);
      }

      setRawResumeText(d.rawText ?? '');
      return d.resume;
    }

    const text = resumeText.trim();
    if (text.length < 10) throw new Error('Please upload your resume or paste resume text.');
    const res = await fetch('/api/parse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, careerStage }),
    });
    if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? 'Parse failed'); }
    const d = await res.json() as ParseResponse;
    setRawResumeText(d.rawText ?? '');
    return d.resume;
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

  // ── ✨ NEW: Generate Cover Letter ────────────────────────────────────────
  const handleGenerateCoverLetter = async () => {
    if (!parsedResume) return;
    
    setLoadingStep('Generating your cover letter (~15 seconds)...');
    
    try {
      const res = await fetch('/api/generate-cover-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resume: parsedResume,
          jobDescription: jobDescription.trim(),
        }),
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Failed to generate cover letter');
      }
      
      const data = await res.json();
      setCoverLetter(data.coverLetter);
      setShowCoverLetterPreview(true);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Cover letter generation failed');
      throw err;
    }
  };

  // ── ✨ NEW: Download Cover Letter PDF ────────────────────────────────────
  const handleDownloadCoverLetterPDF = async () => {
  if (!coverLetter) return;

  // ✅ Check session directly (not user state)
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) {
    saveStateBeforeLogin();
    setShowLoginModal(true);
    return;
  }

  // Track download and check limit
  try {
    const token = session.access_token;

    const trackRes = await fetch('/api/download/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ type: 'coverletter' }),
    });

    if (!trackRes.ok) {
      const data = await trackRes.json();
      if (data.reason === 'limit_exceeded') {
        setShowPaymentModal(true);
        return;
      }
      throw new Error(data.error || 'Failed to track download');
    }
  } catch (err) {
    if (err instanceof Error && err.message !== 'Failed to track download') {
      setError(err.message);
      return;
    }
  }

  setIsDownloading(true);
  setError(null);

  try {
    const name = parsedResume?.personal?.name || 'Applicant';
    const fileName = `${name.replace(/\s+/g, '_')}_Cover_Letter.pdf`;

    const res = await fetch('/api/generate-cover-letter-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ coverLetter, fileName }),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error ?? 'PDF generation failed');
    }

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    await refreshUser();
    setShowCoverLetterPreview(false);
  } catch (err) {
    setError(err instanceof Error ? err.message : 'PDF download failed');
  } finally {
    setIsDownloading(false);
  }
};


  // ── Pre-check quota before expensive generation ───────────────────────────
  const canRunGeneration = async (): Promise<boolean> => {
    // Keep existing behavior for unauthenticated users.
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return true;

    try {
      const statusRes = await fetch('/api/download/track', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!statusRes.ok) {
        const data = await statusRes.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to check download quota');
      }

      const status = await statusRes.json();
      if (!status.canDownload) {
        setShowPaymentModal(true);
        return false;
      }

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check download quota');
      return false;
    }
  };


  // ── ✨ UPDATED: Main handler - handles both resume and cover letter ──────
  const handleGenerate = async () => {
    setError(null);

    const allowed = await canRunGeneration();
    if (!allowed) return;

    setIsLoading(true);
    setOptimizedResume(null);
    setChanges([]);
    setKeywords([]);
    setCoverLetter('');
    setRawResumeText('');

    try {
      // Parse resume first (needed for both)
      const parsed = await parseResume();
      setParsedResume(parsed);

      if (generationType === 'resume') {
        // Existing resume optimization logic
        const result = await optimizeResumeData(parsed);
        setOptimizedResume(result.optimizedResume);
        setChanges(result.changes ?? []);
        setKeywords(result.keywordsInjected ?? []);
      } else {
        // Cover letter generation
        await handleGenerateCoverLetter();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setIsLoading(false);
      setLoadingStep('');
    }
  };

  // ── Handle resume changes from editor ─────────────────────────────────────
  const handleResumeChange = (newResume: ResumeData) => {
    setOptimizedResume(newResume);
  };

  // ── Download PDF ──────────────────────────────────────────────────────────
  const handleDownloadPDF = async () => {
  if (!optimizedResume) return;

  // ✅ Check session directly (not user state)
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) {
    saveStateBeforeLogin();
    setShowLoginModal(true);
    return;
  }

  // Track download and check limit
  try {
    const token = session.access_token;

    const trackRes = await fetch('/api/download/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ type: 'resume' }),
    });

    if (!trackRes.ok) {
      const data = await trackRes.json();
      if (data.reason === 'limit_exceeded') {
        setShowPaymentModal(true);
        return;
      }
      throw new Error(data.error || 'Failed to track download');
    }
  } catch (err) {
    if (err instanceof Error && err.message !== 'Failed to track download') {
      setError(err.message);
      return;
    }
  }

  setIsDownloading(true);
  setError(null);

  try {
    const requestBody: Record<string, unknown> = {
      resume: optimizedResume,
    };

    if (isDocxUpload && originalDocx && originalResume) {
      requestBody.originalDocx = originalDocx;
      requestBody.originalResume = originalResume;
    }

    const res = await fetch('/api/generate-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });
    
    if (!res.ok) { 
      const d = await res.json(); 
      throw new Error(d.error ?? 'PDF failed'); 
    }
    
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

    await refreshUser();
    setShowPreview(false);
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
    (resumeText.trim().length > 10 || uploadedFile !== null);

  const fileIsDocx = uploadedFile?.name.toLowerCase().endsWith('.docx') ?? false;
  const fileIsPdf  = uploadedFile?.name.toLowerCase().endsWith('.pdf')  ?? false;

  return (
    <>
      {/* Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSuccess={async () => {
          setShowLoginModal(false);
          await refreshUser();
          window.dispatchEvent(new Event('login-complete'));
        }}
      />

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSuccess={() => {
          setShowPaymentModal(false);
        }}
      />

      {/* Editable Preview Modal */}
      {showPreview && optimizedResume && (
        <EditablePreviewModal
          resume={optimizedResume}
          rawResumeText={rawResumeText}
          onClose={() => setShowPreview(false)}
          onDownload={handleDownloadPDF}
          onResumeChange={handleResumeChange}
          isDownloading={isDownloading}
          isDocxUpload={isDocxUpload}
        />
      )}

      {/* ✨ NEW: Cover Letter Preview Modal */}
      {showCoverLetterPreview && coverLetter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl mx-4 max-h-[90vh] flex flex-col">
            
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-slate-900 text-xl flex items-center gap-2">
                  ✉️ Your Cover Letter
                </h2>
                <p className="text-sm text-slate-500 mt-1">Review and download</p>
              </div>
              <button
                onClick={() => setShowCoverLetterPreview(false)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <CloseIcon />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-6">
              <div className="max-w-3xl mx-auto bg-white shadow-lg p-12 rounded-lg">
                <textarea
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  className="w-full min-h-[500px] text-sm border border-slate-200 rounded-lg p-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none font-mono"
                  style={{ lineHeight: '1.6' }}
                />
                {/* ✨ AI Rewrite Button for Cover Letter */}
                <div className="flex justify-end mt-2">
                  <AIButton
                    text={coverLetter}
                    onRewrite={(newText) => setCoverLetter(newText)}
                    sectionType="generic"
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between bg-slate-50">
              <p className="text-xs text-slate-500">
                Edit the text above if needed, then download as PDF
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCoverLetterPreview(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 rounded-lg transition-colors">
                  Close
                </button>
                <button
                  onClick={handleDownloadCoverLetterPDF}
                  disabled={isDownloading}
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-slate-300 disabled:to-slate-400 text-white rounded-lg text-sm font-semibold transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2">
                  {isDownloading ? (
                    <><SpinnerIcon /><span className="ml-1">Generating...</span></>
                  ) : (
                    <><span>⬇️</span> Download PDF</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/30">
        {/* Nav */}
        <Navbar onSignInClick={() => setShowLoginModal(true)} />
          
  

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
              AI optimization · Cover letters · Inline editing · Section reordering
            </p>
          </div>

          {/* ── CAREER STAGE SELECTOR ── */}
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
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">

            {/* ── LEFT: Inputs ── */}
            <div className="space-y-4 xl:col-span-2">

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
              {/* Resume input */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h2 className="font-semibold text-slate-900 text-sm">Your Resume</h2>
                  </div>

                  <div className="flex bg-slate-100 rounded-lg p-0.5">
                    <button
                      onClick={() => {
                        setInputMode('paste');
                        setUploadedFile(null);
                        setIsDocxUpload(false);
                        setOriginalDocx(null);
                        setOriginalResume(null);
                      }}
                      className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                        inputMode === 'paste' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                      }`}>
                      Paste Text
                    </button>
                    <button
                      onClick={() => {
                        setInputMode('upload');
                        setUploadSubMode('pdf');
                        setResumeText('');
                        setIsDocxUpload(false);
                        setUploadedFile(null);
                        setOriginalDocx(null);
                        setOriginalResume(null);
                      }}
                      className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                        inputMode === 'upload' && uploadSubMode === 'pdf'
                          ? 'bg-white text-slate-900 shadow-sm'
                          : 'text-slate-500'
                      }`}>
                      PDF
                    </button>
                    <button
                      onClick={() => {
                        setInputMode('upload');
                        setUploadSubMode('docx');
                        setResumeText('');
                        setUploadedFile(null);
                      }}
                      className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                        inputMode === 'upload' && uploadSubMode === 'docx'
                          ? 'bg-white text-slate-900 shadow-sm'
                          : 'text-slate-500'
                      }`}>
                      DOCX ✨
                    </button>
                  </div>
                </div>

                <div className="p-4 space-y-3">
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
                    <strong>Tip:</strong> Resume parsing works best when you paste plain text instead of uploading PDF or DOCX. If sections appear incorrect, paste your resume text below.
                  </div>

                  {inputMode === 'paste' ? (
                    <textarea
                      value={resumeText}
                      onChange={e => setResumeText(e.target.value)}
                      placeholder={`Paste your full resume here...\n\nTip: Include all sections:\n• Summary\n• Experience\n• Education\n• Skills\n• Certifications\n• Awards\n• Projects\n• etc.`}
                      className="w-full h-56 text-sm text-slate-700 placeholder-slate-300 bg-slate-50 border border-slate-200 rounded-xl p-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all font-mono"
                    />
                  ) : (
                    <div className="space-y-3">
                      <div
                        onDrop={handleDrop}
                        onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
                        onDragLeave={() => setIsDragOver(false)}
                        onClick={() => fileInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                          isDragOver ? 'border-blue-400 bg-blue-50'
                          : uploadedFile ? 'border-green-300 bg-green-50'
                          : uploadSubMode === 'docx'
                          ? 'border-blue-200 bg-blue-50/30 hover:border-blue-300'
                          : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-slate-100'
                        }`}>
                        {uploadedFile ? (
                          <div className="flex items-center justify-center gap-3">
                            <div className={`flex items-center justify-center w-10 h-10 rounded-lg font-bold text-xs uppercase ${
                              fileIsPdf  ? 'bg-red-100 text-red-600'
                            : fileIsDocx ? 'bg-blue-100 text-blue-600'
                            : 'bg-slate-100 text-slate-600'
                            }`}>
                              {fileIsPdf ? 'PDF' : fileIsDocx ? 'DOCX' : 'FILE'}
                            </div>
                            <div className="text-left">
                              <p className="text-sm font-medium text-slate-900 truncate max-w-48">{uploadedFile.name}</p>
                              <p className="text-xs text-slate-400">
                                {(uploadedFile.size / 1024).toFixed(0)} KB · Click to replace
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="text-slate-400">
                            <div className="flex justify-center mb-2"><UploadIcon /></div>
                            <p className="text-sm font-medium text-slate-600">
                              {uploadSubMode === 'docx' ? 'Drop your Word (.docx) file here' : 'Drop your PDF here'}
                            </p>
                            <p className="text-xs text-slate-400 mt-1">
                              {uploadSubMode === 'docx' ? '.docx files only · Up to 10MB' : 'PDF files only · Up to 10MB'}
                            </p>
                          </div>
                        )}
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept={uploadSubMode === 'docx' ? '.docx' : '.pdf'}
                        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
                        className="hidden"
                      />

                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          Optional: Paste resume text (recommended for best parsing)
                        </label>
                        <textarea
                          value={resumeText}
                          onChange={e => setResumeText(e.target.value)}
                          placeholder="Paste your resume text here to prioritize text parsing over file parsing..."
                          className="w-full h-32 text-sm text-slate-700 placeholder-slate-300 bg-slate-50 border border-slate-200 rounded-xl p-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
                        />
                      </div>
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
              </div>

              {/* ✨ NEW: Generation Type Selection */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-5 py-3.5 border-b border-slate-100">
                  <h2 className="font-semibold text-slate-900 text-sm">What would you like to generate?</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Choose your output type</p>
                </div>
                
                <div className="p-4 space-y-3">
                  {/* Resume Option */}
                  <label className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    generationType === 'resume'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                  }`}>
                    <input
                      type="radio"
                      name="generationType"
                      value="resume"
                      checked={generationType === 'resume'}
                      onChange={() => setGenerationType('resume')}
                      className="mt-1 w-4 h-4 text-blue-600"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">📄</span>
                        <p className="font-semibold text-slate-900 text-sm">Optimize Resume</p>
                      </div>
                      <p className="text-xs text-slate-500">
                        AI-optimized, ATS-friendly resume with keyword matching and professional formatting
                      </p>
                    </div>
                  </label>

                  {/* Cover Letter Option */}
                  <label className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    generationType === 'coverletter'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                  }`}>
                    <input
                      type="radio"
                      name="generationType"
                      value="coverletter"
                      checked={generationType === 'coverletter'}
                      onChange={() => setGenerationType('coverletter')}
                      className="mt-1 w-4 h-4 text-blue-600"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">✉️</span>
                        <p className="font-semibold text-slate-900 text-sm">Generate Cover Letter</p>
                      </div>
                      <p className="text-xs text-slate-500">
                        Professional cover letter tailored to the job description and highlighting your strengths
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* ✨ UPDATED: Generate button */}
              <button
                onClick={handleGenerate}
                disabled={!canOptimize}
                className={`w-full py-4 rounded-2xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
                  canOptimize
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/20'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}>
                {isLoading ? (
                  <><SpinnerIcon /><span className="ml-1">{loadingStep || 'Working...'}</span></>
                ) : generationType === 'resume' ? (
                  <><span>✨</span> Optimize My Resume</>
                ) : (
                  <><span>✉️</span> Generate Cover Letter</>
                )}
              </button>

              {!canOptimize && !isLoading && (
                <p className="text-xs text-center text-slate-400">
                  {inputMode === 'paste' && resumeText.trim().length <= 10
                    ? '① Add your resume text'
                    : inputMode === 'upload' && !uploadedFile
                    ? `① Upload a ${uploadSubMode === 'docx' ? 'DOCX' : 'PDF'} file`
                    : '② Add a job description (20+ chars)'}
                </p>
              )}
            </div>

            {/* ── RIGHT: Results ── */}
            <div className="space-y-4 xl:col-span-1">

              {/* Empty state */}
              {!parsedResume && !isLoading && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">🎨</span>
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-2">Full Control Over Your Documents</h3>
                  <p className="text-sm text-slate-400 max-w-xs mx-auto mb-6">
                    Optimize resumes · Generate cover letters · Edit content · Professional output guaranteed
                  </p>
                  <div className="grid grid-cols-2 gap-2.5 text-left">
                    {[
                      { icon: '📄', title: 'Resume', desc: 'ATS-optimized' },
                      { icon: '✉️', title: 'Cover Letter', desc: 'AI-generated' },
                      { icon: '✏️', title: 'Edit', desc: 'Full control' },
                      { icon: '🎯', title: 'Professional', desc: 'Download PDF' },
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

              {isLoading && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center">
                  <div className="flex justify-center mb-4">
                    <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                  </div>
                  <p className="font-semibold text-slate-900 mb-1">
                    {generationType === 'resume' ? 'AI is optimizing...' : 'Generating cover letter...'}
                  </p>
                  <p className="text-sm text-slate-400">{loadingStep}</p>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <p className="text-sm font-semibold text-red-800">⚠️ Error</p>
                  <p className="text-sm text-red-600 mt-1">{error}</p>
                </div>
              )}

              {parsedResume && !optimizedResume && !coverLetter && !isLoading && (
                <>
                  <ResumeSectionSummary resume={parsedResume} />
                  <OriginalResumeTextFallback rawText={rawResumeText} />
                </>
              )}

              {/* Resume Results */}
              {optimizedResume && !isLoading && (
                <>
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5">
                    <p className="text-sm font-semibold text-emerald-800">ATS Resume Score: {calculateATSScoreWithSuggestions(optimizedResume).score}/100</p>
                  </div>
                  <KeywordBadges keywords={keywords} />
                  <ChangesList changes={changes} />
                  <ResumeSectionSummary resume={optimizedResume} />
                  <OriginalResumeTextFallback rawText={rawResumeText} />

                  {isDocxUpload && (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 flex items-start gap-3">
                      <span className="text-xl">📄</span>
                      <div>
                        <p className="text-sm font-semibold text-blue-800">Format Preservation Active ✨</p>
                        <p className="text-xs text-blue-600 mt-0.5">
                          Your original fonts, colors, and layout will be preserved in the downloaded PDF.
                        </p>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => setShowPreview(true)}
                    className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-2xl text-sm font-semibold transition-all duration-200 shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2">
                    <EditIcon />
                    Edit, Reorder & Preview
                  </button>

                  <p className="text-xs text-center text-slate-400">
                    Click to edit bullets, reorder sections, and preview before downloading
                  </p>

                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
                    <strong>Tip:</strong> Not satisfied? Edit the job description or career stage, then click Optimize again.
                  </div>
                </>
              )}

              {/* ✨ NEW: Cover Letter Results */}
              {coverLetter && !isLoading && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                  <p className="text-sm font-semibold text-emerald-800 mb-2">✉️ Cover Letter Generated!</p>
                  <p className="text-xs text-emerald-700 mb-3">
                    Your personalized cover letter is ready. Review and download below.
                  </p>
                  <button
                    onClick={() => setShowCoverLetterPreview(true)}
                    className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-emerald-500/20">
                    📄 Preview & Download Cover Letter
                  </button>
                </div>
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
    </>
  );
}
