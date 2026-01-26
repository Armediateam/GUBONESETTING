"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Field, FieldContent, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"

export default function SettingsPage() {
  const [emailNotif, setEmailNotif] = React.useState(true)
  const [appNotif, setAppNotif] = React.useState(true)
  const [quietMode, setQuietMode] = React.useState(false)
  const [timezone, setTimezone] = React.useState("Asia/Jakarta")
  const [language, setLanguage] = React.useState("id")
  const [backupEmail, setBackupEmail] = React.useState("")

  return (
    <div className="flex flex-col gap-4 my-4 mx-4 lg:mx-6">
      <Card>
        <CardHeader>
          <CardTitle>Settings</CardTitle>
          <CardDescription>Kelola preferensi akun dan aplikasi.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <FieldGroup>
            <Field>
              <FieldLabel>Notifikasi email</FieldLabel>
              <FieldContent className="flex items-center justify-between gap-4">
                <FieldDescription>Terima notifikasi penting melalui email.</FieldDescription>
                <Switch checked={emailNotif} onCheckedChange={setEmailNotif} />
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel>Notifikasi aplikasi</FieldLabel>
              <FieldContent className="flex items-center justify-between gap-4">
                <FieldDescription>Aktifkan notifikasi di dalam aplikasi.</FieldDescription>
                <Switch checked={appNotif} onCheckedChange={setAppNotif} />
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel>Mode tenang</FieldLabel>
              <FieldContent className="flex items-center justify-between gap-4">
                <FieldDescription>Nonaktifkan notifikasi setelah jam kerja.</FieldDescription>
                <Switch checked={quietMode} onCheckedChange={setQuietMode} />
              </FieldContent>
            </Field>
          </FieldGroup>

          <Separator />

          <FieldGroup>
            <div className="grid gap-4 lg:grid-cols-2">
              <Field>
                <FieldLabel>Timezone</FieldLabel>
                <FieldContent>
                  <Select value={timezone} onValueChange={setTimezone}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Asia/Jakarta">Asia/Jakarta</SelectItem>
                      <SelectItem value="Asia/Singapore">Asia/Singapore</SelectItem>
                      <SelectItem value="UTC">UTC</SelectItem>
                    </SelectContent>
                  </Select>
                </FieldContent>
              </Field>
              <Field>
                <FieldLabel>Language</FieldLabel>
                <FieldContent>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih bahasa" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="id">Bahasa Indonesia</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                    </SelectContent>
                  </Select>
                </FieldContent>
              </Field>
            </div>
            <Field>
              <FieldLabel>Email backup</FieldLabel>
              <FieldContent>
                <Input
                  type="email"
                  value={backupEmail}
                  onChange={(event) => setBackupEmail(event.target.value)}
                  placeholder="backup@email.com"
                />
                <FieldDescription>
                  Email alternatif untuk reset akun dan notifikasi penting.
                </FieldDescription>
              </FieldContent>
            </Field>
          </FieldGroup>

          <Separator />

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium">Simpan perubahan</p>
              <p className="text-xs text-muted-foreground">
                Pastikan pengaturan sudah sesuai sebelum disimpan.
              </p>
            </div>
            <Button size="sm">Save Settings</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
