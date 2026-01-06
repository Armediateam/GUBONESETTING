"use client"

import * as React from "react"
import { z } from "zod"
import { IconCircleCheckFilled, IconLoader } from "@tabler/icons-react"

import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core"
import { restrictToVerticalAxis } from "@dnd-kit/modifiers"
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { IconDotsVertical, IconGripVertical, IconLayoutColumns, IconPlus, IconChevronLeft, IconChevronRight, IconChevronsLeft, IconChevronsRight } from "@tabler/icons-react"
import { flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, useReactTable, type ColumnDef, type ColumnFiltersState, type Row, type SortingState, type VisibilityState } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuCheckboxItem } from "@/components/ui/dropdown-menu"
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Label } from "@/components/ui/label"

export const schema = z.object({
  id: z.number(),
  customer: z.string(),
  service: z.string(),
  datetime: z.string(),
  status: z.string(),
  therapist: z.string(),
  price: z.string(),
})

// Drag handle
function DragHandle({ id }: { id: number }) {
  const { attributes, listeners } = useSortable({ id })
  return (
    <Button {...attributes} {...listeners} variant="ghost" size="icon" className="text-muted-foreground size-7 hover:bg-transparent">
      <IconGripVertical className="text-muted-foreground size-3" />
      <span className="sr-only">Drag to reorder</span>
    </Button>
  )
}

// Table columns
const columns: ColumnDef<z.infer<typeof schema>>[] = [
  { id: "drag", header: () => null, cell: ({ row }) => <DragHandle id={row.original.id} /> },
  { accessorKey: "customer", header: "Customer", cell: ({ row }) => row.original.customer },
  { accessorKey: "service", header: "Service", cell: ({ row }) => <Badge variant="outline" className="px-2">{row.original.service}</Badge> },
  { accessorKey: "datetime", header: "Date & Time", cell: ({ row }) => row.original.datetime },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge
        variant="outline"
        className="text-muted-foreground px-1.5 flex items-center gap-1"
      >
        {row.original.status === "Done" || row.original.status === "Completed" ? (
          <IconCircleCheckFilled className="w-4 h-4 fill-green-500 dark:fill-green-400" />
        ) : (
          <IconLoader className="w-4 h-4 animate-spin" />
        )}
        {row.original.status}
      </Badge>
    )
  },
  { accessorKey: "therapist", header: "Therapist", cell: ({ row }) => row.original.therapist },
  { accessorKey: "price", header: "Price", cell: ({ row }) => `$${row.original.price}` },
  {
    id: "actions", cell: () => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon"><IconDotsVertical /></Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-32">
          <DropdownMenuItem>Edit</DropdownMenuItem>
          <DropdownMenuItem>Cancel</DropdownMenuItem>
          <DropdownMenuItem>Details</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  },
]

// Draggable row
function DraggableRow({ row }: { row: Row<z.infer<typeof schema>> }) {
  const { transform, transition, setNodeRef, isDragging } = useSortable({ id: row.original.id })
  return (
    <TableRow ref={setNodeRef} data-dragging={isDragging} style={{ transform: CSS.Transform.toString(transform), transition }} className="relative z-0 data-[dragging=true]:z-10 data-[dragging=true]:opacity-80" data-state={row.getIsSelected() && "selected"}>
      {row.getVisibleCells().map(cell => (
        <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
      ))}
    </TableRow>
  )
}

// Main DataTable component
export function DataTable({ data: initialData }: { data: z.infer<typeof schema>[] }) {
  const [globalFilter, setGlobalFilter] = React.useState("")
  const [data, setData] = React.useState(() => initialData)
  const [rowSelection, setRowSelection] = React.useState({})
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: 10 })
  const sortableId = React.useId()

  const sensors = useSensors(
    useSensor(MouseSensor), useSensor(TouchSensor), useSensor(KeyboardSensor)
  )

  const dataIds = React.useMemo<UniqueIdentifier[]>(() => data.map(d => d.id), [data])

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
      globalFilter // tambahkan di sini
    },
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    onGlobalFilterChange: setGlobalFilter, // tambahkan ini untuk search bar
    getRowId: row => row.id.toString(),
    enableRowSelection: true,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: (row, columnId, filterValue) => {
      return (
        row.original.customer.toLowerCase().includes(filterValue.toLowerCase()) ||
        row.original.service.toLowerCase().includes(filterValue.toLowerCase()) ||
        row.original.therapist.toLowerCase().includes(filterValue.toLowerCase())
      )
    }
  })



  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (active && over && active.id !== over.id) {
      setData(data => {
        const oldIndex = dataIds.indexOf(active.id)
        const newIndex = dataIds.indexOf(over.id)
        return arrayMove(data, oldIndex, newIndex)
      })
    }
  }

  return (
    <div className="flex flex-col gap-4 mx-6">
      {/* Customize Columns & Search Section */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex justify-between items-center w-[300px]">
          <input
            type="text"
            placeholder="Search..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="border rounded px-2 py-1 w-full focus:outline-none focus:ring focus:ring-blue-300"
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm"><IconLayoutColumns /><span className="hidden lg:inline">Customize Columns</span></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {table.getAllColumns().filter(c => c.getCanHide()).map(c => (
                  <DropdownMenuCheckboxItem key={c.id} checked={c.getIsVisible()} onCheckedChange={v => c.toggleVisibility(!!v)}>{c.id}</DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border">
        <DndContext collisionDetection={closestCenter} modifiers={[restrictToVerticalAxis]} onDragEnd={handleDragEnd} sensors={sensors} id={sortableId}>
          <Table>
            <TableHeader className="bg-muted sticky top-0 z-10">
              {table.getHeaderGroups().map(hg => (
                <TableRow key={hg.id}>
                  {hg.headers.map(h => <TableHead key={h.id} colSpan={h.colSpan}>{h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}</TableHead>)}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.length ? (
                <SortableContext items={dataIds} strategy={verticalListSortingStrategy}>
                  {table.getRowModel().rows.map(row => <DraggableRow key={row.id} row={row} />)}
                </SortableContext>
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">No results.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </DndContext>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-4">
        <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
          {table.getFilteredSelectedRowModel().rows.length} of {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="flex w-full items-center gap-2 lg:w-fit">
          <Button variant="outline" size="icon" onClick={() => table.setPageIndex(0)} disabled={!table.getCanPreviousPage()}><IconChevronsLeft /></Button>
          <Button variant="outline" size="icon" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}><IconChevronLeft /></Button>
          <div className="m-2 text-sm font-medium">Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}</div>
          <Button variant="outline" size="icon" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}><IconChevronRight /></Button>
          <Button variant="outline" size="icon" onClick={() => table.setPageIndex(table.getPageCount() - 1)} disabled={!table.getCanNextPage()}><IconChevronsRight /></Button>
        </div>
      </div>
    </div>
  )
}
