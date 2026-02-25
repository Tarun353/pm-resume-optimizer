import { NextRequest, NextResponse } from 'next/server';
import { supabase, getServiceSupabase } from '@/lib/supabase';

const FREE_DOWNLOADS = 5;

export async function POST(req: NextRequest) {
  try {
    const { type } = await req.json(); // 'resume' or 'coverletter'

    // Get user from auth header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const serviceSupabase = getServiceSupabase();

    // Get user profile
    const { data: dbUser, error: userError } = await serviceSupabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (userError || !dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user has active subscription
    const now = new Date();
    const hasActiveSubscription =
      dbUser.subscription_type === 'paid' &&
      dbUser.subscription_expires_at &&
      new Date(dbUser.subscription_expires_at) > now;

    // If no active subscription, check free downloads
    if (!hasActiveSubscription) {
      if (dbUser.downloads_used >= FREE_DOWNLOADS) {
        return NextResponse.json(
          {
            allowed: false,
            reason: 'limit_exceeded',
            downloadsUsed: dbUser.downloads_used,
            freeLimit: FREE_DOWNLOADS,
          },
          { status: 403 }
        );
      }
    }

    // Record download
    await serviceSupabase.from('downloads').insert({
      user_id: user.id,
      type: type,
    });

    // Increment download counter
    await serviceSupabase
      .from('users')
      .update({
        downloads_used: dbUser.downloads_used + 1,
      })
      .eq('id', user.id);

    return NextResponse.json({
      allowed: true,
      downloadsRemaining: hasActiveSubscription
        ? 'unlimited'
        : FREE_DOWNLOADS - (dbUser.downloads_used + 1),
    });
  } catch (error) {
    console.error('Download tracking error:', error);
    return NextResponse.json(
      { error: 'Failed to track download' },
      { status: 500 }
    );
  }
}

// Check download status without incrementing
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const serviceSupabase = getServiceSupabase();

    const { data: dbUser, error: userError } = await serviceSupabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (userError || !dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const now = new Date();
    const hasActiveSubscription =
      dbUser.subscription_type === 'paid' &&
      dbUser.subscription_expires_at &&
      new Date(dbUser.subscription_expires_at) > now;

    return NextResponse.json({
      downloadsUsed: dbUser.downloads_used,
      freeLimit: FREE_DOWNLOADS,
      hasActiveSubscription,
      subscriptionExpiresAt: dbUser.subscription_expires_at,
      canDownload: hasActiveSubscription || dbUser.downloads_used < FREE_DOWNLOADS,
    });
  } catch (error) {
    console.error('Download status check error:', error);
    return NextResponse.json(
      { error: 'Failed to check download status' },
      { status: 500 }
    );
  }
}
