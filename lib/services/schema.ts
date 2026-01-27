import { z } from "zod"

export const serviceSchema = z.object({
  name: z.string().min(1, { message: "Service name is required" }),
  durationMins: z.number().int().positive().optional(),
  isActive: z.boolean().default(true),
})

export const serviceUpdateSchema = serviceSchema.partial()

export type ServiceInput = z.infer<typeof serviceSchema>
export type ServiceUpdateInput = z.infer<typeof serviceUpdateSchema>

export type ServiceRecord = ServiceInput & {
  id: string
  createdAt: string
  updatedAt: string
}
