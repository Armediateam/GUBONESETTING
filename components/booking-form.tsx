"use client";

import { useState, FormEvent, ChangeEvent } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Clock } from "lucide-react";

type FormData = {
  name: string;
  phone: string;
  email: string;
  location: string;
  therapist: string;
  date?: Date;
  time: string;
  paymentProof: File | null;
  description: string;
};

export default function MultiStepBookingForm() {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    phone: "",
    email: "",
    location: "",
    therapist: "",
    date: undefined,
    time: "",
    paymentProof: null,
    description: "",
  });

  const [step, setStep] = useState(1); // current step: 1, 2, 3

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
  const { name, value } = e.target;

  // Cek apakah ini input file
  if (name === "paymentProof" && e.target instanceof HTMLInputElement && e.target.files) {
    setFormData({ ...formData, paymentProof: e.target.files[0] });
  } else {
    setFormData({ ...formData, [name]: value });
  }
};


  const handleSelectChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleDateChange = (date: Date | undefined) => {
    setFormData({ ...formData, date });
  };

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    console.log("Form data submitted:", formData);
  };

  const hours = Array.from({ length: 12 }, (_, i) => `${i + 8}:00`); // 08:00 - 19:00

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50 p-2">
      <Card className="w-full max-w-lg shadow-xl">
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <CardHeader>
            <CardTitle>Therapy Booking Form</CardTitle>
            <div className="flex gap-2 mt-2">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`flex-1 h-1 rounded-full transition-all ${step === s ? "bg-primary" : "bg-gray-200"
                    }`}
                />
              ))}
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Step 1: Personal Info */}
            {step === 1 && (
              <div className="space-y-4 animate-fadeIn">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    name="phone"
                    placeholder="08123456789"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="example@email.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            )}

            {/* Step 2: Service & Schedule */}
            {step === 2 && (
              <div className="space-y-4 animate-fadeIn">
                {/* Location */}
                <div className="flex flex-col gap-2">
                  <Label htmlFor="location">Location</Label>
                  <Select onValueChange={(value) => handleSelectChange("location", value)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent className="w-full">
                      <SelectItem value="Location A">Location A</SelectItem>
                      <SelectItem value="Location B">Location B</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Therapist */}
                <div className="flex flex-col gap-2">
                  <Label htmlFor="therapist">Therapist</Label>
                  <Select onValueChange={(value) => handleSelectChange("therapist", value)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select therapist" />
                    </SelectTrigger>
                    <SelectContent className="w-full">
                      <SelectItem value="Therapist A">Therapist A</SelectItem>
                      <SelectItem value="Therapist B">Therapist B</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Date & Time */}
                <div className="flex gap-4">
                  <div className="flex-1 flex flex-col gap-2">
                    <Label htmlFor="date">Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <div className="relative w-full cursor-pointer">
                          <div className="w-full border rounded-md p-2 flex items-center gap-2 hover:border-primary">
                            <CalendarIcon className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-400 text-sm">
                              {formData.date
                                ? format(formData.date, "dd/MM/yyyy")
                                : "dd/mm/yyyy"}
                            </span>
                          </div>
                        </div>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={formData.date}
                          onSelect={handleDateChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="flex-1 flex flex-col gap-2">
                    <Label htmlFor="time">Time</Label>
                    <Select onValueChange={(value) => handleSelectChange("time", value)}>
                      <SelectTrigger className="flex items-center gap-2 w-full">
                        <Clock className="w-5 h-5 text-gray-400" />
                        <SelectValue placeholder="Select time" />
                      </SelectTrigger>
                      <SelectContent className="w-full">
                        {hours.map((hour) => (
                          <SelectItem key={hour} value={hour}>
                            {hour}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Payment */}
            {step === 3 && (
              <div className="space-y-4 animate-fadeIn">
                {/* Payment Information */}
                <div className="p-4 border rounded-md bg-gray-50 dark:bg-gray-800 space-y-2">
                  <h3 className="font-semibold text-lg">Payment Information</h3>
                  <p>Bank: <span className="font-medium">BCA</span></p>
                  <p>Account Number: <span className="font-medium">1234567890</span></p>
                  <p>Account Name: <span className="font-medium">PT Wellness Sejahtera</span></p>
                  {/** random unique code */}
                  {(() => {
                    const uniqueCode = Math.floor(100 + Math.random() * 900); // 3 digits
                    const totalAmount = 250000 + uniqueCode;
                    return (
                      <>
                        <p>Unique Code: <span className="font-medium">{uniqueCode}</span></p>
                        <p>Total Amount: <span className="font-medium">Rp {totalAmount.toLocaleString()}</span></p>
                      </>
                    );
                  })()}
                  <p className="text-sm text-gray-500">
                    Please make the payment first, then upload the payment proof below.
                  </p>
                </div>

                {/* Payment Proof */}
                <div className="flex flex-col gap-2">
                  <Label htmlFor="paymentProof">Payment Proof</Label>
                  <Input
                    id="paymentProof"
                    name="paymentProof"
                    type="file"
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* Description */}
                <div className="flex flex-col gap-2">
                  <Label htmlFor="description">Description / Notes (Optional)</Label>
                  <textarea
                    id="description"
                    name="description"
                    placeholder="Enter any additional notes or concerns"
                    value={formData.description}
                    onChange={handleChange}
                    className="w-full border rounded-md p-2"
                  />
                </div>
              </div>
            )}


          </CardContent>

          <CardFooter className={`flex w-full ${step === 1 ? "" : "justify-between"
            }`}>
            {/* Back button */}
            {step > 1 && (
              <Button variant="outline" onClick={handleBack}>
                Back
              </Button>
            )}

            {/* Next button */}
            {step < 3 && (
              <Button onClick={handleNext} className={step === 1 ? "ml-auto" : ""}>
                Next
              </Button>
            )}

            {/* Submit button */}
            {step === 3 && (
              <Button type="submit" className="ml-auto">
                Book Now
              </Button>
            )}
          </CardFooter>

        </form>
      </Card>
    </div>
  );
}
