import { NextRequest, NextResponse } from 'next/server';
import { ResumeData } from '@/lib/types';
import { generatePDF } from '@/lib/pdfGenerator';
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
  originalDocx?: string; // base64 encoded original DOCX
  originalResume?: ResumeData; // original parsed resume (before optimization)
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
        // Decode original DOCX from base64
        const originalBuffer = Buffer.from(body.originalDocx, 'base64');
        
        // Build text replacement map (original text → optimized text)
        const replacements = await matchOriginalToOptimized(
          originalBuffer,
          body.originalResume,
          body.resume
        );
        
        console.log('[generate-pdf] Found', replacements.size, 'text replacements');
        
        // Apply replacements to DOCX (preserves ALL formatting)
        const modifiedDocx = await simpleDocxReplace(originalBuffer, replacements);
        
        // Convert modified DOCX to PDF
        pdfBuffer = await convertDOCXtoPDF(modifiedDocx);
        
        console.log('[generate-pdf] DOCX template PDF generated successfully');
      } catch (error) {
        console.error('[generate-pdf] DOCX template mode failed:', error);
        
        // Fallback to HTML template if DOCX processing fails
        console.log('[generate-pdf] Falling back to HTML template');
        const html = generateResumeHTML(body.resume);
        pdfBuffer = await generatePDF(html);
      }
    } 
    // HTML Template Mode: Use our professional template
    else {
      console.log('[generate-pdf] HTML template mode');
      const html = generateResumeHTML(body.resume);
      pdfBuffer = await generatePDF(html);
    }

    return new NextResponse(pdfBuffer, {
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
