import { NextResponse, type NextRequest } from "next/server"

import { noteSchema } from "@/lib/patients/schema"
import { deleteNote, updateNote } from "@/lib/patients/storage"
import { ensureSeedData } from "@/lib/seed/ensure"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; noteId: string }> }
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

    const note = await updateNote(resolved.noteId, parsed.data)
    if (!note) {
      return NextResponse.json({ message: "Catatan tidak ditemukan" }, { status: 404 })
    }

    return NextResponse.json(note)
  } catch (error) {
    console.error("Failed to update note", error)
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ noteId: string }> }
) {
  try {
    await ensureSeedData()
    const resolved = await params
    const deleted = await deleteNote(resolved.noteId)
    if (!deleted) {
      return NextResponse.json({ message: "Catatan tidak ditemukan" }, { status: 404 })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete note", error)
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}
