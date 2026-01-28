import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { jwtVerify } from "jose"

const isPublicPath = (pathname: string) => {
  return pathname === "/login" || pathname.startsWith("/api/auth")
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  if (!pathname.startsWith("/dashboard") || isPublicPath(pathname)) {
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
  matcher: ["/dashboard/:path*"],
}
