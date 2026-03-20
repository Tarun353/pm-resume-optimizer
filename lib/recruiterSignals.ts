/**
 * lib/recruiterSignals.ts
 *
 * Analyzes what a human recruiter actually evaluates
 * in the first 6-10 seconds of reviewing a PM resume.
 *
 * ATS (Gate 1) = machine keyword filter → did you appear in search results?
 * Recruiter (Gate 2) = human judgment → does this person look credible?
 *
 * The Reddit complaint "80-90% ATS score but no calls" happens because
 * people pass Gate 1 but fail Gate 2. This file addresses Gate 2.
 */

// ─── Patterns ──────────────────────────────────────────────────────────────

const PM_TITLE_PATTERNS = [
  /\bproduct manager\b/i,
  /\bsenior pm\b/i,
  /\bassociate product manager\b/i,
  /\bapm\b/i,
  /\bvp of product\b/i,
  /\bhead of product\b/i,
  /\bproduct lead\b/i,
  /\bgroup pm\b/i,
  /\bprincipal pm\b/i,
  /\bproduct owner\b/i,
  /\bdirector of product\b/i,
];

const OUTCOME_VERB_STARTERS = [
  'increased', 'decreased', 'reduced', 'improved', 'grew', 'drove',
  'launched', 'delivered', 'achieved', 'generated', 'saved', 'built',
  'created', 'scaled', 'transformed', 'boosted', 'accelerated', 'secured',
  'shipped', 'led', 'spearheaded', 'pioneered', 'revamped',
];

const TASK_VERB_STARTERS = [
  'managed', 'responsible for', 'worked on', 'helped', 'assisted',
  'supported', 'coordinated', 'handled', 'maintained', 'collaborated',
];

const METRIC_REGEX = /(\d+\.?\d*\s*(%|x|X|k\b|K\b|M\b|cr\b|lakh\b|mn\b)|(\$|₹)\s*\d+|\d{2,}[\s,]\d{3}|\d+\+?\s*(users|customers|clients|features|markets|countries|downloads|installs|signups))/i;

const SUMMARY_INDICATORS = [
  'summary', 'professional summary', 'profile', 'objective', 'career objective', 'about me',
];

// Domain classification signals
const DOMAIN_MAP: Record<string, string[]> = {
  fintech: ['fintech', 'payment', 'lending', 'banking', 'insurance', 'kyc', 'rbi', 'neft', 'upi', 'razorpay', 'paytm', 'phonepe'],
  edtech: ['edtech', 'education', 'learning', 'students', 'teachers', 'courses', 'upskill', 'byju', 'unacademy', 'classplus'],
  ecommerce: ['ecommerce', 'e-commerce', 'marketplace', 'seller', 'buyer', 'checkout', 'cart', 'flipkart', 'meesho', 'amazon'],
  'B2B SaaS': ['enterprise', 'b2b', 'saas', 'smb', 'sales', 'crm', 'leads', 'pipeline', 'zoho', 'freshworks'],
  'B2C/consumer': ['consumer', 'b2c', 'mobile app', 'growth', 'retention', 'dau', 'mau', 'viral', 'notification', 'engagement'],
  healthtech: ['health', 'healthcare', 'medical', 'patient', 'hospital', 'clinic', 'diagnosis', 'pharma'],
};

// ─── Types ────────────────────────────────────────────────────────────────

export type SignalStatus = 'strong' | 'ok' | 'weak' | 'missing';

export interface RecruiterSignal {
  id: string;
  label: string;
  icon: string;
  status: SignalStatus;
  finding: string;
  fix: string | null;
  priority: number; // 1 = most critical
}

export interface RecruiterAnalysis {
  overallAppeal: 'low' | 'medium' | 'high';
  appealLabel: string;
  appealColor: string;
  signals: RecruiterSignal[];
  topFix: string;
  domainAlignment: {
    resumeDomain: string;
    jdDomain: string;
    aligned: boolean;
    note: string;
  };
  metricDensity: {
    total: number;
    withMetrics: number;
    percentage: number;
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function extractBullets(text: string): string[] {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  return lines.filter(l =>
    /^[•\-\*▸►→·]/.test(l) ||
    (l.length > 35 && OUTCOME_VERB_STARTERS.some(v =>
      l.toLowerCase().startsWith(v)
    )) ||
    (l.length > 35 && TASK_VERB_STARTERS.some(v =>
      l.toLowerCase().startsWith(v)
    ))
  ).map(l => l.replace(/^[•\-\*▸►→·]\s*/, '').trim());
}

function detectDomain(text: string): string {
  const lower = text.toLowerCase();
  let bestDomain = 'general PM';
  let bestCount = 0;

  for (const [domain, signals] of Object.entries(DOMAIN_MAP)) {
    const count = signals.filter(s => lower.includes(s)).length;
    if (count > bestCount) {
      bestCount = count;
      bestDomain = domain;
    }
  }

  return bestDomain;
}

// ─── Main export ──────────────────────────────────────────────────────────

export function analyzeRecruiterSignals(
  resumeText: string,
  jdText: string,
  profile: string
): RecruiterAnalysis {
  const bullets = extractBullets(resumeText);
  const signals: RecruiterSignal[] = [];

  // ── Signal 1: PM Title Clarity ────────────────────────────────────────
  const hasPMTitle = PM_TITLE_PATTERNS.some(p => p.test(resumeText));

  signals.push({
    id: 'title_clarity',
    label: 'PM role is immediately visible',
    icon: '🎯',
    status: hasPMTitle
      ? 'strong'
      : profile === 'aspiring' ? 'ok' : 'weak',
    finding: hasPMTitle
      ? 'Your resume shows a clear PM title. Recruiters confirm your role in under 2 seconds.'
      : profile === 'aspiring'
        ? 'No PM title yet — expected for aspiring PMs. Your summary must clearly state your PM goal.'
        : 'No "Product Manager" title visible. Recruiters scan for this first — if they don\'t see it, they move on.',
    fix: hasPMTitle
      ? null
      : profile === 'aspiring'
        ? 'Start your summary with "Aspiring Product Manager" or "PM Candidate" to signal intent.'
        : 'If your title was PM, make it explicit. If transitioning, add "(Product Manager)" after your current title.',
    priority: 1,
  });

  // ── Signal 2: Metric Density ──────────────────────────────────────────
  const bulletsWithMetrics = bullets.filter(b => METRIC_REGEX.test(b));
  const metricPct = bullets.length > 0
    ? Math.round((bulletsWithMetrics.length / bullets.length) * 100)
    : 0;

  let metricStatus: SignalStatus = 'missing';
  if (metricPct >= 50) metricStatus = 'strong';
  else if (metricPct >= 30) metricStatus = 'ok';
  else if (metricPct >= 10) metricStatus = 'weak';

  signals.push({
    id: 'metric_density',
    label: 'Numbers prove your impact',
    icon: '📊',
    status: metricStatus,
    finding: bullets.length === 0
      ? 'No bullet points detected. Recruiters need structured, measurable achievements.'
      : `${bulletsWithMetrics.length} of ${bullets.length} bullets (${metricPct}%) have quantified results. ${
          metricStatus === 'strong'
            ? 'Strong — recruiter can assess your scope and impact immediately.'
            : metricStatus === 'ok'
              ? 'Decent, but top PM resumes have 50%+ bullets with numbers.'
              : 'Low. Recruiters cannot judge impact without numbers. This is a top reason for rejection.'
        }`,
    fix: metricStatus === 'strong'
      ? null
      : 'Add numbers to more bullets: users impacted, % improvement, revenue, team size, time saved, experiments run.',
    priority: 2,
  });

  // ── Signal 3: First Bullet Quality ────────────────────────────────────
  const firstBullet = bullets[0] || '';
  const fbLower = firstBullet.toLowerCase();
  const firstIsOutcome = OUTCOME_VERB_STARTERS.some(v => fbLower.startsWith(v));
  const firstIsTask = TASK_VERB_STARTERS.some(v => fbLower.startsWith(v));
  const firstHasMetric = METRIC_REGEX.test(firstBullet);

  let firstBulletStatus: SignalStatus = 'ok';
  if (firstIsOutcome && firstHasMetric) firstBulletStatus = 'strong';
  else if (firstIsTask) firstBulletStatus = 'weak';
  else if (!firstBullet) firstBulletStatus = 'missing';

  signals.push({
    id: 'first_bullet',
    label: 'First bullet makes them stop',
    icon: '✨',
    status: firstBulletStatus,
    finding: !firstBullet
      ? 'No bullet points found in experience sections.'
      : firstBulletStatus === 'strong'
        ? `Your first bullet leads with outcome and data — recruiter notices impact immediately.`
        : firstIsTask
          ? `First bullet starts with "${firstBullet.split(' ').slice(0, 3).join(' ')}..." — this describes a task, not an achievement. Recruiter sees responsibility, not results.`
          : 'Your first bullet is neutral. Lead with your biggest win to hook the recruiter.',
    fix: firstBulletStatus === 'strong'
      ? null
      : 'Rewrite your most impressive bullet to be first. Start with the outcome: "Drove X% improvement in Y by doing Z."',
    priority: 3,
  });

  // ── Signal 4: Summary Presence ─────────────────────────────────────────
  const hasSummary = SUMMARY_INDICATORS.some(s =>
    resumeText.toLowerCase().includes(s)
  );

  signals.push({
    id: 'summary_presence',
    label: 'Summary tells your story fast',
    icon: '📝',
    status: hasSummary ? 'strong' : 'missing',
    finding: hasSummary
      ? 'Summary section found. Recruiter can understand your positioning without reading the whole resume.'
      : 'No professional summary detected. Recruiters have to guess your narrative — most won\'t bother.',
    fix: hasSummary
      ? null
      : 'Add a 2-3 sentence summary: who you are as a PM, your domain expertise, and what kind of role you want.',
    priority: 4,
  });

  // ── Signal 5: Date Clarity / Career Arc ───────────────────────────────
  const yearMatches = resumeText.match(/\b(20\d{2})\b/g) || [];
  const uniqueYears = [...new Set(yearMatches)];
  const hasTimeline = uniqueYears.length >= 2;

  signals.push({
    id: 'career_arc',
    label: 'Career timeline is readable',
    icon: '📅',
    status: hasTimeline ? 'ok' : 'weak',
    finding: hasTimeline
      ? 'Date ranges are visible. Recruiter can follow your trajectory and spot progression.'
      : 'Dates are unclear or absent. Recruiters immediately check for gaps and tenure — if they can\'t find dates, they skip.',
    fix: hasTimeline
      ? null
      : 'Add clear date ranges to every role: "Jan 2022 – Present" format. Never omit dates.',
    priority: 5,
  });

  // ── Signal 6: Domain Alignment ────────────────────────────────────────
  const resumeDomain = detectDomain(resumeText);
  const jdDomain = jdText.trim().length > 50 ? detectDomain(jdText) : 'general PM';
  const aligned = jdDomain === 'general PM' || resumeDomain === jdDomain || resumeDomain === 'general PM';

  signals.push({
    id: 'domain_alignment',
    label: 'Your experience fits this role type',
    icon: '🎯',
    status: aligned ? 'strong' : 'weak',
    finding: aligned
      ? `Your ${resumeDomain} experience is well-matched to this role. Domain fit is clear.`
      : `Your resume signals ${resumeDomain} experience, but this JD is for ${jdDomain}. Recruiters may question fit without explanation.`,
    fix: aligned
      ? null
      : `Add 1-2 sentences in your summary bridging your ${resumeDomain} background to ${jdDomain} work. Show the transferable skill.`,
    priority: 6,
  });

  // ── Calculate overall appeal ───────────────────────────────────────────
  const strongCount = signals.filter(s => s.status === 'strong').length;
  const weakOrMissingCount = signals.filter(
    s => s.status === 'weak' || s.status === 'missing'
  ).length;

  let overallAppeal: RecruiterAnalysis['overallAppeal'] = 'medium';
  let appealLabel = 'Needs Work';
  let appealColor = '#f59e0b'; // amber

  if (strongCount >= 4 && weakOrMissingCount <= 1) {
    overallAppeal = 'high';
    appealLabel = 'Strong Recruiter Appeal';
    appealColor = '#10b981';
  } else if (weakOrMissingCount >= 3) {
    overallAppeal = 'low';
    appealLabel = 'Low Recruiter Appeal';
    appealColor = '#ef4444';
  }

  // ── Top fix (highest priority weak signal) ────────────────────────────
  const criticalSignals = signals
    .filter(s => s.status === 'weak' || s.status === 'missing')
    .sort((a, b) => a.priority - b.priority);

  const topFix = criticalSignals[0]?.fix
    ?? 'Your resume shows strong recruiter appeal across all key signals.';

  return {
    overallAppeal,
    appealLabel,
    appealColor,
    signals,
    topFix,
    domainAlignment: {
      resumeDomain,
      jdDomain,
      aligned,
      note: aligned
        ? `Experience type matches the role.`
        : `Mismatch: resume is ${resumeDomain}, role needs ${jdDomain}.`,
    },
    metricDensity: {
      total: bullets.length,
      withMetrics: bulletsWithMetrics.length,
      percentage: metricPct,
    },
  };
}
