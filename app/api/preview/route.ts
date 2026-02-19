import { NextRequest, NextResponse } from 'next/server';
import { ResumeData } from '@/lib/types';
import { generateResumeHTML } from '@/lib/htmlTemplate';

export const runtime = 'nodejs';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: { resume: ResumeData } = await request.json();

    if (!body.resume) {
      return NextResponse.json(
        { error: 'Resume data is required.' },
        { status: 400 }
      );
    }

    // Generate HTML
    const html = generateResumeHTML(body.resume);

    // Return as plain text/HTML
    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  } catch (error) {
    console.error('[preview] Error generating HTML:', error);
    return NextResponse.json(
      { error: 'Failed to generate preview.' },
      { status: 500 }
    );
  }
}
