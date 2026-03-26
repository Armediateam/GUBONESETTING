"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { CalendarIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import type { LocationRecord } from "@/lib/locations/schema"
import { calculateBookingPayment } from "@/lib/payments/pricing"
import type { TherapistRecord } from "@/lib/therapists/schema"
import type { ScheduleConfig } from "@/lib/schedule/schema"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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

type MidtransSnapResult = {
  order_id?: string
}

declare global {
  interface Window {
    snap?: {
      pay: (
        token: string,
        options?: {
          onSuccess?: (result: MidtransSnapResult) => void
          onPending?: (result: MidtransSnapResult) => void
          onError?: (result: MidtransSnapResult) => void
          onClose?: () => void
        }
      ) => void
    }
  }
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

const formatDateLabel = (value: Date) =>
  new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(value)

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

export default function BookingForm() {
  const router = useRouter()
  const [step, setStep] = React.useState(1)
  const [loading, setLoading] = React.useState(true)
  const [slotsLoading, setSlotsLoading] = React.useState(false)
  const [calendarSlotsLoading, setCalendarSlotsLoading] = React.useState(false)
  const [midtransReady, setMidtransReady] = React.useState(false)
  const [isProcessingPayment, setIsProcessingPayment] = React.useState(false)
  const [createdBookingId, setCreatedBookingId] = React.useState<string | null>(null)
  const [activePaymentToken, setActivePaymentToken] = React.useState<string | null>(null)

  const [locations, setLocations] = React.useState<LocationRecord[]>([])
  const [therapists, setTherapists] = React.useState<TherapistRecord[]>([])
  const [services, setServices] = React.useState<ServiceItem[]>([])
  const [schedulePairs, setSchedulePairs] = React.useState<
    { locationId: string; therapistId: string }[]
  >([])
  const [slots, setSlots] = React.useState<SlotResponse | null>(null)
  const [slotNotice, setSlotNotice] = React.useState<string | null>(null)
  const [calendarSlots, setCalendarSlots] = React.useState<SlotResponse | null>(null)
  const [calendarSlotNotice, setCalendarSlotNotice] = React.useState<string | null>(null)
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>()
  const [calendarMonth, setCalendarMonth] = React.useState<Date>(new Date())
  const midtransClientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY ?? ""
  const midtransEnabled = Boolean(midtransClientKey)
  const midtransScriptUrl =
    process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === "true"
      ? "https://app.midtrans.com/snap/snap.js"
      : "https://app.sandbox.midtrans.com/snap/snap.js"

  const form = useForm({
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

  React.useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        const [locationsRes, therapistsRes, servicesRes, schedulesRes] = await Promise.all([
          fetch("/api/locations"),
          fetch("/api/therapists"),
          fetch("/api/services"),
          fetch("/api/schedules"),
        ])
        if (!locationsRes.ok || !therapistsRes.ok || !servicesRes.ok || !schedulesRes.ok) {
          throw new Error("Failed to load booking data")
        }

        const locationsPayload = await locationsRes.json()
        const therapistsPayload = await therapistsRes.json()
        const servicesPayload = await servicesRes.json()
        const schedulesPayload = await schedulesRes.json()

        const activeLocations = (locationsPayload.items ?? []).filter(
          (item: LocationRecord) => item.isActive !== false
        )
        const activeTherapists = (therapistsPayload.items ?? []).filter(
          (item: TherapistRecord) => item.isActive
        )
        const activeServices = (servicesPayload.items ?? []).filter(
          (item: ServiceItem) => item.isActive !== false
        )
        const scheduleItems = (schedulesPayload.items ?? []) as ScheduleConfig[]

        setLocations(activeLocations)
        setTherapists(activeTherapists)
        setServices(activeServices)
        setSchedulePairs(
          scheduleItems
            .filter((item) => item.locationId && item.therapistId)
            .map((item) => ({ locationId: item.locationId, therapistId: item.therapistId }))
        )

      } catch (error) {
        console.error(error)
        toast.error("Failed to load booking data")
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [form])

  React.useEffect(() => {
    if (!midtransEnabled) {
      setMidtransReady(false)
      return
    }

    if (window.snap) {
      setMidtransReady(true)
      return
    }

    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[data-midtrans-snap="true"]'
    )

    const handleLoad = () => setMidtransReady(true)
    const handleError = () => {
      setMidtransReady(false)
      toast.error("Failed to load Midtrans payment dialog")
    }

    if (existingScript) {
      existingScript.addEventListener("load", handleLoad)
      existingScript.addEventListener("error", handleError)

      return () => {
        existingScript.removeEventListener("load", handleLoad)
        existingScript.removeEventListener("error", handleError)
      }
    }

    const script = document.createElement("script")
    script.src = midtransScriptUrl
    script.setAttribute("data-client-key", midtransClientKey)
    script.setAttribute("data-midtrans-snap", "true")
    script.async = true
    script.addEventListener("load", handleLoad)
    script.addEventListener("error", handleError)
    document.body.appendChild(script)

    return () => {
      script.removeEventListener("load", handleLoad)
      script.removeEventListener("error", handleError)
    }
  }, [midtransClientKey, midtransEnabled, midtransScriptUrl])

  const watchedLocationId = form.watch("locationId")
  const watchedTherapistId = form.watch("therapistId")
  const watchedFullName = form.watch("fullName")
  const watchedPhone = form.watch("phone")
  const watchedServiceId = form.watch("serviceId")

  const schedulePairSet = React.useMemo(
    () => new Set(schedulePairs.map((item) => `${item.locationId}:${item.therapistId}`)),
    [schedulePairs]
  )

  const availableTherapists = React.useMemo(() => {
    if (!watchedLocationId) {
      return []
    }

    return therapists.filter((therapist) =>
      schedulePairSet.has(`${watchedLocationId}:${therapist.id}`)
    )
  }, [schedulePairSet, therapists, watchedLocationId])

  const availableLocations = React.useMemo(() => {
    return locations
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

  React.useEffect(() => {
    setSelectedDate(undefined)
    setSlots(null)
    setSlotNotice(null)
  }, [watchedLocationId, watchedTherapistId])

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
      setSlotsLoading(true)
      setSlotNotice(null)
      setSlots(null)
      try {
        const result = await fetchSlotResponse(
          `/api/slots?date=${dateKey}&locationId=${locationId}&therapistId=${therapistId}`
        )
        if (result.ok) {
          setSlots(result.data)
          const day = result.data.items.find((item) => item.date === dateKey)
          if (day && (day.totalSlots ?? 0) > 0 && (day.slots?.length ?? 0) === 0) {
            setSlotNotice("Slots penuh di tanggal ini.")
          } else {
            setSlotNotice(null)
          }
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
        setSlotsLoading(false)
      }
    }

    loadSlots()
  }, [form, selectedDate, watchedLocationId, watchedTherapistId])

  React.useEffect(() => {
    if (!watchedLocationId || !watchedTherapistId) {
      setCalendarSlots(null)
      setCalendarSlotNotice(null)
      return
    }

    const { start, end } = getMonthRange(calendarMonth)

    const loadCalendarSlots = async () => {
      setCalendarSlotNotice(null)
      setCalendarSlotsLoading(true)
      setCalendarSlots(null)
      try {
        const result = await fetchSlotResponse(
          `/api/slots?rangeStart=${start.toISOString()}&rangeEnd=${end.toISOString()}&locationId=${watchedLocationId}&therapistId=${watchedTherapistId}`
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
        setCalendarSlotsLoading(false)
      }
    }

    loadCalendarSlots()
  }, [calendarMonth, watchedLocationId, watchedTherapistId])

  const slotOptions = React.useMemo(() => {
    if (!slots || !form.getValues("dateKey")) return []
    const dateKey = form.getValues("dateKey")
    return slots.items.find((item) => item.date === dateKey)?.slots ?? []
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

  const selectedDateKey = selectedDate ? formatDateKey(selectedDate) : ""
  const selectedCalendarDay = React.useMemo(() => {
    if (!calendarSlots || !selectedDateKey) return null
    return calendarSlots.items.find((item) => item.date === selectedDateKey) ?? null
  }, [calendarSlots, selectedDateKey])
  const selectedCalendarIsFull = Boolean(
    selectedCalendarDay &&
      (selectedCalendarDay.totalSlots ?? 0) > 0 &&
      selectedCalendarDay.slots.length === 0
  )

  const syncMidtransPayment = React.useCallback(async (bookingId: string, orderId?: string) => {
    try {
      await fetch("/api/payments/midtrans/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, orderId }),
      })
    } catch (error) {
      console.error(error)
    }
  }, [])

  const openMidtransPopup = React.useCallback(
    (token: string, bookingId: string) => {
      if (!window.snap) {
        toast.error("Midtrans payment dialog is not ready")
        return
      }

      window.snap.pay(token, {
        onSuccess: async (result) => {
          await syncMidtransPayment(bookingId, result.order_id)
          toast.success("Payment successful")
          router.push(`/booking/payment?status=finish&bookingId=${bookingId}`)
        },
        onPending: async (result) => {
          await syncMidtransPayment(bookingId, result.order_id)
          toast.message("Payment is still pending")
          router.push(`/booking/payment?status=pending&bookingId=${bookingId}`)
        },
        onError: async (result) => {
          await syncMidtransPayment(bookingId, result.order_id)
          toast.error("Payment failed")
          router.push(`/booking/payment?status=error&bookingId=${bookingId}`)
        },
        onClose: () => {
          toast.message(
            "Booking has been created. Continue payment from this page when you are ready."
          )
        },
      })
    },
    [router, syncMidtransPayment]
  )

  const handleSubmit = form.handleSubmit(async (values) => {
    if (!values.locationId) {
      toast.error("Select a position first")
      return
    }
    if (!values.therapistId) {
      toast.error("Select a therapist first")
      return
    }
    if (!midtransEnabled) {
      toast.error("Midtrans is not configured for this booking page")
      return
    }
    if (!midtransReady) {
      toast.error("Midtrans payment dialog is still loading")
      return
    }

    if (createdBookingId && activePaymentToken) {
      openMidtransPopup(activePaymentToken, createdBookingId)
      return
    }

    setIsProcessingPayment(true)
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
      const patient = await patientRes.json()

      const location = locations.find((item) => item.id === values.locationId)
      if (!location) {
        toast.error("Position not found")
        return
      }

      const therapist = therapists.find((item) => item.id === values.therapistId)
      const service = availableServices.find((item) => item.id === values.serviceId)
      if (!service) {
        toast.error("Service not found for selected therapist")
        return
      }

      const bookingRes = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: patient.id,
          locationId: values.locationId,
          locationName: location.city ?? location.name,
          locationAddress: location.address,
          therapistId: values.therapistId,
          therapistName: therapist?.name,
          serviceId: service.id,
          serviceName: service.name,
          servicePrice: service.price,
          complaint: values.complaint,
          startISO: values.slotStartISO,
          endISO: values.slotEndISO,
          status: "scheduled",
        }),
      })
      if (!bookingRes.ok) {
        const payload = await bookingRes.json()
        toast.error(payload?.message || "Failed to create booking")
        return
      }
      const booking = await bookingRes.json()

      const paymentRes = await fetch("/api/payments/midtrans/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: booking.id }),
      })

      const paymentPayload = await paymentRes.json().catch(() => null)
      if (!paymentRes.ok) {
        toast.error(paymentPayload?.message || "Failed to start Midtrans payment")
        setCreatedBookingId(booking.id)
        return
      }

      setCreatedBookingId(booking.id)
      setActivePaymentToken(paymentPayload.token)
      openMidtransPopup(paymentPayload.token, booking.id)
    } catch (error) {
      console.error(error)
      toast.error("Server error")
    } finally {
      setIsProcessingPayment(false)
    }
  })

  const handleCancel = () => {
    form.reset()
    setSelectedDate(undefined)
    setSlots(null)
    setSlotNotice(null)
    setCalendarSlots(null)
    setCalendarSlotNotice(null)
    setCreatedBookingId(null)
    setActivePaymentToken(null)
    setIsProcessingPayment(false)
    setStep(1)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-3xl shadow-sm">
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <input type="hidden" {...form.register("locationId")} />
          <input type="hidden" {...form.register("therapistId")} />
          <input type="hidden" {...form.register("dateKey")} />
          <input type="hidden" {...form.register("slotStartISO")} />
          <input type="hidden" {...form.register("slotEndISO")} />
          <CardHeader>
            <CardTitle>Create Booking</CardTitle>
            <CardDescription>
              Lengkapi data pasien, pilih lokasi & therapist, tentukan jadwal, lalu lanjut ke pembayaran.
            </CardDescription>
            <div className="mt-3 flex gap-2">
              {[1, 2, 3, 4].map((index) => (
                <div
                  key={index}
                  className={`h-1 flex-1 rounded-full ${
                    step === index ? "bg-primary" : "bg-muted"
                  }`}
                />
              ))}
            </div>
          </CardHeader>

          <CardContent className="space-y-5">
            {loading ? (
              <div className="text-sm text-muted-foreground">Loading booking form...</div>
            ) : locations.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                No active positions available. Please try again later.
              </div>
            ) : (
              <>
                {step === 1 && (
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

                {step === 2 && (
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
                          {!watchedLocationId ? (
                            <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                              Select a position first.
                            </div>
                          ) : availableTherapists.length === 0 ? (
                            <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                              No therapist schedule is configured for this position yet.
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

                {step === 3 && (
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
                                disabled={calendarSlotsLoading}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {calendarSlotsLoading
                                  ? "Loading availability..."
                                  : selectedDate
                                    ? formatDateLabel(selectedDate)
                                    : "Select date"}
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
                          ) : !form.getValues("locationId") || !form.getValues("therapistId") ? (
                            <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                              Select a position and therapist first.
                            </div>
                          ) : calendarSlotsLoading ? (
                            <Skeleton className="h-10 w-full" />
                          ) : slotsLoading ? (
                            <Skeleton className="h-10 w-full" />
                          ) : slotOptions.length === 0 ? (
                            <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                              {slotNotice ??
                                calendarSlotNotice ??
                                (selectedCalendarIsFull
                                  ? "Slots penuh di tanggal ini."
                                  : "No slots available.")}
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
                          <FieldError errors={[form.formState.errors.slotStartISO]} />
                        </FieldContent>
                      </Field>
                    </FieldGroup>
                  </div>
                )}

                {step === 4 && (
                  <div className="rounded-xl border bg-muted/30 p-4">
                    <div className="mb-3 text-sm font-medium">Payment</div>
                    <div className="space-y-4">
                      <div className="rounded-lg border bg-background p-4">
                        <div className="mb-3 text-sm font-medium">Booking summary</div>
                        <div className="space-y-2 text-sm">
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
                              {locations.find((item) => item.id === watchedLocationId)?.city ??
                                locations.find((item) => item.id === watchedLocationId)?.name ??
                                "-"}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-muted-foreground">Schedule</span>
                            <span>
                              {selectedDate
                                ? `${formatDateLabel(selectedDate)} ${form.getValues("slotStartISO") ? `, ${formatTime(form.getValues("slotStartISO"), slots?.timeZone)}` : ""}`
                                : "-"}
                            </span>
                          </div>
                        </div>
                      </div>

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
                        Pembayaran akan diproses melalui Midtrans Snap. Setelah booking dibuat,
                        popup pembayaran akan terbuka otomatis.
                      </div>

                      {!midtransEnabled ? (
                        <div className="rounded-lg border border-dashed p-4 text-sm text-destructive">
                          Midtrans belum dikonfigurasi di environment ini.
                        </div>
                      ) : !midtransReady ? (
                        <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                          Loading Midtrans payment dialog...
                        </div>
                      ) : null}

                      {createdBookingId && activePaymentToken ? (
                        <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                          Booking sudah dibuat dan menunggu pembayaran. Klik tombol di bawah
                          untuk membuka kembali popup Midtrans.
                        </div>
                      ) : null}
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>

          <CardFooter className="flex w-full justify-between">
            <Button
              type="button"
              variant="outline"
              disabled={Boolean(createdBookingId) || isProcessingPayment}
              onClick={() => {
                if (step === 1) {
                  handleCancel()
                  return
                }
                setStep(step - 1)
              }}
            >
              {step === 1 ? "Cancel" : "Back"}
            </Button>
            {step < 4 && (
              <Button
                type="button"
                onClick={() => setStep(step + 1)}
                disabled={
                  loading ||
                  (step === 1 && (!watchedFullName?.trim() || !watchedPhone?.trim())) ||
                  (step === 2 &&
                    (!watchedLocationId || !watchedTherapistId || !watchedServiceId)) ||
                  (step === 3 && !form.getValues("slotStartISO"))
                }
              >
                Next
              </Button>
            )}
            {step === 4 && (
              <Button
                type="submit"
                disabled={
                  form.formState.isSubmitting ||
                  loading ||
                  isProcessingPayment ||
                  !midtransEnabled ||
                  !midtransReady
                }
              >
                {isProcessingPayment
                  ? "Preparing Payment..."
                  : createdBookingId && activePaymentToken
                    ? "Continue Payment"
                    : "Create Booking & Pay"}
              </Button>
            )}
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
