"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Pencil, Plus } from "lucide-react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import { locationSchema, type LocationRecord } from "@/lib/locations/schema"
import type { z } from "zod"
import { useLocation } from "@/components/locations/location-context"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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

const locationFormSchema = locationSchema.extend({
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
      name: "",
      address: "",
      city: "",
      googleMapsUrl: "",
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
      toast.error("Gagal memuat lokasi")
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
        toast.error(payload?.message || "Gagal menyimpan lokasi")
        return
      }
      toast.success(editing ? "Lokasi diperbarui" : "Lokasi ditambahkan")
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

  const toggleActive = async (location: LocationRecord) => {
    try {
      const res = await fetch(`/api/locations/${location.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !location.isActive }),
      })
      if (!res.ok) {
        const payload = await res.json()
        toast.error(payload?.message || "Gagal memperbarui status")
        return
      }
      toast.success("Status lokasi diperbarui")
      loadLocations()
      refresh()
    } catch (error) {
      console.error(error)
      toast.error("Server error")
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 lg:p-6">
      <div className="flex flex-col gap-3 rounded-xl border bg-background p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold">Locations</h1>
          <p className="text-sm text-muted-foreground">
            Kelola lokasi layanan dan status aktifnya.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(null)
            form.reset({
              name: "",
              address: "",
              city: "",
              googleMapsUrl: "",
              notes: "",
              isActive: true,
            })
            setDialogOpen(true)
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Location
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
            Belum ada lokasi. Tambahkan lokasi untuk mulai mengatur jadwal.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
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
                  <TableCell className="font-medium">{location.name}</TableCell>
                  <TableCell>{location.city ?? "-"}</TableCell>
                  <TableCell className="max-w-[260px] truncate">
                    {location.address ?? "-"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={location.isActive ? "secondary" : "outline"}>
                      {location.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(location.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditing(location)
                          form.reset({
                            name: location.name,
                            address: location.address ?? "",
                            city: location.city ?? "",
                            googleMapsUrl: location.googleMapsUrl ?? "",
                            notes: location.notes ?? "",
                            isActive: location.isActive,
                          })
                          setDialogOpen(true)
                        }}
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleActive(location)}
                      >
                        {location.isActive ? "Disable" : "Enable"}
                      </Button>
                    </div>
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
            <DialogTitle>{editing ? "Edit Location" : "Add Location"}</DialogTitle>
            <DialogDescription>Lengkapi detail lokasi layanan.</DialogDescription>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-4">
            <FieldGroup>
              <Field>
                <FieldLabel>Nama Lokasi</FieldLabel>
                <FieldContent>
                  <Input {...form.register("name")} placeholder="Spa Harmoni" />
                  <FieldError errors={[form.formState.errors.name]} />
                </FieldContent>
              </Field>
              <Field>
                <FieldLabel>Alamat</FieldLabel>
                <FieldContent>
                  <Input {...form.register("address")} placeholder="Jl. Sudirman No. 45" />
                </FieldContent>
              </Field>
              <div className="grid gap-3 lg:grid-cols-2">
                <Field>
                  <FieldLabel>Kota</FieldLabel>
                  <FieldContent>
                    <Input {...form.register("city")} placeholder="Jakarta" />
                  </FieldContent>
                </Field>
                <Field>
                  <FieldLabel>Google Maps URL</FieldLabel>
                  <FieldContent>
                    <Input {...form.register("googleMapsUrl")} placeholder="https://maps.app/..." />
                    <FieldError errors={[form.formState.errors.googleMapsUrl]} />
                  </FieldContent>
                </Field>
              </div>
              <Field>
                <FieldLabel>Catatan</FieldLabel>
                <FieldContent>
                  <Input {...form.register("notes")} placeholder="Catatan internal" />
                </FieldContent>
              </Field>
            </FieldGroup>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Menyimpan..." : "Simpan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
