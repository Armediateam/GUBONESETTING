import { NextResponse, type NextRequest } from "next/server"

import { createNote, readNotes } from "@/lib/patients/storage"
import { noteSchema } from "@/lib/patients/schema"
import { ensureSeedData } from "@/lib/seed/ensure"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await ensureSeedData()
  const resolved = await params
  const notes = await readNotes()
  const items = notes.filter((note) => note.patientId === resolved.id)
  return NextResponse.json({ items })
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureSeedData()
    const resolved = await params
    const body = await request.json()
    const parsed = noteSchema.safeParse({ ...body, patientId: resolved.id })
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Validasi gagal", errors: parsed.error.flatten() },
        { status: 400 }
      )
    }
    const note = await createNote(parsed.data)
    return NextResponse.json(note, { status: 201 })
  } catch (error) {
    console.error("Failed to create note", error)
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}
