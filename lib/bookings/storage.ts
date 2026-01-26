import path from "path"
import crypto from "crypto"

import { readJson, writeJsonAtomic } from "@/lib/storage/json"
import { bookingInputSchema, type BookingInput, type BookingRecord } from "./schema"

const dataDir = path.join(process.cwd(), "data")
const bookingsPath = path.join(dataDir, "bookings.json")

export const readBookings = async (): Promise<BookingRecord[]> => {
  return readJson<BookingRecord[]>(bookingsPath, [])
}

export const writeBookings = async (bookings: BookingRecord[]) => {
  await writeJsonAtomic(bookingsPath, bookings)
}

export const createBooking = async (input: BookingInput) => {
  const parsed = bookingInputSchema.safeParse(input)
  if (!parsed.success) {
    throw parsed.error
  }
  const now = new Date().toISOString()
  const bookings = await readBookings()
  const booking: BookingRecord = {
    id: crypto.randomUUID(),
    ...parsed.data,
    status: parsed.data.status ?? "scheduled",
    createdAt: now,
  }
  bookings.push(booking)
  await writeBookings(bookings)
  return booking
}

export const updateBooking = async (id: string, input: BookingInput) => {
  const parsed = bookingInputSchema.safeParse(input)
  if (!parsed.success) {
    throw parsed.error
  }
  const bookings = await readBookings()
  const index = bookings.findIndex((booking) => booking.id === id)
  if (index === -1) {
    return null
  }
  const updated: BookingRecord = {
    ...bookings[index],
    ...parsed.data,
    status: parsed.data.status ?? bookings[index].status,
  }
  bookings[index] = updated
  await writeBookings(bookings)
  return updated
}

export const deleteBooking = async (id: string) => {
  const bookings = await readBookings()
  const next = bookings.filter((booking) => booking.id !== id)
  if (next.length === bookings.length) {
    return false
  }
  await writeBookings(next)
  return true
}

export const summarizeBookings = (bookings: BookingRecord[]) => {
  const total = bookings.length
  const completed = bookings.filter((booking) => booking.status === "completed").length
  const cancelled = bookings.filter((booking) =>
    booking.status === "cancelled" || booking.status === "no_show"
  ).length
  const upcomingList = bookings
    .filter((booking) => booking.status === "scheduled")
    .sort((a, b) => new Date(a.startISO).getTime() - new Date(b.startISO).getTime())
  const upcoming = upcomingList.length > 0 ? upcomingList[0].startISO : null
  const lastVisit = bookings
    .filter((booking) => booking.status === "completed")
    .sort((a, b) => new Date(b.startISO).getTime() - new Date(a.startISO).getTime())
  const lastVisitAt = lastVisit.length > 0 ? lastVisit[0].startISO : null

  return { total, completed, cancelled, upcoming, lastVisitAt }
}
