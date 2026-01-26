"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  CalendarIcon,
  Pencil,
  Plus,
  Trash2,
  TriangleAlert,
} from "lucide-react"
import {
  type Control,
  type FieldErrors,
  type Resolver,
  type UseFormRegister,
  type UseFormSetValue,
  useFieldArray,
  useForm,
  useWatch,
} from "react-hook-form"
import { toast } from "sonner"

import {
  BUFFER_MINS,
  dayKeys,
  defaultSchedule,
  MAX_FUTURE_DAYS,
  MIN_NOTICE_HOURS,
  overrideSchema,
  SLOT_DURATIONS,
  scheduleSchema,
  type DayKey,
  type Schedule,
} from "@/lib/schedule/schema"
import { generateAvailableSlots } from "@/lib/schedule/slots"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldTitle,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useLocation } from "@/components/locations/location-context"
const dayLabels: Record<DayKey, string> = {
  mon: "Senin",
  tue: "Selasa",
  wed: "Rabu",
  thu: "Kamis",
  fri: "Jumat",
  sat: "Sabtu",
  sun: "Minggu",
}

const defaultRange = { start: "09:00", end: "17:00" }

const timezones =
  typeof Intl.supportedValuesOf === "function"
    ? Intl.supportedValuesOf("timeZone")
    : ["Asia/Jakarta", "Asia/Singapore", "UTC"]

const formatDateKey = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

const parseDateKey = (dateKey: string) => {
  const [year, month, day] = dateKey.split("-").map((value) => Number(value))
  return new Date(year, month - 1, day)
}

const formatTimeLabel = (iso: string, timeZone: string) => {
  const date = new Date(iso)
  return new Intl.DateTimeFormat("id-ID", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

const formatDateLabel = (dateKey: string, timeZone: string) => {
  const date = parseDateKey(dateKey)
  return new Intl.DateTimeFormat("id-ID", {
    timeZone,
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date)
}

const toLiteral = <T extends readonly number[]>(values: T, next: number, fallback: T[number]) => {
  return (values.includes(next) ? next : fallback) as T[number]
}

export function ScheduleMain() {
  const { selectedLocation, selectedLocationId, locations } = useLocation()
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSaving, setIsSaving] = React.useState(false)
  const [lastSavedAt, setLastSavedAt] = React.useState<string | null>(null)
  const [savedSchedule, setSavedSchedule] = React.useState<Schedule | null>(null)
  const [overrideDialogOpen, setOverrideDialogOpen] = React.useState(false)
  const [overrideIndex, setOverrideIndex] = React.useState<number | null>(null)
  const [overrideIsNew, setOverrideIsNew] = React.useState(false)

  const form = useForm<Schedule>({
    resolver: zodResolver(scheduleSchema) as Resolver<Schedule>,
    defaultValues: defaultSchedule,
    mode: "onChange",
  })

  const {
    control,
    register,
    reset,
    formState: { errors, isDirty },
    handleSubmit,
    setValue,
  } = form

  const overridesArray = useFieldArray({
    control,
    name: "overrides",
  })

  const scheduleWatch = useWatch({ control })

  React.useEffect(() => {
    let active = true

    const loadSchedule = async () => {
      if (!selectedLocationId) {
        setIsLoading(false)
        return
      }
      setIsLoading(true)
      try {
        const res = await fetch(`/api/schedule?locationId=${selectedLocationId}`)
        if (!res.ok) {
          throw new Error("Failed to load schedule")
        }
        const data = (await res.json()) as Schedule
        if (active) {
          reset(data)
          setSavedSchedule(data)
          setLastSavedAt(new Date().toISOString())
        }
      } catch (error) {
        console.error(error)
        toast.error("Gagal memuat jadwal")
      } finally {
        if (active) {
          setIsLoading(false)
        }
      }
    }

    loadSchedule()

    return () => {
      active = false
    }
  }, [reset, selectedLocationId])

  React.useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => {
      if (!isDirty) {
        return
      }
      event.preventDefault()
      event.returnValue = ""
    }

    window.addEventListener("beforeunload", handler)
    return () => window.removeEventListener("beforeunload", handler)
  }, [isDirty])

  const onSubmit = handleSubmit(async (values) => {
    if (!selectedLocationId) {
      toast.error("Pilih lokasi terlebih dahulu")
      return
    }
    setIsSaving(true)
    try {
      const res = await fetch(`/api/schedule?locationId=${selectedLocationId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      })

      if (!res.ok) {
        const payload = await res.json()
        toast.error(payload?.message || "Gagal menyimpan jadwal")
        return
      }

      const data = (await res.json()) as Schedule
      reset(data)
      setSavedSchedule(data)
      setLastSavedAt(new Date().toISOString())
      toast.success("Jadwal berhasil disimpan")
    } catch (error) {
      console.error(error)
      toast.error("Server error")
    } finally {
      setIsSaving(false)
    }
  })

  const handleReset = () => {
    reset(savedSchedule ?? defaultSchedule)
  }

  const openNewOverride = () => {
    const index = overridesArray.fields.length
    const today = formatDateKey(new Date())

    overridesArray.append({
      date: today,
      closed: true,
      ranges: [defaultRange],
    })

    setOverrideIndex(index)
    setOverrideIsNew(true)
    setOverrideDialogOpen(true)
  }

  const openEditOverride = (index: number) => {
    setOverrideIndex(index)
    setOverrideIsNew(false)
    setOverrideDialogOpen(true)
  }

  const closeOverrideDialog = () => {
    if (overrideIsNew && overrideIndex !== null) {
      overridesArray.remove(overrideIndex)
    }
    setOverrideDialogOpen(false)
    setOverrideIndex(null)
    setOverrideIsNew(false)
  }

  const confirmOverrideDialog = () => {
    if (overrideIndex === null) {
      return
    }
    const override = form.getValues(`overrides.${overrideIndex}`)
    const parsed = overrideSchema.safeParse(override)

    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message || "Override tidak valid")
      return
    }

    const cleaned = parsed.data.closed
      ? { ...parsed.data, ranges: [] }
      : parsed.data
    overridesArray.update(overrideIndex, cleaned)
    setOverrideDialogOpen(false)
    setOverrideIndex(null)
    setOverrideIsNew(false)
  }

  const previewSchedule = React.useMemo(() => {
    const parsed = scheduleSchema.safeParse(scheduleWatch)
    return parsed.success ? parsed.data : null
  }, [scheduleWatch])

  const previewSlots = React.useMemo(() => {
    if (!previewSchedule) {
      return []
    }

    const start = new Date()
    const end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000)

    return generateAvailableSlots({
      schedule: previewSchedule,
      rangeStartISO: start.toISOString(),
      rangeEndISO: end.toISOString(),
    })
  }, [previewSchedule])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (locations.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
        Belum ada lokasi. Tambahkan lokasi terlebih dahulu sebelum mengatur jadwal.
      </div>
    )
  }

  if (!selectedLocationId) {
    return (
      <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
        Pilih lokasi untuk mengatur jadwal.
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Tabs defaultValue="weekly" className="space-y-6">
        <div className="sticky top-0 z-10 flex flex-col gap-3 rounded-xl border bg-background/95 px-3 py-3 shadow-sm backdrop-blur sm:px-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="w-full overflow-x-auto">
            <TabsList className="flex w-max min-w-full flex-nowrap gap-2 whitespace-nowrap">
              <TabsTrigger value="weekly">Weekly Hours</TabsTrigger>
              <TabsTrigger value="overrides">Overrides</TabsTrigger>
              <TabsTrigger value="rules">Booking Rules</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>
          </div>
          <div className="flex w-full flex-col gap-2 md:items-end lg:w-auto lg:flex-row lg:items-center lg:justify-end">
            <div className="text-xs text-muted-foreground md:text-sm md:text-right lg:whitespace-nowrap">
              Lokasi: {selectedLocation?.name ?? "-"}
            </div>
            <div className="text-xs text-muted-foreground md:text-sm md:text-right lg:whitespace-nowrap">
              {lastSavedAt
                ? `Terakhir disimpan: ${new Date(lastSavedAt).toLocaleString("id-ID")}`
                : "Belum pernah disimpan"}
            </div>
            <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-between md:w-auto md:justify-end lg:flex-nowrap">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleReset}
                disabled={!isDirty || isSaving}
                className="w-full sm:w-auto"
              >
                Reset
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={!isDirty || isSaving}
                className="w-full sm:w-auto"
              >
                {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
              </Button>
            </div>
          </div>
        </div>

        <TabsContent value="weekly" className="space-y-6">
          {dayKeys.map((dayKey) => (
            <DayEditor
              key={dayKey}
              dayKey={dayKey}
              label={dayLabels[dayKey]}
              control={control}
              register={register}
              setValue={setValue}
              errors={errors}
            />
          ))}
        </TabsContent>

        <TabsContent value="overrides" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle>Pengecualian Tanggal</CardTitle>
                <CardDescription>
                  Atur hari libur atau jam khusus untuk tanggal tertentu.
                </CardDescription>
              </div>
              <Button type="button" onClick={openNewOverride}>
                <Plus className="mr-2 h-4 w-4" />
                Tambah Override
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {overridesArray.fields.length === 0 ? (
                <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
                  Belum ada override. Tambahkan pengecualian untuk tanggal tertentu.
                </div>
              ) : (
                <div className="space-y-3">
                  {overridesArray.fields.map((override, index) => (
                    <div
                      key={override.id}
                      className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {override.date}
                          </span>
                          {override.closed ? (
                            <Badge variant="destructive">Closed</Badge>
                          ) : (
                            <Badge variant="secondary">
                              {override.ranges?.length || 0} rentang
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {override.closed
                            ? "Tutup sepanjang hari"
                            : "Jam khusus berlaku"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => openEditOverride(index)}
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => overridesArray.remove(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {errors.overrides &&
                "message" in errors.overrides &&
                errors.overrides.message && (
                  <FieldError errors={[{ message: errors.overrides.message }]} />
                )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rules" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Booking Rules</CardTitle>
              <CardDescription>
                Sesuaikan aturan booking, slot, buffer, dan batas waktu.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FieldGroup>
                <Field>
                  <FieldLabel>Timezone</FieldLabel>
                  <FieldContent>
                    <Input list="timezone-options" {...register("timezone")} />
                    <datalist id="timezone-options">
                      {timezones.map((zone) => (
                        <option key={zone} value={zone} />
                      ))}
                    </datalist>
                    <FieldDescription>
                      Gunakan IANA timezone, contoh: Asia/Jakarta.
                    </FieldDescription>
                    <FieldError errors={[errors.timezone]} />
                  </FieldContent>
                </Field>

                <div className="grid gap-4 lg:grid-cols-2">
                  <Field>
                    <FieldLabel>Durasi Slot (menit)</FieldLabel>
                    <FieldContent>
                      <Select
                        value={String(scheduleWatch?.slotDurationMins ?? "30")}
                        onValueChange={(value) =>
                          setValue(
                            "slotDurationMins",
                            toLiteral(
                              SLOT_DURATIONS,
                              Number(value),
                              defaultSchedule.slotDurationMins
                            ),
                            { shouldDirty: true }
                          )
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih durasi" />
                        </SelectTrigger>
                        <SelectContent>
                          {[15, 30, 45, 60].map((value) => (
                            <SelectItem key={value} value={String(value)}>
                              {value} menit
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FieldError errors={[errors.slotDurationMins]} />
                    </FieldContent>
                  </Field>

                  <Field>
                    <FieldLabel>Buffer antar booking (menit)</FieldLabel>
                    <FieldContent>
                      <Select
                        value={String(scheduleWatch?.bufferMins ?? "10")}
                        onValueChange={(value) =>
                          setValue(
                            "bufferMins",
                            toLiteral(
                              BUFFER_MINS,
                              Number(value),
                              defaultSchedule.bufferMins
                            ),
                            { shouldDirty: true }
                          )
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih buffer" />
                        </SelectTrigger>
                        <SelectContent>
                          {[0, 5, 10, 15, 30].map((value) => (
                            <SelectItem key={value} value={String(value)}>
                              {value} menit
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FieldError errors={[errors.bufferMins]} />
                    </FieldContent>
                  </Field>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <Field>
                    <FieldLabel>Minimal Notice (jam)</FieldLabel>
                    <FieldContent>
                      <Select
                        value={String(scheduleWatch?.minNoticeHours ?? "2")}
                        onValueChange={(value) =>
                          setValue(
                            "minNoticeHours",
                            toLiteral(
                              MIN_NOTICE_HOURS,
                              Number(value),
                              defaultSchedule.minNoticeHours
                            ),
                            { shouldDirty: true }
                          )
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih minimal notice" />
                        </SelectTrigger>
                        <SelectContent>
                          {[1, 2, 6, 12, 24].map((value) => (
                            <SelectItem key={value} value={String(value)}>
                              {value} jam
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FieldError errors={[errors.minNoticeHours]} />
                    </FieldContent>
                  </Field>

                  <Field>
                    <FieldLabel>Maksimal Booking ke Depan (hari)</FieldLabel>
                    <FieldContent>
                      <Select
                        value={String(scheduleWatch?.maxFutureDays ?? "30")}
                        onValueChange={(value) =>
                          setValue(
                            "maxFutureDays",
                            toLiteral(
                              MAX_FUTURE_DAYS,
                              Number(value),
                              defaultSchedule.maxFutureDays
                            ),
                            { shouldDirty: true }
                          )
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih rentang" />
                        </SelectTrigger>
                        <SelectContent>
                          {[7, 14, 30, 60, 90].map((value) => (
                            <SelectItem key={value} value={String(value)}>
                              {value} hari
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FieldError errors={[errors.maxFutureDays]} />
                    </FieldContent>
                  </Field>
                </div>

                <Field>
                  <FieldLabel>Maksimal Booking per Hari (opsional)</FieldLabel>
                  <FieldContent>
                    <Input
                      type="number"
                      min={1}
                      placeholder="Tanpa batas"
                      {...register("maxBookingsPerDay", {
                        setValueAs: (value) =>
                          value === "" ? null : Number(value),
                      })}
                    />
                    <FieldDescription>
                      Kosongkan jika tidak ada batas jumlah booking per hari.
                    </FieldDescription>
                    <FieldError errors={[errors.maxBookingsPerDay]} />
                  </FieldContent>
                </Field>
              </FieldGroup>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Preview Slot 7 Hari</CardTitle>
              <CardDescription>
                Pratinjau slot berdasarkan konfigurasi saat ini.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!previewSchedule && (
                <div className="flex items-center gap-2 rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                  <TriangleAlert className="h-4 w-4" />
                  Perbaiki error validasi untuk melihat preview slot.
                </div>
              )}
              {previewSchedule &&
                previewSlots.map((day) => (
                  <div key={day.date} className="rounded-lg border p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <div className="text-sm text-muted-foreground">
                          {formatDateLabel(day.date, previewSchedule.timezone)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {day.date}
                        </div>
                      </div>
                      <Badge variant={day.slots.length ? "secondary" : "outline"}>
                        {day.slots.length} slot
                      </Badge>
                    </div>
                    <Separator className="my-3" />
                    {day.slots.length === 0 ? (
                      <div className="text-sm text-muted-foreground">
                        Tidak ada slot tersedia.
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {day.slots.map((slot) => (
                          <Badge key={slot.startISO} variant="outline">
                            {formatTimeLabel(slot.startISO, previewSchedule.timezone)} -
                            {" "}
                            {formatTimeLabel(slot.endISO, previewSchedule.timezone)}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <OverrideDialog
        open={overrideDialogOpen}
        index={overrideIndex}
        onOpenChange={(open) => {
          if (!open) {
            closeOverrideDialog()
          }
        }}
        onCancel={closeOverrideDialog}
        onConfirm={confirmOverrideDialog}
        control={control}
        register={register}
        setValue={setValue}
        errors={errors}
      />
    </form>
  )
}

function DayEditor({
  dayKey,
  label,
  control,
  register,
  setValue,
  errors,
}: {
  dayKey: DayKey
  label: string
  control: Control<Schedule>
  register: UseFormRegister<Schedule>
  setValue: UseFormSetValue<Schedule>
  errors: FieldErrors<Schedule>
}) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `weekly.${dayKey}.ranges`,
  })

  const enabled = useWatch({
    control,
    name: `weekly.${dayKey}.enabled`,
  })

  const dayErrors = errors.weekly?.[dayKey]?.ranges
  const dayRangeMessage =
    dayErrors && "message" in dayErrors ? (dayErrors.message as string) : undefined

  const toggleDay = (checked: boolean) => {
    setValue(`weekly.${dayKey}.enabled`, checked, { shouldDirty: true })
    if (checked && fields.length === 0) {
      append(defaultRange, { shouldFocus: false })
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <CardTitle>{label}</CardTitle>
          <CardDescription>
            {enabled ? "Aktif" : "Nonaktif"}
          </CardDescription>
        </div>
        <div className="flex items-center gap-3">
          <FieldTitle>Aktifkan hari</FieldTitle>
          <Switch checked={!!enabled} onCheckedChange={toggleDay} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!enabled && (
          <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            Hari ini tidak menerima booking.
          </div>
        )}

        {enabled && (
          <div className="space-y-3">
            {fields.map((field, index) => {
              const startError = errors.weekly?.[dayKey]?.ranges?.[index]?.start
              const endError = errors.weekly?.[dayKey]?.ranges?.[index]?.end

              return (
                <div
                  key={field.id}
                  className="grid gap-3 rounded-lg border p-4 sm:grid-cols-[1fr_1fr_auto]"
                >
                  <div>
                    <FieldLabel>Mulai</FieldLabel>
                    <Input
                      type="time"
                      step={60}
                      {...register(`weekly.${dayKey}.ranges.${index}.start`)}
                    />
                    <FieldError errors={[startError]} />
                  </div>
                  <div>
                    <FieldLabel>Selesai</FieldLabel>
                    <Input
                      type="time"
                      step={60}
                      {...register(`weekly.${dayKey}.ranges.${index}.end`)}
                    />
                    <FieldError errors={[endError]} />
                  </div>
                  <div className="flex items-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )
            })}

            <Button
              type="button"
              variant="outline"
              onClick={() => append(defaultRange)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Tambah Rentang
            </Button>

            {dayRangeMessage && <FieldError errors={[{ message: dayRangeMessage }]} />}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function OverrideDialog({
  open,
  index,
  onOpenChange,
  onCancel,
  onConfirm,
  control,
  register,
  setValue,
  errors,
}: {
  open: boolean
  index: number | null
  onOpenChange: (open: boolean) => void
  onCancel: () => void
  onConfirm: () => void
  control: Control<Schedule>
  register: UseFormRegister<Schedule>
  setValue: UseFormSetValue<Schedule>
  errors: FieldErrors<Schedule>
}) {
  const safeIndex = index ?? 0

  const rangesArray = useFieldArray({
    control,
    name: `overrides.${safeIndex}.ranges`,
  })

  const closed = useWatch({
    control,
    name: `overrides.${safeIndex}.closed`,
  })

  const dateValue = useWatch({
    control,
    name: `overrides.${safeIndex}.date`,
  })

  const overrideErrors = errors.overrides?.[safeIndex]
  const overrideRangeMessage =
    overrideErrors?.ranges && "message" in overrideErrors.ranges
      ? (overrideErrors.ranges.message as string)
      : undefined

  return (
    <Dialog open={open && index !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Atur Override</DialogTitle>
          <DialogDescription>
            Tentukan apakah tanggal ditutup atau gunakan jam khusus.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <FieldGroup>
            <Field>
              <FieldLabel>Tanggal</FieldLabel>
              <FieldContent>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dateValue && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateValue ? dateValue : "Pilih tanggal"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateValue ? parseDateKey(dateValue) : undefined}
                      onSelect={(date) => {
                        if (!date) {
                          return
                        }
                        setValue(`overrides.${safeIndex}.date`, formatDateKey(date), {
                          shouldDirty: true,
                        })
                      }}
                    />
                  </PopoverContent>
                </Popover>
                <FieldError errors={[overrideErrors?.date]} />
              </FieldContent>
            </Field>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <FieldTitle>Tutup sepanjang hari</FieldTitle>
                <FieldDescription>
                  Nonaktifkan seluruh jam booking pada tanggal ini.
                </FieldDescription>
              </div>
              <Switch
                checked={!!closed}
                onCheckedChange={(checked) =>
                  setValue(`overrides.${safeIndex}.closed`, checked, {
                    shouldDirty: true,
                  })
                }
              />
            </div>
          </FieldGroup>

          {!closed && (
            <div className="space-y-3">
              {rangesArray.fields.map((range, rangeIndex) => {
                const startError =
                  errors.overrides?.[safeIndex]?.ranges?.[rangeIndex]?.start
                const endError =
                  errors.overrides?.[safeIndex]?.ranges?.[rangeIndex]?.end

                return (
                  <div
                    key={range.id}
                    className="grid gap-3 rounded-lg border p-4 sm:grid-cols-[1fr_1fr_auto]"
                  >
                    <div>
                      <FieldLabel>Mulai</FieldLabel>
                      <Input
                        type="time"
                        step={60}
                        {...register(`overrides.${safeIndex}.ranges.${rangeIndex}.start`)}
                      />
                      <FieldError errors={[startError]} />
                    </div>
                    <div>
                      <FieldLabel>Selesai</FieldLabel>
                      <Input
                        type="time"
                        step={60}
                        {...register(`overrides.${safeIndex}.ranges.${rangeIndex}.end`)}
                      />
                      <FieldError errors={[endError]} />
                    </div>
                    <div className="flex items-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => rangesArray.remove(rangeIndex)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )
              })}

              <Button
                type="button"
                variant="outline"
                onClick={() => rangesArray.append(defaultRange)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Tambah Rentang
              </Button>

              {overrideRangeMessage && (
                <FieldError errors={[{ message: overrideRangeMessage }]} />
              )}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={onCancel}>
            Batal
          </Button>
          <Button type="button" onClick={onConfirm}>
            Simpan Override
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

