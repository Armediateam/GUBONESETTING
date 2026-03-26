import { NextResponse, type NextRequest } from "next/server"

import { getAuthApiErrorMessage } from "@/lib/auth/api-errors"
import { verifyToken } from "@/lib/auth/jwt"
import { deleteUser, findUserById, updateUser } from "@/lib/auth/users"

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

export async function GET(request: NextRequest) {
  try {
    const token = getToken(request)
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }
    const payload = verifyToken(token)
    const user = await findUserById(payload.sub)
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }
    return NextResponse.json({
      id: user._id?.toString() ?? "",
      name: user.name,
      email: user.email,
      phone: user.phone ?? "",
      status: user.status,
      experience: user.experience ?? 0,
      photo: user.photo ?? "",
    })
  } catch (error) {
    console.error("Failed to load profile", error)
    return NextResponse.json(
      { message: getAuthApiErrorMessage(error) },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const token = getToken(request)
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }
    const payload = verifyToken(token)
    const body = await request.json()
    const now = new Date().toISOString()

    const updates: Record<string, unknown> = {
      updatedAt: now,
    }

    if (typeof body?.name === "string") updates.name = body.name
    if (typeof body?.email === "string") updates.email = body.email
    if (typeof body?.phone === "string") updates.phone = body.phone
    if (typeof body?.status === "string") updates.status = body.status
    if (typeof body?.experience === "number") updates.experience = body.experience
    if (typeof body?.photo === "string") updates.photo = body.photo

    if (typeof body?.password === "string" && body.password) {
      const bcrypt = await import("bcryptjs")
      updates.passwordHash = await bcrypt.hash(body.password, 10)
    }

    const updated = await updateUser(payload.sub, updates)
    if (!updated) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }

    return NextResponse.json({
      id: updated._id?.toString() ?? "",
      name: updated.name,
      email: updated.email,
      phone: updated.phone ?? "",
      status: updated.status,
      experience: updated.experience ?? 0,
      photo: updated.photo ?? "",
    })
  } catch (error) {
    console.error("Failed to update profile", error)
    return NextResponse.json(
      { message: getAuthApiErrorMessage(error) },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const token = getToken(request)
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const payload = verifyToken(token)
    const user = await findUserById(payload.sub)
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }

    const deleted = await deleteUser(payload.sub)
    if (!deleted) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }

    const response = NextResponse.json({ ok: true })
    response.cookies.set("auth_token", "", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    })
    return response
  } catch (error) {
    console.error("Failed to delete profile", error)
    return NextResponse.json(
      { message: getAuthApiErrorMessage(error) },
      { status: 500 }
    )
  }
}
