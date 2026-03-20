import { NextRequest, NextResponse } from 'next/server';
import { buildRecruiterSimulation, DEFAULT_ADVANCED_INSIGHTS_RESPONSE } from '@/lib/advancedInsights';
import { isAdvancedAnalysisEnabled } from '@/utils/featureFlags';

export async function POST(req: NextRequest) {
  try {
    const { resumeText = '', jdText = '', profile = 'experienced' } = await req.json();

    if (!isAdvancedAnalysisEnabled()) {
      return NextResponse.json(await buildRecruiterSimulation('', '', profile));
    }

    if (typeof resumeText !== 'string' || resumeText.trim().length < 100) {
      return NextResponse.json({ error: 'resume_too_short' }, { status: 400 });
    }

    const response = await buildRecruiterSimulation(resumeText, typeof jdText === 'string' ? jdText : '', profile);
    return NextResponse.json(response);
  } catch (error) {
    console.error('[api/simulate-recruiter] Failed to simulate recruiter search.', error);
    return NextResponse.json(DEFAULT_ADVANCED_INSIGHTS_RESPONSE);
  }
}
