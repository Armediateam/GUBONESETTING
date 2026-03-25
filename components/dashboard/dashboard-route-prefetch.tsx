"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

const dashboardRoutes = [
  "/",
  "/bookings",
  "/schedule",
  "/locations",
  "/services",
  "/therapists",
  "/patients",
  "/profile",
  "/settings",
]

export function DashboardRoutePrefetch() {
  const router = useRouter()

  React.useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    let cancelled = false

    const prefetchRoutes = () => {
      if (cancelled) return
      dashboardRoutes.forEach((route) => router.prefetch(route))
    }

    if ("requestIdleCallback" in window) {
      const idleId = window.requestIdleCallback(prefetchRoutes, { timeout: 1500 })
      return () => {
        cancelled = true
        window.cancelIdleCallback(idleId)
      }
    }

    const timeoutId = setTimeout(prefetchRoutes, 300)
    return () => {
      cancelled = true
      clearTimeout(timeoutId)
    }
  }, [router])

  return null
}
