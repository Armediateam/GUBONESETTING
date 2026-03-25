"use client"

import * as React from "react"
import { MoreVertical, Pencil, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

type ServiceItem = {
  id: string
  name: string
  isActive?: boolean
}

type ServiceRateInput = {
  serviceId: string
  price: string
}

interface Therapist {
  id: string
  name: string
  gender?: "Female" | "Male"
  age?: number
  serviceRates?: Array<{
    serviceId: string
    price: number
  }>
  isActive: boolean
}

interface TherapistMainProps {
  search: string
  visibleColumns: Record<string, boolean>
  refreshKey: number
}

export function TherapistMain({ search, visibleColumns, refreshKey }: TherapistMainProps) {
  const [therapists, setTherapists] = React.useState<Therapist[]>([])
  const [services, setServices] = React.useState<ServiceItem[]>([])
  const [loading, setLoading] = React.useState(true)
  const [editOpen, setEditOpen] = React.useState(false)
  const [editingTherapist, setEditingTherapist] = React.useState<Therapist | null>(null)
  const [editForm, setEditForm] = React.useState({
    name: "",
    gender: "",
    age: "",
    serviceRates: [] as ServiceRateInput[],
  })

  const loadServices = React.useCallback(async () => {
    try {
      const res = await fetch("/api/services")
      if (!res.ok) {
        throw new Error("Failed to load services")
      }
      const payload = await res.json()
      setServices((payload.items ?? []).filter((item: ServiceItem) => item.isActive !== false))
    } catch (error) {
      console.error(error)
      toast.error("Failed to load services")
    }
  }, [])

  const loadTherapists = React.useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/therapists")
      if (!res.ok) {
        throw new Error("Failed to load therapists")
      }
      const payload = await res.json()
      setTherapists(payload.items ?? [])
    } catch (error) {
      console.error(error)
      toast.error("Gagal memuat therapist")
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    loadTherapists()
  }, [loadTherapists, refreshKey])

  React.useEffect(() => {
    loadServices()
  }, [loadServices])

  const filteredTherapists = therapists.filter(
    (d) => d.name.toLowerCase().includes(search.toLowerCase())
  )

  const handleEdit = (therapist: Therapist) => {
    setEditingTherapist(therapist)
    setEditForm({
      name: therapist.name,
      gender: therapist.gender ?? "",
      age: therapist.age?.toString() ?? "",
      serviceRates: (therapist.serviceRates ?? []).map((item) => ({
        serviceId: item.serviceId,
        price: item.price.toString(),
      })),
    })
    setEditOpen(true)
  }

  const handleServiceCheckedChange = (serviceId: string, checked: boolean) => {
    setEditForm((prev) => {
      if (checked) {
        if (prev.serviceRates.some((item) => item.serviceId === serviceId)) {
          return prev
        }
        return {
          ...prev,
          serviceRates: [...prev.serviceRates, { serviceId, price: "" }],
        }
      }

      return {
        ...prev,
        serviceRates: prev.serviceRates.filter((item) => item.serviceId !== serviceId),
      }
    })
  }

  const handleServicePriceChange = (serviceId: string, value: string) => {
    if (!/^\d*$/.test(value)) {
      return
    }

    setEditForm((prev) => ({
      ...prev,
      serviceRates: prev.serviceRates.map((item) =>
        item.serviceId === serviceId ? { ...item, price: value } : item
      ),
    }))
  }

  const handleEditSave = async () => {
    if (!editingTherapist) return
    if (!editForm.name.trim() || !editForm.gender || !editForm.age) {
      toast.error("Name, gender, and age are required")
      return
    }
    try {
      const res = await fetch(`/api/therapists/${editingTherapist.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editForm.name.trim(),
          gender: editForm.gender,
          age: Number(editForm.age),
          serviceRates: editForm.serviceRates
            .filter((item) => item.price.trim() !== "")
            .map((item) => ({
              serviceId: item.serviceId,
              price: Number(item.price),
            })),
        }),
      })
      const payload = await res.json()
      if (!res.ok) {
        toast.error(payload?.message || "Failed to update therapist")
        return
      }
      toast.success("Therapist updated")
      setEditOpen(false)
      setEditingTherapist(null)
      loadTherapists()
    } catch (error) {
      console.error(error)
      toast.error("Server error")
    }
  }

  const handleDelete = async (therapist: Therapist) => {
    const confirmed = window.confirm(`Hapus therapist "${therapist.name}"?`)
    if (!confirmed) return
    try {
      const res = await fetch(`/api/therapists/${therapist.id}`, {
        method: "DELETE",
      })
      const payload = await res.json()
      if (!res.ok) {
        toast.error(payload?.message || "Failed to delete therapist")
        return
      }
      toast.success("Therapist deleted")
      loadTherapists()
    } catch (error) {
      console.error(error)
      toast.error("Server error")
    }
  }

  const handleToggleActive = async (therapist: Therapist, nextActive: boolean) => {
    setTherapists((prev) =>
      prev.map((item) => (item.id === therapist.id ? { ...item, isActive: nextActive } : item))
    )
    try {
      const res = await fetch(`/api/therapists/${therapist.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: nextActive }),
      })
      const payload = await res.json()
      if (!res.ok) {
        throw new Error(payload?.message || "Failed to update therapist")
      }
      toast.success("Therapist status updated")
      loadTherapists()
    } catch (error) {
      console.error(error)
      toast.error("Failed to update therapist status")
      setTherapists((prev) =>
        prev.map((item) =>
          item.id === therapist.id ? { ...item, isActive: !nextActive } : item
        )
      )
    }
  }

  return (
    <>
      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader className="bg-muted">
            <TableRow>
              {visibleColumns.name && <TableHead>Name</TableHead>}
              {visibleColumns.gender && <TableHead>Gender</TableHead>}
              {visibleColumns.age && <TableHead>Age</TableHead>}
              {visibleColumns.active && <TableHead>Status</TableHead>}
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={Object.keys(visibleColumns).length + 1}
                  className="h-24 text-center text-muted-foreground"
                >
                  Loading...
                </TableCell>
              </TableRow>
            ) : filteredTherapists.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={Object.keys(visibleColumns).length + 1}
                  className="h-24 text-center text-muted-foreground"
                >
                  No data found.
                </TableCell>
              </TableRow>
            ) : (
              filteredTherapists.map((doc) => (
                <TableRow key={doc.id}>
                  {visibleColumns.name && (
                    <TableCell>
                      <div className="font-medium">{doc.name}</div>
                      <div className="text-muted-foreground text-xs">
                        {(doc.serviceRates?.length ?? 0) > 0
                          ? `${doc.serviceRates?.length ?? 0} services configured`
                          : "No services configured"}
                      </div>
                    </TableCell>
                  )}
                  {visibleColumns.gender && <TableCell>{doc.gender ?? "-"}</TableCell>}
                  {visibleColumns.age && <TableCell>{doc.age ? `${doc.age} yrs` : "-"}</TableCell>}
                  {visibleColumns.active && (
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={doc.isActive}
                          onCheckedChange={(value) => handleToggleActive(doc, value)}
                        />
                        <span className="text-sm text-muted-foreground">
                          {doc.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </TableCell>
                  )}
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label="Therapist actions">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItem onClick={() => handleEdit(doc)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(doc)}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Therapist</DialogTitle>
            <DialogDescription>Update therapist details.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-1">
              <Label>Name</Label>
              <Input
                value={editForm.name}
                onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Therapist Name"
              />
            </div>
            <div className="grid gap-1">
              <Label>Gender</Label>
              <Select
                value={editForm.gender || undefined}
                onValueChange={(value) => setEditForm((prev) => ({ ...prev, gender: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Male">Male</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1">
              <Label>Age</Label>
              <Input
                type="number"
                value={editForm.age}
                onChange={(e) =>
                  setEditForm((prev) => ({
                    ...prev,
                    age: e.target.value.replace(/[^0-9]/g, ""),
                  }))
                }
                placeholder="25"
              />
            </div>
            <div className="grid gap-3">
              <div>
                <Label>Services & Prices</Label>
                <p className="text-muted-foreground text-sm">
                  Centang layanan yang dimiliki therapist lalu isi harga per layanan.
                </p>
              </div>
              {services.length === 0 ? (
                <div className="text-muted-foreground rounded-md border border-dashed px-3 py-4 text-sm">
                  Belum ada layanan aktif.
                </div>
              ) : (
                <div className="space-y-3 rounded-md border p-3">
                  {services.map((service) => {
                    const selected = editForm.serviceRates.find(
                      (item) => item.serviceId === service.id
                    )

                    return (
                      <div
                        key={service.id}
                        className="grid gap-2 md:grid-cols-[1fr_180px] md:items-center"
                      >
                        <label className="flex items-center gap-3">
                          <Checkbox
                            checked={Boolean(selected)}
                            onCheckedChange={(checked) =>
                              handleServiceCheckedChange(service.id, checked === true)
                            }
                          />
                          <span className="text-sm">{service.name}</span>
                        </label>
                        <Input
                          type="number"
                          value={selected?.price ?? ""}
                          onChange={(event) =>
                            handleServicePriceChange(service.id, event.target.value)
                          }
                          placeholder="250000"
                          disabled={!selected}
                        />
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditSave}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

