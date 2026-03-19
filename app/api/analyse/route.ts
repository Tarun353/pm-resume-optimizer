/**
 * /api/analyse/route.ts
 *
 * AI-powered resume analysis endpoint.
 * Returns per-bullet feedback, keyword gaps, PM vocab check, and overall score.
 *
 * QUOTA: Uses `score_analyses_used` column on the users table (separate from optimizations).
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

  if (!url || !serviceRoleKey) {
    throw new Error('Supabase credentials not configured');
  }

  return createClient(url, serviceRoleKey);
}

const FREE_ANALYSIS_LIMIT = 5;

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface BulletAnalysis {
  original: string;
  score: number; // 1-10
  strength: string | null;
  weakness: string;
  improved: string;
  tags: Array<'has_metric' | 'has_action_verb' | 'has_ownership' | 'jd_aligned' | 'too_vague' | 'no_impact'>;
  section: string; // e.g. "Work Experience", "Internship", "Projects"
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
  metricsScore: number; // 0-100 pct of bullets with metrics
  topImprovements: string[];
  profileSpecificFeedback: string;
}

// ─── Parse resume into sections ────────────────────────────────────────────────

function extractBulletsFromText(resumeText: string): Array<{ text: string; section: string }> {
  const lines = resumeText.split('\n').map(l => l.trim()).filter(Boolean);
  const bullets: Array<{ text: string; section: string }> = [];
  let currentSection = 'General';

  // Section heading heuristics
  const sectionHeadings = [
    'experience', 'work experience', 'professional experience',
    'internship', 'internships', 'projects', 'project',
    'education', 'certifications', 'skills', 'achievements',
    'publications', 'awards', 'leadership', 'volunteer',
  ];

  for (const line of lines) {
    const lower = line.toLowerCase();

    // Detect section heading
    const isHeading = sectionHeadings.some(h => lower === h || lower.startsWith(h + ' ') || lower.endsWith(' ' + h));
    const isAllCaps = line === line.toUpperCase() && line.length > 3 && /[A-Z]/.test(line);
    if (isHeading || isAllCaps) {
      currentSection = line.replace(/[•\-*]/g, '').trim();
      continue;
    }

    // Detect bullet line
    const isBullet = line.startsWith('•') || line.startsWith('-') || line.startsWith('*') || /^\d+\./.test(line);
    const isLongLine = line.length > 50 && !line.includes(':') && currentSection.toLowerCase().includes('experience');

    if (isBullet || isLongLine) {
      const text = line.replace(/^[•\-*]\s*/, '').replace(/^\d+\.\s*/, '').trim();
      if (text.length > 20) {
        bullets.push({ text, section: currentSection });
      }
    }
  }

  return bullets.slice(0, 20); // cap at 20 bullets for cost reasons
}

function extractSummary(resumeText: string): string {
  const lines = resumeText.split('\n').map(l => l.trim()).filter(Boolean);
  let inSummary = false;
  const summaryLines: string[] = [];

  for (const line of lines) {
    const lower = line.toLowerCase();
    if (lower.includes('summary') || lower.includes('profile') || lower.includes('objective')) {
      inSummary = true;
      continue;
    }
    if (inSummary) {
      // Stop at next section heading
      const isHeading = line === line.toUpperCase() || lower.includes('experience') || lower.includes('education') || lower.includes('skills');
      if (isHeading && summaryLines.length > 0) break;
      if (line.length > 30) summaryLines.push(line);
      if (summaryLines.length >= 5) break;
    }
  }

  // Fallback: first long paragraph
  if (summaryLines.length === 0) {
    for (const line of lines) {
      if (line.length > 80 && !line.includes('@') && !line.includes('linkedin')) {
        summaryLines.push(line);
        if (summaryLines.length >= 3) break;
      }
    }
  }

  return summaryLines.join(' ').trim();
}

// ─── AI Analysis ───────────────────────────────────────────────────────────────

async function runAIAnalysis(
  resumeText: string,
  jdText: string,
  profile: string,
  bullets: Array<{ text: string; section: string }>,
  summary: string,
): Promise<ResumeAnalysisResult> {

  const profileContext =
    profile === 'aspiring'      ? 'aspiring PM (student/fresher — no formal PM experience yet)' :
    profile === 'transitioning' ? 'transitioning into PM from another domain (engineer/marketer/consultant)' :
                                  'experienced PM (1+ years in a PM role)';

  const bulletsFormatted = bullets
    .map((b, i) => `${i + 1}. [${b.section}] ${b.text}`)
    .join('\n');

  const SYSTEM = `You are an expert PM resume coach who has reviewed 10,000+ PM resumes and coached candidates into Google, Flipkart, Razorpay, Meesho, and top Indian startups.

You give HONEST, SPECIFIC, ACTIONABLE feedback. Never be vague. Never say "good job" without citing exactly what's strong. Never say "improve this" without showing exactly how.

You must respond with ONLY valid JSON matching the schema exactly. No preamble, no markdown, no explanation outside the JSON.`;

  const USER = `Analyse this PM resume for a ${profileContext}.

JOB DESCRIPTION:
${jdText.trim().length > 50 ? jdText.substring(0, 2000) : 'No JD provided — use general PM best practices.'}

PROFESSIONAL SUMMARY:
${summary || 'No summary found in the resume.'}

RESUME BULLET POINTS (${bullets.length} total):
${bulletsFormatted}

FULL RESUME TEXT (for context):
${resumeText.substring(0, 3000)}

Return this exact JSON schema (no extra fields, no markdown):
{
  "overallScore": <integer 0-100>,
  "grade": <"A"|"B"|"C"|"D"|"F">,
  "gradeLabel": <short string like "Strong Match" | "Good, needs polish" | "Needs Work" | "Significant Gaps" | "Major Rewrite Needed">,
  "executiveSummary": <2-3 sentence honest overall verdict. Cite specific resume evidence.>,
  "summaryAnalysis": {
    "score": <1-10>,
    "feedback": <specific critique of their actual summary text. What's missing, what's weak, what's strong.>,
    "improved": <rewritten summary for their profile — must reference their actual companies/roles>
  },
  "bulletAnalysis": [
    {
      "original": <exact bullet text>,
      "score": <1-10>,
      "strength": <what's genuinely strong, or null>,
      "weakness": <specific weakness — be direct and honest>,
      "improved": <rewritten bullet — must be better, more specific, add metric if implied>,
      "tags": <array from: "has_metric","has_action_verb","has_ownership","jd_aligned","too_vague","no_impact">,
      "section": <section name>
    }
  ],
  "keywordsFound": <array of JD keywords found in resume>,
  "keywordsMissing": <array of important JD keywords NOT in resume — max 12>,
  "pmVocabFound": <array of PM terms found: roadmap, OKR, A/B test, etc.>,
  "pmVocabMissing": <array of important PM terms missing — max 10>,
  "metricsScore": <0-100 — percentage of bullets that have quantified impact>,
  "topImprovements": <array of exactly 3 most impactful improvements the candidate should make>,
  "profileSpecificFeedback": <2-3 sentences of feedback specific to their career stage — aspiring/transitioning/experienced>
}`;

  const raw = await groqChatCompletion(SYSTEM, USER, 3000, 0.3);

  // Clean and parse JSON
  const cleaned = raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();

  try {
    return JSON.parse(cleaned) as ResumeAnalysisResult;
  } catch {
    // Try to extract JSON from response
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as ResumeAnalysisResult;
    }
    throw new Error('AI returned invalid JSON. Please try again.');
  }
}

// ─── Route handler ──────────────────────────────────────────────────────────────

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

    // 2. Check + increment quota
    const { data: dbUser, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('score_analyses_used, subscription_type, subscription_expires_at')
      .eq('id', user.id)
      .single();

    if (fetchError || !dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if paid plan is active
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
    const body = await req.json() as {
      resumeText: string;
      jdText: string;
      profile: string;
    };

    const { resumeText, jdText, profile } = body;

    if (!resumeText || resumeText.trim().length < 100) {
      return NextResponse.json({ error: 'Resume text too short (minimum 100 characters)' }, { status: 400 });
    }

    // 4. Extract bullets and summary
    const bullets = extractBulletsFromText(resumeText);
    const summary = extractSummary(resumeText);

    // 5. Run AI analysis
    const aiResult = await runAIAnalysis(resumeText, jdText, profile, bullets, summary);

    // 6. Enrich with client-side scorer data
    const clientScore = scoreResume(resumeText, jdText, profile);
    aiResult.keywordsFound  = aiResult.keywordsFound?.length  ? aiResult.keywordsFound  : clientScore.breakdown.jdKeywords.matched;
    aiResult.keywordsMissing = aiResult.keywordsMissing?.length ? aiResult.keywordsMissing : clientScore.breakdown.jdKeywords.missing;

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
