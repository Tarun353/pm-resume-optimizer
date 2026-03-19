/**
 * /api/analyse/route.ts
 *
 * AI-powered resume analysis endpoint.
 * Returns per-bullet feedback, keyword gaps, PM vocab check, and overall score.
 *
 * QUOTA: Uses `score_analyses_used` column on the users table.
 * DB MIGRATION NEEDED:
 *   ALTER TABLE users ADD COLUMN IF NOT EXISTS score_analyses_used INTEGER DEFAULT 0;
 *
 * Free tier: 5 analyses per user.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { groqChatCompletion } from '@/lib/aiClient';
import { scoreResume } from '@/lib/atsScorer';

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) throw new Error('Supabase credentials not configured');
  return createClient(url, serviceRoleKey);
}

const FREE_ANALYSIS_LIMIT = 5;

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

// ─── Section heading patterns ────────────────────────────────────────────────

const SECTION_HEADING_PATTERNS = [
  /^(work\s+)?experience$/i,
  /^professional\s+(experience|background|history)$/i,
  /^employment(\s+history)?$/i,
  /^internship(s)?$/i,
  /^education$/i,
  /^academic(\s+background)?$/i,
  /^project(s)?$/i,
  /^skill(s)?$/i,
  /^technical\s+skill(s)?$/i,
  /^achievement(s)?$/i,
  /^award(s)?(\s+&\s+honor(s)?)?$/i,
  /^honor(s)?$/i,
  /^certification(s)?(\s+&\s+license(s)?)?$/i,
  /^license(s)?$/i,
  /^publication(s)?$/i,
  /^summary$/i,
  /^professional\s+summary$/i,
  /^profile$/i,
  /^objective$/i,
  /^career\s+objective$/i,
  /^leadership(\s+experience)?$/i,
  /^volunteer(\s+experience)?$/i,
  /^extracurricular(\s+activities)?$/i,
  /^activities$/i,
  /^involvement$/i,
  /^additional(\s+information)?$/i,
  /^languages$/i,
  /^interests?$/i,
  /^core\s+competencies$/i,
  /^key\s+skills$/i,
];

const CONTACT_PATTERNS = [
  /@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/,  // email
  /linkedin\.com/i,
  /github\.com/i,
  /^\+?\d[\d\s\-().]{7,}$/,          // phone
  /^[a-zA-Z0-9._%+-]+@/,             // email start
];

const ACTION_VERBS_REGEX = /^(led|drove|built|launched|managed|developed|created|designed|implemented|spearheaded|achieved|increased|improved|reduced|optimized|streamlined|collaborated|partnered|analyzed|identified|conducted|delivered|shipped|owned|defined|prioritized|coordinated|established|championed|facilitated|negotiated|synthesized|translated|transformed|accelerated|scaled|maintained|supported|assisted|worked|contributed|researched|prepared|executed|oversaw|supervised|directed|planned|organized|initiated|proposed|presented|communicated|reviewed|evaluated|trained|mentored|coached|engaged|generated|produced|published|wrote|drafted|deployed|migrated|integrated|automated|tested|resolved|handled|processed|conceptualized|formulated|pioneered|revamped|restructured|consolidated|expanded|launched|negotiated|secured|grew|boosted|enhanced|built|owned|shaped|influenced|drove|led|grew|closed|sourced|designed|architected|prototyped|validated|iterated|shipped|launched|scaled|analyzed|discovered|synthesized|translated|prioritized|roadmapped|launched|adopted|enabled|empowered)/i;

// ─── Comprehensive bullet extraction ────────────────────────────────────────

export function extractBulletsFromText(resumeText: string): Array<{ text: string; section: string }> {
  const lines = resumeText.split('\n').map(l => l.trim()).filter(Boolean);
  const bullets: Array<{ text: string; section: string }> = [];
  let currentSection = 'General';
  const seenTexts = new Set<string>();

  for (const line of lines) {
    // Skip very short lines
    if (line.length < 20) continue;

    // Skip obvious contact info
    if (CONTACT_PATTERNS.some(p => p.test(line))) continue;

    // Skip lines that look like dates only
    if (/^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|\d{4})/i.test(line) && line.length < 40) continue;

    // Detect section heading
    const isAllCaps = line === line.toUpperCase() && line.length > 2 && line.length < 60 && /[A-Z]/.test(line);
    const matchesHeadingPattern = SECTION_HEADING_PATTERNS.some(p => p.test(line.replace(/[^\w\s]/g, '').trim()));

    if (isAllCaps || matchesHeadingPattern) {
      currentSection = line
        .replace(/[•\-*:_|]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .split(' ')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');
      continue;
    }

    // Skip lines that are just company names / job titles / dates (short, no verb)
    if (line.length < 35 && !ACTION_VERBS_REGEX.test(line)) continue;

    // Strip bullet markers to get clean text
    const cleanLine = line
      .replace(/^[\s]*[•▪▸►→·\-*]\s+/, '')
      .replace(/^\d+[.)]\s+/, '')
      .trim();

    if (cleanLine.length < 20) continue;

    // A line is a bullet if:
    // 1. Has explicit bullet marker, OR
    // 2. Starts with an action verb (strong PM/professional signal), OR
    // 3. Is a long descriptive line (likely an accomplishment or experience description)
    const hasBulletMarker = /^[\s]*[•▪▸►→·\-*]\s+/.test(line) || /^\d+[.)]\s+/.test(line);
    const startsWithActionVerb = ACTION_VERBS_REGEX.test(cleanLine);
    const isLongDescriptiveLine = cleanLine.length > 55;

    if (hasBulletMarker || startsWithActionVerb || isLongDescriptiveLine) {
      // De-duplicate
      const key = cleanLine.substring(0, 60).toLowerCase();
      if (!seenTexts.has(key)) {
        seenTexts.add(key);
        bullets.push({ text: cleanLine, section: currentSection });
      }
    }
  }

  // Cap at 25 to control AI cost but cover full resume
  return bullets.slice(0, 25);
}

// ─── Summary extraction ──────────────────────────────────────────────────────

export function extractSummary(resumeText: string): string {
  const lines = resumeText.split('\n').map(l => l.trim()).filter(Boolean);
  let inSummary = false;
  const summaryLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    const lower = line.toLowerCase().replace(/[^\w\s]/g, '').trim();

    // Detect summary heading
    if (
      lower === 'summary' || lower === 'professional summary' ||
      lower === 'profile' || lower === 'objective' ||
      lower === 'career objective' || lower === 'about me' ||
      lower === 'professional profile'
    ) {
      inSummary = true;
      continue;
    }

    if (inSummary) {
      // Stop at next section heading
      const isAllCaps = line === line.toUpperCase() && line.length > 3 && /[A-Z]/.test(line);
      const isNextSection = SECTION_HEADING_PATTERNS.some(p => p.test(line.replace(/[^\w\s]/g, '').trim()));

      if ((isAllCaps || isNextSection) && summaryLines.length > 0) break;

      if (line.length > 25 && !CONTACT_PATTERNS.some(p => p.test(line))) {
        summaryLines.push(line);
        if (summaryLines.length >= 6) break;
      }
    }
  }

  // Fallback: first 2-3 long paragraphs that look like a summary
  if (summaryLines.length === 0) {
    let count = 0;
    for (const line of lines) {
      if (line.length > 80 && !CONTACT_PATTERNS.some(p => p.test(line)) && !/^\d{4}/.test(line)) {
        summaryLines.push(line);
        count++;
        if (count >= 3) break;
      }
    }
  }

  return summaryLines.join(' ').trim();
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
- Analyze EVERY bullet provided. Do not skip any.
- Each weakness must quote or reference specific words from the original bullet.
- Each "improved" version must be concretely better — stronger verb, metric added if implied, PM language injected, scope clarified.
- The improved summary MUST reference the candidate's actual companies and roles.
- Do NOT say "consider adding metrics" without showing an example metric.
- profileSpecificFeedback must address this specific profile's biggest gaps (${profile}).
- You must respond ONLY with valid JSON. No markdown fences, no preamble.`;

  const USER = `Perform a comprehensive PM resume analysis for a ${profile} candidate.

${hasJD ? `JOB DESCRIPTION:\n${jdText.substring(0, 2500)}\n\n` : 'No JD provided — use general PM best practices for all JD-related fields.\n\n'}

PROFESSIONAL SUMMARY (analyze this):
${summary || 'No summary section found in the resume. Treat as a missing section and penalize accordingly.'}

ALL RESUME BULLETS TO ANALYZE (${bullets.length} total — analyze EVERY single one):
${bulletsFormatted}

FULL RESUME TEXT (for context, names, companies, dates — do not re-extract bullets from here):
${resumeText.substring(0, 3500)}

Return EXACTLY this JSON schema — no extra keys, no markdown:
{
  "overallScore": <integer 0-100, be honest — most resumes score 40-65>,
  "grade": <"A" if >=80, "B" if >=65, "C" if >=50, "D" if >=35, else "F">,
  "gradeLabel": <"Strong Match"|"Good, needs polish"|"Needs Work"|"Significant Gaps"|"Major Rewrite Needed">,
  "executiveSummary": <2-3 sentences. Be direct. Reference specific companies/roles from the resume. State what's holding this resume back.>,
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
      "improved": <Rewritten bullet. Must be concretely better. Use same context/company. Add implied metric if obvious.>,
      "tags": <array of applicable: "has_metric","has_action_verb","has_ownership","jd_aligned","too_vague","no_impact">,
      "section": <section name as provided>
    }
  ],
  "keywordsFound": <array of JD keywords actually found verbatim or near-verbatim in the resume>,
  "keywordsMissing": <array of important JD keywords NOT in the resume — max 12, most impactful first>,
  "pmVocabFound": <PM terms present: roadmap, OKR, A/B test, PRD, north star, sprint, backlog, GTM, NPS, DAU, MAU, churn, funnel, retention, activation, etc.>,
  "pmVocabMissing": <Important PM terms absent — max 10, most impactful for this profile first>,
  "metricsScore": <0-100 integer — what % of bullets have a quantified metric (number, %, $, x)>,
  "topImprovements": <array of exactly 3 most impactful changes. Be specific: quote what to change and show the direction.>,
  "profileSpecificFeedback": <2-3 sentences specific to ${profile} profile. For aspiring: what PM potential signals are present/absent. For transitioning: how well they've reframed their background. For experienced: whether they demonstrate strategic ownership and scope.>
}`;

  const raw = await groqChatCompletion(SYSTEM, USER, 4000, 0.2);

  // Clean and parse JSON
  const cleaned = raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();

  try {
    const result = JSON.parse(cleaned) as ResumeAnalysisResult;
    // Validate bulletAnalysis count matches input
    if (!result.bulletAnalysis || result.bulletAnalysis.length === 0) {
      throw new Error('AI returned empty bulletAnalysis');
    }
    return result;
  } catch {
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as ResumeAnalysisResult;
    }
    throw new Error('AI returned invalid JSON. Please try again.');
  }
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
        { status: 402 }
      );
    }

    // 3. Parse body
    const body = await req.json() as { resumeText: string; jdText: string; profile: string };
    const { resumeText, jdText, profile } = body;

    if (!resumeText || resumeText.trim().length < 100) {
      return NextResponse.json(
        { error: 'Resume text too short (minimum 100 characters)' },
        { status: 400 }
      );
    }

    // 4. Extract content
    const bullets = extractBulletsFromText(resumeText);
    const summary = extractSummary(resumeText);

    // Guard: if we found 0 bullets, something is very wrong with the input
    if (bullets.length === 0) {
      return NextResponse.json(
        { error: 'Could not extract any content from the resume. Please paste the full resume text including bullet points and experience sections.' },
        { status: 400 }
      );
    }

    // 5. Run AI analysis
    const aiResult = await runAIAnalysis(resumeText, jdText, profile, bullets, summary);

    // 6. Enrich with client-side scorer data (fill gaps if AI missed keywords)
    const clientScore = scoreResume(resumeText, jdText, profile);
    if (!aiResult.keywordsFound?.length) {
      aiResult.keywordsFound = clientScore.breakdown.jdKeywords.matched;
    }
    if (!aiResult.keywordsMissing?.length) {
      aiResult.keywordsMissing = clientScore.breakdown.jdKeywords.missing;
    }

    // 7. Increment quota
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
