/**
 * resumeOptimizer.ts
 * 
 * Optimizes resume based on job description AND user's PM profile.
 * Profiles: aspiring | transitioning | experienced
 * 
 * ONLY modifies: summary, experience[].bullets, internships[].bullets
 * NEVER removes or changes: education, skills, certifications, projects, etc.
 */

import { ResumeData } from './types';
import { groqChatCompletion } from './aiClient';

// ─── Profile-specific guidance ──────────────────────────────────────────────────

const PROFILE_SUMMARY_GUIDANCE: Record<string, string> = {
  aspiring: `
The candidate is an ASPIRING PRODUCT MANAGER (student or fresher).
RULES FOR SUMMARY:
- Highlight academic projects, internships, hackathons, case competitions
- Emphasize curiosity, product thinking, user empathy and eagerness to learn
- Reframe any experience in PM language
- Do NOT fake seniority — sound like an ambitious beginner, not a veteran
- Tone: Enthusiastic, forward-looking, hungry to learn
`,
  transitioning: `
The candidate is TRANSITIONING INTO PRODUCT MANAGEMENT from another domain.
RULES FOR SUMMARY:
- Reframe past experience using PM language: "led cross-functional teams", "drove user research"
- Highlight WHY they are switching and what unique superpower their background gives them as a PM
- Show they understand PM work: discovery, prioritization, stakeholder alignment, delivery
- Tone: Confident, strategic, narrative-driven — tell a compelling pivot story
`,
  experienced: `
The candidate is an EXPERIENCED PRODUCT MANAGER.
RULES FOR SUMMARY:
- Lead with specific product outcomes, business impact, and metrics
- Highlight scope: team size, product scale, users impacted, ARR influenced
- Show strategic thinking: roadmap ownership, vision, stakeholder management
- Tone: Authoritative, results-driven, strategic
`,
};

const PROFILE_BULLETS_GUIDANCE: Record<string, string> = {
  aspiring: `
The candidate is an ASPIRING PM (student/fresher).
RULES FOR BULLETS:
- Reframe any work in PM language: focus on the problem solved, user impact, process followed
- Highlight product thinking: "identified user pain point", "prioritized features based on feedback"
- Do NOT add fake senior metrics — keep it credible for a fresher
- Tone: Enthusiastic, specific, shows potential
`,
  transitioning: `
The candidate is TRANSITIONING INTO PM from another domain.
RULES FOR BULLETS:
- Translate previous job experience into PM language
  * Engineer: "built X" → "led technical scoping and delivery of X"
  * Marketer: "ran campaigns" → "drove go-to-market strategy for X"
  * Consultant: "analyzed data" → "delivered insights that drove product decisions"
- Highlight cross-functional work, stakeholder management, user focus, ownership
- Tone: Confident, reframed, shows PM potential from past experience
`,
  experienced: `
The candidate is an EXPERIENCED PM.
RULES FOR BULLETS:
- Lead every bullet with a strong power verb: Led, Drove, Launched, Scaled, Owned
- Include specific metrics wherever possible: "increased retention by 18%", "drove $2M ARR"
- Highlight scope: team size, product scale, number of users, revenue impact
- Avoid vague bullets — every bullet should show clear ownership and measurable impact
- Tone: Authoritative, data-driven, senior
`,
};

// ─── Extract keywords from job description ──────────────────────────────────────

export function extractJDKeywords(jd: string): string[] {
  const techPattern = /\b(react|angular|vue|next\.?js|node\.?js|python|java(?:script)?|typescript|c\+\+|c#|ruby|go|rust|swift|kotlin|php|scala|r\b|matlab|sql|nosql|postgresql|mysql|mongodb|redis|elasticsearch|kafka|rabbitmq|aws|gcp|azure|docker|kubernetes|k8s|terraform|ansible|jenkins|github|gitlab|ci\/cd|devops|agile|scrum|kanban|jira|confluence|rest|graphql|grpc|microservices|api|ml|ai|llm|nlp|deep.?learning|machine.?learning|data.?science|analytics|tableau|power.?bi|excel|salesforce|sap|linux|unix|bash|git|html|css|figma|sketch|ux|ui|spark|hadoop|airflow|dbt|snowflake|databricks)\b/gi;
  const techFound = Array.from(new Set((jd.match(techPattern) ?? []).map(t => t.toLowerCase())));

  const tokens = jd.toLowerCase().split(/\W+/).filter(w => w.length > 3);
  const freq: Record<string, number> = {};
  for (const t of tokens) freq[t] = (freq[t] ?? 0) + 1;

  const sorted = Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([word]) => word);

  return [...new Set([...techFound, ...sorted])].slice(0, 15);
}

// ─── Optimize summary ───────────────────────────────────────────────────────────

async function optimizeSummary(
  summary: string,
  resume: ResumeData,
  jd: string,
  keywords: string[],
  pmProfile: string
): Promise<string> {
  if (!summary || summary.trim().length < 10) return summary;

  const profileGuidance = PROFILE_SUMMARY_GUIDANCE[pmProfile] || PROFILE_SUMMARY_GUIDANCE['experienced'];
  const keywordList = keywords.slice(0, 3).join(', ');

  const experienceContext = [
    ...(resume.experience ?? []).slice(0, 2).map(e => `${e.title} at ${e.company}`),
    ...(resume.internships ?? []).slice(0, 1).map(e => `${e.title} at ${e.company}`),
  ].join(', ');

  const SUMMARY_SYSTEM = `You are a professional resume writer specializing in Product Management resumes.

${profileGuidance}

CRITICAL RULES:
- 3 lines MAXIMUM. No exceptions.
- Must reference the candidate's ACTUAL job titles or companies from their experience.
- Naturally weave in 1-2 keywords from the job description.
- No clichés: "results-driven", "team player", "passionate", "detail-oriented".
- DO NOT write a generic summary that could apply to anyone.`;

  const userMsg = `Rewrite this professional summary in 3 lines MAX.

Candidate's actual experience: ${experienceContext || 'not provided'}
Keywords to include (1-2 naturally): ${keywordList}

Original Summary:
${summary}

Job Description:
${jd}

3-line rewrite (specific to their background, no fluff):`;

  try {
    const rewritten = await groqChatCompletion(SUMMARY_SYSTEM, userMsg, 200, 0.5);
    return rewritten.trim() || summary;
  } catch (err) {
    console.error('[optimizeSummary] Error:', err);
    return summary;
  }
}

async function generateSummaryFromContext(
  resume: ResumeData,
  jd: string,
  keywords: string[],
  pmProfile: string
): Promise<string> {
  const profileGuidance = PROFILE_SUMMARY_GUIDANCE[pmProfile] || PROFILE_SUMMARY_GUIDANCE['experienced'];
  const keywordList = keywords.slice(0, 3).join(', ');

  const experienceSnapshot = (resume.experience ?? []).slice(0, 3).map((exp) => {
    const bullets = (exp.bullets ?? []).slice(0, 2).join('; ');
    return `- ${exp.title} at ${exp.company}${bullets ? `: ${bullets}` : ''}`;
  }).join('\n');

  const internshipSnapshot = (resume.internships ?? []).slice(0, 2).map((item) => {
    const bullets = (item.bullets ?? []).slice(0, 2).join('; ');
    return `- ${item.title} at ${item.company}${bullets ? `: ${bullets}` : ''}`;
  }).join('\n');

  const SUMMARY_SYSTEM = `You are a professional resume writer specializing in Product Management resumes.
${profileGuidance}

CRITICAL RULES:
- 3 lines MAXIMUM. No exceptions.
- Must reference the candidate's ACTUAL job titles or companies.
- No clichés. No generic fluff.`;

  const userMsg = `Create a 3-line professional summary for this candidate using their actual experience.
Keywords to include naturally: ${keywordList}

Experience:
${experienceSnapshot || 'Not provided'}

Internships:
${internshipSnapshot || 'Not provided'}

Job Description:
${jd}

3-line summary only:`;

  try {
    const generated = await groqChatCompletion(SUMMARY_SYSTEM, userMsg, 200, 0.4);
    if (generated.trim().length > 20) return generated.trim();
  } catch (err) {
    console.error('[generateSummaryFromContext] Error:', err);
  }

  const primaryExp = resume.experience?.[0];
  const primaryInternship = resume.internships?.[0];
  const companyContext = [primaryExp?.company, primaryInternship?.company].filter(Boolean).join(' and ');
  const fallbackKeywordText = keywords.slice(0, 2).join(', ');

  return `Product Management professional with hands-on experience${companyContext ? ` at ${companyContext}` : ''}, delivering impact through cross-functional execution and measurable outcomes. Brings practical exposure aligned to target role needs${fallbackKeywordText ? `, including ${fallbackKeywordText}` : ''}.`;
}

// ─── Optimize bullets ───────────────────────────────────────────────────────────

async function rewriteBullets(
  bullets: string[],
  jd: string,
  keywords: string[],
  pmProfile: string
): Promise<string[]> {
  if (!bullets || bullets.length === 0) return bullets;

  const profileGuidance = PROFILE_BULLETS_GUIDANCE[pmProfile] || PROFILE_BULLETS_GUIDANCE['experienced'];
  const keywordList = keywords.slice(0, 8).join(', ');
  const bulletsText = bullets.map((b, i) => `${i + 1}. ${b}`).join('\n');

  const BULLETS_SYSTEM = `You are an expert Product Management resume writer.

${profileGuidance}

GENERAL RULES:
1. Start with a strong power verb
2. Add specific context: technologies, scale, outcomes
3. ONLY add metrics if clearly implied by the original bullet — never invent them
4. Keep it credible — do NOT exaggerate
5. Each bullet should be 1-2 lines, not a paragraph
6. Inject 1-2 job description keywords per bullet where natural`;

  const userMsg = `Rewrite these resume bullets for a Product Management resume.
Follow the candidate profile rules above carefully.

Keywords to naturally include (1-2 per bullet): ${keywordList}

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

// ─── Main optimizer ─────────────────────────────────────────────────────────────

export async function optimizeResume(
  resume: ResumeData,
  jobDescription: string,
  pmProfile: string = 'experienced'
): Promise<{
  optimizedResume: ResumeData;
  changes: string[];
  keywordsInjected: string[];
}> {
  console.log('[optimizeResume] Starting optimization with profile:', pmProfile);

  const keywords = extractJDKeywords(jobDescription);
  const changes: string[] = [];

  // Deep copy — ensures NO data is lost
  const optimizedResume: ResumeData = JSON.parse(JSON.stringify(resume));

  try {
    // 1. Optimize or generate summary
    if (resume.summary && resume.summary.trim().length > 10) {
      console.log('[optimizeResume] Optimizing summary...');
      const newSummary = await optimizeSummary(resume.summary, resume, jobDescription, keywords, pmProfile);
      if (newSummary !== resume.summary) {
        optimizedResume.summary = newSummary;
        changes.push('Rewrote professional summary with profile-matched tone and JD keywords');
      }
    } else {
      console.log('[optimizeResume] Generating summary from context...');
      optimizedResume.summary = await generateSummaryFromContext(resume, jobDescription, keywords, pmProfile);
      changes.push('Generated professional summary tailored to your profile and job description');
    }

    const currentSectionOrder = optimizedResume.sectionOrder ?? [];
    if (!currentSectionOrder.includes('summary')) {
      optimizedResume.sectionOrder = ['summary', ...currentSectionOrder];
    }

    // 2. Optimize experience bullets
    if (resume.experience && resume.experience.length > 0) {
      console.log('[optimizeResume] Optimizing experience bullets...');
      for (let i = 0; i < resume.experience.length; i++) {
        const exp = resume.experience[i];
        if (exp && exp.bullets && exp.bullets.length > 0) {
          const newBullets = await rewriteBullets(exp.bullets, jobDescription, keywords, pmProfile);
          optimizedResume.experience[i]!.bullets = newBullets;
          changes.push(`Enhanced ${exp.bullets.length} bullet(s) for ${exp.title} at ${exp.company}`);
        }
      }
    }

    // 3. Optimize internship bullets
    if (resume.internships && resume.internships.length > 0) {
      console.log('[optimizeResume] Optimizing internship bullets...');
      for (let i = 0; i < resume.internships.length; i++) {
        const int = resume.internships[i];
        if (int && int.bullets && int.bullets.length > 0) {
          const newBullets = await rewriteBullets(int.bullets, jobDescription, keywords, pmProfile);
          if (optimizedResume.internships) optimizedResume.internships[i]!.bullets = newBullets;
          changes.push(`Enhanced ${int.bullets.length} bullet(s) for ${int.title} at ${int.company}`);
        }
      }
    }

    console.log('[optimizeResume] Done. Profile:', pmProfile, '| Keywords:', keywords.length);

    return { optimizedResume, changes, keywordsInjected: keywords };

  } catch (error) {
    console.error('[optimizeResume] Fatal error:', error);
    return {
      optimizedResume: resume,
      changes: ['Optimization failed - returning original resume'],
      keywordsInjected: keywords,
    };
  }
}
