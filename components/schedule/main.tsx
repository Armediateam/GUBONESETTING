"use client";

// components/schedule/main.tsx
import React, { useState } from "react";
import { CalendarWithTime } from "./calender";

export function ScheduleMain() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [startTime, setStartTime] = useState<string>("10:00");
  const [endTime, setEndTime] = useState<string>("12:00");

  // Menangani perubahan waktu
  const handleStartTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStartTime(e.target.value);
  };

  const handleEndTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEndTime(e.target.value);
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-medium mb-4">Pilih Tanggal dan Waktu</h2>
      <p className="text-sm text-gray-500 mb-6">Pilih tanggal di kalender dan tentukan waktu mulai dan selesai.</p>
      <CalendarWithTime /> {/* Kalender dan waktu */}

      {/* Menampilkan tanggal dan waktu yang dipilih */}
      <div className="mt-4">
        <p className="text-lg">Tanggal yang dipilih: {selectedDate?.toLocaleDateString()}</p>
        <div>
          <p className="text-lg">Waktu mulai: {startTime}</p>
          <p className="text-lg">Waktu selesai: {endTime}</p>
        </div>
      </div>
    </div>
  );
}
