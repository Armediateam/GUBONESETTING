import { z } from "zod"

export const locationSchema = z.object({
  name: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  city: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
  isActive: z.boolean().default(true),
})

export const locationUpdateSchema = locationSchema.partial()

export type LocationInput = z.infer<typeof locationSchema>
export type LocationUpdateInput = z.infer<typeof locationUpdateSchema>

export type LocationRecord = LocationInput & {
  id: string
  createdAt: string
  updatedAt: string
}
