"use client";

import * as React from "react";
import { Calendar } from "@/components/ui/calendar";
import { getBookings, type Booking } from "@/lib/getBookings";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export function Calendar18() {
  const [date, setDate] = React.useState<Date | undefined>(new Date());
  const [bookings, setBookings] = React.useState<Booking[]>([]);

  React.useEffect(() => {
    const data = getBookings();
    setBookings(data);
  }, []);

  // Filter bookings for selected date
  const filteredBookings = bookings
    .filter((b) => {
      if (!date) return false;
      const bookingDate = new Date(b.datetime);
      return (
        bookingDate.getFullYear() === date.getFullYear() &&
        bookingDate.getMonth() === date.getMonth() &&
        bookingDate.getDate() === date.getDate()
      );
    })
    .sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime());

  // Upcoming bookings for next day
  const nextDay = date ? new Date(date) : new Date();
  nextDay.setDate(nextDay.getDate() + 1);

  const upcomingBookings = bookings
    .filter((b) => {
      const bookingDate = new Date(b.datetime);
      return (
        bookingDate.getFullYear() === nextDay.getFullYear() &&
        bookingDate.getMonth() === nextDay.getMonth() &&
        bookingDate.getDate() === nextDay.getDate()
      );
    })
    .sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime());

  // Badge colors (ShadCN semantic)
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Done":
        return "bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-100";
      case "In Process":
        return "bg-yellow-100 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-100";
      default:
        return "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100";
    }
  };

  // Card colors from global CSS variables
  const cardColors = [
    "var(--card-color-1)",
    "var(--card-color-2)",
    "var(--card-color-3)",
    "var(--card-color-4)",
    "var(--card-color-5)",
  ];

  const getCardStyle = (index: number) => ({
    backgroundColor: cardColors[index % cardColors.length],
    color: "black", // teks selalu hitam
  });

  return (
    <div className="p-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card className="md:col-span-1 flex flex-col">
          <CardHeader>
            <CardTitle>Calendar</CardTitle>
          </CardHeader>
          <CardContent className="flex-1">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="[--cell-size:--spacing(12)] w-full"
              buttonVariant="ghost"
            />
          </CardContent>
        </Card>

        {/* Schedule for Today */}
        <Card className="md:col-span-2 row-span-2 flex flex-col">
          <CardHeader>
            <CardTitle>Schedule for Today</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {filteredBookings.length === 0 && (
              <p className="text-muted-foreground">No bookings for this day.</p>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredBookings.map((b, idx) => (
                <Card
                  key={b.id}
                  className="p-4 flex flex-col justify-between"
                  style={getCardStyle(idx)}
                >
                  <div className="mb-2">
                    <p className="font-semibold text-lg">{b.service}</p>
                    <p className="text-sm">{b.customer} - {new Date(b.datetime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                    <p className="text-sm">Therapist: {b.therapist}</p>
                    <p className="text-sm">Price: ${b.price}</p>
                  </div>
                  <Badge
                    className={`${getStatusColor(b.status)} self-start px-3 py-1 rounded-full font-medium`}
                  >
                    {b.status}
                  </Badge>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Schedule */}
        <Card className="md:col-span-1 flex flex-col">
          <CardHeader>
            <CardTitle>Upcoming Schedule</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {upcomingBookings.length === 0 && (
              <p className="text-muted-foreground">No upcoming bookings for next day.</p>
            )}
            <div className="grid grid-cols-1 gap-4">
              {upcomingBookings.map((b, idx) => (
                <Card
                  key={b.id}
                  className="p-4 flex flex-col justify-between"
                  style={getCardStyle(idx)}
                >
                  <div className="mb-2">
                    <p className="font-semibold text-lg">{b.service}</p>
                    <p className="text-sm">{b.customer} - {new Date(b.datetime).toLocaleDateString()} {new Date(b.datetime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                    <p className="text-sm">Therapist: {b.therapist}</p>
                    <p className="text-sm">Price: ${b.price}</p>
                  </div>
                  <Badge
                    className={`${getStatusColor(b.status)} self-start px-3 py-1 rounded-full font-medium`}
                  >
                    {b.status}
                  </Badge>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
