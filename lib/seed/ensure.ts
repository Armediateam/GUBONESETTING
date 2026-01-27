import path from "path"
import crypto from "crypto"

import { readJson, writeJsonAtomic } from "@/lib/storage/json"
import { scheduleSchema, type Schedule, type ScheduleConfig } from "@/lib/schedule/schema"
import type { PatientRecord, NoteRecord } from "@/lib/patients/schema"
import type { BookingRecord } from "@/lib/bookings/schema"
import type { LocationRecord } from "@/lib/locations/schema"
import type { TherapistRecord } from "@/lib/therapists/schema"

const dataDir = path.join(process.cwd(), "data")
const locationsPath = path.join(dataDir, "locations.json")
const schedulesPath = path.join(dataDir, "schedules.json")
const patientsPath = path.join(dataDir, "patients.json")
const bookingsPath = path.join(dataDir, "bookings.json")
const notesPath = path.join(dataDir, "patient-notes.json")
const therapistsPath = path.join(dataDir, "therapists.json")

const MIN_PATIENTS = 18
const MAX_PATIENTS = 26
const MIN_BOOKINGS = 30
const MAX_BOOKINGS = 55
const MIN_NOTES = 24
const MAX_NOTES = 42

type Random = () => number

const createRandom = (seed: number): Random => {
  let t = seed
  return () => {
    t += 0x6d2b79f5
    let x = Math.imul(t ^ (t >>> 15), 1 | t)
    x ^= x + Math.imul(x ^ (x >>> 7), 61 | x)
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296
  }
}

const pick = <T>(items: T[], rand: Random) => items[Math.floor(rand() * items.length)]

const pad = (value: number) => String(value).padStart(2, "0")

const dateKeyFromDate = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`

const zonedLocalToUtc = (dateKey: string, time: string, timeZone: string) => {
  const [year, month, day] = dateKey.split("-").map((value) => Number(value))
  const [hours, minutes] = time.split(":").map((value) => Number(value))
  const utcGuess = new Date(Date.UTC(year, month - 1, day, hours, minutes, 0))

  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
  const parts = formatter.formatToParts(utcGuess)
  const lookup = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  const zonedUtc = Date.UTC(
    Number(lookup.year),
    Number(lookup.month) - 1,
    Number(lookup.day),
    Number(lookup.hour),
    Number(lookup.minute),
    Number(lookup.second)
  )
  const offset = zonedUtc - utcGuess.getTime()
  return new Date(utcGuess.getTime() - offset)
}

const buildSeedSchedule = (offsetDays: number): Schedule => {
  const today = new Date()
  const overrideDate1 = dateKeyFromDate(
    new Date(today.getTime() + (3 + offsetDays) * 24 * 60 * 60 * 1000)
  )
  const overrideDate2 = dateKeyFromDate(
    new Date(today.getTime() + (10 + offsetDays) * 24 * 60 * 60 * 1000)
  )

  return {
    timezone: "Asia/Jakarta",
    weekly: {
      mon: { enabled: true, ranges: [{ start: "09:00", end: "17:00" }] },
      tue: { enabled: true, ranges: [{ start: "09:00", end: "17:00" }] },
      wed: { enabled: true, ranges: [{ start: "09:00", end: "17:00" }] },
      thu: { enabled: true, ranges: [{ start: "09:00", end: "17:00" }] },
      fri: { enabled: true, ranges: [{ start: "09:00", end: "17:00" }] },
      sat: { enabled: true, ranges: [{ start: "10:00", end: "14:00" }] },
      sun: { enabled: false, ranges: [] },
    },
    overrides: [
      { date: overrideDate1, closed: true, ranges: [] },
      { date: overrideDate2, closed: false, ranges: [{ start: "12:00", end: "18:00" }] },
    ],
    slotDurationMins: 30,
    bufferMins: 10,
    minNoticeHours: 2,
    maxFutureDays: 30,
    maxBookingsPerDay: null,
  }
}

const namePool = [
  "Alya",
  "Bima",
  "Citra",
  "Dimas",
  "Eka",
  "Farah",
  "Gita",
  "Hafiz",
  "Intan",
  "Joko",
  "Karina",
  "Lutfi",
  "Maya",
  "Nadia",
  "Oki",
  "Putri",
  "Rafi",
  "Salsa",
  "Tara",
  "Umar",
  "Vina",
  "Wulan",
  "Yusuf",
  "Zahra",
]

const lastNamePool = [
  "Adriansyah",
  "Wijaya",
  "Saputra",
  "Pratama",
  "Wibowo",
  "Santoso",
  "Siregar",
  "Kusuma",
  "Mahendra",
  "Harahap",
  "Gunawan",
  "Putra",
  "Azizah",
  "Setiawan",
]

const servicePool = [
  "Deep Tissue Massage",
  "Aromatherapy Session",
  "Facial Treatment",
  "Body Scrub",
  "Hot Stone Massage",
  "Reflexology",
]

const notePool = [
  "Pasien merasa lebih rileks setelah sesi.",
  "Perlu follow up untuk area bahu.",
  "Minta sesi pagi minggu depan.",
  "Ada riwayat alergi ringan.",
  "Sesi berjalan lancar tanpa keluhan.",
  "Prefer ruangan lebih hangat.",
]



const generatePatients = (rand: Random, count: number): PatientRecord[] => {
  const now = new Date()
  return Array.from({ length: count }).map(() => {
    const first = pick(namePool, rand)
    const last = pick(lastNamePool, rand)
    const createdOffset = Math.floor(rand() * 90)
    const createdAt = new Date(now.getTime() - createdOffset * 24 * 60 * 60 * 1000)
    const updatedAt = new Date(createdAt.getTime() + Math.floor(rand() * 10) * 24 * 60 * 60 * 1000)
    const phone = `08${Math.floor(100000000 + rand() * 900000000)}`
    const emailChance = rand() > 0.3
    return {
      id: crypto.randomUUID(),
      fullName: `${first} ${last}`,
      phone,
      email: emailChance ? `${first.toLowerCase()}.${last.toLowerCase()}@mail.com` : undefined,
      gender: rand() > 0.5 ? "Perempuan" : "Laki-laki",
      dateOfBirth: `${1988 + Math.floor(rand() * 15)}-${pad(1 + Math.floor(rand() * 12))}-${pad(
        1 + Math.floor(rand() * 28)
      )}`,
      address: `Jl. ${pick(lastNamePool, rand)} No. ${Math.floor(rand() * 120) + 1}`,
      createdAt: createdAt.toISOString(),
      updatedAt: updatedAt.toISOString(),
    }
  })
}




const generateNotes = (rand: Random, patients: PatientRecord[], count: number): NoteRecord[] => {
  const now = new Date()
  return Array.from({ length: count }).map(() => {
    const patient = pick(patients, rand)
    const createdOffset = Math.floor(rand() * 30)
    const createdAt = new Date(now.getTime() - createdOffset * 24 * 60 * 60 * 1000)
    const updatedAt = new Date(createdAt.getTime() + Math.floor(rand() * 3) * 24 * 60 * 60 * 1000)
    return {
      id: crypto.randomUUID(),
      patientId: patient.id,
      title: rand() > 0.6 ? "Catatan kunjungan" : undefined,
      note: pick(notePool, rand),
      createdBy: rand() > 0.5 ? "Admin" : "Therapist",
      createdAt: createdAt.toISOString(),
      updatedAt: updatedAt.toISOString(),
    }
  })
}

const getOverrideForDate = (schedule: Schedule, dateKey: string) =>
  schedule.overrides.find((override) => override.date === dateKey)

const getWeeklyRanges = (schedule: Schedule, dateKey: string) => {
  const probe = zonedLocalToUtc(dateKey, "12:00", schedule.timezone)
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: schedule.timezone,
    weekday: "short",
  }).format(probe)
  const map: Record<string, keyof Schedule["weekly"]> = {
    Mon: "mon",
    Tue: "tue",
    Wed: "wed",
    Thu: "thu",
    Fri: "fri",
    Sat: "sat",
    Sun: "sun",
  }
  const key = map[weekday]
  if (!key) return []
  const config = schedule.weekly[key]
  if (!config.enabled) return []
  return config.ranges
}

const buildSlotsForDate = (schedule: Schedule, dateKey: string) => {
  const override = getOverrideForDate(schedule, dateKey)
  if (override?.closed) return []
  const ranges = override ? override.ranges ?? [] : getWeeklyRanges(schedule, dateKey)
  if (ranges.length === 0) return []

  const slots: { startISO: string; endISO: string }[] = []
  for (const range of ranges) {
    const [startH, startM] = range.start.split(":").map(Number)
    const [endH, endM] = range.end.split(":").map(Number)
    let cursor = startH * 60 + startM
    const endMinutes = endH * 60 + endM
    while (cursor + schedule.slotDurationMins <= endMinutes) {
      const hours = Math.floor(cursor / 60)
      const minutes = cursor % 60
      const startISO = zonedLocalToUtc(
        dateKey,
        `${pad(hours)}:${pad(minutes)}`,
        schedule.timezone
      ).toISOString()
      const endISO = new Date(
        new Date(startISO).getTime() + schedule.slotDurationMins * 60 * 1000
      ).toISOString()
      slots.push({ startISO, endISO })
      cursor += schedule.slotDurationMins + schedule.bufferMins
    }
  }
  return slots
}

const generateBookings = (
  rand: Random,
  schedules: ScheduleConfig[],
  locations: LocationRecord[],
  therapists: TherapistRecord[],
  patients: PatientRecord[],
  count: number
): BookingRecord[] => {
  const now = new Date()
  const used = new Set<string>()
  const bookings: BookingRecord[] = []
  const pastTarget = Math.floor(count * 0.65)
  const futureTarget = count - pastTarget

  const buildForRange = (
    startOffset: number,
    endOffset: number,
    statusPool: BookingRecord["status"][]
  ) => {
    let attempts = 0
    while (bookings.length < count && attempts < count * 10) {
      attempts += 1
      const offsetDays = Math.floor(rand() * (endOffset - startOffset + 1)) + startOffset
      const date = new Date(now.getTime() + offsetDays * 24 * 60 * 60 * 1000)
      const dateKey = dateKeyFromDate(date)
      const location = pick(locations, rand)
      const scheduleConfig = schedules.find((item) => item.locationId === location.id)
      const schedule = scheduleConfig ?? buildSeedSchedule(0)
      const slots = buildSlotsForDate(schedule, dateKey)
      if (slots.length === 0) continue
      const slot = pick(slots, rand)
      const slotKey = `${location.id}:${slot.startISO}`
      if (used.has(slotKey)) continue
      const patient = pick(patients, rand)
      const therapist = pick(therapists, rand)
      const status = pick(statusPool, rand)
      const createdAt = new Date(new Date(slot.startISO).getTime() - Math.floor(rand() * 7) * 24 * 60 * 60 * 1000)
      bookings.push({
        id: crypto.randomUUID(),
        patientId: patient.id,
        locationId: location.id,
        locationName: location.name,
        locationAddress: location.address,
        therapistId: therapist.id,
        therapistName: therapist.name,
        serviceName: pick(servicePool, rand),
        startISO: slot.startISO,
        endISO: slot.endISO,
        status,
        createdAt: createdAt.toISOString(),
      })
      used.add(slotKey)
      if (offsetDays < 0 && bookings.filter((b) => b.status !== "scheduled").length >= pastTarget) break
      if (offsetDays >= 0 && bookings.filter((b) => b.status === "scheduled").length >= futureTarget) break
    }
  }

  buildForRange(-30, -1, ["completed", "completed", "cancelled", "no_show"])
  buildForRange(0, 14, ["scheduled", "scheduled", "scheduled"])

  return bookings.slice(0, count)
}

export async function ensureSeedData() {
  const rand = createRandom(42)

  const seededLocations = await readJson<LocationRecord[]>(locationsPath, [])

  const schedules = await readJson<ScheduleConfig[]>(schedulesPath, [])
  const scheduleMap = new Map(schedules.map((item) => [item.locationId, item]))
  const seededSchedules: ScheduleConfig[] = [...schedules]

  if (seededLocations.length > 0) {
    for (const [index, location] of seededLocations.entries()) {
      const existing = scheduleMap.get(location.id)
      if (existing) {
        const parsed = scheduleSchema.safeParse(existing)
        if (parsed.success) {
          continue
        }
      }
      seededSchedules.push({
        ...buildSeedSchedule(index),
        locationId: location.id,
      })
    }

    if (seededSchedules.length !== schedules.length) {
      await writeJsonAtomic(schedulesPath, seededSchedules)
    }
  }

  const therapists = await readJson<TherapistRecord[]>(therapistsPath, [])
  const normalizedTherapists = therapists.map((therapist) => {
    if (typeof therapist.price === "number") {
      return therapist
    }
    return {
      ...therapist,
      price: 0,
      updatedAt: new Date().toISOString(),
    }
  })
  if (normalizedTherapists.some((therapist, index) => therapist !== therapists[index])) {
    await writeJsonAtomic(therapistsPath, normalizedTherapists)
  }

  const activeTherapists = normalizedTherapists.filter((therapist) => therapist.isActive)
  const normalizedLocations: LocationRecord[] = seededLocations.map((location) => ({
    ...location,
  }))
  if (activeTherapists.length > 0 && seededLocations.length > 0) {
    const activeLimit = Math.min(activeTherapists.length, seededLocations.length)
    const activeIds = new Set(
      seededLocations.filter((location) => location.isActive).map((location) => location.id)
    )
    const nextLocations: LocationRecord[] = seededLocations.map((location) => {
      const isActive = activeIds.has(location.id)
      return { ...location, isActive }
    })
    if (activeIds.size > activeLimit) {
      let count = 0
      for (let i = 0; i < nextLocations.length; i += 1) {
        if (nextLocations[i].isActive) {
          count += 1
          if (count > activeLimit) {
            nextLocations[i] = {
              ...nextLocations[i],
              isActive: false,
              updatedAt: new Date().toISOString(),
            }
          }
        }
      }
    }
    if (nextLocations.some((location, index) => location.isActive !== seededLocations[index]?.isActive)) {
      await writeJsonAtomic(locationsPath, nextLocations)
    }
    normalizedLocations.splice(0, normalizedLocations.length, ...nextLocations)
  }

  // Service seeding intentionally removed to avoid auto-repopulating deleted services.

  const patients = await readJson<PatientRecord[]>(patientsPath, [])
  const targetPatients =
    patients.length >= MIN_PATIENTS
      ? patients.length
      : MIN_PATIENTS + Math.floor(rand() * (MAX_PATIENTS - MIN_PATIENTS + 1))
  const seededPatients =
    patients.length >= targetPatients
      ? patients
      : [...patients, ...generatePatients(rand, targetPatients - patients.length)]
  if (seededPatients.length !== patients.length) {
    await writeJsonAtomic(patientsPath, seededPatients)
  }

  const notes = await readJson<NoteRecord[]>(notesPath, [])
  const targetNotes =
    notes.length >= MIN_NOTES
      ? notes.length
      : MIN_NOTES + Math.floor(rand() * (MAX_NOTES - MIN_NOTES + 1))
  const seededNotes =
    notes.length >= targetNotes
      ? notes
      : [...generateNotes(rand, seededPatients, targetNotes - notes.length), ...notes]
  if (seededNotes.length !== notes.length) {
    await writeJsonAtomic(notesPath, seededNotes)
  }

  const bookings = await readJson<BookingRecord[]>(bookingsPath, [])
  const normalizedBookings = bookings.map((booking) => {
    if (booking.locationId) {
      return booking
    }
    const fallbackLocation = normalizedLocations[0]
    return {
      ...booking,
      locationId: fallbackLocation?.id ?? "",
      locationName: booking.locationName ?? fallbackLocation?.name,
      locationAddress: booking.locationAddress ?? fallbackLocation?.address,
    }
  })
  const withTherapistBookings = normalizedBookings.map((booking) => {
    if (booking.therapistId) {
      return booking
    }
    const fallbackTherapist = normalizedTherapists[0]
    return {
      ...booking,
      therapistId: fallbackTherapist?.id ?? "",
      therapistName: booking.therapistName ?? fallbackTherapist?.name,
    }
  })
  const withPaymentBookings = withTherapistBookings.map((booking) => {
    if (booking.paymentStatus) {
      return booking
    }
    return {
      ...booking,
      paymentStatus: "pending",
    }
  })
  if (
    withPaymentBookings.length !== bookings.length ||
    withPaymentBookings.some((b, i) => b !== bookings[i])
  ) {
    await writeJsonAtomic(bookingsPath, withPaymentBookings)
  }
  const baseBookings = withPaymentBookings
  const targetBookings =
    baseBookings.length >= MIN_BOOKINGS
      ? baseBookings.length
      : MIN_BOOKINGS + Math.floor(rand() * (MAX_BOOKINGS - MIN_BOOKINGS + 1))
  const canSeedBookings = normalizedTherapists.length > 0
  const seededBookings =
    baseBookings.length >= targetBookings || !canSeedBookings
      ? baseBookings
      : [
          ...baseBookings,
          ...generateBookings(
            rand,
            seededSchedules,
            normalizedLocations,
            normalizedTherapists,
            seededPatients,
            targetBookings - baseBookings.length
          ),
        ]
  if (seededBookings.length !== baseBookings.length) {
    await writeJsonAtomic(bookingsPath, seededBookings)
  }
}
