export type BookingPaymentBreakdown = {
  subtotalAmount: number
  taxPercent: number
  taxAmount: number
  totalAmount: number
}

const DEFAULT_PPN_PERCENT = 11

export const getBookingPpnPercent = () => {
  const raw = process.env.NEXT_PUBLIC_BOOKING_PPN_PERCENT?.trim()
  const parsed = raw ? Number(raw) : DEFAULT_PPN_PERCENT
  if (!Number.isFinite(parsed) || parsed < 0) {
    return DEFAULT_PPN_PERCENT
  }
  return parsed
}

export const calculateBookingPayment = (subtotalAmount: number): BookingPaymentBreakdown => {
  const normalizedSubtotal = Math.max(0, Math.round(subtotalAmount))
  const taxPercent = getBookingPpnPercent()
  const taxAmount = Math.round((normalizedSubtotal * taxPercent) / 100)

  return {
    subtotalAmount: normalizedSubtotal,
    taxPercent,
    taxAmount,
    totalAmount: normalizedSubtotal + taxAmount,
  }
}
