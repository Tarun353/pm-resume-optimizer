/**
 * coverLetterTemplate.ts - Professional Cover Letter HTML Template
 * Clean, ATS-friendly format for cover letters
 */

export function generateCoverLetterHTML(coverLetterText: string): string {
  // Basic escaping
  function esc(s: string | undefined | null): string {
    if (!s) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // Convert line breaks to paragraphs
  const paragraphs = coverLetterText
    .split('\n\n')
    .filter(p => p.trim().length > 0)
    .map(p => `<p class="paragraph">${esc(p.trim())}</p>`)
    .join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Cover Letter</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');
  
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }
  
  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-size: 11pt;
    line-height: 1.6;
    color: #1a1a1a;
    background: #ffffff;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  
  .page {
    max-width: 8.5in;
    margin: 0 auto;
    padding: 1in 1in;
    background: #ffffff;
  }
  
  .paragraph {
    margin-bottom: 14pt;
    text-align: left;
  }
  
  .paragraph:last-child {
    margin-bottom: 0;
  }
  
  /* Special formatting for header (name, contact) */
  .header-line {
    font-weight: 600;
    margin-bottom: 4pt;
  }
  
  /* Special formatting for date and address */
  .date-line {
    margin-top: 20pt;
    margin-bottom: 20pt;
  }
  
  /* Special formatting for greeting */
  .greeting {
    font-weight: 500;
    margin-bottom: 14pt;
  }
  
  /* Special formatting for closing */
  .closing {
    margin-top: 20pt;
    font-weight: 500;
  }
  
  @page {
    size: Letter;
    margin: 0;
  }
  
  @media print {
    body {
      font-size: 11pt;
    }
    
    .page {
      padding: 0.75in 1in;
      max-width: 100%;
    }
  }
</style>
</head>
<body>
<div class="page">
  ${paragraphs}
</div>
</body>
</html>`;
}
