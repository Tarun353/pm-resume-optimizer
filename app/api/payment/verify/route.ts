import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'
import Razorpay from 'razorpay'

const PLAN_DURATIONS: Record<string, number> = {
  '1day': 1,
  '10days': 10,
  '1month': 30,
}

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    throw new Error('Supabase credentials not configured')
  }

  return createClient(url, serviceKey)
}

function getRazorpayClient() {
  const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
  const keySecret = process.env.RAZORPAY_KEY_SECRET

  if (!keyId || !keySecret) {
    throw new Error('Razorpay credentials not configured')
  }

  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      planType,
    } = body

    console.log('[verify] Request received', body)

    const keySecret = process.env.RAZORPAY_KEY_SECRET
    if (!keySecret) {
      throw new Error('Missing RAZORPAY_KEY_SECRET')
    }

    // Razorpay signature verification
    const text = `${razorpay_order_id}|${razorpay_payment_id}`

    const generatedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(text)
      .digest('hex')

    if (generatedSignature !== razorpay_signature) {
      console.error('[verify] Signature mismatch')
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }

    const razorpay = getRazorpayClient()
    const razorpayPayment = await razorpay.payments.fetch(razorpay_payment_id)

    if (razorpayPayment.status !== 'captured') {
      return NextResponse.json(
        { error: 'Payment not captured' },
        { status: 400 }
      )
    }

    if (razorpayPayment.order_id !== razorpay_order_id) {
      return NextResponse.json(
        { error: 'Order mismatch' },
        { status: 400 }
      )
    }

    const supabase = getServiceSupabase()

    // Find payment record
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('user_id')
      .eq('razorpay_order_id', razorpay_order_id)
      .single()

    if (paymentError || !payment) {
      console.error('[verify] Payment record not found', paymentError)

      return NextResponse.json(
        { error: 'Payment record not found' },
        { status: 404 }
      )
    }

    // Update payment table
    const { error: updatePaymentError } = await supabase
      .from('payments')
      .update({
        razorpay_payment_id,
        razorpay_signature,
        status: 'completed',
      })
      .eq('razorpay_order_id', razorpay_order_id)

    if (updatePaymentError) {
      console.error('[verify] Payment update failed', updatePaymentError)
    }

    // Calculate expiry
    const days = PLAN_DURATIONS[planType] || 1
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + days)

    console.log('[verify] Activating subscription', {
      user: payment.user_id,
      days,
    })

    // Update user subscription
    const { error: userUpdateError } = await supabase
      .from('users')
      .update({
        subscription_type: 'paid',
        subscription_expires_at: expiresAt.toISOString(),
        downloads_used: 0,
      })
      .eq('id', payment.user_id)

    if (userUpdateError) {
      console.error('[verify] User update failed', userUpdateError)

      return NextResponse.json(
        { error: 'Failed to activate subscription' },
        { status: 500 }
      )
    }

    console.log('[verify] Payment verified successfully')

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    console.error('[verify] Fatal error', error)

    return NextResponse.json(
      { error: 'Payment verification failed' },
      { status: 500 }
    )
  }
}
