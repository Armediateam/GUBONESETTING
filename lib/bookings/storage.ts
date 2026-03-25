import path from "path"
import crypto from "crypto"

import { readJson, writeJsonAtomic } from "@/lib/storage/json"
import { bookingInputSchema, type BookingInput, type BookingRecord } from "./schema"

const dataDir = path.join(process.cwd(), "data")
const bookingsPath = path.join(dataDir, "bookings.json")

export const readBookings = async (): Promise<BookingRecord[]> => {
  const bookings = await readJson<BookingRecord[]>(bookingsPath, [])
  if (bookings.length === 0) {
    return bookings
  }
  const seen = new Set<string>()
  let hasDuplicates = false
  const next = bookings.map((booking) => {
    if (!seen.has(booking.id)) {
      seen.add(booking.id)
      return booking
    }
    hasDuplicates = true
    return {
      ...booking,
      id: crypto.randomUUID(),
    }
  })
  if (hasDuplicates) {
    await writeBookings(next)
  }
  return next
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
    paymentStatus: parsed.data.paymentStatus ?? "pending",
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
    paymentStatus: parsed.data.paymentStatus ?? bookings[index].paymentStatus ?? "pending",
  }
  bookings[index] = updated
  await writeBookings(bookings)
  return updated
}

export const findBookingById = async (id: string) => {
  const bookings = await readBookings()
  return bookings.find((booking) => booking.id === id) ?? null
}

export const findBookingByOrderId = async (orderId: string) => {
  const bookings = await readBookings()
  return (
    bookings.find((booking) => {
      const orderIds = booking.payment?.orderIds ?? []
      return booking.payment?.orderId === orderId || orderIds.includes(orderId)
    }) ?? null
  )
}

export const patchBooking = async (
  id: string,
  patch: Partial<BookingRecord> & { payment?: Partial<NonNullable<BookingRecord["payment"]>> }
) => {
  const bookings = await readBookings()
  const index = bookings.findIndex((booking) => booking.id === id)
  if (index === -1) {
    return null
  }

  const current = bookings[index]
  const updated: BookingRecord = {
    ...current,
    ...patch,
    payment:
      patch.payment === undefined
        ? current.payment
        : {
            ...(current.payment ?? {}),
            ...patch.payment,
          },
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
