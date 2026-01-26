import { z } from "zod"

export const locationSchema = z.object({
  name: z.string().min(1, { message: "Nama lokasi wajib diisi" }),
  address: z.string().optional().or(z.literal("")),
  city: z.string().optional().or(z.literal("")),
  googleMapsUrl: z.string().url({ message: "URL tidak valid" }).optional().or(z.literal("")),
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
