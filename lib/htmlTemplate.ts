/**
 * htmlTemplate.ts
 *
 * ROOT CAUSE OF MISSING SECTIONS IN PDF:
 * The previous template hardcoded exactly 6 sections in a fixed order:
 *   summary → experience → education → skills → projects
 * Any section not in that list (certifications, awards, internships, etc.)
 * was simply never rendered, even if the data existed in the model.
 *
 * FIX:
 * - Template is now driven by resume.sectionOrder — the list of section keys
 *   written by the parser in the order they appeared in the source document.
 * - Every section type has a dedicated renderer.
 * - additionalSections are rendered as generic bullet lists.
 * - No section is ever skipped unless it is genuinely empty.
 */

import {
  ResumeData,
  ExperienceEntry,
  EducationEntry,
  CertificationEntry,
  AwardEntry,
  PublicationEntry,
  InternshipEntry,
  ProjectEntry,
  AdditionalSection,
} from './types';

// ─── HTML escape ──────────────────────────────────────────────────────────────
function esc(s: string | undefined | null): string {
  if (!s) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function safe(s: string | undefined | null): string {
  return esc(s ?? '');
}

// ─── Section wrapper ──────────────────────────────────────────────────────────
function section(title: string, body: string): string {
  if (!body.trim()) return '';
  return `
<section class="rs">
  <h2 class="sh">${esc(title)}</h2>
  <div class="sd"></div>
  ${body}
</section>`;
}

// ─── Date range helper ────────────────────────────────────────────────────────
function dateRange(start?: string, end?: string): string {
  if (!start && !end) return '';
  if (start && end) return `${esc(start)} – ${esc(end)}`;
  return esc(start || end);
}

// ─── Bullet list ──────────────────────────────────────────────────────────────
function bullets(items: string[]): string {
  if (!items || items.length === 0) return '';
  return `<ul class="bl">${items.filter(b => b?.trim()).map(b => `<li>${esc(b)}</li>`).join('')}</ul>`;
}

// ─── Experience ───────────────────────────────────────────────────────────────
function renderExperience(entries: ExperienceEntry[]): string {
  if (!entries?.length) return '';
  return entries.map(e => `
  <div class="ent">
    <div class="eh">
      <div class="el">
        <span class="et">${safe(e.title)}</span>
        ${e.company ? `<span class="ec">${safe(e.company)}${e.location ? ` · ${safe(e.location)}` : ''}</span>` : ''}
      </div>
      ${dateRange(e.startDate, e.endDate) ? `<span class="ed">${dateRange(e.startDate, e.endDate)}</span>` : ''}
    </div>
    ${bullets(e.bullets)}
  </div>`).join('');
}

// ─── Internships (same layout as experience) ──────────────────────────────────
function renderInternships(entries: InternshipEntry[]): string {
  if (!entries?.length) return '';
  return entries.map(e => `
  <div class="ent">
    <div class="eh">
      <div class="el">
        <span class="et">${safe(e.title)}</span>
        ${e.company ? `<span class="ec">${safe(e.company)}${e.location ? ` · ${safe(e.location)}` : ''}</span>` : ''}
      </div>
      ${dateRange(e.startDate, e.endDate) ? `<span class="ed">${dateRange(e.startDate, e.endDate)}</span>` : ''}
    </div>
    ${bullets(e.bullets)}
  </div>`).join('');
}

// ─── Education ────────────────────────────────────────────────────────────────
function renderEducation(entries: EducationEntry[]): string {
  if (!entries?.length) return '';
  return entries.map(e => `
  <div class="ent">
    <div class="eh">
      <div class="el">
        <span class="et">${safe(e.degree)}</span>
        ${e.institution ? `<span class="ec">${safe(e.institution)}${e.location ? ` · ${safe(e.location)}` : ''}</span>` : ''}
        ${e.gpa ? `<span class="egpa">GPA: ${safe(e.gpa)}</span>` : ''}
        ${e.notes ? `<span class="enotes">${safe(e.notes)}</span>` : ''}
      </div>
      ${dateRange(e.startDate, e.endDate) ? `<span class="ed">${dateRange(e.startDate, e.endDate)}</span>` : ''}
    </div>
  </div>`).join('');
}

// ─── Certifications ───────────────────────────────────────────────────────────
function renderCertifications(entries: CertificationEntry[]): string {
  if (!entries?.length) return '';
  return `<div class="cert-grid">${entries.map(c => `
  <div class="cert-item">
    <span class="cert-name">${safe(c.name)}</span>
    ${c.issuer ? `<span class="cert-issuer">${safe(c.issuer)}</span>` : ''}
    ${c.date ? `<span class="cert-date">${safe(c.date)}</span>` : ''}
  </div>`).join('')}</div>`;
}

// ─── Awards ───────────────────────────────────────────────────────────────────
function renderAwards(entries: AwardEntry[]): string {
  if (!entries?.length) return '';
  return entries.map(a => `
  <div class="ent ent-compact">
    <div class="eh">
      <div class="el">
        <span class="et">${safe(a.title)}</span>
        ${a.issuer ? `<span class="ec">${safe(a.issuer)}</span>` : ''}
        ${a.description ? `<span class="enotes">${safe(a.description)}</span>` : ''}
      </div>
      ${a.date ? `<span class="ed">${safe(a.date)}</span>` : ''}
    </div>
  </div>`).join('');
}

// ─── Publications ─────────────────────────────────────────────────────────────
function renderPublications(entries: PublicationEntry[]): string {
  if (!entries?.length) return '';
  return entries.map(p => `
  <div class="ent ent-compact">
    <div class="eh">
      <div class="el">
        <span class="et">${safe(p.title)}</span>
        ${p.publisher ? `<span class="ec">${safe(p.publisher)}</span>` : ''}
        ${p.description ? `<span class="enotes">${safe(p.description)}</span>` : ''}
        ${p.link ? `<a class="elink" href="${safe(p.link)}">${safe(p.link)}</a>` : ''}
      </div>
      ${p.date ? `<span class="ed">${safe(p.date)}</span>` : ''}
    </div>
  </div>`).join('');
}

// ─── Projects ─────────────────────────────────────────────────────────────────
function renderProjects(entries: ProjectEntry[]): string {
  if (!entries?.length) return '';
  return entries.map(p => `
  <div class="ent">
    <div class="eh">
      <div class="el">
        <span class="et">${safe(p.name)}</span>
        ${p.link ? `<a class="elink" href="${safe(p.link)}">${safe(p.link)}</a>` : ''}
        ${p.technologies?.length ? `<span class="etech">${p.technologies.map(t => safe(t)).join(' · ')}</span>` : ''}
      </div>
      ${dateRange(p.startDate, p.endDate) ? `<span class="ed">${dateRange(p.startDate, p.endDate)}</span>` : ''}
    </div>
    ${p.description ? `<p class="edesc">${safe(p.description)}</p>` : ''}
    ${bullets(p.bullets)}
  </div>`).join('');
}

// ─── Skills ───────────────────────────────────────────────────────────────────
function renderSkills(skills: string[]): string {
  if (!skills?.length) return '';
  return `<div class="skills-wrap">${skills.map(s => `<span class="skill-tag">${safe(s)}</span>`).join('')}</div>`;
}

// ─── Additional (catch-all) ───────────────────────────────────────────────────
function renderAdditional(sec: AdditionalSection): string {
  if (!sec.items?.length && !sec.rawContent?.trim()) return '';
  // Prefer structured items list; fall back to raw
  if (sec.items?.length) {
    return bullets(sec.items);
  }
  return `<p class="edesc">${safe(sec.rawContent)}</p>`;
}

// ─── Contact line ─────────────────────────────────────────────────────────────
function renderContactLine(resume: ResumeData): string {
  const p = resume.personal;
  const parts: string[] = [];
  if (p.email) parts.push(`<a class="cl" href="mailto:${safe(p.email)}">${safe(p.email)}</a>`);
  if (p.phone) parts.push(`<span>${safe(p.phone)}</span>`);
  if (p.location) parts.push(`<span>${safe(p.location)}</span>`);
  if (p.links?.length) {
    p.links.slice(0, 3).forEach(l => {
      const display = l.replace(/^https?:\/\/(www\.)?/, '');
      parts.push(`<a class="cl" href="${safe(l)}">${safe(display)}</a>`);
    });
  }
  return parts.join('<span class="sep">·</span>');
}

// ─── Section title lookup ─────────────────────────────────────────────────────
const SECTION_TITLES: Record<string, string> = {
  summary:        'Professional Summary',
  experience:     'Experience',
  education:      'Education',
  certifications: 'Certifications',
  awards:         'Awards & Honors',
  publications:   'Publications',
  internships:    'Internships',
  projects:       'Projects',
  skills:         'Technical Skills',
  softSkills:     'Core Competencies',
};

// ─── Main HTML generator ──────────────────────────────────────────────────────
export function generateResumeHTML(resume: ResumeData): string {
  const personal = resume.personal ?? {
    name: '', email: '', phone: '', location: '', links: [],
  };

  // Build sections in the order they appeared in the original resume
  const sectionOrder = resume.sectionOrder?.length
    ? resume.sectionOrder
    : ['summary', 'experience', 'internships', 'education', 'certifications',
       'awards', 'publications', 'projects', 'skills', 'softSkills'];

  const renderedSections: string[] = [];

  for (const key of sectionOrder) {
    if (key.startsWith('additional:')) {
      const heading = key.replace(/^additional:/, '');
      const addl = resume.additionalSections?.find(
        s => s.heading.trim() === heading.trim()
      );
      if (addl) {
        const body = renderAdditional(addl);
        if (body) renderedSections.push(section(addl.heading, body));
      }
      continue;
    }

    switch (key) {
      case 'summary':
        if (resume.summary?.trim()) {
          renderedSections.push(section('Professional Summary',
            `<p class="sumtext">${safe(resume.summary)}</p>`));
        }
        break;
      case 'experience': {
        const body = renderExperience(resume.experience ?? []);
        if (body) renderedSections.push(section('Experience', body));
        break;
      }
      case 'internships': {
        const body = renderInternships(resume.internships ?? []);
        if (body) renderedSections.push(section('Internships', body));
        break;
      }
      case 'education': {
        const body = renderEducation(resume.education ?? []);
        if (body) renderedSections.push(section('Education', body));
        break;
      }
      case 'certifications': {
        const body = renderCertifications(resume.certifications ?? []);
        if (body) renderedSections.push(section('Certifications', body));
        break;
      }
      case 'awards': {
        const body = renderAwards(resume.awards ?? []);
        if (body) renderedSections.push(section('Awards & Honors', body));
        break;
      }
      case 'publications': {
        const body = renderPublications(resume.publications ?? []);
        if (body) renderedSections.push(section('Publications', body));
        break;
      }
      case 'projects': {
        const body = renderProjects(resume.projects ?? []);
        if (body) renderedSections.push(section('Projects', body));
        break;
      }
      case 'skills': {
        const body = renderSkills(resume.skills ?? []);
        if (body) renderedSections.push(section('Technical Skills', body));
        break;
      }
      case 'softSkills': {
        const body = renderSkills(resume.softSkills ?? []);
        if (body) renderedSections.push(section('Core Competencies', body));
        break;
      }
      default:
        break;
    }
  }

  // Render any additionalSections NOT already in sectionOrder (safety net)
  for (const addl of resume.additionalSections ?? []) {
    const addlKey = `additional:${addl.heading.trim()}`;
    if (!sectionOrder.includes(addlKey)) {
      const body = renderAdditional(addl);
      if (body) renderedSections.push(section(addl.heading, body));
    }
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${safe(personal.name || 'Resume')}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  html{font-size:11.5px}
  body{
    font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
    font-size:1rem;line-height:1.5;color:#1e293b;background:#fff;
    -webkit-print-color-adjust:exact;print-color-adjust:exact
  }
  a{color:#2563eb;text-decoration:none}
  .page{
    width:210mm;min-height:297mm;
    margin:0 auto;padding:11mm 13mm 11mm 13mm;
    background:#fff
  }

  /* Header */
  .rh{margin-bottom:10px;padding-bottom:8px;border-bottom:2.5px solid #2563eb}
  .rn{font-size:2rem;font-weight:700;letter-spacing:-.025em;color:#0f172a;line-height:1.1;margin-bottom:4px}
  .rc{display:flex;flex-wrap:wrap;align-items:center;gap:3px 0;font-size:.88rem;color:#64748b}
  .cl{color:#2563eb}
  .sep{color:#cbd5e1;margin:0 5px}

  /* Sections */
  .rs{margin-top:10px;page-break-inside:avoid}
  .sh{
    font-size:.82rem;font-weight:700;letter-spacing:.09em;
    text-transform:uppercase;color:#2563eb;margin-bottom:3px
  }
  .sd{height:1px;background:#e2e8f0;margin-bottom:6px}

  /* Entries */
  .ent{margin-bottom:8px;page-break-inside:avoid}
  .ent:last-child{margin-bottom:0}
  .ent-compact{margin-bottom:5px}
  .eh{display:flex;justify-content:space-between;align-items:flex-start;gap:8px;margin-bottom:2px}
  .el{display:flex;flex-direction:column;gap:1px;flex:1;min-width:0}
  .et{font-weight:600;font-size:.95rem;color:#0f172a}
  .ec{font-size:.87rem;color:#475569;font-style:italic}
  .egpa{font-size:.83rem;color:#64748b}
  .enotes{font-size:.83rem;color:#64748b}
  .ed{font-size:.83rem;color:#64748b;white-space:nowrap;flex-shrink:0;padding-top:1px}
  .etech{font-size:.8rem;color:#2563eb;font-weight:500;margin:2px 0}
  .edesc{font-size:.88rem;color:#475569;line-height:1.5;margin:2px 0}
  .elink{font-size:.8rem;color:#2563eb}
  .sumtext{font-size:.93rem;line-height:1.65;color:#334155}

  /* Bullets */
  .bl{margin:0;padding-left:13px;list-style:disc}
  .bl li{font-size:.9rem;line-height:1.55;color:#334155;margin-bottom:2px;padding-left:1px}
  .bl li:last-child{margin-bottom:0}

  /* Certifications grid */
  .cert-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:4px 12px}
  .cert-item{display:flex;flex-direction:column}
  .cert-name{font-size:.9rem;font-weight:500;color:#0f172a}
  .cert-issuer{font-size:.82rem;color:#64748b;font-style:italic}
  .cert-date{font-size:.78rem;color:#94a3b8}

  /* Skills */
  .skills-wrap{display:flex;flex-wrap:wrap;gap:4px}
  .skill-tag{
    background:#eff6ff;border:1px solid #bfdbfe;
    color:#1d4ed8;font-size:.8rem;font-weight:500;
    padding:2px 7px;border-radius:3px;white-space:nowrap
  }

  /* Print */
  @page{size:A4;margin:0}
  @media print{
    .page{width:100%;padding:10mm 12mm;margin:0}
    body{font-size:11px}
    .rs{page-break-inside:avoid}
    .ent{page-break-inside:avoid}
  }
</style>
</head>
<body>
<div class="page">
  <header class="rh">
    <h1 class="rn">${safe(personal.name || 'Your Name')}</h1>
    <div class="rc">${renderContactLine(resume)}</div>
  </header>
  ${renderedSections.join('\n')}
</div>
</body>
</html>`;
}
