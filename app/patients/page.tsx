import DashboardLayout from "@/app/dashboard/layout"
import { PatientsList } from "@/components/patients/patients-list"

export default function PatientsPage() {
  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 my-4 mx-4 lg:mx-6">
        <PatientsList />
      </div>
    </DashboardLayout>
  )
}
