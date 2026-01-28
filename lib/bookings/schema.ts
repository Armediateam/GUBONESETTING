import { z } from "zod"

export const bookingStatusSchema = z.enum(["scheduled", "completed", "cancelled", "no_show"])
export const paymentStatusSchema = z.enum([
  "pending",
  "paid",
  "failed",
  "expired",
  "refunded",
])

export const bookingInputSchema = z
  .object({
    patientId: z.string().min(1),
    locationId: z.string().min(1, "Position is required"),
    therapistId: z.string().min(1, "Therapist is required"),
    serviceName: z.string().min(1),
    complaint: z.string().optional(),
    startISO: z.string().min(1),
    endISO: z.string().min(1),
    status: bookingStatusSchema.optional(),
    paymentStatus: paymentStatusSchema.optional(),
    payment: z
      .object({
        provider: z.string().optional(),
        orderId: z.string().optional(),
        transactionId: z.string().optional(),
        paymentType: z.string().optional(),
        grossAmount: z.number().nonnegative().optional(),
        currency: z.string().optional(),
        transactionTime: z.string().optional(),
        settlementTime: z.string().optional(),
        statusMessage: z.string().optional(),
      })
      .optional(),
    locationName: z.string().optional(),
    locationAddress: z.string().optional(),
    therapistName: z.string().optional(),
  })
  .refine((value) => !Number.isNaN(Date.parse(value.startISO)), {
    message: "Start time invalid",
    path: ["startISO"],
  })
  .refine((value) => !Number.isNaN(Date.parse(value.endISO)), {
    message: "End time invalid",
    path: ["endISO"],
  })
  .refine((value) => new Date(value.endISO).getTime() > new Date(value.startISO).getTime(), {
    message: "End time must be after start time",
    path: ["endISO"],
  })

export type BookingInput = z.infer<typeof bookingInputSchema>

export type BookingRecord = BookingInput & {
  id: string
  createdAt: string
  status: z.infer<typeof bookingStatusSchema>
}
