import { NextResponse, type NextRequest } from "next/server"

import { readBookings } from "@/lib/bookings/storage"
import { readSchedule, readScheduleConfig } from "@/lib/schedule/storage"
import { generateAvailableSlots } from "@/lib/schedule/slots"
import { ensureSeedData } from "@/lib/seed/ensure"

export async function GET(request: NextRequest) {
  await ensureSeedData()
  const { searchParams } = new URL(request.url)
  const locationId = searchParams.get("locationId")
  const therapistId = searchParams.get("therapistId")
  const date = searchParams.get("date")
  const rangeStart = searchParams.get("rangeStart")
  const rangeEnd = searchParams.get("rangeEnd")

  if (!locationId) {
    return NextResponse.json({ message: "locationId is required" }, { status: 400 })
  }
  if (!therapistId) {
    return NextResponse.json({ message: "therapistId is required" }, { status: 400 })
  }

  if (!date && (!rangeStart || !rangeEnd)) {
    return NextResponse.json(
      { message: "Query date or rangeStart/rangeEnd is required" },
      { status: 400 }
    )
  }

  const scheduleConfig = await readScheduleConfig(locationId, therapistId)
  if (!scheduleConfig) {
    return NextResponse.json(
      { message: "Schedule is not set for this position." },
      { status: 409 }
    )
  }
  const schedule = await readSchedule(locationId, therapistId)
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
      .filter(
        (booking) =>
          booking.locationId === locationId &&
          booking.therapistId === therapistId &&
          booking.status === "scheduled"
      )
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
