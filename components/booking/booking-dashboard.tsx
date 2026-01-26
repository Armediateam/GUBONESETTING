"use client"

import * as React from "react"
import Link from "next/link"
import { zodResolver } from "@hookform/resolvers/zod"
import { CalendarIcon, Filter, Plus } from "lucide-react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import type { PatientRecord } from "@/lib/patients/schema"
import type { BookingRecord } from "@/lib/bookings/schema"
import { bookingStatusSchema } from "@/lib/bookings/schema"
import type { TherapistRecord } from "@/lib/therapists/schema"
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
import { useLocation } from "@/components/locations/location-context"

type SlotDay = {
  date: string
  slots: { startISO: string; endISO: string }[]
}

type SlotResponse = {
  timeZone: string
  items: SlotDay[]
}

const bookingFormSchema = z.object({
  patientId: z.string().min(1, "Pasien wajib dipilih"),
  therapistId: z.string().min(1, "Therapist wajib dipilih"),
  serviceName: z.string().min(1, "Nama layanan wajib diisi"),
  dateKey: z.string().min(1, "Tanggal wajib dipilih"),
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
  const { selectedLocation, selectedLocationId, locations } = useLocation()
  const [patients, setPatients] = React.useState<PatientRecord[]>([])
  const [bookings, setBookings] = React.useState<BookingRecord[]>([])
  const [therapists, setTherapists] = React.useState<TherapistRecord[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [filtersOpen, setFiltersOpen] = React.useState(false)
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [slotLoading, setSlotLoading] = React.useState(false)
  const [slots, setSlots] = React.useState<SlotResponse | null>(null)
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>()
  const [search, setSearch] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<string>("")
  const [patientFilter, setPatientFilter] = React.useState<string>("")
  const [dateFrom, setDateFrom] = React.useState<string>("")
  const [dateTo, setDateTo] = React.useState<string>("")

  const form = useForm({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      patientId: "",
      therapistId: "",
      serviceName: "",
      dateKey: "",
      slotStartISO: "",
      slotEndISO: "",
    },
  })

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
      toast.error("Gagal memuat pasien")
    }
  }, [])

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
      toast.error("Gagal memuat therapist")
    }
  }, [])

  const fetchBookings = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set("q", search)
      if (statusFilter) params.set("status", statusFilter)
      if (patientFilter) params.set("patientId", patientFilter)
      if (selectedLocationId) params.set("locationId", selectedLocationId)
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
      toast.error("Gagal memuat booking")
    } finally {
      setIsLoading(false)
    }
  }, [search, statusFilter, patientFilter, dateFrom, dateTo, selectedLocationId])

  React.useEffect(() => {
    fetchPatients()
    fetchTherapists()
  }, [fetchPatients, fetchTherapists])

  React.useEffect(() => {
    fetchBookings()
  }, [fetchBookings])

  React.useEffect(() => {
    const dateKey = selectedDate ? formatDateKey(selectedDate) : ""
    form.setValue("dateKey", dateKey)
    form.setValue("slotStartISO", "")
    form.setValue("slotEndISO", "")

    if (!dateKey || !selectedLocationId) {
      setSlots(null)
      return
    }

    const loadSlots = async () => {
      setSlotLoading(true)
      try {
        const res = await fetch(`/api/slots?date=${dateKey}&locationId=${selectedLocationId}`)
        if (!res.ok) {
          throw new Error("Failed to load slots")
        }
        const payload = (await res.json()) as SlotResponse
        setSlots(payload)
      } catch (error) {
        console.error(error)
        toast.error("Gagal memuat slot")
      } finally {
        setSlotLoading(false)
      }
    }

    loadSlots()
  }, [form, selectedDate, selectedLocationId])

  const handleCreateBooking = form.handleSubmit(async (values) => {
      if (!selectedLocationId) {
        toast.error("Pilih lokasi terlebih dahulu")
        return
      }
      if (!values.therapistId) {
        toast.error("Pilih therapist terlebih dahulu")
        return
      }
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: values.patientId,
          locationId: selectedLocationId,
          locationName: selectedLocation?.name,
          locationAddress: selectedLocation?.address,
          therapistId: values.therapistId,
          therapistName: therapists.find((item) => item.id === values.therapistId)?.name,
          serviceName: values.serviceName,
          startISO: values.slotStartISO,
          endISO: values.slotEndISO,
          status: "scheduled",
        }),
      })
      if (!res.ok) {
        const payload = await res.json()
        toast.error(payload?.message || "Gagal membuat booking")
        return
      }
      await res.json()
      await fetchBookings()
      toast.success("Booking berhasil dibuat")
      form.reset()
      setSelectedDate(undefined)
      setSlots(null)
      setDialogOpen(false)
    } catch (error) {
      console.error(error)
      toast.error("Server error")
    }
  })

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

  if (locations.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
        <h1 className="text-xl font-semibold">Belum ada lokasi</h1>
        <p className="text-sm text-muted-foreground">
          Tambahkan lokasi terlebih dahulu untuk membuat booking.
        </p>
        <Button asChild>
          <Link href="/locations">Tambah Lokasi</Link>
        </Button>
      </div>
    )
  }

  if (!selectedLocationId) {
    return (
      <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
        Pilih lokasi untuk melihat dan membuat booking.
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 lg:p-6">
      <div className="flex flex-col gap-4 rounded-xl border bg-background p-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-xl font-semibold">Bookings</h1>
          <p className="text-sm text-muted-foreground">
            Kelola booking untuk lokasi {selectedLocation?.name ?? "-"}.
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
        <div className="grid gap-3 rounded-xl border bg-muted/40 p-4 md:grid-cols-5">
          <div>
            <FieldLabel>Search</FieldLabel>
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari layanan/pasien"
            />
          </div>
          <div>
            <FieldLabel>Status</FieldLabel>
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value === "all" ? "" : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Semua status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua</SelectItem>
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
                <SelectValue placeholder="Semua pasien" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua</SelectItem>
                {patients.map((patient) => (
                  <SelectItem key={patient.id} value={patient.id}>
                    {patient.fullName}
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
            Belum ada booking. Tambahkan booking baru untuk memulai.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Therapist</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.map((booking) => (
                <TableRow key={booking.id}>
                  <TableCell className="font-medium">
                    {patientLookup.get(booking.patientId) ?? "Unknown"}
                  </TableCell>
                  <TableCell>{booking.serviceName}</TableCell>
                  <TableCell>{formatDateTime(booking.startISO)}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[booking.status]}>
                      {statusLabel[booking.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>{booking.therapistName ?? "-"}</TableCell>
                  <TableCell>{booking.locationName ?? selectedLocation?.name ?? "-"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDateTime(booking.createdAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Booking</DialogTitle>
            <DialogDescription>Pilih pasien dan slot yang tersedia.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateBooking} className="space-y-4">
            <input type="hidden" {...form.register("patientId")} />
            <input type="hidden" {...form.register("therapistId")} />
            <input type="hidden" {...form.register("dateKey")} />
            <input type="hidden" {...form.register("slotStartISO")} />
            <input type="hidden" {...form.register("slotEndISO")} />
            <FieldGroup>
              <Field>
                <FieldLabel>Patient</FieldLabel>
                <FieldContent>
                  <Select
                    value={form.watch("patientId")}
                    onValueChange={(value) => form.setValue("patientId", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih pasien" />
                    </SelectTrigger>
                    <SelectContent>
                      {patients.map((patient) => (
                        <SelectItem key={patient.id} value={patient.id}>
                          {patient.fullName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldError errors={[form.formState.errors.patientId]} />
                </FieldContent>
              </Field>
              <Field>
                <FieldLabel>Service Name</FieldLabel>
                <FieldContent>
                  <Input
                    placeholder="Therapy session"
                    {...form.register("serviceName")}
                  />
                  <FieldError errors={[form.formState.errors.serviceName]} />
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
                        {selectedDate ? formatDateKey(selectedDate) : "Pilih tanggal"}
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
                      Pilih tanggal terlebih dahulu.
                    </div>
                  ) : slotLoading ? (
                    <Skeleton className="h-10 w-full" />
                  ) : slotOptions.length === 0 ? (
                    <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                      Tidak ada slot tersedia.
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
                        <SelectValue placeholder="Pilih slot" />
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
              <Field>
                <FieldLabel>Therapist</FieldLabel>
                <FieldContent>
                  {therapists.length === 0 ? (
                    <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                      Tambahkan therapist terlebih dahulu.
                    </div>
                  ) : (
                    <Select
                      value={form.watch("therapistId")}
                      onValueChange={(value) => form.setValue("therapistId", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih therapist" />
                      </SelectTrigger>
                      <SelectContent>
                        {therapists.map((therapist) => (
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
                <FieldLabel>Location</FieldLabel>
                <FieldContent>
                  <div className="rounded-lg border px-3 py-2 text-sm">
                    {selectedLocation?.name ?? "-"}
                  </div>
                </FieldContent>
              </Field>
            </FieldGroup>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Menyimpan..." : "Simpan Booking"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
