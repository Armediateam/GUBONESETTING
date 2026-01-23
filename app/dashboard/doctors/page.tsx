"use client";

import { useState } from "react";
import { DoctorHeading } from "@/components/doctors/doctor-heading";
import { DoctorMain } from "@/components/doctors/doctor-main";
import { DoctorFooter } from "@/components/doctors/doctor-footer";

// tipe kolom spesifik
type Columns = {
  name: boolean;
  email: boolean;
  password: boolean;
  status: boolean;
  patients: boolean;
  experience: boolean;
  actions: boolean;
};

export default function TherapistsPage() {
  const [refresh, setRefresh] = useState(0);
  const [search, setSearch] = useState("");

  const [visibleColumns, setVisibleColumns] = useState<Columns>({
    name: true,
    email: true,
    password: true,
    status: true,
    patients: true,
    experience: true,
    actions: true,
  });

  return (
    <div className="flex flex-col gap-4 my-4 mx-4 lg:mx-6">
      <DoctorHeading
        onAddDoctor={() => setRefresh(r => r + 1)}
        search={search}
        setSearch={setSearch}
        visibleColumns={visibleColumns}
        setVisibleColumns={setVisibleColumns} // tipe sekarang sesuai Columns
      />
      <DoctorMain
        refresh={refresh}
        search={search}
        visibleColumns={visibleColumns}
      />
      <DoctorFooter />
    </div>
  );
}
