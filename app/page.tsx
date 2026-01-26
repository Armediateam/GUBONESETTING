import DashboardLayout from "./dashboard/layout"
import { DashboardHome } from "@/components/dashboard/home"

export default function Home() {
  return (
    <DashboardLayout>
      <DashboardHome />
    </DashboardLayout>
  )
}
