/**
 * app/api/analyse/route.ts — FIXED VERSION
 *
 * Key changes from original:
 * 1. robustJsonParse replaces cleanJsonString + safeJsonParse
 * 2. System prompt explicitly forbids markdown and preamble text
 * 3. Split strategy: >8 bullets = 2 parallel API calls (prevents truncation)
 * 4. patchPartialResult: recovers partial responses instead of full fallback
 * 5. isValidAnalysisResult is more lenient — accepts valid-ish results
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { groqChatCompletion } from '@/lib/aiClient';
import { scoreResume } from '@/lib/atsScorer';
import { parseResumeText } from '@/lib/resumeParser';
import { robustJsonParse } from '@/lib/jsonParser';
import type { ResumeData, CareerStage } from '@/lib/types';

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) throw new Error('Supabase credentials not configured');
  return createClient(url, serviceRoleKey);
}

const FREE_ANALYSIS_LIMIT = 5;

// ─── Types ──────────────────────────────────────────────────────────────────

export interface BulletAnalysis {
  original: string;
  score: number;
  strength: string | null;
  weakness: string;
  improved: string;
  tags: Array<'has_metric' | 'has_action_verb' | 'has_ownership' | 'jd_aligned' | 'too_vague' | 'no_impact'>;
  section: string;
}

export interface ResumeAnalysisResult {
  overallScore: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  gradeLabel: string;
  executiveSummary: string;
  summaryAnalysis: {
    original: string;
    score: number;
    feedback: string;
    improved: string;
  };
  bulletAnalysis: BulletAnalysis[];
  keywordsFound: string[];
  keywordsMissing: string[];
  pmVocabFound: string[];
  pmVocabMissing: string[];
  metricsScore: number;
  topImprovements: string[];
  profileSpecificFeedback: string;
}

// ─── Schema validator ────────────────────────────────────────────────────────
// More lenient than original — accepts partial results that can be patched.

function isValidAnalysisResult(data: unknown): data is ResumeAnalysisResult {
  if (!data || typeof data !== 'object') return false;
  const d = data as Record<string, unknown>;
  return (
    typeof d.overallScore === 'number' &&
    typeof d.grade === 'string' &&
    typeof d.executiveSummary === 'string' &&
    typeof d.summaryAnalysis === 'object' && d.summaryAnalysis !== null &&
    Array.isArray(d.bulletAnalysis) && d.bulletAnalysis.length > 0 &&
    Array.isArray(d.topImprovements)
  );
}

// ─── Partial result patcher ──────────────────────────────────────────────────
// Instead of throwing away a partial result, fill the gaps.

function patchPartialResult(
  partial: Record<string, unknown>,
  bullets: Array<{ text: string; section: string }>,
  summary: string,
): ResumeAnalysisResult {
  if (!Array.isArray(partial.bulletAnalysis) || partial.bulletAnalysis.length === 0) {
    partial.bulletAnalysis = bullets.map((b) => ({
      original: b.text, score: 5, strength: null,
      weakness: 'Detailed analysis unavailable for this bullet.',
      improved: b.text, tags: [], section: b.section,
    }));
  }
  if (!partial.summaryAnalysis) {
    partial.summaryAnalysis = {
      original: summary, score: 5,
      feedback: 'Detailed summary analysis unavailable.',
      improved: summary || 'Add a concise PM summary with product ownership, metrics, and domain expertise.',
    };
  }
  if (!Array.isArray(partial.keywordsFound)) partial.keywordsFound = [];
  if (!Array.isArray(partial.keywordsMissing)) partial.keywordsMissing = [];
  if (!Array.isArray(partial.pmVocabFound)) partial.pmVocabFound = [];
  if (!Array.isArray(partial.pmVocabMissing)) partial.pmVocabMissing = [];
  if (!Array.isArray(partial.topImprovements)) {
    partial.topImprovements = [
      'Add quantified metrics to at least 50% of your bullets.',
      'Align your summary with JD keywords from this role.',
      'Use stronger PM action verbs: drove, owned, launched, scaled.',
    ];
  }
  if (!partial.gradeLabel) partial.gradeLabel = 'Needs Work';
  if (!partial.profileSpecificFeedback) partial.profileSpecificFeedback = '';
  if (typeof partial.metricsScore !== 'number') partial.metricsScore = 0;
  if (!partial.grade) partial.grade = 'C';
  if (!partial.overallScore) partial.overallScore = 50;
  if (!partial.executiveSummary) partial.executiveSummary = 'Partial analysis available. Some sections could not be fully processed.';
  return partial as unknown as ResumeAnalysisResult;
}

// ─── Fallback builder ────────────────────────────────────────────────────────

function buildFallbackAnalysisResult(
  resumeText: string,
  jdText: string,
  profile: string,
  bullets: Array<{ text: string; section: string }>,
  summary: string,
): ResumeAnalysisResult {
  const clientScore = scoreResume(resumeText, jdText, profile);
  const overallScore = Math.round(clientScore.totalScore);
  const grade: ResumeAnalysisResult['grade'] =
    overallScore >= 90 ? 'A' : overallScore >= 80 ? 'B' :
    overallScore >= 70 ? 'C' : overallScore >= 60 ? 'D' : 'F';

  return {
    overallScore, grade, gradeLabel: clientScore.gradeLabel,
    executiveSummary: 'We could not fully parse the AI analysis, so this result uses a safe fallback based on the ATS score and extracted resume content.',
    summaryAnalysis: {
      original: summary, score: Math.max(1, Math.min(10, Math.round(overallScore / 10))),
      feedback: 'AI output was malformed. Review your summary for specificity, PM keywords, and measurable outcomes.',
      improved: summary || 'Add a concise summary focused on product ownership, measurable impact, and relevant domain expertise.',
    },
    bulletAnalysis: bullets.map((bullet) => ({
      original: bullet.text, score: 5, strength: null,
      weakness: 'Detailed AI bullet analysis was unavailable.',
      improved: bullet.text, tags: [], section: bullet.section,
    })),
    keywordsFound: clientScore.breakdown.jdKeywords.matched,
    keywordsMissing: clientScore.breakdown.jdKeywords.missing,
    pmVocabFound: clientScore.breakdown.pmVocab.found,
    pmVocabMissing: clientScore.breakdown.pmVocab.missing,
    metricsScore: clientScore.breakdown.metrics.score,
    topImprovements: [
      'Add more exact JD keywords into relevant bullets and your summary.',
      'Rewrite weak bullets to show measurable outcomes, scope, or user/business impact.',
      'Clarify PM ownership by naming products, decisions, experiments, or cross-functional leadership.',
    ],
    profileSpecificFeedback: `Safe fallback result for ${profile}: strengthen PM-specific language, keyword alignment, and measurable impact while the AI analysis is unavailable.`,
  };
}

// ─── Bullet extractor ────────────────────────────────────────────────────────

function extractAllBullets(resume: ResumeData): Array<{ text: string; section: string }> {
  const bullets: Array<{ text: string; section: string }> = [];

  (resume.experience ?? []).forEach((exp) => {
    const label = `Experience — ${exp.title || 'Role'} at ${exp.company || 'Company'}`;
    (exp.bullets ?? []).filter(b => b.trim()).forEach(b => bullets.push({ text: b.trim(), section: label }));
  });

  (resume.internships ?? []).forEach((int) => {
    const label = `Internship — ${int.title || 'Role'} at ${int.company || 'Company'}`;
    (int.bullets ?? []).filter(b => b.trim()).forEach(b => bullets.push({ text: b.trim(), section: label }));
  });

  (resume.projects ?? []).forEach((proj, idx) => {
    const label = `Project — ${proj.name || `Project ${idx + 1}`}`;
    if (proj.description?.trim()) bullets.push({ text: proj.description.trim(), section: label });
    (proj.bullets ?? []).filter(b => b.trim()).forEach(b => bullets.push({ text: b.trim(), section: label }));
  });

  return bullets;
}

function getCareerStageFromProfile(profile: string): CareerStage {
  if (profile === 'aspiring') return 'fresher';
  if (profile === 'transitioning') return 'career-change';
  return 'experienced';
}

// ─── Fixed AI Analysis ───────────────────────────────────────────────────────

async function runAIAnalysis(
  resumeText: string,
  jdText: string,
  profile: string,
  bullets: Array<{ text: string; section: string }>,
  summary: string,
): Promise<ResumeAnalysisResult> {

  const profileContext =
    profile === 'aspiring'
      ? 'ASPIRING PM — student or fresher with no formal PM experience. Evaluate on product thinking potential, clarity of communication, problem framing, user empathy. DO NOT penalize for lacking experience. DO reward transferable skills, side projects, quantified outcomes.'
      : profile === 'transitioning'
      ? 'TRANSITIONING INTO PM — professional from another domain pivoting into PM. Evaluate how well they translate background into PM language. Reward cross-functional work, ownership language, data-driven decisions, user focus.'
      : 'EXPERIENCED PM — 1+ years as a Product Manager. Evaluate against senior PM bar: product outcomes, metrics, strategic ownership, roadmap, stakeholder management. Penalize vague bullets without numbers.';

  const hasJD = jdText.trim().length > 50;
  const SPLIT_AT = 8; // Split into 2 calls when bullet count exceeds this

  // ── BUILD PROMPTS ─────────────────────────────────────────────────────────
  // CRITICAL: The opening 4 lines of SYSTEM tell the model to output ONLY JSON.
  // Placing this at the TOP of the system prompt is the most effective location.

  const buildSystem = (bulletCount: number) => `CRITICAL OUTPUT RULE:
You MUST respond with ONLY a raw JSON object.
Do NOT write any text before the JSON. Do NOT write any text after the JSON.
Do NOT use markdown code fences (\`\`\`json or \`\`\`). Do NOT add explanations.
Your ENTIRE response must start with { and end with }. No exceptions.

You are an expert PM resume coach who has reviewed 50,000+ PM resumes and placed candidates at Google, Meta, Flipkart, Razorpay, and top Indian startups.

Candidate profile: ${profileContext}

CRITICAL RULES:
- Analyze EVERY SINGLE bullet. There are ${bulletCount} — bulletAnalysis MUST have exactly ${bulletCount} entries.
- Each weakness must quote specific words from the original bullet.
- Each "improved" version must be concretely better.
- The improved summary MUST reference the candidate's actual companies and roles.
- Do NOT say "consider adding metrics" without showing an example metric.

METRIC RULES:
- ONLY add a metric if EXPLICITLY stated in the original OR clearly implied by context.
- For PROJECT/ACADEMIC bullets: DO NOT fabricate metrics like "25% increase" or "30% adoption".
- Research rigor (42 surveys, 8 interviews) IS the metric — use it.
- For EXPERIENCE bullets: suggest realistic metrics with "e.g." if appropriate.`.trim();

  const buildMainUser = (bulletsToAnalyze: Array<{ text: string; section: string }>) =>
    `IMPORTANT: Respond with ONLY the JSON object. No preamble. No explanation. Start immediately with {

${hasJD ? `JOB DESCRIPTION:\n${jdText.substring(0, 1200)}\n` : 'No JD provided — use general PM best practices.\n'}

PROFESSIONAL SUMMARY:
${summary || 'No summary section found. Treat as missing and penalize.'}

ALL RESUME BULLETS (${bulletsToAnalyze.length} total — return EXACTLY ${bulletsToAnalyze.length} in bulletAnalysis):
${bulletsToAnalyze.map((b, i) => `${i + 1}. [${b.section}] ${b.text}`).join('\n')}

Return this EXACT JSON schema — no extra keys, no markdown:
{
  "overallScore": <integer 0-100, be honest — most resumes score 40-65>,
  "grade": <"A" if >=80, "B" if >=65, "C" if >=50, "D" if >=35, else "F">,
  "gradeLabel": <"Strong Match" | "Good, needs polish" | "Needs Work" | "Significant Gaps" | "Major Rewrite Needed">,
  "executiveSummary": <2-3 sentences. Be direct. Reference specific companies/roles from the resume.>,
  "summaryAnalysis": {
    "score": <1-10>,
    "feedback": <Specific critique. Quote actual phrases that are weak. Explain exactly why.>,
    "improved": <Full rewritten summary. Must mention their real companies. Profile: ${profile}.>
  },
  "bulletAnalysis": [
    {
      "original": <exact bullet text as provided>,
      "score": <1-10. Most unquantified bullets = 4-6. Generic bullets = 3-4.>,
      "strength": <What is actually strong here, or null>,
      "weakness": <Quote the exact weak phrase. Explain concisely why it fails.>,
      "improved": <Rewritten bullet. DO NOT ADD FAKE METRICS for projects/academic work.>,
      "tags": <array of applicable: "has_metric","has_action_verb","has_ownership","jd_aligned","too_vague","no_impact">,
      "section": <section name as provided>
    }
  ],
  "keywordsFound": <JD keywords found verbatim or near-verbatim in the resume>,
  "keywordsMissing": <important JD keywords NOT in the resume — max 12>,
  "pmVocabFound": <PM terms present: roadmap, OKR, A/B test, PRD, north star, sprint, backlog, GTM, NPS, DAU, MAU, churn, funnel, retention, activation>,
  "pmVocabMissing": <Important PM terms absent — max 10>,
  "metricsScore": <0-100 — what percentage of bullets have a quantified metric>,
  "topImprovements": <array of exactly 3 most impactful changes. Specific. Quote what to change.>,
  "profileSpecificFeedback": <2-3 sentences specific to ${profile} profile.>
}`.trim();

  const buildBulletOnlyUser = (bulletsToAnalyze: Array<{ text: string; section: string }>) =>
    `IMPORTANT: Respond with ONLY the JSON object. No preamble. Start immediately with {

Analyze these ${bulletsToAnalyze.length} resume bullets for a ${profile} PM candidate.
${hasJD ? `Job context: ${jdText.substring(0, 400)}` : 'Use general PM best practices.'}

BULLETS:
${bulletsToAnalyze.map((b, i) => `${i + 1}. [${b.section}] ${b.text}`).join('\n')}

Return this EXACT JSON (no markdown, just the object):
{
  "bulletAnalysis": [
    {
      "original": <exact bullet text>,
      "score": <1-10>,
      "strength": <what is strong, or null>,
      "weakness": <quote exact weak phrase. Explain why.>,
      "improved": <rewritten bullet. NO FAKE METRICS for academic/project work.>,
      "tags": <array from: "has_metric","has_action_verb","has_ownership","jd_aligned","too_vague","no_impact">,
      "section": <section name as provided>
    }
  ]
}`.trim();

  // ── SPLIT STRATEGY: >8 bullets = 2 parallel calls ──────────────────────────
  if (bullets.length > SPLIT_AT) {
    console.log(`[runAIAnalysis] ${bullets.length} bullets — using split strategy`);

    const half = Math.ceil(bullets.length / 2);
    const firstHalf = bullets.slice(0, half);
    const secondHalf = bullets.slice(half);

    try {
      const [raw1, raw2] = await Promise.all([
        groqChatCompletion(buildSystem(firstHalf.length), buildMainUser(firstHalf), 5000, 0.2),
        groqChatCompletion(
          `CRITICAL: Respond with ONLY a raw JSON object. No text before or after. No markdown. Start with {.
You are an expert PM resume coach analyzing bullets for a ${profile} candidate.`,
          buildBulletOnlyUser(secondHalf),
          3000,
          0.2,
        ),
      ]);

      const mainResult = robustJsonParse<ResumeAnalysisResult | null>(raw1, null);
      const bulletResult = robustJsonParse<{ bulletAnalysis?: BulletAnalysis[] } | null>(raw2, null);

      if (mainResult && isValidAnalysisResult(mainResult)) {
        if (bulletResult?.bulletAnalysis?.length) {
          mainResult.bulletAnalysis = [
            ...mainResult.bulletAnalysis,
            ...bulletResult.bulletAnalysis,
          ];
        }
        console.log(`[runAIAnalysis] Split success. Total bullets: ${mainResult.bulletAnalysis?.length}`);
        return mainResult;
      }

      // If main is partial, patch it up
      if (mainResult && typeof mainResult === 'object' && (mainResult as any).overallScore !== undefined) {
        const patched = patchPartialResult(mainResult as unknown as Record<string, unknown>, bullets, summary);
        if (bulletResult?.bulletAnalysis?.length) {
          patched.bulletAnalysis = [
            ...patched.bulletAnalysis,
            ...bulletResult.bulletAnalysis,
          ];
        }
        return patched;
      }
    } catch (err) {
      console.error('[runAIAnalysis] Split call failed:', err);
    }

    console.warn('[runAIAnalysis] Split strategy failed, trying single call');
  }

  // ── SINGLE CALL ──────────────────────────────────────────────────────────
  console.log(`[runAIAnalysis] Single call for ${bullets.length} bullets`);

  try {
    const raw = await groqChatCompletion(
      buildSystem(bullets.length),
      buildMainUser(bullets),
      6000,
      0.2,
    );

    const parsed = robustJsonParse<ResumeAnalysisResult | null>(raw, null);

    if (parsed && isValidAnalysisResult(parsed)) {
      console.log(`[runAIAnalysis] Success. Analyzed ${parsed.bulletAnalysis.length} bullets.`);
      return parsed;
    }

    // Partial result recovery
    if (parsed && typeof parsed === 'object' && (parsed as any).overallScore !== undefined) {
      console.warn('[runAIAnalysis] Partial result — patching missing fields');
      return patchPartialResult(parsed as unknown as Record<string, unknown>, bullets, summary);
    }
  } catch (err) {
    console.error('[runAIAnalysis] Single call error:', err);
  }

  // Full fallback (only happens if every attempt above failed)
  console.warn('[runAIAnalysis] All attempts exhausted — using safe fallback');
  return buildFallbackAnalysisResult(resumeText, jdText, profile, bullets, summary);
}

// ─── Route handler ───────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    // 1. Auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabaseAdmin = getSupabaseAdmin();
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // 2. Check quota
    const { data: dbUser, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('score_analyses_used, subscription_type, subscription_expires_at')
      .eq('id', user.id)
      .single();

    if (fetchError || !dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const now = new Date();
    const hasActivePlan =
      dbUser.subscription_type === 'paid' &&
      dbUser.subscription_expires_at &&
      new Date(dbUser.subscription_expires_at) > now;

    const analysesUsed = dbUser.score_analyses_used ?? 0;

    if (!hasActivePlan && analysesUsed >= FREE_ANALYSIS_LIMIT) {
      return NextResponse.json(
        { error: 'quota_exceeded', analysesUsed, limit: FREE_ANALYSIS_LIMIT },
        { status: 402 },
      );
    }

    // 3. Parse body
    const body = await req.json() as { resumeText: string; jdText: string; profile: string };
    const { resumeText, jdText, profile } = body;

    if (!resumeText || resumeText.trim().length < 100) {
      return NextResponse.json(
        { error: 'Resume text too short (minimum 100 characters)' },
        { status: 400 },
      );
    }

    // 4. Parse resume
    const careerStage = getCareerStageFromProfile(profile);
    const parsedResume: ResumeData = await parseResumeText(resumeText, careerStage);

    // 5. Extract bullets
    const bullets = extractAllBullets(parsedResume);
    const summary = parsedResume.summary || '';

    if (bullets.length === 0) {
      return NextResponse.json(
        { error: 'Could not extract any bullet points from the resume. Please paste the full resume text including work experience, internships, and project sections.' },
        { status: 400 },
      );
    }

    console.log(`[/api/analyse] ${profile} profile — ${bullets.length} bullets extracted`);

    // 6. Run AI analysis
    const aiResult = await runAIAnalysis(resumeText, jdText, profile, bullets, summary);

    // 7. Enrich with client-side scorer
    const clientScore = scoreResume(resumeText, jdText, profile);
    if (!aiResult.keywordsFound?.length) aiResult.keywordsFound = clientScore.breakdown.jdKeywords.matched;
    if (!aiResult.keywordsMissing?.length) aiResult.keywordsMissing = clientScore.breakdown.jdKeywords.missing;

    // 8. Increment quota
    await supabaseAdmin
      .from('users')
      .update({ score_analyses_used: analysesUsed + 1 })
      .eq('id', user.id);

    return NextResponse.json({
      ...aiResult,
      analysesUsed: analysesUsed + 1,
      analysesRemaining: hasActivePlan ? Infinity : Math.max(0, FREE_ANALYSIS_LIMIT - analysesUsed - 1),
    });

  } catch (err) {
    console.error('[/api/analyse] Error:', err);
    const message = err instanceof Error ? err.message : 'Analysis failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
