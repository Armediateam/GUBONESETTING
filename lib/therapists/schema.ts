import { z } from "zod"

export const therapistGenderValues = ["Female", "Male"] as const

export const therapistServiceRateSchema = z.object({
  serviceId: z.string().min(1, { message: "Service is required" }),
  price: z.number().nonnegative({ message: "Price must be >= 0" }),
})

export const therapistSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  gender: z.enum(therapistGenderValues).optional(),
  age: z.number().int().min(18, { message: "Age must be at least 18" }).max(80, {
    message: "Age must be 80 or below",
  }).optional(),
  serviceRates: z.array(therapistServiceRateSchema).default([]),
  isActive: z.boolean().default(true),
})

export const therapistUpdateSchema = therapistSchema.partial()

export type TherapistInput = z.infer<typeof therapistSchema>
export type TherapistUpdateInput = z.infer<typeof therapistUpdateSchema>
export type TherapistGender = z.infer<typeof therapistSchema>["gender"]
export type TherapistServiceRate = z.infer<typeof therapistServiceRateSchema>

export type TherapistRecord = TherapistInput & {
  id: string
  createdAt: string
  updatedAt: string
}
