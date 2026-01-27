import { z } from "zod"

export const therapistSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  price: z.number().nonnegative({ message: "Price must be >= 0" }),
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
