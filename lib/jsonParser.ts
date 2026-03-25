/**
 * lib/jsonParser.ts
 * Robust LLM JSON parser — 5-step recovery chain.
 * Drop this file into your lib/ folder and import robustJsonParse anywhere.
 */

function stripMarkdownFences(raw: string): string {
  // Remove ```json ... ``` or ``` ... ``` blocks
  let s = raw.replace(/^[\s\S]*?```(?:json|JSON)?\s*/m, '');
  s = s.replace(/```[\s\S]*$/m, '');
  // Also handle ~~~json fences
  s = s.replace(/^[\s\S]*?~~~(?:json|JSON)?\s*/m, '');
  s = s.replace(/~~~[\s\S]*$/m, '');
  return s.trim();
}

function extractJsonBlock(text: string): string | null {
  const firstBrace = text.indexOf('{');
  const firstBracket = text.indexOf('[');
  if (firstBrace === -1 && firstBracket === -1) return null;

  let startChar = '{';
  let endChar = '}';
  let startIdx = firstBrace;

  if (firstBracket !== -1 && (firstBrace === -1 || firstBracket < firstBrace)) {
    startChar = '[';
    endChar = ']';
    startIdx = firstBracket;
  }

  let depth = 0;
  let inString = false;
  let escaped = false;
  let endIdx = -1;

  for (let i = startIdx; i < text.length; i++) {
    const char = text[i];
    if (escaped) { escaped = false; continue; }
    if (char === '\\' && inString) { escaped = true; continue; }
    if (char === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (char === startChar) depth++;
    if (char === endChar) { depth--; if (depth === 0) { endIdx = i; break; } }
  }

  if (endIdx === -1) return null;
  return text.slice(startIdx, endIdx + 1);
}

function fixCommonJsonIssues(text: string): string {
  return text
    .replace(/,(\s*[}\]])/g, '$1')                              // trailing commas
    .replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":') // unquoted keys
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '') // control chars
    .trim();
}

function attemptTruncationRecovery(text: string): string {
  let braces = 0, brackets = 0;
  let inString = false, escaped = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (escaped) { escaped = false; continue; }
    if (char === '\\' && inString) { escaped = true; continue; }
    if (char === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (char === '{') braces++;
    if (char === '}') braces--;
    if (char === '[') brackets++;
    if (char === ']') brackets--;
  }

  let recovered = text.replace(/,\s*$/, '');
  recovered += ']'.repeat(Math.max(0, brackets));
  recovered += '}'.repeat(Math.max(0, braces));
  return recovered;
}

/**
 * robustJsonParse — 5-step LLM JSON recovery.
 *
 * @param raw      Raw string from any LLM
 * @param fallback Returned if all 5 attempts fail
 */
export function robustJsonParse<T>(raw: string, fallback: T): T {
  if (!raw || typeof raw !== 'string') return fallback;

  // Attempt 1: Direct parse (fastest path)
  try { return JSON.parse(raw.trim()) as T; } catch {}

  // Attempt 2: Strip markdown fences
  try { return JSON.parse(stripMarkdownFences(raw)) as T; } catch {}

  // Attempt 3: Extract JSON block from surrounding prose
  try {
    const extracted = extractJsonBlock(stripMarkdownFences(raw));
    if (extracted) return JSON.parse(extracted) as T;
  } catch {}

  // Attempt 4: Extract + fix formatting issues
  try {
    const extracted = extractJsonBlock(stripMarkdownFences(raw)) ?? stripMarkdownFences(raw);
    return JSON.parse(fixCommonJsonIssues(extracted)) as T;
  } catch {}

  // Attempt 5: Full recovery including truncation repair
  try {
    const extracted = extractJsonBlock(stripMarkdownFences(raw)) ?? stripMarkdownFences(raw);
    const fixed = fixCommonJsonIssues(extracted);
    return JSON.parse(attemptTruncationRecovery(fixed)) as T;
  } catch {}

  console.error('[robustJsonParse] All 5 attempts failed. Raw (first 400 chars):', raw.slice(0, 400));
  return fallback;
}
