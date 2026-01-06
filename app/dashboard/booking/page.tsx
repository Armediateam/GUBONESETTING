import { DataTable } from "@/components/booking/data-table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import data from "../data.json"

export default function BookingPage() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-4 lg:p-6">
      <DataTable data={data} />
    </div>
  )
}
