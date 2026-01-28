import { z } from "zod"

import { serviceSchema } from "@/lib/services/schema"

export const serviceFormSchema = z.object({
  name: serviceSchema.shape.name,
  durationMins: serviceSchema.shape.durationMins.optional(),
  isActive: serviceSchema.shape.isActive.unwrap(),
})

export type ServiceFormValues = z.infer<typeof serviceFormSchema>
