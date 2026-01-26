"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface AddTherapistDialogProps {
  onSuccess?: () => void; // dipanggil setelah therapist berhasil ditambahkan
}

export function AddTherapistDialog({ onSuccess }: AddTherapistDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [experience, setExperience] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [active, setActive] = React.useState(true);
  const [loading, setLoading] = React.useState(false);

  // hanya angka untuk experience
  const handleExperienceChange = (value: string) => {
    if (/^\d*$/.test(value)) {
      setExperience(value);
    }
  };

  const handleAdd = async () => {
    setLoading(true);

    try {
      const res = await fetch("/api/therapists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          experience: Number(experience || 0),
          phone,
          isActive: active,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Terjadi kesalahan");
        setLoading(false);
        return;
      }

      toast.success("Therapist berhasil ditambahkan!");

      // reset form
      setOpen(false);
      setName(""); setEmail(""); setExperience(""); setPhone(""); setActive(true);

      // trigger refresh parent
      onSuccess?.();
    } catch (err) {
      console.error(err);
      toast.error("Server error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1">
          Add Therapists
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add New Therapist</DialogTitle>
          <DialogDescription>
            Fill in the details to add a new therapist.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-1">
            <Label>Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Therapist Name"
            />
          </div>

          <div className="grid gap-1">
            <Label>Email</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="therapist@example.com"
            />
          </div>

          <div className="grid gap-1">
            <Label>Experience (yrs)</Label>
            <Input
              value={experience}
              onChange={(e) => handleExperienceChange(e.target.value)}
              placeholder="Experience in years"
            />
          </div>

          <div className="grid gap-1">
            <Label>Phone Number</Label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Phone Number"
            />
          </div>

          <div className="grid gap-1">
            <Label>Status</Label>
            <Select value={active ? "active" : "inactive"} onValueChange={(value) => setActive(value === "active")}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleAdd} disabled={loading}>
            {loading ? "Adding..." : "Add Therapist"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
