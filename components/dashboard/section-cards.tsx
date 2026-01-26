import {
  IconCalendarCheck,
  IconCash,
  IconUserHeart,
  IconTrendingDown,
  IconTrendingUp,
} from "@tabler/icons-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function SectionCards() {
  return (
    <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      {/* Today’s Bookings */}
      <Card className="bg-transparent">
        <CardHeader>
          <CardTitle className="text-4xl font-semibold tabular-nums">
            38
          </CardTitle>
           <CardAction className="flex items-center gap-1 text-sm font-medium text-emerald-600 dark:text-emerald-400">
            <IconTrendingUp className="size-4" />
            +8%
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="flex gap-2 font-medium">
            Today’s Bookings
          </div>
          <div className="text-muted-foreground">
            Compared to yesterday
          </div>
        </CardFooter>
      </Card>

      {/* Total Revenue */}
      <Card className="bg-transparent">
        <CardHeader>
          <CardTitle className="text-4xl font-semibold tabular-nums">
            $12,450
          </CardTitle>
          <CardAction className="flex items-center gap-1 text-sm font-medium text-emerald-600 dark:text-emerald-400">
            <IconTrendingUp className="size-4" />
            +12%
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="flex gap-2 font-medium">
            Total Revenue
          </div>
          <div className="text-muted-foreground">
            Compared to yesterday
          </div>
        </CardFooter>
      </Card>

      {/* Active Therapists */}
      <Card className="bg-transparent">
        <CardHeader>
          <CardTitle className="text-4xl font-semibold tabular-nums">
            12
          </CardTitle>
           <CardAction className="flex items-center gap-1 text-sm font-medium text-emerald-600 dark:text-emerald-400">
            <IconTrendingUp className="size-4" />
            +2
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="flex gap-2 font-medium">
            Active Therapists
          </div>
          <div className="text-muted-foreground">
            Compared to yesterday
          </div>
        </CardFooter>
      </Card>

      {/* Cancellation Rate */}
      <Card className="bg-transparent">
        <CardHeader>
          <CardTitle className="text-4xl font-semibold tabular-nums">
            3.2%
          </CardTitle>
          <CardAction className="flex items-center gap-1 text-sm font-medium text-rose-600 dark:text-rose-400">
            <IconTrendingDown className="size-4" />
            -1.1%
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="flex gap-2 font-medium">
            Cancellation Rate
          </div>
          <div className="text-muted-foreground">
            Compared to yesterday
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
