import bcrypt from "bcryptjs"
import { NextResponse, type NextRequest } from "next/server"

import { getAuthApiErrorMessage } from "@/lib/auth/api-errors"
import { verifyToken } from "@/lib/auth/jwt"
import { createUser, findUserByEmail, findUserById } from "@/lib/auth/users"

const getTokenFromRequest = (request: NextRequest) => {
  const authHeader = request.headers.get("authorization")
  if (!authHeader) return null
  const [type, token] = authHeader.split(" ")
  if (type !== "Bearer" || !token) return null
  return token
}

const getToken = (request: NextRequest) => {
  const headerToken = getTokenFromRequest(request)
  if (headerToken) return headerToken
  return request.cookies.get("auth_token")?.value ?? null
}

export async function POST(request: NextRequest) {
  try {
    const token = getToken(request)
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const payload = verifyToken(token)
    const currentUser = await findUserById(payload.sub)
    if (!currentUser) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

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

    return NextResponse.json(
      {
        user: {
          id: user._id?.toString() ?? "",
          name: user.name,
          email: user.email,
          phone: user.phone ?? "",
          status: user.status,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Failed to create user", error)
    return NextResponse.json(
      { message: getAuthApiErrorMessage(error) },
      { status: 500 }
    )
  }
}
