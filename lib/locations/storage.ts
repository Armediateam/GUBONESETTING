import crypto from "crypto"
import path from "path"

import { readJson, writeJsonAtomic } from "@/lib/storage/json"
import type { LocationInput, LocationRecord, LocationUpdateInput } from "./schema"
import { locationSchema, locationUpdateSchema } from "./schema"

const dataDir = path.join(process.cwd(), "data")
const locationsPath = path.join(dataDir, "locations.json")

export const readLocations = async (): Promise<LocationRecord[]> => {
  return readJson<LocationRecord[]>(locationsPath, [])
}

export const writeLocations = async (locations: LocationRecord[]) => {
  await writeJsonAtomic(locationsPath, locations)
}

export const createLocation = async (input: LocationInput) => {
  const parsed = locationSchema.safeParse(input)
  if (!parsed.success) {
    throw parsed.error
  }
  const now = new Date().toISOString()
  const locations = await readLocations()
  const location: LocationRecord = {
    id: crypto.randomUUID(),
    ...parsed.data,
    address: parsed.data.address || undefined,
    city: parsed.data.city || undefined,
    googleMapsUrl: parsed.data.googleMapsUrl || undefined,
    notes: parsed.data.notes || undefined,
    createdAt: now,
    updatedAt: now,
  }
  locations.push(location)
  await writeLocations(locations)
  return location
}

export const updateLocation = async (id: string, input: LocationUpdateInput) => {
  const parsed = locationUpdateSchema.safeParse(input)
  if (!parsed.success) {
    throw parsed.error
  }
  const locations = await readLocations()
  const index = locations.findIndex((location) => location.id === id)
  if (index === -1) {
    return null
  }
  const updated: LocationRecord = {
    ...locations[index],
    ...parsed.data,
    address: parsed.data.address === "" ? undefined : parsed.data.address ?? locations[index].address,
    city: parsed.data.city === "" ? undefined : parsed.data.city ?? locations[index].city,
    googleMapsUrl:
      parsed.data.googleMapsUrl === ""
        ? undefined
        : parsed.data.googleMapsUrl ?? locations[index].googleMapsUrl,
    notes: parsed.data.notes === "" ? undefined : parsed.data.notes ?? locations[index].notes,
    updatedAt: new Date().toISOString(),
  }
  locations[index] = updated
  await writeLocations(locations)
  return updated
}

export const toggleLocationActive = async (id: string, isActive: boolean) => {
  const locations = await readLocations()
  const index = locations.findIndex((location) => location.id === id)
  if (index === -1) {
    return null
  }
  const updated = {
    ...locations[index],
    isActive,
    updatedAt: new Date().toISOString(),
  }
  locations[index] = updated
  await writeLocations(locations)
  return updated
}
