"use client"

import * as React from "react"
import Link from "next/link"
import { zodResolver } from "@hookform/resolvers/zod"
import { Search, Plus } from "lucide-react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import { patientSchema, type PatientFormValues, type PatientRecord } from "@/lib/patients/schema"
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
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
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

type PatientListItem = PatientRecord & {
  totalVisits: number
  lastVisit: string | null
  upcoming: string | null
}

const PAGE_SIZE = 8

export function PatientsList() {
  const [items, setItems] = React.useState<PatientListItem[]>([])
  const [total, setTotal] = React.useState(0)
  const [page, setPage] = React.useState(1)
  const [search, setSearch] = React.useState("")
  const [debouncedSearch, setDebouncedSearch] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(true)
  const [dialogOpen, setDialogOpen] = React.useState(false)

  const form = useForm<PatientFormValues>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      fullName: "",
      phone: "",
      email: "",
      gender: "",
      dateOfBirth: "",
      address: "",
    },
  })

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

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const res = await fetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      })
      if (!res.ok) {
        const payload = await res.json()
        toast.error(payload?.message || "Gagal menambah pasien")
        return
      }
      toast.success("Pasien berhasil ditambahkan")
      form.reset()
      setDialogOpen(false)
      setPage(1)
      fetchPatients()
    } catch (error) {
      console.error(error)
      toast.error("Server error")
    }
  })

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle>Patients</CardTitle>
            <CardDescription>Kelola data pasien dan riwayat kunjungan.</CardDescription>
          </div>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Patient
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full max-w-sm">
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
              Belum ada pasien. Tambahkan pasien baru untuk memulai.
            </div>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama</TableHead>
                    <TableHead>Telepon</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Total Visits</TableHead>
                    <TableHead>Last Visit</TableHead>
                    <TableHead>Upcoming</TableHead>
                    <TableHead>Created</TableHead>
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
                      <TableCell>{patient.totalVisits}</TableCell>
                      <TableCell>{patient.lastVisit ? formatDate(patient.lastVisit) : "-"}</TableCell>
                      <TableCell>{patient.upcoming ? formatDate(patient.upcoming) : "-"}</TableCell>
                      <TableCell>{formatDate(patient.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
            <div className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={page <= 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={page >= totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Tambah Pasien</DialogTitle>
            <DialogDescription>Lengkapi data pasien baru.</DialogDescription>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-4">
            <FieldGroup>
              <Field>
                <FieldLabel>Nama Lengkap</FieldLabel>
                <FieldContent>
                  <Input {...form.register("fullName")} placeholder="Nama pasien" />
                  <FieldError errors={[form.formState.errors.fullName]} />
                </FieldContent>
              </Field>
              <Field>
                <FieldLabel>No. Telepon</FieldLabel>
                <FieldContent>
                  <Input {...form.register("phone")} placeholder="0812..." />
                  <FieldError errors={[form.formState.errors.phone]} />
                </FieldContent>
              </Field>
              <Field>
                <FieldLabel>Email (opsional)</FieldLabel>
                <FieldContent>
                  <Input type="email" {...form.register("email")} placeholder="email@example.com" />
                  <FieldError errors={[form.formState.errors.email]} />
                </FieldContent>
              </Field>
              <div className="grid gap-3 lg:grid-cols-2">
                <Field>
                  <FieldLabel>Gender (opsional)</FieldLabel>
                  <FieldContent>
                    <Input {...form.register("gender")} placeholder="Perempuan" />
                  </FieldContent>
                </Field>
                <Field>
                  <FieldLabel>Tanggal Lahir (opsional)</FieldLabel>
                  <FieldContent>
                    <Input type="date" {...form.register("dateOfBirth")} />
                  </FieldContent>
                </Field>
              </div>
              <Field>
                <FieldLabel>Alamat (opsional)</FieldLabel>
                <FieldContent>
                  <Input {...form.register("address")} placeholder="Alamat lengkap" />
                  <FieldDescription>Alamat dapat digunakan untuk kebutuhan admin.</FieldDescription>
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

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value))
