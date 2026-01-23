"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { IconChevronLeft, IconChevronRight, IconChevronsLeft, IconChevronsRight } from "@tabler/icons-react";

export function DoctorFooter() {
  return (
    <div className="flex justify-end gap-2 mt-2">
      <Button variant="outline" size="icon" disabled>
        <IconChevronsLeft />
      </Button>
      <Button variant="outline" size="icon" disabled>
        <IconChevronLeft />
      </Button>
      <Button variant="outline" size="icon" disabled>
        <IconChevronRight />
      </Button>
      <Button variant="outline" size="icon" disabled>
        <IconChevronsRight />
      </Button>
    </div>
  );
}
