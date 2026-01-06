"use client"

import * as React from "react"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { IconCircleCheckFilled, IconLoader, IconDotsVertical } from "@tabler/icons-react"

interface BookingMainProps<T> {
  table: any
}

export function BookingMain<T>({ table }: BookingMainProps<T>) {
  return (
    <div className="overflow-hidden rounded-lg border">
      <Table>
        <TableHeader className="bg-muted sticky top-0 z-10">
          {table.getHeaderGroups().map((hg: any) => (
            <TableRow key={hg.id}>
              {hg.headers.map((h: any) => (
                <TableHead key={h.id} colSpan={h.colSpan}>
                  {h.isPlaceholder ? null : h.column.columnDef.header}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>

        <TableBody>
          {table.getRowModel().rows.length ? (
            table.getRowModel().rows.map((row: any) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell: any) => (
                  <TableCell key={cell.id} className="align-middle">
                    {cell.column.id === "status" ? (
                      <Badge variant="outline" className="flex items-center gap-1">
                        {row.original.status === "Done" || row.original.status === "Completed" ? (
                          <IconCircleCheckFilled className="w-4 h-4 fill-green-500 dark:fill-green-400" />
                        ) : (
                          <IconLoader className="w-4 h-4 animate-spin" />
                        )}
                        {row.original.status}
                      </Badge>
                    ) : cell.column.id === "actions" ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="text-muted-foreground hover:text-black dark:hover:text-white">
                            <IconDotsVertical />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>View</DropdownMenuItem>
                          <DropdownMenuItem>Edit</DropdownMenuItem>
                          <DropdownMenuItem>Reschedule</DropdownMenuItem>
                          <DropdownMenuItem>Cancel</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : (
                      cell.getValue()
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={table.getAllColumns().length} className="h-24 text-center">
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
