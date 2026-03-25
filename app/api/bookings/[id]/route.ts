import { NextResponse, type NextRequest } from "next/server"

import { z } from "zod"

import { bookingInputSchema, paymentStatusSchema } from "@/lib/bookings/schema"
import { deleteBooking, readBookings, updateBooking } from "@/lib/bookings/storage"
import { ensureSeedData } from "@/lib/seed/ensure"

const paymentStatusUpdateSchema = z.object({
  paymentStatus: paymentStatusSchema,
})

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureSeedData()
    const resolved = await params
    const body = await request.json()
    const parsed = bookingInputSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Validation failed", errors: parsed.error.flatten() },
        { status: 400 }
      )
    }
    const updated = await updateBooking(resolved.id, parsed.data)
    if (!updated) {
      return NextResponse.json({ message: "Booking not found" }, { status: 404 })
    }
    return NextResponse.json(updated)
  } catch (error) {
    console.error("Failed to update booking", error)
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureSeedData()
    const resolved = await params
    const body = await request.json()
    const parsed = paymentStatusUpdateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Validation failed", errors: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const bookings = await readBookings()
    const booking = bookings.find((item) => item.id === resolved.id)
    if (!booking) {
      return NextResponse.json({ message: "Booking not found" }, { status: 404 })
    }

    const updated = await updateBooking(resolved.id, {
      patientId: booking.patientId,
      locationId: booking.locationId,
      therapistId: booking.therapistId,
      serviceId: booking.serviceId,
      serviceName: booking.serviceName,
      servicePrice: booking.servicePrice,
      complaint: booking.complaint,
      startISO: booking.startISO,
      endISO: booking.endISO,
      status: booking.status,
      paymentStatus: parsed.data.paymentStatus,
      payment: booking.payment,
      locationName: booking.locationName,
      locationAddress: booking.locationAddress,
      therapistName: booking.therapistName,
    })

    if (!updated) {
      return NextResponse.json({ message: "Booking not found" }, { status: 404 })
    }

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Failed to update payment status", error)
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureSeedData()
    const resolved = await params
    const removed = await deleteBooking(resolved.id)
    if (!removed) {
      return NextResponse.json({ message: "Booking not found" }, { status: 404 })
    }
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Failed to delete booking", error)
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}
