/**
 * llamaParseClient.ts
 *
 * LlamaParse REST API integration — no SDK required.
 *
 * WHY LLAMAPARSE OVER pdf-parse:
 * - pdf-parse does raw character extraction — loses table structure, merges
 *   columns, scrambles multi-column layouts (common in resumes)
 * - LlamaParse uses a vision-language model that understands document layout:
 *   it preserves tables, recognises columns, extracts headers correctly, and
 *   outputs clean Markdown that the LLM structurer can easily parse
 *
 * API FLOW:
 * 1. POST /upload   → submit file, receive job_id
 * 2. GET  /job/{id} → poll until status === "SUCCESS" (or ERROR/timeout)
 * 3. GET  /job/{id}/result/markdown → fetch clean markdown text
 *
 * Free tier: 1000 pages/day at https://cloud.llamaindex.ai
 */

const LLAMA_API_BASE = 'https://api.cloud.llamaindex.ai/api/parsing';
const POLL_INTERVAL_MS = 2000;   // poll every 2 seconds
const MAX_POLL_ATTEMPTS = 60;    // max 120 seconds total wait

type JobStatus = 'PENDING' | 'SUCCESS' | 'ERROR' | 'CANCELLED';

interface UploadResponse {
  id: string;
  status: JobStatus;
}

interface JobStatusResponse {
  id: string;
  status: JobStatus;
  error?: string;
}

interface MarkdownResult {
  markdown: string;
}

function getLlamaApiKey(): string {
  const key = process.env.LLAMA_CLOUD_API_KEY;
  if (!key) {
    throw new Error(
      'LLAMA_CLOUD_API_KEY is not set.\n' +
      'Get a free key at https://cloud.llamaindex.ai\n' +
      'Then add it to your .env.local file.'
    );
  }
  return key;
}

// ─── Step 1: Upload file ──────────────────────────────────────────────────────

async function uploadFile(
  buffer: Buffer,
  fileName: string,
  mimeType: string,
  apiKey: string
): Promise<string> {
  const formData = new FormData();

  // Construct a Blob from the buffer for the FormData
  const blob = new Blob([buffer], { type: mimeType });
  formData.append('file', blob, fileName);

  // LlamaParse options — request markdown output, enable table extraction
  formData.append('result_type', 'markdown');
  formData.append('num_workers', '4');
  formData.append('verbose', 'false');
  formData.append('language', 'en');

  const response = await fetch(`${LLAMA_API_BASE}/upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      // Do NOT set Content-Type here — fetch sets it automatically with boundary
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `LlamaParse upload failed (${response.status}): ${errorText}`
    );
  }

  const data = await response.json() as UploadResponse;

  if (!data.id) {
    throw new Error('LlamaParse did not return a job ID.');
  }

  return data.id;
}

// ─── Step 2: Poll for completion ──────────────────────────────────────────────

async function pollUntilComplete(
  jobId: string,
  apiKey: string
): Promise<void> {
  for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
    await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));

    const response = await fetch(`${LLAMA_API_BASE}/job/${jobId}`, {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    });

    if (!response.ok) {
      throw new Error(`LlamaParse status check failed (${response.status})`);
    }

    const data = await response.json() as JobStatusResponse;

    if (data.status === 'SUCCESS') return;
    if (data.status === 'ERROR' || data.status === 'CANCELLED') {
      throw new Error(
        `LlamaParse job failed with status: ${data.status}. ${data.error ?? ''}`
      );
    }
    // PENDING — continue polling
  }

  throw new Error(
    `LlamaParse timed out after ${(MAX_POLL_ATTEMPTS * POLL_INTERVAL_MS) / 1000} seconds.`
  );
}

// ─── Step 3: Fetch markdown result ────────────────────────────────────────────

async function fetchMarkdown(jobId: string, apiKey: string): Promise<string> {
  const response = await fetch(
    `${LLAMA_API_BASE}/job/${jobId}/result/markdown`,
    { headers: { 'Authorization': `Bearer ${apiKey}` } }
  );

  if (!response.ok) {
    throw new Error(
      `LlamaParse result fetch failed (${response.status}): ${await response.text()}`
    );
  }

  const data = await response.json() as MarkdownResult;
  return data.markdown ?? '';
}

// ─── Main public function ─────────────────────────────────────────────────────

export async function parseWithLlamaParse(
  buffer: Buffer,
  fileName: string
): Promise<string> {
  const apiKey = getLlamaApiKey();

  const ext = fileName.toLowerCase().split('.').pop() ?? 'pdf';
  const mimeType =
    ext === 'docx'
      ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      : 'application/pdf';

  console.log(`[LlamaParse] Uploading ${fileName} (${buffer.length} bytes)...`);
  const jobId = await uploadFile(buffer, fileName, mimeType, apiKey);
  console.log(`[LlamaParse] Job created: ${jobId} — polling...`);

  await pollUntilComplete(jobId, apiKey);
  console.log(`[LlamaParse] Job complete — fetching markdown...`);

  const markdown = await fetchMarkdown(jobId, apiKey);
  console.log(`[LlamaParse] Extracted ${markdown.length} chars of markdown.`);

  return markdown;
}
