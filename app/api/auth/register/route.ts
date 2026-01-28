import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"

import { signToken } from "@/lib/auth/jwt"
import { createUser, findUserByEmail } from "@/lib/auth/users"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const name = String(body?.name ?? "").trim()
    const email = String(body?.email ?? "").trim().toLowerCase()
    const password = String(body?.password ?? "")
    if (!name || !email || !password) {
      return NextResponse.json(
        { message: "Name, email, and password are required" },
        { status: 400 }
      )
    }

    const existing = await findUserByEmail(email)
    if (existing) {
      return NextResponse.json({ message: "Email already registered" }, { status: 409 })
    }

    const now = new Date().toISOString()
    const passwordHash = await bcrypt.hash(password, 10)
    const user = await createUser({
      name,
      email,
      passwordHash,
      status: "Active",
      createdAt: now,
      updatedAt: now,
    })

    const token = signToken({ sub: user._id?.toString() ?? "", email })
    const response = NextResponse.json({
      token,
      user: {
        id: user._id?.toString() ?? "",
        name: user.name,
        email: user.email,
        phone: user.phone ?? "",
        status: user.status,
      },
    })
    response.cookies.set("auth_token", token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    })
    return response
  } catch (error) {
    console.error("Failed to register", error)
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}
