import { MongoClient } from "mongodb"

type MongoGlobals = {
  client?: MongoClient
  promise?: Promise<MongoClient>
}

const globalState = globalThis as typeof globalThis & { __mongo__?: MongoGlobals }

const getMongoUri = () => {
  const uri = process.env.MONGODB_URI
  if (!uri) {
    throw new Error("MONGODB_URI is not set")
  }
  return uri
}

const getDbNameFromUri = (uri: string) => {
  try {
    const url = new URL(uri)
    const pathname = url.pathname.replace(/^\//, "")
    return pathname || undefined
  } catch {
    return undefined
  }
}

export const getMongoClient = async () => {
  const uri = getMongoUri()
  if (!globalState.__mongo__) {
    globalState.__mongo__ = {}
  }
  if (!globalState.__mongo__.client) {
    if (!globalState.__mongo__.promise) {
      const client = new MongoClient(uri)
      globalState.__mongo__.promise = client.connect()
    }
    globalState.__mongo__.client = await globalState.__mongo__.promise
  }
  return globalState.__mongo__.client
}

export const getMongoDb = async () => {
  const uri = getMongoUri()
  const dbName = process.env.MONGODB_DB || getDbNameFromUri(uri) || "booking_spa"
  const client = await getMongoClient()
  return client.db(dbName)
}
