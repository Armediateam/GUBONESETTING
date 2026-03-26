"use client"

import * as React from "react"
import Link from "next/link"
import { zodResolver } from "@hookform/resolvers/zod"
import { CalendarIcon, Download, Filter, MoreVertical, Plus, Search, X } from "lucide-react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import type { PatientRecord } from "@/lib/patients/schema"
import type { BookingRecord } from "@/lib/bookings/schema"
import { bookingStatusSchema, paymentStatusSchema } from "@/lib/bookings/schema"
import { calculateBookingPayment } from "@/lib/payments/pricing"
import type { TherapistRecord } from "@/lib/therapists/schema"
import type { LocationRecord } from "@/lib/locations/schema"
import type { ScheduleConfig } from "@/lib/schedule/schema"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
type SlotDay = {
  date: string
  slots: { startISO: string; endISO: string }[]
  totalSlots?: number
}

type SlotResponse = {
  timeZone: string
  items: SlotDay[]
}

async function fetchSlotResponse(url: string) {
  const res = await fetch(url)
  const contentType = res.headers.get("content-type") ?? ""

  const payload = contentType.includes("application/json")
    ? await res.json().catch(() => null)
    : await res.text().catch(() => null)

  if (res.ok) {
    return { ok: true as const, data: payload as SlotResponse }
  }

  const messageFromJson =
    payload &&
    typeof payload === "object" &&
    "message" in payload &&
    typeof (payload as { message?: unknown }).message === "string"
      ? (payload as { message: string }).message
      : null

  const message =
    messageFromJson ||
    (typeof payload === "string" ? payload : null) ||
    res.statusText ||
    "Request failed"

  return { ok: false as const, status: res.status, message: String(message) }
}

type ServiceItem = {
  id: string
  name: string
  durationMins?: number
  isActive?: boolean
}

type TherapistServiceOption = ServiceItem & {
  price: number
}

const bookingFormSchema = z.object({
  fullName: z.string().min(1, "Nama wajib diisi"),
  phone: z
    .string()
    .min(6, "Nomor telepon tidak valid")
    .regex(/^[0-9+\-()\s]+$/, "Nomor telepon tidak valid"),
  email: z.string().email("Email tidak valid").optional().or(z.literal("")),
  complaint: z.string().optional().or(z.literal("")),
  locationId: z.string().min(1, "Position is required"),
  therapistId: z.string().min(1, "Therapist is required"),
  serviceId: z.string().min(1, "Service is required"),
  dateKey: z.string().min(1, "Date is required"),
  slotStartISO: z.string().min(1, "Slot waktu wajib dipilih"),
  slotEndISO: z.string().min(1, "Slot waktu wajib dipilih"),
})

type BookingFormValues = z.infer<typeof bookingFormSchema>

const bookingStepFields: Record<number, (keyof BookingFormValues)[]> = {
  1: ["fullName", "phone", "email"],
  2: ["locationId", "therapistId", "serviceId"],
  3: ["dateKey", "slotStartISO", "slotEndISO"],
  4: [],
  5: [],
}

const getBookingStepForField = (fieldName?: keyof BookingFormValues) => {
  if (!fieldName) return 1
  if (bookingStepFields[1].includes(fieldName)) return 1
  if (bookingStepFields[2].includes(fieldName)) return 2
  if (bookingStepFields[3].includes(fieldName)) return 3
  return 1
}

const statusLabel: Record<string, string> = {
  scheduled: "Scheduled",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "No Show",
}

const statusVariant: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  scheduled: "secondary",
  completed: "default",
  cancelled: "destructive",
  no_show: "outline",
}

const paymentLabel: Record<string, string> = {
  pending: "Pending",
  paid: "Paid",
  failed: "Failed",
  expired: "Expired",
  refunded: "Refunded",
}

const paymentVariant: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  pending: "secondary",
  paid: "default",
  failed: "destructive",
  expired: "outline",
  refunded: "outline",
}

const paymentMethodLabel: Record<string, string> = {
  cash: "Cash",
  bank_transfer: "Transfer Bank",
  qris: "QRIS",
  other: "Lainnya",
  midtrans: "Midtrans",
  manual: "Cash",
}

const formatDateKey = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

const parseDateKey = (value: string) => {
  const [year, month, day] = value.split("-").map((part) => Number(part))
  return new Date(year, month - 1, day)
}

const getMonthRange = (value: Date) => {
  const start = new Date(value.getFullYear(), value.getMonth(), 1, 0, 0, 0, 0)
  const end = new Date(value.getFullYear(), value.getMonth() + 1, 0, 23, 59, 59, 999)
  return { start, end }
}

const formatUtcDateOnly = (value: Date) => {
  const year = value.getUTCFullYear()
  const month = String(value.getUTCMonth() + 1).padStart(2, "0")
  const day = String(value.getUTCDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

const addUtcDays = (value: Date, days: number) => {
  const next = new Date(value)
  next.setUTCDate(next.getUTCDate() + days)
  return next
}

const dateRangeLabel: Record<string, string> = {
  all: "All dates",
  today: "Today",
  thisWeek: "This week",
  thisMonth: "This month",
  last7: "Last 7 days",
  last30: "Last 30 days",
}

const formatDateTime = (value: string, timeZone?: string) =>
  new Intl.DateTimeFormat("id-ID", {
    timeZone,
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value))

const formatDate = (value: string, timeZone?: string) =>
  new Intl.DateTimeFormat("id-ID", {
    timeZone,
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value))

const formatTime = (value: string, timeZone?: string) =>
  new Intl.DateTimeFormat("id-ID", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value))

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value)

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")

export function BookingDashboard() {
  const totalBookingSteps = 5
  const [paymentMethodDraft, setPaymentMethodDraft] = React.useState<
    "cash" | "bank_transfer" | "qris" | "other"
  >("cash")
  const [locations, setLocations] = React.useState<LocationRecord[]>([])
  const [patients, setPatients] = React.useState<PatientRecord[]>([])
  const [bookings, setBookings] = React.useState<BookingRecord[]>([])
  const [therapists, setTherapists] = React.useState<TherapistRecord[]>([])
  const [services, setServices] = React.useState<ServiceItem[]>([])
  const [schedulePairs, setSchedulePairs] = React.useState<
    { locationId: string; therapistId: string }[]
  >([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [bookingStep, setBookingStep] = React.useState(1)
  const [slotLoading, setSlotLoading] = React.useState(false)
  const [slots, setSlots] = React.useState<SlotResponse | null>(null)
  const [slotNotice, setSlotNotice] = React.useState<string | null>(null)
  const [calendarSlots, setCalendarSlots] = React.useState<SlotResponse | null>(null)
  const [calendarSlotNotice, setCalendarSlotNotice] = React.useState<string | null>(null)
  const [rescheduleOpen, setRescheduleOpen] = React.useState(false)
  const [rescheduleBooking, setRescheduleBooking] = React.useState<BookingRecord | null>(null)
  const [rescheduleDate, setRescheduleDate] = React.useState<Date | undefined>()
  const [rescheduleMonth, setRescheduleMonth] = React.useState<Date>(new Date())
  const [rescheduleCalendarSlots, setRescheduleCalendarSlots] =
    React.useState<SlotResponse | null>(null)
  const [rescheduleCalendarNotice, setRescheduleCalendarNotice] =
    React.useState<string | null>(null)
  const [rescheduleSlots, setRescheduleSlots] = React.useState<SlotResponse | null>(null)
  const [rescheduleSlotNotice, setRescheduleSlotNotice] = React.useState<string | null>(null)
  const [rescheduleSlotLoading, setRescheduleSlotLoading] = React.useState(false)
  const [rescheduleSlotStartISO, setRescheduleSlotStartISO] = React.useState("")
  const [rescheduleSlotEndISO, setRescheduleSlotEndISO] = React.useState("")
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>()
  const [calendarMonth, setCalendarMonth] = React.useState<Date>(new Date())
  const [search, setSearch] = React.useState("")
  const [debouncedSearch, setDebouncedSearch] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<string>("")
  const [patientFilter, setPatientFilter] = React.useState<string>("")
  const [locationFilter, setLocationFilter] = React.useState<string>("")
  const [dateRangeFilter, setDateRangeFilter] = React.useState<string>("all")
  const [dateFrom, setDateFrom] = React.useState<string>("")
  const [dateTo, setDateTo] = React.useState<string>("")
  const [isExporting, setIsExporting] = React.useState(false)

  const applyDateRangeFilter = React.useCallback((value: string) => {
    setDateRangeFilter(value)
    const today = new Date()

    if (value === "all") {
      setDateFrom("")
      setDateTo("")
      return
    }
    if (value === "today") {
      const key = formatUtcDateOnly(today)
      setDateFrom(key)
      setDateTo(key)
      return
    }
    if (value === "thisWeek") {
      const day = today.getUTCDay() // 0=Sun
      const diffToMonday = (day + 6) % 7
      const start = addUtcDays(today, -diffToMonday)
      const end = addUtcDays(start, 6)
      setDateFrom(formatUtcDateOnly(start))
      setDateTo(formatUtcDateOnly(end))
      return
    }
    if (value === "thisMonth") {
      const start = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1))
      const end = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, 0))
      setDateFrom(formatUtcDateOnly(start))
      setDateTo(formatUtcDateOnly(end))
      return
    }
    if (value === "last7") {
      const start = addUtcDays(today, -6)
      setDateFrom(formatUtcDateOnly(start))
      setDateTo(formatUtcDateOnly(today))
      return
    }
    if (value === "last30") {
      const start = addUtcDays(today, -29)
      setDateFrom(formatUtcDateOnly(start))
      setDateTo(formatUtcDateOnly(today))
      return
    }
  }, [])

  const hasAnyFilter = Boolean(statusFilter || locationFilter || dateFrom || dateTo || patientFilter)

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      fullName: "",
      phone: "",
      email: "",
      complaint: "",
      locationId: "",
      therapistId: "",
      serviceId: "",
      dateKey: "",
      slotStartISO: "",
      slotEndISO: "",
    },
  })

  const fetchLocations = React.useCallback(async () => {
    try {
      const res = await fetch("/api/locations")
      if (!res.ok) {
        throw new Error("Failed to load locations")
      }
      const data = await res.json()
      const items = data.items ?? []
      setLocations(items)
    } catch (error) {
      console.error(error)
      toast.error("Failed to load positions")
    }
  }, [])

  const fetchSchedules = React.useCallback(async () => {
    try {
      const res = await fetch("/api/schedules")
      if (!res.ok) {
        throw new Error("Failed to load schedules")
      }
      const data = await res.json()
      const items = (data.items ?? []) as ScheduleConfig[]
      setSchedulePairs(
        items
          .filter((item) => item.locationId && item.therapistId)
          .map((item) => ({ locationId: item.locationId, therapistId: item.therapistId }))
      )
    } catch (error) {
      console.error(error)
      toast.error("Failed to load schedules")
    }
  }, [])

  const fetchPatients = React.useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page: "1",
        pageSize: "200",
        sort: "name",
      })
      const res = await fetch(`/api/patients?${params.toString()}`)
      if (!res.ok) {
        throw new Error("Failed to load patients")
      }
      const data = await res.json()
      setPatients(data.items ?? [])
    } catch (error) {
      console.error(error)
      toast.error("Failed to load patients")
    }
  }, [])

  const fetchServices = React.useCallback(async () => {
    try {
      const res = await fetch("/api/services")
      if (!res.ok) {
        throw new Error("Failed to load services")
      }
      const data = await res.json()
      const items = data.items ?? []
      setServices(items)
    } catch (error) {
      console.error(error)
      toast.error("Failed to load services")
    }
  }, [])

  const fetchTherapists = React.useCallback(async () => {
    try {
      const res = await fetch("/api/therapists")
      if (!res.ok) {
        throw new Error("Failed to load therapists")
      }
      const data = await res.json()
      setTherapists(data.items ?? [])
    } catch (error) {
      console.error(error)
      toast.error("Failed to load therapists")
    }
  }, [])

  const fetchBookings = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (debouncedSearch) params.set("q", debouncedSearch)
      if (statusFilter) params.set("status", statusFilter)
      if (patientFilter) params.set("patientId", patientFilter)
      if (locationFilter) params.set("locationId", locationFilter)
      if (dateFrom) params.set("dateFrom", dateFrom)
      if (dateTo) params.set("dateTo", dateTo)
      const res = await fetch(`/api/bookings?${params.toString()}`)
      if (!res.ok) {
        throw new Error("Failed to load bookings")
      }
      const data = await res.json()
      setBookings(data.items ?? [])
    } catch (error) {
      console.error(error)
      toast.error("Failed to load bookings")
    } finally {
      setIsLoading(false)
    }
  }, [debouncedSearch, statusFilter, patientFilter, locationFilter, dateFrom, dateTo])

  React.useEffect(() => {
    fetchLocations()
    fetchPatients()
    fetchServices()
    fetchTherapists()
    fetchSchedules()
  }, [fetchLocations, fetchPatients, fetchServices, fetchTherapists, fetchSchedules])

  React.useEffect(() => {
    fetchBookings()
  }, [fetchBookings])

  React.useEffect(() => {
    const handle = setTimeout(() => setDebouncedSearch(search), 400)
    return () => clearTimeout(handle)
  }, [search])

  const watchedLocationId = form.watch("locationId")
  const watchedTherapistId = form.watch("therapistId")
  const watchedServiceId = form.watch("serviceId")

  React.useEffect(() => {
    const dateKey = selectedDate ? formatDateKey(selectedDate) : ""
    const locationId = form.getValues("locationId")
    const therapistId = form.getValues("therapistId")
    form.setValue("dateKey", dateKey)
    form.setValue("slotStartISO", "")
    form.setValue("slotEndISO", "")

    if (!dateKey || !locationId || !therapistId) {
      setSlots(null)
      setSlotNotice(null)
      return
    }

    const loadSlots = async () => {
      setSlotLoading(true)
      setSlotNotice(null)
      try {
        const result = await fetchSlotResponse(
          `/api/slots?date=${dateKey}&locationId=${locationId}&therapistId=${therapistId}`
        )
        if (result.ok) {
          setSlots(result.data)
          setSlotNotice(null)
          return
        }
        if (result.status === 409 || result.status === 422) {
          setSlots({ timeZone: "Asia/Jakarta", items: [] })
          setSlotNotice(result.message)
          return
        }
        setSlots({ timeZone: "Asia/Jakarta", items: [] })
        toast.error(result.message || "Failed to load slots")
      } catch (error) {
        console.error(error)
        toast.error("Failed to load slots")
      } finally {
        setSlotLoading(false)
      }
    }

    loadSlots()
  }, [form, selectedDate, watchedLocationId, watchedTherapistId])

  React.useEffect(() => {
    const locationId = form.getValues("locationId")
    const therapistId = form.getValues("therapistId")
    if (!locationId || !therapistId) {
      setCalendarSlots(null)
      setCalendarSlotNotice(null)
      return
    }

    const { start, end } = getMonthRange(calendarMonth)

    const loadCalendarSlots = async () => {
      setCalendarSlotNotice(null)
      try {
        const result = await fetchSlotResponse(
          `/api/slots?rangeStart=${start.toISOString()}&rangeEnd=${end.toISOString()}&locationId=${locationId}&therapistId=${therapistId}`
        )
        if (result.ok) {
          setCalendarSlots(result.data)
          setCalendarSlotNotice(null)
          return
        }
        if (result.status === 409 || result.status === 422) {
          setCalendarSlots({ timeZone: "Asia/Jakarta", items: [] })
          setCalendarSlotNotice(result.message)
          return
        }
        setCalendarSlots({ timeZone: "Asia/Jakarta", items: [] })
        toast.error(result.message || "Failed to load slots")
      } catch (error) {
        console.error(error)
        toast.error("Failed to load slots")
      } finally {
      }
    }

    loadCalendarSlots()
  }, [form, calendarMonth, watchedLocationId, watchedTherapistId])

  React.useEffect(() => {
    if (!rescheduleBooking || !rescheduleDate) {
      setRescheduleSlots(null)
      setRescheduleSlotNotice(null)
      setRescheduleSlotStartISO("")
      setRescheduleSlotEndISO("")
      return
    }
    const dateKey = formatDateKey(rescheduleDate)
    const loadSlots = async () => {
      setRescheduleSlotLoading(true)
      setRescheduleSlotNotice(null)
      try {
        const result = await fetchSlotResponse(
          `/api/slots?date=${dateKey}&locationId=${rescheduleBooking.locationId}&therapistId=${rescheduleBooking.therapistId}`
        )
        if (result.ok) {
          setRescheduleSlots(result.data)
          setRescheduleSlotNotice(null)
          return
        }
        if (result.status === 409 || result.status === 422) {
          setRescheduleSlots({ timeZone: "Asia/Jakarta", items: [] })
          setRescheduleSlotNotice(result.message)
          return
        }
        setRescheduleSlots({ timeZone: "Asia/Jakarta", items: [] })
        toast.error(result.message || "Failed to load slots")
      } catch (error) {
        console.error(error)
        toast.error("Failed to load slots")
      } finally {
        setRescheduleSlotLoading(false)
      }
    }
    loadSlots()
  }, [rescheduleBooking, rescheduleDate])

  React.useEffect(() => {
    if (!rescheduleBooking) {
      setRescheduleCalendarSlots(null)
      setRescheduleCalendarNotice(null)
      return
    }

    const { start, end } = getMonthRange(rescheduleMonth)

    const loadRescheduleCalendarSlots = async () => {
      setRescheduleCalendarNotice(null)
      try {
        const result = await fetchSlotResponse(
          `/api/slots?rangeStart=${start.toISOString()}&rangeEnd=${end.toISOString()}&locationId=${rescheduleBooking.locationId}&therapistId=${rescheduleBooking.therapistId}`
        )
        if (result.ok) {
          setRescheduleCalendarSlots(result.data)
          setRescheduleCalendarNotice(null)
          return
        }
        if (result.status === 409 || result.status === 422) {
          setRescheduleCalendarSlots({ timeZone: "Asia/Jakarta", items: [] })
          setRescheduleCalendarNotice(result.message)
          return
        }
        setRescheduleCalendarSlots({ timeZone: "Asia/Jakarta", items: [] })
        toast.error(result.message || "Failed to load slots")
      } catch (error) {
        console.error(error)
        toast.error("Failed to load slots")
      } finally {
      }
    }

    loadRescheduleCalendarSlots()
  }, [rescheduleBooking, rescheduleMonth])

  const handleCreateBooking = form.handleSubmit(async (values) => {
      if (!values.locationId) {
        toast.error("Select a position first")
        return
      }
      if (!values.therapistId) {
        toast.error("Select a therapist first")
        return
      }
    try {
      const patientRes = await fetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: values.fullName,
          phone: values.phone,
          email: values.email,
          complaint: values.complaint,
        }),
      })
      if (!patientRes.ok) {
        const payload = await patientRes.json()
        toast.error(payload?.message || "Failed to create patient")
        return
      }
      const patient = (await patientRes.json()) as PatientRecord

      const location = locations.find((item) => item.id === values.locationId)
      if (!location) {
        toast.error("Position not found")
        return
      }

      const service = availableServices.find((item) => item.id === values.serviceId)
      if (!service) {
        toast.error("Service not found for selected therapist")
        return
      }
      const paymentStatus = "paid" as const
      const paymentProvider = "manual"
      const breakdown = calculateBookingPayment(service.price)

      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: patient.id,
          locationId: values.locationId,
          locationName: location.city ?? location.name,
          locationAddress: location.address,
          therapistId: values.therapistId,
          therapistName: therapists.find((item) => item.id === values.therapistId)?.name,
          serviceId: service.id,
          serviceName: service.name,
          servicePrice: service.price,
          complaint: values.complaint,
          startISO: values.slotStartISO,
          endISO: values.slotEndISO,
          status: "scheduled",
          paymentStatus,
          payment: {
            provider: paymentProvider,
            paymentType: paymentMethodDraft,
            subtotalAmount: breakdown.subtotalAmount,
            taxAmount: breakdown.taxAmount,
            totalAmount: breakdown.totalAmount,
            grossAmount: breakdown.totalAmount,
            currency: "IDR",
            statusMessage: `Paid via ${paymentMethodLabel[paymentMethodDraft]} from dashboard`,
          },
        }),
      })
      if (!res.ok) {
        const payload = await res.json()
        toast.error(payload?.message || "Failed to create booking")
        return
      }
      await res.json()

      await fetchPatients()
      await fetchBookings()
      toast.success("Booking created")
      resetCreateBookingDialog()
    } catch (error) {
      console.error(error)
      toast.error("Server error")
    }
  }, (errors) => {
    const firstInvalidField = (
      [
        "fullName",
        "phone",
        "email",
        "locationId",
        "therapistId",
        "serviceId",
        "dateKey",
        "slotStartISO",
        "slotEndISO",
      ] as const
    ).find((field) => errors[field])

    setBookingStep(getBookingStepForField(firstInvalidField))

    if (firstInvalidField && bookingStepFields[3].includes(firstInvalidField)) {
      toast.error("Pilih tanggal dan slot booking yang valid terlebih dulu.")
      return
    }

    toast.error("Lengkapi field yang wajib diisi sebelum membuat booking.")
  })

  const handleDeleteBooking = async (bookingId: string) => {
    const confirmed = window.confirm("Hapus booking ini?")
    if (!confirmed) return
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, { method: "DELETE" })
      const payload = await res.json()
      if (!res.ok) {
        toast.error(payload?.message || "Failed to delete booking")
        return
      }
      toast.success("Booking deleted")
      await fetchBookings()
    } catch (error) {
      console.error(error)
      toast.error("Server error")
    }
  }

  const handleUpdatePaymentStatus = async (
    bookingId: string,
    paymentStatus: (typeof paymentStatusSchema)["options"][number]
  ) => {
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentStatus }),
      })
      const payload = await res.json()
      if (!res.ok) {
        toast.error(payload?.message || "Failed to update payment status")
        return
      }
      toast.success("Payment status updated")
      await fetchBookings()
    } catch (error) {
      console.error(error)
      toast.error("Server error")
    }
  }

  const handleOpenReschedule = (booking: BookingRecord) => {
    setRescheduleBooking(booking)
    const nextDate = new Date(booking.startISO)
    setRescheduleDate(nextDate)
    setRescheduleMonth(nextDate)
    setRescheduleSlotStartISO(booking.startISO)
    setRescheduleSlotEndISO(booking.endISO)
    setRescheduleOpen(true)
  }

  const handleRescheduleSave = async () => {
    if (!rescheduleBooking || !rescheduleSlotStartISO || !rescheduleSlotEndISO) {
      toast.error("Select a date and slot")
      return
    }
    try {
      const res = await fetch(`/api/bookings/${rescheduleBooking.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: rescheduleBooking.patientId,
          locationId: rescheduleBooking.locationId,
          therapistId: rescheduleBooking.therapistId,
          serviceName: rescheduleBooking.serviceName,
          complaint: rescheduleBooking.complaint,
          startISO: rescheduleSlotStartISO,
          endISO: rescheduleSlotEndISO,
        }),
      })
      const payload = await res.json()
      if (!res.ok) {
        toast.error(payload?.message || "Failed to reschedule booking")
        return
      }
      toast.success("Booking rescheduled")
      setRescheduleOpen(false)
      setRescheduleBooking(null)
      setRescheduleSlots(null)
      setRescheduleSlotStartISO("")
      setRescheduleSlotEndISO("")
      await fetchBookings()
    } catch (error) {
      console.error(error)
      toast.error("Server error")
    }
  }

  const slotOptions = React.useMemo(() => {
    if (!slots || !form.getValues("dateKey")) {
      return []
    }
    const day = slots.items.find((item) => item.date === form.getValues("dateKey"))
    return day?.slots ?? []
  }, [slots, form])

  const calendarAvailableDates = React.useMemo(() => {
    if (!calendarSlots) return []
    return calendarSlots.items
      .filter((day) => day.slots.length > 0)
      .map((day) => parseDateKey(day.date))
  }, [calendarSlots])

  const calendarFullDates = React.useMemo(() => {
    if (!calendarSlots) return []
    return calendarSlots.items
      .filter((day) => (day.totalSlots ?? 0) > 0 && day.slots.length === 0)
      .map((day) => parseDateKey(day.date))
  }, [calendarSlots])

  const rescheduleAvailableDates = React.useMemo(() => {
    if (!rescheduleCalendarSlots) return []
    return rescheduleCalendarSlots.items
      .filter((day) => day.slots.length > 0)
      .map((day) => parseDateKey(day.date))
  }, [rescheduleCalendarSlots])

  const rescheduleFullDates = React.useMemo(() => {
    if (!rescheduleCalendarSlots) return []
    return rescheduleCalendarSlots.items
      .filter((day) => (day.totalSlots ?? 0) > 0 && day.slots.length === 0)
      .map((day) => parseDateKey(day.date))
  }, [rescheduleCalendarSlots])

  const patientLookup = React.useMemo(() => {
    return new Map(patients.map((patient) => [patient.id, patient.fullName]))
  }, [patients])

  const patientRecordLookup = React.useMemo(() => {
    return new Map(patients.map((patient) => [patient.id, patient]))
  }, [patients])

  const therapistLookup = React.useMemo(() => {
    return new Map(therapists.map((therapist) => [therapist.id, therapist.name]))
  }, [therapists])


  const schedulePairSet = React.useMemo(
    () => new Set(schedulePairs.map((item) => `${item.locationId}:${item.therapistId}`)),
    [schedulePairs]
  )

  const availableTherapists = React.useMemo(() => {
    const activeTherapists = therapists.filter((therapist) => therapist.isActive)
    return activeTherapists
  }, [therapists])

  const availableLocations = React.useMemo(() => {
    const activeLocations = locations.filter((location) => location.isActive !== false)
    return activeLocations
  }, [locations])

  const selectedPairHasSchedule = React.useMemo(() => {
    if (!watchedLocationId || !watchedTherapistId) {
      return false
    }
    return schedulePairSet.has(`${watchedLocationId}:${watchedTherapistId}`)
  }, [schedulePairSet, watchedLocationId, watchedTherapistId])

  const selectedTherapist = React.useMemo(
    () => therapists.find((therapist) => therapist.id === watchedTherapistId) ?? null,
    [therapists, watchedTherapistId]
  )

  const serviceLookup = React.useMemo(() => {
    return new Map(services.map((service) => [service.id, service]))
  }, [services])

  const availableServices = React.useMemo<TherapistServiceOption[]>(() => {
    if (!selectedTherapist) return []

    return (selectedTherapist.serviceRates ?? []).flatMap((rate) => {
      const service = serviceLookup.get(rate.serviceId)
      if (!service || service.isActive === false) {
        return []
      }

      return [{ ...service, price: rate.price }]
    })
  }, [selectedTherapist, serviceLookup])

  const selectedService = React.useMemo(
    () => availableServices.find((service) => service.id === watchedServiceId) ?? null,
    [availableServices, watchedServiceId]
  )
  const paymentBreakdown = React.useMemo(
    () => calculateBookingPayment(selectedService?.price ?? 0),
    [selectedService?.price]
  )

  const resetCreateBookingDialog = React.useCallback(() => {
    form.reset()
    setSelectedDate(undefined)
    setSlots(null)
    setSlotNotice(null)
    setCalendarSlots(null)
    setCalendarSlotNotice(null)
    setPaymentMethodDraft("cash")
    setDialogOpen(false)
    setBookingStep(1)
  }, [form])

  const handleBookingFormKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLFormElement>) => {
      if (event.key !== "Enter" || bookingStep >= totalBookingSteps) {
        return
      }

      const target = event.target as HTMLElement
      if (target.tagName === "TEXTAREA") {
        return
      }

      event.preventDefault()
    },
    [bookingStep, totalBookingSteps]
  )

  const handleExportExcel = React.useCallback(() => {
    if (bookings.length === 0) {
      toast.error("Tidak ada data booking untuk diexport")
      return
    }

    try {
      setIsExporting(true)

      const filterSummary = [
        statusFilter ? `Status: ${statusLabel[statusFilter]}` : null,
        locationFilter
          ? `Position: ${
              availableLocations.find((location) => location.id === locationFilter)?.city ??
              availableLocations.find((location) => location.id === locationFilter)?.name ??
              "Position"
            }`
          : null,
        patientFilter
          ? `Patient: ${patientRecordLookup.get(patientFilter)?.fullName ?? "Selected patient"}`
          : null,
        dateFrom || dateTo
          ? `Date: ${dateFrom || "-"} s/d ${dateTo || "-"}`
          : null,
        debouncedSearch ? `Search: ${debouncedSearch}` : null,
      ]
        .filter(Boolean)
        .join(" | ")

      const rows = bookings
        .map((booking, index) => {
          const patient = patientRecordLookup.get(booking.patientId)
          const therapistName =
            therapistLookup.get(booking.therapistId) ?? booking.therapistName ?? "-"
          const paymentMethod =
            paymentMethodLabel[booking.payment?.paymentType ?? booking.payment?.provider ?? ""] ??
            "Not set"

          const values = [
            String(index + 1),
            booking.id,
            patient?.fullName ?? patientLookup.get(booking.patientId) ?? "Unknown",
            patient?.phone ?? "-",
            patient?.email || "-",
            booking.complaint ?? "-",
            booking.serviceName,
            formatDate(booking.startISO),
            `${formatTime(booking.startISO)} - ${formatTime(booking.endISO)}`,
            statusLabel[booking.status],
            paymentLabel[booking.paymentStatus ?? "pending"],
            paymentMethod,
            typeof booking.payment?.grossAmount === "number"
              ? String(booking.payment.grossAmount)
              : "-",
            therapistName,
            booking.locationName ?? "-",
            booking.locationAddress ?? "-",
            formatDateTime(booking.createdAt),
          ]

          return `<tr>${values
            .map((value) => `<td>${escapeHtml(value)}</td>`)
            .join("")}</tr>`
        })
        .join("")

      const workbook = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
  </head>
  <body>
    <table border="1">
      <tr><th colspan="17">Bookings Export</th></tr>
      <tr><td colspan="17">Generated at: ${escapeHtml(formatDateTime(new Date().toISOString()))}</td></tr>
      <tr><td colspan="17">Filters: ${escapeHtml(filterSummary || "None")}</td></tr>
      <tr>
        <th>No</th>
        <th>Booking ID</th>
        <th>Patient</th>
        <th>Phone</th>
        <th>Email</th>
        <th>Complaint</th>
        <th>Service</th>
        <th>Date Booking</th>
        <th>Hour Booking</th>
        <th>Status</th>
        <th>Payment Status</th>
        <th>Payment Method</th>
        <th>Total Payment</th>
        <th>Therapist</th>
        <th>Position</th>
        <th>Address</th>
        <th>Created</th>
      </tr>
      ${rows}
    </table>
  </body>
</html>`

      const blob = new Blob(["\ufeff", workbook], {
        type: "application/vnd.ms-excel;charset=utf-8;",
      })
      const objectUrl = URL.createObjectURL(blob)
      const link = document.createElement("a")
      const today = formatDateKey(new Date())

      link.href = objectUrl
      link.download = `bookings-${today}.xls`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(objectUrl)

      toast.success("Export Excel berhasil diunduh")
    } catch (error) {
      console.error(error)
      toast.error("Gagal export data booking")
    } finally {
      setIsExporting(false)
    }
  }, [
    availableLocations,
    bookings,
    dateFrom,
    dateTo,
    debouncedSearch,
    locationFilter,
    patientFilter,
    patientLookup,
    patientRecordLookup,
    statusFilter,
    therapistLookup,
  ])

  const handleNextBookingStep = React.useCallback(async () => {
    const fields = bookingStepFields[bookingStep] ?? []

    if (fields.length > 0) {
      const isValid = await form.trigger(fields, { shouldFocus: true })
      if (!isValid) {
        if (bookingStep === 3) {
          toast.error("Pilih tanggal dan slot booking yang valid terlebih dulu.")
        } else {
          toast.error("Lengkapi field yang wajib diisi sebelum lanjut ke langkah berikutnya.")
        }
        return
      }
    }

    if (bookingStep === 3 && !form.getValues("slotEndISO")) {
      toast.error("Pilih slot booking yang valid terlebih dulu.")
      return
    }

    setBookingStep((prev) => Math.min(totalBookingSteps, prev + 1))
  }, [bookingStep, form, totalBookingSteps])

  React.useEffect(() => {
    const current = form.getValues("locationId")
    const stillAvailable = availableLocations.some((location) => location.id === current)
    if (!current || !stillAvailable) {
      const firstAvailable = availableLocations[0]
      form.setValue("locationId", firstAvailable?.id ?? "")
    }
  }, [form, availableLocations])

  React.useEffect(() => {
    const current = form.getValues("therapistId")
    const stillAvailable = availableTherapists.some((therapist) => therapist.id === current)
    if (!current || !stillAvailable) {
      const firstAvailable = availableTherapists[0]
      form.setValue("therapistId", firstAvailable?.id ?? "")
    }
  }, [form, availableTherapists])

  React.useEffect(() => {
    const current = form.getValues("serviceId")
    const stillAvailable = availableServices.some((service) => service.id === current)
    if (!current || !stillAvailable) {
      const firstAvailable = availableServices[0]
      form.setValue("serviceId", firstAvailable?.id ?? "")
    }
  }, [form, availableServices])

  if (locations.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
        <h1 className="text-xl font-semibold">No positions yet</h1>
        <p className="text-sm text-muted-foreground">
          Add a position before creating bookings.
        </p>
        <Button asChild>
          <Link href="/locations">Manage Positions</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 lg:p-6">
      <div className="flex flex-col gap-4 rounded-xl border bg-background p-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-xl font-semibold">Bookings</h1>
          <p className="text-sm text-muted-foreground">
            Manage bookings across all positions.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button
            type="button"
            variant="outline"
            onClick={handleExportExcel}
            disabled={isLoading || isExporting || bookings.length === 0}
          >
            <Download className="mr-2 h-4 w-4" />
            {isExporting ? "Exporting..." : "Export Excel"}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Filter className="mr-2 h-4 w-4" />
                Filter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Filter</DropdownMenuLabel>
              <DropdownMenuSeparator />

              <DropdownMenuSub>
                <DropdownMenuSubTrigger>Status</DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="max-h-72 overflow-y-auto">
                  <DropdownMenuRadioGroup
                    value={statusFilter || "all"}
                    onValueChange={(value) =>
                      setStatusFilter(value === "all" ? "" : value)
                    }
                  >
                    <DropdownMenuRadioItem value="all">All</DropdownMenuRadioItem>
                    {bookingStatusSchema.options.map((status) => (
                      <DropdownMenuRadioItem key={status} value={status}>
                        {statusLabel[status]}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuSubContent>
              </DropdownMenuSub>

              <DropdownMenuSub>
                <DropdownMenuSubTrigger>Position</DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="max-h-72 overflow-y-auto">
                  <DropdownMenuRadioGroup
                    value={locationFilter || "all"}
                    onValueChange={(value) =>
                      setLocationFilter(value === "all" ? "" : value)
                    }
                  >
                    <DropdownMenuRadioItem value="all">All</DropdownMenuRadioItem>
                    {availableLocations.map((location) => (
                      <DropdownMenuRadioItem key={location.id} value={location.id}>
                        {location.city ?? location.name ?? "Position"}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuSubContent>
              </DropdownMenuSub>

              <DropdownMenuSub>
                <DropdownMenuSubTrigger>Date</DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuRadioGroup
                    value={dateRangeFilter}
                    onValueChange={applyDateRangeFilter}
                  >
                    <DropdownMenuRadioItem value="all">All</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="today">Today</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="thisWeek">This week</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="thisMonth">This month</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="last7">Last 7 days</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="last30">Last 30 days</DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuSubContent>
              </DropdownMenuSub>

              <DropdownMenuSeparator />
              <DropdownMenuItem
                disabled={!hasAnyFilter}
                onClick={() => {
                  setStatusFilter("")
                  setLocationFilter("")
                  setPatientFilter("")
                  applyDateRangeFilter("all")
                }}
              >
                Clear all
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Booking
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search service/patient"
            className="pl-9"
          />
        </div>
      </div>

      {hasAnyFilter ? (
        <div className="flex flex-wrap items-center gap-2">

            {statusFilter ? (
              <div className="inline-flex items-center gap-1 rounded-full border bg-background px-2 py-1 text-xs">
                <span>Status: {statusLabel[statusFilter]}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5"
                  aria-label="Clear status filter"
                  onClick={() => setStatusFilter("")}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : null}

            {locationFilter ? (
              <div className="inline-flex items-center gap-1 rounded-full border bg-background px-2 py-1 text-xs">
                <span>
                  Position:{" "}
                  {availableLocations.find((loc) => loc.id === locationFilter)?.city ??
                    availableLocations.find((loc) => loc.id === locationFilter)?.name ??
                    "Position"}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5"
                  aria-label="Clear position filter"
                  onClick={() => setLocationFilter("")}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : null}

            {dateRangeFilter !== "all" ? (
              <div className="inline-flex items-center gap-1 rounded-full border bg-background px-2 py-1 text-xs">
                <span>
                  Date: {dateRangeLabel[dateRangeFilter] ?? "Custom"}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5"
                  aria-label="Clear date filter"
                  onClick={() => applyDateRangeFilter("all")}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : null}

        </div>
      ) : null}

      <div className="rounded-xl border">
        {isLoading ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-10 w-full" />
            ))}
          </div>
        ) : bookings.length === 0 ? (
          <div className="p-6 text-sm text-muted-foreground">
            No bookings yet. Add a booking to get started.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient</TableHead>
                <TableHead>Complaint</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Date Booking</TableHead>
                <TableHead>Hour Booking</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Therapist</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Created</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.map((booking) => (
                <TableRow key={booking.id}>
                  <TableCell className="font-medium">
                    {patientLookup.get(booking.patientId) ?? "Unknown"}
                  </TableCell>
                  <TableCell>{booking.complaint ?? "-"}</TableCell>
                  <TableCell>{booking.serviceName}</TableCell>
                  <TableCell>{formatDate(booking.startISO)}</TableCell>
                  <TableCell>
                    {formatTime(booking.startISO)} - {formatTime(booking.endISO)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[booking.status]}>
                      {statusLabel[booking.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <Badge variant={paymentVariant[booking.paymentStatus ?? "pending"]}>
                        {paymentLabel[booking.paymentStatus ?? "pending"]}
                      </Badge>
                      <div className="text-muted-foreground text-xs">
                        {paymentMethodLabel[
                          booking.payment?.paymentType ?? booking.payment?.provider ?? ""
                        ] ?? "Not set"}
                        {typeof booking.payment?.grossAmount === "number"
                          ? ` - ${formatCurrency(booking.payment.grossAmount)}`
                          : ""}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {therapistLookup.get(booking.therapistId) ?? booking.therapistName ?? "-"}
                  </TableCell>
                  <TableCell>{booking.locationName ?? "-"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDateTime(booking.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label="Booking actions">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleOpenReschedule(booking)}>
                          Reschedule
                        </DropdownMenuItem>
                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger>Update payment</DropdownMenuSubTrigger>
                          <DropdownMenuSubContent>
                            {paymentStatusSchema.options.map((status) => (
                              <DropdownMenuItem
                                key={status}
                                disabled={(booking.paymentStatus ?? "pending") === status}
                                onClick={() => handleUpdatePaymentStatus(booking.id, status)}
                              >
                                {paymentLabel[status]}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuSubContent>
                        </DropdownMenuSub>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleDeleteBooking(booking.id)}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (open) {
            setDialogOpen(true)
            return
          }
          resetCreateBookingDialog()
        }}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Create Booking</DialogTitle>
            <DialogDescription>
              Lengkapi data pasien, pilih layanan, tentukan jadwal, atur pembayaran, lalu review sebelum booking disimpan.
            </DialogDescription>
            <div className="mt-3 flex gap-2">
              {Array.from({ length: totalBookingSteps }, (_, index) => index + 1).map((index) => (
                <div
                  key={index}
                  className={`h-1 flex-1 rounded-full ${
                    bookingStep === index ? "bg-primary" : "bg-muted"
                  }`}
                />
              ))}
            </div>
          </DialogHeader>
          <form onSubmit={handleCreateBooking} onKeyDown={handleBookingFormKeyDown} className="space-y-6">
            <input type="hidden" {...form.register("locationId")} />
            <input type="hidden" {...form.register("therapistId")} />
            <input type="hidden" {...form.register("dateKey")} />
            <input type="hidden" {...form.register("slotStartISO")} />
            <input type="hidden" {...form.register("slotEndISO")} />
            <div className="space-y-4">
              {bookingStep === 1 && (
                <div className="rounded-xl border bg-muted/30 p-4">
                  <div className="mb-3 text-sm font-medium">Patient details</div>
                  <FieldGroup>
                    <Field>
                      <FieldLabel>Full Name</FieldLabel>
                      <FieldContent>
                        <Input placeholder="Nama lengkap" {...form.register("fullName")} />
                        <FieldError errors={[form.formState.errors.fullName]} />
                      </FieldContent>
                    </Field>
                    <div className="grid gap-4 md:grid-cols-2">
                      <Field>
                        <FieldLabel>Phone Number</FieldLabel>
                        <FieldContent>
                          <Input placeholder="08123456789" {...form.register("phone")} />
                          <FieldError errors={[form.formState.errors.phone]} />
                        </FieldContent>
                      </Field>
                      <Field>
                        <FieldLabel>Email (optional)</FieldLabel>
                        <FieldContent>
                          <Input
                            type="email"
                            placeholder="email@contoh.com"
                            {...form.register("email")}
                          />
                          <FieldError errors={[form.formState.errors.email]} />
                        </FieldContent>
                      </Field>
                    </div>
                    <Field>
                      <FieldLabel>Complaint (English)</FieldLabel>
                      <FieldContent>
                        <Input
                          placeholder="Describe the complaint in English"
                          {...form.register("complaint")}
                        />
                        <FieldError errors={[form.formState.errors.complaint]} />
                      </FieldContent>
                    </Field>
                  </FieldGroup>
                </div>
              )}

              {bookingStep === 2 && (
                <div className="rounded-xl border bg-muted/30 p-4">
                  <div className="mb-3 text-sm font-medium">Service & therapist</div>
                  <FieldGroup>
                    <Field>
                      <FieldLabel>Position</FieldLabel>
                      <FieldContent>
                        {availableLocations.length === 0 ? (
                          <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                            Add an active position first.
                          </div>
                        ) : (
                          <Select
                            value={form.watch("locationId")}
                            onValueChange={(value) => form.setValue("locationId", value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select a position" />
                            </SelectTrigger>
                            <SelectContent>
                              {availableLocations.map((location) => (
                                <SelectItem key={location.id} value={location.id}>
                                  {location.city ?? location.name ?? "Position"}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                        <FieldError errors={[form.formState.errors.locationId]} />
                      </FieldContent>
                    </Field>
                    <Field>
                      <FieldLabel>Therapist</FieldLabel>
                      <FieldContent>
                        {availableTherapists.length === 0 ? (
                          <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                            No active therapist available.
                          </div>
                        ) : (
                          <Select
                            value={form.watch("therapistId")}
                            onValueChange={(value) => form.setValue("therapistId", value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select a therapist" />
                            </SelectTrigger>
                            <SelectContent>
                              {availableTherapists.map((therapist) => (
                                <SelectItem key={therapist.id} value={therapist.id}>
                                  {therapist.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                        {watchedLocationId && watchedTherapistId && !selectedPairHasSchedule ? (
                          <p className="text-xs text-amber-600">
                            Schedule for this therapist at the selected position is not set yet.
                            You can still choose a service, but available slots will appear after
                            the schedule is configured in the dashboard.
                          </p>
                        ) : null}
                        <FieldError errors={[form.formState.errors.therapistId]} />
                      </FieldContent>
                    </Field>
                    <Field>
                      <FieldLabel>Service</FieldLabel>
                      <FieldContent>
                        {!watchedTherapistId ? (
                          <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                            Select a therapist first.
                          </div>
                        ) : availableServices.length === 0 ? (
                          <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                            No services configured for this therapist.
                          </div>
                        ) : (
                          <Select
                            value={form.watch("serviceId")}
                            onValueChange={(value) => form.setValue("serviceId", value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select a service" />
                            </SelectTrigger>
                            <SelectContent>
                              {availableServices.map((service) => (
                                <SelectItem key={service.id} value={service.id}>
                                  {service.name} - {formatCurrency(service.price)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                        {selectedService && (
                          <p className="text-muted-foreground text-xs">
                            Price {formatCurrency(selectedService.price)}
                            {selectedService.durationMins
                              ? ` - ${selectedService.durationMins} mins`
                              : ""}
                          </p>
                        )}
                        <FieldError errors={[form.formState.errors.serviceId]} />
                      </FieldContent>
                    </Field>
                  </FieldGroup>
                </div>
              )}

              {bookingStep === 3 && (
                <div className="rounded-xl border bg-muted/30 p-4">
                  <div className="mb-3 text-sm font-medium">Schedule</div>
                  <FieldGroup>
                    <Field>
                      <FieldLabel>Date</FieldLabel>
                      <FieldContent>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              type="button"
                              variant="outline"
                              className="w-full justify-start text-left font-normal"
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {selectedDate ? formatDateKey(selectedDate) : "Select date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={selectedDate}
                              onSelect={setSelectedDate}
                              onMonthChange={setCalendarMonth}
                              modifiers={{
                                available: calendarAvailableDates,
                                full: calendarFullDates,
                              }}
                              modifiersClassNames={{
                                available: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
                                full: "bg-red-500/15 text-red-700 dark:text-red-300",
                              }}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FieldError errors={[form.formState.errors.dateKey]} />
                      </FieldContent>
                    </Field>
                    <Field>
                      <FieldLabel>Available Slots</FieldLabel>
                      <FieldContent>
                        {!selectedDate ? (
                          <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                            Select a date first.
                          </div>
                        ) : !form.getValues("locationId") ||
                          !form.getValues("therapistId") ? (
                          <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                            Select a position and therapist first.
                          </div>
                        ) : slotLoading ? (
                          <Skeleton className="h-10 w-full" />
                        ) : slotOptions.length === 0 ? (
                          <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                            {slotNotice ?? calendarSlotNotice ?? "No slots available."}
                          </div>
                        ) : (
                          <Select
                            value={form.watch("slotStartISO")}
                            onValueChange={(value) => {
                              const slot = slotOptions.find((item) => item.startISO === value)
                              form.setValue("slotStartISO", value)
                              form.setValue("slotEndISO", slot?.endISO ?? "")
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select a slot" />
                            </SelectTrigger>
                            <SelectContent>
                              {slotOptions.map((slot) => (
                                <SelectItem key={slot.startISO} value={slot.startISO}>
                                  {formatTime(slot.startISO, slots?.timeZone)} -{" "}
                                  {formatTime(slot.endISO, slots?.timeZone)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                        <FieldError
                          errors={[
                            form.formState.errors.slotStartISO,
                            form.formState.errors.slotEndISO,
                          ]}
                        />
                      </FieldContent>
                    </Field>
                  </FieldGroup>
                </div>
              )}

              {bookingStep === 4 && (
                <div className="rounded-xl border bg-muted/30 p-4">
                  <div className="mb-3 text-sm font-medium">Payment</div>
                  <div className="space-y-4">
                    <Field>
                      <FieldLabel>Payment Method</FieldLabel>
                      <FieldContent>
                        <Select
                          value={paymentMethodDraft}
                          onValueChange={(
                            value: "cash" | "bank_transfer" | "qris" | "other"
                          ) => setPaymentMethodDraft(value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select payment method" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cash">Cash</SelectItem>
                            <SelectItem value="bank_transfer">Transfer Bank</SelectItem>
                            <SelectItem value="qris">QRIS</SelectItem>
                            <SelectItem value="other">Lainnya</SelectItem>
                          </SelectContent>
                        </Select>
                      </FieldContent>
                    </Field>

                    <div className="rounded-lg border bg-background p-4">
                      <div className="mb-3 text-sm font-medium">Payment summary</div>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-muted-foreground">Service price</span>
                          <span>{formatCurrency(paymentBreakdown.subtotalAmount)}</span>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-muted-foreground">
                            PPN {paymentBreakdown.taxPercent}%
                          </span>
                          <span>{formatCurrency(paymentBreakdown.taxAmount)}</span>
                        </div>
                        <div className="flex items-center justify-between gap-3 border-t pt-2 text-base font-semibold">
                          <span>Total</span>
                          <span>{formatCurrency(paymentBreakdown.totalAmount)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                      Booking yang dibuat dari dashboard dianggap sudah dibayar.
                      Pilih saja metode pembayaran yang dipakai pasien, misalnya cash, transfer bank, atau QRIS.
                    </div>
                  </div>
                </div>
              )}

              {bookingStep === 5 && (
                <div className="rounded-xl border bg-muted/30 p-4">
                  <div className="mb-3 text-sm font-medium">Review</div>
                  <div className="space-y-4">
                    <div className="rounded-lg border bg-background p-4">
                      <div className="mb-3 text-sm font-medium">Booking details</div>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-muted-foreground">Patient</span>
                          <span>{form.getValues("fullName") || "-"}</span>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-muted-foreground">Phone</span>
                          <span>{form.getValues("phone") || "-"}</span>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-muted-foreground">Service</span>
                          <span>{selectedService?.name ?? "-"}</span>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-muted-foreground">Therapist</span>
                          <span>{selectedTherapist?.name ?? "-"}</span>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-muted-foreground">Position</span>
                          <span>
                            {availableLocations.find((item) => item.id === watchedLocationId)?.city ??
                              availableLocations.find((item) => item.id === watchedLocationId)?.name ??
                              "-"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-muted-foreground">Schedule</span>
                          <span>
                            {selectedDate
                              ? `${formatDateKey(selectedDate)} ${form.getValues("slotStartISO") ? `, ${formatTime(form.getValues("slotStartISO"), slots?.timeZone)}` : ""}`
                              : "-"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-lg border bg-background p-4">
                      <div className="mb-3 text-sm font-medium">Payment details</div>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-muted-foreground">Method</span>
                          <span>{paymentMethodLabel[paymentMethodDraft]}</span>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-muted-foreground">Status</span>
                          <span>Sudah bayar</span>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-muted-foreground">Service price</span>
                          <span>{formatCurrency(paymentBreakdown.subtotalAmount)}</span>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-muted-foreground">
                            PPN {paymentBreakdown.taxPercent}%
                          </span>
                          <span>{formatCurrency(paymentBreakdown.taxAmount)}</span>
                        </div>
                        <div className="flex items-center justify-between gap-3 border-t pt-2 text-base font-semibold">
                          <span>Total</span>
                          <span>{formatCurrency(paymentBreakdown.totalAmount)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                      Klik <span className="font-medium text-foreground">Create Booking</span> hanya jika semua data sudah benar.
                    </div>
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  if (bookingStep === 1) {
                    resetCreateBookingDialog()
                  } else {
                    setBookingStep((prev) => Math.max(1, prev - 1))
                  }
                }}
              >
                {bookingStep === 1 ? "Cancel" : "Back"}
              </Button>
              {bookingStep < totalBookingSteps ? (
                <Button
                  type="button"
                  onClick={handleNextBookingStep}
                >
                  Next
                </Button>
              ) : (
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? "Saving..." : "Create Booking"}
                </Button>
              )}
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={rescheduleOpen}
        onOpenChange={(open) => {
          setRescheduleOpen(open)
          if (!open) {
            setRescheduleBooking(null)
            setRescheduleSlots(null)
            setRescheduleSlotStartISO("")
            setRescheduleSlotEndISO("")
          }
        }}
      >
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Reschedule Booking</DialogTitle>
            <DialogDescription>Pilih tanggal dan slot baru.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Field>
              <FieldLabel>Date</FieldLabel>
              <FieldContent>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {rescheduleDate ? formatDateKey(rescheduleDate) : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={rescheduleDate}
                      onSelect={setRescheduleDate}
                      onMonthChange={setRescheduleMonth}
                      modifiers={{
                        available: rescheduleAvailableDates,
                        full: rescheduleFullDates,
                      }}
                      modifiersClassNames={{
                        available: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
                        full: "bg-red-500/15 text-red-700 dark:text-red-300",
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel>Available Slots</FieldLabel>
              <FieldContent>
                {!rescheduleDate ? (
                  <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                    Select a date first.
                  </div>
                ) : rescheduleSlotLoading ? (
                  <Skeleton className="h-10 w-full" />
                ) : (rescheduleSlots?.items?.find((item) =>
                    item.date === formatDateKey(rescheduleDate)
                  )?.slots ?? []).length === 0 ? (
                  <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                    {rescheduleSlotNotice ?? rescheduleCalendarNotice ?? "No slots available."}
                  </div>
                ) : (
                  <Select
                    value={rescheduleSlotStartISO}
                    onValueChange={(value) => {
                      const slot =
                        rescheduleSlots?.items
                          ?.find((item) => item.date === formatDateKey(rescheduleDate))
                          ?.slots?.find((item) => item.startISO === value) ?? null
                      setRescheduleSlotStartISO(value)
                      setRescheduleSlotEndISO(slot?.endISO ?? "")
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a slot" />
                    </SelectTrigger>
                    <SelectContent>
                      {(rescheduleSlots?.items?.find(
                        (item) => item.date === formatDateKey(rescheduleDate)
                      )?.slots ?? []).map((slot) => (
                        <SelectItem key={slot.startISO} value={slot.startISO}>
                          {formatTime(slot.startISO, rescheduleSlots?.timeZone)} -{" "}
                          {formatTime(slot.endISO, rescheduleSlots?.timeZone)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </FieldContent>
            </Field>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setRescheduleOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleRescheduleSave}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
