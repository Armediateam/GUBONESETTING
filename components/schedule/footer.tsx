// components/schedule/footer.tsx
import { Button } from "@/components/ui/button";

export function ScheduleFooter() {
  return (
    <div className="flex justify-end gap-2 p-4 bg-gray-100 border-t">
      <Button variant="outline" size="sm" disabled>
        <span className="text-gray-500">Previous</span>
      </Button>
      <Button variant="default" size="sm">Next</Button>
    </div>
  );
}
