import { NextRequest, NextResponse } from 'next/server';
import { generatePDF } from '@/lib/pdfGenerator';
import { generateCoverLetterHTML } from '@/lib/coverLetterTemplate';

interface CoverLetterPDFRequest {
  coverLetter: string;
  fileName?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: CoverLetterPDFRequest = await req.json();
    const { coverLetter, fileName } = body;

    if (!coverLetter || typeof coverLetter !== 'string') {
      return NextResponse.json(
        { error: 'Cover letter text is required' },
        { status: 400 }
      );
    }

    console.log('[generate-cover-letter-pdf] Generating HTML...');
    const html = generateCoverLetterHTML(coverLetter);

    console.log('[generate-cover-letter-pdf] Generating PDF...');
    const pdfBuffer = await generatePDF(html);

    const filename = fileName || 'Cover_Letter.pdf';

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });

  } catch (error) {
    console.error('[generate-cover-letter-pdf] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}
