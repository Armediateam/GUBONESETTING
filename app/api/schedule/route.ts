import { NextResponse } from "next/server"

import { readSchedule, writeSchedule } from "@/lib/schedule/storage"
import { scheduleSchema } from "@/lib/schedule/schema"
import { ensureSeedData } from "@/lib/seed/ensure"

export async function GET(request: Request) {
  await ensureSeedData()
  const { searchParams } = new URL(request.url)
  const locationId = searchParams.get("locationId")
  if (!locationId) {
    return NextResponse.json({ message: "locationId is required" }, { status: 400 })
  }
  const schedule = await readSchedule(locationId)
  return NextResponse.json(schedule)
}

export async function PUT(request: Request) {
  try {
    await ensureSeedData()
    const { searchParams } = new URL(request.url)
    const locationId = searchParams.get("locationId")
    if (!locationId) {
      return NextResponse.json({ message: "locationId is required" }, { status: 400 })
    }
    const body = await request.json()
    const parsed = scheduleSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { message: "Validasi gagal", errors: parsed.error.flatten() },
        { status: 400 }
      )
    }

    await writeSchedule(locationId, parsed.data)
    return NextResponse.json(parsed.data)
  } catch (error) {
    console.error("Failed to save schedule", error)
    return NextResponse.json(
      { message: "Server error" },
      { status: 500 }
    )
  }
}
