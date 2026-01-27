// lib/validation.ts
import { z } from "zod"

// ===== Admin Login =====
export const adminLoginSchema = z.object({
  email: z.string().email({ message: "Email tidak valid" }),
  password: z.string().min(6, { message: "Password minimal 6 karakter" }),
})

// ===== Therapist =====
export const therapistSchema = z.object({
  name: z.string().min(1, { message: "Nama dokter wajib diisi" }),
  specialty: z.string().min(1, { message: "Spesialisasi wajib diisi" }),
  price: z.number().nonnegative({ message: "Harga harus >= 0" }),
})

// ===== Patient =====
export const patientSchema = z.object({
  name: z.string().min(1, { message: "Nama pasien wajib diisi" }),
  email: z.string().email({ message: "Email tidak valid" }),
  phone: z.string().optional(),
})

// ===== Service =====
export const serviceSchema = z.object({
  name: z.string().min(1, { message: "Nama layanan wajib diisi" }),
})

// ===== Booking =====
export const bookingSchema = z.object({
  therapistId: z.string().min(1, { message: "Therapist ID wajib diisi" }),
  patientId: z.string().min(1, { message: "Patient ID wajib diisi" }),
  serviceId: z.string().optional(),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Tanggal tidak valid",
  }),
  status: z.enum(["pending", "done", "canceled"]).optional(),
})
