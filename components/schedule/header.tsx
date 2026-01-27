// components/schedule/header.tsx
import { Button } from "@/components/ui/button";

export function ScheduleHeader() {
  return (
    <div className="flex justify-between items-center p-4 bg-gray-100 border-b">
      <h1 className="text-2xl font-semibold">Manage Booking Schedule</h1>
      <div className="flex items-center space-x-2">
        <Button variant="default" size="sm">Save Schedule</Button>
        <Button variant="outline" size="sm">Reset Schedule</Button>
      </div>
    </div>
  );
}
