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
      <Card>
        <CardHeader>
          <CardDescription>Today’s Bookings</CardDescription>
          <CardTitle className="text-3xl font-semibold tabular-nums">
            38
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingUp className="size-4" />
              +8%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="flex gap-2 font-medium">
            Higher demand today <IconCalendarCheck className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Compared to yesterday
          </div>
        </CardFooter>
      </Card>

      {/* Total Revenue */}
      <Card>
        <CardHeader>
          <CardDescription>Total Revenue</CardDescription>
          <CardTitle className="text-3xl font-semibold tabular-nums">
            $12,450
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingUp className="size-4" />
              +12%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="flex gap-2 font-medium">
            Revenue increased <IconCash className="size-4" />
          </div>
          <div className="text-muted-foreground">
            From massage & spa services
          </div>
        </CardFooter>
      </Card>

      {/* Active Therapists */}
      <Card>
        <CardHeader>
          <CardDescription>Active Therapists</CardDescription>
          <CardTitle className="text-3xl font-semibold tabular-nums">
            12
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingUp className="size-4" />
              +2
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="flex gap-2 font-medium">
            Ready to serve <IconUserHeart className="size-4" />
          </div>
          <div className="text-muted-foreground">
            On duty today
          </div>
        </CardFooter>
      </Card>

      {/* Cancellation Rate */}
      <Card>
        <CardHeader>
          <CardDescription>Cancellation Rate</CardDescription>
          <CardTitle className="text-3xl font-semibold tabular-nums">
            3.2%
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingDown className="size-4" />
              -1.1%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="flex gap-2 font-medium">
            More stable bookings <IconTrendingDown className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Fewer cancellations
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
