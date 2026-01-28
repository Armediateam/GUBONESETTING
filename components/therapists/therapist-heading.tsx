"use client";

import * as React from "react";
import { IconLayoutColumns } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem } from "@/components/ui/dropdown-menu";
import { AddTherapistDialog } from "../add-therapist-dialog";

// gunakan tipe Columns yang sama
type Columns = {
  name: boolean;
  price: boolean;
  active: boolean;
};

interface TherapistHeadingProps {
  onAddTherapist?: () => void;
  search: string;
  setSearch: (value: string) => void;
  visibleColumns: Columns;
  setVisibleColumns: React.Dispatch<React.SetStateAction<Columns>>; // sesuai useState
}

export function TherapistHeading({
  onAddTherapist,
  search,
  setSearch,
  visibleColumns,
  setVisibleColumns,
}: TherapistHeadingProps) {
  const toggleColumn = (col: keyof Columns) => {
    setVisibleColumns(prev => ({
      ...prev,
      [col]: !prev[col],
    }));
  };

  return (
    <div className="flex items-center justify-between mb-2">
      <input
        placeholder="Search therapists..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="border rounded px-2 py-1 w-[300px] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      <div className="flex gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <IconLayoutColumns />
              <span className="hidden lg:inline ml-2">Customize Columns</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {(Object.keys(visibleColumns) as (keyof Columns)[]).map((col) => (
              <DropdownMenuCheckboxItem
                key={col}
                checked={visibleColumns[col]}
                onCheckedChange={() => toggleColumn(col)}
              >
                {col.charAt(0).toUpperCase() + col.slice(1)}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <AddTherapistDialog onSuccess={onAddTherapist} />
      </div>
    </div>
  );
}
