import { ResumeData } from './types';
import { generateResumeHTML } from './htmlTemplate';

export async function generateResumePDF(resume: ResumeData): Promise<Buffer> {
  const puppeteer = await import('puppeteer');
  
  // Detect if we're on Vercel (serverless)
  const isProduction = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME;
  
  let browser: Awaited<ReturnType<typeof puppeteer.default.launch>> | null = null;

  try {
    if (isProduction) {
      // Serverless environment - use @sparticuz/chromium
      const chromium = await import('@sparticuz/chromium');
      
      browser = await puppeteer.default.launch({
        args: chromium.default.args,
        defaultViewport: chromium.default.defaultViewport,
        executablePath: await chromium.default.executablePath(),
        headless: chromium.default.headless,
      });
    } else {
      // Local development - use system Chrome
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
        ],
      });
    }

    const page = await browser.newPage();

    // Set viewport to A4 dimensions at 96 DPI
    await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 1 });

    const html = generateResumeHTML(resume);

    await page.setContent(html, {
      waitUntil: 'networkidle0',
      timeout: 30000,
    });

    // Wait for fonts to load
    await page.evaluateHandle('document.fonts.ready');

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
