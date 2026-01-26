import DashboardLayout from "@/app/dashboard/layout"
import { BookingDashboard } from "@/components/booking/booking-dashboard"

export default function BookingsPage() {
  return (
    <DashboardLayout>
      <BookingDashboard />
    </DashboardLayout>
  )
}
