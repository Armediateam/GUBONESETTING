import clientPromise from "@/lib/mongodb"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET!

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json()

    if (!name || !email || !password) {
      return Response.json(
        { message: "Data tidak lengkap" },
        { status: 400 }
      )
    }

    const client = await clientPromise
    const db = client.db("bookingdb")

    const existingUser = await db.collection("users").findOne({ email })
    if (existingUser) {
      return Response.json(
        { message: "Email sudah terdaftar" },
        { status: 409 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const result = await db.collection("users").insertOne({
      name,
      email,
      password: hashedPassword,
      createdAt: new Date(),
    })

    // 🔐 generate JWT
    const token = jwt.sign(
      {
        userId: result.insertedId,
        email,
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    )

    return Response.json(
      {
        message: "Register berhasil",
        token,
      },
      { status: 201 }
    )
  } catch (error) {
    return Response.json(
      { message: "Server error" },
      { status: 500 }
    )
  }
}
