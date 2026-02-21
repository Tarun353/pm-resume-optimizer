import { ResumeData } from './types';
import { generateResumeHTML } from './htmlTemplate';

export async function generateResumePDF(resume: ResumeData): Promise<Buffer> {
  const puppeteer = await import('puppeteer');
  
  let browser = null;

  try {
    browser = await puppeteer.default.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process',
      ],
    });

    const page = await browser.newPage();

    await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 1 });

    const html = generateResumeHTML(resume);

    await page.setContent(html, {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });

    await new Promise(resolve => setTimeout(resolve, 500));

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '0mm',
        right: '0mm',
        bottom: '0mm',
        left: '0mm',
      },
      preferCSSPageSize: false,
    });

    return Buffer.from(pdfBuffer);
  } catch (error) {
    console.error('[generateResumePDF] Error:', error);
    throw new Error(
      error instanceof Error 
        ? `PDF generation failed: ${error.message}` 
        : 'PDF generation failed'
    );
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch (closeError) {
        console.error('[generateResumePDF] Error closing browser:', closeError);
      }
    }
  }
}