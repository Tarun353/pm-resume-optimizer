import { NextRequest, NextResponse } from 'next/server';
import { ResumeData } from '@/lib/types';
import { generateResumePDF } from '@/lib/pdfGenerator';
import { generateResumeHTML } from '@/lib/htmlTemplate';
import { 
  matchOriginalToOptimized, 
  simpleDocxReplace, 
  convertDOCXtoPDF 
} from '@/lib/docxProcessor';

export const runtime = 'nodejs';
export const maxDuration = 60;

interface GeneratePDFRequest {
  resume: ResumeData;
  originalDocx?: string;
  originalResume?: ResumeData;
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

    let pdfBuffer: Buffer;

    // DOCX Template Mode: Preserve original format
    if (body.originalDocx && body.originalResume) {
      console.log('[generate-pdf] DOCX template mode - preserving format');
      
      try {
        const originalBuffer = Buffer.from(body.originalDocx, 'base64');
        
        const replacements = await matchOriginalToOptimized(
          originalBuffer,
          body.originalResume,
          body.resume
        );
        
        console.log('[generate-pdf] Found', replacements.size, 'text replacements');
        
        const modifiedDocx = await simpleDocxReplace(originalBuffer, replacements);
        pdfBuffer = await convertDOCXtoPDF(modifiedDocx);
        
        console.log('[generate-pdf] DOCX template PDF generated successfully');
      } catch (error) {
        console.error('[generate-pdf] DOCX template mode failed:', error);
        console.log('[generate-pdf] Falling back to HTML template');
        const html = generateResumeHTML(body.resume);
        pdfBuffer = await generateResumePDF(body.resume);
      }
    } 
    // HTML Template Mode
    else {
      console.log('[generate-pdf] HTML template mode');
      pdfBuffer = await generateResumePDF(body.resume);
    }

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
