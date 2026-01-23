"use client";

import * as React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Doctor {
  id: string;
  name: string;
  email: string;
  password?: string;
  status?: string;
  patients?: number;
  experience: number;
}

interface DoctorMainProps {
  search: string;
  visibleColumns: Record<string, boolean>;
}

export function DoctorMain({ search, visibleColumns }: DoctorMainProps) {
  // Simulasi data dokter statis
  const doctors: Doctor[] = [
    { id: "1", name: "Dr. John Doe", email: "john.doe@example.com", password: "••••••••", status: "Active", patients: 120, experience: 5 },
    { id: "2", name: "Dr. Jane Smith", email: "jane.smith@example.com", password: "••••••••", status: "Inactive", patients: 80, experience: 3 },
    { id: "3", name: "Dr. Alice Johnson", email: "alice.johnson@example.com", password: "••••••••", status: "Active", patients: 100, experience: 4 },
  ];

  const filteredDoctors = doctors.filter(
    (d) =>
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="rounded-lg border overflow-hidden">
      <Table>
        <TableHeader className="bg-muted">
          <TableRow>
            {visibleColumns.name && <TableHead>Name</TableHead>}
            {visibleColumns.email && <TableHead>Email</TableHead>}
            {visibleColumns.password && <TableHead>Password</TableHead>}
            {visibleColumns.status && <TableHead>Status</TableHead>}
            {visibleColumns.patients && <TableHead>Patients</TableHead>}
            {visibleColumns.experience && <TableHead>Experience (yrs)</TableHead>}
          </TableRow>
        </TableHeader>

        <TableBody>
          {filteredDoctors.length === 0 ? (
            <TableRow>
              <TableCell colSpan={Object.keys(visibleColumns).length} className="h-24 text-center text-muted-foreground">
                No data found.
              </TableCell>
            </TableRow>
          ) : (
            filteredDoctors.map((doc) => (
              <TableRow key={doc.id}>
                {visibleColumns.name && <TableCell>{doc.name}</TableCell>}
                {visibleColumns.email && <TableCell>{doc.email}</TableCell>}
                {visibleColumns.password && <TableCell>{doc.password}</TableCell>}
                {visibleColumns.status && <TableCell>{doc.status}</TableCell>}
                {visibleColumns.patients && <TableCell>{doc.patients}</TableCell>}
                {visibleColumns.experience && <TableCell>{doc.experience}</TableCell>}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
