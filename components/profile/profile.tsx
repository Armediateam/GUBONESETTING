"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

export default function ProfilePage() {
  const router = useRouter();

  const [therapist, setTherapist] = React.useState({
    name: "",
    email: "",
    password: "",
    experience: "",
    phone: "",
    status: "Active",
    photo: "",
  });

  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [activeStatus, setActiveStatus] = React.useState(true);
  const [isAuthenticated, setIsAuthenticated] = React.useState(true);
  const [accountForm, setAccountForm] = React.useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [accountSaving, setAccountSaving] = React.useState(false);

  React.useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch("/api/auth/therapists/me");
        if (res.status === 401) {
          setIsAuthenticated(false);
          setLoading(false);
          router.replace("/login");
          return;
        }
        if (!res.ok) throw new Error("Failed to fetch profile");

        const data = await res.json();
        setTherapist({
          name: data.name || "",
          email: data.email || "",
          password: "",
          experience: data.experience?.toString() || "",
          phone: data.phone || "",
          status: data.status || "Active",
          photo: data.photo || "",
        });
        setActiveStatus(data.status === "Active");
      } catch (err) {
        console.error(err);
        toast.error("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleChange = (key: string, value: string) => {
    setTherapist((prev) => ({ ...prev, [key]: value }));
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setTherapist((prev) => ({ ...prev, photo: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/auth/therapists/me", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: therapist.name,
          email: therapist.email,
          password: therapist.password || undefined,
          experience: Number(therapist.experience),
          phone: therapist.phone,
          status: activeStatus ? "Active" : "Inactive",
          photo: therapist.photo,
        }),
      });

      const data = await res.json();
      if (res.status === 401) {
        setIsAuthenticated(false);
        toast.error("Silakan login kembali");
        router.replace("/login");
        return;
      }
      if (!res.ok) {
        toast.error(data.message || "Gagal update profile");
        return;
      }

      toast.success("Profile berhasil diperbarui!");
      setTherapist((prev) => ({ ...prev, password: "" }));
    } catch (err) {
      console.error(err);
      toast.error("Server error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-center py-10">Loading profile...</div>;

  return (
    <div className="space-y-6">
      {!isAuthenticated ? (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Silakan login untuk melihat profil.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/login")}>Go to Login</Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-sm">
        <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Kelola informasi akun dan profil.</CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={handleSave} disabled={saving} size="sm">
              {saving ? "Saving..." : "Save Changes"}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={saving || deleting}
              onClick={async () => {
                const confirmed = window.confirm(
                  "Hapus akun ini? Tindakan ini tidak bisa dibatalkan."
                );
                if (!confirmed) return;

                setDeleting(true);
                try {
                  const res = await fetch("/api/auth/therapists/me", {
                    method: "DELETE",
                  });
                  const data = await res.json();

                  if (res.status === 401) {
                    setIsAuthenticated(false);
                    router.replace("/login");
                    return;
                  }

                  if (!res.ok) {
                    toast.error(data.message || "Gagal menghapus akun");
                    return;
                  }

                  setIsAuthenticated(false);
                  toast.success("Akun berhasil dihapus");
                  router.replace("/login");
                } catch (err) {
                  console.error(err);
                  toast.error("Server error");
                } finally {
                  setDeleting(false);
                }
              }}
            >
              {deleting ? "Deleting..." : "Delete Account"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-4">
              <label htmlFor="photo-upload" className="cursor-pointer">
                <Avatar className="h-20 w-20">
                  {therapist.photo ? (
                    <AvatarImage src={therapist.photo} alt={therapist.name} />
                  ) : (
                    <AvatarFallback>{therapist.name.charAt(0)}</AvatarFallback>
                  )}
                </Avatar>
              </label>
              <div>
                <p className="text-sm font-medium">Foto Profil</p>
                <p className="text-xs text-muted-foreground">
                  Klik avatar untuk mengganti foto.
                </p>
              </div>
            </div>
            <input
              id="photo-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoChange}
            />
          </div>

          <Separator />

          <FieldGroup>
            <div className="grid gap-4 lg:grid-cols-2">
              <Field>
                <FieldLabel>Name</FieldLabel>
                <FieldContent>
                  <Input
                    value={therapist.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                  />
                </FieldContent>
              </Field>
              <Field>
                <FieldLabel>Email</FieldLabel>
                <FieldContent>
                  <Input
                    type="email"
                    value={therapist.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                  />
                </FieldContent>
              </Field>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <Field>
                <FieldLabel>Password</FieldLabel>
                <FieldContent>
                  <Input
                    type="password"
                    value={therapist.password}
                    placeholder="Enter new password to change"
                    onChange={(e) => handleChange("password", e.target.value)}
                  />
                  <FieldDescription>
                    Kosongkan jika tidak ingin mengganti password.
                  </FieldDescription>
                </FieldContent>
              </Field>
              <Field>
                <FieldLabel>Experience (yrs)</FieldLabel>
                <FieldContent>
                  <Input
                    value={therapist.experience}
                    onChange={(e) => handleChange("experience", e.target.value)}
                  />
                </FieldContent>
              </Field>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <Field>
                <FieldLabel>Phone Number</FieldLabel>
                <FieldContent>
                  <Input
                    value={therapist.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                  />
                </FieldContent>
              </Field>
              <Field>
                <FieldLabel>Status</FieldLabel>
                <FieldContent className="flex items-center gap-3">
                  <Checkbox
                    checked={activeStatus}
                    onCheckedChange={(checked) => setActiveStatus(Boolean(checked))}
                  />
                  <span className="text-sm">
                    {activeStatus ? "Active" : "Inactive"}
                  </span>
                </FieldContent>
              </Field>
            </div>
          </FieldGroup>
        </CardContent>
      </Card>

      )}
      {isAuthenticated && (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Create User</CardTitle>
            <CardDescription>Tambahkan user baru untuk akses dashboard.</CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <div className="grid gap-4 lg:grid-cols-2">
                <Field>
                  <FieldLabel>Name</FieldLabel>
                  <FieldContent>
                    <Input
                      value={accountForm.name}
                      onChange={(e) => setAccountForm((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="Nama lengkap"
                    />
                  </FieldContent>
                </Field>
                <Field>
                  <FieldLabel>Email</FieldLabel>
                  <FieldContent>
                    <Input
                      type="email"
                      value={accountForm.email}
                      onChange={(e) =>
                        setAccountForm((prev) => ({ ...prev, email: e.target.value }))
                      }
                      placeholder="email@contoh.com"
                    />
                  </FieldContent>
                </Field>
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                <Field>
                  <FieldLabel>Password</FieldLabel>
                  <FieldContent>
                    <Input
                      type="password"
                      value={accountForm.password}
                      onChange={(e) =>
                        setAccountForm((prev) => ({ ...prev, password: e.target.value }))
                      }
                      placeholder="Password"
                    />
                  </FieldContent>
                </Field>
                <Field>
                  <FieldLabel>Confirm Password</FieldLabel>
                  <FieldContent>
                    <Input
                      type="password"
                      value={accountForm.confirmPassword}
                      onChange={(e) =>
                        setAccountForm((prev) => ({ ...prev, confirmPassword: e.target.value }))
                      }
                      placeholder="Ulangi password"
                    />
                  </FieldContent>
                </Field>
              </div>
            </FieldGroup>
            <div className="mt-4 flex items-center gap-2">
              <Button
                type="button"
                onClick={async () => {
                  setAccountSaving(true);
                  try {
                    const name = accountForm.name.trim();
                    const email = accountForm.email.trim().toLowerCase();
                    const password = accountForm.password;

                    if (!name || !email || !password) {
                      toast.error("Nama, email, dan password wajib diisi");
                      return;
                    }
                    if (accountForm.password !== accountForm.confirmPassword) {
                      toast.error("Password tidak sama");
                      return;
                    }
                    const res = await fetch("/api/auth/users", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        name,
                        email,
                        password,
                      }),
                    });
                    const payload = await res.json();
                    if (!res.ok) {
                      toast.error(payload?.message || "Gagal membuat user");
                      return;
                    }
                    toast.success("User berhasil dibuat");
                    setAccountForm({ name: "", email: "", password: "", confirmPassword: "" });
                  } catch (err) {
                    console.error(err);
                    toast.error("Server error");
                  } finally {
                    setAccountSaving(false);
                  }
                }}
                disabled={accountSaving}
              >
                {accountSaving ? "Creating..." : "Create User"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
