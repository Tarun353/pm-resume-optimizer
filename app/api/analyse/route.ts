/**
 * app/api/analyse/route.ts
 *
 * AI-powered resume analysis endpoint - ANALYZES ALL BULLETS FROM ALL SECTIONS
 * Works for: Aspiring PMs, Transitioning PMs, Experienced PMs
 * Quota: `score_analyses_used` column (separate from optimizations).
 *
 * Free tier: 5 analyses per user.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { groqChatCompletion } from '@/lib/aiClient';
import { scoreResume } from '@/lib/atsScorer';
import { parseResumeText } from '@/lib/resumeParser';
import type { ResumeData, CareerStage } from '@/lib/types';

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) throw new Error('Supabase credentials not configured');
  return createClient(url, serviceRoleKey);
}

const FREE_ANALYSIS_LIMIT = 5;

function cleanJsonString(text: string) {
  if (!text) return '';

  return text
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .replace(/,\s*}/g, '}')
    .replace(/,\s*]/g, ']')
    .replace(/[\u0000-\u001F]+/g, '')
    .trim();
}

function safeJsonParse<T>(text: string): T | null {
  try {
    return JSON.parse(text) as T;
  } catch (error) {
    console.error('[/api/analyse] Invalid JSON from AI:', error);
    return null;
  }
}

// ─── Types ──────────────────────────────────────────────────────────────────────

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

function isValidResumeAnalysisResult(data: unknown): data is ResumeAnalysisResult {
  if (!data || typeof data !== 'object') return false;

  const result = data as Partial<ResumeAnalysisResult>;
  return (
    typeof result.overallScore === 'number' &&
    typeof result.grade === 'string' &&
    typeof result.gradeLabel === 'string' &&
    typeof result.executiveSummary === 'string' &&
    result.summaryAnalysis !== undefined &&
    typeof result.summaryAnalysis.original === 'string' &&
    typeof result.summaryAnalysis.score === 'number' &&
    typeof result.summaryAnalysis.feedback === 'string' &&
    typeof result.summaryAnalysis.improved === 'string' &&
    Array.isArray(result.bulletAnalysis) &&
    Array.isArray(result.keywordsFound) &&
    Array.isArray(result.keywordsMissing) &&
    Array.isArray(result.pmVocabFound) &&
    Array.isArray(result.pmVocabMissing) &&
    typeof result.metricsScore === 'number' &&
    Array.isArray(result.topImprovements) &&
    typeof result.profileSpecificFeedback === 'string'
  );
}

function buildFallbackAnalysisResult(
  resumeText: string,
  jdText: string,
  profile: CareerStage,
  bullets: Array<{ text: string; section: string }>,
  summary: string,
): ResumeAnalysisResult {
  const clientScore = scoreResume(resumeText, jdText, profile);
  const overallScore = Math.round(clientScore.totalScore);
  const grade: ResumeAnalysisResult['grade'] = overallScore >= 90 ? 'A' : overallScore >= 80 ? 'B' : overallScore >= 70 ? 'C' : overallScore >= 60 ? 'D' : 'F';

  return {
    overallScore,
    grade,
    gradeLabel: clientScore.gradeLabel,
    executiveSummary: 'We could not fully parse the AI analysis, so this result uses a safe fallback based on the ATS score and extracted resume content.',
    summaryAnalysis: {
      original: summary,
      score: Math.max(1, Math.min(10, Math.round(overallScore / 10))),
      feedback: 'AI output was malformed, so detailed summary feedback is temporarily unavailable. Review your summary for specificity, PM keywords, and measurable outcomes.',
      improved: summary || 'Add a concise summary focused on product ownership, measurable impact, and relevant domain expertise.',
    },
    bulletAnalysis: bullets.map((bullet) => ({
      original: bullet.text,
      score: 5,
      strength: null,
      weakness: 'Detailed AI bullet analysis was unavailable because the model response could not be parsed safely.',
      improved: bullet.text,
      tags: [],
      section: bullet.section,
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

// ─── Helper Functions ────────────────────────────────────────────────────────────

/**
 * Extract ALL bullets from ALL sections of parsed resume
 * This ensures comprehensive analysis of the entire resume
 */
function extractAllBullets(resume: ResumeData): Array<{ text: string; section: string }> {
  const bullets: Array<{ text: string; section: string }> = [];
  
  // Work Experience
  if (resume.experience && resume.experience.length > 0) {
    resume.experience.forEach((exp, idx) => {
      const company = exp.company || 'Company';
      const title = exp.title || 'Role';
      if (exp.bullets && exp.bullets.length > 0) {
        exp.bullets.forEach(bullet => {
          if (bullet.trim()) {
            bullets.push({
              text: bullet.trim(),
              section: `Experience — ${title} at ${company}`
            });
          }
        });
      }
    });
  }
  
  // Internships
  if (resume.internships && resume.internships.length > 0) {
    resume.internships.forEach((int, idx) => {
      const company = int.company || 'Company';
      const title = int.title || 'Role';
      if (int.bullets && int.bullets.length > 0) {
        int.bullets.forEach(bullet => {
          if (bullet.trim()) {
            bullets.push({
              text: bullet.trim(),
              section: `Internship — ${title} at ${company}`
            });
          }
        });
      }
    });
  }
  
  // Projects
  if (resume.projects && resume.projects.length > 0) {
    resume.projects.forEach((proj, idx) => {
      const name = proj.name || `Project ${idx + 1}`;
      
      // Project description as a "bullet"
      if (proj.description && proj.description.trim()) {
        bullets.push({
          text: proj.description.trim(),
          section: `Project — ${name}`
        });
      }
      
      // Project bullets
      if (proj.bullets && proj.bullets.length > 0) {
        proj.bullets.forEach(bullet => {
          if (bullet.trim()) {
            bullets.push({
              text: bullet.trim(),
              section: `Project — ${name}`
            });
          }
        });
      }
    });
  }
  
  console.log(`[extractAllBullets] Extracted ${bullets.length} bullets from resume`);
  return bullets;
}

/**
 * Get career stage from profile string
 */
function getCareerStageFromProfile(profile: string): CareerStage {
  if (profile === 'aspiring') return 'fresher';
  if (profile === 'transitioning') return 'career-change';
  return 'experienced';
}

// ─── AI Analysis ─────────────────────────────────────────────────────────────

async function runAIAnalysis(
  resumeText: string,
  jdText: string,
  profile: string,
  bullets: Array<{ text: string; section: string }>,
  summary: string,
): Promise<ResumeAnalysisResult> {

  const profileContext =
    profile === 'aspiring'
      ? 'ASPIRING PM — student or fresher with no formal PM experience yet. They may have projects, internships, hackathons, or academic work. Evaluate them on product thinking potential, clarity of communication, problem framing, and evidence of user empathy. DO NOT penalize for lacking 5 years of experience. DO reward transferable skills, side projects, quantified college/intern outcomes, and evidence of curiosity.'
      : profile === 'transitioning'
      ? 'TRANSITIONING INTO PM — professional from another domain (engineering, marketing, consulting, ops, etc.) pivoting into PM. Evaluate how well they translate their background into PM language. Reward: cross-functional work, ownership language, data-driven decisions, user focus. Penalize: failing to PM-frame past work, domain jargon with no product context, no narrative of why they are switching.'
      : 'EXPERIENCED PM — 1+ years as a Product Manager. Evaluate against senior PM bar: product outcomes, metrics, strategic ownership, roadmap, stakeholder management, team leadership. Penalize: vague bullets without numbers, no scope mentioned (team size, user base, revenue), tactical-only work with no strategy, missing OKR/metric language.';

  const bulletsFormatted = bullets
    .map((b, i) => `${i + 1}. [${b.section}] ${b.text}`)
    .join('\n');

  const hasJD = jdText.trim().length > 50;

  const SYSTEM = `You are an expert PM resume coach who has reviewed 50,000+ PM resumes and placed candidates at Google, Meta, Flipkart, Razorpay, Meesho, CRED, and top Indian/global startups.

Your feedback is BRUTALLY HONEST, HYPER-SPECIFIC, and ACTIONABLE. You cite exact text from the resume. You never give generic advice. You show the exact rewrite.

Candidate profile: ${profileContext}

CRITICAL RULES:
- Analyze EVERY SINGLE bullet provided. Do not skip any. There are ${bullets.length} bullets — your bulletAnalysis array must have ${bullets.length} entries.
- Each weakness must quote or reference specific words from the original bullet.
- Each "improved" version must be concretely better — stronger verb, metric added if implied, PM language injected, scope clarified.
- The improved summary MUST reference the candidate's actual companies and roles.
- Do NOT say "consider adding metrics" without showing an example metric.
- profileSpecificFeedback must address this specific profile's biggest gaps (${profile}).
- You must respond ONLY with valid JSON. No markdown fences, no preamble.

CRITICAL — HANDLING METRICS IN "IMPROVED" VERSIONS:
- ONLY add a metric if it's EXPLICITLY stated in the original bullet OR clearly implied from context (e.g., "500 users" mentioned).
- For PROJECT/ACADEMIC bullets: DO NOT fabricate business metrics like "25% increase", "30% adoption", "revenue lift" — these are lies if the student doesn't have real company data.
- For PROJECT bullets that did research: The research rigor (42 surveys, 8 interviews) IS the metric. Don't invent fake business outcomes.
- For PROJECT bullets: Focus on LEARNING, INSIGHTS, SKILLS DEMONSTRATED, and PRODUCT THINKING instead of fake business impact.
- For INTERNSHIP bullets: Only add metrics if the intern realistically could have measured them (user tests with N people, features shipped to X users). Don't claim company-wide impact they didn't have.
- For EXPERIENCE bullets: You can suggest realistic metrics based on role context, but make it clear these are examples ("e.g., 10k→12k users" not "increased users by 20%").

Examples of GOOD vs BAD metric additions:

ACADEMIC PROJECT - Research:
Original: "Analyzed voice input adoption barriers through 42 surveys and 8 interviews."
❌ BAD (fabricated metric): "Analyzed voice input adoption barriers, identifying a 25% decrease in adoption rates due to usability issues."
✅ GOOD (research rigor + insight): "Conducted user research on voice input adoption barriers through 42 surveys and 8 interviews, identifying top 3 usability friction points and presenting actionable UX improvement recommendations."

ACADEMIC PROJECT - App built:
Original: "Built e-commerce mobile app with payment integration"
❌ BAD (fake business metric): "Built e-commerce app that increased conversion by 30%"
✅ GOOD (scope + learning): "Built React Native e-commerce app with Stripe payment integration, conducting 15 user tests to validate checkout flow and iterating on feedback"

INTERNSHIP - Real impact:
Original: "Helped with user research"
❌ BAD (vague): "Conducted user research"
✅ GOOD (specific + real metric): "Conducted 20 user interviews for mobile onboarding redesign, synthesizing insights into 3-page research report that informed Q3 roadmap"

EXPERIENCE - Can suggest realistic metric:
Original: "Improved checkout flow"
✅ GOOD: "Redesigned checkout flow based on funnel analysis, reducing cart abandonment by 15% (baseline: 45%→30%)"`;

  const USER = `Perform a comprehensive PM resume analysis for a ${profile} candidate.

${hasJD ? `JOB DESCRIPTION:\n${jdText.substring(0, 1500)}\n\n` : 'No JD provided — use general PM best practices for all JD-related fields.\n\n'}

PROFESSIONAL SUMMARY (analyze this):
${summary || 'No summary section found in the resume. Treat as a missing section and penalize accordingly.'}

ALL RESUME BULLETS TO ANALYZE (${bullets.length} total — analyze EVERY single one, return ${bullets.length} entries in bulletAnalysis):
${bulletsFormatted}

REMEMBER: For Project/Academic bullets, DO NOT fabricate business metrics. Research rigor and insights ARE valuable without fake "25% increase" numbers.

Return EXACTLY this JSON schema — no extra keys, no markdown:
{
  "overallScore": <integer 0-100, be honest — most resumes score 40-65>,
  "grade": <"A" if >=80, "B" if >=65, "C" if >=50, "D" if >=35, else "F">,
  "gradeLabel": <"Strong Match"|"Good, needs polish"|"Needs Work"|"Significant Gaps"|"Major Rewrite Needed">,
  "executiveSummary": <2-3 sentences. Be direct. Reference specific companies/roles from the resume. State what is holding this resume back.>,
  "summaryAnalysis": {
    "score": <1-10>,
    "feedback": <Specific critique. Quote actual phrases from their summary that are weak. Explain exactly why.>,
    "improved": <Full rewritten summary. Must mention their real companies. Must be profile-appropriate (${profile}).>
  },
  "bulletAnalysis": [
    {
      "original": <exact bullet text as provided>,
      "score": <1-10. Be harsh: most unquantified bullets = 4-6. Generic bullets = 3-4. Strong quantified bullets = 8-9.>,
      "strength": <What is actually strong here, or null if nothing is>,
      "weakness": <Quote the exact weak phrase. Explain concisely why it fails.>,
      "improved": <Rewritten bullet. Must be concretely better. DO NOT ADD FAKE METRICS for projects/academic work. Use same context. Show learning/rigor instead.>,
      "tags": <array of applicable: "has_metric","has_action_verb","has_ownership","jd_aligned","too_vague","no_impact">,
      "section": <section name as provided>
    }
    ... REPEAT FOR ALL ${bullets.length} BULLETS - DO NOT SKIP ANY
  ],
  "keywordsFound": <array of JD keywords actually found verbatim or near-verbatim in the resume>,
  "keywordsMissing": <array of important JD keywords NOT in the resume — max 12, most impactful first>,
  "pmVocabFound": <PM terms present: roadmap, OKR, A/B test, PRD, north star, sprint, backlog, GTM, NPS, DAU, MAU, churn, funnel, retention, activation, etc.>,
  "pmVocabMissing": <Important PM terms absent — max 10, most impactful for this profile first>,
  "metricsScore": <0-100 integer — what percentage of bullets have a quantified metric (number, percentage, dollar, x)>,
  "topImprovements": <array of exactly 3 most impactful changes. Be specific: quote what to change and show the direction.>,
  "profileSpecificFeedback": <2-3 sentences specific to ${profile} profile.>
}`;

  console.log(`[runAIAnalysis] Sending ${bullets.length} bullets to AI for analysis`);
  
  const raw = await groqChatCompletion(SYSTEM, USER, 6000, 0.2);

  const cleaned = cleanJsonString(raw);
  const parsed = safeJsonParse<ResumeAnalysisResult>(cleaned);

  if (parsed && isValidResumeAnalysisResult(parsed) && parsed.bulletAnalysis.length > 0) {
    console.log(`[runAIAnalysis] AI analyzed ${parsed.bulletAnalysis.length} bullets`);
    return parsed;
  }

  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  const extracted = jsonMatch ? safeJsonParse<ResumeAnalysisResult>(jsonMatch[0]) : null;

  if (extracted && isValidResumeAnalysisResult(extracted) && extracted.bulletAnalysis.length > 0) {
    console.log(`[runAIAnalysis] Recovered AI analysis from extracted JSON with ${extracted.bulletAnalysis.length} bullets`);
    return extracted;
  }

  console.warn('[runAIAnalysis] AI returned invalid JSON or unexpected structure. Using safe fallback analysis.');
  return buildFallbackAnalysisResult(resumeText, jdText, profile, bullets, summary);
}

// ─── Route handler ────────────────────────────────────────────────────────────

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

    console.log('[/api/analyse] Starting comprehensive analysis');

    // 4. PARSE THE FULL RESUME using the robust parser (same as optimize flow)
    const careerStage = getCareerStageFromProfile(profile);
    console.log('[/api/analyse] Parsing resume with career stage:', careerStage);
    
    const parsedResume: ResumeData = await parseResumeText(resumeText, careerStage);
    
    // 5. Extract ALL bullets from ALL sections
    const bullets = extractAllBullets(parsedResume);
    const summary = parsedResume.summary || '';

    if (bullets.length === 0) {
      return NextResponse.json(
        {
          error:
            'Could not extract any bullet points from the resume. Please paste the full resume text including work experience, internships, and project sections.',
        },
        { status: 400 },
      );
    }

    console.log(`[/api/analyse] Extracted ${bullets.length} bullets from ${profile} profile resume`);

    // 6. Run AI analysis
    const aiResult = await runAIAnalysis(resumeText, jdText, profile, bullets, summary);

    // 7. Enrich with client-side scorer data
    const clientScore = scoreResume(resumeText, jdText, profile);
    if (!aiResult.keywordsFound?.length) {
      aiResult.keywordsFound = clientScore.breakdown.jdKeywords.matched;
    }
    if (!aiResult.keywordsMissing?.length) {
      aiResult.keywordsMissing = clientScore.breakdown.jdKeywords.missing;
    }

    // 8. Increment quota
    await supabaseAdmin
      .from('users')
      .update({ score_analyses_used: analysesUsed + 1 })
      .eq('id', user.id);

    console.log(`[/api/analyse] Analysis complete. Returned ${aiResult.bulletAnalysis.length} bullet analyses.`);

    return NextResponse.json({
      ...aiResult,
      analysesUsed: analysesUsed + 1,
      analysesRemaining: hasActivePlan
        ? Infinity
        : Math.max(0, FREE_ANALYSIS_LIMIT - analysesUsed - 1),
    });

  } catch (err) {
    console.error('[/api/analyse] Error:', err);
    const message = err instanceof Error ? err.message : 'Analysis failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
