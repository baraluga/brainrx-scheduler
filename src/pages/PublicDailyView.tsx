import { useEffect, useMemo, useRef, useState } from "react";
import { Session, SessionType, Student, Trainer } from "../types";
import { listSessions } from "../services/sessions";
import { listStudents } from "../services/students";
import { listTrainers } from "../services/trainers";
import DailyGridView from "../components/calendar/DailyGridView";
import UpcomingList from "../components/calendar/UpcomingList";

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

  // Rendering helpers moved into `UpcomingList` component

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

  // Mobile trainer filtering state and derived list
  const [mobileTrainerFilter, setMobileTrainerFilter] = useState<string | null>(null);
  const mobileTrainerOptions = useMemo(() => {
    const base = [{ id: "", label: "All Trainers" }];
    return base.concat(
      trainers.map((t) => ({ id: t.id, label: t.firstName || t.name || "Trainer" }))
    );
  }, [trainers]);
  const mobileFilteredUpcoming = useMemo(() => {
    if (!mobileTrainerFilter) return upcomingSessions;
    return upcomingSessions.filter((s) => s.trainerId === mobileTrainerFilter);
  }, [upcomingSessions, mobileTrainerFilter]);

  return (
    <div className="min-h-screen bg-warm-50">
      {/* Mobile-only: Upcoming Sessions focused view */}
      <div className="md:hidden px-4 py-6">
        {/* Trainer filter (mobile dropdown) */}
        <div className="sticky top-0 z-10 bg-warm-50 -mx-4 px-4 pt-1 pb-3">
          <label className="block text-[12px] text-ink-600 mb-1">Filter by trainer</label>
          <select
            aria-label="Filter by trainer"
            value={mobileTrainerFilter ?? ""}
            onChange={(e) => setMobileTrainerFilter(e.target.value === "" ? null : e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-white text-ink-900 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {mobileTrainerOptions.map((opt) => (
              <option key={opt.id || "all"} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <UpcomingList
          title="Upcoming Today"
          sessions={mobileFilteredUpcoming}
          students={students}
          trainers={trainers}
          variant="mobile"
        />
      </div>

      {/* Desktop/tablet view */}
      <div className="hidden md:block">
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
            <UpcomingList
              title="Upcoming Sessions"
              sessions={upcomingSessions}
              students={students}
              trainers={trainers}
              variant="sidebar"
              maxHeightClass="max-h-[70vh]"
            />
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
    </div>
  );
}
