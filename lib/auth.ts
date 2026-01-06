import { cookies } from "next/headers"
import jwt from "jsonwebtoken"
import { redirect } from "next/navigation"

const JWT_SECRET = process.env.JWT_SECRET!

type AuthUser = {
  name: string
  email: string
  avatar: string
}

export async function requireAuth(): Promise<AuthUser> {
  // ✅ WAJIB await
  const cookieStore = await cookies()
  const token = cookieStore.get("token")?.value

  if (!token) redirect("/login")

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      name: string
      email: string
    }

    return {
      name: decoded.name,
      email: decoded.email,
      avatar: "/avatars/default.jpg",
    }
  } catch {
    redirect("/login")
  }
}
