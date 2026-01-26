import { z } from "zod"

export const therapistSchema = z.object({
  name: z.string().min(1, { message: "Nama wajib diisi" }),
  email: z.string().email({ message: "Email tidak valid" }),
  phone: z.string().optional().or(z.literal("")),
  experience: z.number().int().min(0),
  isActive: z.boolean().default(true),
})

export const therapistUpdateSchema = therapistSchema.partial()

export type TherapistInput = z.infer<typeof therapistSchema>
export type TherapistUpdateInput = z.infer<typeof therapistUpdateSchema>

export type TherapistRecord = TherapistInput & {
  id: string
  createdAt: string
  updatedAt: string
}
