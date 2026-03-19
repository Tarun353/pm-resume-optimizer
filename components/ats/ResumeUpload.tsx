'use client';

import { useRef } from 'react';

interface ResumeUploadProps {
  fileName: string | null;
  isUploading: boolean;
  error: string | null;
  onFileSelect: (file: File) => void;
}

export function ResumeUpload({ fileName, isUploading, error, onFileSelect }: ResumeUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="group w-full rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-8 text-center transition-all duration-300 hover:border-blue-400 hover:bg-blue-50"
      >
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
          📄
        </div>
        <p className="mt-4 text-sm font-semibold text-slate-900">
          {isUploading
            ? 'Processing…'
            : fileName
            ? 'Replace uploaded PDF'
            : 'Upload your resume PDF'}
        </p>
        <p className="mt-1 text-xs text-slate-500">
          {fileName ?? 'PDF upload · Sample keyword signal · No login required'}
        </p>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) {
            onFileSelect(file);
            event.target.value = '';
          }
        }}
      />

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 animate-fadeIn">
          {error}
        </div>
      )}
    </div>
  );
}
