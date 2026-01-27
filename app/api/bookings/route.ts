import { NextResponse, type NextRequest } from "next/server"

import { readSchedule } from "@/lib/schedule/storage"
import { generateAvailableSlots } from "@/lib/schedule/slots"
import { bookingInputSchema, bookingStatusSchema } from "@/lib/bookings/schema"
import { createBooking, readBookings } from "@/lib/bookings/storage"
import { ensureSeedData } from "@/lib/seed/ensure"
import { readLocations } from "@/lib/locations/storage"
import { readTherapists } from "@/lib/therapists/storage"

const matchesDate = (iso: string, date: string) => {
  const value = new Date(iso)
  const year = value.getUTCFullYear()
  const month = String(value.getUTCMonth() + 1).padStart(2, "0")
  const day = String(value.getUTCDate()).padStart(2, "0")
  return `${year}-${month}-${day}` === date
}

export async function GET(request: NextRequest) {
  await ensureSeedData()
  const { searchParams } = new URL(request.url)
  const status = searchParams.get("status") ?? ""
  const patientId = searchParams.get("patientId") ?? ""
  const locationId = searchParams.get("locationId") ?? ""
  const date = searchParams.get("date") ?? ""
  const dateFrom = searchParams.get("dateFrom") ?? ""
  const dateTo = searchParams.get("dateTo") ?? ""
  const q = searchParams.get("q")?.toLowerCase() ?? ""

  const bookings = await readBookings()
  const filtered = bookings.filter((booking) => {
    if (status && booking.status !== status) {
      return false
    }
    if (patientId && booking.patientId !== patientId) {
      return false
    }
    if (locationId && locationId !== "all" && booking.locationId !== locationId) {
      return false
    }
    if (date && !matchesDate(booking.startISO, date)) {
      return false
    }
    if (dateFrom || dateTo) {
      const startTime = new Date(booking.startISO).getTime()
      if (dateFrom && startTime < new Date(`${dateFrom}T00:00:00.000Z`).getTime()) {
        return false
      }
      if (dateTo && startTime > new Date(`${dateTo}T23:59:59.999Z`).getTime()) {
        return false
      }
    }
    if (q) {
      const haystack = `${booking.serviceName} ${booking.patientId}`.toLowerCase()
      return haystack.includes(q)
    }
    return true
  })

  return NextResponse.json({ items: filtered })
}

export async function POST(request: NextRequest) {
  try {
    await ensureSeedData()
    const body = await request.json()
    const parsed = bookingInputSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Validation failed", errors: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const locations = await readLocations()
    const location = locations.find((item) => item.id === parsed.data.locationId)
    if (!location) {
      return NextResponse.json({ message: "Position not found" }, { status: 400 })
    }
    if (!location.isActive) {
      return NextResponse.json({ message: "Position is not active" }, { status: 400 })
    }

    const therapists = await readTherapists()
    const therapist = therapists.find((item) => item.id === parsed.data.therapistId)
    if (!therapist) {
      return NextResponse.json({ message: "Therapist not found" }, { status: 400 })
    }
    if (!therapist.isActive) {
      return NextResponse.json({ message: "Therapist is not active" }, { status: 400 })
    }

    const schedule = await readSchedule(parsed.data.locationId)
    const existing = await readBookings()
    const slots = generateAvailableSlots({
      schedule,
      rangeStartISO: parsed.data.startISO,
      rangeEndISO: parsed.data.endISO,
      existingBookings: existing
        .filter((booking) => booking.locationId === parsed.data.locationId)
        .map((booking) => ({
          startISO: booking.startISO,
          endISO: booking.endISO,
        })),
    })

    const slotAvailable = slots.some((day) =>
      day.slots.some((slot) => slot.startISO === parsed.data.startISO)
    )

    if (!slotAvailable) {
      return NextResponse.json(
        { message: "Slot is taken or outside the schedule." },
        { status: 409 }
      )
    }

    const booking = await createBooking({
      ...parsed.data,
      status: bookingStatusSchema.safeParse(parsed.data.status).success
        ? parsed.data.status
        : "scheduled",
      locationName: parsed.data.locationName ?? location.name,
      locationAddress: parsed.data.locationAddress ?? location.address,
      therapistName: parsed.data.therapistName ?? therapist.name,
    })

    return NextResponse.json(booking, { status: 201 })
  } catch (error) {
    console.error("Failed to create booking", error)
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}
