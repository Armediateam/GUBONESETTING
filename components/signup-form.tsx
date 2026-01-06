"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"

export function SignupForm(props: React.ComponentProps<typeof Card>) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")
    setSuccess("")
    setLoading(true)

    const formData = new FormData(e.currentTarget)

    const name = formData.get("name")
    const email = formData.get("email")
    const password = formData.get("password")
    const confirmPassword = formData.get("confirm-password")

    if (password !== confirmPassword) {
      setError("Password tidak sama")
      setLoading(false)
      return
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.message || "Gagal register")
      } else {
        // 🔐 simpan JWT
        localStorage.setItem("token", data.token)
        setSuccess("Akun berhasil dibuat 🎉")
      }
    } catch (err) {
      setError("Terjadi kesalahan")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card {...props}>
      <CardHeader>
        <CardTitle>Create an account</CardTitle>
        <CardDescription>
          Enter your information below to create your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="name">Full Name</FieldLabel>
              <Input name="name" id="name" required />
            </Field>

            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input name="email" id="email" type="email" required />
            </Field>

            <Field>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <Input name="password" id="password" type="password" required />
            </Field>

            <Field>
              <FieldLabel htmlFor="confirm-password">
                Confirm Password
              </FieldLabel>
              <Input
                name="confirm-password"
                id="confirm-password"
                type="password"
                required
              />
            </Field>

            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}
            {success && (
              <p className="text-sm text-green-600">{success}</p>
            )}

            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Account"}
            </Button>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}
