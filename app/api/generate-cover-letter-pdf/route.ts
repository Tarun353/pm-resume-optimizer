import { NextRequest, NextResponse } from 'next/server';
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

    console.log('[generate-cover-letter-pdf] Generating PDF with Puppeteer...');
    
    // Generate PDF using Puppeteer directly
    const puppeteer = await import('puppeteer');
    
    const browser = await puppeteer.default.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'Letter',
      printBackground: true,
      margin: {
        top: '0',
        right: '0',
        bottom: '0',
        left: '0',
      },
    });

    await browser.close();

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
