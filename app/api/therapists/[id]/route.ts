import { NextResponse, type NextRequest } from "next/server"

import { ensureSeedData } from "@/lib/seed/ensure"
import { therapistUpdateSchema } from "@/lib/therapists/schema"
import { readLocations, writeLocations } from "@/lib/locations/storage"
import { deleteTherapist, readTherapists, toggleTherapistActive, updateTherapist } from "@/lib/therapists/storage"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureSeedData()
    const resolved = await params
    const body = await request.json()
    const parsed = therapistUpdateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Validation failed", errors: parsed.error.flatten() },
        { status: 400 }
      )
    }
    const updated = await updateTherapist(resolved.id, parsed.data)
    if (!updated) {
      return NextResponse.json({ message: "Therapist not found" }, { status: 404 })
    }
    return NextResponse.json(updated)
  } catch (error) {
    console.error("Failed to update therapist", error)
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
    const isActive = Boolean(body?.isActive)
    const updated = await toggleTherapistActive(resolved.id, isActive)
    if (!updated) {
      return NextResponse.json({ message: "Therapist not found" }, { status: 404 })
    }
    if (!isActive) {
      const [therapists, locations] = await Promise.all([readTherapists(), readLocations()])
      const activeTherapists = therapists.filter((therapist) => therapist.isActive)
      const activeLimit = Math.min(activeTherapists.length, locations.length)
      const activeLocations = locations.filter((location) => location.isActive)
      if (activeLocations.length > activeLimit) {
        let remaining = activeLimit
        const nextLocations = locations.map((location) => {
          if (location.isActive && remaining > 0) {
            remaining -= 1
            return location
          }
          if (location.isActive && remaining <= 0) {
            return { ...location, isActive: false, updatedAt: new Date().toISOString() }
          }
          return location
        })
        await writeLocations(nextLocations)
      }
    }
    return NextResponse.json(updated)
  } catch (error) {
    console.error("Failed to toggle therapist", error)
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolved = await params
    const removed = await deleteTherapist(resolved.id)
    if (!removed) {
      return NextResponse.json({ message: "Therapist not found" }, { status: 404 })
    }
    return NextResponse.json(removed)
  } catch (error) {
    console.error("Failed to delete therapist", error)
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}
