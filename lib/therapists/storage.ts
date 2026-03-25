import crypto from "crypto"
import path from "path"

import { readJson, writeJsonAtomic } from "@/lib/storage/json"
import { therapistSchema, therapistUpdateSchema } from "./schema"
import type {
  TherapistInput,
  TherapistRecord,
  TherapistServiceRate,
  TherapistUpdateInput,
} from "./schema"

const dataDir = path.join(process.cwd(), "data")
const therapistsPath = path.join(dataDir, "therapists.json")

const normalizeServiceRates = (serviceRates: unknown): TherapistServiceRate[] => {
  if (!Array.isArray(serviceRates)) {
    return []
  }

  const seen = new Set<string>()

  return serviceRates.flatMap((item) => {
    if (!item || typeof item !== "object") {
      return []
    }

    const candidate = item as { serviceId?: unknown; price?: unknown }
    const serviceId = typeof candidate.serviceId === "string" ? candidate.serviceId.trim() : ""
    const price =
      typeof candidate.price === "number"
        ? candidate.price
        : typeof candidate.price === "string" && candidate.price.trim()
          ? Number(candidate.price)
          : NaN

    if (!serviceId || Number.isNaN(price) || price < 0 || seen.has(serviceId)) {
      return []
    }

    seen.add(serviceId)
    return [{ serviceId, price }]
  })
}

const normalizeTherapistRecord = (
  therapist: Partial<TherapistRecord> & { id?: string; name?: string }
): TherapistRecord => {
  const now = new Date().toISOString()

  return {
    id: therapist.id ?? crypto.randomUUID(),
    name: therapist.name ?? "",
    gender: therapist.gender === "Female" || therapist.gender === "Male" ? therapist.gender : undefined,
    age: typeof therapist.age === "number" ? therapist.age : undefined,
    serviceRates: normalizeServiceRates(therapist.serviceRates),
    isActive: therapist.isActive ?? true,
    createdAt: therapist.createdAt ?? now,
    updatedAt: therapist.updatedAt ?? therapist.createdAt ?? now,
  }
}

export const readTherapists = async (): Promise<TherapistRecord[]> => {
  const therapists = await readJson<
    Array<Partial<TherapistRecord> & { id?: string; name?: string }>
  >(therapistsPath, [])

  return therapists.map((therapist) => normalizeTherapistRecord(therapist))
}

export const writeTherapists = async (therapists: TherapistRecord[]) => {
  await writeJsonAtomic(therapistsPath, therapists)
}

export const createTherapist = async (input: TherapistInput) => {
  const parsed = therapistSchema.safeParse(input)
  if (!parsed.success) {
    throw parsed.error
  }
  const now = new Date().toISOString()
  const therapists = await readTherapists()
  const therapist: TherapistRecord = {
    id: crypto.randomUUID(),
    ...parsed.data,
    createdAt: now,
    updatedAt: now,
  }
  therapists.push(therapist)
  await writeTherapists(therapists)
  return therapist
}

export const updateTherapist = async (id: string, input: TherapistUpdateInput) => {
  const parsed = therapistUpdateSchema.safeParse(input)
  if (!parsed.success) {
    throw parsed.error
  }
  const therapists = await readTherapists()
  const index = therapists.findIndex((therapist) => therapist.id === id)
  if (index === -1) {
    return null
  }
  const updated: TherapistRecord = {
    ...therapists[index],
    ...parsed.data,
    updatedAt: new Date().toISOString(),
  }
  therapists[index] = updated
  await writeTherapists(therapists)
  return updated
}

export const toggleTherapistActive = async (id: string, isActive: boolean) => {
  const therapists = await readTherapists()
  const index = therapists.findIndex((therapist) => therapist.id === id)
  if (index === -1) {
    return null
  }
  const updated: TherapistRecord = {
    ...therapists[index],
    isActive,
    updatedAt: new Date().toISOString(),
  }
  therapists[index] = updated
  await writeTherapists(therapists)
  return updated
}

export const deleteTherapist = async (id: string) => {
  const therapists = await readTherapists()
  const index = therapists.findIndex((therapist) => therapist.id === id)
  if (index === -1) {
    return null
  }
  const [removed] = therapists.splice(index, 1)
  await writeTherapists(therapists)
  return removed
}
