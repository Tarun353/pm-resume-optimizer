import { ResumeData } from './types';
import { generateResumeHTML } from './htmlTemplate';

export async function generateResumePDF(resume: ResumeData): Promise<Buffer> {
  const puppeteer = await import('puppeteer');
  
  let browser = null;

  try {
    // Use environment variable for Render, auto-detect locally
    const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
    
    console.log('[pdfGenerator] Launching browser...');
    if (executablePath) {
      console.log('[pdfGenerator] Using executable path:', executablePath);
    }
    
    browser = await puppeteer.default.launch({
      headless: true,
      executablePath: executablePath || undefined,
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

    // Set viewport to A4 dimensions
    await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 1 });

    const html = generateResumeHTML(resume);

    // Use 'domcontentloaded' instead of 'networkidle0' for speed
    await page.setContent(html, {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });

    // Give page a moment to settle
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

    console.log('[pdfGenerator] PDF generated successfully, size:', pdfBuffer.length);
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
