"use client"

import * as React from "react"

import { LocationProvider } from "@/components/locations/location-context"
import { TopLoadingBar } from "@/components/top-loading-bar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/dashboard/app-sidebar"
import { DashboardRoutePrefetch } from "@/components/dashboard/dashboard-route-prefetch"
import { SiteHeader } from "@/components/dashboard/site-header"

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <LocationProvider>
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <DashboardRoutePrefetch />
        <AppSidebar />

        <SidebarInset>
          <SiteHeader />
          <TopLoadingBar />
          <main className="flex flex-col">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </LocationProvider>
  )
}
