import { NextRequest, NextResponse } from 'next/server';
import { optimizeResume } from '@/lib/resumeOptimizer';
import {
  getAuthenticatedUserAndQuota,
  hasExceededGenerationQuota,
  incrementGenerationUsage,
} from '@/lib/server/quota';

interface OptimizeRequest {
  resume: import('@/lib/types').ResumeData;
  jobDescription: string;
  pmProfile?: string;
}

interface OptimizeResponse {
  optimizedResume: import('@/lib/types').ResumeData;
  changes: string[];
  keywordsInjected: string[];
}

export const runtime = 'nodejs';
export const maxDuration = 120;

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { userId, dbUser, serviceSupabase } = await getAuthenticatedUserAndQuota(request);

    if (hasExceededGenerationQuota(dbUser)) {
      return NextResponse.json({ error: 'quota_exceeded' }, { status: 403 });
    }

    const body: OptimizeRequest = await request.json();

    if (!body.resume) {
      return NextResponse.json(
        { error: 'Resume data is required.' },
        { status: 400 }
      );
    }

    if (!body.jobDescription || body.jobDescription.trim().length < 20) {
      return NextResponse.json(
        { error: 'Job description is required and must be at least 20 characters.' },
        { status: 400 }
      );
    }

    // Validate persona — default to 'experienced' if missing or invalid
    const validPersonas = ['aspiring', 'transitioning', 'experienced'];
    const pmProfile = validPersonas.includes(body.pmProfile ?? '')
      ? body.pmProfile!
      : 'experienced';

    const { optimizedResume, changes, keywordsInjected } = await optimizeResume(
      body.resume,
      body.jobDescription,
      pmProfile
    );

    const response: OptimizeResponse = {
      optimizedResume,
      changes,
      keywordsInjected,
    };

    await incrementGenerationUsage(
      serviceSupabase,
      userId,
      dbUser.generations_used ?? dbUser.downloads_used ?? 0
    );

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error instanceof Error && error.message === 'USER_NOT_FOUND') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.error('[optimize] Error:', error);

    const message =
      error instanceof Error ? error.message : 'Internal server error during optimization.';

    // All AI providers (Groq → Gemini → Mistral → Cohere → HuggingFace) exhausted
    if (message.toLowerCase().includes('all ai providers exhausted')) {
      return NextResponse.json(
        {
          error:
            'All AI providers are currently rate-limited. Please wait a few seconds and try again.',
        },
        { status: 503 }
      );
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
