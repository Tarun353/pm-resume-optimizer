import { NextRequest, NextResponse } from 'next/server';
import { optimizeResume } from '@/lib/resumeOptimizer';
// Types defined inline since they aren't in lib/types
interface OptimizeRequest {
  resume: import('@/lib/types').ResumeData;
  jobDescription: string;
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

    const { optimizedResume, changes, keywordsInjected } = await optimizeResume(
      body.resume,
      body.jobDescription
    );

    const response: OptimizeResponse = {
      optimizedResume,
      changes,
      keywordsInjected,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[optimize] Error:', error);
    const message =
      error instanceof Error ? error.message : 'Internal server error during optimization.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
