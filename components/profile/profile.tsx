"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";

export default function ProfilePage() {
  const router = useRouter();

  const [doctor, setDoctor] = React.useState({
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
  const [activeStatus, setActiveStatus] = React.useState(true);

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : "";

  React.useEffect(() => {
    if (!token) return;

    const fetchProfile = async () => {
      try {
        const res = await fetch("/api/auth/doctors/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch profile");

        const data = await res.json();
        setDoctor({
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
  }, [token]);

  const handleChange = (key: string, value: string) => {
    setDoctor((prev) => ({ ...prev, [key]: value }));
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setDoctor((prev) => ({ ...prev, photo: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!token) return;
    setSaving(true);
    try {
      const res = await fetch("/api/auth/doctors/me", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: doctor.name,
          email: doctor.email,
          password: doctor.password || undefined,
          experience: Number(doctor.experience),
          phone: doctor.phone,
          status: activeStatus ? "Active" : "Inactive",
          photo: doctor.photo,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || "Gagal update profile");
        return;
      }

      toast.success("Profile berhasil diperbarui!");
      setDoctor((prev) => ({ ...prev, password: "" }));
    } catch (err) {
      console.error(err);
      toast.error("Server error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-center py-10">Loading profile...</div>;

  return (
    <Card className="m-6 p-6 bg-transparent shadow-md w-2xl">
      <div className="flex flex-col items-center gap-4 mb-6">
        <label htmlFor="photo-upload">
          <Avatar className="w-28 h-28 cursor-pointer">
            {doctor.photo ? (
              <AvatarImage src={doctor.photo} alt={doctor.name} />
            ) : (
              <AvatarFallback>{doctor.name.charAt(0)}</AvatarFallback>
            )}
          </Avatar>
        </label>
        <input
          id="photo-upload"
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handlePhotoChange}
        />
        <p className="text-muted-foreground text-sm">Click avatar to change photo</p>
      </div>

      <div className="grid gap-5">
        <div className="grid gap-1">
          <Label>Name</Label>
          <Input value={doctor.name} onChange={(e) => handleChange("name", e.target.value)} />
        </div>

        <div className="grid gap-1">
          <Label>Email</Label>
          <Input type="email" value={doctor.email} onChange={(e) => handleChange("email", e.target.value)} />
        </div>

        <div className="grid gap-1">
          <Label>Password</Label>
          <Input
            type="password"
            value={doctor.password}
            placeholder="Enter new password to change"
            onChange={(e) => handleChange("password", e.target.value)}
          />
        </div>

        <div className="grid gap-1">
          <Label>Experience (yrs)</Label>
          <Input value={doctor.experience} onChange={(e) => handleChange("experience", e.target.value)} />
        </div>

        <div className="grid gap-1">
          <Label>Phone Number</Label>
          <Input value={doctor.phone} onChange={(e) => handleChange("phone", e.target.value)} />
        </div>

        <div className="flex items-center gap-2">
          <Checkbox checked={activeStatus} onCheckedChange={(checked) => setActiveStatus(Boolean(checked))} />
          <Label>Status Active</Label>
        </div>

        <div className="flex gap-3 mt-4">
          <Button onClick={handleSave} disabled={saving} size="sm">
            {saving ? "Saving..." : "Save Changes"}
          </Button>
          <Button variant="destructive" size="sm" onClick={() => router.back()} disabled={saving}>
            Delete Account
          </Button>
        </div>
      </div>
    </Card>
  );
}
