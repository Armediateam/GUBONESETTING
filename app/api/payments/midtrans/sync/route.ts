import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"

import { findBookingById, patchBooking } from "@/lib/bookings/storage"
import { getMidtransConfig } from "@/lib/midtrans/config"
import {
  getMidtransTransactionStatus,
  mapMidtransPaymentStatus,
  type MidtransNotificationPayload,
} from "@/lib/midtrans/snap"

const syncPaymentSchema = z.object({
  bookingId: z.string().min(1),
  orderId: z.string().optional(),
})

const applyMidtransStatusToBooking = async (
  bookingId: string,
  payload: MidtransNotificationPayload
) => {
  const paymentStatus = mapMidtransPaymentStatus(payload)

  return patchBooking(bookingId, {
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
}

export async function POST(request: NextRequest) {
  try {
    const configResult = getMidtransConfig()
    if (!configResult.ok) {
      return NextResponse.json({ message: configResult.message }, { status: 503 })
    }
    const { config } = configResult

    const body = await request.json()
    const parsed = syncPaymentSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Validation failed", errors: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const booking = await findBookingById(parsed.data.bookingId)
    if (!booking) {
      return NextResponse.json({ message: "Booking not found" }, { status: 404 })
    }

    const orderId = parsed.data.orderId ?? booking.payment?.orderId
    if (!orderId) {
      return NextResponse.json({ message: "Payment order is not available" }, { status: 400 })
    }

    const status = await getMidtransTransactionStatus(config, orderId)
    const updated = await applyMidtransStatusToBooking(booking.id, status)

    return NextResponse.json({
      paymentStatus: updated?.paymentStatus ?? booking.paymentStatus,
      payment: updated?.payment ?? booking.payment,
    })
  } catch (error) {
    console.error("Failed to sync Midtrans payment", error)
    const message = error instanceof Error ? error.message : "Server error"
    return NextResponse.json({ message }, { status: 500 })
  }
}
