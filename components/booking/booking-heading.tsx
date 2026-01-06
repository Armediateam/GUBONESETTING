"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem } from "@/components/ui/dropdown-menu"
import { IconPlus, IconLayoutColumns } from "@tabler/icons-react"
import { Table } from "@tanstack/react-table"

interface BookingHeadingProps<T> {
  table: Table<T>
  globalFilter: string
  setGlobalFilter: (value: string) => void
}

export function BookingHeading<T>({ table, globalFilter, setGlobalFilter }: BookingHeadingProps<T>) {
  return (
    <div className="flex items-center justify-between mb-2">
      <div className="flex w-full max-w-[250px]">
        <Input
          placeholder="Search..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
        />
      </div>

      <div className="flex items-center gap-2">
        <Button size="sm" className="flex items-center gap-1">
          <IconPlus className="w-4 h-4 sm" /> Add Booking
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="flex items-center gap-1">
              <IconLayoutColumns className="w-4 h-4" /> <span className="hidden lg:inline">Customize Columns</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {table.getAllColumns()
              .filter(c => c.getCanHide())
              .map(c => (
                <DropdownMenuCheckboxItem
                  key={c.id}
                  checked={c.getIsVisible()}
                  onCheckedChange={v => c.toggleVisibility(!!v)}
                >
                  {c.id}
                </DropdownMenuCheckboxItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
