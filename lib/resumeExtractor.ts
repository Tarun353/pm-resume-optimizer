/**
 * lib/resumeExtractor.ts
 *
 * Bullet and summary extraction helpers used by /api/analyse.
 * Kept in lib/ so they are not exported from a Next.js route file
 * (route files may only export HTTP handlers + a small set of config fields).
 */

// ─── Section heading patterns ────────────────────────────────────────────────

const SECTION_HEADING_PATTERNS = [
  /^(work\s+)?experience$/i,
  /^professional\s+(experience|background|history)$/i,
  /^employment(\s+history)?$/i,
  /^internship(s)?$/i,
  /^education$/i,
  /^academic(\s+background)?$/i,
  /^project(s)?$/i,
  /^skill(s)?$/i,
  /^technical\s+skill(s)?$/i,
  /^achievement(s)?$/i,
  /^award(s)?(\s+&\s+honor(s)?)?$/i,
  /^honor(s)?$/i,
  /^certification(s)?(\s+&\s+license(s)?)?$/i,
  /^license(s)?$/i,
  /^publication(s)?$/i,
  /^summary$/i,
  /^professional\s+summary$/i,
  /^profile$/i,
  /^objective$/i,
  /^career\s+objective$/i,
  /^leadership(\s+experience)?$/i,
  /^volunteer(\s+experience)?$/i,
  /^extracurricular(\s+activities)?$/i,
  /^activities$/i,
  /^involvement$/i,
  /^additional(\s+information)?$/i,
  /^languages$/i,
  /^interests?$/i,
  /^core\s+competencies$/i,
  /^key\s+skills$/i,
];

const CONTACT_PATTERNS = [
  /@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/,
  /linkedin\.com/i,
  /github\.com/i,
  /^\+?\d[\d\s\-().]{7,}$/,
  /^[a-zA-Z0-9._%+-]+@/,
];

const ACTION_VERBS_REGEX =
  /^(led|drove|built|launched|managed|developed|created|designed|implemented|spearheaded|achieved|increased|improved|reduced|optimized|streamlined|collaborated|partnered|analyzed|identified|conducted|delivered|shipped|owned|defined|prioritized|coordinated|established|championed|facilitated|negotiated|synthesized|translated|transformed|accelerated|scaled|maintained|supported|assisted|worked|contributed|researched|prepared|executed|oversaw|supervised|directed|planned|organized|initiated|proposed|presented|communicated|reviewed|evaluated|trained|mentored|coached|engaged|generated|produced|published|wrote|drafted|deployed|migrated|integrated|automated|tested|resolved|handled|processed|conceptualized|formulated|pioneered|revamped|restructured|consolidated|expanded|secured|grew|boosted|enhanced|architected|prototyped|validated|iterated|sourced|adopted|enabled|empowered|shaped|influenced|closed)/i;

// ─── Bullet extraction ───────────────────────────────────────────────────────

export function extractBulletsFromText(
  resumeText: string,
): Array<{ text: string; section: string }> {
  const lines = resumeText.split('\n').map(l => l.trim()).filter(Boolean);
  const bullets: Array<{ text: string; section: string }> = [];
  let currentSection = 'General';
  const seenTexts = new Set<string>();

  for (const line of lines) {
    if (line.length < 20) continue;
    if (CONTACT_PATTERNS.some(p => p.test(line))) continue;
    if (/^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|\d{4})/i.test(line) && line.length < 40) continue;

    const isAllCaps =
      line === line.toUpperCase() && line.length > 2 && line.length < 60 && /[A-Z]/.test(line);
    const matchesHeadingPattern = SECTION_HEADING_PATTERNS.some(p =>
      p.test(line.replace(/[^\w\s]/g, '').trim()),
    );

    if (isAllCaps || matchesHeadingPattern) {
      currentSection = line
        .replace(/[•\-*:_|]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .split(' ')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');
      continue;
    }

    if (line.length < 35 && !ACTION_VERBS_REGEX.test(line)) continue;

    const cleanLine = line
      .replace(/^[\s]*[•▪▸►→·\-*]\s+/, '')
      .replace(/^\d+[.)]\s+/, '')
      .trim();

    if (cleanLine.length < 20) continue;

    const hasBulletMarker =
      /^[\s]*[•▪▸►→·\-*]\s+/.test(line) || /^\d+[.)]\s+/.test(line);
    const startsWithActionVerb = ACTION_VERBS_REGEX.test(cleanLine);
    const isLongDescriptiveLine = cleanLine.length > 55;

    if (hasBulletMarker || startsWithActionVerb || isLongDescriptiveLine) {
      const key = cleanLine.substring(0, 60).toLowerCase();
      if (!seenTexts.has(key)) {
        seenTexts.add(key);
        bullets.push({ text: cleanLine, section: currentSection });
      }
    }
  }

  return bullets.slice(0, 25);
}

// ─── Summary extraction ──────────────────────────────────────────────────────

export function extractSummary(resumeText: string): string {
  const lines = resumeText.split('\n').map(l => l.trim()).filter(Boolean);
  let inSummary = false;
  const summaryLines: string[] = [];

  for (const line of lines) {
    const lower = line.toLowerCase().replace(/[^\w\s]/g, '').trim();

    if (
      lower === 'summary' ||
      lower === 'professional summary' ||
      lower === 'profile' ||
      lower === 'objective' ||
      lower === 'career objective' ||
      lower === 'about me' ||
      lower === 'professional profile'
    ) {
      inSummary = true;
      continue;
    }

    if (inSummary) {
      const isAllCaps =
        line === line.toUpperCase() && line.length > 3 && /[A-Z]/.test(line);
      const isNextSection = SECTION_HEADING_PATTERNS.some(p =>
        p.test(line.replace(/[^\w\s]/g, '').trim()),
      );

      if ((isAllCaps || isNextSection) && summaryLines.length > 0) break;

      if (line.length > 25 && !CONTACT_PATTERNS.some(p => p.test(line))) {
        summaryLines.push(line);
        if (summaryLines.length >= 6) break;
      }
    }
  }

  // Fallback: first 2-3 long paragraphs
  if (summaryLines.length === 0) {
    let count = 0;
    for (const line of lines) {
      if (
        line.length > 80 &&
        !CONTACT_PATTERNS.some(p => p.test(line)) &&
        !/^\d{4}/.test(line)
      ) {
        summaryLines.push(line);
        count++;
        if (count >= 3) break;
      }
    }
  }

  return summaryLines.join(' ').trim();
}
