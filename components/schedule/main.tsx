"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Plus, Trash2, TriangleAlert } from "lucide-react"
import {
  type Control,
  type FieldErrors,
  type Resolver,
  type UseFormRegister,
  useFieldArray,
  useForm,
  useWatch,
} from "react-hook-form"
import { toast } from "sonner"

import {
  BUFFER_MINS,
  MAX_FUTURE_DAYS,
  MIN_NOTICE_HOURS,
  SLOT_DURATIONS,
  scheduleSchema,
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
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldTitle,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { useLocation } from "@/components/locations/location-context"

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

const emptyWeekly = (): Schedule["weekly"] => ({
  mon: { enabled: false, ranges: [] },
  tue: { enabled: false, ranges: [] },
  wed: { enabled: false, ranges: [] },
  thu: { enabled: false, ranges: [] },
  fri: { enabled: false, ranges: [] },
  sat: { enabled: false, ranges: [] },
  sun: { enabled: false, ranges: [] },
})

const emptySchedule: Schedule = {
  timezone: "Asia/Jakarta",
  weekly: emptyWeekly(),
  overrides: [],
  slotDurationMins: 30,
  bufferMins: 10,
  minNoticeHours: 2,
  maxFutureDays: 30,
  maxBookingsPerDay: null,
}

export function ScheduleMain() {
  const { selectedLocation, selectedLocationId, locations } = useLocation()
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSaving, setIsSaving] = React.useState(false)
  const [lastSavedAt, setLastSavedAt] = React.useState<string | null>(null)
  const [savedSchedule, setSavedSchedule] = React.useState<Schedule | null>(null)
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>()

  const form = useForm<Schedule>({
    resolver: zodResolver(scheduleSchema) as Resolver<Schedule>,
    defaultValues: emptySchedule,
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
          const normalized = { ...data, weekly: emptyWeekly() }
          reset(normalized)
          setSavedSchedule(normalized)
          setLastSavedAt(new Date().toISOString())
        }
      } catch (error) {
        console.error(error)
        toast.error("Failed to load schedule")
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
      toast.error("Set an active position first")
      return
    }
    setIsSaving(true)
    try {
      const payload: Schedule = {
        ...values,
        weekly: emptyWeekly(),
      }
      const res = await fetch(`/api/schedule?locationId=${selectedLocationId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })

      if (!res.ok) {
        const payload = await res.json()
        toast.error(payload?.message || "Failed to save schedule")
        return
      }

      const data = (await res.json()) as Schedule
      const normalized = { ...data, weekly: emptyWeekly() }
      reset(normalized)
      setSavedSchedule(normalized)
      setLastSavedAt(new Date().toISOString())
      toast.success("Schedule saved")
    } catch (error) {
      console.error(error)
      toast.error("Server error")
    } finally {
      setIsSaving(false)
    }
  })

  const handleReset = () => {
    reset(savedSchedule ?? emptySchedule)
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

  const selectedDateKey = selectedDate ? formatDateKey(selectedDate) : ""
  const selectedOverrideIndex = overridesArray.fields.findIndex(
    (item) => item.date === selectedDateKey
  )
  const selectedOverride =
    selectedOverrideIndex >= 0 ? overridesArray.fields[selectedOverrideIndex] : null

  const overrideDates = overridesArray.fields.map((item) => parseDateKey(item.date))

  const addSelectedDate = () => {
    if (!selectedDateKey) return
    if (selectedOverrideIndex !== -1) return
    overridesArray.append({
      date: selectedDateKey,
      closed: false,
      ranges: [defaultRange],
    })
  }

  const removeOverride = (index: number) => {
    overridesArray.remove(index)
  }

  const updateOverrideClosed = (checked: boolean) => {
    if (selectedOverrideIndex < 0) return
    setValue(`overrides.${selectedOverrideIndex}.closed`, checked, {
      shouldDirty: true,
    })
    if (checked) {
      setValue(`overrides.${selectedOverrideIndex}.ranges`, [], { shouldDirty: true })
    } else if (
      (form.getValues(`overrides.${selectedOverrideIndex}.ranges`) ?? []).length === 0
    ) {
      setValue(
        `overrides.${selectedOverrideIndex}.ranges`,
        [defaultRange],
        { shouldDirty: true }
      )
    }
  }

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
        No positions yet. Add a position before managing the schedule.
      </div>
    )
  }

  if (!selectedLocationId) {
    return (
      <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
        Set an active position to manage the schedule.
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="sticky top-0 z-10 flex flex-col gap-3 rounded-xl border bg-background/95 px-3 py-3 shadow-sm backdrop-blur sm:px-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
            Schedule
          </p>
          <h1 className="text-xl font-semibold">Date-based availability</h1>
        </div>
        <div className="flex w-full flex-col gap-2 md:items-end lg:w-auto lg:flex-row lg:items-center lg:justify-end">
          <div className="text-xs text-muted-foreground md:text-sm md:text-right lg:whitespace-nowrap">
            Position: {selectedLocation?.name ?? "-"}
          </div>
          <div className="text-xs text-muted-foreground md:text-sm md:text-right lg:whitespace-nowrap">
            {lastSavedAt
              ? `Last saved: ${new Date(lastSavedAt).toLocaleString("id-ID")}`
              : "Never saved"}
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
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Pick a date</CardTitle>
              <CardDescription>
                Set opening hours for specific dates only.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
              <div className="space-y-4">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  modifiers={{ hasOverride: overrideDates }}
                  modifiersClassNames={{ hasOverride: "bg-primary/15 text-primary" }}
                  className="rounded-lg border"
                />
                <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                  Select a date to add or edit hours.
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Selected date</p>
                  <div className="flex items-center justify-between rounded-lg border px-4 py-3">
                    <div>
                      <div className="text-sm font-semibold">
                        {selectedDateKey || "No date selected"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {selectedDateKey
                          ? formatDateLabel(selectedDateKey, scheduleWatch?.timezone ?? "Asia/Jakarta")
                          : "Pick a date on the calendar"}
                      </div>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      onClick={addSelectedDate}
                      disabled={!selectedDateKey || selectedOverrideIndex !== -1}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Date
                    </Button>
                  </div>
                </div>

                {selectedOverride ? (
                  <div className="space-y-4 rounded-lg border p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Date settings</p>
                        <p className="text-xs text-muted-foreground">
                          {selectedOverride.date}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeOverride(selectedOverrideIndex)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="flex items-center justify-between rounded-lg border px-4 py-3">
                      <div>
                        <FieldTitle>Closed all day</FieldTitle>
                        <FieldDescription>
                          Disable all booking hours on this date.
                        </FieldDescription>
                      </div>
                      <Switch
                        checked={!!form.getValues(`overrides.${selectedOverrideIndex}.closed`)}
                        onCheckedChange={updateOverrideClosed}
                      />
                    </div>

                    {!form.getValues(`overrides.${selectedOverrideIndex}.closed`) && (
                      <OverrideRanges
                        control={control}
                        register={register}
                        errors={errors}
                        index={selectedOverrideIndex}
                      />
                    )}
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                    No hours set for this date yet.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Saved dates</CardTitle>
              <CardDescription>Manage all date-specific hours.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {overridesArray.fields.length === 0 ? (
                <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
                  No dates configured yet.
                </div>
              ) : (
                overridesArray.fields.map((override, index) => (
                  <div
                    key={override.id}
                    className={cn(
                      "flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between",
                      override.date === selectedDateKey && "border-primary/60 bg-muted/40"
                    )}
                  >
                    <div>
                      <div className="text-sm font-medium">{override.date}</div>
                      <div className="text-xs text-muted-foreground">
                        {override.closed ? "Closed" : `${override.ranges?.length || 0} ranges`}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedDate(parseDateKey(override.date))}
                      >
                        Edit
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeOverride(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
              {errors.overrides &&
                "message" in errors.overrides &&
                errors.overrides.message && (
                  <FieldError errors={[{ message: errors.overrides.message }]} />
                )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Booking rules</CardTitle>
              <CardDescription>
                Set slot, buffer, and booking window limits.
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
                      Use an IANA timezone, e.g. Asia/Jakarta.
                    </FieldDescription>
                    <FieldError errors={[errors.timezone]} />
                  </FieldContent>
                </Field>

                <div className="grid gap-4 lg:grid-cols-2">
                  <Field>
                    <FieldLabel>Slot Duration (mins)</FieldLabel>
                    <FieldContent>
                      <Select
                        value={String(scheduleWatch?.slotDurationMins ?? "30")}
                        onValueChange={(value) =>
                          setValue(
                            "slotDurationMins",
                            toLiteral(SLOT_DURATIONS, Number(value), 30),
                            { shouldDirty: true }
                          )
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select duration" />
                        </SelectTrigger>
                        <SelectContent>
                          {[15, 30, 45, 60].map((value) => (
                            <SelectItem key={value} value={String(value)}>
                              {value} mins
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FieldError errors={[errors.slotDurationMins]} />
                    </FieldContent>
                  </Field>

                  <Field>
                    <FieldLabel>Buffer Between Bookings (mins)</FieldLabel>
                    <FieldContent>
                      <Select
                        value={String(scheduleWatch?.bufferMins ?? "10")}
                        onValueChange={(value) =>
                          setValue(
                            "bufferMins",
                            toLiteral(BUFFER_MINS, Number(value), 10),
                            { shouldDirty: true }
                          )
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select buffer" />
                        </SelectTrigger>
                        <SelectContent>
                          {[0, 5, 10, 15, 30].map((value) => (
                            <SelectItem key={value} value={String(value)}>
                              {value} mins
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
                    <FieldLabel>Minimum Notice (hours)</FieldLabel>
                    <FieldContent>
                      <Select
                        value={String(scheduleWatch?.minNoticeHours ?? "2")}
                        onValueChange={(value) =>
                          setValue(
                            "minNoticeHours",
                            toLiteral(MIN_NOTICE_HOURS, Number(value), 2),
                            { shouldDirty: true }
                          )
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select minimum notice" />
                        </SelectTrigger>
                        <SelectContent>
                          {[1, 2, 6, 12, 24].map((value) => (
                            <SelectItem key={value} value={String(value)}>
                              {value} hours
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FieldError errors={[errors.minNoticeHours]} />
                    </FieldContent>
                  </Field>

                  <Field>
                    <FieldLabel>Max Future Booking (days)</FieldLabel>
                    <FieldContent>
                      <Select
                        value={String(scheduleWatch?.maxFutureDays ?? "30")}
                        onValueChange={(value) =>
                          setValue(
                            "maxFutureDays",
                            toLiteral(MAX_FUTURE_DAYS, Number(value), 30),
                            { shouldDirty: true }
                          )
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select range" />
                        </SelectTrigger>
                        <SelectContent>
                          {[7, 14, 30, 60, 90].map((value) => (
                            <SelectItem key={value} value={String(value)}>
                              {value} days
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FieldError errors={[errors.maxFutureDays]} />
                    </FieldContent>
                  </Field>
                </div>

                <Field>
                  <FieldLabel>Max Bookings per Day (optional)</FieldLabel>
                  <FieldContent>
                    <Input
                      type="number"
                      min={1}
                      placeholder="No limit"
                      {...register("maxBookingsPerDay", {
                        setValueAs: (value) =>
                          value === "" ? null : Number(value),
                      })}
                    />
                    <FieldDescription>
                      Leave empty if there is no daily booking limit.
                    </FieldDescription>
                    <FieldError errors={[errors.maxBookingsPerDay]} />
                  </FieldContent>
                </Field>
              </FieldGroup>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>7-Day Slot Preview</CardTitle>
              <CardDescription>
                Preview slots based on the current configuration.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!previewSchedule && (
                <div className="flex items-center gap-2 rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                  <TriangleAlert className="h-4 w-4" />
                  Fix validation errors to see slot previews.
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
                        No slots available.
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
        </div>
      </div>
    </form>
  )
}

function OverrideRanges({
  control,
  register,
  errors,
  index,
}: {
  control: Control<Schedule>
  register: UseFormRegister<Schedule>
  errors: FieldErrors<Schedule>
  index: number
}) {
  const rangesArray = useFieldArray({
    control,
    name: `overrides.${index}.ranges`,
  })

  const rangeErrors = errors.overrides?.[index]?.ranges
  const rangeMessage =
    rangeErrors && "message" in rangeErrors ? (rangeErrors.message as string) : undefined

  return (
    <div className="space-y-3">
      {rangesArray.fields.map((range, rangeIndex) => {
        const startError = errors.overrides?.[index]?.ranges?.[rangeIndex]?.start
        const endError = errors.overrides?.[index]?.ranges?.[rangeIndex]?.end

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
                {...register(`overrides.${index}.ranges.${rangeIndex}.start`)}
              />
              <FieldError errors={[startError]} />
            </div>
            <div>
              <FieldLabel>Selesai</FieldLabel>
              <Input
                type="time"
                step={60}
                {...register(`overrides.${index}.ranges.${rangeIndex}.end`)}
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
        Add Range
      </Button>

      {rangeMessage && <FieldError errors={[{ message: rangeMessage }]} />}
    </div>
  )
}
