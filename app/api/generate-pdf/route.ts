import { NextRequest, NextResponse } from 'next/server';
import { ResumeData } from '@/lib/types';
import puppeteer from 'puppeteer';
import { generateResumeHTML } from '@/lib/htmlTemplate';

export const runtime = 'nodejs';
export const maxDuration = 60;

interface GeneratePDFRequest {
  resume: ResumeData;
}

async function generatePDF(html: string): Promise<Buffer> {
  // Use Google Chrome on production (Render), auto-detect locally
  const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH || 
                         (process.platform === 'linux' ? '/usr/bin/google-chrome-stable' : undefined);
  
  console.log('[generatePDF] Using Chrome at:', executablePath || 'auto-detect');
  
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: executablePath,
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
    format: 'A4',
    printBackground: true,
    margin: {
      top: '0.5in',
      right: '0.5in',
      bottom: '0.5in',
      left: '0.5in',
    },
  });

  await browser.close();
  return pdfBuffer as Buffer;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: GeneratePDFRequest = await request.json();

    if (!body.resume) {
      return NextResponse.json(
        { error: 'Resume data is required.' },
        { status: 400 }
      );
    }

    console.log('[generate-pdf] Generating PDF with professional template');
    
    const html = generateResumeHTML(body.resume);
    const pdfBuffer = await generatePDF(html);

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="resume.pdf"',
      },
    });
  } catch (error) {
    console.error('[generate-pdf] Error:', error);
    const msg = error instanceof Error ? error.message : 'PDF generation failed.';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
