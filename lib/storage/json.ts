import { promises as fs } from "fs"
import path from "path"

import { getMongoDb } from "@/lib/storage/mongo"

type ReadOptions<T> = {
  seed?: T
}

const isMongoEnabled = () => Boolean(process.env.MONGODB_URI)

const stripMongoId = <T>(doc: T) => {
  if (!doc || typeof doc !== "object") {
    return doc
  }
  const { _id: _ignored, ...rest } = doc as { _id?: unknown }
  return rest as T
}

const collectionNameFromPath = (filePath: string) => {
  const filename = path.basename(filePath)
  return filename.replace(/\.json$/i, "")
}

const readFromMongo = async <T>(filePath: string, fallback: T, options?: ReadOptions<T>) => {
  const db = await getMongoDb()
  const collection = db.collection(collectionNameFromPath(filePath))
  const docs = await collection.find({}).toArray()
  if (docs.length > 0) {
    return docs.map((doc) => stripMongoId(doc)) as T
  }
  try {
    const raw = await fs.readFile(filePath, "utf8")
    const parsed = JSON.parse(raw) as T
    if (Array.isArray(parsed)) {
      if (parsed.length > 0) {
        await collection.insertMany(parsed as Record<string, unknown>[])
      }
    } else {
      await collection.insertOne(parsed as Record<string, unknown>)
    }
    return parsed
  } catch {
    // ignore filesystem migration errors
  }
  if (options?.seed !== undefined) {
    const seed = options.seed
    if (Array.isArray(seed)) {
      if (seed.length > 0) {
        await collection.insertMany(seed as Record<string, unknown>[])
      }
    } else {
      await collection.insertOne(seed as Record<string, unknown>)
    }
    return seed
  }
  return fallback
}

const writeToMongo = async <T>(filePath: string, data: T) => {
  const db = await getMongoDb()
  const collection = db.collection(collectionNameFromPath(filePath))
  await collection.deleteMany({})
  if (Array.isArray(data)) {
    if (data.length > 0) {
      await collection.insertMany(data as Record<string, unknown>[])
    }
    return
  }
  await collection.insertOne(data as Record<string, unknown>)
}

const ensureDir = async (filePath: string) => {
  const dir = path.dirname(filePath)
  await fs.mkdir(dir, { recursive: true })
}

export async function readJson<T>(filePath: string, fallback: T, options?: ReadOptions<T>) {
  if (isMongoEnabled()) {
    return readFromMongo(filePath, fallback, options)
  }
  await ensureDir(filePath)
  try {
    const raw = await fs.readFile(filePath, "utf8")
    return JSON.parse(raw) as T
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code
    if (code && code !== "ENOENT") {
      console.error("Failed to read", filePath, error)
    }
    if (code === "ENOENT" && options?.seed !== undefined) {
      await writeJsonAtomic(filePath, options.seed)
      return options.seed
    }
    return fallback
  }
}

export async function writeJsonAtomic<T>(filePath: string, data: T) {
  if (isMongoEnabled()) {
    await writeToMongo(filePath, data)
    return
  }
  await ensureDir(filePath)
  const tempPath = `${filePath}.tmp`
  await fs.writeFile(tempPath, JSON.stringify(data, null, 2), "utf8")
  await fs.rm(filePath, { force: true })
  await fs.rename(tempPath, filePath)
}
