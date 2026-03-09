import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const PLAN_PRICES: Record<string, number> = {
  '1day': 19,
  '10days': 49,
  '1month': 139,
};

// Lazy initialize Razorpay only when needed
function getRazorpayClient() {
  const Razorpay = require('razorpay');
  
  const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  
  if (!keyId || !keySecret) {
    throw new Error('Razorpay credentials not configured');
  }
  
  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, plan } = body;

    if (!userId) {
      return new Response('Unauthorized', { status: 401 });
    }

    const amount = PLAN_PRICES[plan];
    if (!amount) {
      return NextResponse.json({ error: 'Invalid plan selected' }, { status: 400 });
    }

    // Initialize Razorpay client only when needed
    const razorpay = getRazorpayClient();

    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount: amount * 100, // Amount in paise
      currency: 'INR',
      receipt: `order_${userId}_${Date.now()}`,
    });

    // Save payment record
    const { error: dbError } = await supabase
      .from('payments')
      .insert({
        user_id: userId,
        amount: amount,
        plan_type: plan,
        razorpay_order_id: order.id,
        status: 'pending',
      });

    if (dbError) {
      console.error('Failed to save payment record:', dbError);
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
    }

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (error) {
    console.error('Payment creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create payment order' },
      { status: 500 }
    );
  }
}
