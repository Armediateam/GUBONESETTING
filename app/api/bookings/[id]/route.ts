import { NextResponse, type NextRequest } from "next/server"

import { bookingInputSchema } from "@/lib/bookings/schema"
import { deleteBooking, updateBooking } from "@/lib/bookings/storage"
import { ensureSeedData } from "@/lib/seed/ensure"

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
        { message: "Validasi gagal", errors: parsed.error.flatten() },
        { status: 400 }
      )
    }
    const updated = await updateBooking(resolved.id, parsed.data)
    if (!updated) {
      return NextResponse.json({ message: "Booking tidak ditemukan" }, { status: 404 })
    }
    return NextResponse.json(updated)
  } catch (error) {
    console.error("Failed to update booking", error)
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
      return NextResponse.json({ message: "Booking tidak ditemukan" }, { status: 404 })
    }
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Failed to delete booking", error)
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}
