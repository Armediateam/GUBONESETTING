import { NextResponse } from "next/server"

import { ensureSeedData } from "@/lib/seed/ensure"
import { readBookings } from "@/lib/bookings/storage"
import { readPatients, readNotes } from "@/lib/patients/storage"

export async function GET(request: Request) {
  await ensureSeedData()

  const [patients, bookings, notes] = await Promise.all([
    readPatients(),
    readBookings(),
    readNotes(),
  ])

  const { searchParams } = new URL(request.url)
  const locationId = searchParams.get("locationId")
  const filteredBookings =
    locationId && locationId !== "all"
      ? bookings.filter((booking) => booking.locationId === locationId)
      : bookings

  const now = new Date()
  const upcomingEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  const pastWindow = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  const upcomingBookings = filteredBookings.filter((booking) => {
    const start = new Date(booking.startISO)
    return booking.status === "scheduled" && start >= now && start <= upcomingEnd
  })

  const completedBookings = filteredBookings.filter((booking) => {
    const start = new Date(booking.startISO)
    return booking.status === "completed" && start >= pastWindow && start <= now
  })

  const cancelledBookings = filteredBookings.filter((booking) => {
    const start = new Date(booking.startISO)
    return (
      (booking.status === "cancelled" || booking.status === "no_show") &&
      start >= pastWindow &&
      start <= now
    )
  })

  const patientLookup = new Map(patients.map((patient) => [patient.id, patient.fullName]))

  const recentBookings = [...filteredBookings]
    .sort((a, b) => new Date(b.startISO).getTime() - new Date(a.startISO).getTime())
    .slice(0, 8)
    .map((booking) => ({
      id: booking.id,
      startISO: booking.startISO,
      status: booking.status,
      paymentStatus: booking.paymentStatus ?? "pending",
      serviceName: booking.serviceName,
      patientName: patientLookup.get(booking.patientId) ?? "Unknown",
      locationName: booking.locationName ?? "Unknown",
    }))

  const locationPatientIds =
    locationId && locationId !== "all"
      ? new Set(filteredBookings.map((booking) => booking.patientId))
      : null

  const recentNotes = [...notes]
    .filter((note) => (locationPatientIds ? locationPatientIds.has(note.patientId) : true))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6)
    .map((note) => ({
      id: note.id,
      patientName: patientLookup.get(note.patientId) ?? "Unknown",
      createdAt: note.createdAt,
      title: note.title ?? "Note",
    }))

  const totalPatients =
    locationId && locationId !== "all"
      ? new Set(filteredBookings.map((booking) => booking.patientId)).size
      : patients.length

  return NextResponse.json({
    summary: {
      totalPatients,
      upcomingBookings: upcomingBookings.length,
      completedBookings: completedBookings.length,
      cancelledBookings: cancelledBookings.length,
    },
    recentBookings,
    recentNotes,
  })
}
