"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { CheckCircle2, MoreVertical, Pencil, Plus, Power, Trash2 } from "lucide-react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import { locationSchema, type LocationRecord } from "@/lib/locations/schema"
import type { z } from "zod"
import { useLocation } from "@/components/locations/location-context"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value))

const locationFormSchema = locationSchema.pick({
  address: true,
  city: true,
  notes: true,
}).extend({
  isActive: locationSchema.shape.isActive.unwrap(),
})

export function LocationsPage() {
  const [locations, setLocations] = React.useState<LocationRecord[]>([])
  const [loading, setLoading] = React.useState(true)
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<LocationRecord | null>(null)
  const { refresh } = useLocation()

  const form = useForm<z.infer<typeof locationFormSchema>>({
    resolver: zodResolver(locationFormSchema),
    defaultValues: {
      address: "",
      city: "",
      notes: "",
      isActive: true,
    },
  })

  const loadLocations = React.useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/locations")
      if (!res.ok) {
        throw new Error("Failed to load locations")
      }
      const payload = await res.json()
      setLocations(payload.items ?? [])
    } catch (error) {
      console.error(error)
      toast.error("Failed to load positions")
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    loadLocations()
  }, [loadLocations])

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const res = await fetch(editing ? `/api/locations/${editing.id}` : "/api/locations", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      })
      if (!res.ok) {
        const payload = await res.json()
        toast.error(payload?.message || "Failed to save position")
        return
      }
      toast.success(editing ? "Position updated" : "Position added")
      setDialogOpen(false)
      setEditing(null)
      form.reset()
      loadLocations()
      refresh()
    } catch (error) {
      console.error(error)
      toast.error("Server error")
    }
  })

  const toggleActive = async (location: LocationRecord, nextActive: boolean) => {
    try {
      const res = await fetch(`/api/locations/${location.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: nextActive }),
      })
      if (!res.ok) {
        const payload = await res.json()
        toast.error(payload?.message || "Failed to update active position")
        return
      }
      toast.success("Active position updated")
      loadLocations()
      refresh()
    } catch (error) {
      console.error(error)
      toast.error("Server error")
    }
  }

  const handleDelete = async (location: LocationRecord) => {
    const confirmed = window.confirm(`Hapus position "${location.name ?? "-"}"?`)
    if (!confirmed) return
    try {
      const res = await fetch(`/api/locations/${location.id}`, { method: "DELETE" })
      const payload = await res.json()
      if (!res.ok) {
        toast.error(payload?.message || "Failed to delete position")
        return
      }
      toast.success("Position deleted")
      loadLocations()
      refresh()
    } catch (error) {
      console.error(error)
      toast.error("Server error")
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-5 xl:p-6">
      <div className="flex flex-col gap-3 rounded-xl border bg-background p-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h1 className="text-xl font-semibold">Business Position</h1>
          <p className="text-sm text-muted-foreground">
            Set the current business position so clients know where to book.
            Active positions cannot exceed active therapists.
          </p>
        </div>
        <Button
          className="w-full sm:w-auto"
          onClick={() => {
            setEditing(null)
            form.reset({
              address: "",
              city: "",
              notes: "",
              isActive: true,
            })
            setDialogOpen(true)
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Position
        </Button>
      </div>

      <div className="rounded-xl border">
        {loading ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-10 w-full" />
            ))}
          </div>
        ) : locations.length === 0 ? (
          <div className="p-6 text-sm text-muted-foreground">
            No positions yet. Add a position to start managing schedules.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>City</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {locations.map((location) => (
                <TableRow key={location.id}>
                  <TableCell>{location.city ?? "-"}</TableCell>
                  <TableCell className="max-w-[260px] truncate">
                    {location.address ?? "-"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={location.isActive ? "secondary" : "outline"}>
                      {location.isActive ? "Active (Current Position)" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(location.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label="Position actions">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItem
                          onClick={() => {
                            setEditing(location)
                            form.reset({
                              address: location.address ?? "",
                              city: location.city ?? "",
                              notes: location.notes ?? "",
                              isActive: location.isActive,
                            })
                            setDialogOpen(true)
                          }}
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        {!location.isActive && (
                          <DropdownMenuItem onClick={() => toggleActive(location, true)}>
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Set Active
                          </DropdownMenuItem>
                        )}
                        {location.isActive && (
                          <DropdownMenuItem onClick={() => toggleActive(location, false)}>
                            <Power className="mr-2 h-4 w-4" />
                            Deactivate
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => handleDelete(location)}>
                          <Trash2 className="mr-2 h-4 w-4" />
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Position" : "Add Position"}</DialogTitle>
            <DialogDescription>Provide details for the business position.</DialogDescription>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-4">
            <FieldGroup>
              <Field>
              <FieldLabel>Address</FieldLabel>
                <FieldContent>
                  <Input {...form.register("address")} placeholder="123 Main St" />
                </FieldContent>
              </Field>
              <div className="grid gap-3 lg:grid-cols-2">
                <Field>
                  <FieldLabel>City</FieldLabel>
                  <FieldContent>
                  <Input {...form.register("city")} placeholder="Jakarta" />
                  </FieldContent>
                </Field>
              </div>
              <Field>
                <FieldLabel>Notes</FieldLabel>
                <FieldContent>
                  <Input {...form.register("notes")} placeholder="Internal notes" />
                </FieldContent>
              </Field>
            </FieldGroup>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
