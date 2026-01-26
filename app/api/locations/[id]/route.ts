import { NextResponse, type NextRequest } from "next/server"

import { ensureSeedData } from "@/lib/seed/ensure"
import { locationUpdateSchema } from "@/lib/locations/schema"
import { toggleLocationActive, updateLocation } from "@/lib/locations/storage"

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
        { message: "Validasi gagal", errors: parsed.error.flatten() },
        { status: 400 }
      )
    }
    const updated = await updateLocation(resolved.id, parsed.data)
    if (!updated) {
      return NextResponse.json({ message: "Lokasi tidak ditemukan" }, { status: 404 })
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
    const updated = await toggleLocationActive(resolved.id, isActive)
    if (!updated) {
      return NextResponse.json({ message: "Lokasi tidak ditemukan" }, { status: 404 })
    }
    return NextResponse.json(updated)
  } catch (error) {
    console.error("Failed to toggle location", error)
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}
