import DashboardLayout from "@/app/dashboard/layout"
import { LocationsPage } from "@/components/locations/locations-page"

export default function LocationsRootPage() {
  return (
    <DashboardLayout>
      <LocationsPage />
    </DashboardLayout>
  )
}
