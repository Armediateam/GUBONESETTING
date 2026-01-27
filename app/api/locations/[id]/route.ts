import { NextResponse, type NextRequest } from "next/server"

import { ensureSeedData } from "@/lib/seed/ensure"
import { locationUpdateSchema } from "@/lib/locations/schema"
import { deleteLocation, readLocations, toggleLocationActive, updateLocation } from "@/lib/locations/storage"
import { readTherapists } from "@/lib/therapists/storage"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureSeedData()
    const resolved = await params
    const body = await request.json()
    const parsed = locationUpdateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Validation failed", errors: parsed.error.flatten() },
        { status: 400 }
      )
    }
    if (parsed.data.isActive) {
      const [locations, therapists] = await Promise.all([readLocations(), readTherapists()])
      const activeTherapists = therapists.filter((therapist) => therapist.isActive)
      if (activeTherapists.length === 0) {
        return NextResponse.json(
          { message: "No active therapists available to enable a position" },
          { status: 400 }
        )
      }
      const activeLocations = locations.filter((location) => location.isActive)
      const alreadyActive = activeLocations.some((location) => location.id === resolved.id)
      if (!alreadyActive && activeLocations.length >= activeTherapists.length) {
        return NextResponse.json(
          { message: "Active positions limit reached" },
          { status: 400 }
        )
      }
    }
    const updated = await updateLocation(resolved.id, parsed.data)
    if (!updated) {
      return NextResponse.json({ message: "Position not found" }, { status: 404 })
    }
    return NextResponse.json(updated)
  } catch (error) {
    console.error("Failed to update location", error)
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
    if (isActive) {
      const [locations, therapists] = await Promise.all([readLocations(), readTherapists()])
      const activeTherapists = therapists.filter((therapist) => therapist.isActive)
      if (activeTherapists.length === 0) {
        return NextResponse.json(
          { message: "No active therapists available to enable a position" },
          { status: 400 }
        )
      }
      const activeLocations = locations.filter((location) => location.isActive)
      if (activeLocations.length >= activeTherapists.length) {
        return NextResponse.json(
          { message: "Active positions limit reached" },
          { status: 400 }
        )
      }
    }
    const updated = await toggleLocationActive(resolved.id, isActive)
    if (!updated) {
      return NextResponse.json({ message: "Position not found" }, { status: 404 })
    }
    return NextResponse.json(updated)
  } catch (error) {
    console.error("Failed to toggle location", error)
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolved = await params
    const removed = await deleteLocation(resolved.id)
    if (!removed) {
      return NextResponse.json({ message: "Position not found" }, { status: 404 })
    }
    return NextResponse.json(removed)
  } catch (error) {
    console.error("Failed to delete location", error)
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}
