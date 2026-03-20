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

const METRIC_REGEX = /(\d+\.?\d*\s*(%|x|k\b|m\b|mn\b|users|customers|clients|revenue|arr|mrr|nps|ctr|conversion|retention)|\$\s*\d+|₹\s*\d+)/i;
const RESPONSIBILITY_REGEX = /\b(owned|managed|supported|coordinated|collaborated|partnered|responsible|assisted|worked with|helped|executed)\b/i;

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

function detectRole(resumeText: string, jdText: string) {
  const text = normalizeText(`${resumeText}\n${jdText}`);
  const roleSignals = [
    {
      detected_role: 'Growth PM',
      keywords: ['a/b', 'experiment', 'conversion', 'retention', 'activation', 'growth', 'funnel'],
    },
    {
      detected_role: 'Platform PM',
      keywords: ['api', 'apis', 'platform', 'system', 'systems', 'infrastructure', 'integration'],
    },
    {
      detected_role: 'Data PM',
      keywords: ['sql', 'analytics', 'dashboard', 'experimentation', 'data', 'insight', 'metric'],
    },
  ];

  const scoredRoles = roleSignals.map((role) => {
    const matches = role.keywords.filter((keyword) => text.includes(keyword)).length;
    return { role: role.detected_role, matches, total: role.keywords.length };
  }).sort((a, b) => b.matches - a.matches);

  const best = scoredRoles[0];
  if (!best || best.matches === 0) {
    return { detected_role: 'General PM', confidence: 35 };
  }

  return {
    detected_role: best.role,
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

  return recommendations.slice(0, 3);
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

function isValidAdvancedResponse(data: unknown): data is { recommendations: string[] } {
  return Boolean(
    data &&
    typeof data === 'object' &&
    Array.isArray((data as { recommendations?: unknown }).recommendations)
  );
}

function computeRoleFit(roleDetection: { confidence: number }, matchedKeywordCount: number) {
  return roleDetection.confidence >= 50 || matchedKeywordCount >= 4 ? 'CLEAR' : 'CONFUSED';
}

async function getGeminiRecommendations(context: {
  missingKeywords: string[];
  roleDetection: { detected_role: string; confidence: number };
  impactPercentage: number;
  interviewProbability: number;
}): Promise<string[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not set');
  }

  const prompt = {
    missing_keywords: context.missingKeywords.slice(0, 6),
    detected_role: context.roleDetection.detected_role,
    role_confidence: context.roleDetection.confidence,
    impact_percentage: context.impactPercentage,
    interview_probability: context.interviewProbability,
  };

  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: `Return JSON only with a recommendations array of 3 short resume-improvement actions. Context: ${JSON.stringify(prompt)}`,
        }],
      }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 200,
        responseMimeType: 'application/json',
      },
    }),
  });

  if (!res.ok) {
    const message = await res.text().catch(() => res.statusText);
    throw new Error(`Gemini advanced recommendations failed: ${res.status} ${message}`);
  }

  try {
    const data = await res.json() as any;
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    const cleaned = cleanJsonString(text || '{}');
    const parsed = safeJsonParse(cleaned);

    if (!parsed) {
      console.warn('[advanced-insights] Falling back due to invalid AI JSON.');
      return [];
    }

    if (!isValidAdvancedResponse(parsed)) {
      console.warn('[advanced-insights] Invalid Gemini recommendation structure, using fallback recommendations.');
      return [];
    }

    return parsed.recommendations.slice(0, 3);
  } catch (error) {
    console.error('[advanced-insights] Advanced insights failed:', error);
    return [];
  }
}

export async function buildAdvancedInsights(resumeText: string, jdText: string, profile: string): Promise<AdvancedInsightsResponse> {
  if (!isAdvancedAnalysisEnabled()) {
    return cloneDefaultAdvancedInsightsResponse();
  }

  const atsResult = scoreResume(resumeText, jdText, profile);
  const jdKeywords = extractJDKeywords(jdText);
  const matchedKeywords = jdKeywords.filter((keyword) => normalizeText(resumeText).includes(keyword.toLowerCase()));
  const missingKeywords = jdKeywords.filter((keyword) => !matchedKeywords.includes(keyword)).slice(0, 8);
  const bullets = extractBullets(resumeText);
  const impactBullets = bullets.filter((bullet) => METRIC_REGEX.test(bullet));
  const responsibilityBullets = bullets.filter((bullet) => RESPONSIBILITY_REGEX.test(bullet));
  const impactPercentage = bullets.length > 0 ? Math.round((impactBullets.length / bullets.length) * 100) : 0;
  const responsibilityPercentage = bullets.length > 0 ? Math.round((responsibilityBullets.length / bullets.length) * 100) : 100;
  const impactScore = clamp(Math.round((impactPercentage * 0.7) + ((100 - responsibilityPercentage) * 0.3)));
  const visibility = computeVisibility(matchedKeywords.length, Math.max(jdKeywords.length, 1));
  const roleDetection = detectRole(resumeText, jdText);
  const roleFit = computeRoleFit(roleDetection, matchedKeywords.length);
  const recruiterInterest = computeRecruiterInterest(atsResult.totalScore, impactScore);
  const interviewProbability = clamp(Math.round((atsResult.totalScore * 0.6) + (impactScore * 0.25) + (roleDetection.confidence * 0.15)));

  const fallbackRecommendations = buildFallbackRecommendations(missingKeywords, roleDetection, impactPercentage);
  let recommendations = fallbackRecommendations;

  try {
    const geminiRecommendations = await getGeminiRecommendations({
      missingKeywords,
      roleDetection,
      impactPercentage,
      interviewProbability,
    });
    if (geminiRecommendations.length > 0) {
      recommendations = geminiRecommendations;
    }
  } catch (error) {
    console.error('[advanced-insights] Gemini recommendations failed, using fallback recommendations.', error);
  }

  return {
    visibility,
    missing_keywords: missingKeywords,
    role_fit: roleFit,
    impact_score: impactScore,
    interview_probability: interviewProbability,
    recommendations,
    recruiter_search: {
      search_query_example: buildSearchQuery(jdKeywords, resumeText),
      visibility,
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
