import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

const PLAN_PRICES: Record<string, number> = {
  '1day': 19,
  '10days': 49,
  '1month': 139,
};

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error('Supabase credentials not configured');
  }

  return createClient(url, serviceKey);
}

function getRazorpayClient(): Razorpay {
  const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    console.error('[payment/create] Missing Razorpay env vars:', {
      hasKeyId: !!keyId,
      hasKeySecret: !!keySecret,
    });
    throw new Error('Razorpay credentials not configured');
  }

  console.log('[payment/create] Initializing Razorpay client');
  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
}

function buildReceipt(userId: string): string {
  // Razorpay receipt must be <= 40 chars.
  const shortUser = userId.replace(/-/g, '').slice(-8);
  const ts = Date.now().toString(36);
  return `ord_${shortUser}_${ts}`;
}

export async function POST(req: NextRequest) {
  try {
    const supabase = getServiceSupabase();

    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.replace('Bearer ', '') : null;
    if (!token) {
      console.warn('[payment/create] Unauthorized: missing bearer token');
      return new Response('Unauthorized', { status: 401 });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      console.warn('[payment/create] Unauthorized: invalid bearer token', authError);
      return new Response('Unauthorized', { status: 401 });
    }

    const body = await req.json() as { plan?: string; planType?: string };
    const plan = body.plan ?? body.planType;

    const amount = plan ? PLAN_PRICES[plan] : undefined;
    if (!amount) {
      console.warn('[payment/create] Invalid plan:', { userId: user.id, plan });
      return NextResponse.json({ error: 'Invalid plan selected' }, { status: 400 });
    }

    const razorpay = getRazorpayClient();

    console.log('[payment/create] Creating Razorpay order:', { userId: user.id, plan, amount });
    let order;
    try {
      order = await razorpay.orders.create({
        amount: amount * 100,
        currency: 'INR',
        receipt: buildReceipt(user.id),
      });
    } catch (rzpError) {
      console.error('[payment/create] Razorpay order create failed:', rzpError);
      const message =
        (rzpError as any)?.error?.description ||
        (rzpError as any)?.error?.reason ||
        (rzpError as Error)?.message ||
        'Razorpay order creation failed';
      return NextResponse.json({ error: message }, { status: 500 });
    }
    console.log('[payment/create] Razorpay order created:', { orderId: order.id, amount: order.amount });

    // Best-effort DB write: do not fail order creation response if this insert fails.
    const { error: dbError } = await supabase
      .from('payments')
      .insert({
        user_id: user.id,
        amount,
        plan_type: plan,
        razorpay_order_id: order.id,
        status: 'pending',
      });

    if (dbError) {
      console.error('[payment/create] Failed to save payment record (continuing):', dbError);
    }

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (error) {
    console.error('[payment/create] Payment creation error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to create payment order',
      },
      { status: 500 }
    );
  }
}
