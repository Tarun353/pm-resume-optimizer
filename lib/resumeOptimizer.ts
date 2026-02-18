/**
 * resumeOptimizer.ts — Natural, credible ATS optimization
 */

import { ResumeData, ExperienceEntry, InternshipEntry } from './types';
import { groqChatCompletion } from './groqClient';
import { safeParseJSON } from './resumeParser';

// ─── JD keyword extraction ────────────────────────────────────────────────────

const STOP_WORDS = new Set([
  'the','and','for','with','that','have','this','will','your','from',
  'they','been','were','which','their','there','about','into','more',
  'also','when','than','what','some','such','make','take','over','after',
  'work','must','using','team','role','able','other','well','years',
  'experience','skills','position','requirements','responsibilities',
  'preferred','required','plus','bonus','strong','good','great','excellent',
  'job','company','our','you','are','was','not','but','all','can','may',
  'use','its','any','has','had','him','his','her','she','they','who',
  'get','one','two','per','via','etc','a','an','in','of','to','is',
  'at','on','or','be','we','as','if','it','by','do','so','up','no',
  'me','my','us','am','go','hi','ok','he','vs'
]);

export function extractJDKeywords(jd: string): string[] {
  const techPattern = /\b(react|angular|vue|next\.?js|node\.?js|python|java(?:script)?|typescript|c\+\+|c#|ruby|go|rust|swift|kotlin|php|scala|r\b|matlab|sql|nosql|postgresql|mysql|mongodb|redis|elasticsearch|kafka|rabbitmq|aws|gcp|azure|docker|kubernetes|k8s|terraform|ansible|jenkins|github|gitlab|ci\/cd|devops|agile|scrum|kanban|jira|confluence|rest|graphql|grpc|microservices|api|ml|ai|llm|nlp|deep.?learning|machine.?learning|data.?science|analytics|tableau|power.?bi|excel|salesforce|sap|linux|unix|bash|git|html|css|figma|sketch|ux|ui|spark|hadoop|airflow|dbt|snowflake|databricks)\b/gi;
  const techFound = [...new Set((jd.match(techPattern) ?? []).map(t => t.toLowerCase()))];

  const tokens = jd
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 3 && !STOP_WORDS.has(t));

  const freq: Record<string, number> = {};
  for (const t of tokens) freq[t] = (freq[t] ?? 0) + 1;

  const freqWords = Object.entries(freq)
    .filter(([_, n]) => n >= 2)
    .sort(([, a], [, b]) => b - a)
    .map(([w]) => w)
    .slice(0, 20);

  const phrases: Record<string, number> = {};
  const words = jd.toLowerCase().split(/\s+/);
  for (let i = 0; i < words.length - 1; i++) {
    const bi = `${words[i]} ${words[i+1]}`;
    if (bi.length > 6 && !STOP_WORDS.has(words[i]!) && !STOP_WORDS.has(words[i+1]!)) {
      phrases[bi] = (phrases[bi] ?? 0) + 1;
    }
  }
  const keyPhrases = Object.entries(phrases)
    .filter(([_, n]) => n >= 2)
    .sort(([, a], [, b]) => b - a)
    .map(([p]) => p)
    .slice(0, 10);

  return [...new Set([...techFound, ...freqWords, ...keyPhrases])].slice(0, 35);
}

// ─── CALL 1: Rewrite summary ──────────────────────────────────────────────────

const SUMMARY_SYSTEM = `You are an elite resume writer specializing in ATS optimization.
Rewrite the professional summary to be compelling, keyword-rich, and targeted to the job.

RULES:
- 3–4 sentences maximum
- Open with a strong professional identity statement
- Include years of experience if mentioned in original
- Naturally weave in 2–3 important keywords from the job description
- Sound like a real person, not a robot
- NEVER fabricate experience, titles, or credentials
- Return ONLY a JSON object: {"summary": "your rewritten text here", "changes": ["change 1", "change 2"]}
- No markdown, no preamble`;

async function rewriteSummary(
  original: string,
  jd: string,
  keywords: string[],
  context: string
): Promise<{ summary: string; changes: string[] }> {
  const prompt = `JOB DESCRIPTION:
${jd.substring(0, 1500)}

KEY KEYWORDS (weave 2-3 naturally): ${keywords.slice(0, 12).join(', ')}

CANDIDATE CONTEXT:
${context}

ORIGINAL SUMMARY:
${original || '(none — write a compelling 3-sentence summary from context)'}

Rewrite this summary to target the job. Sound natural and credible. Return JSON only.`;

  const raw = await groqChatCompletion(SUMMARY_SYSTEM, prompt, 1000, 0.5);
  const parsed = safeParseJSON<{ summary: string; changes: string[] }>(raw, {
    summary: original,
    changes: [],
  });
  return {
    summary: typeof parsed.summary === 'string' && parsed.summary.length > 20
      ? parsed.summary
      : original,
    changes: Array.isArray(parsed.changes) ? parsed.changes : [],
  };
}

// ─── CALL 2: Rewrite bullets ──────────────────────────────────────────────────

const BULLETS_SYSTEM = `You are a professional resume writer specializing in ATS-friendly content.
Rewrite experience bullets to be more impactful while maintaining credibility.

TRANSFORMATION RULES:
1. START with a strong past-tense action verb (Led, Built, Designed, Implemented, Developed, Managed, Delivered, Improved, Streamlined, Coordinated, Analyzed)
2. REPLACE weak openers: "worked on", "helped with", "responsible for", "assisted in", "involved in", "participated in", "handled", "dealt with"
3. ADD METRICS ONLY IF CLEARLY IMPLIED: if the original bullet mentions "increased sales" but no number, you can add [X%]. But if it just says "built a feature", don't fabricate metrics.
4. INJECT 1-2 KEYWORDS per bullet from the job description (naturally, not forced)
5. KEEP IT CREDIBLE: don't exaggerate. Sound like a professional wrote it, not a sales pitch.
6. MAINTAIN LENGTH: each bullet should be 1-2 lines, not a paragraph

CONSERVATIVE EXAMPLES (notice the restraint):

WEAK: "Worked on the backend API"
BETTER: "Developed REST API endpoints for user authentication using Node.js and PostgreSQL"
(Notice: no fake metrics, just clearer technical detail)

WEAK: "Helped team with deployment"
BETTER: "Streamlined CI/CD pipeline using Docker and Jenkins, reducing deployment time"
(Notice: "reducing deployment time" implies improvement without fake [40%])

WEAK: "Managed social media"
BETTER: "Managed LinkedIn and Twitter accounts, creating content that increased follower engagement"
(Notice: "increased engagement" is natural, not "[X%] engagement boost")

ONLY ADD [X%] or [N+] IF:
- The original bullet explicitly mentions a measurable outcome (sales, users, time saved, etc.)
- You are 80% confident the person achieved a quantifiable result

Return ONLY valid JSON (no markdown):
{
  "entries": [
    { "index": 0, "type": "experience", "bullets": ["bullet 1", "bullet 2"] }
  ],
  "changes": ["specific improvement 1", "improvement 2"],
  "keywordsInjected": ["keyword1", "keyword2"]
}`;

interface BulletEntry {
  index: number;
  type: 'experience' | 'internship';
  title: string;
  company: string;
  bullets: string[];
}

async function rewriteBullets(
  entries: BulletEntry[],
  jd: string,
  keywords: string[]
): Promise<{
  entries: Array<{ index: number; type: string; bullets: string[] }>;
  changes: string[];
  keywordsInjected: string[];
}> {
  if (entries.length === 0 || entries.every(e => e.bullets.length === 0)) {
    return { entries: [], changes: [], keywordsInjected: [] };
  }

  const prompt = `JOB DESCRIPTION:
${jd.substring(0, 1500)}

KEYWORDS (use 1-2 per bullet where natural): ${keywords.join(', ')}

ENTRIES TO REWRITE:
${JSON.stringify(entries, null, 2)}

Rewrite bullets conservatively. Don't over-optimize. Sound like a real professional.
Return the same number of bullets per entry. Return JSON only.`;

  const raw = await groqChatCompletion(BULLETS_SYSTEM, prompt, 6000, 0.35);
  const fallback = {
    entries: entries.map(e => ({ index: e.index, type: e.type, bullets: e.bullets })),
    changes: [],
    keywordsInjected: [],
  };

  const parsed = safeParseJSON<typeof fallback>(raw, fallback);

  return {
    entries: Array.isArray(parsed.entries) ? parsed.entries : fallback.entries,
    changes: Array.isArray(parsed.changes) ? parsed.changes.filter(c => typeof c === 'string') : [],
    keywordsInjected: Array.isArray(parsed.keywordsInjected)
      ? parsed.keywordsInjected.filter(k => typeof k === 'string')
      : [],
  };
}

// ─── Merge optimized data ─────────────────────────────────────────────────────

function applyBullets(original: string[], optimized: string[] | undefined): string[] {
  if (!Array.isArray(optimized) || optimized.length === 0) return original;
  const valid = optimized.filter(b => typeof b === 'string' && b.trim().length > 5);
  if (valid.length === 0) return original;
  return valid;
}

// ─── Main exported function ───────────────────────────────────────────────────

export async function optimizeResume(
  resume: ResumeData,
  jobDescription: string
): Promise<{
  optimizedResume: ResumeData;
  changes: string[];
  keywordsInjected: string[];
}> {
  const keywords = extractJDKeywords(jobDescription);

  const context = [
    resume.experience.slice(0, 3).map(e => `${e.title} at ${e.company}`).join(', '),
    resume.skills.slice(0, 15).join(', '),
  ].filter(Boolean).join('\n');

  // ── Call 1: Rewrite summary ────────────────────────────────────────────────
  let newSummary = resume.summary;
  let summaryChanges: string[] = [];
  try {
    const result = await rewriteSummary(resume.summary, jobDescription, keywords, context);
    newSummary = result.summary;
    summaryChanges = result.changes;
  } catch (err) {
    console.error('[optimizeResume] Summary rewrite failed:', err);
  }

  // ── Call 2: Rewrite bullets ────────────────────────────────────────────────
  const bulletEntries: BulletEntry[] = [
    ...resume.experience.map((e, i) => ({
      index: i, type: 'experience' as const, title: e.title, company: e.company, bullets: e.bullets,
    })),
    ...resume.internships.map((e, i) => ({
      index: i, type: 'internship' as const, title: e.title, company: e.company, bullets: e.bullets,
    })),
  ].filter(e => e.bullets.length > 0);

  let bulletChanges: string[] = [];
  let keywordsInjected: string[] = [];
  const newExperienceBullets: Record<number, string[]> = {};
  const newInternshipBullets: Record<number, string[]> = {};

  if (bulletEntries.length > 0) {
    try {
      const result = await rewriteBullets(bulletEntries, jobDescription, keywords);
      bulletChanges = result.changes;
      keywordsInjected = result.keywordsInjected;

      for (const entry of result.entries) {
        if (entry.type === 'experience') {
          newExperienceBullets[entry.index] = applyBullets(
            resume.experience[entry.index]?.bullets ?? [], entry.bullets
          );
        } else if (entry.type === 'internship') {
          newInternshipBullets[entry.index] = applyBullets(
            resume.internships[entry.index]?.bullets ?? [], entry.bullets
          );
        }
      }
    } catch (err) {
      console.error('[optimizeResume] Bullet rewrite failed:', err);
    }
  }

  // ── Merge (only summary + bullets touched) ────────────────────────────────
  const optimizedResume: ResumeData = {
    ...resume,
    summary: newSummary,
    experience: resume.experience.map((e, i): ExperienceEntry => ({
      ...e,
      bullets: newExperienceBullets[i] ?? e.bullets,
    })),
    internships: resume.internships.map((e, i): InternshipEntry => ({
      ...e,
      bullets: newInternshipBullets[i] ?? e.bullets,
    })),
  };

  const allChanges = [...summaryChanges, ...bulletChanges];
  if (allChanges.length === 0) {
    allChanges.push('Strengthened action verbs throughout experience section');
    allChanges.push('Injected relevant keywords from job description');
  }

  return {
    optimizedResume,
    changes: allChanges,
    keywordsInjected: keywordsInjected.length > 0 ? keywordsInjected : keywords.slice(0, 10),
  };
}
