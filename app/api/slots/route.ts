import { NextResponse, type NextRequest } from "next/server"

import { readBookings } from "@/lib/bookings/storage"
import { readSchedule } from "@/lib/schedule/storage"
import { generateAvailableSlots } from "@/lib/schedule/slots"
import { ensureSeedData } from "@/lib/seed/ensure"

export async function GET(request: NextRequest) {
  await ensureSeedData()
  const { searchParams } = new URL(request.url)
  const locationId = searchParams.get("locationId")
  const date = searchParams.get("date")
  const rangeStart = searchParams.get("rangeStart")
  const rangeEnd = searchParams.get("rangeEnd")

  if (!locationId) {
    return NextResponse.json({ message: "locationId is required" }, { status: 400 })
  }

  if (!date && (!rangeStart || !rangeEnd)) {
    return NextResponse.json(
      { message: "Query date or rangeStart/rangeEnd is required" },
      { status: 400 }
    )
  }

  const schedule = await readSchedule(locationId)
  const bookings = await readBookings()

  const rangeStartISO = rangeStart
    ? rangeStart
    : new Date(`${date}T00:00:00.000Z`).toISOString()
  const rangeEndISO = rangeEnd
    ? rangeEnd
    : new Date(`${date}T23:59:59.000Z`).toISOString()

  const slots = generateAvailableSlots({
    schedule,
    rangeStartISO,
    rangeEndISO,
    existingBookings: bookings
      .filter((booking) => booking.locationId === locationId)
      .map((booking) => ({
        startISO: booking.startISO,
        endISO: booking.endISO,
      })),
  })

  return NextResponse.json({
    timeZone: schedule.timezone,
    items: slots,
  })
}
