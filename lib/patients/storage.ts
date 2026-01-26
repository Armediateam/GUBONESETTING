import path from "path"
import crypto from "crypto"

import type {
  AppointmentRecord,
  NoteRecord,
  PatientRecord,
  PatientFormValues,
  PatientUpdateValues,
  AppointmentInput,
  NoteInput,
} from "./schema"
import { appointmentSchema, noteSchema, patientSchema, patientUpdateSchema } from "./schema"
import { readJson, writeJsonAtomic } from "@/lib/storage/json"

const dataDir = path.join(process.cwd(), "data")
const patientsPath = path.join(dataDir, "patients.json")
const appointmentsPath = path.join(dataDir, "appointments.json")
const notesPath = path.join(dataDir, "patient-notes.json")

export const readPatients = async (): Promise<PatientRecord[]> => {
  return readJson<PatientRecord[]>(patientsPath, [])
}

export const writePatients = async (patients: PatientRecord[]) => {
  await writeJsonAtomic(patientsPath, patients)
}

export const readAppointments = async (): Promise<AppointmentRecord[]> => {
  return readJson<AppointmentRecord[]>(appointmentsPath, [])
}

export const writeAppointments = async (appointments: AppointmentRecord[]) => {
  await writeJsonAtomic(appointmentsPath, appointments)
}

export const readNotes = async (): Promise<NoteRecord[]> => {
  return readJson<NoteRecord[]>(notesPath, [])
}

export const writeNotes = async (notes: NoteRecord[]) => {
  await writeJsonAtomic(notesPath, notes)
}

export const createPatient = async (input: PatientFormValues) => {
  const parsed = patientSchema.safeParse(input)
  if (!parsed.success) {
    throw parsed.error
  }
  const now = new Date().toISOString()
  const patients = await readPatients()
  const patient: PatientRecord = {
    id: crypto.randomUUID(),
    ...parsed.data,
    email: parsed.data.email || undefined,
    gender: parsed.data.gender || undefined,
    dateOfBirth: parsed.data.dateOfBirth || undefined,
    address: parsed.data.address || undefined,
    createdAt: now,
    updatedAt: now,
  }
  patients.push(patient)
  await writePatients(patients)
  return patient
}

export const updatePatient = async (id: string, input: PatientUpdateValues) => {
  const parsed = patientUpdateSchema.safeParse(input)
  if (!parsed.success) {
    throw parsed.error
  }
  const patients = await readPatients()
  const index = patients.findIndex((patient) => patient.id === id)
  if (index === -1) {
    return null
  }
  const updated: PatientRecord = {
    ...patients[index],
    ...parsed.data,
    email: parsed.data.email === "" ? undefined : parsed.data.email ?? patients[index].email,
    gender: parsed.data.gender === "" ? undefined : parsed.data.gender ?? patients[index].gender,
    dateOfBirth:
      parsed.data.dateOfBirth === ""
        ? undefined
        : parsed.data.dateOfBirth ?? patients[index].dateOfBirth,
    address: parsed.data.address === "" ? undefined : parsed.data.address ?? patients[index].address,
    updatedAt: new Date().toISOString(),
  }
  patients[index] = updated
  await writePatients(patients)
  return updated
}

export const createAppointment = async (input: AppointmentInput) => {
  const parsed = appointmentSchema.safeParse(input)
  if (!parsed.success) {
    throw parsed.error
  }
  const now = new Date().toISOString()
  const appointments = await readAppointments()
  const appointment: AppointmentRecord = {
    id: crypto.randomUUID(),
    ...parsed.data,
    createdAt: now,
  }
  appointments.push(appointment)
  await writeAppointments(appointments)
  return appointment
}

export const createNote = async (input: NoteInput) => {
  const parsed = noteSchema.safeParse(input)
  if (!parsed.success) {
    throw parsed.error
  }
  const now = new Date().toISOString()
  const notes = await readNotes()
  const note: NoteRecord = {
    id: crypto.randomUUID(),
    ...parsed.data,
    title: parsed.data.title || undefined,
    createdBy: parsed.data.createdBy || undefined,
    createdAt: now,
    updatedAt: now,
  }
  notes.unshift(note)
  await writeNotes(notes)
  return note
}

export const updateNote = async (noteId: string, input: NoteInput) => {
  const parsed = noteSchema.safeParse(input)
  if (!parsed.success) {
    throw parsed.error
  }
  const notes = await readNotes()
  const index = notes.findIndex((note) => note.id === noteId)
  if (index === -1) {
    return null
  }
  const updated: NoteRecord = {
    ...notes[index],
    ...parsed.data,
    title: parsed.data.title || undefined,
    createdBy: parsed.data.createdBy || undefined,
    updatedAt: new Date().toISOString(),
  }
  notes[index] = updated
  await writeNotes(notes)
  return updated
}

export const deleteNote = async (noteId: string) => {
  const notes = await readNotes()
  const next = notes.filter((note) => note.id !== noteId)
  if (next.length === notes.length) {
    return false
  }
  await writeNotes(next)
  return true
}

export const paginate = <T>(items: T[], page: number, pageSize: number) => {
  const start = (page - 1) * pageSize
  return items.slice(start, start + pageSize)
}

export const summarizeAppointments = (appointments: AppointmentRecord[]) => {
  const total = appointments.length
  const completed = appointments.filter((appointment) => appointment.status === "completed").length
  const cancelled = appointments.filter((appointment) =>
    appointment.status === "cancelled" || appointment.status === "no_show"
  ).length
  const upcomingList = appointments
    .filter((appointment) => appointment.status === "scheduled")
    .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
  const upcoming = upcomingList.length > 0 ? upcomingList[0].startAt : null
  const lastVisit = appointments
    .filter((appointment) => appointment.status === "completed")
    .sort((a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime())
  const lastVisitAt = lastVisit.length > 0 ? lastVisit[0].startAt : null

  return { total, completed, cancelled, upcoming, lastVisitAt }
}
