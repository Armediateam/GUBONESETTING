import { NextResponse, type NextRequest } from "next/server"

import { serviceUpdateSchema } from "@/lib/services/schema"
import { deleteService, updateService } from "@/lib/services/storage"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolved = await params
    const body = await request.json()
    const parsed = serviceUpdateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Validation failed", errors: parsed.error.flatten() },
        { status: 400 }
      )
    }
    const updated = await updateService(resolved.id, parsed.data)
    if (!updated) {
      return NextResponse.json({ message: "Service not found" }, { status: 404 })
    }
    return NextResponse.json(updated)
  } catch (error) {
    console.error("Failed to update service", error)
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolved = await params
    const removed = await deleteService(resolved.id)
    if (!removed) {
      return NextResponse.json({ message: "Service not found" }, { status: 404 })
    }
    return NextResponse.json(removed)
  } catch (error) {
    console.error("Failed to delete service", error)
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}
