import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"

import { findBookingById, patchBooking } from "@/lib/bookings/storage"
import { getMidtransConfig } from "@/lib/midtrans/config"
import { createSnapTransaction } from "@/lib/midtrans/snap"
import { readPatients } from "@/lib/patients/storage"
import { calculateBookingPayment } from "@/lib/payments/pricing"

const createPaymentTokenSchema = z.object({
  bookingId: z.string().min(1),
})

const resolveOrigin = (request: NextRequest) => {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim()
  if (configured) {
    return configured.replace(/\/$/, "")
  }

  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host")
  const protocol = request.headers.get("x-forwarded-proto") ?? "http"

  if (!host) {
    return "http://localhost:3000"
  }

  return `${protocol}://${host}`
}

export async function POST(request: NextRequest) {
  try {
    const configResult = getMidtransConfig()
    if (!configResult.ok) {
      return NextResponse.json({ message: configResult.message }, { status: 503 })
    }
    const { config } = configResult

    const body = await request.json()
    const parsed = createPaymentTokenSchema.safeParse(body)
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

    if (booking.paymentStatus === "paid") {
      return NextResponse.json({ message: "Booking is already paid" }, { status: 409 })
    }

    const subtotalAmount = booking.servicePrice ?? 0
    if (subtotalAmount <= 0) {
      return NextResponse.json(
        { message: "Booking amount is invalid for payment" },
        { status: 400 }
      )
    }

    const breakdown = calculateBookingPayment(subtotalAmount)

    if (
      booking.paymentStatus === "pending" &&
      booking.payment?.provider === "midtrans" &&
      booking.payment?.snapToken &&
      booking.payment?.orderId &&
      booking.payment?.totalAmount === breakdown.totalAmount
    ) {
      return NextResponse.json({
        token: booking.payment.snapToken,
        redirectUrl: booking.payment.redirectUrl,
        orderId: booking.payment.orderId,
        breakdown,
      })
    }

    const patients = await readPatients()
    const patient = patients.find((item) => item.id === booking.patientId)
    if (!patient) {
      return NextResponse.json({ message: "Patient not found" }, { status: 404 })
    }

    const existingOrderIds = booking.payment?.orderIds ?? []
    const orderId =
      existingOrderIds.length === 0
        ? `BOOKING-${booking.id}`
        : `BOOKING-${booking.id}-${existingOrderIds.length + 1}`

    const origin = resolveOrigin(request)
    const transaction = await createSnapTransaction({
      config,
      origin,
      bookingId: booking.id,
      orderId,
      grossAmount: breakdown.totalAmount,
      itemDetails: [
        {
          id: booking.serviceId ?? "service",
          price: breakdown.subtotalAmount,
          quantity: 1,
          name: booking.serviceName.slice(0, 50),
        },
        {
          id: "ppn",
          price: breakdown.taxAmount,
          quantity: 1,
          name: `PPN ${breakdown.taxPercent}%`,
        },
      ],
      customerDetails: {
        first_name: patient.fullName,
        email: patient.email,
        phone: patient.phone,
      },
    })

    await patchBooking(booking.id, {
      paymentStatus: "pending",
      payment: {
        provider: "midtrans",
        merchantId: config.merchantId,
        orderId,
        orderIds: [...existingOrderIds, orderId],
        snapToken: transaction.token,
        redirectUrl: transaction.redirect_url,
        subtotalAmount: breakdown.subtotalAmount,
        taxAmount: breakdown.taxAmount,
        totalAmount: breakdown.totalAmount,
        grossAmount: breakdown.totalAmount,
        currency: "IDR",
      },
    })

    return NextResponse.json({
      token: transaction.token,
      redirectUrl: transaction.redirect_url,
      orderId,
      breakdown,
    })
  } catch (error) {
    console.error("Failed to create Midtrans token", error)
    const message = error instanceof Error ? error.message : "Server error"
    return NextResponse.json({ message }, { status: 500 })
  }
}
