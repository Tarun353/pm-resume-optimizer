'use client';

export type ATSPersona = 'fresher' | 'transitioning' | 'pm';

interface PersonaSelectorProps {
  value: ATSPersona | null;
  onChange: (persona: ATSPersona) => void;
}

const PERSONAS: Array<{
  value: ATSPersona;
  label: string;
  description: string;
  accent: string;
}> = [
  {
    value: 'fresher',
    label: 'Fresher',
    description: 'Prioritize projects, internships, and PM foundations.',
    accent: 'from-sky-500 to-cyan-500',
  },
  {
    value: 'transitioning',
    label: 'Transitioning to PM',
    description: 'Translate adjacent experience into PM-friendly signals.',
    accent: 'from-violet-500 to-indigo-500',
  },
  {
    value: 'pm',
    label: 'Experienced PM',
    description: 'Focus on outcomes, leadership, and quantified product impact.',
    accent: 'from-emerald-500 to-teal-500',
  },
];

export function PersonaSelector({ value, onChange }: PersonaSelectorProps) {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
      {PERSONAS.map((persona) => {
        const selected = value === persona.value;

        return (
          <button
            key={persona.value}
            type="button"
            onClick={() => onChange(persona.value)}
            className={`group relative overflow-hidden rounded-2xl border p-4 text-left transition-all duration-300 ${
              selected
                ? 'border-blue-500 bg-blue-50 shadow-lg shadow-blue-500/10'
                : 'border-slate-200 bg-white hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md'
            }`}
          >
            <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${persona.accent}`} />
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">{persona.label}</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">{persona.description}</p>
              </div>
              <span
                className={`mt-1 flex h-5 w-5 items-center justify-center rounded-full border transition-all ${
                  selected
                    ? 'border-blue-500 bg-blue-500 text-white'
                    : 'border-slate-300 bg-white text-transparent group-hover:border-slate-400'
                }`}
              >
                ✓
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
