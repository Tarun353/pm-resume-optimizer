import type { ATSPersona } from '@/components/ats/PersonaSelector';

export interface ATSFunnelResult {
  score: number;
  breakdown: {
    pmSkills: number;
    impact: number;
    keywords: number;
  };
  insights: {
    missingKeywords: string[];
    bulletImprovements: string[];
    sectionFeedback: string[];
  };
}

const PERSONA_KEYWORDS: Record<ATSPersona, string[]> = {
  fresher: ['roadmap', 'prioritization', 'user research', 'sql', 'experimentation'],
  transitioning: ['stakeholder management', 'requirements', 'go-to-market', 'analytics', 'discovery'],
  pm: ['north star metric', 'retention', 'a/b testing', 'launch', 'cross-functional leadership'],
};

const extractResumeSignals = (text: string) => {
  const normalized = text.toLowerCase();
  const metricMatches = normalized.match(/\b\d+(?:%|x|k|m|\+)?\b/g) ?? [];
  const projectMentions = (normalized.match(/\b(project|launched|built|prototype|case study)\b/g) ?? []).length;
  return {
    normalized,
    metricCount: metricMatches.length,
    projectMentions,
  };
};

export function scoreResumeForPersona(persona: ATSPersona, resumeText: string, fileName: string): ATSFunnelResult {
  const { normalized, metricCount, projectMentions } = extractResumeSignals(resumeText);
  const personaKeywords = PERSONA_KEYWORDS[persona];
  const keywordMatches = personaKeywords.filter((keyword) => normalized.includes(keyword.toLowerCase()));
  const missingKeywords = personaKeywords.filter((keyword) => !keywordMatches.includes(keyword));

  const basePmSkills = 45 + keywordMatches.length * 10 + (normalized.includes('product') ? 8 : 0);
  const baseImpact = 40 + Math.min(metricCount * 8, 35);
  const baseKeywords = 42 + keywordMatches.length * 11;

  const pmSkills = Math.min(100, basePmSkills + (persona === 'transitioning' ? 6 : 0));
  const impact = Math.min(100, baseImpact + (persona === 'pm' ? 10 : persona === 'fresher' ? Math.min(projectMentions * 4, 10) : 4));
  const keywords = Math.min(100, baseKeywords + (persona === 'fresher' && projectMentions > 1 ? 8 : 0));

  let weightedScore = Math.round(pmSkills * 0.4 + impact * 0.3 + keywords * 0.3);
  if (persona === 'fresher') {
    weightedScore += Math.min(projectMentions * 3, 8);
  }
  if (persona === 'pm') {
    weightedScore += Math.min(metricCount * 2, 8);
  }

  const score = Math.max(51, Math.min(96, weightedScore));

  return {
    score,
    breakdown: {
      pmSkills,
      impact,
      keywords,
    },
    insights: {
      missingKeywords: missingKeywords.length
        ? missingKeywords.map((keyword) => `Add context around ${keyword} to improve recruiter and ATS matching.`)
        : ['You covered the core persona keywords well; add more role-specific tools from the JD next.'],
      bulletImprovements: [
        `Rewrite at least one bullet in ${fileName} to lead with a strong PM action verb and measurable outcome.`,
        persona === 'fresher'
          ? 'Turn projects into mini product stories: problem, decision, launch, and result.'
          : 'Anchor bullets with business impact such as activation, retention, or revenue movement.',
        'Use a concise “what you shipped + why it mattered” format for your strongest experience bullets.',
      ],
      sectionFeedback: [
        persona === 'transitioning'
          ? 'Add a short PM transition summary that bridges your prior domain expertise to product work.'
          : 'Tighten the top summary so recruiters understand your PM narrative in under 10 seconds.',
        metricCount < 2
          ? 'Add at least 2 quantified wins to build trust with recruiters and ATS ranking models.'
          : 'Your quantified wins are helping; spread them across more bullets for stronger consistency.',
        projectMentions === 0
          ? 'Consider adding a projects or launches section so the resume shows shipping velocity.'
          : 'Projects are visible; highlight ownership, experimentation, and prioritization decisions more clearly.',
      ],
    },
  };
}
