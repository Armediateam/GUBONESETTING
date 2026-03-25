import { NextResponse, type NextRequest } from "next/server"

import { findBookingByOrderId, patchBooking } from "@/lib/bookings/storage"
import { getMidtransConfig } from "@/lib/midtrans/config"
import {
  mapMidtransPaymentStatus,
  verifyMidtransSignature,
  type MidtransNotificationPayload,
} from "@/lib/midtrans/snap"

export async function POST(request: NextRequest) {
  try {
    const configResult = getMidtransConfig()
    if (!configResult.ok) {
      return NextResponse.json({ message: configResult.message }, { status: 503 })
    }
    const { config } = configResult

    const payload = (await request.json()) as MidtransNotificationPayload

    if (!verifyMidtransSignature(payload, config.serverKey)) {
      return NextResponse.json({ message: "Invalid signature" }, { status: 401 })
    }

    if (payload.merchant_id && payload.merchant_id !== config.merchantId) {
      return NextResponse.json({ message: "Invalid merchant" }, { status: 401 })
    }

    const orderId = payload.order_id
    if (!orderId) {
      return NextResponse.json({ message: "order_id is required" }, { status: 400 })
    }

    const booking = await findBookingByOrderId(orderId)
    if (!booking) {
      return NextResponse.json({ message: "Booking not found" }, { status: 404 })
    }

    const paymentStatus = mapMidtransPaymentStatus(payload)
    await patchBooking(booking.id, {
      paymentStatus,
      payment: {
        provider: "midtrans",
        merchantId: payload.merchant_id,
        orderId: payload.order_id,
        transactionId: payload.transaction_id,
        transactionStatus: payload.transaction_status,
        statusCode: payload.status_code,
        fraudStatus: payload.fraud_status,
        paymentType: payload.payment_type,
        grossAmount: payload.gross_amount ? Number(payload.gross_amount) : undefined,
        currency: payload.currency,
        transactionTime: payload.transaction_time,
        settlementTime: payload.settlement_time,
        statusMessage: payload.status_message,
      },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Failed to handle Midtrans notification", error)
    const message = error instanceof Error ? error.message : "Server error"
    return NextResponse.json({ message }, { status: 500 })
  }
}
