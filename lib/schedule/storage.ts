import path from "path"

import { defaultSchedule, scheduleSchema, type Schedule, type ScheduleConfig } from "./schema"
import { readJson, writeJsonAtomic } from "@/lib/storage/json"

const dataDir = path.join(process.cwd(), "data")
const schedulesPath = path.join(dataDir, "schedules.json")

export async function readSchedules(): Promise<ScheduleConfig[]> {
  return readJson<ScheduleConfig[]>(schedulesPath, [])
}

export async function readScheduleConfig(
  locationId: string,
  therapistId: string
): Promise<ScheduleConfig | null> {
  const schedules = await readSchedules()
  return (
    schedules.find(
      (item) => item.locationId === locationId && item.therapistId === therapistId
    ) ?? null
  )
}

export async function readSchedule(
  locationId: string,
  therapistId: string
): Promise<Schedule> {
  const match = await readScheduleConfig(locationId, therapistId)
  if (match) {
    const parsed = scheduleSchema.safeParse(match)
    if (parsed.success) {
      return parsed.data
    }
  }
  return defaultSchedule
}

export async function writeSchedule(
  locationId: string,
  therapistId: string,
  schedule: Schedule
): Promise<void> {
  const parsed = scheduleSchema.safeParse(schedule)
  if (!parsed.success) {
    throw new Error("Invalid schedule payload")
  }
  const schedules = await readSchedules()
  const index = schedules.findIndex(
    (item) => item.locationId === locationId && item.therapistId === therapistId
  )
  const next: ScheduleConfig = { ...parsed.data, locationId, therapistId }
  if (index === -1) {
    schedules.push(next)
  } else {
    schedules[index] = next
  }
  await writeJsonAtomic(schedulesPath, schedules)
}
