import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET!

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email dan password wajib diisi" },
        { status: 400 }
      )
    }

    const client = await clientPromise
    const db = client.db("bookingdb")

    const user = await db.collection("users").findOne({ email })

    if (!user) {
      return NextResponse.json(
        { message: "Email atau password salah" },
        { status: 401 }
      )
    }

    const isValid = await bcrypt.compare(password, user.password)

    if (!isValid) {
      return NextResponse.json(
        { message: "Email atau password salah" },
        { status: 401 }
      )
    }

    const token = jwt.sign(
      {
        userId: user._id.toString(),
        email: user.email,
        name: user.name, // ✅ WAJIB
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    )

    // ✅ SET COOKIE VIA RESPONSE (PALING AMAN)
    const res = NextResponse.json({ message: "Login berhasil" })

    res.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    })

    return res
  } catch (error) {
    console.error("LOGIN ERROR:", error)
    return NextResponse.json(
      { message: "Terjadi kesalahan server" },
      { status: 500 }
    )
  }
}
