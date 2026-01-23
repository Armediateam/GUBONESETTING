"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

import { useIsMobile } from "@/hooks/use-mobile"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"

export const description = "Daily booking trends"

const chartData = [
  { date: "2024-06-01", completed: 32, cancelled: 25 },
  { date: "2024-06-02", completed: 45, cancelled: 25 },
  { date: "2024-06-03", completed: 28, cancelled: 12 },
  { date: "2024-06-04", completed: 51, cancelled: 24 },
  { date: "2024-06-05", completed: 38, cancelled: 13 },
  { date: "2024-06-06", completed: 42, cancelled: 26 },
  { date: "2024-06-07", completed: 47, cancelled: 12 },
  { date: "2024-06-08", completed: 53, cancelled: 24 },
  { date: "2024-06-09", completed: 40, cancelled: 13 },
  { date: "2024-06-10", completed: 49, cancelled: 25 },
]

const chartConfig = {
  completed: {
    label: "Completed",
    color: "var(--primary)",
  },
  cancelled: {
    label: "Cancelled",
    color: "var(--destructive)",
  },
} satisfies ChartConfig

export function ChartAreaInteractive() {
  const isMobile = useIsMobile()
  const [timeRange, setTimeRange] = React.useState("30d")

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange("7d")
    }
  }, [isMobile])

  const filteredData = chartData.slice(
    timeRange === "7d" ? -7 : timeRange === "30d" ? -30 : undefined
  )

  return (
    <Card className="bg-transparent">
      <CardHeader>
        <CardTitle>Booking Trends</CardTitle>
        <CardDescription>
          Daily completed and cancelled bookings
        </CardDescription>

        <CardAction>
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={setTimeRange}
            variant="outline"
            className="hidden @[767px]/card:flex"
          >
            <ToggleGroupItem value="90d">90 days</ToggleGroupItem>
            <ToggleGroupItem value="30d">30 days</ToggleGroupItem>
            <ToggleGroupItem value="7d">7 days</ToggleGroupItem>
          </ToggleGroup>

          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger size="sm" className="w-36 @[767px]/card:hidden">
              <SelectValue placeholder="Select range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>

      <CardContent className="pt-6">
        <ChartContainer config={chartConfig} className="h-[260px] w-full">
          <AreaChart data={filteredData}>
            {/* Gradients */}
            <defs>
              <linearGradient id="fillCompleted" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-completed)"
                  stopOpacity={0.6}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-completed)"
                  stopOpacity={0.05}
                />
              </linearGradient>

              <linearGradient id="fillCancelled" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-cancelled)"
                  stopOpacity={0.45}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-cancelled)"
                  stopOpacity={0.05}
                />
              </linearGradient>
            </defs>

            <CartesianGrid vertical={false} />

            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) =>
                new Date(value).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })
              }
            />

            <ChartTooltip
              cursor={{ strokeDasharray: "3 3" }}
              content={
                <ChartTooltipContent
                  indicator="dot" // <-- ganti dari "square" ke "dot"
                  labelFormatter={(value) =>
                    new Date(value).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })
                  }
                />
              }
            />

            <Area
              type="natural"
              dataKey="completed"
              stroke="var(--color-completed)"
              fill="url(#fillCompleted)"
              strokeWidth={2}
            />

            <Area
              type="natural"
              dataKey="cancelled"
              stroke="var(--color-cancelled)"
              fill="url(#fillCancelled)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
