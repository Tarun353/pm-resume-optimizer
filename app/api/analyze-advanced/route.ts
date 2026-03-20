import { NextRequest, NextResponse } from 'next/server';
import { buildAdvancedInsights, buildDefaultAdvancedInsightsResponse } from '@/lib/advancedInsights';
import { isAdvancedAnalysisEnabled } from '@/utils/featureFlags';

export async function POST(req: NextRequest) {
  try {
    const { resumeText = '', jdText = '', profile = 'experienced' } = await req.json();

    if (!isAdvancedAnalysisEnabled()) {
      return NextResponse.json(await buildAdvancedInsights('', '', profile));
    }

    if (typeof resumeText !== 'string' || resumeText.trim().length < 100) {
      return NextResponse.json({ error: 'resume_too_short' }, { status: 400 });
    }

    const response = await buildAdvancedInsights(resumeText, typeof jdText === 'string' ? jdText : '', profile);
    return NextResponse.json(response);
  } catch (error) {
    console.error('[api/analyze-advanced] Failed to build advanced insights.', error);
    return NextResponse.json(buildDefaultAdvancedInsightsResponse());
  }
}
