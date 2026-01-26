// DashboardLayout.tsx
import { AppSidebar } from "@/components/dashboard/app-sidebar"
import { SiteHeader } from "@/components/dashboard/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { TopLoadingBar } from "@/components/top-loading-bar"
import { LocationProvider } from "@/components/locations/location-context"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = { name: "John Doe", email: "john.doe@example.com", avatar: "/path/to/avatar.jpg" } // Tambahkan data user di sini

  return (
    <LocationProvider>
      <SidebarProvider
        style={{
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties}
      >
        <AppSidebar user={user} />

        <SidebarInset>
          <SiteHeader />
          <TopLoadingBar />
          <main className="flex flex-col">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </LocationProvider>
  )
}
