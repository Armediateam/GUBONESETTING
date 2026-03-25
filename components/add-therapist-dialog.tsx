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
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

type ServiceItem = {
  id: string;
  name: string;
  isActive?: boolean;
};

type ServiceRateInput = {
  serviceId: string;
  price: string;
};

interface AddTherapistDialogProps {
  onSuccess?: () => void; // dipanggil setelah therapist berhasil ditambahkan
}

export function AddTherapistDialog({ onSuccess }: AddTherapistDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [gender, setGender] = React.useState("");
  const [age, setAge] = React.useState("");
  const [services, setServices] = React.useState<ServiceItem[]>([]);
  const [serviceRates, setServiceRates] = React.useState<ServiceRateInput[]>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    const loadServices = async () => {
      try {
        const res = await fetch("/api/services");
        if (!res.ok) {
          throw new Error("Failed to load services");
        }
        const payload = await res.json();
        setServices((payload.items ?? []).filter((item: ServiceItem) => item.isActive !== false));
      } catch (error) {
        console.error(error);
        toast.error("Failed to load services");
      }
    };

    loadServices();
  }, []);

  const handleAgeChange = (value: string) => {
    if (/^\d*$/.test(value)) {
      setAge(value);
    }
  };

  const handleServiceCheckedChange = (serviceId: string, checked: boolean) => {
    setServiceRates((prev) => {
      if (checked) {
        if (prev.some((item) => item.serviceId === serviceId)) {
          return prev;
        }
        return [...prev, { serviceId, price: "" }];
      }
      return prev.filter((item) => item.serviceId !== serviceId);
    });
  };

  const handleServicePriceChange = (serviceId: string, value: string) => {
    if (!/^\d*$/.test(value)) {
      return;
    }
    setServiceRates((prev) =>
      prev.map((item) => (item.serviceId === serviceId ? { ...item, price: value } : item))
    );
  };

  const handleAdd = async () => {
    if (!name.trim() || !gender || !age) {
      toast.error("Name, gender, and age are required");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/therapists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          gender,
          age: Number(age),
          serviceRates: serviceRates
            .filter((item) => item.price.trim() !== "")
            .map((item) => ({
              serviceId: item.serviceId,
              price: Number(item.price),
            })),
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
      setName("");
      setGender("");
      setAge("");
      setServiceRates([]);

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
          Add Therapist
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add New Therapist</DialogTitle>
          <DialogDescription>
            Fill in basic therapist details. Service pricing should follow the selected layanan.
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
            <Label>Gender</Label>
            <Select value={gender || undefined} onValueChange={setGender}>
              <SelectTrigger>
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Female">Female</SelectItem>
                <SelectItem value="Male">Male</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-1">
            <Label>Age</Label>
            <Input
              type="number"
              value={age}
              onChange={(e) => handleAgeChange(e.target.value)}
              placeholder="25"
            />
          </div>

          <div className="grid gap-3">
            <div>
              <Label>Services & Prices</Label>
              <p className="text-muted-foreground text-sm">
                Optional. Centang layanan yang dimiliki therapist lalu isi harganya.
              </p>
            </div>
            {services.length === 0 ? (
              <div className="text-muted-foreground rounded-md border border-dashed px-3 py-4 text-sm">
                Belum ada layanan aktif.
              </div>
            ) : (
              <div className="space-y-3 rounded-md border p-3">
                {services.map((service) => {
                  const selected = serviceRates.find((item) => item.serviceId === service.id);

                  return (
                    <div key={service.id} className="grid gap-2 md:grid-cols-[1fr_180px] md:items-center">
                      <label className="flex items-center gap-3">
                        <Checkbox
                          checked={Boolean(selected)}
                          onCheckedChange={(checked) =>
                            handleServiceCheckedChange(service.id, checked === true)
                          }
                        />
                        <span className="text-sm">{service.name}</span>
                      </label>
                      <Input
                        type="number"
                        value={selected?.price ?? ""}
                        onChange={(event) =>
                          handleServicePriceChange(service.id, event.target.value)
                        }
                        placeholder="250000"
                        disabled={!selected}
                      />
                    </div>
                  );
                })}
              </div>
            )}
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
