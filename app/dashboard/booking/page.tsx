"use client"

import * as React from "react"
import data from "../data.json"
import { BookingHeading } from "@/components/booking/booking-heading"
import { BookingMain } from "@/components/booking/booking-main"
import { BookingFooter } from "@/components/booking/booking-footer"
import { useReactTable, getCoreRowModel, getFilteredRowModel, getSortedRowModel, getPaginationRowModel, type ColumnDef } from "@tanstack/react-table"

export default function BookingPage() {
  const [globalFilter, setGlobalFilter] = React.useState("")

  const columns: any[] = [
  { accessorKey: "customer", header: "Customer" },
  { accessorKey: "service", header: "Service" },
  { accessorKey: "datetime", header: "Date & Time" },
  { accessorKey: "status", header: "Status" },
  { accessorKey: "therapist", header: "Therapist" },
  { id: "actions", header: "" }, // kolom titik tiga vertikal
]



  const table = useReactTable({
    data,
    columns,
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 lg:p-6">
      <BookingHeading table={table} globalFilter={globalFilter} setGlobalFilter={setGlobalFilter} />
      <BookingMain table={table} />
      <BookingFooter table={table} />
    </div>
  )
}
