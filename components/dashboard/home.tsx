"use client"

import * as React from "react"
import Link from "next/link"
import { CalendarPlus, FileClock, UserPlus } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
  const { locations, selectedLocation, selectedLocationId } = useLocation()
  const [data, setData] = React.useState<DashboardPayload | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [scope, setScope] = React.useState<"selected" | "all">("selected")

  const loadData = React.useCallback(async () => {
    setLoading(true)
    try {
      const query =
        scope === "all"
          ? "locationId=all"
          : selectedLocationId
            ? `locationId=${selectedLocationId}`
            : ""
      const res = await fetch(`/api/dashboard${query ? `?${query}` : ""}`)
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
  }, [scope, selectedLocationId])

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
          <Link href="/dashboard/locations">Manage Positions</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 lg:p-6">
      <div className="flex flex-col gap-3 rounded-xl border bg-background p-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-semibold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            {scope === "all"
              ? "Summary for all positions"
              : selectedLocation
                ? `Active position: ${selectedLocation.name}`
                : "Select a position to see the summary"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={scope === "selected" ? "default" : "outline"}
            size="sm"
            onClick={() => setScope("selected")}
            disabled={!selectedLocationId}
          >
            Selected Position
          </Button>
          <Button
            variant={scope === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setScope("all")}
          >
            All Positions
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {loading || !data ? (
          Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-28 w-full" />
          ))
        ) : (
          <>
            <SummaryCard title="Total Patients" value={data.summary.totalPatients} />
            <SummaryCard
              title="Upcoming Bookings (7 hari)"
              value={data.summary.upcomingBookings}
            />
            <SummaryCard
              title="Completed (30 hari)"
              value={data.summary.completedBookings}
            />
            <SummaryCard
              title="Cancelled / No-show (30 hari)"
              value={data.summary.cancelledBookings}
            />
          </>
        )}
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Shortcut ke tugas admin yang sering digunakan.</CardDescription>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button asChild>
              <Link href="/dashboard/patients">
                <UserPlus className="mr-2 h-4 w-4" />
                Add Patient
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/dashboard/bookings">
                <CalendarPlus className="mr-2 h-4 w-4" />
                Create Booking
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/dashboard/schedule">
                <FileClock className="mr-2 h-4 w-4" />
                Edit Schedule
              </Link>
            </Button>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
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
                    {note.patientName} · {formatDateTime(note.createdAt)}
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

function SummaryCard({ title, value }: { title: string; value: number }) {
  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardDescription>{title}</CardDescription>
        <CardTitle>{value}</CardTitle>
      </CardHeader>
    </Card>
  )
}
