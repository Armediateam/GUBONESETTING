import bookings from "../app/dashboard/data.json"

export type Booking = {
  id: number;
  customer: string;
  service: string;
  datetime: string;
  status: string;
  therapist: string;
  price: string;
};

// Karena data.json statis, kita bisa langsung return
export function getBookings(): Booking[] {
  return bookings;
}
