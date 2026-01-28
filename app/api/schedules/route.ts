import { NextResponse } from "next/server"

import { ensureSeedData } from "@/lib/seed/ensure"
import { readSchedules } from "@/lib/schedule/storage"

export async function GET() {
  await ensureSeedData()
  const schedules = await readSchedules()
  return NextResponse.json({ items: schedules })
}
