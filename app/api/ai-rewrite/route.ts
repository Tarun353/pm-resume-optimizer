import { NextRequest, NextResponse } from 'next/server';
import { groqChatCompletion } from '@/lib/groqClient';

export const runtime = 'nodejs';
export const maxDuration = 30;

interface AIRewriteRequest {
  text: string;
  instruction: string;
  context: {
    sectionType: 'summary' | 'bullet' | 'education' | 'skill' | 'certification' | 'award' | 'publication' | 'project' | 'generic';
    jobDescription?: string;
  };
}

// Context-aware system prompts for different section types
const SYSTEM_PROMPTS: Record<string, string> = {
  summary: `You are a professional resume writer. Rewrite the professional summary based on the user's instructions.

Rules:
- Keep it 3-4 sentences maximum
- Use power verbs (led, drove, architected, implemented)
- Sound professional but authentic
- Don't add fake metrics or claims
- Match the instruction's intent precisely`,

  bullet: `You are a resume optimization expert. Rewrite this bullet point based on the user's instructions.

Rules:
- Start with a power verb
- Keep it 1-2 lines maximum
- Add specific context when appropriate
- Only add metrics if clearly implied
- Sound credible, not exaggerated
- Follow the user's instruction exactly`,

  education: `You are a resume editor. Rewrite this education entry based on the user's instructions.

Rules:
- Keep it professional and factual
- Don't invent degrees or GPAs
- Maintain accuracy
- Follow the instruction precisely`,

  skill: `You are a technical writer. Rewrite this skill entry based on the user's instructions.

Rules:
- Keep it concise
- Use industry-standard terminology
- Don't exaggerate proficiency
- Follow the instruction`,

  certification: `You are a professional credentials writer. Rewrite this certification based on the user's instructions.

Rules:
- Keep it accurate and professional
- Use official certification names
- Don't invent credentials
- Follow the instruction`,

  award: `You are a professional achievements writer. Rewrite this award entry based on the user's instructions.

Rules:
- Keep it professional
- Don't exaggerate
- Highlight the significance appropriately
- Follow the instruction`,

  publication: `You are an academic writer. Rewrite this publication entry based on the user's instructions.

Rules:
- Maintain academic tone
- Keep citations accurate
- Don't embellish
- Follow the instruction`,

  project: `You are a technical project writer. Rewrite this project description based on the user's instructions.

Rules:
- Highlight technical skills and outcomes
- Be specific about technologies
- Don't exaggerate scope
- Follow the instruction`,

  generic: `You are a professional resume editor. Rewrite the text based on the user's instructions.

Rules:
- Keep it professional
- Don't add false information
- Maintain credibility
- Follow the instruction exactly`,
};

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: AIRewriteRequest = await request.json();

    if (!body.text || body.text.trim().length < 3) {
      return NextResponse.json(
        { error: 'Text is required and must be at least 3 characters.' },
        { status: 400 }
      );
    }

    if (!body.instruction || body.instruction.trim().length < 3) {
      return NextResponse.json(
        { error: 'Instruction is required and must be at least 3 characters.' },
        { status: 400 }
      );
    }

    const sectionType = body.context?.sectionType || 'generic';
    const systemPrompt = SYSTEM_PROMPTS[sectionType] || SYSTEM_PROMPTS.generic;

    // Build user message with context
    let userMessage = `Original text:\n${body.text}\n\nUser's instruction: ${body.instruction}\n\n`;

    // Add job description context if provided (helps with keyword matching)
    if (body.context?.jobDescription && body.context.jobDescription.length > 50) {
      userMessage += `Job Description Context (use to inform rewrite):\n${body.context.jobDescription.substring(0, 500)}...\n\n`;
    }

    userMessage += `Rewrite the original text following the user's instruction. Return ONLY the rewritten text, nothing else:`;

    console.log('[ai-rewrite] Processing request:', {
      sectionType,
      originalLength: body.text.length,
      instructionLength: body.instruction.length,
      hasJobContext: !!body.context?.jobDescription,
    });

    // Call Groq API
    const rewritten = await groqChatCompletion(
      systemPrompt,
      userMessage,
      500, // max tokens
      0.7  // temperature - creative but not too wild
    );

    const cleanedText = rewritten.trim();

    if (!cleanedText || cleanedText.length < 5) {
      return NextResponse.json(
        { error: 'AI returned empty response. Please try again.' },
        { status: 500 }
      );
    }

    console.log('[ai-rewrite] Success:', {
      originalLength: body.text.length,
      rewrittenLength: cleanedText.length,
    });

    return NextResponse.json({
      rewritten: cleanedText,
      original: body.text,
    });

  } catch (error) {
    console.error('[ai-rewrite] Error:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: `AI rewrite failed: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'AI rewrite failed. Please try again.' },
      { status: 500 }
    );
  }
}
