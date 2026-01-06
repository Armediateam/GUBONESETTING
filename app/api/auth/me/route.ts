import { cookies } from "next/headers"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET!

export async function GET() {
  const token = (await cookies()).get("token")?.value

  if (!token) {
    return Response.json({ user: null }, { status: 401 })
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string
      name: string
      email: string
    }

    return Response.json({
      user: {
        name: decoded.name,
        email: decoded.email, // ✅ TAMBAHKAN
        avatar: "/avatars/default.jpg",
      },
    })
  } catch {
    return Response.json({ user: null }, { status: 401 })
  }
}
