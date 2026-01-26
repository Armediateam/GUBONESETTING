import { PatientsList } from "@/components/patients/patients-list"

export default function PatientsPage() {
  return (
    <div className="flex flex-col gap-6 my-4 mx-4 lg:mx-6">
      <PatientsList />
    </div>
  )
}
