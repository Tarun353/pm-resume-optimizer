'use client';

import { useState, useCallback, useRef } from 'react';
import { ResumeData, InputMode, CareerStage } from '@/lib/types';
import { useAuth } from '@/lib/AuthContext';
import { LoginModal } from '@/components/LoginModal';
import { PaymentModal } from '@/components/PaymentModal';
import { UserProfile } from '@/components/UserProfile';
import { supabase } from '@/lib/supabase';
import { Navbar } from '@/components/Navbar';

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
  const [instruction, setInstruction] = useState('');
  const [isRewriting, setIsRewriting] = useState(false);

  const handleRewrite = async () => {
    if (!instruction.trim()) return;
    setIsRewriting(true);
    try {
      const res = await fetch('/api/ai-rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          instruction,
          context: { sectionType },
        }),
      });
      if (res.ok) {
        const data = await res.json();
        onRewrite(data.rewritten);
        setShowModal(false);
        setInstruction('');
      }
    } catch (err) {
      console.error('AI rewrite failed:', err);
    } finally {
      setIsRewriting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
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
                {text.substring(0, 200)}{text.length > 200 && '...'}
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

// ─── EDITABLE PREVIEW MODAL ───────────────────────────────────────────────────
interface EditablePreviewModalProps {
  resume: ResumeData;
  onClose: () => void;
  onDownload: () => void;
  onResumeChange: (newResume: ResumeData) => void;
  isDownloading: boolean;
  isDocxUpload: boolean;
}

function EditablePreviewModal({ resume, onClose, onDownload, onResumeChange, isDownloading, isDocxUpload }: EditablePreviewModalProps) {
  const [editedResume, setEditedResume] = useState<ResumeData>(JSON.parse(JSON.stringify(resume)));
  const [previewHTML, setPreviewHTML] = useState<string>('');
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [activeTab, setActiveTab] = useState<'edit' | 'reorder'>('edit');

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
  useState(() => {
    regeneratePreview();
  });

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

  // Update section order
  const updateSectionOrder = async (newOrder: string[]) => {
    const updated = { ...editedResume, sectionOrder: newOrder };
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
              {/* Summary Section */}
              <div className="mb-6 pb-6 border-b border-slate-200">
                <h3 className="text-sm font-bold text-blue-600 uppercase tracking-wide mb-3">Professional Summary</h3>
                <textarea
                  value={editedResume.summary}
                  onChange={(e) => updateSummary(e.target.value)}
                  className="w-full min-h-[100px] p-3 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  placeholder="Enter your professional summary..."
                />
                {/* ✨ AI Button for Summary */}
                <div className="flex justify-end mt-1">
                  <AIButton
                    text={editedResume.summary}
                    onRewrite={(newText) => updateSummary(newText)}
                    sectionType="summary"
                  />
                </div>
              </div>

              {/* Experience Section */}
              {editedResume.experience && editedResume.experience.length > 0 && (
                <div className="mb-6 pb-6 border-b border-slate-200">
                  <h3 className="text-sm font-bold text-blue-600 uppercase tracking-wide mb-3">Work Experience</h3>
                  <div className="space-y-6">
                    {editedResume.experience.map((exp, expIndex) => (
                      <div key={expIndex} className="bg-slate-50 rounded-lg p-4">
                        <div className="font-semibold text-slate-900 mb-1">{exp.title}</div>
                        <div className="text-sm text-slate-600 mb-3">{exp.company}</div>

                        <div className="space-y-2">
                          {exp.bullets.map((bullet, bulletIndex) => (
                            <div key={bulletIndex} className="flex gap-2 items-start">
                              <span className="text-slate-400 mt-1.5">•</span>
                              <input
                                type="text"
                                value={bullet}
                                onChange={(e) => updateExperienceBullet(expIndex, bulletIndex, e.target.value)}
                                className="flex-1 text-sm px-2 py-1 border border-slate-200 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              />
                              {/* ✨ AI Button for Experience Bullet */}
                              <AIButton
                                text={bullet}
                                onRewrite={(newText) => updateExperienceBullet(expIndex, bulletIndex, newText)}
                                sectionType="bullet"
                              />
                              <button
                                onClick={() => deleteExperienceBullet(expIndex, bulletIndex)}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                                title="Delete bullet">
                                <TrashIcon />
                              </button>
                            </div>
                          ))}

                          <button
                            onClick={() => addExperienceBullet(expIndex)}
                            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium mt-2">
                            <PlusIcon />
                            Add Bullet Point
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Internships Section */}
              {editedResume.internships && editedResume.internships.length > 0 && (
                <div className="mb-6 pb-6 border-b border-slate-200">
                  <h3 className="text-sm font-bold text-blue-600 uppercase tracking-wide mb-3">Internships</h3>
                  <div className="space-y-6">
                    {editedResume.internships.map((int, intIndex) => (
                      <div key={intIndex} className="bg-slate-50 rounded-lg p-4">
                        <div className="font-semibold text-slate-900 mb-1">{int.title}</div>
                        <div className="text-sm text-slate-600 mb-3">{int.company}</div>

                        <div className="space-y-2">
                          {int.bullets.map((bullet, bulletIndex) => (
                            <div key={bulletIndex} className="flex gap-2 items-start">
                              <span className="text-slate-400 mt-1.5">•</span>
                              <input
                                type="text"
                                value={bullet}
                                onChange={(e) => updateInternshipBullet(intIndex, bulletIndex, e.target.value)}
                                className="flex-1 text-sm px-2 py-1 border border-slate-200 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              />
                              {/* ✨ AI Button for Internship Bullet */}
                              <AIButton
                                text={bullet}
                                onRewrite={(newText) => updateInternshipBullet(intIndex, bulletIndex, newText)}
                                sectionType="bullet"
                              />
                              <button
                                onClick={() => deleteInternshipBullet(intIndex, bulletIndex)}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                                title="Delete bullet">
                                <TrashIcon />
                              </button>
                            </div>
                          ))}

                          <button
                            onClick={() => addInternshipBullet(intIndex)}
                            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium mt-2">
                            <PlusIcon />
                            Add Bullet Point
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700">
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
                sectionOrder={editedResume.sectionOrder}
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
        <p className="text-xs text-slate-500">Updates automatically as you edit or reorder</p>
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

  // ── Auth states ───────────────────────────────────────────────────────────
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const { user } = useAuth();

  const fileInputRef = useRef<HTMLInputElement>(null);

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
    setLoadingStep('LlamaParse reading your resume (~20 seconds)...');

    if (inputMode === 'upload' && uploadedFile) {
      const fd = new FormData();
      fd.append('file', uploadedFile);
      fd.append('careerStage', careerStage);
      const res = await fetch('/api/parse', { method: 'POST', body: fd });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? 'Parse failed'); }
      const d = await res.json();

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

      return d.resume as ResumeData;
    }

    const text = resumeText.trim();
    if (text.length < 10) throw new Error('Please enter your resume text.');
    const res = await fetch('/api/parse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, careerStage }),
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

    // Check if user is logged in
    if (!user) {
      setShowLoginModal(true);
      return;
    }

    // Track download and check limit
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

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

      setShowCoverLetterPreview(false);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'PDF download failed');
    } finally {
      setIsDownloading(false);
    }
  };

  // ── ✨ UPDATED: Main handler - handles both resume and cover letter ──────
  const handleGenerate = async () => {
    setError(null);
    setIsLoading(true);
    setOptimizedResume(null);
    setChanges([]);
    setKeywords([]);
    setCoverLetter('');

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
    

    // Check if user is logged in
    if (!user) {
      setShowLoginModal(true);
      return;
    }

    // Track download and check limit
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

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
        requestBody.originalDocx   = originalDocx;
        requestBody.originalResume = originalResume;
        console.log('[page] Sending DOCX template data for format preservation');
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
      a.href = url;
      a.download = `${name}_ATS_Optimized.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

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
    (inputMode === 'paste' ? resumeText.trim().length > 10 : uploadedFile !== null);

  const fileIsDocx = uploadedFile?.name.toLowerCase().endsWith('.docx') ?? false;
  const fileIsPdf  = uploadedFile?.name.toLowerCase().endsWith('.pdf')  ?? false;

  return (
    <>
      {/* Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSuccess={() => {
          setShowLoginModal(false);
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

            {/* ── LEFT: Inputs ── */}
            <div className="space-y-4">

              {/* Resume input */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h2 className="font-semibold text-slate-900 text-sm">Your Resume</h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {inputMode === 'upload' && uploadSubMode === 'docx'
                        ? '✨ DOCX format will be preserved in output'
                        : 'All sections preserved'}
                    </p>
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
                      {uploadSubMode === 'docx' && !uploadedFile && (
                        <div className="mb-3 bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700">
                          <strong>✨ DOCX Mode:</strong> Upload your Word file and we'll return a PDF that preserves your exact fonts, colors, and layout — only the content will change.
                        </div>
                      )}

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
                                {fileIsDocx && (
                                  <span className="text-blue-600 font-medium"> · Format preserved ✨</span>
                                )}
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
            <div className="space-y-4">

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
                <ResumeSectionSummary resume={parsedResume} />
              )}

              {/* Resume Results */}
              {optimizedResume && !isLoading && (
                <>
                  <KeywordBadges keywords={keywords} />
                  <ChangesList changes={changes} />
                  <ResumeSectionSummary resume={optimizedResume} />

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
      {/* Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSuccess={() => setShowLoginModal(false)}
/>
    </>
  );
}
