import { NextResponse } from "next/server"

import { patientSchema } from "@/lib/patients/schema"
import { readBookings, summarizeBookings } from "@/lib/bookings/storage"
import { createPatient, readAppointments, readPatients, paginate, summarizeAppointments } from "@/lib/patients/storage"
import { ensureSeedData } from "@/lib/seed/ensure"

export async function GET(request: Request) {
  await ensureSeedData()
  const { searchParams } = new URL(request.url)
  const q = searchParams.get("q")?.toLowerCase() ?? ""
  const page = Number(searchParams.get("page") ?? "1")
  const pageSize = Number(searchParams.get("pageSize") ?? "10")
  const sort = searchParams.get("sort") ?? "newest"

  const patients = await readPatients()
  const bookings = await readBookings()
  const useBookings = bookings.length > 0
  const appointments = useBookings ? [] : await readAppointments()

  const filtered = patients.filter((patient) => {
    const haystack = `${patient.fullName} ${patient.phone} ${patient.email ?? ""}`.toLowerCase()
    return haystack.includes(q)
  })

  const sorted = [...filtered].sort((a, b) => {
    if (sort === "name") {
      return a.fullName.localeCompare(b.fullName)
    }
    if (sort === "oldest") {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  const items = paginate(sorted, page, pageSize).map((patient) => {
    if (useBookings) {
      const patientBookings = bookings.filter((booking) => booking.patientId === patient.id)
      const summary = summarizeBookings(patientBookings)
      return {
        ...patient,
        totalVisits: summary.total,
        lastVisit: summary.lastVisitAt,
        upcoming: summary.upcoming,
      }
    }

    const patientAppointments = appointments.filter(
      (appointment) => appointment.patientId === patient.id
    )
    const summary = summarizeAppointments(patientAppointments)
    return {
      ...patient,
      totalVisits: summary.total,
      lastVisit: summary.lastVisitAt,
      upcoming: summary.upcoming,
    }
  })

  return NextResponse.json({
    items,
    total: filtered.length,
    page,
    pageSize,
  })
}

export async function POST(request: Request) {
  try {
    await ensureSeedData()
    const body = await request.json()
    const parsed = patientSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Validasi gagal", errors: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const patient = await createPatient(parsed.data)
    return NextResponse.json(patient, { status: 201 })
  } catch (error) {
    console.error("Failed to create patient", error)
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}
