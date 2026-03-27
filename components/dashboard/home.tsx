"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  CalendarCheck2,
  CalendarClock,
  CalendarPlus,
  CircleUserRound,
  FileClock,
  XCircle,
} from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useLocation } from "@/components/locations/location-context"

type DashboardPayload = {
  summary: {
    totalPatients: number
    upcomingBookings: number
    completedBookings: number
    cancelledBookings: number
  }
  recentBookings: {
    id: string
    startISO: string
    status: "scheduled" | "completed" | "cancelled" | "no_show"
    paymentStatus: "pending" | "paid" | "failed" | "expired" | "refunded"
    serviceName: string
    patientName: string
    locationName: string
  }[]
  recentNotes: {
    id: string
    patientName: string
    createdAt: string
    title: string
  }[]
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

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value))

export function DashboardHome() {
  const router = useRouter()
  const { locations } = useLocation()
  const [data, setData] = React.useState<DashboardPayload | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [dashboardLocationId, setDashboardLocationId] = React.useState<string>("all")

  const activeLocations = React.useMemo(
    () => locations.filter((location) => location.isActive !== false),
    [locations]
  )
  const selectedDashboardLocation =
    dashboardLocationId !== "all"
      ? activeLocations.find((location) => location.id === dashboardLocationId) ?? null
      : null

  const loadData = React.useCallback(async () => {
    setLoading(true)
    try {
      const query =
        dashboardLocationId === "all"
          ? "locationId=all"
          : `locationId=${dashboardLocationId}`
      const res = await fetch(`/api/dashboard${query ? `?${query}` : ""}`)
      if (res.status === 401) {
        router.replace("/login")
        return
      }
      if (!res.ok) {
        throw new Error("Failed to load dashboard")
      }
      const payload = (await res.json()) as DashboardPayload
      setData(payload)
    } catch (error) {
      console.error(error)
      toast.error("Failed to load dashboard")
    } finally {
      setLoading(false)
    }
  }, [dashboardLocationId, router])

  React.useEffect(() => {
    loadData()
  }, [loadData])

  if (!loading && locations.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
        <h1 className="text-xl font-semibold">No positions yet</h1>
        <p className="text-sm text-muted-foreground">
          Add a position before managing schedules and bookings.
        </p>
        <Button asChild>
          <Link href="/locations">Manage Positions</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-5 xl:p-6">
      <div className="rounded-2xl border bg-gradient-to-br from-muted/40 via-background to-muted/10 p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="w-full lg:flex-1">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-muted-foreground">
              Dashboard
            </p>
            <h1 className="mt-1 text-2xl font-semibold">Daily overview</h1>
            <p className="text-sm text-muted-foreground">
              {dashboardLocationId === "all"
                ? "Summary for all positions"
                : selectedDashboardLocation
                  ? `Active position: ${
                      selectedDashboardLocation.city ??
                      selectedDashboardLocation.name ??
                      "-"
                    }`
                  : "Select a position to see the summary"}
            </p>
          </div>
          <div className="w-full lg:w-[260px] lg:shrink-0">
            <Select
              value={dashboardLocationId}
              onValueChange={(value) => setDashboardLocationId(value)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Select position" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All positions</SelectItem>
                {activeLocations.map((location) => (
                  <SelectItem key={location.id} value={location.id}>
                    {location.city ?? location.name ?? "Position"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
        {loading || !data ? (
          Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-28 w-full" />
          ))
        ) : (
          <>
            <SummaryCard
              title="Total Patients"
              value={data.summary.totalPatients}
              icon={<CircleUserRound className="h-5 w-5" />}
            />
            <SummaryCard
              title="Upcoming Bookings (7 hari)"
              value={data.summary.upcomingBookings}
              icon={<CalendarClock className="h-5 w-5" />}
            />
            <SummaryCard
              title="Completed (30 hari)"
              value={data.summary.completedBookings}
              icon={<CalendarCheck2 className="h-5 w-5" />}
            />
            <SummaryCard
              title="Cancelled / No-show (30 hari)"
              value={data.summary.cancelledBookings}
              icon={<XCircle className="h-5 w-5" />}
            />
          </>
        )}
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Shortcut ke tugas admin yang sering digunakan.</CardDescription>
          </div>
          <div className="flex flex-col gap-2 md:flex-row">
            <Button asChild variant="outline">
              <Link href="/bookings">
                <CalendarPlus className="mr-2 h-4 w-4" />
                Create Booking
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/schedule">
                <FileClock className="mr-2 h-4 w-4" />
                Edit Schedule
              </Link>
            </Button>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-4 2xl:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Recent Bookings</CardTitle>
            <CardDescription>Booking terbaru beserta statusnya.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading || !data ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Skeleton key={index} className="h-10 w-full" />
                ))}
              </div>
            ) : data.recentBookings.length === 0 ? (
              <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
                No bookings yet.
              </div>
            ) : (
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Patient</TableHead>
                      <TableHead>Service</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Location</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.recentBookings.map((booking) => (
                      <TableRow key={booking.id}>
                        <TableCell className="font-medium">{booking.patientName}</TableCell>
                        <TableCell>{booking.serviceName}</TableCell>
                        <TableCell>{formatDateTime(booking.startISO)}</TableCell>
                        <TableCell>
                          <Badge variant={statusVariant[booking.status]}>
                            {statusLabel[booking.status]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={paymentVariant[booking.paymentStatus]}>
                            {paymentLabel[booking.paymentStatus]}
                          </Badge>
                        </TableCell>
                        <TableCell>{booking.locationName}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Latest Notes</CardTitle>
            <CardDescription>Latest notes from patients.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading || !data ? (
              Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-10 w-full" />
              ))
            ) : data.recentNotes.length === 0 ? (
              <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
                No notes yet.
              </div>
            ) : (
              data.recentNotes.map((note) => (
                <div key={note.id} className="rounded-lg border p-3">
                  <div className="text-sm font-medium">{note.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {note.patientName} - {formatDateTime(note.createdAt)}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function SummaryCard({
  title,
  value,
  icon,
}: {
  title: string
  value: number
  icon: React.ReactNode
}) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="space-y-3">
        <div className="flex items-center justify-between text-muted-foreground">
          <CardDescription>{title}</CardDescription>
          <div className="rounded-full border bg-background p-2 text-foreground">
            {icon}
          </div>
        </div>
        <CardTitle className="text-2xl">{value}</CardTitle>
      </CardHeader>
    </Card>
  )
}
