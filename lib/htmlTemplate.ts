/**
 * htmlTemplate.ts - COMPACT PROFESSIONAL TEMPLATE
 * 
 * ✨ Optimized for 1-2 pages:
 * - Smaller fonts (1pt reduced)
 * - Tighter line-height
 * - Compact spacing
 * - Maximum content density
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
  if (!s) return '';
  return esc(String(s).trim().replace(/\s+/g, ' '));
}

// ─── Section wrapper ──────────────────────────────────────────────────────────
function section(title: string, body: string): string {
  if (!body.trim()) return '';
  return `
<section class="section">
  <h2 class="section-title">${esc(title)}</h2>
  ${body}
</section>`;
}

// ─── Date range ───────────────────────────────────────────────────────────────
function dateRange(start?: string, end?: string): string {
  if (!start && !end) return '';
  if (start && end) return `${esc(start)} – ${esc(end)}`;
  return esc(start || end);
}

// ─── Bullet list ──────────────────────────────────────────────────────────────
function bullets(items: string[]): string {
  if (!items || items.length === 0) return '';
  return `<ul class="bullet-list">${items.filter(b => b?.trim()).map(b => `<li>${esc(b)}</li>`).join('')}</ul>`;
}

// ─── Experience ───────────────────────────────────────────────────────────────
function renderExperience(entries: ExperienceEntry[]): string {
  if (!entries?.length) return '';
  return entries.map(e => `
  <div class="entry">
    <div class="entry-header">
      <div class="entry-left">
        <div class="entry-title">${safe(e.title)}</div>
        <div class="entry-org">${safe(e.company)}${e.location ? ` · ${safe(e.location)}` : ''}</div>
      </div>
      <div class="entry-date">${dateRange(e.startDate, e.endDate)}</div>
    </div>
    ${bullets(e.bullets)}
  </div>`).join('');
}

// ─── Internships ──────────────────────────────────────────────────────────────
function renderInternships(entries: InternshipEntry[]): string {
  if (!entries?.length) return '';
  return entries.map(e => `
  <div class="entry">
    <div class="entry-header">
      <div class="entry-left">
        <div class="entry-title">${safe(e.title)}</div>
        <div class="entry-org">${safe(e.company)}${e.location ? ` · ${safe(e.location)}` : ''}</div>
      </div>
      <div class="entry-date">${dateRange(e.startDate, e.endDate)}</div>
    </div>
    ${bullets(e.bullets)}
  </div>`).join('');
}

// ─── Education ────────────────────────────────────────────────────────────────
function renderEducation(entries: EducationEntry[]): string {
  if (!entries?.length) return '';
  return entries.map(e => `
  <div class="entry">
    <div class="entry-header">
      <div class="entry-left">
        <div class="entry-title">${safe(e.degree)}</div>
        <div class="entry-org">${safe(e.institution)}${e.location ? ` · ${safe(e.location)}` : ''}</div>
        ${e.gpa ? `<div class="entry-note">GPA: ${safe(e.gpa)}</div>` : ''}
        ${e.notes ? `<div class="entry-note">${safe(e.notes)}</div>` : ''}
      </div>
      <div class="entry-date">${dateRange(e.startDate, e.endDate)}</div>
    </div>
  </div>`).join('');
}

// ─── Certifications ───────────────────────────────────────────────────────────
function renderCertifications(entries: CertificationEntry[]): string {
  if (!entries?.length) return '';
  return entries.map(c => `
  <div class="entry entry-compact">
    <div class="entry-header">
      <div class="entry-left">
        <div class="entry-title">${safe(c.name)}</div>
        ${c.issuer ? `<div class="entry-org">${safe(c.issuer)}</div>` : ''}
      </div>
      ${c.date ? `<div class="entry-date">${safe(c.date)}</div>` : ''}
    </div>
  </div>`).join('');
}

// ─── Awards ───────────────────────────────────────────────────────────────────
function renderAwards(entries: AwardEntry[]): string {
  if (!entries?.length) return '';
  return entries.map(a => `
  <div class="entry entry-compact">
    <div class="entry-header">
      <div class="entry-left">
        <div class="entry-title">${safe(a.title)}</div>
        ${a.issuer ? `<div class="entry-org">${safe(a.issuer)}</div>` : ''}
        ${a.description ? `<div class="entry-note">${safe(a.description)}</div>` : ''}
      </div>
      ${a.date ? `<div class="entry-date">${safe(a.date)}</div>` : ''}
    </div>
  </div>`).join('');
}

// ─── Publications ─────────────────────────────────────────────────────────────
function renderPublications(entries: PublicationEntry[]): string {
  if (!entries?.length) return '';
  return entries.map(p => `
  <div class="entry entry-compact">
    <div class="entry-header">
      <div class="entry-left">
        <div class="entry-title">${safe(p.title)}</div>
        ${p.publisher ? `<div class="entry-org">${safe(p.publisher)}</div>` : ''}
        ${p.description ? `<div class="entry-note">${safe(p.description)}</div>` : ''}
        ${p.link ? `<div class="entry-link">${safe(p.link)}</div>` : ''}
      </div>
      ${p.date ? `<div class="entry-date">${safe(p.date)}</div>` : ''}
    </div>
  </div>`).join('');
}

// ─── Projects ─────────────────────────────────────────────────────────────────
function renderProjects(entries: ProjectEntry[]): string {
  if (!entries?.length) return '';
  return entries.map(p => `
  <div class="entry">
    <div class="entry-header">
      <div class="entry-left">
        <div class="entry-title">${safe(p.name)}</div>
        ${p.link ? `<div class="entry-link">${safe(p.link)}</div>` : ''}
        ${p.technologies?.length ? `<div class="entry-tech">${p.technologies.map(t => safe(t)).join(' · ')}</div>` : ''}
      </div>
      ${dateRange(p.startDate, p.endDate) ? `<div class="entry-date">${dateRange(p.startDate, p.endDate)}</div>` : ''}
    </div>
    ${p.description ? `<div class="entry-desc">${safe(p.description)}</div>` : ''}
    ${bullets(p.bullets)}
  </div>`).join('');
}

// ─── Skills ───────────────────────────────────────────────────────────────────
function renderSkills(skills: string[]): string {
  if (!skills?.length) return '';
  return `<div class="skills-list">${skills.map(s => safe(s)).join(' • ')}</div>`;
}

// ─── Additional sections ──────────────────────────────────────────────────────
function renderAdditional(sec: AdditionalSection): string {
  if (!sec.items?.length && !sec.rawContent?.trim()) return '';
  if (sec.items?.length) {
    return bullets(sec.items);
  }
  return `<div class="entry-desc">${safe(sec.rawContent)}</div>`;
}

// ─── Contact line ─────────────────────────────────────────────────────────────
function renderContactLine(resume: ResumeData): string {
  const p = resume.personal;
  const parts: string[] = [];
  if (p.email) parts.push(`${safe(p.email)}`);
  if (p.phone) parts.push(`${safe(p.phone)}`);
  if (p.location) parts.push(`${safe(p.location)}`);
  if (p.links?.length) {
    p.links.slice(0, 2).forEach(l => {
      const display = l.replace(/^https?:\/\/(www\.)?/, '').substring(0, 35);
      parts.push(`${safe(display)}`);
    });
  }
  return parts.join(' • ');
}

// ─── Main HTML generator ──────────────────────────────────────────────────────
export function generateResumeHTML(resume: ResumeData): string {
  const personal = resume.personal ?? {
    name: '', email: '', phone: '', location: '', links: [],
  };

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
            `<div class="summary-text">${safe(resume.summary)}</div>`));
        }
        break;
      case 'experience': {
        const body = renderExperience(resume.experience ?? []);
        if (body) renderedSections.push(section('Professional Experience', body));
        break;
      }
      case 'internships': {
        const body = renderInternships(resume.internships ?? []);
        if (body) renderedSections.push(section('Internship Experience', body));
        break;
      }
      case 'education': {
        const body = renderEducation(resume.education ?? []);
        if (body) renderedSections.push(section('Education', body));
        break;
      }
      case 'certifications': {
        const body = renderCertifications(resume.certifications ?? []);
        if (body) renderedSections.push(section('Certifications & Licenses', body));
        break;
      }
      case 'awards': {
        const body = renderAwards(resume.awards ?? []);
        if (body) renderedSections.push(section('Awards & Recognition', body));
        break;
      }
      case 'publications': {
        const body = renderPublications(resume.publications ?? []);
        if (body) renderedSections.push(section('Publications & Research', body));
        break;
      }
      case 'projects': {
        const body = renderProjects(resume.projects ?? []);
        if (body) renderedSections.push(section('Key Projects', body));
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
  /* ═══════════════════════════════════════════════════════════════════════ */
  /* COMPACT PROFESSIONAL TEMPLATE */
  /* Optimized for 1-2 pages · Maximum content density */
  /* ═══════════════════════════════════════════════════════════════════════ */
  
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
  
  /* Reset */
  *, *::before, *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }
  
  /* Base - COMPACT */
  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-size: 9.5pt;
    line-height: 1.35;
    color: #1a1a1a;
    background: #ffffff;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  
  /* Page - TIGHT MARGINS */
  .page {
    max-width: 8.5in;
    margin: 0 auto;
    padding: 0.5in 0.65in;
    background: #ffffff;
  }
  
  /* ─── HEADER - COMPACT ─────────────────────────────────────────────────── */
  
  .header {
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 2px solid #000000;
  }
  
  .name {
    font-size: 20pt;
    font-weight: 700;
    color: #000000;
    letter-spacing: -0.5px;
    margin-bottom: 5px;
    line-height: 1;
  }
  
  .contact-line {
    font-size: 8.5pt;
    color: #404040;
    line-height: 1.3;
    font-weight: 400;
  }
  
  /* ─── SECTIONS - TIGHT SPACING ──────────────────────────────────────────── */
  
  .section {
    margin-bottom: 14px;
  }
  
  .section-title {
    font-size: 10.5pt;
    font-weight: 700;
    color: #000000;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 7px;
    padding-bottom: 3px;
    border-bottom: 1.5px solid #000000;
  }
  
  /* ─── ENTRIES - COMPACT ─────────────────────────────────────────────────── */
  
  .entry {
    margin-bottom: 10px;
    page-break-inside: avoid;
  }
  
  .entry-compact {
    margin-bottom: 7px;
  }
  
  .entry:last-child {
    margin-bottom: 0;
  }
  
  .entry-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 4px;
    gap: 12px;
  }
  
  .entry-left {
    flex: 1;
    min-width: 0;
  }
  
  .entry-title {
    font-size: 10pt;
    font-weight: 700;
    color: #000000;
    line-height: 1.2;
    margin-bottom: 1px;
  }
  
  .entry-org {
    font-size: 9pt;
    color: #404040;
    font-weight: 500;
    line-height: 1.2;
  }
  
  .entry-note {
    font-size: 8.5pt;
    color: #606060;
    margin-top: 2px;
    line-height: 1.3;
  }
  
  .entry-date {
    font-size: 8.5pt;
    color: #404040;
    white-space: nowrap;
    flex-shrink: 0;
    font-weight: 500;
    text-align: right;
  }
  
  .entry-tech {
    font-size: 8.5pt;
    color: #000000;
    margin-top: 3px;
    font-weight: 500;
  }
  
  .entry-link {
    font-size: 8pt;
    color: #0066cc;
    margin-top: 2px;
    word-break: break-all;
  }
  
  .entry-desc {
    font-size: 9pt;
    color: #2a2a2a;
    line-height: 1.35;
    margin-top: 3px;
    margin-bottom: 4px;
    /* ✨ JUSTIFIED - project descriptions, award descriptions, etc */
    text-align: justify;
    text-justify: inter-word;
  }
  
  /* ─── SUMMARY - COMPACT ─────────────────────────────────────────────────── */
  
  .summary-text {
    font-size: 9.5pt;
    line-height: 1.4;
    color: #1a1a1a;
    /* ✨ JUSTIFIED - professional summary */
    text-align: justify;
    text-justify: inter-word;
  }
  
  /* ─── BULLETS - TIGHT ───────────────────────────────────────────────────── */
  
  .bullet-list {
    margin: 0;
    padding-left: 16px;
    list-style: none;
  }
  
  .bullet-list li {
    font-size: 9.5pt;
    line-height: 1.35;
    color: #1a1a1a;
    margin-bottom: 3px;
    padding-left: 0;
    position: relative;
    /* ✨ JUSTIFIED - experience/internship/project bullets */
    text-align: justify;
    text-justify: inter-word;
  }
  
  .bullet-list li:before {
    content: "•";
    position: absolute;
    left: -14px;
    font-weight: 700;
    color: #000000;
  }
  
  .bullet-list li:last-child {
    margin-bottom: 0;
  }
  
  /* ─── SKILLS - COMPACT ──────────────────────────────────────────────────── */
  
  .skills-list {
    font-size: 9.5pt;
    line-height: 1.4;
    color: #1a1a1a;
  }
  
  /* ─── PRINT OPTIMIZATION ────────────────────────────────────────────────── */
  
  @page {
    size: Letter;
    margin: 0;
  }
  
  @media print {
    body {
      font-size: 9pt;
    }
    
    .page {
      padding: 0.4in 0.55in;
      max-width: 100%;
    }
    
    .section {
      page-break-inside: avoid;
    }
    
    .entry {
      page-break-inside: avoid;
    }
    
    a {
      color: #0066cc;
      text-decoration: none;
    }
  }
</style>
</head>
<body>
<div class="page">
  <header class="header">
    <h1 class="name">${safe(personal.name || 'YOUR NAME')}</h1>
    <div class="contact-line">${renderContactLine(resume)}</div>
  </header>
  ${renderedSections.join('\n  ')}
</div>
</body>
</html>`;
}
