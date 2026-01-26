"use client"

import * as React from "react"

import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useLocation } from "./location-context"

export function LocationSwitcher() {
  const { locations, selectedLocationId, setSelectedLocationId } = useLocation()

  if (locations.length === 0) {
    return (
      <Badge variant="outline" className="text-xs">
        Belum ada lokasi
      </Badge>
    )
  }

  return (
    <Select
      value={selectedLocationId ?? ""}
      onValueChange={(value) => setSelectedLocationId(value)}
    >
      <SelectTrigger className="h-8 w-[200px] text-xs">
        <SelectValue placeholder="Pilih lokasi" />
      </SelectTrigger>
      <SelectContent>
        {locations.map((location) => (
          <SelectItem key={location.id} value={location.id}>
            {location.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
