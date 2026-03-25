"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"

export function RegisterForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter()
  const [name, setName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [loading, setLoading] = React.useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      })
      const payload = await res.json()

      if (!res.ok) {
        toast.error(payload?.message || "Gagal membuat akun")
        return
      }

      localStorage.setItem("token", payload.token)
      toast.success("Akun berhasil dibuat")
      router.push("/")
    } catch (error) {
      console.error(error)
      toast.error("Server error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Create first account</CardTitle>
          <CardDescription>
            Halaman setup sederhana untuk membuat akun admin pertama.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="name">Name</FieldLabel>
                <Input
                  id="name"
                  placeholder="Nama admin"
                  required
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </Field>
              <Field>
                <Button type="submit" disabled={loading}>
                  {loading ? "Creating..." : "Create account"}
                </Button>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
        <CardFooter>
          <p className="text-muted-foreground text-sm">
            Sudah punya akun? <Link className="underline underline-offset-4" href="/login">Login</Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
