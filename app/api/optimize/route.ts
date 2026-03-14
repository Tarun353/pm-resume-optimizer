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

    const pmProfile = body.pmProfile || 'experienced';

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

    await incrementGenerationUsage(serviceSupabase, userId, dbUser.generations_used ?? dbUser.downloads_used ?? 0);

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
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
