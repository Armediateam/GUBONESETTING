"use client"

import * as React from "react"

import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useLocation } from "./location-context"

export function LocationSwitcher() {
  const { locations, selectedLocationId, setSelectedLocationId } = useLocation()
  const activeLocations = locations.filter((location) => location.isActive)

  if (locations.length === 0) {
    return (
      <Badge variant="outline" className="text-xs">
        No positions
      </Badge>
    )
  }

  if (activeLocations.length === 0) {
    return (
      <Badge variant="outline" className="text-xs">
        No active positions
      </Badge>
    )
  }

  return (
    <Select
      value={selectedLocationId ?? ""}
      onValueChange={(value) => setSelectedLocationId(value)}
    >
      <SelectTrigger className="h-8 w-[220px] text-xs">
        <SelectValue placeholder="Select position" />
      </SelectTrigger>
      <SelectContent>
        {activeLocations.map((location) => (
          <SelectItem key={location.id} value={location.id}>
            {location.city ?? location.name ?? "Position"}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
