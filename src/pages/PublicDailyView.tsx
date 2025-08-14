import { useEffect, useRef, useState } from "react";
import { Session, SessionType, Student, Trainer } from "../types";
import { listSessions } from "../services/sessions";
import { listStudents } from "../services/students";
import { listTrainers } from "../services/trainers";
import DailyGridView from "../components/calendar/DailyGridView";

export default function PublicDailyView() {
  const [sessions] = useState<Session[]>(listSessions());
  const [students] = useState<Student[]>(listStudents());
  const [trainers] = useState<Trainer[]>(listTrainers());
  const gridContainerRef = useRef<HTMLDivElement | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
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

  // Fullscreen controls
  const enterFullscreen = async () => {
    const el: any = gridContainerRef.current;
    if (!el) return;
    if (el.requestFullscreen) {
      await el.requestFullscreen();
    } else if (el.webkitRequestFullscreen) {
      el.webkitRequestFullscreen();
    } else if (el.msRequestFullscreen) {
      el.msRequestFullscreen();
    }
  };
  const exitFullscreen = async () => {
    const doc: any = document;
    if (document.exitFullscreen) {
      await document.exitFullscreen();
    } else if (doc.webkitExitFullscreen) {
      doc.webkitExitFullscreen();
    } else if (doc.msExitFullscreen) {
      doc.msExitFullscreen();
    }
  };
  useEffect(() => {
    const onChange = () => {
      const anyDoc: any = document;
      const fsEl =
        document.fullscreenElement ||
        anyDoc.webkitFullscreenElement ||
        anyDoc.msFullscreenElement;
      setIsFullscreen(fsEl === gridContainerRef.current);
    };
    document.addEventListener("fullscreenchange", onChange);
    document.addEventListener("webkitfullscreenchange", onChange as any);
    return () => {
      document.removeEventListener("fullscreenchange", onChange);
      document.removeEventListener("webkitfullscreenchange", onChange as any);
    };
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
    slotsPerType: {
      "training-tabletop": 10,
      "training-digital": 10,
      "accelerate-rx": 3,
      remote: 4,
      gt: 4,
    } as Record<SessionType, number>,
  };

  // No date controls – live view always shows today

  const toMins = (hhmm: string) => {
    const [h, m] = hhmm.split(":").map(Number);
    return h * 60 + m;
  };

  const minsToHHMM = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(":").map(Number);
    const period = hours >= 12 ? "PM" : "AM";
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
  };

  const getTypeLabel = (t: SessionType) => {
    switch (t) {
      case "training-tabletop":
        return "Training (Table-top)";
      case "training-digital":
        return "Training (Digital)";
      case "accelerate-rx":
        return "AccelerateRx";
      case "remote":
        return "Remote";
      case "gt":
        return "GT";
      default:
        return "Session";
    }
  };

  const getStudentName = (session: Session) => {
    if (session.studentId) {
      const s = students.find((x) => x.id === session.studentId);
      return s?.firstName || s?.name || "Unknown Student";
    }
    if (session.clientName) return session.clientName;
    return "Unknown Client";
  };

  const getTrainerName = (trainerId: string) => {
    const t = trainers.find((x) => x.id === trainerId);
    return t?.firstName || t?.name || "Unknown Trainer";
  };

  const upcomingSessions = (() => {
    const NOW_OFFSET_MINS = -10 * 60; // dev: shift current time back 10h
    const baseDate = toDate(selectedDate);
    const dateKey = baseDate.toDateString();
    const today = new Date();
    const isToday = today.toDateString() === dateKey;
    const mockedNowMins =
      (today.getHours() * 60 + today.getMinutes() + NOW_OFFSET_MINS + 1440) %
      1440;
    // When testing with an offset that lands later than business start, start from the day start
    const thresholdMins = Math.min(
      mockedNowMins,
      GRID_CONFIG.businessStartMinutes
    );
    const base = sessions
      .filter(
        (s) =>
          new Date(s.date).toDateString() === dateKey &&
          s.status !== "cancelled"
      )
      .filter((s) => (isToday ? toMins(s.startTime) >= thresholdMins : true))
      .sort((a, b) => a.startTime.localeCompare(b.startTime))
      .slice(0, 20);

    // Ensure at least 50 items by appending dummy upcoming entries (display-only)
    const desiredCount = 50;
    if (base.length >= desiredCount) return base;

    const result = [...base];
    const trainerIds = trainers.length > 0 ? trainers.map((t) => t.id) : [""];
    const sessionTypes: SessionType[] = [
      "training-tabletop",
      "training-digital",
      "accelerate-rx",
      "remote",
      "gt",
    ];

    // Generate dummy sessions every 15 minutes across the day, cycling metadata
    let t = thresholdMins;
    let i = 0;
    while (result.length < desiredCount) {
      const startMins = t;
      const endMins = Math.min(startMins + 30, GRID_CONFIG.businessEndMinutes);
      const trainerId = trainerIds[i % trainerIds.length];
      const sessionType = sessionTypes[i % sessionTypes.length];
      result.push({
        id: `dummy-${i}`,
        trainerId,
        sessionType,
        assignedSeat: (i % 6) + 1,
        date: baseDate.toISOString(),
        startTime: minsToHHMM(startMins),
        endTime: minsToHHMM(endMins),
        status: "scheduled",
        clientName: `Demo Student ${i + 1}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      i += 1;
      t += GRID_CONFIG.incrementMinutes; // step 15m
      if (t >= GRID_CONFIG.businessEndMinutes) {
        // wrap to business start if we ran out of day
        t = GRID_CONFIG.businessStartMinutes;
      }
    }

    // Sort the combined list by time for display
    result.sort((a, b) => a.startTime.localeCompare(b.startTime));
    return result;
  })();

  return (
    <div className="min-h-screen bg-warm-50">
      <div className="max-w-[1600px] mx-auto px-8 py-12">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink-900 flex items-center gap-3">
            <span className="inline-flex items-center justify-center w-2 h-2 rounded-full bg-green-500 animate-pulse shadow" />
            Center Schedule for {new Date(selectedDate).toLocaleDateString()}
          </h1>
          <div className="flex items-center gap-3">
            <span className="text-xs text-ink-500 hidden sm:inline-flex items-center gap-2">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 animate-ping" />
              Live updating • Refresh for latest
            </span>
            <button
              onClick={() =>
                isFullscreen ? exitFullscreen() : enterFullscreen()
              }
              className="px-2 py-1 rounded border text-sm border-gray-300 hover:bg-gray-50"
              title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            >
              {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            </button>
          </div>
        </div>
        <div
          ref={gridContainerRef}
          className={`flex gap-6 items-start relative ${isFullscreen ? "bg-warm-50" : ""}`}
        >
          {isFullscreen && (
            <button
              onClick={exitFullscreen}
              className="absolute top-2 right-2 z-10 px-2 py-1 rounded bg-white border border-gray-300 shadow hover:bg-gray-50"
              title="Exit Fullscreen"
            >
              ✕
            </button>
          )}
          {/* Upcoming Sessions (25%) */}
          <aside className={`w-1/4 ${isFullscreen ? "pl-8 pt-12" : ""}`}>
            <div className="bg-white/90 backdrop-blur rounded-2xl p-5 shadow-[0_8px_30px_rgba(0,0,0,0.06)] ring-1 ring-primary-100 overflow-visible">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-ink-900">
                  Upcoming Sessions
                </h2>
              </div>
              <div className="mt-3 divide-y divide-gray-100 max-h-[70vh] overflow-y-auto overflow-x-visible no-scrollbar">
                {upcomingSessions.length === 0 ? (
                  <div className="py-6 text-sm text-ink-500 text-center">
                    No upcoming sessions
                  </div>
                ) : (
                  upcomingSessions.map((s) => (
                    <div
                      key={s.id}
                      className="py-3 flex items-start justify-between"
                    >
                      <div className="flex-1">
                        {/* 1. Time slot (primary) */}
                        <div className="text-[15px] md:text-base font-extrabold text-ink-900">
                          {formatTime(s.startTime)} – {formatTime(s.endTime)}
                        </div>
                        {/* 2. Session type + seat (secondary) */}
                        <div className="mt-1 flex flex-wrap items-center gap-2 pr-1 pl-[1px]">
                          <span className="inline-flex items-center pl-3 pr-2 py-0.5 rounded-full text-[11px] font-semibold bg-primary-50 text-primary-700 ring-1 ring-primary-200">
                            {getTypeLabel(s.sessionType)}
                          </span>
                          {s.assignedSeat ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-gray-50 text-gray-700 ring-1 ring-gray-200">
                              Seat {s.assignedSeat}
                            </span>
                          ) : null}
                        </div>
                        {/* 3. Student + Trainer (tertiary) */}
                        <div className="mt-1 text-xs text-ink-700">
                          {getStudentName(s)}
                          <span className="mx-1 text-ink-400">•</span>
                          Trainer: {getTrainerName(s.trainerId)}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </aside>

          {/* Grid (75%) */}
          <section className="relative w-3/4">
            {isFullscreen ? (
              <DailyGridView
                date={toDate(selectedDate)}
                appointments={sessions}
                students={students}
                trainers={trainers}
                config={{
                  ...GRID_CONFIG,
                  laneWidthPx: 64,
                  nowOffsetMinutes: -10 * 60,
                }}
              />
            ) : (
              <div className="bg-white/90 backdrop-blur rounded-2xl p-6 md:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.06)] ring-1 ring-primary-100">
                <DailyGridView
                  date={toDate(selectedDate)}
                  appointments={sessions}
                  students={students}
                  trainers={trainers}
                  config={{
                    ...GRID_CONFIG,
                    laneWidthPx: 64,
                    nowOffsetMinutes: -10 * 60,
                  }}
                />
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
