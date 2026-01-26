import DashboardLayout from "@/app/dashboard/layout"
import { PatientDetail } from "@/components/patients/patient-detail"

export default function PatientDetailPage() {
  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 my-4 mx-4 lg:mx-6">
        <PatientDetail />
      </div>
    </DashboardLayout>
  )
}
