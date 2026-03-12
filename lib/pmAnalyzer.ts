import { PM_KEYWORDS } from './pmKeywords';

export function detectMissingPMKeywords(resumeText: string) {
  const lowerText = resumeText.toLowerCase();

  const missing = PM_KEYWORDS.filter(keyword =>
    !lowerText.includes(keyword.toLowerCase())
  );

  return {
    missingKeywords: missing.slice(0, 6),
  };
}
