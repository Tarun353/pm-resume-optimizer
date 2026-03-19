/**
 * atsScorer.ts
 *
 * Real, honest ATS score calculation.
 * No AI needed. Pure text matching — resume vs job description.
 *
 * Score breakdown (100 pts total):
 *   40 pts — JD Keyword Match   (actual keywords from THEIR JD found in THEIR resume)
 *   25 pts — PM Vocabulary      (product management core terms)
 *   20 pts — Metrics Presence   (quantified impact in bullets)
 *   15 pts — Action Verbs       (strong PM-relevant action verbs)
 */

// ─── PM-specific vocabulary ────────────────────────────────────────────────────

const PM_CORE_TERMS = [
  'roadmap', 'product roadmap', 'backlog', 'sprint', 'agile', 'scrum', 'kanban',
  'user story', 'user stories', 'acceptance criteria', 'prd', 'product requirements',
  'stakeholder', 'stakeholders', 'cross-functional', 'go-to-market', 'gtm',
  'north star', 'okr', 'kpi', 'metrics', 'retention', 'activation', 'acquisition',
  'churn', 'nps', 'dau', 'mau', 'arpu', 'conversion rate', 'funnel',
  'a/b test', 'a/b testing', 'experimentation', 'hypothesis',
  'user research', 'user interview', 'usability', 'ux', 'wireframe',
  'discovery', 'prioritization', 'prioritize', 'trade-off', 'tradeoff',
  'mvp', 'minimum viable', 'iteration', 'launch', 'shipped', 'delivered',
  'stakeholder alignment', 'executive', 'c-suite',
  'product strategy', 'product vision', 'product thinking',
  'data-driven', 'data driven', 'analytics', 'insight',
  'feature', 'epic', 'initiative', 'milestone',
  'engineering', 'design', 'collaboration', 'alignment',
];

const PM_ACTION_VERBS = [
  'led', 'drove', 'launched', 'scaled', 'owned', 'defined', 'designed',
  'built', 'shipped', 'delivered', 'prioritized', 'coordinated', 'aligned',
  'partnered', 'collaborated', 'analyzed', 'identified', 'conducted',
  'developed', 'created', 'implemented', 'managed', 'spearheaded',
  'established', 'achieved', 'increased', 'improved', 'reduced',
  'optimized', 'streamlined', 'championed', 'influenced', 'facilitated',
  'negotiated', 'synthesized', 'translated', 'transformed', 'accelerated',
];

// ─── Tokenise helpers ──────────────────────────────────────────────────────────

function normalise(text: string): string {
  return text.toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

function containsPhrase(text: string, phrase: string): boolean {
  return normalise(text).includes(normalise(phrase));
}

// ─── Extract meaningful keywords from JD ──────────────────────────────────────

export function extractJDKeywords(jd: string): string[] {
  const lower = normalise(jd);
  const words = lower.split(/\s+/);

  // Frequency map
  const freq: Record<string, number> = {};
  for (const w of words) {
    if (w.length < 4) continue;
    freq[w] = (freq[w] ?? 0) + 1;
  }

  // Known stop words to skip
  const stopWords = new Set([
    'that', 'this', 'with', 'have', 'will', 'from', 'they', 'been',
    'were', 'your', 'about', 'which', 'their', 'what', 'when', 'where',
    'more', 'also', 'some', 'than', 'other', 'into', 'over', 'such',
    'work', 'team', 'role', 'join', 'help', 'great', 'good', 'best',
    'make', 'like', 'know', 'need', 'able', 'using', 'used', 'each',
    'across', 'within', 'through', 'ensure', 'provide', 'strong',
    'experience', 'including', 'required', 'preferred', 'looking',
    'candidate', 'position', 'company', 'opportunity', 'apply',
    'years', 'year', 'time', 'based', 'well', 'high', 'level',
  ]);

  // 2-gram extraction for compound terms
  const bigrams: Record<string, number> = {};
  for (let i = 0; i < words.length - 1; i++) {
    const bigram = `${words[i]} ${words[i + 1]}`;
    if (words[i]!.length >= 4 && words[i + 1]!.length >= 4) {
      bigrams[bigram] = (bigrams[bigram] ?? 0) + 1;
    }
  }

  // Significant bigrams (appear 2+ times)
  const significantBigrams = Object.entries(bigrams)
    .filter(([_, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([term]) => term);

  // Top single keywords
  const topKeywords = Object.entries(freq)
    .filter(([w]) => !stopWords.has(w))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 25)
    .map(([w]) => w);

  return [...new Set([...significantBigrams, ...topKeywords])].slice(0, 20);
}

// ─── Score: JD Keyword Match (40 pts) ─────────────────────────────────────────

function scoreJDKeywords(resumeText: string, jdText: string): {
  score: number;
  maxScore: number;
  matched: string[];
  missing: string[];
} {
  const keywords = extractJDKeywords(jdText);
  if (keywords.length === 0) return { score: 0, maxScore: 40, matched: [], missing: [] };

  const matched: string[] = [];
  const missing: string[] = [];

  for (const kw of keywords) {
    if (containsPhrase(resumeText, kw)) matched.push(kw);
    else missing.push(kw);
  }

  const ratio = matched.length / keywords.length;
  const score = Math.round(ratio * 40);

  return { score, maxScore: 40, matched, missing };
}

// ─── Score: PM Vocabulary (25 pts) ────────────────────────────────────────────

function scorePMVocabulary(resumeText: string): {
  score: number;
  maxScore: number;
  found: string[];
  missing: string[];
} {
  const found: string[] = [];
  const missing: string[] = [];

  for (const term of PM_CORE_TERMS) {
    if (containsPhrase(resumeText, term)) found.push(term);
    else missing.push(term);
  }

  // Scoring: hitting 12+ PM terms = full 25 pts
  const threshold = 12;
  const score = Math.min(25, Math.round((found.length / threshold) * 25));

  return { score, maxScore: 25, found, missing };
}

// ─── Score: Metrics Presence (20 pts) ─────────────────────────────────────────

function scoreMetrics(resumeText: string): {
  score: number;
  maxScore: number;
  bulletCount: number;
  bulletsWithMetrics: number;
  examples: string[];
} {
  // Extract bullet-like lines
  const lines = resumeText
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.startsWith('•') || l.startsWith('-') || l.startsWith('*') || /^\d+\./.test(l) || l.length > 40);

  const bulletLines = lines.filter(l => l.length > 20);

  // A line has metrics if it contains: %, $, ₹, a number followed by K/M/x, or a plain number > 10
  const metricRegex = /(\d+\.?\d*\s*(%|x|X|k\b|K\b|M\b|L\b|cr\b|lakh|crore|mn\b)|₹\s*\d+|\$\s*\d+|\d{2,}[\s,]\d{3}|\d+\+\s*(users|customers|clients|schools|teams|features|products|markets))/i;

  const bulletsWithMetrics: string[] = [];
  const examples: string[] = [];

  for (const line of bulletLines) {
    if (metricRegex.test(line)) {
      bulletsWithMetrics.push(line);
      if (examples.length < 3) examples.push(line.substring(0, 100));
    }
  }

  const total = Math.max(bulletLines.length, 1);
  const ratio = bulletsWithMetrics.length / total;

  // Scoring: 40%+ bullets with metrics = 20 pts
  let score: number;
  if (ratio >= 0.5) score = 20;
  else if (ratio >= 0.35) score = 16;
  else if (ratio >= 0.2) score = 12;
  else if (ratio >= 0.1) score = 7;
  else if (bulletsWithMetrics.length > 0) score = 4;
  else score = 0;

  return {
    score,
    maxScore: 20,
    bulletCount: bulletLines.length,
    bulletsWithMetrics: bulletsWithMetrics.length,
    examples,
  };
}

// ─── Score: Action Verbs (15 pts) ─────────────────────────────────────────────

function scoreActionVerbs(resumeText: string): {
  score: number;
  maxScore: number;
  verbsFound: string[];
  verbsMissing: string[];
} {
  const lower = normalise(resumeText);
  const verbsFound: string[] = [];
  const verbsMissing: string[] = [];

  for (const verb of PM_ACTION_VERBS) {
    const pattern = new RegExp(`\\b${verb}\\b`);
    if (pattern.test(lower)) verbsFound.push(verb);
    else verbsMissing.push(verb);
  }

  // Scoring: 8+ distinct verbs = full 15 pts
  const threshold = 8;
  const score = Math.min(15, Math.round((verbsFound.length / threshold) * 15));

  return { score, maxScore: 15, verbsFound, verbsMissing };
}

// ─── Profile-specific feedback ─────────────────────────────────────────────────

function getProfileFeedback(
  profile: string,
  totalScore: number,
  metricsResult: ReturnType<typeof scoreMetrics>,
  jdMissing: string[]
): string[] {
  const tips: string[] = [];

  if (profile === 'aspiring') {
    if (metricsResult.bulletsWithMetrics === 0) {
      tips.push('Add numbers to your project bullets — even small ones count: "Built a feature used by 200 students", "Reduced onboarding time by 30%"');
    }
    if (totalScore < 50) {
      tips.push('Focus on product thinking language: user problem → solution → outcome. Even for college projects or internships.');
    }
    tips.push('For aspiring PMs, projects and internships matter more than experience. Make sure yours are front and center.');
  }

  if (profile === 'transitioning') {
    tips.push('Reframe your previous experience using PM language: "led cross-functional team", "drove go-to-market strategy", "owned delivery timeline".');
    if (jdMissing.length > 5) {
      tips.push('Your current resume uses domain-specific language from your old career. Replace or supplement with PM vocabulary from the JD.');
    }
  }

  if (profile === 'experienced') {
    if (metricsResult.bulletsWithMetrics < 3) {
      tips.push('Senior PM resumes need 60%+ bullet points with metrics. Reviewers scan for scope: team size, ARR, user count, retention %.');
    }
    if (totalScore < 70) {
      tips.push('At the experienced level, a low keyword match is a red flag. The optimizer will align your summary and bullets to this specific JD.');
    }
  }

  return tips;
}

// ─── Main scorer ───────────────────────────────────────────────────────────────

export interface ATSScoreResult {
  totalScore: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  gradeLabel: string;
  breakdown: {
    jdKeywords:   { score: number; maxScore: number; matched: string[]; missing: string[] };
    pmVocab:      { score: number; maxScore: number; found: string[]; missing: string[] };
    metrics:      { score: number; maxScore: number; bulletCount: number; bulletsWithMetrics: number; examples: string[] };
    actionVerbs:  { score: number; maxScore: number; verbsFound: string[]; verbsMissing: string[] };
  };
  topMissingKeywords: string[]; // JD keywords missing from resume — most important
  profileTips: string[];
  hasJD: boolean;
}

export function scoreResume(
  resumeText: string,
  jdText: string,
  profile: string = 'experienced'
): ATSScoreResult {
  const hasJD = jdText.trim().length >= 50;

  const jdResult      = hasJD ? scoreJDKeywords(resumeText, jdText) : { score: 0, maxScore: 40, matched: [], missing: [] };
  const pmResult      = scorePMVocabulary(resumeText);
  const metricsResult = scoreMetrics(resumeText);
  const verbsResult   = scoreActionVerbs(resumeText);

  // If no JD, redistribute weight: PM vocab 50, metrics 30, verbs 20
  let totalScore: number;
  if (hasJD) {
    totalScore = jdResult.score + pmResult.score + metricsResult.score + verbsResult.score;
  } else {
    const pmScaled      = Math.round((pmResult.score      / 25) * 50);
    const metricsScaled = Math.round((metricsResult.score / 20) * 30);
    const verbsScaled   = Math.round((verbsResult.score   / 15) * 20);
    totalScore = pmScaled + metricsScaled + verbsScaled;
  }

  totalScore = Math.min(100, Math.max(0, totalScore));

  let grade: ATSScoreResult['grade'];
  let gradeLabel: string;
  if      (totalScore >= 80) { grade = 'A'; gradeLabel = 'Strong Match'; }
  else if (totalScore >= 65) { grade = 'B'; gradeLabel = 'Good — room to improve'; }
  else if (totalScore >= 50) { grade = 'C'; gradeLabel = 'Needs Work'; }
  else if (totalScore >= 35) { grade = 'D'; gradeLabel = 'Significant Gaps'; }
  else                       { grade = 'F'; gradeLabel = 'Major Rewrite Needed'; }

  const profileTips = getProfileFeedback(profile, totalScore, metricsResult, jdResult.missing);

  return {
    totalScore,
    grade,
    gradeLabel,
    breakdown: {
      jdKeywords:  jdResult,
      pmVocab:     pmResult,
      metrics:     metricsResult,
      actionVerbs: verbsResult,
    },
    topMissingKeywords: jdResult.missing.slice(0, 10),
    profileTips,
    hasJD,
  };
}
