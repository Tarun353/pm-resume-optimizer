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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (error instanceof Error && error.message === 'USER_NOT_FOUND') {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.error('[quota/check] Error:', error);
    return NextResponse.json({ error: 'Failed to check quota' }, { status: 500 });
  }
}
