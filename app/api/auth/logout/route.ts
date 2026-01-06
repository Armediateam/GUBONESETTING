import { cookies } from "next/headers"

export async function POST() {
  ;(await cookies()).set({
    name: "token",
    value: "",
    maxAge: 0,
    path: "/",
  })

  return Response.json({ message: "Logout berhasil" })
}
