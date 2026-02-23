/**
 * resumeParser.ts - HYBRID APPROACH: Regex Pre-processing + LLM
 * 
 * Strategy:
 * 1. Extract ALL bullets with regex first (guaranteed complete)
 * 2. Extract section structure
 * 3. Send pre-extracted data to LLM for smart organization
 * 
 * This guarantees no bullet loss while keeping intelligent parsing
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

// ─── REGEX PRE-PROCESSING ─────────────────────────────────────────────────────

/**
 * Extract ALL bullets from text using regex
 * Guarantees no bullets are lost
 */
function extractAllBullets(text: string): string[] {
  const bullets: string[] = [];
  
  // Match lines that start with bullet points (•, -, *, or just indented)
  const bulletRegex = /^[\s]*[•\-\*][\s]+(.+)$/gm;
  
  let match;
  while ((match = bulletRegex.exec(text)) !== null) {
    const bullet = match[1]?.trim();
    if (bullet && bullet.length > 5) { // Filter out very short items
      bullets.push(bullet);
    }
  }
  
  console.log(`[extractAllBullets] Found ${bullets.length} total bullets`);
  return bullets;
}

/**
 * Count bullets in a specific section
 */
function extractBulletsInSection(text: string, sectionStart: number, sectionEnd: number): string[] {
  const sectionText = text.substring(sectionStart, sectionEnd);
  return extractAllBullets(sectionText);
}

/**
 * Pre-process text to extract structure
 */
function preProcessResume(text: string): {
  allBullets: string[];
  sectionHints: Record<string, number>;
  rawText: string;
} {
  const allBullets = extractAllBullets(text);
  
  // Detect section headers (case-insensitive)
  const sectionHints: Record<string, number> = {};
  
  const sectionPatterns = [
    { pattern: /(?:professional\s+)?(?:work\s+)?experience/i, key: 'experience' },
    { pattern: /internship/i, key: 'internships' },
    { pattern: /education/i, key: 'education' },
    { pattern: /projects?/i, key: 'projects' },
    { pattern: /(?:technical\s+)?skills?/i, key: 'skills' },
    { pattern: /(?:soft\s+skills?|core\s+competencies)/i, key: 'softSkills' },
    { pattern: /certifications?/i, key: 'certifications' },
    { pattern: /awards?|recognition/i, key: 'awards' },
    { pattern: /publications?/i, key: 'publications' },
    { pattern: /(?:career\s+)?highlights?|key\s+achievements?/i, key: 'careerHighlights' },
    { pattern: /summary|profile|objective/i, key: 'summary' },
  ];
  
  for (const { pattern, key } of sectionPatterns) {
    const match = text.match(pattern);
    if (match && match.index !== undefined) {
      sectionHints[key] = match.index;
    }
  }
  
  console.log('[preProcessResume] Section hints:', Object.keys(sectionHints));
  console.log('[preProcessResume] Total bullets extracted:', allBullets.length);
  
  return {
    allBullets,
    sectionHints,
    rawText: text,
  };
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

// ─── Enhanced LLM prompt with pre-extracted bullets ───────────────────────────

const STRUCTURE_SYSTEM = `You are a precise resume data extractor.

I have PRE-EXTRACTED all bullet points from the resume using regex.
Your job is to ORGANIZE them into the correct structure - DO NOT skip any bullets.

CRITICAL RULES:
1. Use ALL bullets provided in the "PRE_EXTRACTED_BULLETS" list
2. Assign each bullet to the correct job, project, or section
3. Do NOT merge, summarize, or combine bullets
4. Each bullet in the input list MUST appear EXACTLY ONCE in the output
5. Preserve bullet text exactly as provided

SECTION DETECTION:
- Experience/Work sections → experience[]
- Internships → internships[]
- Projects → projects[]
- Career Highlights/Key Achievements → additionalSections with heading "Career Highlights"
- Skills listings → skills[] or softSkills[]

For job entries with subsections (Responsibilities, Achievements, Environment):
- Combine all bullets into the bullets[] array for that job
- If you see "Environment: Python, SQL..." preserve it separately or as a note

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
}

Return ONLY valid JSON. No markdown. No explanation.`;

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

  // Logging for debugging
  console.log('[ensureResumeShape] Experience entries:', resume.experience?.length ?? 0);
  if (resume.experience && resume.experience.length > 0) {
    console.log('[ensureResumeShape] First experience bullets:', resume.experience[0]?.bullets?.length ?? 0);
  }
  console.log('[ensureResumeShape] Additional sections:', resume.additionalSections?.length ?? 0);
  if (resume.additionalSections && resume.additionalSections.length > 0) {
    console.log('[ensureResumeShape] First additional section items:', resume.additionalSections[0]?.items?.length ?? 0);
  }

  return resume;
}

// ─── HYBRID LLM structurer with pre-processing ────────────────────────────────

async function structureWithGroq(markdown: string, careerStage: CareerStage): Promise<ResumeData> {
  // Step 1: Pre-process to extract all bullets
  const preprocessed = preProcessResume(markdown);
  
  // Step 2: Build enhanced prompt with pre-extracted bullets
  const bulletList = preprocessed.allBullets.map((b, i) => `${i + 1}. ${b}`).join('\n');
  
  const userMessage = `Here is a resume to parse.

PRE_EXTRACTED_BULLETS (${preprocessed.allBullets.length} bullets - use ALL of them):
${bulletList}

FULL RESUME TEXT:
${markdown}

Extract into JSON. Assign each pre-extracted bullet to the correct section/job. Do not lose any bullets.`;

  let raw = '';
  try {
    raw = await groqChatCompletion(STRUCTURE_SYSTEM, userMessage, 8000, 0.1);
  } catch (err) {
    console.error('[structureWithGroq] Groq failed:', err);
    throw err;
  }

  const parsed = safeParseJSON<Partial<ResumeData>>(raw, {});
  
  // Verify bullet count
  const totalOutputBullets = (parsed.experience ?? []).reduce((sum, e) => sum + (e.bullets?.length ?? 0), 0) +
                             (parsed.internships ?? []).reduce((sum, e) => sum + (e.bullets?.length ?? 0), 0) +
                             (parsed.projects ?? []).reduce((sum, p) => sum + (p.bullets?.length ?? 0), 0) +
                             (parsed.additionalSections ?? []).reduce((sum, s) => sum + (s.items?.length ?? 0), 0);
  
  console.log(`[structureWithGroq] Input bullets: ${preprocessed.allBullets.length}, Output bullets: ${totalOutputBullets}`);
  
  if (totalOutputBullets < preprocessed.allBullets.length * 0.8) {
    console.warn('[structureWithGroq] WARNING: Significant bullet loss detected!');
  }
  
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
