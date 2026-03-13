import { NextRequest, NextResponse } from 'next/server';
import { groqChatCompletion } from '@/lib/groqClient';
import { ResumeData } from '@/lib/types';
import {
  getAuthenticatedUserAndQuota,
  hasExceededGenerationQuota,
  incrementGenerationUsage,
} from '@/lib/server/quota';

const COVER_LETTER_SYSTEM = `You are an expert cover letter writer specializing in creating compelling, professional cover letters that highlight candidate strengths and align with job requirements.

CRITICAL GUIDELINES:
1. Write in first person (I, my, me)
2. Be specific - reference actual skills and experiences from the resume
3. Connect resume achievements to job requirements
4. Show enthusiasm and cultural fit
5. Keep it concise - 3-4 paragraphs maximum
6. Professional but personable tone
7. Avoid generic phrases like "I am writing to apply"
8. Focus on what you can offer, not just what you want

STRUCTURE:
1. Opening: Hook that shows you understand the role and company
2. Body 1: Highlight most relevant experience with specific achievements
3. Body 2: Connect skills to job requirements, show value you'll bring
4. Closing: Express enthusiasm and clear call-to-action

Return ONLY the cover letter text. No JSON. No extra formatting. Just the letter.`;

interface CoverLetterRequest {
  resume: ResumeData;
  jobDescription: string;
  companyName?: string;
  hiringManager?: string;
}

export async function POST(req: NextRequest) {
  try {
    const { userId, dbUser, serviceSupabase } = await getAuthenticatedUserAndQuota(req);
    if (hasExceededGenerationQuota(dbUser)) {
      return NextResponse.json({ error: 'quota_exceeded' }, { status: 403 });
    }

    const body: CoverLetterRequest = await req.json();
    const { resume, jobDescription, companyName, hiringManager } = body;

    if (!resume || !jobDescription) {
      return NextResponse.json(
        { error: 'Resume and job description are required' },
        { status: 400 }
      );
    }

    // Build resume summary for context
    const resumeSummary = buildResumeSummary(resume);
    
    const userMessage = `Generate a professional cover letter for this job application.

CANDIDATE INFORMATION:
Name: ${resume.personal?.name || 'Candidate'}
Email: ${resume.personal?.email || ''}
Phone: ${resume.personal?.phone || ''}
Location: ${resume.personal?.location || ''}

PROFESSIONAL SUMMARY:
${resume.summary || 'Not provided'}

KEY EXPERIENCE:
${resumeSummary}

JOB DESCRIPTION:
${jobDescription}

${companyName ? `COMPANY NAME: ${companyName}` : ''}
${hiringManager ? `HIRING MANAGER: ${hiringManager}` : 'HIRING MANAGER: Hiring Manager'}

Generate a compelling cover letter that:
- Opens with a strong hook showing understanding of the role
- Highlights 2-3 most relevant achievements from the experience
- Connects candidate's skills to specific job requirements
- Shows enthusiasm and cultural fit
- Ends with a clear call-to-action
- Is professional, specific, and personable
- Length: 300-400 words

Format:
[Your Name]
[Your Email] • [Your Phone]
[Your Location]

[Current Date]

[Hiring Manager Name]
[Company Name]

Dear [Hiring Manager Name],

[Letter content - 3-4 paragraphs]

Sincerely,
[Your Name]`;

    console.log('[generate-cover-letter] Calling Groq API...');
    
    const coverLetter = await groqChatCompletion(
      COVER_LETTER_SYSTEM,
      userMessage,
      2000,
      0.7 // Slightly higher temperature for more creative writing
    );

    if (!coverLetter || coverLetter.trim().length < 100) {
      throw new Error('Generated cover letter is too short or empty');
    }

    console.log('[generate-cover-letter] Cover letter generated successfully');

    await incrementGenerationUsage(serviceSupabase, userId, dbUser.generations_used ?? 0);

    return NextResponse.json({ coverLetter });

  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error instanceof Error && error.message === 'USER_NOT_FOUND') {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.error('[generate-cover-letter] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate cover letter' },
      { status: 500 }
    );
  }
}

function buildResumeSummary(resume: ResumeData): string {
  const parts: string[] = [];

  // Experience
  if (resume.experience && resume.experience.length > 0) {
    const exp = resume.experience.slice(0, 2); // Top 2 most recent
    exp.forEach(e => {
      parts.push(`\n${e.title} at ${e.company} (${e.startDate} - ${e.endDate})`);
      if (e.bullets && e.bullets.length > 0) {
        e.bullets.slice(0, 3).forEach(b => {
          parts.push(`  • ${b}`);
        });
      }
    });
  }

  // Skills
  if (resume.skills && resume.skills.length > 0) {
    parts.push(`\nKey Skills: ${resume.skills.slice(0, 10).join(', ')}`);
  }

  // Education
  if (resume.education && resume.education.length > 0) {
    const edu = resume.education[0];
    if (edu) {
      parts.push(`\nEducation: ${edu.degree} from ${edu.institution}`);
    }
  }

  return parts.join('\n');
}
