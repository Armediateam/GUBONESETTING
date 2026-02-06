// DashboardLayout.tsx
import { AppSidebar } from "@/components/dashboard/app-sidebar"
import { SiteHeader } from "@/components/dashboard/site-header"
import { ClientOnly } from "@/components/client-only"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { TopLoadingBar } from "@/components/top-loading-bar"
import { LocationProvider } from "@/components/locations/location-context"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClientOnly
      fallback={
        <div className="flex min-h-svh w-full">
          <div className="hidden w-72 shrink-0 border-r p-4 md:block">
            <div className="h-8 w-32 animate-pulse rounded bg-muted/60" />
            <div className="mt-6 space-y-3">
              <div className="h-4 w-52 animate-pulse rounded bg-muted/50" />
              <div className="h-4 w-48 animate-pulse rounded bg-muted/50" />
              <div className="h-4 w-44 animate-pulse rounded bg-muted/50" />
              <div className="h-4 w-40 animate-pulse rounded bg-muted/50" />
            </div>
          </div>
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex h-12 items-center border-b px-4">
              <div className="h-6 w-48 animate-pulse rounded bg-muted/60" />
            </div>
            <div className="flex-1 p-4">
              <div className="h-4 w-full animate-pulse rounded bg-muted/40" />
              <div className="mt-3 h-4 w-5/6 animate-pulse rounded bg-muted/40" />
              <div className="mt-3 h-4 w-2/3 animate-pulse rounded bg-muted/40" />
            </div>
          </div>
        </div>
      }
    >
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
    </ClientOnly>
  )
}
