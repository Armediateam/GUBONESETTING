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
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface AddTherapistDialogProps {
  onSuccess?: () => void; // dipanggil setelah therapist berhasil ditambahkan
}

export function AddTherapistDialog({ onSuccess }: AddTherapistDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [price, setPrice] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const handlePriceChange = (value: string) => {
    if (/^\d*$/.test(value)) {
      setPrice(value);
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
          price: Number(price || 0),
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
      setName(""); setPrice("");

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
            <Label>Therapist Price (IDR)</Label>
            <Input
              type="number"
              value={price}
              onChange={(e) => handlePriceChange(e.target.value)}
              placeholder="250000"
            />
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
