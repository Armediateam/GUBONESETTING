"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  IconChevronLeft,
  IconChevronRight,
  IconCalendar,
} from "@tabler/icons-react"

type Step = 0 | 1 | 2 | 3

const SERVICES = [
  "General Checkup",
  "Dental Care",
  "Skin Treatment",
  "Physiotherapy",
]

const TIME_SLOTS = [
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
]

const PAYMENT_METHODS = [
  "Cash",
  "Non Cash",
]

export function AddBookingDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const [step, setStep] = React.useState<Step>(0)
  const [therapists, setTherapists] = React.useState<string[]>([])

  const [form, setForm] = React.useState({
    customer: "",
    phone: "",
    address: "",
    service: "",
    therapist: "",
    datetime: "",
    paymentMethod: "",
    paid: false,
  })

  const [date, setDate] = React.useState<Date | undefined>()
  const [time, setTime] = React.useState("")

  // gabungkan date + time
  React.useEffect(() => {
    if (!date || !time) return

    const yyyy = date.getFullYear()
    const mm = String(date.getMonth() + 1).padStart(2, "0")
    const dd = String(date.getDate()).padStart(2, "0")

    setForm((f) => ({
      ...f,
      datetime: `${yyyy}-${mm}-${dd}T${time}`,
    }))
  }, [date, time])

  React.useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/therapists")
        if (!res.ok) return
        const payload = await res.json()
        const names = (payload.items ?? [])
          .filter((item: { isActive: boolean }) => item.isActive)
          .map((item: { name: string }) => item.name)
        setTherapists(names)
      } catch (error) {
        console.error(error)
      }
    }
    load()
  }, [])

  function next() {
    setStep((s) => Math.min(s + 1, 3) as Step)
  }

  function prev() {
    setStep((s) => Math.max(s - 1, 0) as Step)
  }

  function submit() {
    console.log("NEW BOOKING:", form)
    onOpenChange(false)
    setStep(0)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg w-[calc(100%-1rem)] sm:w-full">
        <DialogHeader>
          <DialogTitle>Create Booking</DialogTitle>
        </DialogHeader>

        {/* ================= STEP 0 ================= */}
        {step === 0 && (
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={form.customer}
                onChange={(e) =>
                  setForm({ ...form, customer: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                value={form.phone}
                onChange={(e) =>
                  setForm({ ...form, phone: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Address</Label>
              <Input
                placeholder="Street, City, etc"
                value={form.address}
                onChange={(e) =>
                  setForm({ ...form, address: e.target.value })
                }
              />
            </div>
          </div>
        )}

        {/* ================= STEP 1 ================= */}
        {step === 1 && (
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Service</Label>
              <Select
                value={form.service}
                onValueChange={(v) =>
                  setForm({ ...form, service: v })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select service" />
                </SelectTrigger>
                <SelectContent>
                  {SERVICES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Therapist</Label>
              <Select
                value={form.therapist}
                onValueChange={(v) =>
                  setForm({ ...form, therapist: v })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select therapist" />
                </SelectTrigger>
                <SelectContent>
                  {therapists.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between font-normal"
                    >
                      {date
                        ? date.toLocaleDateString()
                        : "Pick a date"}
                      <IconCalendar className="h-4 w-4 opacity-60" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0 w-full" align="start">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Time</Label>
                <Select value={time} onValueChange={setTime}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_SLOTS.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        {/* ================= STEP 2 ================= */}
        {step === 2 && (
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Payment Method</Label>
              <Select
                value={form.paymentMethod}
                onValueChange={(v) =>
                  setForm({ ...form, paymentMethod: v })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="paid"
                checked={form.paid}
                onCheckedChange={(v) =>
                  setForm({ ...form, paid: Boolean(v) })
                }
              />
              <Label htmlFor="paid">Already Paid</Label>
            </div>
          </div>
        )}

        {/* ================= STEP 3 ================= */}
        {step === 3 && (
          <div className="space-y-2 text-sm mt-4">
            <h3 className="font-semibold">Review</h3>
            <div>Customer: <b>{form.customer}</b></div>
            <div>Phone: <b>{form.phone}</b></div>
            <div>Address: <b>{form.address}</b></div>
            <div>Service: <b>{form.service}</b></div>
            <div>Therapist: <b>{form.therapist}</b></div>
            <div>Date & Time: <b>{form.datetime}</b></div>
            <div>Payment: <b>{form.paymentMethod}</b></div>
            <div>Status: {form.paid ? "Paid" : "Unpaid"}</div>
          </div>
        )}

        {/* ================= FOOTER ================= */}
        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={prev} disabled={step === 0}>
            <IconChevronLeft className="mr-1 h-4 w-4" />
            Back
          </Button>

          {step < 3 ? (
            <Button onClick={next}>
              Next
              <IconChevronRight className="ml-1 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={submit}>Create Booking</Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
