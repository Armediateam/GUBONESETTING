"use client"

import * as React from "react"
import Link from "next/link"
import { zodResolver } from "@hookform/resolvers/zod"
import { CalendarIcon, Filter, MoreVertical, Plus } from "lucide-react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import type { PatientRecord } from "@/lib/patients/schema"
import type { BookingRecord } from "@/lib/bookings/schema"
import { bookingStatusSchema } from "@/lib/bookings/schema"
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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

const formatDateKey = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
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

const formatTime = (value: string, timeZone?: string) =>
  new Intl.DateTimeFormat("id-ID", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value))

export function BookingDashboard() {
  const [locations, setLocations] = React.useState<LocationRecord[]>([])
  const [patients, setPatients] = React.useState<PatientRecord[]>([])
  const [bookings, setBookings] = React.useState<BookingRecord[]>([])
  const [therapists, setTherapists] = React.useState<TherapistRecord[]>([])
  const [services, setServices] = React.useState<ServiceItem[]>([])
  const [schedulePairs, setSchedulePairs] = React.useState<
    { locationId: string; therapistId: string }[]
  >([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [filtersOpen, setFiltersOpen] = React.useState(false)
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [bookingStep, setBookingStep] = React.useState(1)
  const [slotLoading, setSlotLoading] = React.useState(false)
  const [slots, setSlots] = React.useState<SlotResponse | null>(null)
  const [rescheduleOpen, setRescheduleOpen] = React.useState(false)
  const [rescheduleBooking, setRescheduleBooking] = React.useState<BookingRecord | null>(null)
  const [rescheduleDate, setRescheduleDate] = React.useState<Date | undefined>()
  const [rescheduleSlots, setRescheduleSlots] = React.useState<SlotResponse | null>(null)
  const [rescheduleSlotLoading, setRescheduleSlotLoading] = React.useState(false)
  const [rescheduleSlotStartISO, setRescheduleSlotStartISO] = React.useState("")
  const [rescheduleSlotEndISO, setRescheduleSlotEndISO] = React.useState("")
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>()
  const [search, setSearch] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<string>("")
  const [patientFilter, setPatientFilter] = React.useState<string>("")
  const [locationFilter, setLocationFilter] = React.useState<string>("")
  const [dateFrom, setDateFrom] = React.useState<string>("")
  const [dateTo, setDateTo] = React.useState<string>("")

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
  }, [form])

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
      if (!form.getValues("serviceName")) {
        const firstActive = items.find((item: ServiceItem) => item.isActive !== false)
        if (firstActive) {
          form.setValue("serviceName", firstActive.name)
        }
      }
    } catch (error) {
      console.error(error)
      toast.error("Failed to load services")
    }
  }, [form])

  const fetchTherapists = React.useCallback(async () => {
    try {
      const res = await fetch("/api/therapists")
      if (!res.ok) {
        throw new Error("Failed to load therapists")
      }
      const data = await res.json()
      setTherapists((data.items ?? []).filter((item: TherapistRecord) => item.isActive))
    } catch (error) {
      console.error(error)
      toast.error("Failed to load therapists")
    }
  }, [])

  const fetchBookings = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set("q", search)
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
  }, [search, statusFilter, patientFilter, locationFilter, dateFrom, dateTo])

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

  const watchedLocationId = form.watch("locationId")
  const watchedTherapistId = form.watch("therapistId")
  const watchedFullName = form.watch("fullName")
  const watchedPhone = form.watch("phone")
  const watchedServiceName = form.watch("serviceName")

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
      setSlotLoading(true)
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
        setSlotLoading(false)
      }
    }

    loadSlots()
  }, [form, selectedDate, watchedLocationId, watchedTherapistId])

  React.useEffect(() => {
    if (!rescheduleBooking || !rescheduleDate) {
      setRescheduleSlots(null)
      setRescheduleSlotStartISO("")
      setRescheduleSlotEndISO("")
      return
    }
    const dateKey = formatDateKey(rescheduleDate)
    const loadSlots = async () => {
      setRescheduleSlotLoading(true)
      try {
        const res = await fetch(
          `/api/slots?date=${dateKey}&locationId=${rescheduleBooking.locationId}&therapistId=${rescheduleBooking.therapistId}`
        )
        if (!res.ok) {
          throw new Error("Failed to load slots")
        }
        const payload = (await res.json()) as SlotResponse
        setRescheduleSlots(payload)
      } catch (error) {
        console.error(error)
        toast.error("Failed to load slots")
      } finally {
        setRescheduleSlotLoading(false)
      }
    }
    loadSlots()
  }, [rescheduleBooking, rescheduleDate])

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
          serviceName: values.serviceName,
          complaint: values.complaint,
          startISO: values.slotStartISO,
          endISO: values.slotEndISO,
          status: "scheduled",
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
      form.reset()
      setSelectedDate(undefined)
      setSlots(null)
      setDialogOpen(false)
      setBookingStep(1)
    } catch (error) {
      console.error(error)
      toast.error("Server error")
    }
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

  const handleOpenReschedule = (booking: BookingRecord) => {
    setRescheduleBooking(booking)
    setRescheduleDate(new Date(booking.startISO))
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

  const patientLookup = React.useMemo(() => {
    return new Map(patients.map((patient) => [patient.id, patient.fullName]))
  }, [patients])


  const schedulePairSet = React.useMemo(
    () => new Set(schedulePairs.map((item) => `${item.locationId}:${item.therapistId}`)),
    [schedulePairs]
  )

  const availableTherapists = React.useMemo(() => {
    const activeTherapists = therapists.filter((therapist) => therapist.isActive)
    if (!watchedLocationId) {
      return activeTherapists
    }
    return activeTherapists.filter((therapist) =>
      schedulePairSet.has(`${watchedLocationId}:${therapist.id}`)
    )
  }, [therapists, schedulePairSet, watchedLocationId])

  const availableLocations = React.useMemo(() => {
    const activeLocations = locations.filter((location) => location.isActive !== false)
    if (!watchedTherapistId) {
      return activeLocations
    }
    return activeLocations.filter((location) =>
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

  if (locations.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
        <h1 className="text-xl font-semibold">No positions yet</h1>
        <p className="text-sm text-muted-foreground">
          Add a position before creating bookings.
        </p>
        <Button asChild>
          <Link href="/dashboard/locations">Manage Positions</Link>
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
          <Button variant="outline" onClick={() => setFiltersOpen((prev) => !prev)}>
            <Filter className="mr-2 h-4 w-4" />
            Filters
          </Button>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Booking
          </Button>
        </div>
      </div>

      {filtersOpen && (
        <div className="grid gap-3 rounded-xl border bg-muted/40 p-4 md:grid-cols-6">
          <div>
            <FieldLabel>Search</FieldLabel>
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search service/patient"
            />
          </div>
          <div>
            <FieldLabel>Status</FieldLabel>
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value === "all" ? "" : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {bookingStatusSchema.options.map((status) => (
                  <SelectItem key={status} value={status}>
                    {statusLabel[status]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <FieldLabel>Patient</FieldLabel>
            <Select
              value={patientFilter}
              onValueChange={(value) => setPatientFilter(value === "all" ? "" : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All patients" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {patients.map((patient) => (
                  <SelectItem key={patient.id} value={patient.id}>
                    {patient.fullName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <FieldLabel>Position</FieldLabel>
            <Select
              value={locationFilter}
              onValueChange={(value) => setLocationFilter(value === "all" ? "" : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All positions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {availableLocations.map((location) => (
                  <SelectItem key={location.id} value={location.id}>
                    {location.city ?? location.name ?? "Position"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <FieldLabel>Date From</FieldLabel>
            <Input
              type="date"
              value={dateFrom}
              onChange={(event) => setDateFrom(event.target.value)}
            />
          </div>
          <div>
            <FieldLabel>Date To</FieldLabel>
            <Input
              type="date"
              value={dateTo}
              onChange={(event) => setDateTo(event.target.value)}
            />
          </div>
        </div>
      )}

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
                <TableHead>Date & Time</TableHead>
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
                  <TableCell>{formatDateTime(booking.startISO)}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[booking.status]}>
                      {statusLabel[booking.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={paymentVariant[booking.paymentStatus ?? "pending"]}>
                      {paymentLabel[booking.paymentStatus ?? "pending"]}
                    </Badge>
                  </TableCell>
                  <TableCell>{booking.therapistName ?? "-"}</TableCell>
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
          setDialogOpen(open)
          if (!open) {
            setBookingStep(1)
          }
        }}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Create Booking</DialogTitle>
            <DialogDescription>
              Lengkapi data pasien, pilih lokasi & therapist, lalu tentukan jadwal.
            </DialogDescription>
            <div className="mt-3 flex gap-2">
              {[1, 2, 3].map((index) => (
                <div
                  key={index}
                  className={`h-1 flex-1 rounded-full ${
                    bookingStep === index ? "bg-primary" : "bg-muted"
                  }`}
                />
              ))}
            </div>
          </DialogHeader>
          <form onSubmit={handleCreateBooking} className="space-y-6">
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
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  if (bookingStep === 1) {
                    setDialogOpen(false)
                    setBookingStep(1)
                  } else {
                    setBookingStep((prev) => Math.max(1, prev - 1))
                  }
                }}
              >
                {bookingStep === 1 ? "Cancel" : "Back"}
              </Button>
              {bookingStep < 3 ? (
                <Button
                  type="button"
                  onClick={() => setBookingStep((prev) => Math.min(3, prev + 1))}
                  disabled={
                    (bookingStep === 1 &&
                      (!watchedFullName?.trim() || !watchedPhone?.trim())) ||
                    (bookingStep === 2 &&
                      (!watchedLocationId ||
                        !watchedTherapistId ||
                        !watchedServiceName?.trim()))
                  }
                >
                  Next
                </Button>
              ) : (
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? "Saving..." : "Save Booking"}
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
                    No slots available.
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
