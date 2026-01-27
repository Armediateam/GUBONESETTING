// components/schedule/calender.tsx
import * as React from "react";
import { Calendar } from "@/components/ui/calendar"; // Pastikan Calendar ada di path yang benar
import { Card, CardContent, CardFooter } from "@/components/ui/card"; // No need for size="sm" on Card
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Clock2Icon } from "lucide-react";

export function CalendarWithTime() {
  const [date, setDate] = React.useState<Date | undefined>(
    new Date(new Date().getFullYear(), new Date().getMonth(), 12)
  );

  return (
    <Card className="mx-auto w-fit">
      <CardContent>
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          className="p-0"
        />
      </CardContent>
      <CardFooter className="bg-card border-t">
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="time-from">Start Time</FieldLabel>
            <InputGroup>
              <InputGroupInput
                id="time-from"
                type="time"
                step="1"
                defaultValue="10:30:00"
                className="appearance-none [&::-webkit-calendar-picker-indicator]:hidden"
              />
              <InputGroupAddon>
                <Clock2Icon className="text-muted-foreground" />
              </InputGroupAddon>
            </InputGroup>
          </Field>
          <Field>
            <FieldLabel htmlFor="time-to">End Time</FieldLabel>
            <InputGroup>
              <InputGroupInput
                id="time-to"
                type="time"
                step="1"
                defaultValue="12:30:00"
                className="appearance-none [&::-webkit-calendar-picker-indicator]:hidden"
              />
              <InputGroupAddon>
                <Clock2Icon className="text-muted-foreground" />
              </InputGroupAddon>
            </InputGroup>
          </Field>
        </FieldGroup>
      </CardFooter>
    </Card>
  );
}
