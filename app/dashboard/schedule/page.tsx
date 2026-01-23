// app/dashboard/schedule/page.tsx
import { ScheduleHeader } from "@/components/schedule/header";
import { ScheduleMain } from "@/components/schedule/main";
import { ScheduleFooter } from "@/components/schedule/footer";

export default function SchedulePage() {
  return (
    <div className="flex flex-col gap-4 my-4 mx-4 lg:mx-6">
      <ScheduleHeader />
      <ScheduleMain />
      <ScheduleFooter />
    </div>
  );
}
