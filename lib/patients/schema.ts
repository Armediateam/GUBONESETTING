import { z } from "zod"

export const patientSchema = z.object({
  fullName: z.string().min(1, { message: "Nama wajib diisi" }),
  phone: z
    .string()
    .min(6, { message: "Nomor telepon tidak valid" })
    .regex(/^[0-9+\-()\s]+$/, { message: "Nomor telepon tidak valid" }),
  email: z
    .string()
    .email({ message: "Email tidak valid" })
    .optional()
    .or(z.literal("")),
  gender: z.string().optional().or(z.literal("")),
  dateOfBirth: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
})

export const patientUpdateSchema = patientSchema.partial()

export const appointmentSchema = z.object({
  patientId: z.string().min(1),
  serviceName: z.string().min(1),
  startAt: z.string().min(1),
  endAt: z.string().min(1),
  status: z.enum(["scheduled", "completed", "cancelled", "no_show"]),
})

export const noteSchema = z.object({
  patientId: z.string().min(1),
  title: z.string().optional().or(z.literal("")),
  note: z.string().min(1, { message: "Catatan wajib diisi" }),
  createdBy: z.string().optional().or(z.literal("")),
})

export type PatientFormValues = z.infer<typeof patientSchema>
export type PatientUpdateValues = z.infer<typeof patientUpdateSchema>
export type AppointmentInput = z.infer<typeof appointmentSchema>
export type NoteInput = z.infer<typeof noteSchema>

export type PatientRecord = PatientFormValues & {
  id: string
  createdAt: string
  updatedAt: string
}

export type AppointmentRecord = AppointmentInput & {
  id: string
  createdAt: string
}

export type NoteRecord = NoteInput & {
  id: string
  createdAt: string
  updatedAt: string
}
