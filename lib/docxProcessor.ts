/**
 * docxProcessor.ts - DOCX Format Preservation
 * 
 * This module handles:
 * - Reading DOCX structure
 * - Finding and replacing text while preserving formatting
 * - Converting modified DOCX to PDF
 * 
 * ALL formatting is preserved: fonts, colors, spacing, tables, images
 */

import { ResumeData } from './types';

// We'll use these libraries (add to package.json):
// - docx: Read/write DOCX files
// - mammoth: Already have for text extraction

interface DocxParagraph {
  text: string;
  isBold: boolean;
  isList: boolean;
  originalIndex: number;
}

/**
 * Parse DOCX and extract structured paragraphs
 */
export async function parseDOCXStructure(buffer: Buffer): Promise<DocxParagraph[]> {
  // Import docx library
  const AdmZip = require('adm-zip');
  const xml2js = require('xml2js');
  
  try {
    const zip = new AdmZip(buffer);
    const documentXML = zip.readAsText('word/document.xml');
    
    const parser = new xml2js.Parser();
    const result = await parser.parseStringPromise(documentXML);
    
    const paragraphs: DocxParagraph[] = [];
    const body = result['w:document']['w:body'][0];
    
    if (!body['w:p']) return paragraphs;
    
    body['w:p'].forEach((p: any, index: number) => {
      const textRuns = p['w:r'] || [];
      let text = '';
      let isBold = false;
      
      textRuns.forEach((run: any) => {
        if (run['w:t']) {
          const textContent = Array.isArray(run['w:t']) 
            ? run['w:t'].map((t: any) => t._ || t).join('')
            : run['w:t'][0]?._ || run['w:t'][0] || '';
          text += textContent;
        }
        
        // Check if bold
        if (run['w:rPr']?.[0]?.['w:b']) {
          isBold = true;
        }
      });
      
      // Check if list item
      const isList = !!p['w:pPr']?.[0]?.['w:numPr'];
      
      if (text.trim()) {
        paragraphs.push({
          text: text.trim(),
          isBold,
          isList,
          originalIndex: index,
        });
      }
    });
    
    return paragraphs;
  } catch (error) {
    console.error('[parseDOCXStructure] Error:', error);
    return [];
  }
}

/**
 * Replace text in DOCX while preserving ALL formatting
 */
export async function replaceTextInDOCX(
  originalBuffer: Buffer,
  optimizedResume: ResumeData
): Promise<Buffer> {
  const PizZip = require('pizzip');
  const Docxtemplater = require('docxtemplater');
  
  try {
    console.log('[replaceTextInDOCX] Starting text replacement...');
    
    // Load DOCX
    const zip = new PizZip(originalBuffer);
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });
    
    // Build replacement map
    const replacements = buildReplacementMap(originalBuffer, optimizedResume);
    
    // Get XML content
    const AdmZip = require('adm-zip');
    const admZip = new AdmZip(originalBuffer);
    let documentXML = admZip.readAsText('word/document.xml');
    
    // Replace text while preserving formatting
    replacements.forEach(({ oldText, newText }) => {
      if (oldText && newText && oldText !== newText) {
        // Escape XML special characters
        const escapedOld = escapeXML(oldText);
        const escapedNew = escapeXML(newText);
        
        // Replace in XML (maintains all formatting tags)
        documentXML = documentXML.replace(
          new RegExp(escapedOld, 'g'),
          escapedNew
        );
      }
    });
    
    // Write modified XML back
    admZip.updateFile('word/document.xml', Buffer.from(documentXML, 'utf-8'));
    
    return admZip.toBuffer();
  } catch (error) {
    console.error('[replaceTextInDOCX] Error:', error);
    throw new Error('Failed to modify DOCX: ' + (error as Error).message);
  }
}

/**
 * Build map of old text → new text replacements
 */
function buildReplacementMap(
  originalBuffer: Buffer,
  optimizedResume: ResumeData
): Array<{ oldText: string; newText: string }> {
  const replacements: Array<{ oldText: string; newText: string }> = [];
  
  // Note: This is a simplified version
  // In production, we'd need more sophisticated matching
  
  // Add summary replacement (if changed)
  // Add bullet replacements (if changed)
  // etc.
  
  // For now, we'll extract the original text and match it to optimized text
  // This will be enhanced in the full implementation
  
  return replacements;
}

/**
 * Escape XML special characters
 */
function escapeXML(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Convert DOCX to PDF using LibreOffice
 */
export async function convertDOCXtoPDF(docxBuffer: Buffer): Promise<Buffer> {
  const libre = require('libreoffice-convert');
  const { promisify } = require('util');
  const convertAsync = promisify(libre.convert);
  
  try {
    console.log('[convertDOCXtoPDF] Converting DOCX to PDF...');
    
    const pdfBuffer = await convertAsync(docxBuffer, '.pdf', undefined);
    
    console.log('[convertDOCXtoPDF] Conversion successful');
    return pdfBuffer as Buffer;
  } catch (error) {
    console.error('[convertDOCXtoPDF] Error:', error);
    throw new Error('DOCX to PDF conversion failed: ' + (error as Error).message);
  }
}

/**
 * Smart text matching - finds original text that matches optimized content
 */
export async function matchOriginalToOptimized(
  originalBuffer: Buffer,
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

/**
 * Simple DOCX text replacement (fallback method)
 * Replaces text while trying to preserve basic formatting
 */
export async function simpleDocxReplace(
  originalBuffer: Buffer,
  replacements: Map<string, string>
): Promise<Buffer> {
  const AdmZip = require('adm-zip');
  
  try {
    const zip = new AdmZip(originalBuffer);
    let documentXML = zip.readAsText('word/document.xml');
    
    // Sort replacements by length (longest first to avoid partial replacements)
    const sortedReplacements = Array.from(replacements.entries())
      .sort((a, b) => b[0].length - a[0].length);
    
    // Apply each replacement
    for (const [oldText, newText] of sortedReplacements) {
      if (oldText && newText) {
        // Simple text replacement in XML
        // This preserves the XML structure and formatting tags
        documentXML = documentXML.split(oldText).join(newText);
      }
    }
    
    // Update the document
    zip.updateFile('word/document.xml', Buffer.from(documentXML, 'utf-8'));
    
    return zip.toBuffer();
  } catch (error) {
    console.error('[simpleDocxReplace] Error:', error);
    throw error;
  }
}
