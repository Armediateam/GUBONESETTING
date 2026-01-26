import path from "path"

import { defaultSchedule, scheduleSchema, type Schedule, type ScheduleConfig } from "./schema"
import { readJson, writeJsonAtomic } from "@/lib/storage/json"

const dataDir = path.join(process.cwd(), "data")
const schedulesPath = path.join(dataDir, "schedules.json")

export async function readSchedules(): Promise<ScheduleConfig[]> {
  return readJson<ScheduleConfig[]>(schedulesPath, [])
}

export async function readSchedule(locationId: string): Promise<Schedule> {
  const schedules = await readSchedules()
  const match = schedules.find((item) => item.locationId === locationId)
  if (match) {
    const parsed = scheduleSchema.safeParse(match)
    if (parsed.success) {
      return parsed.data
    }
  }
  return defaultSchedule
}

export async function writeSchedule(locationId: string, schedule: Schedule): Promise<void> {
  const parsed = scheduleSchema.safeParse(schedule)
  if (!parsed.success) {
    throw new Error("Invalid schedule payload")
  }
  const schedules = await readSchedules()
  const index = schedules.findIndex((item) => item.locationId === locationId)
  const next: ScheduleConfig = { ...parsed.data, locationId }
  if (index === -1) {
    schedules.push(next)
  } else {
    schedules[index] = next
  }
  await writeJsonAtomic(schedulesPath, schedules)
}
