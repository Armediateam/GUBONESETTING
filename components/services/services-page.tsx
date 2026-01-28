"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { MoreVertical, Pencil, Plus, Trash2 } from "lucide-react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import type { ServiceRecord } from "@/lib/services/schema"
import { serviceFormSchema, type ServiceFormValues } from "@/lib/services/form"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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

const toDurationValue = (value: string) => {
  if (!value) return undefined
  const parsed = Number(value)
  return Number.isNaN(parsed) ? undefined : parsed
}

export function ServicesPage() {
  const [services, setServices] = React.useState<ServiceRecord[]>([])
  const [loading, setLoading] = React.useState(true)
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<ServiceRecord | null>(null)

  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues: {
      name: "",
      durationMins: undefined,
      isActive: true,
    },
  })

  const loadServices = React.useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/services")
      if (!res.ok) {
        throw new Error("Failed to load services")
      }
      const payload = await res.json()
      setServices(payload.items ?? [])
    } catch (error) {
      console.error(error)
      toast.error("Failed to load services")
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    loadServices()
  }, [loadServices])

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const res = await fetch(editing ? `/api/services/${editing.id}` : "/api/services", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          durationMins: toDurationValue(String(values.durationMins ?? "")),
        }),
      })
      if (!res.ok) {
        const payload = await res.json()
        toast.error(payload?.message || "Failed to save service")
        return
      }
      toast.success(editing ? "Service updated" : "Service added")
      setDialogOpen(false)
      setEditing(null)
      form.reset()
      loadServices()
    } catch (error) {
      console.error(error)
      toast.error("Server error")
    }
  })

  const handleDelete = async (service: ServiceRecord) => {
    const confirmed = window.confirm(`Hapus service "${service.name}"?`)
    if (!confirmed) return
    try {
      const res = await fetch(`/api/services/${service.id}`, { method: "DELETE" })
      if (!res.ok) {
        const payload = await res.json()
        toast.error(payload?.message || "Failed to delete service")
        return
      }
      toast.success("Service deleted")
      loadServices()
    } catch (error) {
      console.error(error)
      toast.error("Server error")
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 lg:p-6">
      <div className="flex flex-col gap-3 rounded-xl border bg-background p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold">Services</h1>
          <p className="text-sm text-muted-foreground">
            Kelola daftar layanan dan durasinya.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(null)
            form.reset({
              name: "",
              durationMins: undefined,
              isActive: true,
            })
            setDialogOpen(true)
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Service
        </Button>
      </div>

      <div className="rounded-xl border">
        {loading ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-10 w-full" />
            ))}
          </div>
        ) : services.length === 0 ? (
          <div className="p-6 text-sm text-muted-foreground">
            No services yet. Add a service to get started.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {services.map((service) => (
                <TableRow key={service.id}>
                  <TableCell className="font-medium">{service.name}</TableCell>
                  <TableCell>{service.durationMins ? `${service.durationMins} min` : "-"}</TableCell>
                  <TableCell>
                    <Badge variant={service.isActive ? "secondary" : "outline"}>
                      {service.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(service.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label="Service actions">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-36">
                        <DropdownMenuItem
                          onClick={() => {
                            setEditing(service)
                            form.reset({
                              name: service.name,
                              durationMins: service.durationMins ?? undefined,
                              isActive: service.isActive,
                            })
                            setDialogOpen(true)
                          }}
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(service)}>
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
            <DialogTitle>{editing ? "Edit Service" : "Add Service"}</DialogTitle>
            <DialogDescription>Lengkapi detail layanan.</DialogDescription>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-4">
            <FieldGroup>
              <Field>
                <FieldLabel>Service Name</FieldLabel>
                <FieldContent>
                  <Input {...form.register("name")} placeholder="Massage Therapy" />
                  <FieldError errors={[form.formState.errors.name]} />
                </FieldContent>
              </Field>
              <div className="grid gap-3 lg:grid-cols-2">
                <Field>
                  <FieldLabel>Duration (mins)</FieldLabel>
                  <FieldContent>
                  <Input
                    type="number"
                    {...form.register("durationMins", {
                      setValueAs: (value) => toDurationValue(String(value)),
                    })}
                    placeholder="60"
                  />
                    <FieldError errors={[form.formState.errors.durationMins]} />
                  </FieldContent>
                </Field>
              </div>
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
