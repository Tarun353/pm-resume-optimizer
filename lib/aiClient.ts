/**
 * lib/aiClient.ts — Multi-Model AI Fallback Infrastructure
 *
 * Generation chain (in order):
 *   1. Groq          – llama-3.3-70b-versatile  (fastest, primary)
 *   2. Gemini        – gemini-1.5-flash          (generous limits)
 *   3. Mistral       – mistral-large-latest       (high quality)
 *   4. Cohere        – command-r-plus             (long-context, good free tier)
 *   5. HuggingFace   – Llama-3-8B-Instruct        (free, last resort)
 *
 * Any provider is automatically skipped when:
 *   - Its API key env-var is absent
 *   - It returns HTTP 429 (rate limited / quota exceeded)
 *   - It throws any other error (logged, then chain continues)
 *
 * All responses are stripped of markdown formatting before returning,
 * so **bold**, *italic*, `code`, etc. never appear in generated PDFs
 * regardless of which model produced the output.
 */

// ─── Markdown stripper ────────────────────────────────────────────────────────

/**
 * Removes all common markdown formatting from AI output.
 * Applied to EVERY response from EVERY model before returning,
 * so the caller always gets clean plain text.
 *
 * NOTE: This is intentionally NOT applied when the caller expects JSON,
 * because JSON responses go through JSON.parse() directly and are not
 * rendered as text in the PDF. The stripping only affects text content.
 */
function stripMarkdown(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, (match) => {
      // For code blocks, extract just the content inside
      return match.replace(/```(?:\w+)?\n?/g, '').replace(/```/g, '');
    })
    .replace(/\*\*(.+?)\*\*/g, '$1')      // **bold** → bold
    .replace(/\*(.+?)\*/g, '$1')           // *italic* → italic
    .replace(/`(.+?)`/g, '$1')             // `inline code` → plain
    .replace(/^#{1,6}\s+/gm, '')           // ## Headings → plain
    .replace(/_{2}(.+?)_{2}/g, '$1')       // __bold__ → bold
    .replace(/_(.+?)_/g, '$1')             // _italic_ → italic
    .replace(/\[(.+?)\]\(.+?\)/g, '$1')   // [links](url) → text only
    .replace(/~~(.+?)~~/g, '$1')           // ~~strikethrough~~ → plain
    .trim();
}

// ─── Rate-limit detector ──────────────────────────────────────────────────────

function is429(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const e = err as Record<string, unknown>;
  const status = (e.status ?? e.statusCode ?? (e as any)?.error?.status) as number | undefined;
  if (status === 429) return true;
  const msg = String(e.message ?? '').toLowerCase();
  return msg.includes('rate limit') || msg.includes('429') || msg.includes('quota') || msg.includes('too many');
}

function env(key: string): string | undefined {
  return process.env[key] ?? undefined;
}

// ─── Provider 1: Groq ─────────────────────────────────────────────────────────

async function callGroq(
  system: string,
  user: string,
  maxTokens: number,
  temperature: number,
): Promise<string> {
  const apiKey = env('GROQ_API_KEY');
  if (!apiKey) throw new Error('GROQ_API_KEY not set');

  const Groq = await import('groq-sdk').then((m) => m.default ?? m);
  const client = new (Groq as any)({ apiKey });

  const completion = await client.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    max_tokens: maxTokens,
    temperature,
    top_p: 0.95,
  });

  const text: string = completion.choices[0]?.message?.content ?? '';
  if (!text) throw new Error('Groq returned empty content');
  return text;
}

// ─── Provider 2: Google Gemini ────────────────────────────────────────────────

async function callGemini(
  system: string,
  user: string,
  maxTokens: number,
  temperature: number,
): Promise<string> {
  const apiKey = env('GEMINI_API_KEY');
  if (!apiKey) throw new Error('GEMINI_API_KEY not set');

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: system }] },
      contents: [{ parts: [{ text: user }] }],
      generationConfig: { maxOutputTokens: maxTokens, temperature, topP: 0.95 },
    }),
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText);
    throw Object.assign(new Error(`Gemini HTTP ${res.status}: ${msg}`), { status: res.status });
  }

  const data = (await res.json()) as any;
  const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  if (!text) throw new Error('Gemini returned empty content');
  return text;
}

// ─── Provider 3: Mistral ──────────────────────────────────────────────────────

async function callMistral(
  system: string,
  user: string,
  maxTokens: number,
  temperature: number,
): Promise<string> {
  const apiKey = env('MISTRAL_API_KEY');
  if (!apiKey) throw new Error('MISTRAL_API_KEY not set');

  const res = await fetch('https://api.mistral.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'mistral-large-latest',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      max_tokens: maxTokens,
      temperature,
    }),
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText);
    throw Object.assign(new Error(`Mistral HTTP ${res.status}: ${msg}`), { status: res.status });
  }

  const data = (await res.json()) as any;
  const text: string = data?.choices?.[0]?.message?.content ?? '';
  if (!text) throw new Error('Mistral returned empty content');
  return text;
}

// ─── Provider 4: Cohere Command R+ ───────────────────────────────────────────

async function callCohere(
  system: string,
  user: string,
  maxTokens: number,
  temperature: number,
): Promise<string> {
  const apiKey = env('COHERE_API_KEY');
  if (!apiKey) throw new Error('COHERE_API_KEY not set');

  const res = await fetch('https://api.cohere.com/v2/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'X-Client-Name': 'pm-resume-optimizer',
    },
    body: JSON.stringify({
      model: 'command-r-plus',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      max_tokens: maxTokens,
      temperature,
    }),
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText);
    throw Object.assign(new Error(`Cohere HTTP ${res.status}: ${msg}`), { status: res.status });
  }

  const data = (await res.json()) as any;
  const text: string =
    data?.message?.content?.[0]?.text ??
    data?.message?.content ??
    '';
  if (!text) throw new Error('Cohere returned empty content');
  return text;
}

// ─── Provider 5: HuggingFace Inference API ───────────────────────────────────

async function callHuggingFace(
  system: string,
  user: string,
  maxTokens: number,
  temperature: number,
): Promise<string> {
  const apiKey = env('HF_TOKEN') ?? env('HUGGINGFACE_API_KEY');
  if (!apiKey) throw new Error('HF_TOKEN / HUGGINGFACE_API_KEY not set');

  const model = 'meta-llama/Meta-Llama-3-8B-Instruct';
  const url = `https://api-inference.huggingface.co/models/${model}/v1/chat/completions`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      max_tokens: Math.min(maxTokens, 2048),
      temperature: Math.max(temperature, 0.01),
      stream: false,
    }),
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText);
    throw Object.assign(
      new Error(`HuggingFace HTTP ${res.status}: ${msg}`),
      { status: res.status },
    );
  }

  const data = (await res.json()) as any;
  const text: string = data?.choices?.[0]?.message?.content ?? '';
  if (!text) throw new Error('HuggingFace returned empty content');
  return text;
}

// ─── Fallback orchestrator ────────────────────────────────────────────────────

interface Provider {
  name: string;
  fn: (s: string, u: string, mt: number, temp: number) => Promise<string>;
}

const PROVIDERS: Provider[] = [
  { name: 'Groq',        fn: callGroq        },
  { name: 'Gemini',      fn: callGemini      },
  { name: 'Mistral',     fn: callMistral     },
  { name: 'Cohere',      fn: callCohere      },
  { name: 'HuggingFace', fn: callHuggingFace },
];

/**
 * Primary export — automatically falls through providers on 429 or any error.
 * ALL responses are stripped of markdown before returning, so **bold**, *italic*,
 * `code` etc. never appear in generated PDFs regardless of which model responded.
 */
export async function smartAICall(
  systemPrompt: string,
  userMessage: string,
  maxTokens = 4096,
  temperature = 0.4,
): Promise<string> {
  const errors: string[] = [];

  for (const { name, fn } of PROVIDERS) {
    try {
      const result = await fn(systemPrompt, userMessage, maxTokens, temperature);
      if (result) {
        if (name !== 'Groq') {
          console.warn(`[aiClient] ⚠️  Primary Groq unavailable — used ${name} as fallback`);
        }
        // ── Strip markdown from text responses only ──
        // JSON responses (from /api/analyse etc.) must NOT be stripped
        // because regex patterns can corrupt JSON structure
        const trimmed = result.trim();
        const isJSON = trimmed.startsWith('{') || trimmed.startsWith('[');
        return isJSON ? trimmed : stripMarkdown(result);
      }
    } catch (err) {
      const limited = is429(err);
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[aiClient] ${name} ${limited ? 'rate-limited (429)' : 'errored'}: ${msg}`);
      errors.push(`${name}: ${msg}`);
    }
  }

  throw new Error(`All AI providers exhausted.\n${errors.join('\n')}`);
}

/**
 * Backward-compatible alias for files that still import groqChatCompletion.
 * @deprecated Use smartAICall directly in new code.
 */
export async function groqChatCompletion(
  systemPrompt: string,
  userMessage: string,
  maxTokens = 4096,
  temperature = 0.4,
): Promise<string> {
  return smartAICall(systemPrompt, userMessage, maxTokens, temperature);
}
