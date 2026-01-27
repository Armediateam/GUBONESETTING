"use client";

import { useState } from "react";
import { TherapistHeading } from "@/components/therapists/therapist-heading";
import { TherapistMain } from "@/components/therapists/therapist-main";
import { TherapistFooter } from "@/components/therapists/therapist-footer";

// tipe kolom spesifik
type Columns = {
  name: boolean;
  price: boolean;
};

export default function TherapistsPage() {
  const [search, setSearch] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const [visibleColumns, setVisibleColumns] = useState<Columns>({
    name: true,
    price: true,
  });

  return (
    <div className="flex flex-col gap-4 my-4 mx-4 lg:mx-6">
      <TherapistHeading
        onAddTherapist={() => setRefreshKey((prev) => prev + 1)}
        search={search}
        setSearch={setSearch}
        visibleColumns={visibleColumns}
        setVisibleColumns={setVisibleColumns} // tipe sekarang sesuai Columns
      />
      <TherapistMain
        search={search}
        visibleColumns={visibleColumns}
        refreshKey={refreshKey}
      />
      <TherapistFooter />
    </div>
  );
}
