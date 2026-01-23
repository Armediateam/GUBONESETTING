// components/schedule/header.tsx
import { Button } from "@/components/ui/button";

export function ScheduleHeader() {
  return (
    <div className="flex justify-between items-center p-4 bg-gray-100 border-b">
      <h1 className="text-2xl font-semibold">Atur Jadwal Booking</h1>
      <div className="flex items-center space-x-2">
        <Button variant="default" size="sm">Simpan Jadwal</Button>
        <Button variant="outline" size="sm">Reset Jadwal</Button>
      </div>
    </div>
  );
}
