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
  const [time, setTime] = useState(new Date())
  const [isClient, setIsClient] = useState(false)

  // Set `isClient` to true after the component mounts on the client
  useEffect(() => {
    setIsClient(true)
    const interval = setInterval(() => {
      setTime(new Date())
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
              const href =
                "/dashboard/" + segments.slice(0, index + 1).join("/")
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

        {/* ===== Right Clock ===== */}
        <div className="ml-auto">
          <div className="flex items-center gap-2 px-4 py-1.5 text-sm font-medium">
            <Clock className="h-4 w-4 text-muted-foreground" />
            {/* Only render the time if we're on the client */}
            {isClient && (
              <span className="tabular-nums">
                {time
                  ? time.toLocaleTimeString("id-ID", {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })
                  : "--:--:--"}
              </span>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
