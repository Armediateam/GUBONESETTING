import { ObjectId } from "mongodb"
import { getMongoDb } from "@/lib/storage/mongo"

export type UserRecord = {
  _id?: ObjectId
  name: string
  email: string
  passwordHash: string
  experience?: number
  phone?: string
  status: "Active" | "Inactive"
  photo?: string
  createdAt: string
  updatedAt: string
}

const usersCollection = async () => {
  const db = await getMongoDb()
  return db.collection<UserRecord>("users")
}

export const countUsers = async () => {
  const collection = await usersCollection()
  return collection.countDocuments()
}

export const findUserByEmail = async (email: string) => {
  const collection = await usersCollection()
  return collection.findOne({ email: email.toLowerCase() })
}

export const findUserById = async (id: string) => {
  const collection = await usersCollection()
  return collection.findOne({ _id: new ObjectId(id) })
}

export const createUser = async (input: Omit<UserRecord, "_id">) => {
  const collection = await usersCollection()
  const result = await collection.insertOne(input)
  return { ...input, _id: result.insertedId }
}

export const updateUser = async (id: string, updates: Partial<UserRecord>) => {
  const collection = await usersCollection()
  const _id = new ObjectId(id)
  await collection.updateOne({ _id }, { $set: updates })
  return collection.findOne({ _id })
}
