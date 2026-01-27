"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Clock } from "lucide-react"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

import { SidebarTrigger } from "@/components/ui/sidebar"
import { LocationSwitcher } from "@/components/locations/location-switcher"

export function SiteHeader() {
  const pathname = usePathname()
  const [time, setTime] = useState<string>("--:--:--")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const interval = setInterval(() => {
      setTime(
        new Date().toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      )
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  // ===== Breadcrumb Logic =====
  const segments = pathname
    .split("/")
    .filter(Boolean)
    .filter((segment) => segment !== "dashboard")

  return (
    <header className="flex h-[var(--header-height)] items-center border-b">
      <div className="flex w-full items-center gap-2 px-4 lg:px-6">
        <SidebarTrigger className="-ml-1" />

        {/* ===== Breadcrumb ===== */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/dashboard">Dashboard</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>

            {segments.map((segment, index) => {
              const href = "/" + segments.slice(0, index + 1).join("/")
              const isLast = index === segments.length - 1

              return [
                <BreadcrumbSeparator key={`${href}-sep`} />,
                <BreadcrumbItem key={href}>
                  {isLast ? (
                    <BreadcrumbPage className="capitalize">
                      {segment.replace(/-/g, " ")}
                    </BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink asChild>
                      <Link href={href} className="capitalize">
                        {segment.replace(/-/g, " ")}
                      </Link>
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>,
              ]
            })}
          </BreadcrumbList>
        </Breadcrumb>

        {/* ===== Right Area ===== */}
        <div className="ml-auto flex items-center gap-3">
          <LocationSwitcher />
          <div className="flex items-center gap-2 px-2 py-1.5 text-sm font-medium">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="tabular-nums">{mounted ? time : "--:--:--"}</span>
          </div>
        </div>
      </div>
    </header>
  )
}
