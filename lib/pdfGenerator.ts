import { ResumeData } from './types';
import { generateResumeHTML } from './htmlTemplate';

export async function generateResumePDF(resume: ResumeData): Promise<Buffer> {
  // Detect if we're on Vercel/serverless
  const isProduction = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME;
  
  let browser = null;

  try {
    if (isProduction) {
      // Serverless environment - use puppeteer-core + chromium-min
      const puppeteerCore = await import('puppeteer-core');
      const chromium = await import('@sparticuz/chromium-min');
      
      browser = await puppeteerCore.default.launch({
        args: [
          ...chromium.default.args,
          '--hide-scrollbars',
          '--disable-web-security',
        ],
        defaultViewport: chromium.default.defaultViewport,
        executablePath: await chromium.default.executablePath(
          'https://github.com/Sparticuz/chromium/releases/download/v123.0.1/chromium-v123.0.1-pack.tar'
        ),
        headless: chromium.default.headless,
      });
    } else {
      // Local development - use regular puppeteer
      const puppeteer = await import('puppeteer');
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

    // Set viewport to A4 dimensions
    await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 1 });

    const html = generateResumeHTML(resume);

    await page.setContent(html, {
      waitUntil: 'networkidle0',
      timeout: 30000,
    });

    // networkidle0 above already waits for fonts and resources

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
