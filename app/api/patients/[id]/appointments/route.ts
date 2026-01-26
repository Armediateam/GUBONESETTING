import { NextResponse, type NextRequest } from "next/server"

import { readBookings } from "@/lib/bookings/storage"
import { readAppointments } from "@/lib/patients/storage"
import { ensureSeedData } from "@/lib/seed/ensure"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await ensureSeedData()
  const resolved = await params
  const bookings = await readBookings()
  if (bookings.length > 0) {
    const items = bookings
      .filter((booking) => booking.patientId === resolved.id)
      .sort((a, b) => new Date(b.startISO).getTime() - new Date(a.startISO).getTime())
      .map((booking) => ({
        id: booking.id,
        serviceName: booking.serviceName,
        startISO: booking.startISO,
        endISO: booking.endISO,
        status: booking.status,
        locationName: booking.locationName,
        therapistName: booking.therapistName,
      }))
    return NextResponse.json({ items })
  }

  const appointments = await readAppointments()
  const items = appointments
    .filter((appointment) => appointment.patientId === resolved.id)
    .sort((a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime())

  return NextResponse.json({ items })
}
