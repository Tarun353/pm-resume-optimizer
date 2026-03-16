/**
 * lib/resumeParser.ts — Multi-Model Parsing Fallback Infrastructure
 *
 * PDF parsing chain (6 steps):
 *   1. LlamaParse          – primary, best layout fidelity        (LLAMA_CLOUD_API_KEY)
 *   2. Gemini Flash Vision  – inline PDF base64, very accurate    (GEMINI_API_KEY)
 *   3. Mistral OCR          – dedicated OCR API, mistral-ocr-latest (MISTRAL_PARSE_KEY)
 *   4. Mistral Pixtral      – vision chat fallback                (MISTRAL_API_KEY)
 *   5. HuggingFace Vision   – free vision model                   (HF_TOKEN / HUGGINGFACE_API_KEY)
 *   6. pdf-parse            – local, zero network, always works   (no key needed)
 *
 * DOCX parsing chain (2 steps):
 *   1. LlamaParse           – primary                             (LLAMA_CLOUD_API_KEY)
 *   2. mammoth              – local, always available             (no key needed)
 *
 * AI structuring uses smartAICall (full fallback chain) for the JSON extraction step.
 *
 * Optional install for step 6:
 *   npm install pdf-parse
 *   npm install --save-dev @types/pdf-parse
 */

import { ResumeData, PersonalInfo, CareerStage } from './types';
import { smartAICall } from './aiClient';
import { parseWithLlamaParse } from './llamaParseClient';

// ─── Section order maps ───────────────────────────────────────────────────────

const PREFERRED_ORDERS: Record<CareerStage, string[]> = {
  experienced: [
    'summary', 'experience', 'internships', 'skills', 'education',
    'certifications', 'projects', 'awards', 'publications', 'softSkills',
  ],
  fresher: [
    'summary', 'education', 'internships', 'projects', 'skills',
    'experience', 'certifications', 'awards', 'publications', 'softSkills',
  ],
  'career-change': [
    'summary', 'skills', 'experience', 'internships', 'education',
    'projects', 'certifications', 'awards', 'publications', 'softSkills',
  ],
};

const ALL_KNOWN_SECTIONS = [
  'summary', 'experience', 'internships', 'education', 'skills',
  'projects', 'certifications', 'awards', 'publications', 'softSkills',
];

// ─── PDF Parsing Step 1: LlamaParse ──────────────────────────────────────────
// (implemented in llamaParseClient.ts — imported above)

// ─── PDF Parsing Step 2: Gemini Flash Vision ──────────────────────────────────

async function extractPDFWithGemini(buffer: Buffer): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not set');

  const base64 = buffer.toString('base64');
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [
          { inline_data: { mime_type: 'application/pdf', data: base64 } },
          {
            text: 'Extract ALL text from this resume PDF exactly as it appears. ' +
              'Preserve every section heading, bullet point, date, company name, ' +
              'job title, and detail. Output clean plain text with clear section ' +
              'breaks. Do NOT summarise, skip, or omit anything.',
          },
        ],
      }],
      generationConfig: { maxOutputTokens: 8192, temperature: 0 },
    }),
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText);
    throw Object.assign(new Error(`Gemini PDF OCR HTTP ${res.status}: ${msg}`), { status: res.status });
  }

  const data = (await res.json()) as any;
  const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  if (!text || text.length < 50) throw new Error('Gemini returned insufficient text for PDF');
  return text;
}

// ─── PDF Parsing Step 3: Mistral OCR API (dedicated, MISTRAL_PARSE_KEY) ──────

async function extractPDFWithMistralOCR(buffer: Buffer): Promise<string> {
  const apiKey = process.env.MISTRAL_PARSE_KEY;
  if (!apiKey) throw new Error('MISTRAL_PARSE_KEY not set');

  const base64 = buffer.toString('base64');

  const res = await fetch('https://api.mistral.ai/v1/ocr', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'mistral-ocr-latest',
      document: {
        type: 'document_url',
        // Mistral OCR accepts base64 PDF via data URI
        document_url: `data:application/pdf;base64,${base64}`,
      },
      include_image_base64: false,
    }),
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText);
    throw Object.assign(
      new Error(`Mistral OCR API HTTP ${res.status}: ${msg}`),
      { status: res.status },
    );
  }

  const data = (await res.json()) as any;

  // Response: { pages: [{ index, markdown, images, dimensions }] }
  const pages: any[] = data?.pages ?? [];
  if (!pages.length) throw new Error('Mistral OCR returned no pages');

  const text = pages
    .map((p) => p.markdown ?? p.text ?? '')
    .filter(Boolean)
    .join('\n\n');

  if (!text || text.length < 50) throw new Error('Mistral OCR returned insufficient text');
  return text;
}

// ─── PDF Parsing Step 4: Mistral Pixtral Vision (MISTRAL_API_KEY) ─────────────

async function extractPDFWithMistralVision(buffer: Buffer): Promise<string> {
  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) throw new Error('MISTRAL_API_KEY not set');

  const base64 = buffer.toString('base64');

  const res = await fetch('https://api.mistral.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'pixtral-12b-2409',
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: { url: `data:application/pdf;base64,${base64}` },
          },
          {
            type: 'text',
            text: 'Extract ALL text from this resume. Preserve all section headings, bullet points, dates, and structure. Output plain text only. Do not skip anything.',
          },
        ],
      }],
      max_tokens: 8192,
      temperature: 0,
    }),
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText);
    throw Object.assign(
      new Error(`Mistral Pixtral Vision HTTP ${res.status}: ${msg}`),
      { status: res.status },
    );
  }

  const data = (await res.json()) as any;
  const text: string = data?.choices?.[0]?.message?.content ?? '';
  if (!text || text.length < 50) throw new Error('Mistral Vision returned insufficient text');
  return text;
}

// ─── PDF Parsing Step 5: HuggingFace Vision ───────────────────────────────────

async function extractPDFWithHuggingFace(buffer: Buffer): Promise<string> {
  const apiKey = process.env.HF_TOKEN ?? process.env.HUGGINGFACE_API_KEY;
  if (!apiKey) throw new Error('HF_TOKEN / HUGGINGFACE_API_KEY not set');

  const base64 = buffer.toString('base64');

  // Qwen2-VL is HuggingFace's best free vision model for document understanding
  const model = 'Qwen/Qwen2-VL-7B-Instruct';
  const url = `https://api-inference.huggingface.co/models/${model}/v1/chat/completions`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: { url: `data:application/pdf;base64,${base64}` },
          },
          {
            type: 'text',
            text: 'Extract ALL text from this resume document. Preserve section headings, bullet points, dates, and all details. Output plain text only.',
          },
        ],
      }],
      max_tokens: 4096,
      temperature: 0.01,
      stream: false,
    }),
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText);
    throw Object.assign(
      new Error(`HuggingFace Vision HTTP ${res.status}: ${msg}`),
      { status: res.status },
    );
  }

  const data = (await res.json()) as any;
  const text: string = data?.choices?.[0]?.message?.content ?? '';
  if (!text || text.length < 50) throw new Error('HuggingFace Vision returned insufficient text');
  return text;
}

// ─── PDF Parsing Step 6: pdf-parse (local, no network) ───────────────────────

async function extractPDFLocal(buffer: Buffer): Promise<string> {
  try {
    const pdfParse = await import('pdf-parse').then((m) => (m.default ?? m) as any);
    const result = await pdfParse(buffer);
    const text: string = result?.text ?? '';
    if (!text || text.trim().length < 30) {
      throw new Error('pdf-parse returned insufficient text (possibly scanned/image-only PDF)');
    }
    return text;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('Cannot find module') || msg.includes('MODULE_NOT_FOUND')) {
      throw new Error('pdf-parse is not installed — run: npm install pdf-parse');
    }
    throw err;
  }
}

// ─── Main PDF extraction with full fallback chain ────────────────────────────

export async function extractTextFromPDF(
  buffer: Buffer,
  fileName = 'resume.pdf',
): Promise<string> {

  // ── Step 1: LlamaParse ───────────────────────────────────────────────────
  try {
    console.log('[parser] Step 1 — LlamaParse…');
    const text = await parseWithLlamaParse(buffer, fileName);
    if (text && text.trim().length > 50) {
      console.log('[parser] ✅ LlamaParse succeeded');
      return text;
    }
    throw new Error('LlamaParse returned insufficient text');
  } catch (err) {
    console.warn('[parser] ⚠️  LlamaParse failed:', (err as Error).message);
  }

  // ── Step 2: Gemini Flash Vision ──────────────────────────────────────────
  try {
    console.log('[parser] Step 2 — Gemini Flash Vision…');
    const text = await extractPDFWithGemini(buffer);
    if (text) {
      console.log('[parser] ✅ Gemini Vision succeeded');
      return text;
    }
  } catch (err) {
    console.warn('[parser] ⚠️  Gemini Vision failed:', (err as Error).message);
  }

  // ── Step 3: Mistral OCR API (dedicated) ─────────────────────────────────
  try {
    console.log('[parser] Step 3 — Mistral OCR (mistral-ocr-latest)…');
    const text = await extractPDFWithMistralOCR(buffer);
    if (text) {
      console.log('[parser] ✅ Mistral OCR succeeded');
      return text;
    }
  } catch (err) {
    console.warn('[parser] ⚠️  Mistral OCR failed:', (err as Error).message);
  }

  // ── Step 4: Mistral Pixtral Vision ──────────────────────────────────────
  try {
    console.log('[parser] Step 4 — Mistral Pixtral Vision…');
    const text = await extractPDFWithMistralVision(buffer);
    if (text) {
      console.log('[parser] ✅ Mistral Pixtral succeeded');
      return text;
    }
  } catch (err) {
    console.warn('[parser] ⚠️  Mistral Vision failed:', (err as Error).message);
  }

  // ── Step 5: HuggingFace Vision ──────────────────────────────────────────
  try {
    console.log('[parser] Step 5 — HuggingFace Vision…');
    const text = await extractPDFWithHuggingFace(buffer);
    if (text) {
      console.log('[parser] ✅ HuggingFace Vision succeeded');
      return text;
    }
  } catch (err) {
    console.warn('[parser] ⚠️  HuggingFace Vision failed:', (err as Error).message);
  }

  // ── Step 6: pdf-parse (local, no network) ───────────────────────────────
  try {
    console.log('[parser] Step 6 — local pdf-parse (last resort)…');
    const text = await extractPDFLocal(buffer);
    if (text) {
      console.log('[parser] ✅ pdf-parse (local) succeeded');
      return text;
    }
  } catch (err) {
    console.warn('[parser] ⚠️  pdf-parse failed:', (err as Error).message);
  }

  throw new Error(
    'All 6 PDF extraction methods failed. ' +
    'The PDF may be a scanned image with no parseable text. ' +
    'Ask the user to paste their resume text directly.',
  );
}

// ─── DOCX extraction with fallback chain ─────────────────────────────────────

export async function extractTextFromDOCX(
  buffer: Buffer,
  fileName = 'resume.docx',
): Promise<string> {

  // ── Step 1: LlamaParse ───────────────────────────────────────────────────
  try {
    console.log('[parser] DOCX Step 1 — LlamaParse…');
    const text = await parseWithLlamaParse(buffer, fileName);
    if (text && text.trim().length > 50) {
      console.log('[parser] ✅ LlamaParse DOCX succeeded');
      return text;
    }
    throw new Error('LlamaParse returned insufficient text for DOCX');
  } catch (err) {
    console.warn('[parser] ⚠️  LlamaParse DOCX failed:', (err as Error).message);
  }

  // ── Step 2: mammoth (local, always available) ────────────────────────────
  console.log('[parser] DOCX Step 2 — mammoth (local)…');
  const mammoth = await import('mammoth');
  const result = await mammoth.extractRawText({ buffer });
  const text = result?.value ?? '';
  if (!text || text.trim().length < 30) {
    throw new Error('mammoth returned insufficient text from DOCX');
  }
  console.log('[parser] ✅ mammoth DOCX succeeded');
  return text;
}

// ─── JSON safe parser ─────────────────────────────────────────────────────────

export function safeParseJSON<T>(raw: string, fallback: T): T {
  if (!raw || typeof raw !== 'string') return fallback;

  const strategies: Array<() => unknown> = [
    () => JSON.parse(raw),
    () => {
      const m = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
      return m ? JSON.parse(m[1]!) : undefined;
    },
    () => {
      const m = raw.match(/\{[\s\S]*\}/);
      return m ? JSON.parse(m[0]!) : undefined;
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

// ─── LLM structuring prompt ───────────────────────────────────────────────────

const STRUCTURE_SYSTEM = `You are a precise resume data extractor.
Extract ALL fields into JSON. Preserve EVERYTHING from the resume.

CRITICAL RULES:
1. Extract EVERY bullet point as a SEPARATE array item — never merge or combine
2. NEVER duplicate entries across experience[] and internships[]
3. If a job title contains "Intern", put it in internships[], NOT experience[]
4. Anything not matching known sections → additionalSections[] with EXACT heading

SECTION MAPPING:
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
- Everything else → additionalSections with EXACT heading

Return ONLY valid JSON. No markdown fences. No explanation.

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

// ─── Section helpers ──────────────────────────────────────────────────────────

function sectionHasContent(resume: Partial<ResumeData>, key: string): boolean {
  switch (key) {
    case 'summary':        return !!resume.summary?.trim();
    case 'experience':     return (resume.experience?.length ?? 0) > 0;
    case 'internships':    return (resume.internships?.length ?? 0) > 0;
    case 'education':      return (resume.education?.length ?? 0) > 0;
    case 'certifications': return (resume.certifications?.length ?? 0) > 0;
    case 'awards':         return (resume.awards?.length ?? 0) > 0;
    case 'publications':   return (resume.publications?.length ?? 0) > 0;
    case 'projects':       return (resume.projects?.length ?? 0) > 0;
    case 'skills':         return (resume.skills?.length ?? 0) > 0;
    case 'softSkills':     return (resume.softSkills?.length ?? 0) > 0;
    default:               return false;
  }
}

function buildProfessionalOrder(resume: Partial<ResumeData>, careerStage: CareerStage): string[] {
  const preferred = PREFERRED_ORDERS[careerStage];
  const order: string[] = [];
  const added = new Set<string>();

  for (const key of preferred) {
    if (sectionHasContent(resume, key)) { order.push(key); added.add(key); }
  }
  for (const key of ALL_KNOWN_SECTIONS) {
    if (!added.has(key) && sectionHasContent(resume, key)) { order.push(key); added.add(key); }
  }
  for (const addl of resume.additionalSections ?? []) {
    if (addl.heading?.trim()) order.push(`additional:${addl.heading}`);
  }

  return order;
}

// ─── Deduplication ────────────────────────────────────────────────────────────

function deduplicateEntries(resume: Partial<ResumeData>): Partial<ResumeData> {
  const exp = resume.experience ?? [];
  const int = resume.internships ?? [];
  if (!exp.length || !int.length) return resume;

  const dupes = new Set<number>();
  for (const intern of int) {
    if (!intern) continue;
    exp.forEach((job, j) => {
      if (!job) return;
      if (
        intern.title?.toLowerCase().trim() === job.title?.toLowerCase().trim() &&
        intern.company?.toLowerCase().trim() === job.company?.toLowerCase().trim()
      ) dupes.add(j);
    });
  }

  return { ...resume, experience: exp.filter((_, i) => !dupes.has(i)) };
}

// ─── Shape enforcer ───────────────────────────────────────────────────────────

function ensureResumeShape(raw: Partial<ResumeData>, careerStage: CareerStage): ResumeData {
  const deduped = deduplicateEntries(raw);
  const defaultPersonal: PersonalInfo = { name: '', email: '', phone: '', location: '', links: [] };

  const strArr = (arr: unknown[] | undefined) =>
    (arr ?? []).filter((s) => typeof s === 'string' && (s as string).trim());

  const resume: ResumeData = {
    personal: {
      ...defaultPersonal,
      ...(typeof deduped.personal === 'object' && deduped.personal ? deduped.personal : {}),
      links: Array.isArray(deduped.personal?.links) ? deduped.personal!.links : [],
    },
    summary: typeof deduped.summary === 'string' ? deduped.summary : '',

    experience: (deduped.experience ?? []).map((e) => ({
      title: e.title ?? '', company: e.company ?? '', location: e.location ?? '',
      startDate: e.startDate ?? '', endDate: e.endDate ?? '',
      bullets: strArr(e.bullets) as string[],
    })),

    education: (deduped.education ?? []).map((e) => ({
      degree: e.degree ?? '', institution: e.institution ?? '', location: e.location ?? '',
      startDate: e.startDate ?? '', endDate: e.endDate ?? '', gpa: e.gpa ?? '', notes: e.notes ?? '',
    })),

    certifications: (deduped.certifications ?? []).map((c) => ({
      name: c.name ?? '', issuer: c.issuer ?? '', date: c.date ?? '',
      credentialId: (c as any).credentialId ?? '',
    })),

    awards: (deduped.awards ?? []).map((a) => ({
      title: a.title ?? '', issuer: a.issuer ?? '', date: a.date ?? '', description: a.description ?? '',
    })),

    publications: (deduped.publications ?? []).map((p) => ({
      title: p.title ?? '', publisher: p.publisher ?? '', date: p.date ?? '',
      description: p.description ?? '', link: p.link ?? '',
    })),

    internships: (deduped.internships ?? []).map((e) => ({
      title: e.title ?? '', company: e.company ?? '', location: e.location ?? '',
      startDate: e.startDate ?? '', endDate: e.endDate ?? '',
      bullets: strArr(e.bullets) as string[],
    })),

    projects: (deduped.projects ?? []).map((p) => ({
      name: p.name ?? '', description: p.description ?? '',
      technologies: Array.isArray(p.technologies) ? p.technologies : [],
      bullets: strArr(p.bullets) as string[],
      link: p.link ?? '', startDate: p.startDate ?? '', endDate: p.endDate ?? '',
    })),

    skills:     strArr(deduped.skills)     as string[],
    softSkills: strArr(deduped.softSkills) as string[],

    additionalSections: (deduped.additionalSections ?? []).map((s) => ({
      heading:    s.heading    ?? '',
      rawContent: s.rawContent ?? '',
      items: strArr(s.items) as string[],
    })),

    sectionOrder: buildProfessionalOrder(deduped, careerStage),
  };

  console.log('[parser] Experience:', resume.experience.length,
    '| Internships:', resume.internships?.length ?? 0,
    '| Additional:', resume.additionalSections?.length ?? 0);
  console.log('[parser] Section order:', resume.sectionOrder);

  return resume;
}

// ─── AI structurer (uses full smartAICall fallback chain) ─────────────────────

async function structureWithAI(markdown: string, careerStage: CareerStage): Promise<ResumeData> {
  const truncated = markdown.length > 25_000
    ? markdown.substring(0, 20_000) + '\n\n[...truncated...]\n\n' + markdown.substring(markdown.length - 3_000)
    : markdown;

  const raw = await smartAICall(
    STRUCTURE_SYSTEM,
    `Extract resume data. Preserve EVERY section and EVERY bullet point as separate array items.\n\nResume:\n\n${truncated}`,
    8000,
    0.1,
  );

  const parsed = safeParseJSON<Partial<ResumeData>>(raw, {});
  return ensureResumeShape(parsed, careerStage);
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function parseResumeText(rawText: string, careerStage: CareerStage): Promise<ResumeData> {
  return structureWithAI(rawText, careerStage);
}
