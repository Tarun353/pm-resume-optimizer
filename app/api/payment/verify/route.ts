import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getServiceSupabase } from '@/lib/supabase';

const PLAN_DURATIONS: Record<string, number> = {
  '1day': 1,
  '10days': 10,
  '1month': 30,
};

export async function POST(req: NextRequest) {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      planType,
    } = await req.json();

    // Verify signature
    const text = `${razorpay_order_id}|${razorpay_payment_id}`;
    const generated_signature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(text)
      .digest('hex');

    if (generated_signature !== razorpay_signature) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // Get user from payment record
    const supabase = getServiceSupabase();
    
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('user_id')
      .eq('razorpay_order_id', razorpay_order_id)
      .single();

    if (paymentError || !payment) {
      return NextResponse.json(
        { error: 'Payment record not found' },
        { status: 404 }
      );
    }

    // Update payment record
    await supabase
      .from('payments')
      .update({
        razorpay_payment_id,
        razorpay_signature,
        status: 'completed',
      })
      .eq('razorpay_order_id', razorpay_order_id);

    // Calculate expiry date
    const days = PLAN_DURATIONS[planType] || 1;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + days);

    // Update user subscription
    const { error: updateError } = await supabase
      .from('users')
      .update({
        subscription_type: 'paid',
        subscription_expires_at: expiresAt.toISOString(),
        downloads_used: 0, // Reset download count
      })
      .eq('id', payment.user_id);

    if (updateError) {
      console.error('Failed to update user subscription:', updateError);
      return NextResponse.json(
        { error: 'Failed to activate subscription' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Payment verification error:', error);
    return NextResponse.json(
      { error: 'Payment verification failed' },
      { status: 500 }
    );
  }
}
