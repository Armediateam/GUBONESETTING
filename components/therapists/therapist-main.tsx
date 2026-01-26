"use client"

import * as React from "react"
import { toast } from "sonner"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

interface Therapist {
  id: string
  name: string
  email: string
  isActive: boolean
  experience: number
  phone?: string
}

interface TherapistMainProps {
  search: string
  visibleColumns: Record<string, boolean>
  refreshKey: number
}

export function TherapistMain({ search, visibleColumns, refreshKey }: TherapistMainProps) {
  const [therapists, setTherapists] = React.useState<Therapist[]>([])
  const [loading, setLoading] = React.useState(true)

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
    (d) =>
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="rounded-lg border overflow-hidden">
      <Table>
        <TableHeader className="bg-muted">
          <TableRow>
            {visibleColumns.name && <TableHead>Name</TableHead>}
            {visibleColumns.email && <TableHead>Email</TableHead>}
            {visibleColumns.status && <TableHead>Status</TableHead>}
            {visibleColumns.experience && <TableHead>Experience (yrs)</TableHead>}
          </TableRow>
        </TableHeader>

        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={Object.keys(visibleColumns).length} className="h-24 text-center text-muted-foreground">
                Loading...
              </TableCell>
            </TableRow>
          ) : filteredTherapists.length === 0 ? (
            <TableRow>
              <TableCell colSpan={Object.keys(visibleColumns).length} className="h-24 text-center text-muted-foreground">
                No data found.
              </TableCell>
            </TableRow>
          ) : (
            filteredTherapists.map((doc) => (
              <TableRow key={doc.id}>
                {visibleColumns.name && <TableCell>{doc.name}</TableCell>}
                {visibleColumns.email && <TableCell>{doc.email}</TableCell>}
                {visibleColumns.status && (
                  <TableCell>
                    <Badge variant={doc.isActive ? "secondary" : "outline"}>
                      {doc.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                )}
                {visibleColumns.experience && <TableCell>{doc.experience}</TableCell>}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}

