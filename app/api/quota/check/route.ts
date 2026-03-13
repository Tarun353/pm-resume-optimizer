import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUserAndQuota, hasExceededGenerationQuota } from '@/lib/server/quota';

export async function GET(req: NextRequest) {
  try {
    const { dbUser } = await getAuthenticatedUserAndQuota(req);

    const generationsUsed = dbUser.generations_used ?? 0;
    const generationLimit = dbUser.generation_limit ?? null;
    const quotaExceeded = hasExceededGenerationQuota(dbUser);

    return NextResponse.json({
      quotaExceeded,
      generationsUsed,
      generationLimit,
      canGenerate: !quotaExceeded,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      // Return 401 so the frontend can handle it specifically (re-prompt login)
      return NextResponse.json({ error: 'Please sign in to continue.' }, { status: 401 });
    }

    if (error instanceof Error && error.message === 'USER_NOT_FOUND') {
      // Profile row missing — treat as auth failure so the frontend shows
      // a sign-in prompt rather than the raw "User not found" string.
      return NextResponse.json({ error: 'Please sign in to continue.' }, { status: 401 });
    }

    console.error('[quota/check] Error:', error);
    return NextResponse.json({ error: 'Failed to check quota. Please try again.' }, { status: 500 });
  }
}
