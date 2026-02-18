import { NextRequest, NextResponse } from 'next/server';
import { generateResumePDF } from '@/lib/pdfGenerator';
import { ResumeData } from '@/lib/types';

export const runtime = 'nodejs';
export const maxDuration = 60; // Vercel Hobby: max 10s, Pro: max 60s

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: { resume: ResumeData } = await request.json();

    if (!body.resume) {
      return NextResponse.json(
        { error: 'Resume data is required.' },
        { status: 400 }
      );
    }

    let pdfBuffer: Buffer;
    try {
      pdfBuffer = await generateResumePDF(body.resume);
    } catch (pdfError) {
      console.error('[generate-pdf] PDF generation error:', pdfError);
      const msg = pdfError instanceof Error ? pdfError.message : 'PDF generation failed';
      return NextResponse.json(
        { error: msg },
        { status: 500 }
      );
    }

    const candidateName = body.resume.personal?.name
      ? body.resume.personal.name.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_')
      : 'Resume';

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${candidateName}_ATS_Optimized.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('[generate-pdf] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error during PDF generation.' },
      { status: 500 }
    );
  }
}
