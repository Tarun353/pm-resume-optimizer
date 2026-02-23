/**
 * htmlTemplate.ts - PROFESSIONAL SINGLE-COLUMN TEMPLATE
 * ✅ BUGS FIXED: Name spacing, PDF layout spacing
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

// ✅ FIXED: Now trims and collapses spaces
function safe(s: string | undefined | null): string {
  if (!s) return '';
  return esc(String(s).trim().replace(/\s+/g, ' '));
}

// ─── Section wrapper ──────────────────────────────────────────────────────────
function section(title: string, body: string): string {
  if (!body.trim()) return '';
  return \`
<section class="section">
  <h2 class="section-title">\${esc(title)}</h2>
  <div class="section-divider"></div>
  \${body}
</section>\`;
}

// ─── Date range ───────────────────────────────────────────────────────────────
function dateRange(start?: string, end?: string): string {
  if (!start && !end) return '';
  if (start && end) return \`\${esc(start)} – \${esc(end)}\`;
  return esc(start || end);
}

// ─── Bullet list ──────────────────────────────────────────────────────────────
function bullets(items: string[]): string {
  if (!items || items.length === 0) return '';
  return \`<ul class="bullet-list">\${items.filter(b => b?.trim()).map(b => \`<li>\${esc(b)}</li>\`).join('')}</ul>\`;
}

// ─── Experience ───────────────────────────────────────────────────────────────
function renderExperience(entries: ExperienceEntry[]): string {
  if (!entries?.length) return '';
  return entries.map(e => \`
  <div class="entry">
    <div class="entry-header">
      <div class="entry-left">
        <div class="entry-title">\${safe(e.title)}</div>
        <div class="entry-subtitle">\${safe(e.company)}\${e.location ? \` · \${safe(e.location)}\` : ''}</div>
      </div>
      <div class="entry-date">\${dateRange(e.startDate, e.endDate)}</div>
    </div>
    \${bullets(e.bullets)}
  </div>\`).join('');
}

// ─── Internships ──────────────────────────────────────────────────────────────
function renderInternships(entries: InternshipEntry[]): string {
  if (!entries?.length) return '';
  return entries.map(e => \`
  <div class="entry">
    <div class="entry-header">
      <div class="entry-left">
        <div class="entry-title">\${safe(e.title)}</div>
        <div class="entry-subtitle">\${safe(e.company)}\${e.location ? \` · \${safe(e.location)}\` : ''}</div>
      </div>
      <div class="entry-date">\${dateRange(e.startDate, e.endDate)}</div>
    </div>
    \${bullets(e.bullets)}
  </div>\`).join('');
}

// ─── Education ────────────────────────────────────────────────────────────────
function renderEducation(entries: EducationEntry[]): string {
  if (!entries?.length) return '';
  return entries.map(e => \`
  <div class="entry">
    <div class="entry-header">
      <div class="entry-left">
        <div class="entry-title">\${safe(e.degree)}</div>
        <div class="entry-subtitle">\${safe(e.institution)}\${e.location ? \` · \${safe(e.location)}\` : ''}</div>
        \${e.gpa ? \`<div class="entry-note">GPA: \${safe(e.gpa)}</div>\` : ''}
        \${e.notes ? \`<div class="entry-note">\${safe(e.notes)}</div>\` : ''}
      </div>
      <div class="entry-date">\${dateRange(e.startDate, e.endDate)}</div>
    </div>
  </div>\`).join('');
}

// ─── Certifications ───────────────────────────────────────────────────────────
function renderCertifications(entries: CertificationEntry[]): string {
  if (!entries?.length) return '';
  return entries.map(c => \`
  <div class="entry entry-compact">
    <div class="entry-header">
      <div class="entry-left">
        <div class="entry-title">\${safe(c.name)}</div>
        \${c.issuer ? \`<div class="entry-subtitle">\${safe(c.issuer)}</div>\` : ''}
      </div>
      \${c.date ? \`<div class="entry-date">\${safe(c.date)}</div>\` : ''}
    </div>
  </div>\`).join('');
}

// ─── Awards ───────────────────────────────────────────────────────────────────
function renderAwards(entries: AwardEntry[]): string {
  if (!entries?.length) return '';
  return entries.map(a => \`
  <div class="entry entry-compact">
    <div class="entry-header">
      <div class="entry-left">
        <div class="entry-title">\${safe(a.title)}</div>
        \${a.issuer ? \`<div class="entry-subtitle">\${safe(a.issuer)}</div>\` : ''}
        \${a.description ? \`<div class="entry-note">\${safe(a.description)}</div>\` : ''}
      </div>
      \${a.date ? \`<div class="entry-date">\${safe(a.date)}</div>\` : ''}
    </div>
  </div>\`).join('');
}

// ─── Publications ─────────────────────────────────────────────────────────────
function renderPublications(entries: PublicationEntry[]): string {
  if (!entries?.length) return '';
  return entries.map(p => \`
  <div class="entry entry-compact">
    <div class="entry-header">
      <div class="entry-left">
        <div class="entry-title">\${safe(p.title)}</div>
        \${p.publisher ? \`<div class="entry-subtitle">\${safe(p.publisher)}</div>\` : ''}
        \${p.description ? \`<div class="entry-note">\${safe(p.description)}</div>\` : ''}
        \${p.link ? \`<div class="entry-link">\${safe(p.link)}</div>\` : ''}
      </div>
      \${p.date ? \`<div class="entry-date">\${safe(p.date)}</div>\` : ''}
    </div>
  </div>\`).join('');
}

// ─── Projects ─────────────────────────────────────────────────────────────────
function renderProjects(entries: ProjectEntry[]): string {
  if (!entries?.length) return '';
  return entries.map(p => \`
  <div class="entry">
    <div class="entry-header">
      <div class="entry-left">
        <div class="entry-title">\${safe(p.name)}</div>
        \${p.link ? \`<div class="entry-link">\${safe(p.link)}</div>\` : ''}
        \${p.technologies?.length ? \`<div class="entry-tech">\${p.technologies.map(t => safe(t)).join(' · ')}</div>\` : ''}
      </div>
      \${dateRange(p.startDate, p.endDate) ? \`<div class="entry-date">\${dateRange(p.startDate, p.endDate)}</div>\` : ''}
    </div>
    \${p.description ? \`<div class="entry-desc">\${safe(p.description)}</div>\` : ''}
    \${bullets(p.bullets)}
  </div>\`).join('');
}

// ─── Skills ───────────────────────────────────────────────────────────────────
function renderSkills(skills: string[]): string {
  if (!skills?.length) return '';
  return \`<div class="skills-grid">\${skills.map(s => \`<span class="skill-tag">\${safe(s)}</span>\`).join('')}</div>\`;
}

// ─── Additional sections ──────────────────────────────────────────────────────
function renderAdditional(sec: AdditionalSection): string {
  if (!sec.items?.length && !sec.rawContent?.trim()) return '';
  if (sec.items?.length) {
    return bullets(sec.items);
  }
  return \`<div class="entry-desc">\${safe(sec.rawContent)}</div>\`;
}

// ─── Contact line ─────────────────────────────────────────────────────────────
function renderContactLine(resume: ResumeData): string {
  const p = resume.personal;
  const parts: string[] = [];
  if (p.email) parts.push(\`<a href="mailto:\${safe(p.email)}" class="contact-link">\${safe(p.email)}</a>\`);
  if (p.phone) parts.push(\`<span>\${safe(p.phone)}</span>\`);
  if (p.location) parts.push(\`<span>\${safe(p.location)}</span>\`);
  if (p.links?.length) {
    p.links.slice(0, 2).forEach(l => {
      const display = l.replace(/^https?:\/\/(www\.)?/, '').substring(0, 30);
      parts.push(\`<a href="\${safe(l)}" class="contact-link">\${safe(display)}</a>\`);
    });
  }
  return parts.join('<span class="contact-sep">|</span>');
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
            \`<div class="summary-text">\${safe(resume.summary)}</div>\`));
        }
        break;
      case 'experience': {
        const body = renderExperience(resume.experience ?? []);
        if (body) renderedSections.push(section('Work Experience', body));
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

  for (const addl of resume.additionalSections ?? []) {
    const addlKey = \`additional:\${addl.heading.trim()}\`;
    if (!sectionOrder.includes(addlKey)) {
      const body = renderAdditional(addl);
      if (body) renderedSections.push(section(addl.heading, body));
    }
  }

  return \`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>\${safe(personal.name || 'Resume')}</title>
<style>
  /* PROFESSIONAL SINGLE-COLUMN TEMPLATE - ✅ BUGS FIXED */
  
  /* Reset & Base */
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  
  body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    font-size: 11pt;
    line-height: 1.6;
    color: #2d3748;
    background: #ffffff;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  
  a { color: #2563eb; text-decoration: none; }
  
  /* Page Container */
  .page {
    max-width: 8.5in;
    margin: 0 auto;
    padding: 0.75in 0.6in;
    background: #ffffff;
  }
  
  /* Header */
  .header {
    text-align: center;
    margin-bottom: 20px;
    padding-bottom: 16px;
    border-bottom: 2px solid #e2e8f0;
  }
  
  /* ✅ FIXED: Better name spacing */
  .name {
    font-size: 26pt;
    font-weight: 700;
    color: #1a202c;
    margin-bottom: 6px;
    letter-spacing: -0.3px;
    line-height: 1.1;
  }
  
  /* ✅ FIXED: Better contact line spacing */
  .contact-line {
    font-size: 9.5pt;
    color: #64748b;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-wrap: wrap;
    gap: 4px 0;
    line-height: 1.3;
  }
  
  .contact-link {
    color: #2563eb;
    font-weight: 500;
  }
  
  .contact-sep {
    color: #cbd5e1;
    margin: 0 8px;
  }
  
  /* ✅ FIXED: Tighter section spacing */
  .section {
    margin-bottom: 16px;
    page-break-inside: avoid;
  }
  
  .section-title {
    font-size: 12pt;
    font-weight: 700;
    color: #2563eb;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    margin-bottom: 6px;
  }
  
  .section-divider {
    height: 1.5px;
    background: linear-gradient(to right, #2563eb, #cbd5e1);
    margin-bottom: 12px;
  }
  
  /* ✅ FIXED: Tighter entry spacing */
  .entry {
    margin-bottom: 12px;
    page-break-inside: avoid;
  }
  
  .entry-compact {
    margin-bottom: 10px;
  }
  
  .entry:last-child {
    margin-bottom: 0;
  }
  
  .entry-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 12px;
    margin-bottom: 6px;
  }
  
  .entry-left {
    flex: 1;
    min-width: 0;
  }
  
  .entry-title {
    font-size: 11pt;
    font-weight: 700;
    color: #1a202c;
    line-height: 1.3;
  }
  
  .entry-subtitle {
    font-size: 10pt;
    color: #475569;
    font-style: italic;
    margin-top: 2px;
  }
  
  .entry-note {
    font-size: 9.5pt;
    color: #64748b;
    margin-top: 2px;
  }
  
  .entry-date {
    font-size: 9.5pt;
    color: #64748b;
    white-space: nowrap;
    flex-shrink: 0;
    font-weight: 500;
  }
  
  .entry-tech {
    font-size: 9pt;
    color: #2563eb;
    margin-top: 4px;
    font-weight: 500;
  }
  
  .entry-link {
    font-size: 9pt;
    color: #2563eb;
    margin-top: 2px;
  }
  
  .entry-desc {
    font-size: 10pt;
    color: #475569;
    line-height: 1.6;
    margin-top: 4px;
    margin-bottom: 6px;
  }
  
  /* Summary */
  .summary-text {
    font-size: 10.5pt;
    line-height: 1.7;
    color: #334155;
    text-align: justify;
  }
  
  /* Bullets */
  .bullet-list {
    margin: 0;
    padding-left: 18px;
    list-style: disc;
  }
  
  .bullet-list li {
    font-size: 10pt;
    line-height: 1.6;
    color: #334155;
    margin-bottom: 4px;
    padding-left: 4px;
  }
  
  .bullet-list li:last-child {
    margin-bottom: 0;
  }
  
  /* Skills */
  .skills-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  
  .skill-tag {
    background: #eff6ff;
    border: 1px solid #bfdbfe;
    color: #1e40af;
    font-size: 9.5pt;
    font-weight: 500;
    padding: 3px 10px;
    border-radius: 4px;
    white-space: nowrap;
  }
  
  /* Print Styles */
  @page {
    size: Letter;
    margin: 0;
  }
  
  @media print {
    body {
      font-size: 10.5pt;
    }
    
    .page {
      padding: 0.5in;
      max-width: 100%;
    }
    
    .section {
      page-break-inside: avoid;
    }
    
    .entry {
      page-break-inside: avoid;
    }
    
    a {
      color: #1e40af;
      text-decoration: none;
    }
  }
</style>
</head>
<body>
<div class="page">
  <header class="header">
    <h1 class="name">\${safe(personal.name || 'Your Name')}</h1>
    <div class="contact-line">\${renderContactLine(resume)}</div>
  </header>
  \${renderedSections.join('\\n  ')}
</div>
</body>
</html>\`;
}
