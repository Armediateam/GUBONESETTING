"use client"

import * as React from "react"
import Link from "next/link"
import { Download, Eye, MoreVertical, Search, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { type PatientRecord } from "@/lib/patients/schema"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type PatientListItem = PatientRecord & {
  totalVisits: number
  upcoming: string | null
}

const PAGE_SIZE = 8

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")

export function PatientsList() {
  const [items, setItems] = React.useState<PatientListItem[]>([])
  const [total, setTotal] = React.useState(0)
  const [page, setPage] = React.useState(1)
  const [search, setSearch] = React.useState("")
  const [debouncedSearch, setDebouncedSearch] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(true)
  const [isExporting, setIsExporting] = React.useState(false)

  React.useEffect(() => {
    const handle = setTimeout(() => setDebouncedSearch(search), 400)
    return () => clearTimeout(handle)
  }, [search])

  const fetchPatients = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        q: debouncedSearch,
        page: String(page),
        pageSize: String(PAGE_SIZE),
        sort: "newest",
      })
      const res = await fetch(`/api/patients?${params.toString()}`)
      if (!res.ok) {
        throw new Error("Failed to load patients")
      }
      const data = await res.json()
      setItems(data.items)
      setTotal(data.total)
    } catch (error) {
      console.error(error)
      toast.error("Gagal memuat pasien")
    } finally {
      setIsLoading(false)
    }
  }, [debouncedSearch, page])

  React.useEffect(() => {
    fetchPatients()
  }, [fetchPatients])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const handleDelete = async (patientId: string) => {
    const confirmed = window.confirm("Hapus pasien ini?")
    if (!confirmed) return
    try {
      const res = await fetch(`/api/patients/${patientId}`, { method: "DELETE" })
      const payload = await res.json()
      if (!res.ok) {
        toast.error(payload?.message || "Gagal menghapus pasien")
        return
      }
      toast.success("Pasien dihapus")
      setPage(1)
      fetchPatients()
    } catch (error) {
      console.error(error)
      toast.error("Server error")
    }
  }

  const handleExportExcel = React.useCallback(async () => {
    if (total === 0) {
      toast.error("Tidak ada data pasien untuk diexport")
      return
    }

    try {
      setIsExporting(true)

      const params = new URLSearchParams({
        q: debouncedSearch,
        page: "1",
        pageSize: String(Math.max(total, PAGE_SIZE)),
        sort: "newest",
      })

      const res = await fetch(`/api/patients?${params.toString()}`)
      if (!res.ok) {
        throw new Error("Failed to export patients")
      }

      const data = await res.json()
      const exportItems = (data.items ?? []) as PatientListItem[]

      if (exportItems.length === 0) {
        toast.error("Tidak ada data pasien untuk diexport")
        return
      }

      const rows = exportItems
        .map((patient, index) => {
          const values = [
            String(index + 1),
            patient.id,
            patient.fullName,
            patient.phone,
            patient.email || "-",
            patient.complaint || "-",
            String(patient.totalVisits ?? 0),
            patient.upcoming ? formatDate(patient.upcoming) : "-",
            formatDate(patient.createdAt),
          ]

          return `<tr>${values.map((value) => `<td>${escapeHtml(value)}</td>`).join("")}</tr>`
        })
        .join("")

      const workbook = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
  </head>
  <body>
    <table border="1">
      <tr><th colspan="9">Patients Export</th></tr>
      <tr><td colspan="9">Generated at: ${escapeHtml(formatDateTime(new Date().toISOString()))}</td></tr>
      <tr><td colspan="9">Search: ${escapeHtml(debouncedSearch || "None")}</td></tr>
      <tr>
        <th>No</th>
        <th>Patient ID</th>
        <th>Name</th>
        <th>Phone</th>
        <th>Email</th>
        <th>Complaint</th>
        <th>Total Visits</th>
        <th>Upcoming</th>
        <th>Created</th>
      </tr>
      ${rows}
    </table>
  </body>
</html>`

      const blob = new Blob(["\ufeff", workbook], {
        type: "application/vnd.ms-excel;charset=utf-8;",
      })
      const objectUrl = URL.createObjectURL(blob)
      const link = document.createElement("a")
      const today = new Date().toISOString().slice(0, 10)

      link.href = objectUrl
      link.download = `patients-${today}.xls`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(objectUrl)

      toast.success("Export Excel pasien berhasil diunduh")
    } catch (error) {
      console.error(error)
      toast.error("Gagal export data pasien")
    } finally {
      setIsExporting(false)
    }
  }, [debouncedSearch, total])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <CardTitle>Patients</CardTitle>
            <CardDescription>Kelola data pasien dan riwayat kunjungan.</CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto"
            onClick={handleExportExcel}
            disabled={isLoading || isExporting || total === 0}
          >
            <Download className="mr-2 h-4 w-4" />
            {isExporting ? "Exporting..." : "Export Excel"}
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value)
                  setPage(1)
                }}
                placeholder="Cari nama atau telepon"
                className="pl-9"
              />
            </div>
            <div className="text-sm text-muted-foreground">
              Total: {total} pasien
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-12 w-full" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
              Belum ada pasien. Data pasien akan muncul setelah booking dibuat.
            </div>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama</TableHead>
                    <TableHead>Telepon</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Complaint</TableHead>
                  <TableHead>Total Visits</TableHead>
                  <TableHead>Upcoming</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((patient) => (
                  <TableRow key={patient.id} className="hover:bg-muted/40">
                      <TableCell className="font-medium">
                        <Link
                          href={`/patients/${patient.id}`}
                          className="text-primary hover:underline"
                        >
                          {patient.fullName}
                        </Link>
                      </TableCell>
                      <TableCell>{patient.phone}</TableCell>
                      <TableCell>{patient.email ?? "-"}</TableCell>
                      <TableCell>{patient.complaint ?? "-"}</TableCell>
                      <TableCell>{patient.totalVisits}</TableCell>
                      <TableCell>{patient.upcoming ? formatDate(patient.upcoming) : "-"}</TableCell>
                      <TableCell>{formatDate(patient.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" aria-label="Patient actions">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/patients/${patient.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                Info selengkapnya
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDelete(patient.id)}
                            >
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
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-muted-foreground sm:text-left">
              Page {page} of {totalPages}
            </div>
            <div className="flex w-full items-center gap-2 sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 sm:flex-none"
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={page <= 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 sm:flex-none"
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={page >= totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value))

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value))
