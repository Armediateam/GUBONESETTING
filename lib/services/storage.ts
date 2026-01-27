import crypto from "crypto"
import path from "path"

import { readJson, writeJsonAtomic } from "@/lib/storage/json"
import type { ServiceInput, ServiceRecord, ServiceUpdateInput } from "./schema"
import { serviceSchema, serviceUpdateSchema } from "./schema"

const dataDir = path.join(process.cwd(), "data")
const servicesPath = path.join(dataDir, "services.json")

export const readServices = async (): Promise<ServiceRecord[]> => {
  const services = await readJson<ServiceRecord[]>(servicesPath, [])
  if (services.length === 0) {
    return services
  }
  const seen = new Set<string>()
  let hasDuplicates = false
  const next = services.map((service) => {
    if (!seen.has(service.id)) {
      seen.add(service.id)
      return service
    }
    hasDuplicates = true
    return {
      ...service,
      id: crypto.randomUUID(),
    }
  })
  if (hasDuplicates) {
    await writeServices(next)
  }
  return next
}

export const writeServices = async (services: ServiceRecord[]) => {
  await writeJsonAtomic(servicesPath, services)
}

export const createService = async (input: ServiceInput) => {
  const parsed = serviceSchema.safeParse(input)
  if (!parsed.success) {
    throw parsed.error
  }
  const now = new Date().toISOString()
  const services = await readServices()
  const service: ServiceRecord = {
    id: crypto.randomUUID(),
    ...parsed.data,
    durationMins: parsed.data.durationMins ?? undefined,
    isActive: parsed.data.isActive ?? true,
    createdAt: now,
    updatedAt: now,
  }
  services.push(service)
  await writeServices(services)
  return service
}

export const updateService = async (id: string, input: ServiceUpdateInput) => {
  const parsed = serviceUpdateSchema.safeParse(input)
  if (!parsed.success) {
    throw parsed.error
  }
  const services = await readServices()
  const index = services.findIndex((service) => service.id === id)
  if (index === -1) {
    return null
  }
  const updated: ServiceRecord = {
    ...services[index],
    ...parsed.data,
    durationMins:
      parsed.data.durationMins === undefined ? services[index].durationMins : parsed.data.durationMins,
    isActive: parsed.data.isActive ?? services[index].isActive,
    updatedAt: new Date().toISOString(),
  }
  services[index] = updated
  await writeServices(services)
  return updated
}

export const deleteService = async (id: string) => {
  const services = await readServices()
  const index = services.findIndex((service) => service.id === id)
  if (index === -1) {
    return null
  }
  const [removed] = services.splice(index, 1)
  await writeServices(services)
  return removed
}
