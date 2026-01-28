import { NextResponse, type NextRequest } from "next/server"

import { readBookings, summarizeBookings } from "@/lib/bookings/storage"
import { patientUpdateSchema } from "@/lib/patients/schema"
import {
  deletePatient,
  readAppointments,
  readPatients,
  summarizeAppointments,
  updatePatient,
} from "@/lib/patients/storage"
import { ensureSeedData } from "@/lib/seed/ensure"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await ensureSeedData()
  const resolved = await params
  const patients = await readPatients()
  const patient = patients.find((item) => item.id === resolved.id)
  if (!patient) {
    return NextResponse.json({ message: "Patient tidak ditemukan" }, { status: 404 })
  }
  const bookings = await readBookings()
  const useBookings = bookings.length > 0
  if (useBookings) {
    const patientBookings = bookings.filter((booking) => booking.patientId === patient.id)
    const summary = summarizeBookings(patientBookings)
    return NextResponse.json({
      patient,
      summary,
    })
  }

  const appointments = await readAppointments()
  const patientAppointments = appointments.filter(
    (appointment) => appointment.patientId === patient.id
  )
  const summary = summarizeAppointments(patientAppointments)

  return NextResponse.json({
    patient,
    summary,
  })
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureSeedData()
    const resolved = await params
    const body = await request.json()
    const parsed = patientUpdateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Validasi gagal", errors: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const updated = await updatePatient(resolved.id, parsed.data)
    if (!updated) {
      return NextResponse.json({ message: "Patient tidak ditemukan" }, { status: 404 })
    }
    return NextResponse.json(updated)
  } catch (error) {
    console.error("Failed to update patient", error)
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
    const removed = await deletePatient(resolved.id)
    if (!removed) {
      return NextResponse.json({ message: "Patient tidak ditemukan" }, { status: 404 })
    }
    return NextResponse.json(removed)
  } catch (error) {
    console.error("Failed to delete patient", error)
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}
