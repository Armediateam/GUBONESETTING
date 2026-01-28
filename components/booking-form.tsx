"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { CalendarIcon } from "lucide-react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import type { LocationRecord } from "@/lib/locations/schema"
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
}

type SlotResponse = {
  timeZone: string
  items: SlotDay[]
}

type ServiceItem = {
  id: string
  name: string
  durationMins?: number
  isActive?: boolean
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
  serviceName: z.string().min(1, "Service name is required"),
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

export default function BookingForm() {
  const [step, setStep] = React.useState(1)
  const [loading, setLoading] = React.useState(true)
  const [slotsLoading, setSlotsLoading] = React.useState(false)

  const [locations, setLocations] = React.useState<LocationRecord[]>([])
  const [therapists, setTherapists] = React.useState<TherapistRecord[]>([])
  const [services, setServices] = React.useState<ServiceItem[]>([])
  const [schedulePairs, setSchedulePairs] = React.useState<
    { locationId: string; therapistId: string }[]
  >([])
  const [slots, setSlots] = React.useState<SlotResponse | null>(null)
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>()

  const form = useForm({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      fullName: "",
      phone: "",
      email: "",
      complaint: "",
      locationId: "",
      therapistId: "",
      serviceName: "",
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

        if (!form.getValues("serviceName")) {
          const firstActive = activeServices[0]
          if (firstActive) {
            form.setValue("serviceName", firstActive.name)
          }
        }
      } catch (error) {
        console.error(error)
        toast.error("Failed to load booking data")
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [form])

  const watchedLocationId = form.watch("locationId")
  const watchedTherapistId = form.watch("therapistId")
  const watchedFullName = form.watch("fullName")
  const watchedPhone = form.watch("phone")
  const watchedServiceName = form.watch("serviceName")

  const schedulePairSet = React.useMemo(
    () => new Set(schedulePairs.map((item) => `${item.locationId}:${item.therapistId}`)),
    [schedulePairs]
  )

  const availableTherapists = React.useMemo(() => {
    if (!watchedLocationId) return therapists
    return therapists.filter((therapist) =>
      schedulePairSet.has(`${watchedLocationId}:${therapist.id}`)
    )
  }, [therapists, schedulePairSet, watchedLocationId])

  const availableLocations = React.useMemo(() => {
    if (!watchedTherapistId) return locations
    return locations.filter((location) =>
      schedulePairSet.has(`${location.id}:${watchedTherapistId}`)
    )
  }, [locations, schedulePairSet, watchedTherapistId])

  const availableServices = React.useMemo(
    () => services.filter((service) => service.isActive !== false),
    [services]
  )

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
    const dateKey = selectedDate ? formatDateKey(selectedDate) : ""
    const locationId = form.getValues("locationId")
    const therapistId = form.getValues("therapistId")
    form.setValue("dateKey", dateKey)
    form.setValue("slotStartISO", "")
    form.setValue("slotEndISO", "")

    if (!dateKey || !locationId || !therapistId) {
      setSlots(null)
      return
    }

    const loadSlots = async () => {
      setSlotsLoading(true)
      try {
        const res = await fetch(
          `/api/slots?date=${dateKey}&locationId=${locationId}&therapistId=${therapistId}`
        )
        if (!res.ok) {
          throw new Error("Failed to load slots")
        }
        const payload = (await res.json()) as SlotResponse
        setSlots(payload)
      } catch (error) {
        console.error(error)
        toast.error("Failed to load slots")
      } finally {
        setSlotsLoading(false)
      }
    }

    loadSlots()
  }, [form, selectedDate, watchedLocationId, watchedTherapistId])

  const slotOptions = React.useMemo(() => {
    if (!slots || !form.getValues("dateKey")) return []
    const dateKey = form.getValues("dateKey")
    return slots.items.find((item) => item.date === dateKey)?.slots ?? []
  }, [slots, form])

  const handleSubmit = form.handleSubmit(async (values) => {
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
          serviceName: values.serviceName,
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

      toast.success("Booking created")
      form.reset()
      setSelectedDate(undefined)
      setSlots(null)
      setStep(1)
    } catch (error) {
      console.error(error)
      toast.error("Server error")
    }
  })

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-2xl shadow-sm">
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <CardHeader>
            <CardTitle>Booking Request</CardTitle>
            <CardDescription>
              Lengkapi data pasien, pilih lokasi & therapist, lalu tentukan jadwal.
            </CardDescription>
            <div className="mt-3 flex gap-2">
              {[1, 2, 3].map((index) => (
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
                          {availableTherapists.length === 0 ? (
                            <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                              No therapist available for this position.
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
                          <FieldError errors={[form.formState.errors.therapistId]} />
                        </FieldContent>
                      </Field>
                      <Field>
                        <FieldLabel>Service Name</FieldLabel>
                        <FieldContent>
                          {availableServices.length === 0 ? (
                            <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                              Add a service first.
                            </div>
                          ) : (
                            <Select
                              value={form.watch("serviceName")}
                              onValueChange={(value) => form.setValue("serviceName", value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select a service" />
                              </SelectTrigger>
                              <SelectContent>
                                {availableServices.map((service) => (
                                  <SelectItem key={service.id} value={service.name}>
                                    {service.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                          <FieldError errors={[form.formState.errors.serviceName]} />
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
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {selectedDate ? formatDateLabel(selectedDate) : "Select date"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={selectedDate}
                                onSelect={setSelectedDate}
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
                          ) : slotsLoading ? (
                            <Skeleton className="h-10 w-full" />
                          ) : slotOptions.length === 0 ? (
                            <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                              No slots available.
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
              </>
            )}
          </CardContent>

          <CardFooter className={`flex w-full ${step === 1 ? "justify-end" : "justify-between"}`}>
            {step > 1 && (
              <Button type="button" variant="outline" onClick={() => setStep(step - 1)}>
                Back
              </Button>
            )}
            {step < 3 && (
              <Button
                type="button"
                onClick={() => setStep(step + 1)}
                disabled={
                  loading ||
                  (step === 1 && (!watchedFullName?.trim() || !watchedPhone?.trim())) ||
                  (step === 2 &&
                    (!watchedLocationId || !watchedTherapistId || !watchedServiceName?.trim()))
                }
              >
                Next
              </Button>
            )}
            {step === 3 && (
              <Button type="submit" disabled={form.formState.isSubmitting || loading}>
                {form.formState.isSubmitting ? "Submitting..." : "Confirm Booking"}
              </Button>
            )}
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
