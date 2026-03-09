import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { supabase } from '@/lib/supabase';

export const runtime = 'nodejs';

const PLAN_PRICES: Record<string, number> = {
  '1day': 19,
  '10days': 49,
  '1month': 139,
};

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
    const body = await req.json();
    let { userId, plan } = body as { userId?: string; plan?: string };

    // Backward/defensive fallback: resolve userId from bearer token if body misses it.
    if (!userId) {
      const authHeader = req.headers.get('authorization');
      const token = authHeader?.startsWith('Bearer ') ? authHeader.replace('Bearer ', '') : null;
      if (token) {
        const { data: { user } } = await supabase.auth.getUser(token);
        userId = user?.id;
      }
    }

    if (!userId) {
      console.warn('[payment/create] Unauthorized: userId missing in request body');
      return new Response('Unauthorized', { status: 401 });
    }

    const amount = plan ? PLAN_PRICES[plan] : undefined;
    if (!amount) {
      console.warn('[payment/create] Invalid plan:', { userId, plan });
      return NextResponse.json({ error: 'Invalid plan selected' }, { status: 400 });
    }

    const razorpay = getRazorpayClient();

    console.log('[payment/create] Creating Razorpay order:', { userId, plan, amount });
    let order;
    try {
      order = await razorpay.orders.create({
        amount: amount * 100,
        currency: 'INR',
        receipt: buildReceipt(userId),
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
        user_id: userId,
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
