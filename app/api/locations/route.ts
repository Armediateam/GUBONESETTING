import { NextResponse } from "next/server"

import { ensureSeedData } from "@/lib/seed/ensure"
import { locationSchema } from "@/lib/locations/schema"
import { createLocation, readLocations } from "@/lib/locations/storage"

export async function GET() {
  await ensureSeedData()
  const locations = await readLocations()
  return NextResponse.json({ items: locations })
}

export async function POST(request: Request) {
  try {
    await ensureSeedData()
    const body = await request.json()
    const parsed = locationSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Validation failed", errors: parsed.error.flatten() },
        { status: 400 }
      )
    }
    const location = await createLocation(parsed.data)
    return NextResponse.json(location, { status: 201 })
  } catch (error) {
    console.error("Failed to create location", error)
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}
