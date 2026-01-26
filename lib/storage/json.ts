import { promises as fs } from "fs"
import path from "path"

type ReadOptions<T> = {
  seed?: T
}

const ensureDir = async (filePath: string) => {
  const dir = path.dirname(filePath)
  await fs.mkdir(dir, { recursive: true })
}

export async function readJson<T>(filePath: string, fallback: T, options?: ReadOptions<T>) {
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
  await ensureDir(filePath)
  const tempPath = `${filePath}.tmp`
  await fs.writeFile(tempPath, JSON.stringify(data, null, 2), "utf8")
  await fs.rm(filePath, { force: true })
  await fs.rename(tempPath, filePath)
}
