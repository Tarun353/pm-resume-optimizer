/**
 * resumeParser.ts
 *
 * PIPELINE:
 *  LlamaParse → clean Markdown → Groq structurer → ResumeData JSON
 */

import { ResumeData, PersonalInfo } from './types';
import { groqChatCompletion } from './groqClient';
import { parseWithLlamaParse } from './llamaParseClient';

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

// ─── Groq structuring prompt ──────────────────────────────────────────────────

const STRUCTURE_SYSTEM = `You are a precise resume data extractor.
You will receive resume text (usually Markdown with ## headings).
Extract ALL fields into the JSON format below.

CRITICAL RULES:
- Extract EVERY section in the EXACT ORDER it appears in the resume
- sectionOrder is MANDATORY and MUST list sections in their original document order
- If a section doesn't match a known type, use "additional:EXACT_HEADING_TEXT"
- Never skip sections, never reorder sections
- If a field is absent use "" for strings and [] for arrays
- Preserve original wording during extraction
- Each bullet point must be a separate string in bullets[]

SECTION KEY NAMES (use these exact strings):
- "summary" → for Summary, Professional Summary, Profile, Objective, About, Overview
- "experience" → for Experience, Work Experience, Professional Experience, Employment
- "internships" → for Internships, Internship Experience
- "education" → for Education, Academic Background
- "certifications" → for Certifications, Licenses
- "awards" → for Awards, Honors, Achievements
- "publications" → for Publications, Research, Papers
- "projects" → for Projects, Personal Projects
- "skills" → for Skills, Technical Skills, Technologies
- "softSkills" → for Soft Skills, Core Competencies, Professional Skills
- "additional:Career Highlights" → for Career Highlights (example of custom section)
- "additional:Volunteer" → for Volunteer, Volunteering
- "additional:Languages" → for Languages, Languages Spoken
- etc. (any heading not listed above uses "additional:HEADING_NAME")

EXAMPLE sectionOrder:
If the resume has sections in this order:
  1. Summary
  2. Career Highlights
  3. Experience
  4. Education
  5. Skills

Then sectionOrder MUST be:
["summary", "additional:Career Highlights", "experience", "education", "skills"]

Return ONLY valid JSON. No markdown fences. No explanation.

EXACT OUTPUT SHAPE:
{
  "personal": { "name": "", "email": "", "phone": "", "location": "", "links": [] },
  "summary": "",
  "experience": [{
    "title": "", "company": "", "location": "", "startDate": "", "endDate": "", "bullets": []
  }],
  "education": [{
    "degree": "", "institution": "", "location": "", "startDate": "", "endDate": "", "gpa": "", "notes": ""
  }],
  "certifications": [{ "name": "", "issuer": "", "date": "", "credentialId": "" }],
  "awards": [{ "title": "", "issuer": "", "date": "", "description": "" }],
  "publications": [{ "title": "", "publisher": "", "date": "", "description": "", "link": "" }],
  "internships": [{
    "title": "", "company": "", "location": "", "startDate": "", "endDate": "", "bullets": []
  }],
  "projects": [{
    "name": "", "description": "", "technologies": [], "bullets": [], "link": "", "startDate": "", "endDate": ""
  }],
  "skills": [],
  "softSkills": [],
  "additionalSections": [{ "heading": "", "rawContent": "", "items": [] }],
  "sectionOrder": []
}`;

// ─── Defensive shape enforcer ─────────────────────────────────────────────────

function ensureResumeShape(raw: Partial<ResumeData>): ResumeData {
  const defaultPersonal: PersonalInfo = {
    name: '', email: '', phone: '', location: '', links: [],
  };

  const resume: ResumeData = {
    personal: {
      ...defaultPersonal,
      ...(typeof raw.personal === 'object' && raw.personal ? raw.personal : {}),
      links: Array.isArray(raw.personal?.links) ? raw.personal.links : [],
    },
    summary:  typeof raw.summary === 'string' ? raw.summary : '',

    experience: Array.isArray(raw.experience) ? raw.experience.map(e => ({
      title: e.title ?? '', company: e.company ?? '', location: e.location ?? '',
      startDate: e.startDate ?? '', endDate: e.endDate ?? '',
      bullets: Array.isArray(e.bullets) ? e.bullets.filter(b => typeof b === 'string' && b.trim()) : [],
    })) : [],

    education: Array.isArray(raw.education) ? raw.education.map(e => ({
      degree: e.degree ?? '', institution: e.institution ?? '', location: e.location ?? '',
      startDate: e.startDate ?? '', endDate: e.endDate ?? '',
      gpa: e.gpa ?? '', notes: e.notes ?? '',
    })) : [],

    certifications: Array.isArray(raw.certifications) ? raw.certifications.map(c => ({
      name: c.name ?? '', issuer: c.issuer ?? '', date: c.date ?? '', credentialId: c.credentialId ?? '',
    })) : [],

    awards: Array.isArray(raw.awards) ? raw.awards.map(a => ({
      title: a.title ?? '', issuer: a.issuer ?? '', date: a.date ?? '', description: a.description ?? '',
    })) : [],

    publications: Array.isArray(raw.publications) ? raw.publications.map(p => ({
      title: p.title ?? '', publisher: p.publisher ?? '', date: p.date ?? '',
      description: p.description ?? '', link: p.link ?? '',
    })) : [],

    internships: Array.isArray(raw.internships) ? raw.internships.map(e => ({
      title: e.title ?? '', company: e.company ?? '', location: e.location ?? '',
      startDate: e.startDate ?? '', endDate: e.endDate ?? '',
      bullets: Array.isArray(e.bullets) ? e.bullets.filter(b => typeof b === 'string' && b.trim()) : [],
    })) : [],

    projects: Array.isArray(raw.projects) ? raw.projects.map(p => ({
      name: p.name ?? '', description: p.description ?? '',
      technologies: Array.isArray(p.technologies) ? p.technologies : [],
      bullets: Array.isArray(p.bullets) ? p.bullets.filter(b => typeof b === 'string' && b.trim()) : [],
      link: p.link ?? '', startDate: p.startDate ?? '', endDate: p.endDate ?? '',
    })) : [],

    skills:     Array.isArray(raw.skills)     ? raw.skills.filter(s => typeof s === 'string' && s.trim())     : [],
    softSkills: Array.isArray(raw.softSkills) ? raw.softSkills.filter(s => typeof s === 'string' && s.trim()) : [],

    additionalSections: Array.isArray(raw.additionalSections) ? raw.additionalSections.map(s => ({
      heading:    s.heading    ?? '',
      rawContent: s.rawContent ?? '',
      items: Array.isArray(s.items) ? s.items.filter(i => typeof i === 'string' && i.trim()) : [],
    })) : [],

    sectionOrder: Array.isArray(raw.sectionOrder) && raw.sectionOrder.length > 0
      ? raw.sectionOrder
      : buildDefaultOrder(raw),
  };

  console.log('[ensureResumeShape] sectionOrder:', resume.sectionOrder);
  return resume;
}

function buildDefaultOrder(raw: Partial<ResumeData>): string[] {
  console.warn('[buildDefaultOrder] Using fallback section order — LLM did not provide sectionOrder');
  const order: string[] = [];
  if (raw.summary) order.push('summary');
  if (Array.isArray(raw.experience)      && raw.experience.length)      order.push('experience');
  if (Array.isArray(raw.internships)     && raw.internships.length)     order.push('internships');
  if (Array.isArray(raw.education)       && raw.education.length)       order.push('education');
  if (Array.isArray(raw.certifications)  && raw.certifications.length)  order.push('certifications');
  if (Array.isArray(raw.awards)          && raw.awards.length)          order.push('awards');
  if (Array.isArray(raw.publications)    && raw.publications.length)    order.push('publications');
  if (Array.isArray(raw.projects)        && raw.projects.length)        order.push('projects');
  if (Array.isArray(raw.skills)          && raw.skills.length)          order.push('skills');
  if (Array.isArray(raw.softSkills)      && raw.softSkills.length)      order.push('softSkills');
  for (const s of raw.additionalSections ?? []) {
    if (s.heading) order.push(`additional:${s.heading}`);
  }
  return order;
}

// ─── LLM structurer: Markdown → ResumeData ───────────────────────────────────

async function structureWithGroq(markdown: string): Promise<ResumeData> {
  const truncated = markdown.length > 14000
    ? markdown.substring(0, 12000) + '\n\n[...content truncated...]\n\n' + markdown.substring(markdown.length - 1500)
    : markdown;

  const userMessage = `Extract all resume data into JSON. PAY CLOSE ATTENTION TO SECTION ORDER.\n\nResume text:\n\n${truncated}`;

  let raw = '';
  try {
    raw = await groqChatCompletion(STRUCTURE_SYSTEM, userMessage, 6000, 0.1);
  } catch (err) {
    console.error('[structureWithGroq] Groq call failed:', err);
    throw err;
  }

  const parsed = safeParseJSON<Partial<ResumeData>>(raw, {});
  return ensureResumeShape(parsed);
}

// ─── Public: parse text (pasted input) ───────────────────────────────────────

export async function parseResumeText(rawText: string): Promise<ResumeData> {
  return structureWithGroq(rawText);
}

// ─── Public: parse PDF via LlamaParse ────────────────────────────────────────

export async function extractTextFromPDF(buffer: Buffer, fileName = 'resume.pdf'): Promise<string> {
  return parseWithLlamaParse(buffer, fileName);
}

// ─── Public: parse DOCX ───────────────────────────────────────────────────────

export async function extractTextFromDOCX(buffer: Buffer, fileName = 'resume.docx'): Promise<string> {
  try {
    return await parseWithLlamaParse(buffer, fileName);
  } catch (err) {
    console.warn('[extractTextFromDOCX] LlamaParse failed, falling back to mammoth:', err);
    const mammoth = await import('mammoth');
    const result = await mammoth.extractRawText({ buffer });
    return result.value ?? '';
  }
}
