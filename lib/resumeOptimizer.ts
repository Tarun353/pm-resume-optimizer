/**
 * resumeOptimizer.ts - FIXED VERSION
 * 
 * CRITICAL: This optimizer ONLY modifies:
 * - summary (rewritten)
 * - experience[].bullets (rewritten)
 * - internships[].bullets (rewritten)
 * 
 * EVERYTHING ELSE is preserved EXACTLY as-is:
 * - personal, education, certifications, awards, publications, 
 *   projects, skills, softSkills, additionalSections, sectionOrder
 * 
 * NO SECTIONS ARE EVER REMOVED.
 */

import { ResumeData } from './types';
import { groqChatCompletion } from './groqClient';

// ─── Extract keywords from job description ────────────────────────────────────

export function extractJDKeywords(jd: string): string[] {
  const techPattern = /\b(react|angular|vue|next\.?js|node\.?js|python|java(?:script)?|typescript|c\+\+|c#|ruby|go|rust|swift|kotlin|php|scala|r\b|matlab|sql|nosql|postgresql|mysql|mongodb|redis|elasticsearch|kafka|rabbitmq|aws|gcp|azure|docker|kubernetes|k8s|terraform|ansible|jenkins|github|gitlab|ci\/cd|devops|agile|scrum|kanban|jira|confluence|rest|graphql|grpc|microservices|api|ml|ai|llm|nlp|deep.?learning|machine.?learning|data.?science|analytics|tableau|power.?bi|excel|salesforce|sap|linux|unix|bash|git|html|css|figma|sketch|ux|ui|spark|hadoop|airflow|dbt|snowflake|databricks)\b/gi;
  const techFound = Array.from(new Set((jd.match(techPattern) ?? []).map(t => t.toLowerCase())));

  const tokens = jd
    .toLowerCase()
    .split(/\W+/)
    .filter(w => w.length > 3);

  const freq: Record<string, number> = {};
  for (const t of tokens) {
    freq[t] = (freq[t] ?? 0) + 1;
  }

  const sorted = Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([word]) => word);

  const combined = [...new Set([...techFound, ...sorted])];
  return combined.slice(0, 15);
}

// ─── Optimize summary ──────────────────────────────────────────────────────────

const SUMMARY_SYSTEM = `You are a professional resume writer specializing in ATS optimization.

Your task: Rewrite the professional summary to match the job description while maintaining authenticity.

Requirements:
- 3–4 sentences maximum
- Naturally weave in 2–3 important keywords from the job description
- Sound like a real person, not a robot
- Highlight relevant skills and experience
- Use power verbs (led, drove, architected, implemented, optimized)
- Be specific but concise
- Match the tone of the job description (technical, creative, managerial, etc.)

DO NOT:
- Use clichés ("results-driven", "team player", "passionate", "detail-oriented")
- Over-stuff keywords
- Make claims not supported by the experience
- Sound generic or templated`;

async function optimizeSummary(summary: string, jd: string, keywords: string[]): Promise<string> {
  if (!summary || summary.trim().length < 10) return summary;

  const keywordList = keywords.slice(0, 5).join(', ');
  const userMsg = `Rewrite this professional summary to match the job description below. Naturally include these keywords where appropriate: ${keywordList}

Original Summary:
${summary}

Job Description:
${jd}

Rewrite the summary (3-4 sentences, professional, authentic):`;

  try {
    const rewritten = await groqChatCompletion(SUMMARY_SYSTEM, userMsg, 300, 0.5);
    return rewritten.trim() || summary;
  } catch (err) {
    console.error('[optimizeSummary] Error:', err);
    return summary;
  }
}

// ─── Optimize bullets ──────────────────────────────────────────────────────────

const BULLETS_SYSTEM = `You are an expert resume writer. Your goal: strengthen bullet points for ATS and human readers.

CONSERVATIVE EXAMPLES (notice the restraint):

Before: "Worked on backend services"
After: "Developed REST APIs for user authentication, reducing login time"

Before: "Managed a team"  
After: "Led cross-functional team of 5 engineers through Agile sprints"

Before: "Improved deployment process"
After: "Automated deployment pipeline using Jenkins and Docker"

Rules:
1. Start with power verbs: Led, Architected, Implemented, Optimized, Drove, Built, Designed, Launched
2. Add specific context: technologies, scale, outcomes
3. ONLY ADD [X%] or [N+] IF: The original bullet explicitly mentions a measurable outcome AND you are 80% confident
4. KEEP IT CREDIBLE: don't exaggerate. Sound like a professional wrote it, not a sales pitch.
5. MAINTAIN LENGTH: each bullet should be 1-2 lines, not a paragraph
6. Inject 1-2 job description keywords per bullet where natural

DO NOT:
- Add fake metrics ([40%], [5x], etc.) unless clearly implied
- Make the bullet 3+ lines long
- Sound robotic with excessive [X%] everywhere
- Use buzzwords without substance`;

async function rewriteBullets(
  bullets: string[],
  jd: string,
  keywords: string[]
): Promise<string[]> {
  if (!bullets || bullets.length === 0) return bullets;

  const keywordList = keywords.slice(0, 8).join(', ');
  const bulletsText = bullets.map((b, i) => `${i + 1}. ${b}`).join('\n');

  const userMsg = `Rewrite these bullet points conservatively. Don't over-optimize. Sound like a real professional.

Relevant keywords to naturally include (1-2 per bullet): ${keywordList}

Original Bullets:
${bulletsText}

Job Description Context:
${jd.substring(0, 800)}

Return ONLY the rewritten bullets, one per line, numbered:`;

  try {
    const result = await groqChatCompletion(BULLETS_SYSTEM, userMsg, 800, 0.35);
    
    const lines = result
      .split('\n')
      .map(line => line.replace(/^\d+\.\s*/, '').trim())
      .filter(line => line.length > 10);

    if (lines.length !== bullets.length) {
      console.warn('[rewriteBullets] Count mismatch, using original');
      return bullets;
    }

    return lines;
  } catch (err) {
    console.error('[rewriteBullets] Error:', err);
    return bullets;
  }
}

// ─── Main optimizer ────────────────────────────────────────────────────────────

export async function optimizeResume(
  resume: ResumeData,
  jobDescription: string
): Promise<{
  optimizedResume: ResumeData;
  changes: string[];
  keywordsInjected: string[];
}> {
  console.log('[optimizeResume] Starting optimization...');
  console.log('[optimizeResume] Input sections:', {
    personal: !!resume.personal,
    summary: !!resume.summary,
    experience: resume.experience?.length ?? 0,
    education: resume.education?.length ?? 0,
    skills: resume.skills?.length ?? 0,
    certifications: resume.certifications?.length ?? 0,
    awards: resume.awards?.length ?? 0,
    publications: resume.publications?.length ?? 0,
    internships: resume.internships?.length ?? 0,
    projects: resume.projects?.length ?? 0,
    softSkills: resume.softSkills?.length ?? 0,
    additionalSections: resume.additionalSections?.length ?? 0,
    sectionOrder: resume.sectionOrder?.length ?? 0,
  });

  const keywords = extractJDKeywords(jobDescription);
  const changes: string[] = [];

  // CRITICAL: Make a COMPLETE deep copy of the entire resume
  // This ensures NO data is lost
  const optimizedResume: ResumeData = JSON.parse(JSON.stringify(resume));

  try {
    // 1. Optimize summary (if exists)
    if (resume.summary && resume.summary.trim().length > 10) {
      console.log('[optimizeResume] Optimizing summary...');
      const newSummary = await optimizeSummary(resume.summary, jobDescription, keywords);
      if (newSummary !== resume.summary) {
        optimizedResume.summary = newSummary;
        changes.push('Rewrote professional summary with JD-matched keywords and power verbs');
      }
    }

    // 2. Optimize experience bullets (if exists)
    if (resume.experience && resume.experience.length > 0) {
      console.log('[optimizeResume] Optimizing experience bullets...');
      for (let i = 0; i < resume.experience.length; i++) {
        const exp = resume.experience[i];
        if (exp && exp.bullets && exp.bullets.length > 0) {
          const newBullets = await rewriteBullets(exp.bullets, jobDescription, keywords);
          optimizedResume.experience[i]!.bullets = newBullets;
          changes.push(`Enhanced ${exp.bullets.length} bullet(s) for ${exp.title} at ${exp.company}`);
        }
      }
    }

    // 3. Optimize internship bullets (if exists)
    if (resume.internships && resume.internships.length > 0) {
      console.log('[optimizeResume] Optimizing internship bullets...');
      for (let i = 0; i < resume.internships.length; i++) {
        const int = resume.internships[i];
        if (int && int.bullets && int.bullets.length > 0) {
          const newBullets = await rewriteBullets(int.bullets, jobDescription, keywords);
          if (optimizedResume.internships) optimizedResume.internships[i]!.bullets = newBullets;
          changes.push(`Enhanced ${int.bullets.length} bullet(s) for ${int.title} at ${int.company}`);
        }
      }
    }

    // VERIFICATION: Log what's in the optimized resume
    console.log('[optimizeResume] Output sections:', {
      personal: !!optimizedResume.personal,
      summary: !!optimizedResume.summary,
      experience: optimizedResume.experience?.length ?? 0,
      education: optimizedResume.education?.length ?? 0,
      skills: optimizedResume.skills?.length ?? 0,
      certifications: optimizedResume.certifications?.length ?? 0,
      awards: optimizedResume.awards?.length ?? 0,
      publications: optimizedResume.publications?.length ?? 0,
      internships: optimizedResume.internships?.length ?? 0,
      projects: optimizedResume.projects?.length ?? 0,
      softSkills: optimizedResume.softSkills?.length ?? 0,
      additionalSections: optimizedResume.additionalSections?.length ?? 0,
      sectionOrder: optimizedResume.sectionOrder?.length ?? 0,
    });

    // CRITICAL CHECK: Verify no sections were lost
    const inputSections = Object.keys(resume).filter(k => {
      const val = resume[k as keyof ResumeData];
      return Array.isArray(val) ? val.length > 0 : !!val;
    });

    const outputSections = Object.keys(optimizedResume).filter(k => {
      const val = optimizedResume[k as keyof ResumeData];
      return Array.isArray(val) ? val.length > 0 : !!val;
    });

    if (outputSections.length < inputSections.length) {
      console.error('[optimizeResume] CRITICAL: Sections were lost!');
      console.error('[optimizeResume] Input had:', inputSections);
      console.error('[optimizeResume] Output has:', outputSections);
      console.error('[optimizeResume] Missing:', inputSections.filter(s => !outputSections.includes(s)));
    }

    return {
      optimizedResume,
      changes,
      keywordsInjected: keywords,
    };
  } catch (error) {
    console.error('[optimizeResume] Fatal error:', error);
    // On error, return original resume unchanged
    return {
      optimizedResume: resume,
      changes: ['Optimization failed - returning original resume'],
      keywordsInjected: keywords,
    };
  }
}
