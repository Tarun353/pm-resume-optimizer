/**
 * resumeParser.ts - FIXED: Preserves ALL bullets, handles subsections
 * 
 * Changes:
 * 1. Explicit instructions to preserve bullet structure
 * 2. Handle Responsibilities/Achievements/Environment subsections
 * 3. Increased character and token limits
 */

import { ResumeData, PersonalInfo, CareerStage } from './types';
import { groqChatCompletion } from './groqClient';
import { parseWithLlamaParse } from './llamaParseClient';

// ─── Professional Section Orders ──────────────────────────────────────────────

const PROFESSIONAL_ORDERS: Record<CareerStage, string[]> = {
  experienced: [
    'summary',
    'experience',
    'skills',
    'education',
    'certifications',
    'projects',
    'awards',
    'publications',
    'softSkills',
  ],
  
  fresher: [
    'summary',
    'education',
    'internships',
    'projects',
    'skills',
    'certifications',
    'awards',
    'publications',
    'softSkills',
  ],
  
  'career-change': [
    'summary',
    'skills',
    'experience',
    'education',
    'projects',
    'certifications',
    'awards',
    'publications',
    'softSkills',
  ],
};

function buildProfessionalOrder(
  resume: Partial<ResumeData>,
  careerStage: CareerStage
): string[] {
  const baseOrder = PROFESSIONAL_ORDERS[careerStage];
  const finalOrder: string[] = [];

  for (const key of baseOrder) {
    const hasContent = checkSectionHasContent(resume, key);
    if (hasContent) {
      finalOrder.push(key);
    }
  }

  for (const addl of resume.additionalSections ?? []) {
    if (addl.heading) {
      finalOrder.push(`additional:${addl.heading}`);
    }
  }

  console.log(`[buildProfessionalOrder] Career stage: ${careerStage}`);
  console.log(`[buildProfessionalOrder] Final order:`, finalOrder);

  return finalOrder;
}

function checkSectionHasContent(resume: Partial<ResumeData>, key: string): boolean {
  switch (key) {
    case 'summary':
      return !!resume.summary && resume.summary.trim().length > 0;
    case 'experience':
      return Array.isArray(resume.experience) && resume.experience.length > 0;
    case 'internships':
      return Array.isArray(resume.internships) && resume.internships.length > 0;
    case 'education':
      return Array.isArray(resume.education) && resume.education.length > 0;
    case 'certifications':
      return Array.isArray(resume.certifications) && resume.certifications.length > 0;
    case 'awards':
      return Array.isArray(resume.awards) && resume.awards.length > 0;
    case 'publications':
      return Array.isArray(resume.publications) && resume.publications.length > 0;
    case 'projects':
      return Array.isArray(resume.projects) && resume.projects.length > 0;
    case 'skills':
      return Array.isArray(resume.skills) && resume.skills.length > 0;
    case 'softSkills':
      return Array.isArray(resume.softSkills) && resume.softSkills.length > 0;
    default:
      return false;
  }
}

// ─── Safe JSON parser ─────────────────────────────────────────────────────────

export function safeParseJSON<T>(raw: string, fallback: T): T {
  if (!raw || typeof raw !== 'string') return fallback;

  const strategies: Array<() => unknown> = [
    () => JSON.parse(raw),
    () => {
      const m = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (!m) return undefined;
      return JSON.parse(m[1]!);
    },
    () => {
      const m = raw.match(/\{[\s\S]*\}/);
      if (!m) return undefined;
      return JSON.parse(m[0]!);
    },
    () => {
      const cleaned = raw
        .replace(/,(\s*[}\]])/g, '$1')
        .replace(/([{,]\s*)([a-zA-Z_]\w*)\s*:/g, '$1"$2":')
        .replace(/:\s*'([^']*)'/g, ': "$1"');
      return JSON.parse(cleaned);
    },
  ];

  for (const fn of strategies) {
    try {
      const result = fn();
      if (result !== null && result !== undefined) return result as T;
    } catch { /* try next */ }
  }

  return fallback;
}

// ─── Groq structuring prompt - FIXED ──────────────────────────────────────────

const STRUCTURE_SYSTEM = `You are a precise resume data extractor.
Extract ALL fields into JSON.

CRITICAL RULES FOR COMPLETE BULLET EXTRACTION:
1. Extract EVERY SINGLE bullet point as a SEPARATE array item - do not merge, summarize, or combine
2. If you see 10 bullets, output 10 separate items in the array
3. Each bullet point that starts with "•" or "-" MUST be a separate array item
4. NEVER merge multiple bullets into one long text string

EXPERIENCE SUBSECTIONS HANDLING:
- If a job has subsections like "Responsibilities:", "Achievements:", "Environment:", extract ALL bullets from ALL subsections
- Combine bullets from Responsibilities, Achievements, and any other subsections into ONE bullets[] array
- Preserve the Environment line separately if it's a tech stack (not bullets)

CAREER HIGHLIGHTS / KEY ACHIEVEMENTS:
- If you see a section like "Career Highlights" or "Key Achievements" with multiple bullets
- Extract EACH bullet as a SEPARATE item in the items[] array
- Do NOT combine them into one long paragraph

CRITICAL ANTI-DUPLICATION RULES:
1. If a section is labeled "Internships" or "Internship Experience", put entries ONLY in internships[]
2. If a section is labeled "Work Experience" or "Experience", put entries ONLY in experience[]
3. NEVER put the same job entry in both experience[] and internships[]
4. If a job title contains "Intern", it goes in internships[] NOT experience[]
5. Each entry appears in EXACTLY ONE array

SECTION KEY MAPPING:
- Summary/Profile/Objective → "summary"
- Work Experience/Employment → "experience"
- Internships → "internships"
- Education → "education"
- Certifications/Licenses → "certifications"
- Awards/Honors → "awards"
- Publications/Research → "publications"
- Projects → "projects"
- Skills/Technical Skills → "skills"
- Soft Skills/Core Competencies → "softSkills"
- Career Highlights/Key Achievements → additionalSections with heading "Career Highlights"
- Anything else → "additional:EXACT_HEADING"

Return ONLY valid JSON. No markdown. No explanation.

OUTPUT SCHEMA:
{
  "personal": { "name": "", "email": "", "phone": "", "location": "", "links": [] },
  "summary": "",
  "experience": [{ "title": "", "company": "", "location": "", "startDate": "", "endDate": "", "bullets": [] }],
  "education": [{ "degree": "", "institution": "", "location": "", "startDate": "", "endDate": "", "gpa": "", "notes": "" }],
  "certifications": [{ "name": "", "issuer": "", "date": "", "credentialId": "" }],
  "awards": [{ "title": "", "issuer": "", "date": "", "description": "" }],
  "publications": [{ "title": "", "publisher": "", "date": "", "description": "", "link": "" }],
  "internships": [{ "title": "", "company": "", "location": "", "startDate": "", "endDate": "", "bullets": [] }],
  "projects": [{ "name": "", "description": "", "technologies": [], "bullets": [], "link": "", "startDate": "", "endDate": "" }],
  "skills": [],
  "softSkills": [],
  "additionalSections": [{ "heading": "", "rawContent": "", "items": [] }]
}`;

// ─── Deduplication ────────────────────────────────────────────────────────────

function deduplicateEntries(resume: Partial<ResumeData>): Partial<ResumeData> {
  const exp = resume.experience ?? [];
  const int = resume.internships ?? [];

  if (exp.length === 0 || int.length === 0) return resume;

  const duplicates = new Set<number>();
  
  for (let i = 0; i < int.length; i++) {
    const intern = int[i];
    if (!intern) continue;
    
    for (let j = 0; j < exp.length; j++) {
      const job = exp[j];
      if (!job) continue;
      
      const titleMatch = intern.title?.toLowerCase().trim() === job.title?.toLowerCase().trim();
      const companyMatch = intern.company?.toLowerCase().trim() === job.company?.toLowerCase().trim();
      
      if (titleMatch && companyMatch) {
        duplicates.add(j);
        console.log(`[Deduplicate] Removed duplicate: "${job.title}" at "${job.company}"`);
      }
    }
  }

  const cleanedExperience = exp.filter((_, idx) => !duplicates.has(idx));

  return {
    ...resume,
    experience: cleanedExperience,
    internships: int,
  };
}

// ─── Shape enforcer ───────────────────────────────────────────────────────────

function ensureResumeShape(raw: Partial<ResumeData>, careerStage: CareerStage): ResumeData {
  const defaultPersonal: PersonalInfo = {
    name: '', email: '', phone: '', location: '', links: [],
  };

  const deduplicated = deduplicateEntries(raw);

  const resume: ResumeData = {
    personal: {
      ...defaultPersonal,
      ...(typeof deduplicated.personal === 'object' && deduplicated.personal ? deduplicated.personal : {}),
      links: Array.isArray(deduplicated.personal?.links) ? deduplicated.personal.links : [],
    },
    summary:  typeof deduplicated.summary === 'string' ? deduplicated.summary : '',

    experience: Array.isArray(deduplicated.experience) ? deduplicated.experience.map(e => ({
      title: e.title ?? '', company: e.company ?? '', location: e.location ?? '',
      startDate: e.startDate ?? '', endDate: e.endDate ?? '',
      bullets: Array.isArray(e.bullets) ? e.bullets.filter(b => typeof b === 'string' && b.trim()) : [],
    })) : [],

    education: Array.isArray(deduplicated.education) ? deduplicated.education.map(e => ({
      degree: e.degree ?? '', institution: e.institution ?? '', location: e.location ?? '',
      startDate: e.startDate ?? '', endDate: e.endDate ?? '',
      gpa: e.gpa ?? '', notes: e.notes ?? '',
    })) : [],

    certifications: Array.isArray(deduplicated.certifications) ? deduplicated.certifications.map(c => ({
      name: c.name ?? '', issuer: c.issuer ?? '', date: c.date ?? '', credentialId: (c as any).credentialId ?? '',
    })) : [],

    awards: Array.isArray(deduplicated.awards) ? deduplicated.awards.map(a => ({
      title: a.title ?? '', issuer: a.issuer ?? '', date: a.date ?? '', description: a.description ?? '',
    })) : [],

    publications: Array.isArray(deduplicated.publications) ? deduplicated.publications.map(p => ({
      title: p.title ?? '', publisher: p.publisher ?? '', date: p.date ?? '',
      description: p.description ?? '', link: p.link ?? '',
    })) : [],

    internships: Array.isArray(deduplicated.internships) ? deduplicated.internships.map(e => ({
      title: e.title ?? '', company: e.company ?? '', location: e.location ?? '',
      startDate: e.startDate ?? '', endDate: e.endDate ?? '',
      bullets: Array.isArray(e.bullets) ? e.bullets.filter(b => typeof b === 'string' && b.trim()) : [],
    })) : [],

    projects: Array.isArray(deduplicated.projects) ? deduplicated.projects.map(p => ({
      name: p.name ?? '', description: p.description ?? '',
      technologies: Array.isArray(p.technologies) ? p.technologies : [],
      bullets: Array.isArray(p.bullets) ? p.bullets.filter(b => typeof b === 'string' && b.trim()) : [],
      link: p.link ?? '', startDate: p.startDate ?? '', endDate: p.endDate ?? '',
    })) : [],

    skills:     Array.isArray(deduplicated.skills)     ? deduplicated.skills.filter(s => typeof s === 'string' && s.trim())     : [],
    softSkills: Array.isArray(deduplicated.softSkills) ? deduplicated.softSkills.filter(s => typeof s === 'string' && s.trim()) : [],

    additionalSections: Array.isArray(deduplicated.additionalSections) ? deduplicated.additionalSections.map(s => ({
      heading:    s.heading    ?? '',
      rawContent: s.rawContent ?? '',
      items: Array.isArray(s.items) ? s.items.filter(i => typeof i === 'string' && i.trim()) : [],
    })) : [],

    sectionOrder: buildProfessionalOrder(deduplicated, careerStage),
  };

  console.log('[ensureResumeShape] Experience:', resume.experience.length, 'entries');
  if (resume.experience.length > 0) {
    console.log('[ensureResumeShape] First experience bullets:', resume.experience[0]?.bullets.length);
  }
  console.log('[ensureResumeShape] Additional sections:', resume.additionalSections.length);
  if (resume.additionalSections.length > 0) {
    console.log('[ensureResumeShape] Additional section items:', resume.additionalSections[0]?.items.length);
  }

  return resume;
}

// ─── LLM structurer - INCREASED LIMITS ────────────────────────────────────────

async function structureWithGroq(markdown: string, careerStage: CareerStage): Promise<ResumeData> {
  // INCREASED: 14000 → 25000 chars
  const truncated = markdown.length > 25000
    ? markdown.substring(0, 20000) + '\n\n[...truncated...]\n\n' + markdown.substring(markdown.length - 3000)
    : markdown;

  const userMessage = `Extract resume data. Preserve EVERY bullet point as separate array items.\n\nResume:\n\n${truncated}`;

  let raw = '';
  try {
    // INCREASED: 6000 → 8000 tokens
    raw = await groqChatCompletion(STRUCTURE_SYSTEM, userMessage, 8000, 0.1);
  } catch (err) {
    console.error('[structureWithGroq] Groq failed:', err);
    throw err;
  }

  const parsed = safeParseJSON<Partial<ResumeData>>(raw, {});
  return ensureResumeShape(parsed, careerStage);
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function parseResumeText(rawText: string, careerStage: CareerStage): Promise<ResumeData> {
  return structureWithGroq(rawText, careerStage);
}

export async function extractTextFromPDF(buffer: Buffer, fileName = 'resume.pdf'): Promise<string> {
  return parseWithLlamaParse(buffer, fileName);
}

export async function extractTextFromDOCX(buffer: Buffer, fileName = 'resume.docx'): Promise<string> {
  try {
    return await parseWithLlamaParse(buffer, fileName);
  } catch (err) {
    console.warn('[extractTextFromDOCX] LlamaParse failed, using mammoth:', err);
    const mammoth = await import('mammoth');
    const result = await mammoth.extractRawText({ buffer });
    return result.value ?? '';
  }
}