import { ResumeData } from './types';

export function calculateATSScore(resume: ResumeData): number {
  let score = 0;

  if (resume.summary?.trim()) score += 10;
  if ((resume.experience?.length ?? 0) > 0) score += 25;
  if ((resume.education?.length ?? 0) > 0) score += 15;
  if ((resume.skills?.length ?? 0) >= 5) score += 10;
  if ((resume.projects?.length ?? 0) > 0) score += 10;

  const bulletsWithNumbers = (resume.experience ?? []).reduce((count, entry) => {
    const numericBullets = (entry.bullets ?? []).filter((bullet) => /\d+/.test(bullet || '')).length;
    return count + numericBullets;
  }, 0);

  if (bulletsWithNumbers > 2) score += 20;

  if ((resume.certifications?.length ?? 0) > 0) score += 5;
  if ((resume.softSkills?.length ?? 0) > 0) score += 5;

  return Math.min(score, 100);
}
