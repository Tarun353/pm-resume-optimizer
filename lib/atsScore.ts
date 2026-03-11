import { ResumeData } from './types';

const ACTION_VERBS = [
  'achieved', 'built', 'created', 'delivered', 'designed', 'drove', 'expanded', 'improved',
  'implemented', 'increased', 'launched', 'led', 'managed', 'optimized', 'owned', 'reduced', 'scaled',
];

export interface ATSScoreResult {
  score: number;
  suggestions: string[];
}

export function calculateATSScore(resume: ResumeData): number {
  return calculateATSScoreWithSuggestions(resume).score;
}

export function calculateATSScoreWithSuggestions(resume: ResumeData): ATSScoreResult {
  let score = 0;
  const suggestions: string[] = [];

  if (resume.summary?.trim()) {
    score += 10;
  } else {
    suggestions.push('Add Professional Summary (+10)');
  }

  if ((resume.experience?.length ?? 0) > 0) {
    score += 20;
  } else {
    suggestions.push('Add Work Experience (+20)');
  }

  if ((resume.skills?.length ?? 0) >= 5) {
    score += 10;
  } else {
    suggestions.push('Add more skills (+10)');
  }

  if ((resume.certifications?.length ?? 0) > 0) {
    score += 10;
  } else {
    suggestions.push('Add certifications (+10)');
  }

  if ((resume.projects?.length ?? 0) > 0) {
    score += 10;
  } else {
    suggestions.push('Add projects (+10)');
  }

  const experienceBullets = (resume.experience ?? []).flatMap((entry) => entry.bullets ?? []);
  const hasNumericImpact = experienceBullets.some((bullet) => /\d+/.test(bullet ?? ''));
  if (hasNumericImpact) {
    score += 20;
  } else {
    suggestions.push('Add measurable achievements (+20)');
  }

  const hasActionVerbs = experienceBullets.some((bullet) => {
    const normalized = (bullet || '').toLowerCase();
    return ACTION_VERBS.some((verb) => normalized.includes(verb));
  });

  if (hasActionVerbs) {
    score += 20;
  } else {
    suggestions.push('Use action verbs in experience bullets (+20)');
  }

  return {
    score: Math.min(score, 100),
    suggestions,
  };
}
