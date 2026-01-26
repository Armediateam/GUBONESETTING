import DashboardLayout from "@/app/dashboard/layout"
import { ScheduleMain } from "@/components/schedule/main"

export default function SchedulePage() {
  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 my-4 mx-4 lg:mx-6">
        <ScheduleMain />
      </div>
    </DashboardLayout>
  )
}
