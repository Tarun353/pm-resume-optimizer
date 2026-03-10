import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import { createClient } from "@supabase/supabase-js"

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    throw new Error("Supabase credentials missing")
  }

  return createClient(url, serviceKey)
}

const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET

export async function POST(req: NextRequest) {
  try {
    if (!WEBHOOK_SECRET) {
      throw new Error("RAZORPAY_WEBHOOK_SECRET missing")
    }

    const signature = req.headers.get("x-razorpay-signature")
    const rawBody = await req.text()

    const expectedSignature = crypto
      .createHmac("sha256", WEBHOOK_SECRET)
      .update(rawBody)
      .digest("hex")

    if (!signature || expectedSignature !== signature) {
      return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 })
    }

    const body = JSON.parse(rawBody) as {
      event?: string
      payload?: {
        payment?: {
          entity?: {
            order_id?: string
          }
        }
      }
    }

    if (body.event === "payment.captured") {
      const orderId = body.payload?.payment?.entity?.order_id

      if (orderId) {
        const supabase = getServiceSupabase()
        const order_id = orderId

        const { data: paymentRow } = await supabase
          .from("payments")
          .select("*")
          .eq("razorpay_order_id", order_id)
          .single()

        if (!paymentRow) {
          return new Response("Order not found", { status: 404 })
        }

        await supabase
          .from("payments")
          .update({ status: "completed" })
          .eq("razorpay_order_id", orderId)
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("[payment/webhook] Error handling webhook", error)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}
