import crypto from "crypto"
import path from "path"

import { readJson, writeJsonAtomic } from "@/lib/storage/json"
import { therapistSchema, therapistUpdateSchema } from "./schema"
import type { TherapistInput, TherapistRecord, TherapistUpdateInput } from "./schema"

const dataDir = path.join(process.cwd(), "data")
const therapistsPath = path.join(dataDir, "therapists.json")

export const readTherapists = async (): Promise<TherapistRecord[]> => {
  return readJson<TherapistRecord[]>(therapistsPath, [])
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
