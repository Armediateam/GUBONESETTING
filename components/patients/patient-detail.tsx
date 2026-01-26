"use client"

import * as React from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { Pencil, Plus, Trash2 } from "lucide-react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import {
  noteSchema,
  patientSchema,
  type NoteRecord,
  type PatientRecord,
} from "@/lib/patients/schema"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

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

type Summary = {
  total: number
  completed: number
  cancelled: number
  upcoming: string | null
  lastVisitAt: string | null
}

type Appointment = {
  id: string
  serviceName: string
  startISO?: string
  endISO?: string
  startAt?: string
  endAt?: string
  locationName?: string
  therapistName?: string
  status: "scheduled" | "completed" | "cancelled" | "no_show"
}

export function PatientDetail() {
  const params = useParams()
  const patientId = Array.isArray(params?.patientId)
    ? params.patientId[0]
    : (params?.patientId as string)

  const [patient, setPatient] = React.useState<PatientRecord | null>(null)
  const [summary, setSummary] = React.useState<Summary | null>(null)
  const [appointments, setAppointments] = React.useState<Appointment[]>([])
  const [notes, setNotes] = React.useState<NoteRecord[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [editDialogOpen, setEditDialogOpen] = React.useState(false)
  const [noteDialogOpen, setNoteDialogOpen] = React.useState(false)
  const [editingNote, setEditingNote] = React.useState<NoteRecord | null>(null)

  const patientForm = useForm({
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

  const noteForm = useForm({
    resolver: zodResolver(noteSchema),
    defaultValues: {
      title: "",
      note: "",
      createdBy: "",
      patientId: patientId ?? "",
    },
  })

  const loadData = React.useCallback(async () => {
    if (!patientId) {
      return
    }
    setIsLoading(true)
    try {
      const [patientRes, appointmentRes, notesRes] = await Promise.all([
        fetch(`/api/patients/${patientId}`),
        fetch(`/api/patients/${patientId}/appointments`),
        fetch(`/api/patients/${patientId}/notes`),
      ])

      if (!patientRes.ok) {
        throw new Error("Patient not found")
      }

      const patientPayload = await patientRes.json()
      const appointmentPayload = await appointmentRes.json()
      const notesPayload = await notesRes.json()

      setPatient(patientPayload.patient)
      setSummary(patientPayload.summary)
      setAppointments(appointmentPayload.items || [])
      setNotes(notesPayload.items || [])

      patientForm.reset({
        fullName: patientPayload.patient.fullName,
        phone: patientPayload.patient.phone,
        email: patientPayload.patient.email ?? "",
        gender: patientPayload.patient.gender ?? "",
        dateOfBirth: patientPayload.patient.dateOfBirth ?? "",
        address: patientPayload.patient.address ?? "",
      })
    } catch (error) {
      console.error(error)
      toast.error("Gagal memuat data pasien")
    } finally {
      setIsLoading(false)
    }
  }, [patientId, patientForm])

  React.useEffect(() => {
    loadData()
  }, [loadData])

  const handleUpdatePatient = patientForm.handleSubmit(async (values) => {
    if (!patientId) {
      return
    }
    try {
      const res = await fetch(`/api/patients/${patientId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      })
      if (!res.ok) {
        const payload = await res.json()
        toast.error(payload?.message || "Gagal memperbarui pasien")
        return
      }
      const updated = await res.json()
      setPatient(updated)
      setEditDialogOpen(false)
      toast.success("Data pasien diperbarui")
    } catch (error) {
      console.error(error)
      toast.error("Server error")
    }
  })

  const handleCreateNote = noteForm.handleSubmit(async (values) => {
    if (!patientId) {
      return
    }
    try {
      const res = await fetch(`/api/patients/${patientId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      })
      if (!res.ok) {
        const payload = await res.json()
        toast.error(payload?.message || "Gagal menambahkan catatan")
        return
      }
      const note = await res.json()
      setNotes((prev) => [note, ...prev])
      noteForm.reset({ title: "", note: "", createdBy: "", patientId })
      toast.success("Catatan ditambahkan")
    } catch (error) {
      console.error(error)
      toast.error("Server error")
    }
  })

  const handleUpdateNote = async () => {
    if (!patientId || !editingNote) {
      return
    }
    try {
      const res = await fetch(`/api/patients/${patientId}/notes/${editingNote.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(noteForm.getValues()),
      })
      if (!res.ok) {
        const payload = await res.json()
        toast.error(payload?.message || "Gagal memperbarui catatan")
        return
      }
      const updated = await res.json()
      setNotes((prev) => prev.map((note) => (note.id === updated.id ? updated : note)))
      setNoteDialogOpen(false)
      setEditingNote(null)
      toast.success("Catatan diperbarui")
    } catch (error) {
      console.error(error)
      toast.error("Server error")
    }
  }

  const handleDeleteNote = async (noteId: string) => {
    if (!patientId) {
      return
    }
    try {
      const res = await fetch(`/api/patients/${patientId}/notes/${noteId}`, {
        method: "DELETE",
      })
      if (!res.ok) {
        const payload = await res.json()
        toast.error(payload?.message || "Gagal menghapus catatan")
        return
      }
      setNotes((prev) => prev.filter((note) => note.id !== noteId))
      toast.success("Catatan dihapus")
    } catch (error) {
      console.error(error)
      toast.error("Server error")
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!patient || !summary) {
    return (
      <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
        Patient tidak ditemukan.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/patients">Patients</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{patient.fullName}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <Card>
        <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle>{patient.fullName}</CardTitle>
            <CardDescription>{patient.phone}</CardDescription>
          </div>
          <Button variant="outline" onClick={() => setEditDialogOpen(true)}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit Profile
          </Button>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-muted-foreground">Email:</span> {patient.email ?? "-"}
            </div>
            <div>
              <span className="text-muted-foreground">Gender:</span> {patient.gender ?? "-"}
            </div>
            <div>
              <span className="text-muted-foreground">Tanggal Lahir:</span>{" "}
              {patient.dateOfBirth ? formatDate(patient.dateOfBirth) : "-"}
            </div>
          </div>
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-muted-foreground">Alamat:</span> {patient.address ?? "-"}
            </div>
            <div>
              <span className="text-muted-foreground">Dibuat:</span> {formatDate(patient.createdAt)}
            </div>
            <div>
              <span className="text-muted-foreground">Terakhir diperbarui:</span>{" "}
              {formatDate(patient.updatedAt)}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-4">
        <SummaryCard title="Total Appointments" value={summary.total} />
        <SummaryCard title="Completed" value={summary.completed} />
        <SummaryCard title="Cancelled/No Show" value={summary.cancelled} />
        <SummaryCard
          title="Upcoming"
          value={summary.upcoming ? formatDate(summary.upcoming) : "-"}
        />
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="appointments">Appointments</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Last Visit</CardTitle>
              <CardDescription>Ringkasan kunjungan terakhir pasien.</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {summary.lastVisitAt
                ? `Terakhir berkunjung pada ${formatDate(summary.lastVisitAt)}`
                : "Belum ada kunjungan yang selesai."}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appointments">
          <Card>
            <CardHeader>
              <CardTitle>Appointments</CardTitle>
              <CardDescription>Riwayat booking pasien.</CardDescription>
            </CardHeader>
            <CardContent>
              {appointments.length === 0 ? (
                <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
                  Belum ada appointment.
                </div>
              ) : (
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tanggal</TableHead>
                        <TableHead>Service</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Therapist</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {appointments.map((appointment) => (
                        <TableRow key={appointment.id}>
                          <TableCell>
                            {formatDateTime(appointment.startISO ?? appointment.startAt ?? "")}
                          </TableCell>
                          <TableCell>{appointment.serviceName}</TableCell>
                          <TableCell>
                            <Badge variant={statusVariant[appointment.status]}>
                              {statusLabel[appointment.status]}
                            </Badge>
                          </TableCell>
                          <TableCell>{appointment.locationName ?? "-"}</TableCell>
                          <TableCell>{appointment.therapistName ?? "-"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle>Notes</CardTitle>
                <CardDescription>Catatan klinis atau admin.</CardDescription>
              </div>
              <Button onClick={() => setNoteDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Note
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {notes.length === 0 ? (
                <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
                  Belum ada catatan.
                </div>
              ) : (
                <div className="space-y-3">
                  {notes.map((note) => (
                    <div key={note.id} className="rounded-lg border p-4">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <div className="text-sm font-medium">
                            {note.title || "Catatan"}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatDateTime(note.createdAt)}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingNote(note)
                              noteForm.reset({
                                title: note.title ?? "",
                                note: note.note,
                                createdBy: note.createdBy ?? "",
                                patientId,
                              })
                              setNoteDialogOpen(true)
                            }}
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Hapus catatan?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Catatan yang dihapus tidak dapat dipulihkan.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Batal</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteNote(note.id)}>
                                  Hapus
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                      <p className="mt-3 text-sm text-muted-foreground">{note.note}</p>
                      {note.createdBy && (
                        <p className="mt-2 text-xs text-muted-foreground">
                          Dibuat oleh {note.createdBy}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit Patient</DialogTitle>
            <DialogDescription>Perbarui informasi pasien.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdatePatient} className="space-y-4">
            <FieldGroup>
              <Field>
                <FieldLabel>Nama Lengkap</FieldLabel>
                <FieldContent>
                  <Input {...patientForm.register("fullName")} />
                  <FieldError errors={[patientForm.formState.errors.fullName]} />
                </FieldContent>
              </Field>
              <Field>
                <FieldLabel>No. Telepon</FieldLabel>
                <FieldContent>
                  <Input {...patientForm.register("phone")} />
                  <FieldError errors={[patientForm.formState.errors.phone]} />
                </FieldContent>
              </Field>
              <Field>
                <FieldLabel>Email (opsional)</FieldLabel>
                <FieldContent>
                  <Input type="email" {...patientForm.register("email")} />
                  <FieldError errors={[patientForm.formState.errors.email]} />
                </FieldContent>
              </Field>
              <div className="grid gap-3 lg:grid-cols-2">
                <Field>
                  <FieldLabel>Gender (opsional)</FieldLabel>
                  <FieldContent>
                    <Input {...patientForm.register("gender")} />
                  </FieldContent>
                </Field>
                <Field>
                  <FieldLabel>Tanggal Lahir (opsional)</FieldLabel>
                  <FieldContent>
                    <Input type="date" {...patientForm.register("dateOfBirth")} />
                  </FieldContent>
                </Field>
              </div>
              <Field>
                <FieldLabel>Alamat (opsional)</FieldLabel>
                <FieldContent>
                  <Input {...patientForm.register("address")} />
                  <FieldDescription>Alamat dapat diperbarui kapan saja.</FieldDescription>
                </FieldContent>
              </Field>
            </FieldGroup>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={patientForm.formState.isSubmitting}>
                {patientForm.formState.isSubmitting ? "Menyimpan..." : "Simpan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={noteDialogOpen}
        onOpenChange={(open) => {
          setNoteDialogOpen(open)
          if (!open) {
            setEditingNote(null)
            noteForm.reset({ title: "", note: "", createdBy: "", patientId })
          }
        }}
      >
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingNote ? "Edit Note" : "Add Note"}</DialogTitle>
            <DialogDescription>
              {editingNote ? "Perbarui catatan pasien." : "Tambahkan catatan baru."}
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(event) => {
              event.preventDefault()
              if (editingNote) {
                void handleUpdateNote()
              } else {
                void handleCreateNote()
              }
            }}
            className="space-y-4"
          >
            <FieldGroup>
              <Field>
                <FieldLabel>Judul (opsional)</FieldLabel>
                <FieldContent>
                  <Input {...noteForm.register("title")} placeholder="Catatan kunjungan" />
                </FieldContent>
              </Field>
              <Field>
                <FieldLabel>Catatan</FieldLabel>
                <FieldContent>
                  <Textarea
                    {...noteForm.register("note")}
                    placeholder="Isi catatan"
                    rows={4}
                  />
                  <FieldError errors={[noteForm.formState.errors.note]} />
                </FieldContent>
              </Field>
              <Field>
                <FieldLabel>Dibuat oleh (opsional)</FieldLabel>
                <FieldContent>
                  <Input {...noteForm.register("createdBy")} placeholder="Admin" />
                </FieldContent>
              </Field>
            </FieldGroup>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setNoteDialogOpen(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={noteForm.formState.isSubmitting}>
                {noteForm.formState.isSubmitting
                  ? "Menyimpan..."
                  : editingNote
                    ? "Simpan Perubahan"
                    : "Simpan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function SummaryCard({ title, value }: { title: string; value: string | number }) {
  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardDescription>{title}</CardDescription>
        <CardTitle>{value}</CardTitle>
      </CardHeader>
    </Card>
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
