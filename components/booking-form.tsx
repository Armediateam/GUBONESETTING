"use client"

import * as React from "react"
import { CalendarIcon, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"

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

type LocationItem = {
  id: string
  name: string
  address?: string
  city?: string
  isActive: boolean
}

type TherapistItem = {
  id: string
  name: string
  isActive: boolean
  price: number
}

type ServiceItem = {
  id: string
  name: string
  durationMins?: number
  isActive?: boolean
}

type SlotDay = {
  date: string
  slots: { startISO: string; endISO: string }[]
}

type SlotResponse = {
  timeZone: string
  items: SlotDay[]
}

type PatientPayload = {
  id: string
}

const formatDateKey = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

const formatDateLabel = (value: Date) =>
  new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(value)

const formatTime = (value: string, timeZone?: string) =>
  new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value))

export default function BookingForm() {
  const [step, setStep] = React.useState(1)
  const [loading, setLoading] = React.useState(true)
  const [slotsLoading, setSlotsLoading] = React.useState(false)

  const [locations, setLocations] = React.useState<LocationItem[]>([])
  const [therapists, setTherapists] = React.useState<TherapistItem[]>([])
  const [services, setServices] = React.useState<ServiceItem[]>([])
  const [slots, setSlots] = React.useState<SlotResponse | null>(null)

  const [fullName, setFullName] = React.useState("")
  const [phone, setPhone] = React.useState("")
  const [email, setEmail] = React.useState("")

  const [locationId, setLocationId] = React.useState("")
  const [therapistId, setTherapistId] = React.useState("")
  const [serviceId, setServiceId] = React.useState("")
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>()
  const [slotStartISO, setSlotStartISO] = React.useState("")
  const [slotEndISO, setSlotEndISO] = React.useState("")

  const [submitting, setSubmitting] = React.useState(false)

  React.useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        const [locationsRes, therapistsRes, servicesRes] = await Promise.all([
          fetch("/api/locations"),
          fetch("/api/therapists"),
          fetch("/api/services"),
        ])
        if (!locationsRes.ok || !therapistsRes.ok || !servicesRes.ok) {
          throw new Error("Failed to load booking data")
        }
        const locationsPayload = await locationsRes.json()
        const therapistsPayload = await therapistsRes.json()
        const servicesPayload = await servicesRes.json()

        const activeLocations = (locationsPayload.items ?? []).filter(
          (item: LocationItem) => item.isActive
        )
        const activeTherapists = (therapistsPayload.items ?? []).filter(
          (item: TherapistItem) => item.isActive
        )
        const activeServices = (servicesPayload.items ?? []).filter(
          (item: ServiceItem) => item.isActive !== false
        )

        setLocations(activeLocations)
        setTherapists(activeTherapists)
        setServices(activeServices)

        setLocationId(activeLocations[0]?.id ?? "")
        setTherapistId(activeTherapists[0]?.id ?? "")
        setServiceId(activeServices[0]?.id ?? "")
      } catch (error) {
        console.error(error)
        toast.error("Failed to load booking data")
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  React.useEffect(() => {
    const dateKey = selectedDate ? formatDateKey(selectedDate) : ""
    setSlotStartISO("")
    setSlotEndISO("")
    if (!dateKey || !locationId) {
      setSlots(null)
      return
    }

    const loadSlots = async () => {
      setSlotsLoading(true)
      try {
        const res = await fetch(`/api/slots?date=${dateKey}&locationId=${locationId}`)
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
  }, [locationId, selectedDate])

  const selectedService = services.find((service) => service.id === serviceId)
  const selectedTherapist = therapists.find((therapist) => therapist.id === therapistId)
  const slotOptions = React.useMemo(() => {
    if (!slots || !selectedDate) return []
    const dateKey = formatDateKey(selectedDate)
    return slots.items.find((item) => item.date === dateKey)?.slots ?? []
  }, [slots, selectedDate])

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1)
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!selectedDate || !slotStartISO || !slotEndISO) {
      toast.error("Select a date and time slot")
      return
    }
    if (!locationId || !therapistId || !serviceId) {
      toast.error("Complete all booking details")
      return
    }
    setSubmitting(true)
    try {
      const patientRes = await fetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          phone,
          email,
        }),
      })
      if (!patientRes.ok) {
        const payload = await patientRes.json()
        toast.error(payload?.message || "Failed to create patient")
        setSubmitting(false)
        return
      }
      const patient = (await patientRes.json()) as PatientPayload

      const location = locations.find((item) => item.id === locationId)
      const therapist = therapists.find((item) => item.id === therapistId)
      const service = services.find((item) => item.id === serviceId)

      const bookingRes = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: patient.id,
          locationId,
          therapistId,
          serviceName: service?.name ?? "Service",
          startISO: slotStartISO,
          endISO: slotEndISO,
          status: "scheduled",
          paymentStatus: "pending",
          payment: {
            provider: "midtrans",
            grossAmount: therapist?.price ?? 0,
            currency: "IDR",
            statusMessage: "Awaiting payment",
          },
          locationName: location?.name,
          locationAddress: location?.address,
          therapistName: therapist?.name,
        }),
      })
      if (!bookingRes.ok) {
        const payload = await bookingRes.json()
        toast.error(payload?.message || "Failed to create booking")
        setSubmitting(false)
        return
      }

      toast.success("Booking created. Payment is pending.")
      setStep(1)
      setFullName("")
      setPhone("")
      setEmail("")
      setSelectedDate(undefined)
      setSlotStartISO("")
      setSlotEndISO("")
    } catch (error) {
      console.error(error)
      toast.error("Server error")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-2xl shadow-sm">
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <CardHeader>
            <CardTitle>Booking Request</CardTitle>
            <CardDescription>
              Submit your booking details. Payment will be completed via Midtrans.
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
                  <FieldGroup>
                    <Field>
                      <FieldLabel>Full Name</FieldLabel>
                      <FieldContent>
                        <Input
                          value={fullName}
                          onChange={(event) => setFullName(event.target.value)}
                          placeholder="Enter your full name"
                          required
                        />
                        <FieldError errors={[]} />
                      </FieldContent>
                    </Field>
                    <div className="grid gap-4 md:grid-cols-2">
                      <Field>
                        <FieldLabel>Phone Number</FieldLabel>
                        <FieldContent>
                          <Input
                            value={phone}
                            onChange={(event) => setPhone(event.target.value)}
                            placeholder="08123456789"
                            required
                          />
                          <FieldError errors={[]} />
                        </FieldContent>
                      </Field>
                      <Field>
                        <FieldLabel>Email (optional)</FieldLabel>
                        <FieldContent>
                          <Input
                            type="email"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            placeholder="you@email.com"
                          />
                          <FieldError errors={[]} />
                        </FieldContent>
                      </Field>
                    </div>
                  </FieldGroup>
                )}

                {step === 2 && (
                  <FieldGroup>
                    <div className="grid gap-4 md:grid-cols-2">
                      <Field>
                        <FieldLabel>Position</FieldLabel>
                        <FieldContent>
                          <Select value={locationId} onValueChange={setLocationId}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select position" />
                            </SelectTrigger>
                            <SelectContent>
                              {locations.map((location) => (
                                <SelectItem key={location.id} value={location.id}>
                                  {location.name ?? "Position"}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FieldContent>
                      </Field>
                      <Field>
                        <FieldLabel>Therapist</FieldLabel>
                        <FieldContent>
                          <Select value={therapistId} onValueChange={setTherapistId}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select therapist" />
                            </SelectTrigger>
                            <SelectContent>
                              {therapists.map((therapist) => (
                                <SelectItem key={therapist.id} value={therapist.id}>
                                  {therapist.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FieldContent>
                      </Field>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <Field>
                        <FieldLabel>Service</FieldLabel>
                        <FieldContent>
                          <Select value={serviceId} onValueChange={setServiceId}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select service" />
                            </SelectTrigger>
                            <SelectContent>
                              {services.map((service) => (
                                <SelectItem key={service.id} value={service.id}>
                                  {service.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FieldContent>
                      </Field>
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
                        </FieldContent>
                      </Field>
                    </div>

                    <Field>
                      <FieldLabel>Available Slots</FieldLabel>
                      <FieldContent>
                        {slotsLoading ? (
                          <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                            Loading slots...
                          </div>
                        ) : slotOptions.length === 0 ? (
                          <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                            No slots available.
                          </div>
                        ) : (
                          <Select
                            value={slotStartISO}
                            onValueChange={(value) => {
                              const slot = slotOptions.find((item) => item.startISO === value)
                              setSlotStartISO(value)
                              setSlotEndISO(slot?.endISO ?? "")
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select a time slot" />
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
                      </FieldContent>
                    </Field>
                  </FieldGroup>
                )}

                {step === 3 && (
                  <div className="space-y-4">
                    <div className="rounded-lg border bg-background p-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                        Review your booking before confirming payment.
                      </div>
                      <div className="mt-3 space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Service</span>
                          <span className="font-medium">{selectedService?.name ?? "-"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Therapist Price</span>
                          <span className="font-medium">
                            {selectedTherapist
                              ? new Intl.NumberFormat("id-ID", {
                                  style: "currency",
                                  currency: "IDR",
                                  maximumFractionDigits: 0,
                                }).format(selectedTherapist.price)
                              : "-"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Date</span>
                          <span className="font-medium">
                            {selectedDate ? formatDateLabel(selectedDate) : "-"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Time</span>
                          <span className="font-medium">
                            {slotStartISO && slotEndISO
                              ? `${formatTime(slotStartISO, slots?.timeZone)} - ${formatTime(
                                  slotEndISO,
                                  slots?.timeZone
                                )}`
                              : "-"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                      Payment will be handled by Midtrans after you confirm the booking.
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>

          <CardFooter className={`flex w-full ${step === 1 ? "justify-end" : "justify-between"}`}>
            {step > 1 && (
              <Button type="button" variant="outline" onClick={handleBack}>
                Back
              </Button>
            )}
            {step < 3 && (
              <Button type="button" onClick={handleNext} disabled={loading || locations.length === 0}>
                Next
              </Button>
            )}
            {step === 3 && (
              <Button type="submit" disabled={submitting || loading}>
                {submitting ? "Submitting..." : "Confirm Booking"}
              </Button>
            )}
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
