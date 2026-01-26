"use client"

import * as React from "react"
import { toast } from "sonner"

import type { LocationRecord } from "@/lib/locations/schema"

type LocationContextValue = {
  locations: LocationRecord[]
  selectedLocationId: string | null
  selectedLocation: LocationRecord | null
  setSelectedLocationId: (id: string | null) => void
  refresh: () => Promise<void>
}

const LocationContext = React.createContext<LocationContextValue | null>(null)

const STORAGE_KEY = "selectedLocationId"
const COOKIE_KEY = "selectedLocationId"

const setCookie = (value: string) => {
  document.cookie = `${COOKIE_KEY}=${encodeURIComponent(value)}; path=/; max-age=31536000`
}

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [locations, setLocations] = React.useState<LocationRecord[]>([])
  const [selectedLocationId, setSelectedLocationIdState] = React.useState<string | null>(null)

  const loadLocations = React.useCallback(async () => {
    try {
      const res = await fetch("/api/locations")
      if (!res.ok) {
        throw new Error("Failed to load locations")
      }
      const payload = await res.json()
      const items = payload.items ?? []
      setLocations(items)

      const stored = localStorage.getItem(STORAGE_KEY)
      const activeLocations = items.filter((item: LocationRecord) => item.isActive)
      const fallback = activeLocations[0]?.id ?? items[0]?.id ?? null
      const nextId = stored && items.some((item: LocationRecord) => item.id === stored) ? stored : fallback
      setSelectedLocationIdState(nextId)
      if (nextId) {
        localStorage.setItem(STORAGE_KEY, nextId)
        setCookie(nextId)
      }
    } catch (error) {
      console.error(error)
      toast.error("Gagal memuat lokasi")
    }
  }, [])

  React.useEffect(() => {
    loadLocations()
  }, [loadLocations])

  const setSelectedLocationId = React.useCallback((id: string | null) => {
    setSelectedLocationIdState(id)
    if (id) {
      localStorage.setItem(STORAGE_KEY, id)
      setCookie(id)
    } else {
      localStorage.removeItem(STORAGE_KEY)
      setCookie("")
    }
  }, [])

  const selectedLocation =
    selectedLocationId && locations.length > 0
      ? locations.find((item) => item.id === selectedLocationId) ?? null
      : null

  return (
    <LocationContext.Provider
      value={{
        locations,
        selectedLocationId,
        selectedLocation,
        setSelectedLocationId,
        refresh: loadLocations,
      }}
    >
      {children}
    </LocationContext.Provider>
  )
}

export const useLocation = () => {
  const ctx = React.useContext(LocationContext)
  if (!ctx) {
    throw new Error("useLocation must be used within LocationProvider")
  }
  return ctx
}
