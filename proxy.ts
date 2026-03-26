import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { jwtVerify } from "jose"

const isPublicPath = (pathname: string) => {
  return pathname === "/login" || pathname.startsWith("/api/auth")
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  if (isPublicPath(pathname)) {
    return NextResponse.next()
  }

  const token = request.cookies.get("auth_token")?.value
  if (!token) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    return NextResponse.redirect(url)
  }

  const secret = process.env.JWT_SECRET
  if (!secret) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    return NextResponse.redirect(url)
  }

  try {
    const encoder = new TextEncoder()
    await jwtVerify(token, encoder.encode(secret))
    return NextResponse.next()
  } catch {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    return NextResponse.redirect(url)
  }
}

export const config = {
  matcher: [
    "/",
    "/bookings/:path*",
    "/locations/:path*",
    "/patients/:path*",
    "/profile/:path*",
    "/schedule/:path*",
    "/services/:path*",
    "/settings/:path*",
    "/therapists/:path*",
    "/dashboard/:path*",
  ],
}
