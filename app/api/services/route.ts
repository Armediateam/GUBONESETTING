import { NextResponse } from "next/server"

import { serviceSchema } from "@/lib/services/schema"
import { createService, readServices } from "@/lib/services/storage"

export async function GET() {
  const services = await readServices()
  return NextResponse.json({ items: services })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = serviceSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Validation failed", errors: parsed.error.flatten() },
        { status: 400 }
      )
    }
    const service = await createService(parsed.data)
    return NextResponse.json(service, { status: 201 })
  } catch (error) {
    console.error("Failed to create service", error)
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}
