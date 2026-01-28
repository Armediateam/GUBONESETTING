import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"

import { signToken } from "@/lib/auth/jwt"
import { findUserByEmail } from "@/lib/auth/users"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const email = String(body?.email ?? "").trim().toLowerCase()
    const password = String(body?.password ?? "")

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email and password are required" },
        { status: 400 }
      )
    }

    const user = await findUserByEmail(email)
    if (!user) {
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 })
    }

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) {
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 })
    }

    const token = signToken({ sub: user._id?.toString() ?? "", email })
    const response = NextResponse.json({
      token,
      user: {
        id: user._id?.toString() ?? "",
        name: user.name,
        email: user.email,
        phone: user.phone ?? "",
        status: user.status,
        experience: user.experience ?? 0,
        photo: user.photo ?? "",
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
    console.error("Failed to login", error)
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}
