import { NextResponse } from "next/server"

import { ensureSeedData } from "@/lib/seed/ensure"
import { therapistSchema } from "@/lib/therapists/schema"
import { createTherapist, readTherapists } from "@/lib/therapists/storage"

export async function GET() {
  await ensureSeedData()
  const therapists = await readTherapists()
  return NextResponse.json({ items: therapists })
}

export async function POST(request: Request) {
  try {
    await ensureSeedData()
    const body = await request.json()
    const parsed = therapistSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Validasi gagal", errors: parsed.error.flatten() },
        { status: 400 }
      )
    }
    const therapist = await createTherapist(parsed.data)
    return NextResponse.json(therapist, { status: 201 })
  } catch (error) {
    console.error("Failed to create therapist", error)
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}
