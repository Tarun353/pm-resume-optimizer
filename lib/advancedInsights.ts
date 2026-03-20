import { createHash } from 'crypto';

import { extractJDKeywords, scoreResume } from '@/lib/atsScorer';
import { isAdvancedAnalysisEnabled } from '@/utils/featureFlags';

export type RecruiterInterest = 'LOW' | 'MEDIUM' | 'HIGH';
export type VisibilityLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface AdvancedInsightsResponse {
  visibility: VisibilityLevel;
  missing_keywords: string[];
  role_fit: 'CLEAR' | 'CONFUSED';
  impact_score: number;
  interview_probability: number;
  recommendations: string[];
  recruiter_search: {
    search_query_example: string;
    visibility: VisibilityLevel;
    missing_keywords: string[];
  };
  interview_assessment: {
    ats_match: number;
    recruiter_interest: RecruiterInterest;
    interview_probability: number;
  };
  impact_analysis: {
    impact_percentage: number;
    responsibility_percentage: number;
    impact_score: number;
  };
  role_detection: {
    detected_role: string;
    confidence: number;
  };
}

const ADVANCED_INSIGHTS_CACHE = new Map<string, AdvancedInsightsResponse>();
const MAX_CACHE_ENTRIES = 100;
const MAX_RESUME_CHARS_FOR_AI = 2000;
const MAX_JD_CHARS_FOR_AI = 1500;
const MAX_RECOMMENDATIONS = 3;
const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'in', 'into', 'is', 'of', 'on', 'or', 'that', 'the', 'to', 'with',
  'you', 'your', 'will', 'can', 'our', 'we', 'their', 'this', 'they', 'who', 'have', 'has', 'had', 'using', 'use', 'used', 'over',
  'than', 'within', 'across', 'through', 'about', 'such', 'ability', 'experience', 'years', 'year', 'work', 'working', 'strong',
  'preferred', 'requirements', 'qualifications', 'skills', 'skill', 'team', 'teams', 'product', 'manager', 'management', 'role',
]);
const IMPACT_METRIC_REGEX = /(\b\d+(?:\.\d+)?\s*(?:%|x|k|m|mn|b)\b|\$\s*\d+(?:\.\d+)?\s*(?:k|m|mn|b)?\b|\b\d+(?:,\d{3})+\b|\b\d+\s*(?:users|customers|clients|revenue|arr|mrr|nps|ctr|conversion|conversions|retention|downloads|signups|installs|experiments|tests)\b)/i;
const IMPACT_VERB_REGEX = /\b(grew|increased|improved|boosted|reduced|decreased|saved|generated|drove|lifted|scaled|optimized|achieved|delivered|expanded)\b/i;
const RESPONSIBILITY_REGEX = /\b(owned|managed|supported|coordinated|collaborated|partnered|responsible|assisted|worked with|helped|executed)\b/i;
const ROLE_KEYWORDS = {
  growth: ['retention', 'conversion', 'a/b', 'experiment', 'experimentation', 'activation', 'funnel', 'growth'],
  platform: ['api', 'apis', 'platform', 'system', 'systems', 'architecture', 'infrastructure', 'integration'],
  data: ['sql', 'analytics', 'dashboard', 'dashboards', 'metric', 'metrics', 'insight', 'insights', 'data'],
} as const;

function cloneDefaultAdvancedInsightsResponse(): AdvancedInsightsResponse {
  return JSON.parse(JSON.stringify(DEFAULT_ADVANCED_INSIGHTS_RESPONSE)) as AdvancedInsightsResponse;
}

export const DEFAULT_ADVANCED_INSIGHTS_RESPONSE: AdvancedInsightsResponse = {
  visibility: 'LOW',
  missing_keywords: [],
  role_fit: 'CONFUSED',
  impact_score: 40,
  interview_probability: 35,
  recommendations: [],
  recruiter_search: {
    search_query_example: 'product manager roadmap analytics stakeholder management',
    visibility: 'LOW',
    missing_keywords: [],
  },
  interview_assessment: {
    ats_match: 35,
    recruiter_interest: 'LOW',
    interview_probability: 35,
  },
  impact_analysis: {
    impact_percentage: 0,
    responsibility_percentage: 100,
    impact_score: 40,
  },
  role_detection: {
    detected_role: 'General PM',
    confidence: 35,
  },
};

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function normalizeText(text: string) {
  return text.toLowerCase();
}

function extractBullets(resumeText: string) {
  return resumeText
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 20)
    .filter((line) => /^[•\-*]/.test(line) || /^\d+\./.test(line) || /\b(led|owned|built|launched|managed|improved|reduced|grew|analyzed|designed)\b/i.test(line));
}

function computeVisibility(matchedCount: number, totalCount: number): VisibilityLevel {
  const ratio = totalCount > 0 ? matchedCount / totalCount : 0;
  if (ratio >= 0.65) return 'HIGH';
  if (ratio >= 0.35) return 'MEDIUM';
  return 'LOW';
}

function computeRecruiterInterest(atsMatch: number, impactScore: number): RecruiterInterest {
  const blended = Math.round((atsMatch * 0.65) + (impactScore * 0.35));
  if (blended >= 75) return 'HIGH';
  if (blended >= 50) return 'MEDIUM';
  return 'LOW';
}

function extractSignificantTerms(text: string, limit: number) {
  return Array.from(new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9+#/.\-\s]/g, ' ')
      .split(/\s+/)
      .map((term) => term.trim())
      .filter((term) => term.length >= 3)
      .filter((term) => !STOP_WORDS.has(term))
  )).slice(0, limit);
}

function extractMissingKeywords(jdText: string, resumeText: string, limit = 8) {
  const normalizedResume = normalizeText(resumeText);
  const atsKeywords = extractJDKeywords(jdText)
    .map((keyword) => keyword.trim())
    .filter(Boolean);
  const jdTerms = extractSignificantTerms(jdText, 40);
  const combinedKeywords = Array.from(new Set([...atsKeywords, ...jdTerms]));
  const matchedKeywords = combinedKeywords.filter((keyword) => normalizedResume.includes(keyword.toLowerCase()));
  const missingKeywords = combinedKeywords.filter((keyword) => !normalizedResume.includes(keyword.toLowerCase())).slice(0, limit);

  return { matchedKeywords, missingKeywords, allKeywords: combinedKeywords };
}

function calculateImpactAnalysis(resumeText: string) {
  const bullets = extractBullets(resumeText);
  const lines = bullets.length > 0 ? bullets : resumeText.split('\n').map((line) => line.trim()).filter(Boolean);
  const impactBullets = lines.filter((line) => IMPACT_METRIC_REGEX.test(line) || (IMPACT_VERB_REGEX.test(line) && /\d/.test(line)));
  const responsibilityBullets = lines.filter((line) => RESPONSIBILITY_REGEX.test(line));
  const impactPercentage = lines.length > 0 ? Math.round((impactBullets.length / lines.length) * 100) : 0;
  const responsibilityPercentage = lines.length > 0 ? Math.round((responsibilityBullets.length / lines.length) * 100) : 100;
  const impactScore = clamp(Math.round((impactPercentage * 0.7) + ((100 - responsibilityPercentage) * 0.3)));

  return {
    impactPercentage,
    responsibilityPercentage,
    impactScore,
  };
}

function detectRole(resumeText: string, jdText: string) {
  const text = normalizeText(`${resumeText}\n${jdText}`);
  const scoredRoles = Object.entries(ROLE_KEYWORDS)
    .map(([role, keywords]) => {
      const matches = keywords.filter((keyword) => text.includes(keyword)).length;
      return { role, matches, total: keywords.length };
    })
    .sort((a, b) => b.matches - a.matches);

  const best = scoredRoles[0];
  if (!best || best.matches === 0) {
    return { detected_role: 'General PM', confidence: 35 };
  }

  const roleNameMap: Record<string, string> = {
    growth: 'Growth PM',
    platform: 'Platform PM',
    data: 'Data PM',
  };

  return {
    detected_role: roleNameMap[best.role] || 'General PM',
    confidence: clamp(Math.round((best.matches / best.total) * 100)),
  };
}

function buildSearchQuery(jdKeywords: string[], resumeText: string) {
  const resumeTerms = ['product manager', 'roadmap', 'stakeholder management', 'analytics'].filter((term) =>
    normalizeText(resumeText).includes(term.replace(' manager', '')) || term === 'product manager'
  );
  return [...new Set([...jdKeywords.slice(0, 4), ...resumeTerms])].join(' ').trim() || DEFAULT_ADVANCED_INSIGHTS_RESPONSE.recruiter_search.search_query_example;
}

function buildFallbackRecommendations(missingKeywords: string[], roleDetection: { detected_role: string }, impactPercentage: number) {
  const recommendations: string[] = [];

  if (missingKeywords.length > 0) {
    recommendations.push(`Add high-signal JD terms like ${missingKeywords.slice(0, 3).join(', ')} in relevant resume bullets.`);
  }

  if (impactPercentage < 40) {
    recommendations.push('Rewrite more bullets to show measurable outcomes with percentages, revenue, users, or adoption metrics.');
  }

  recommendations.push(`Strengthen positioning for ${roleDetection.detected_role} by highlighting matching projects, systems, or experiments.`);

  return recommendations.slice(0, MAX_RECOMMENDATIONS);
}

function cleanJsonString(text: string) {
  if (!text) return '';

  return text
    .replace(/```(?:json)?/gi, '')
    .replace(/,\s*}/g, '}')
    .replace(/,\s*]/g, ']')
    .replace(/[\u0000-\u001F]+/g, '')
    .trim();
}

function safeJsonParse(text: string) {
  try {
    return JSON.parse(text);
  } catch (error) {
    console.error('[advanced-insights] Invalid JSON from AI:', error);
    return null;
  }
}

function isValidAdvancedResponse(data: unknown): data is { visibility?: string; interview_probability?: number; recommendations: string[] } {
  return Boolean(
    data &&
    typeof data === 'object' &&
    Array.isArray((data as { recommendations?: unknown }).recommendations)
  );
}

function parseVisibilityLevel(value: unknown): VisibilityLevel | undefined {
  return value === 'LOW' || value === 'MEDIUM' || value === 'HIGH' ? value : undefined;
}

function computeRoleFit(roleDetection: { confidence: number }, matchedKeywordCount: number) {
  return roleDetection.confidence >= 50 || matchedKeywordCount >= 4 ? 'CLEAR' : 'CONFUSED';
}

function trimForAi(text: string, maxChars: number) {
  return text.replace(/\s+/g, ' ').trim().slice(0, maxChars);
}

function createCacheKey(resumeText: string, jdText: string, profile: string) {
  return createHash('sha256').update(`${resumeText}\n---\n${jdText}\n---\n${profile}`).digest('hex');
}

function getCachedInsights(cacheKey: string) {
  const cached = ADVANCED_INSIGHTS_CACHE.get(cacheKey);
  if (!cached) return null;

  ADVANCED_INSIGHTS_CACHE.delete(cacheKey);
  ADVANCED_INSIGHTS_CACHE.set(cacheKey, cached);

  return JSON.parse(JSON.stringify(cached)) as AdvancedInsightsResponse;
}

function setCachedInsights(cacheKey: string, response: AdvancedInsightsResponse) {
  if (ADVANCED_INSIGHTS_CACHE.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = ADVANCED_INSIGHTS_CACHE.keys().next().value;
    if (oldestKey) {
      ADVANCED_INSIGHTS_CACHE.delete(oldestKey);
    }
  }

  ADVANCED_INSIGHTS_CACHE.set(cacheKey, JSON.parse(JSON.stringify(response)) as AdvancedInsightsResponse);
}

async function getGeminiInsights(context: {
  trimmedResume: string;
  trimmedJD: string;
  missingKeywords: string[];
  roleDetection: { detected_role: string; confidence: number };
  impactScore: number;
  visibility: VisibilityLevel;
  interviewProbability: number;
  fallbackRecommendations: string[];
}): Promise<{ visibility?: VisibilityLevel; interview_probability?: number; recommendations: string[] }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not set');
  }

  const requestPayload = {
    resume_summary: context.trimmedResume,
    jd_summary: context.trimmedJD,
    precomputed_metrics: {
      missing_keywords: context.missingKeywords.slice(0, 6),
      impact_score: context.impactScore,
      role_type: context.roleDetection.detected_role,
      role_confidence: context.roleDetection.confidence,
      baseline_visibility: context.visibility,
      baseline_interview_probability: context.interviewProbability,
    },
  };

  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: `Analyze this Product Manager resume. Inputs: resume summary, job description summary, precomputed metrics (missing keywords, impact score, role type). Return STRICT JSON only: {"visibility":"LOW|MEDIUM|HIGH","interview_probability":number,"recommendations":[string]}. Be concise, meaningful, and actionable. Max 120 words. Limit recommendations to ${MAX_RECOMMENDATIONS}. Data: ${JSON.stringify(requestPayload)}`,
        }],
      }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 140,
        responseMimeType: 'application/json',
      },
    }),
  });

  if (!res.ok) {
    const message = await res.text().catch(() => res.statusText);
    throw new Error(`Gemini advanced insights failed: ${res.status} ${message}`);
  }

  const data = await res.json() as any;
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  const cleaned = cleanJsonString(text || '{}');
  const parsed = safeJsonParse(cleaned);

  if (!parsed || !isValidAdvancedResponse(parsed)) {
    console.warn('[advanced-insights] Invalid Gemini response structure, using fallback recommendations.');
    return { recommendations: context.fallbackRecommendations };
  }

  return {
    visibility: parseVisibilityLevel(parsed.visibility),
    interview_probability: typeof parsed.interview_probability === 'number' ? clamp(Math.round(parsed.interview_probability)) : undefined,
    recommendations: parsed.recommendations
      .filter((recommendation): recommendation is string => typeof recommendation === 'string' && recommendation.trim().length > 0)
      .map((recommendation) => recommendation.trim())
      .slice(0, MAX_RECOMMENDATIONS),
  };
}

export async function buildAdvancedInsights(resumeText: string, jdText: string, profile: string): Promise<AdvancedInsightsResponse> {
  if (!isAdvancedAnalysisEnabled()) {
    return cloneDefaultAdvancedInsightsResponse();
  }

  const cacheKey = createCacheKey(resumeText, jdText, profile);
  const cached = getCachedInsights(cacheKey);
  if (cached) {
    return cached;
  }

  const atsResult = scoreResume(resumeText, jdText, profile);
  const { matchedKeywords, missingKeywords, allKeywords } = extractMissingKeywords(jdText, resumeText);
  const { impactPercentage, responsibilityPercentage, impactScore } = calculateImpactAnalysis(resumeText);
  const visibility = computeVisibility(matchedKeywords.length, Math.max(allKeywords.length, 1));
  const roleDetection = detectRole(resumeText, jdText);
  const roleFit = computeRoleFit(roleDetection, matchedKeywords.length);
  const recruiterInterest = computeRecruiterInterest(atsResult.totalScore, impactScore);
  const baselineInterviewProbability = clamp(Math.round((atsResult.totalScore * 0.6) + (impactScore * 0.25) + (roleDetection.confidence * 0.15)));

  const fallbackRecommendations = buildFallbackRecommendations(missingKeywords, roleDetection, impactPercentage);
  let recommendations = fallbackRecommendations;
  let finalVisibility = visibility;
  let interviewProbability = baselineInterviewProbability;

  try {
    const geminiInsights = await getGeminiInsights({
      trimmedResume: trimForAi(resumeText, MAX_RESUME_CHARS_FOR_AI),
      trimmedJD: trimForAi(jdText, MAX_JD_CHARS_FOR_AI),
      missingKeywords,
      roleDetection,
      impactScore,
      visibility,
      interviewProbability: baselineInterviewProbability,
      fallbackRecommendations,
    });

    if (geminiInsights.recommendations.length > 0) {
      recommendations = geminiInsights.recommendations;
    }

    if (geminiInsights.visibility === 'LOW' || geminiInsights.visibility === 'MEDIUM' || geminiInsights.visibility === 'HIGH') {
      finalVisibility = geminiInsights.visibility;
    }

    if (typeof geminiInsights.interview_probability === 'number') {
      interviewProbability = geminiInsights.interview_probability;
    }
  } catch (error) {
    console.error('[advanced-insights] Gemini insights failed, using computed fallback insights.', error);
  }

  const response: AdvancedInsightsResponse = {
    visibility: finalVisibility,
    missing_keywords: missingKeywords,
    role_fit: roleFit,
    impact_score: impactScore,
    interview_probability: interviewProbability,
    recommendations,
    recruiter_search: {
      search_query_example: buildSearchQuery(allKeywords, resumeText),
      visibility: finalVisibility,
      missing_keywords: missingKeywords,
    },
    interview_assessment: {
      ats_match: atsResult.totalScore,
      recruiter_interest: recruiterInterest,
      interview_probability: interviewProbability,
    },
    impact_analysis: {
      impact_percentage: impactPercentage,
      responsibility_percentage: responsibilityPercentage,
      impact_score: impactScore,
    },
    role_detection: roleDetection,
  };

  setCachedInsights(cacheKey, response);

  return response;
}

export async function buildRecruiterSimulation(resumeText: string, jdText: string, profile: string) {
  const insights = await buildAdvancedInsights(resumeText, jdText, profile);
  return {
    visibility: insights.visibility,
    missing_keywords: insights.missing_keywords,
    role_fit: insights.role_fit,
    impact_score: insights.impact_score,
    interview_probability: insights.interview_probability,
    recommendations: insights.recommendations,
    recruiter_search: insights.recruiter_search,
  };
}

export function buildDefaultAdvancedInsightsResponse() {
  return cloneDefaultAdvancedInsightsResponse();
}
