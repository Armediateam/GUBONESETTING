import { z } from "zod"

export const dayKeys = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const
export type DayKey = (typeof dayKeys)[number]

export type TimeRange = { start: string; end: string }
export type DayAvailability = { enabled: boolean; ranges: TimeRange[] }
export type Override = { date: string; closed: boolean; ranges?: TimeRange[] }

export const SLOT_DURATIONS = [15, 30, 45, 60] as const
export const BUFFER_MINS = [0, 5, 10, 15, 30] as const
export const MIN_NOTICE_HOURS = [1, 2, 6, 12, 24] as const
export const MAX_FUTURE_DAYS = [7, 14, 30, 60, 90] as const

export type SlotDuration = (typeof SLOT_DURATIONS)[number]
export type BufferMins = (typeof BUFFER_MINS)[number]
export type MinNoticeHours = (typeof MIN_NOTICE_HOURS)[number]
export type MaxFutureDays = (typeof MAX_FUTURE_DAYS)[number]

const timeRegex = /^\d{2}:\d{2}$/

const toMinutes = (time: string) => {
  const [h, m] = time.split(":").map((value) => Number(value))
  return h * 60 + m
}

export const timeRangeSchema = z
  .object({
    start: z.string().regex(timeRegex, { message: "Use HH:mm format" }),
    end: z.string().regex(timeRegex, { message: "Use HH:mm format" }),
  })
  .superRefine((range, ctx) => {
    if (toMinutes(range.start) >= toMinutes(range.end)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "End time must be after start time",
        path: ["end"],
      })
    }
  })

export const dayAvailabilitySchema = z
  .object({
    enabled: z.boolean(),
    ranges: z.array(timeRangeSchema),
  })
  .superRefine((day, ctx) => {
    if (day.enabled && day.ranges.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Add at least one time range",
        path: ["ranges"],
      })
    }

    const sorted = [...day.ranges].sort(
      (a, b) => toMinutes(a.start) - toMinutes(b.start)
    )

    for (let i = 1; i < sorted.length; i += 1) {
      if (toMinutes(sorted[i].start) < toMinutes(sorted[i - 1].end)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Time ranges must not overlap",
          path: ["ranges"],
        })
        break
      }
    }
  })

export const overrideSchema = z
  .object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
      message: "Use YYYY-MM-DD format",
    }),
    closed: z.boolean(),
    ranges: z.array(timeRangeSchema).default([]),
  })
  .superRefine((override, ctx) => {
    if (!override.closed && override.ranges.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Add at least one time range",
        path: ["ranges"],
      })
    }

    const sorted = [...override.ranges].sort(
      (a, b) => toMinutes(a.start) - toMinutes(b.start)
    )

    for (let i = 1; i < sorted.length; i += 1) {
      if (toMinutes(sorted[i].start) < toMinutes(sorted[i - 1].end)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Time ranges must not overlap",
          path: ["ranges"],
        })
        break
      }
    }
  })

const weeklySchema = z.object({
  mon: dayAvailabilitySchema,
  tue: dayAvailabilitySchema,
  wed: dayAvailabilitySchema,
  thu: dayAvailabilitySchema,
  fri: dayAvailabilitySchema,
  sat: dayAvailabilitySchema,
  sun: dayAvailabilitySchema,
})

export const scheduleSchema = z
  .object({
    timezone: z.string().min(1, { message: "Timezone is required" }),
    weekly: weeklySchema,
    overrides: z.array(overrideSchema),
    slotDurationMins: z.union([
      z.literal(15),
      z.literal(30),
      z.literal(45),
      z.literal(60),
    ]),
    bufferMins: z.union([
      z.literal(0),
      z.literal(5),
      z.literal(10),
      z.literal(15),
      z.literal(30),
    ]),
    minNoticeHours: z.union([
      z.literal(1),
      z.literal(2),
      z.literal(6),
      z.literal(12),
      z.literal(24),
    ]),
    maxFutureDays: z.union([
      z.literal(7),
      z.literal(14),
      z.literal(30),
      z.literal(60),
      z.literal(90),
    ]),
  })
  .superRefine((schedule, ctx) => {
    const seen = new Set<string>()
    for (const override of schedule.overrides) {
      if (seen.has(override.date)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Override dates must be unique",
          path: ["overrides"],
        })
        break
      }
      seen.add(override.date)
    }
  })

export type Schedule = z.infer<typeof scheduleSchema>

export const scheduleConfigSchema = scheduleSchema.extend({
  locationId: z.string().min(1, { message: "Position is required" }),
  therapistId: z.string().min(1, { message: "Therapist is required" }),
})

export type ScheduleConfig = z.infer<typeof scheduleConfigSchema>

export const defaultSchedule: Schedule = {
  timezone: "Asia/Jakarta",
  weekly: {
    mon: { enabled: true, ranges: [{ start: "09:00", end: "17:00" }] },
    tue: { enabled: true, ranges: [{ start: "09:00", end: "17:00" }] },
    wed: { enabled: true, ranges: [{ start: "09:00", end: "17:00" }] },
    thu: { enabled: true, ranges: [{ start: "09:00", end: "17:00" }] },
    fri: { enabled: true, ranges: [{ start: "09:00", end: "17:00" }] },
    sat: { enabled: false, ranges: [] },
    sun: { enabled: false, ranges: [] },
  },
  overrides: [],
  slotDurationMins: 30,
  bufferMins: 10,
  minNoticeHours: 2,
  maxFutureDays: 30,
}
