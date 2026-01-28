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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface Therapist {
  id: string
  name: string
  price: number
  isActive: boolean
}

interface TherapistMainProps {
  search: string
  visibleColumns: Record<string, boolean>
  refreshKey: number
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value)

export function TherapistMain({ search, visibleColumns, refreshKey }: TherapistMainProps) {
  const [therapists, setTherapists] = React.useState<Therapist[]>([])
  const [loading, setLoading] = React.useState(true)
  const [editOpen, setEditOpen] = React.useState(false)
  const [editingTherapist, setEditingTherapist] = React.useState<Therapist | null>(null)
  const [editForm, setEditForm] = React.useState({
    name: "",
    price: "",
  })

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

  const filteredTherapists = therapists.filter(
    (d) => d.name.toLowerCase().includes(search.toLowerCase())
  )

  const handleEdit = (therapist: Therapist) => {
    setEditingTherapist(therapist)
    setEditForm({
      name: therapist.name,
      price: therapist.price.toString(),
    })
    setEditOpen(true)
  }

  const handleEditSave = async () => {
    if (!editingTherapist) return
    try {
      const res = await fetch(`/api/therapists/${editingTherapist.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editForm.name,
          price: Number(editForm.price || 0),
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
              {visibleColumns.price && <TableHead>Price</TableHead>}
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
                  {visibleColumns.name && <TableCell>{doc.name}</TableCell>}
                  {visibleColumns.price && <TableCell>{formatCurrency(doc.price)}</TableCell>}
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
              <Label>Therapist Price (IDR)</Label>
              <Input
                type="number"
                value={editForm.price}
                onChange={(e) =>
                  setEditForm((prev) => ({
                    ...prev,
                    price: e.target.value.replace(/[^0-9]/g, ""),
                  }))
                }
                placeholder="250000"
              />
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

