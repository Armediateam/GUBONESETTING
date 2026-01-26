import { type DayKey, type Schedule, type TimeRange } from "./schema"

type ExistingBooking = { startISO: string; endISO: string }

type SlotDay = {
  date: string
  slots: { startISO: string; endISO: string }[]
}

const weekdayMap: Record<string, DayKey> = {
  Mon: "mon",
  Tue: "tue",
  Wed: "wed",
  Thu: "thu",
  Fri: "fri",
  Sat: "sat",
  Sun: "sun",
}

const pad = (value: number) => String(value).padStart(2, "0")

const toMinutes = (time: string) => {
  const [hours, minutes] = time.split(":").map((value) => Number(value))
  return hours * 60 + minutes
}

const getZonedParts = (date: Date, timeZone: string) => {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    weekday: "short",
  })

  const parts = formatter.formatToParts(date)
  const lookup = Object.fromEntries(parts.map((part) => [part.type, part.value]))

  return {
    year: Number(lookup.year),
    month: Number(lookup.month),
    day: Number(lookup.day),
    hour: Number(lookup.hour),
    minute: Number(lookup.minute),
    second: Number(lookup.second),
    weekday: lookup.weekday,
  }
}

const getTimeZoneOffsetMillis = (date: Date, timeZone: string) => {
  const parts = getZonedParts(date, timeZone)
  const utcFromParts = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second
  )
  return utcFromParts - date.getTime()
}

const zonedLocalToUtc = (dateKey: string, time: string, timeZone: string) => {
  const [year, month, day] = dateKey.split("-").map((value) => Number(value))
  const [hours, minutes] = time.split(":").map((value) => Number(value))
  const utcGuess = new Date(Date.UTC(year, month - 1, day, hours, minutes, 0))
  const offset = getTimeZoneOffsetMillis(utcGuess, timeZone)
  return new Date(utcGuess.getTime() - offset)
}

const getDateKeyInZone = (date: Date, timeZone: string) => {
  const parts = getZonedParts(date, timeZone)
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`
}

const addDaysInZone = (dateKey: string, days: number, timeZone: string) => {
  const base = zonedLocalToUtc(dateKey, "12:00", timeZone)
  const next = new Date(base.getTime() + days * 24 * 60 * 60 * 1000)
  return getDateKeyInZone(next, timeZone)
}

const getWeekdayKey = (dateKey: string, timeZone: string) => {
  const date = zonedLocalToUtc(dateKey, "12:00", timeZone)
  const { weekday } = getZonedParts(date, timeZone)
  return weekdayMap[weekday]
}

const rangesOverlap = (aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) => {
  return aStart < bEnd && bStart < aEnd
}

const normalizeRanges = (ranges: TimeRange[]) => {
  return [...ranges].sort((a, b) => toMinutes(a.start) - toMinutes(b.start))
}

export function generateAvailableSlots({
  schedule,
  rangeStartISO,
  rangeEndISO,
  existingBookings = [],
  ignoreWindow = false,
}: {
  schedule: Schedule
  rangeStartISO: string
  rangeEndISO: string
  existingBookings?: ExistingBooking[]
  ignoreWindow?: boolean
}): SlotDay[] {
  const timeZone = schedule.timezone
  const rangeStart = new Date(rangeStartISO)
  const rangeEnd = new Date(rangeEndISO)
  const now = new Date()
  const windowStart = ignoreWindow
    ? rangeStart
    : new Date(now.getTime() + schedule.minNoticeHours * 60 * 60 * 1000)
  const windowEnd = ignoreWindow
    ? rangeEnd
    : new Date(now.getTime() + schedule.maxFutureDays * 24 * 60 * 60 * 1000)

  const startKey = getDateKeyInZone(rangeStart, timeZone)
  const endKey = getDateKeyInZone(rangeEnd, timeZone)

  const bookings = existingBookings.map((booking) => ({
    start: new Date(booking.startISO),
    end: new Date(booking.endISO),
  }))

  const results: SlotDay[] = []
  let currentKey = startKey

  while (true) {
    const dayStartUtc = zonedLocalToUtc(currentKey, "00:00", timeZone)
    if (dayStartUtc > rangeEnd) {
      break
    }

    if (dayStartUtc < rangeStart && currentKey === startKey) {
      // still proceed; range checks happen per slot
    }

    const override = schedule.overrides.find((item) => item.date === currentKey)
    let ranges: TimeRange[] = []

    if (override) {
      if (override.closed) {
        results.push({ date: currentKey, slots: [] })
        currentKey = addDaysInZone(currentKey, 1, timeZone)
        if (currentKey === endKey && dayStartUtc > rangeEnd) {
          break
        }
        continue
      }
      ranges = override.ranges ?? []
    } else {
      const weekdayKey = getWeekdayKey(currentKey, timeZone)
      const dayConfig = schedule.weekly[weekdayKey]
      if (!dayConfig.enabled) {
        results.push({ date: currentKey, slots: [] })
        currentKey = addDaysInZone(currentKey, 1, timeZone)
        if (currentKey === endKey && dayStartUtc > rangeEnd) {
          break
        }
        continue
      }
      ranges = dayConfig.ranges
    }

    const sortedRanges = normalizeRanges(ranges)
    const slots: { startISO: string; endISO: string }[] = []

    for (const range of sortedRanges) {
      const rangeStartUtc = zonedLocalToUtc(currentKey, range.start, timeZone)
      const rangeEndUtc = zonedLocalToUtc(currentKey, range.end, timeZone)

      let cursor = rangeStartUtc
      while (true) {
        const slotStart = cursor
        const slotEnd = new Date(slotStart.getTime() + schedule.slotDurationMins * 60 * 1000)

        if (slotEnd > rangeEndUtc) {
          break
        }

        const nextCursor = new Date(
          slotStart.getTime() +
            (schedule.slotDurationMins + schedule.bufferMins) * 60 * 1000
        )

        if (slotStart >= windowStart && slotStart <= windowEnd) {
          if (slotStart >= rangeStart && slotStart <= rangeEnd) {
            const conflicts = bookings.some((booking) => {
              const bufferedStart = new Date(
                booking.start.getTime() - schedule.bufferMins * 60 * 1000
              )
              const bufferedEnd = new Date(
                booking.end.getTime() + schedule.bufferMins * 60 * 1000
              )
              return rangesOverlap(slotStart, slotEnd, bufferedStart, bufferedEnd)
            })

            if (!conflicts) {
              slots.push({
                startISO: slotStart.toISOString(),
                endISO: slotEnd.toISOString(),
              })
            }
          }
        }

        cursor = nextCursor
      }
    }

    const limitedSlots =
      schedule.maxBookingsPerDay && schedule.maxBookingsPerDay > 0
        ? slots.slice(0, schedule.maxBookingsPerDay)
        : slots

    results.push({ date: currentKey, slots: limitedSlots })

    if (currentKey === endKey) {
      break
    }
    currentKey = addDaysInZone(currentKey, 1, timeZone)
  }

  return results
}
