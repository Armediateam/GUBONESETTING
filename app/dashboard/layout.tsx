// DashboardLayout.tsx
import { AppSidebar } from "@/components/dashboard/app-sidebar"
import { SiteHeader } from "@/components/dashboard/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { TopLoadingBar } from "@/components/top-loading-bar"
import { LocationProvider } from "@/components/locations/location-context"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <LocationProvider>
      <SidebarProvider
        style={{
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties}
      >
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
