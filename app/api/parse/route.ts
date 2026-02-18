import { NextRequest, NextResponse } from 'next/server';
import {
  parseResumeText,
  extractTextFromPDF,
  extractTextFromDOCX,
} from '@/lib/resumeParser';
import { ParseResponse } from '@/lib/types';

export const runtime = 'nodejs';
export const maxDuration = 120; // LlamaParse can take up to ~60s for large files

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const contentType = request.headers.get('content-type') ?? '';
    let rawText = '';
    let resume;

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      const textInput = formData.get('text') as string | null;

      if (file) {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const fileName = file.name;
        const ext = fileName.toLowerCase().split('.').pop();

        if (ext === 'pdf') {
          try {
            // LlamaParse → clean Markdown
            rawText = await extractTextFromPDF(buffer, fileName);
          } catch (err) {
            console.error('[parse] PDF extraction error:', err);
            const msg = err instanceof Error ? err.message : 'PDF extraction failed';
            return NextResponse.json({ error: msg }, { status: 422 });
          }
        } else if (ext === 'docx') {
          try {
            // LlamaParse → clean Markdown (mammoth fallback)
            rawText = await extractTextFromDOCX(buffer, fileName);
          } catch (err) {
            console.error('[parse] DOCX extraction error:', err);
            const msg = err instanceof Error ? err.message : 'DOCX extraction failed';
            return NextResponse.json({ error: msg }, { status: 422 });
          }
        } else {
          return NextResponse.json(
            { error: 'Unsupported file type. Please upload a PDF or DOCX.' },
            { status: 400 }
          );
        }
      } else if (textInput) {
        rawText = textInput;
      } else {
        return NextResponse.json({ error: 'No file or text provided.' }, { status: 400 });
      }
    } else if (contentType.includes('application/json')) {
      const body = await request.json();
      rawText = body.text ?? '';
    } else {
      return NextResponse.json({ error: 'Unsupported content type.' }, { status: 415 });
    }

    if (!rawText || rawText.trim().length < 10) {
      return NextResponse.json({ error: 'Resume text is too short or empty.' }, { status: 400 });
    }

    // Groq LLM: Markdown → structured ResumeData JSON
    resume = await parseResumeText(rawText);

    const response: ParseResponse = { resume, rawText };
    return NextResponse.json(response);
  } catch (error) {
    console.error('[parse] Unexpected error:', error);
    const msg = error instanceof Error ? error.message : 'Internal server error during parsing.';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
