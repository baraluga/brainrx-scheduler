import { useEffect, useState } from "react";
import { Appointment, SessionType, Student, Trainer } from "../types";
import { listAppointments } from "../services/appointments";
import { listStudents } from "../services/students";
import { listTrainers } from "../services/trainers";
import DailyGridView from "../components/calendar/DailyGridView";

export default function PublicDailyView() {
  const [appointments] = useState<Appointment[]>(listAppointments());
  const [students] = useState<Student[]>(listStudents());
  const [trainers] = useState<Trainer[]>(listTrainers());
  const todayString = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };
  const [selectedDate, setSelectedDate] = useState<string>(todayString());
  // Keep it on today while the page is open (updates after midnight)
  useEffect(() => {
    const id = setInterval(() => setSelectedDate(todayString()), 60 * 1000);
    return () => clearInterval(id);
  }, []);

  const toDate = (v: string) => {
    const [y, m, d] = v.split("-").map(Number);
    return new Date(y, (m || 1) - 1, d || 1);
  };

  const GRID_CONFIG = {
    businessStartMinutes: 10 * 60,
    businessEndMinutes: 19 * 60,
    incrementMinutes: 15,
    laneWidthPx: 64,
    nowOffsetMinutes: 10 * 60,
    slotsPerType: {
      "training-tabletop": 10,
      "training-digital": 10,
      "accelerate-rx": 3,
      remote: 4,
      gt: 4,
    } as Record<SessionType, number>,
  };

  // No date controls – live view always shows today

  return (
    <div className="min-h-screen bg-warm-50">
      <div className="max-w-[1600px] mx-auto px-8 py-12">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-ink-900 mb-6">
          Center Schedule for {new Date(selectedDate).toLocaleDateString()}
        </h1>
        <div
          className="bg-white rounded-xl p-6 md:p-8"
          style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}
        >
          <DailyGridView
            date={toDate(selectedDate)}
            appointments={appointments}
            students={students}
            trainers={trainers}
            config={{ ...GRID_CONFIG, laneWidthPx: 64 }}
          />
        </div>
      </div>
    </div>
  );
}
