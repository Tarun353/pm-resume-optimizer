import { NextRequest, NextResponse } from 'next/server';
import { ResumeData } from '@/lib/types';
import puppeteer from 'puppeteer';
import { generateResumeHTML } from '@/lib/htmlTemplate';

export const runtime = 'nodejs';
export const maxDuration = 60;

interface GeneratePDFRequest {
  resume: ResumeData;
  originalDocx?: string; // base64 encoded original DOCX
  originalResume?: ResumeData; // original parsed resume (before optimization)
}

// Generate PDF from HTML using Puppeteer
async function generatePDFFromHTML(html: string): Promise<Buffer> {
  const browser = await puppeteer.launch({
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

// DOCX format preservation functions
async function matchOriginalToOptimized(
  originalResume: ResumeData,
  optimizedResume: ResumeData
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  
  // Match summary
  if (originalResume.summary !== optimizedResume.summary) {
    map.set(originalResume.summary, optimizedResume.summary);
  }
  
  // Match experience bullets
  for (let i = 0; i < originalResume.experience.length; i++) {
    const origExp = originalResume.experience[i];
    const optExp = optimizedResume.experience[i];
    
    if (origExp && optExp) {
      for (let j = 0; j < origExp.bullets.length; j++) {
        const origBullet = origExp.bullets[j];
        const optBullet = optExp.bullets[j];
        
        if (origBullet && optBullet && origBullet !== optBullet) {
          map.set(origBullet, optBullet);
        }
      }
    }
  }
  
  // Match internship bullets
  if (originalResume.internships && optimizedResume.internships) {
    for (let i = 0; i < originalResume.internships.length; i++) {
      const origInt = originalResume.internships[i];
      const optInt = optimizedResume.internships[i];
      
      if (origInt && optInt) {
        for (let j = 0; j < origInt.bullets.length; j++) {
          const origBullet = origInt.bullets[j];
          const optBullet = optInt.bullets[j];
          
          if (origBullet && optBullet && origBullet !== optBullet) {
            map.set(origBullet, optBullet);
          }
        }
      }
    }
  }
  
  return map;
}

async function simpleDocxReplace(
  originalBuffer: Buffer,
  replacements: Map<string, string>
): Promise<Buffer> {
  const AdmZip = require('adm-zip');
  
  try {
    const zip = new AdmZip(originalBuffer);
    let documentXML = zip.readAsText('word/document.xml');
    
    console.log('[simpleDocxReplace] Starting text replacement...');
    console.log('[simpleDocxReplace] Found', replacements.size, 'replacements to make');
    
    // Sort replacements by length (longest first to avoid partial replacements)
    const sortedReplacements = Array.from(replacements.entries())
      .sort((a, b) => b[0].length - a[0].length);
    
    // Apply each replacement
    let replacementCount = 0;
    for (const [oldText, newText] of sortedReplacements) {
      if (oldText && newText && documentXML.includes(oldText)) {
        documentXML = documentXML.split(oldText).join(newText);
        replacementCount++;
        console.log(`[simpleDocxReplace] Replaced: "${oldText.substring(0, 50)}..." → "${newText.substring(0, 50)}..."`);
      }
    }
    
    console.log(`[simpleDocxReplace] Completed ${replacementCount} replacements`);
    
    // Update the document
    zip.updateFile('word/document.xml', Buffer.from(documentXML, 'utf-8'));
    
    return zip.toBuffer();
  } catch (error) {
    console.error('[simpleDocxReplace] Error:', error);
    throw error;
  }
}

async function convertDOCXtoPDF(docxBuffer: Buffer): Promise<Buffer> {
  // NOTE: This requires LibreOffice on the server
  // For local testing, this will fail - that's expected
  try {
    const libre = require('libreoffice-convert');
    const { promisify } = require('util');
    const convertAsync = promisify(libre.convert);
    
    console.log('[convertDOCXtoPDF] Converting DOCX to PDF...');
    
    const pdfBuffer = await convertAsync(docxBuffer, '.pdf', undefined);
    
    console.log('[convertDOCXtoPDF] Conversion successful');
    return pdfBuffer as Buffer;
  } catch (error) {
    console.error('[convertDOCXtoPDF] Error:', error);
    console.log('[convertDOCXtoPDF] LibreOffice not available - falling back to HTML template');
    throw error;
  }
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
      console.log('[generate-pdf] DOCX template mode - attempting format preservation');
      
      try {
        // Decode original DOCX from base64
        const originalBuffer = Buffer.from(body.originalDocx, 'base64');
        console.log('[generate-pdf] Original DOCX decoded, size:', originalBuffer.length);
        
        // Build text replacement map (original text → optimized text)
        const replacements = await matchOriginalToOptimized(
          body.originalResume,
          body.resume
        );
        
        console.log('[generate-pdf] Found', replacements.size, 'text replacements');
        
        if (replacements.size === 0) {
          console.log('[generate-pdf] WARNING: No text replacements found! Using HTML fallback.');
          throw new Error('No replacements found');
        }
        
        // Apply replacements to DOCX (preserves ALL formatting)
        const modifiedDocx = await simpleDocxReplace(originalBuffer, replacements);
        console.log('[generate-pdf] Text replacements applied, modified DOCX size:', modifiedDocx.length);
        
        // Convert modified DOCX to PDF
        pdfBuffer = await convertDOCXtoPDF(modifiedDocx);
        
        console.log('[generate-pdf] DOCX template PDF generated successfully');
      } catch (error) {
        console.error('[generate-pdf] DOCX template mode failed:', error);
        
        // Fallback to HTML template if DOCX processing fails
        console.log('[generate-pdf] Falling back to HTML template');
        const html = generateResumeHTML(body.resume);
        pdfBuffer = await generatePDFFromHTML(html);
      }
    } 
    // HTML Template Mode: Use our professional template
    else {
      console.log('[generate-pdf] HTML template mode');
      const html = generateResumeHTML(body.resume);
      pdfBuffer = await generatePDFFromHTML(html);
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
