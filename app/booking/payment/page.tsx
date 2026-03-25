import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const paymentCopy: Record<
  string,
  { title: string; description: string; actionLabel: string }
> = {
  finish: {
    title: "Payment completed",
    description: "Your booking payment has been received. We will confirm the booking shortly.",
    actionLabel: "Create another booking",
  },
  pending: {
    title: "Payment pending",
    description: "Your booking has been created, but the payment is still waiting to be completed.",
    actionLabel: "Back to booking",
  },
  error: {
    title: "Payment failed",
    description: "We could not complete the payment. You can return and try again.",
    actionLabel: "Back to booking",
  },
}

export default async function BookingPaymentPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; bookingId?: string }>
}) {
  const params = await searchParams
  const status = params.status && params.status in paymentCopy ? params.status : "pending"
  const content = paymentCopy[status]

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-lg shadow-sm">
        <CardHeader>
          <CardTitle>{content.title}</CardTitle>
          <CardDescription>{content.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {params.bookingId ? (
            <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
              Booking ID: {params.bookingId}
            </div>
          ) : null}
          <div className="flex gap-3">
            <Button asChild>
              <Link href="/booking">{content.actionLabel}</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/">Back to home</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
