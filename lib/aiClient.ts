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
 * Usage:
 *   import { smartAICall } from '@/lib/aiClient';
 *   const result = await smartAICall(systemPrompt, userMessage, maxTokens, temperature);
 */

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

  // Dynamic import keeps cold-start memory low on Render's 512 MB free tier
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
  // Cohere v2 chat: message.content is an array of content blocks
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
  // Support both HF_TOKEN (classic) and HUGGINGFACE_API_KEY (newer naming)
  const apiKey = env('HF_TOKEN') ?? env('HUGGINGFACE_API_KEY');
  if (!apiKey) throw new Error('HF_TOKEN / HUGGINGFACE_API_KEY not set');

  // Use the OpenAI-compatible Messages API on HF serverless inference
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
      max_tokens: Math.min(maxTokens, 2048), // HF serverless cap
      temperature: Math.max(temperature, 0.01), // HF requires > 0
      stream: false,
    }),
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText);
    throw Object.assign(new Error(`HuggingFace HTTP ${res.status}: ${msg}`), { status: res.status });
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
 * Drop-in replacement for the old `groqChatCompletion`.
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
        return result;
      }
    } catch (err) {
      const limited = is429(err);
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[aiClient] ${name} ${limited ? 'rate-limited (429)' : 'errored'}: ${msg}`);
      errors.push(`${name}: ${msg}`);
      // Always continue to next provider regardless of error type
    }
  }

  throw new Error(`All AI providers exhausted.\n${errors.join('\n')}`);
}

/**
 * Backward-compatible alias — existing files that import groqChatCompletion
 * (resumeOptimizer.ts, ai-rewrite/route.ts, generate-cover-letter/route.ts)
 * will work without any changes once you update their import path to
 * '@/lib/aiClient' instead of '@/lib/groqClient'.
 *
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
