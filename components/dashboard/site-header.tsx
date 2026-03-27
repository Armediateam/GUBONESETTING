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

export function SiteHeader() {
  const pathname = usePathname()
  const [time, setTime] = useState<string | null>(null)

  useEffect(() => {
    const updateTime = () => {
      setTime(
        new Date().toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      )
    }

    updateTime()

    const interval = setInterval(() => {
      updateTime()
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  // ===== Breadcrumb Logic =====
  const segments = pathname
    .split("/")
    .filter(Boolean)
    .filter((segment) => segment !== "dashboard")

  return (
    <header className="border-b">
      <div className="flex min-h-[var(--header-height)] w-full flex-wrap items-center gap-2 px-4 py-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />

        {/* ===== Breadcrumb ===== */}
        <Breadcrumb className="min-w-0 flex-1">
          <BreadcrumbList className="min-w-0">
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/">Dashboard</Link>
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
        <div className="ml-auto flex items-center gap-3 sm:pl-4">
          <div className="hidden items-center gap-2 px-2 py-1.5 text-sm font-medium md:flex">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="min-w-[4.75rem] tabular-nums" suppressHydrationWarning>
              {time ?? "--:--:--"}
            </span>
          </div>
        </div>
      </div>
    </header>
  )
}
