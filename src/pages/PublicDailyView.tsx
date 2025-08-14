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
              onClick={() => (isFullscreen ? exitFullscreen() : enterFullscreen())}
              className="px-2 py-1 rounded border text-sm border-gray-300 hover:bg-gray-50"
              title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            >
              {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            </button>
          </div>
        </div>
        <div ref={gridContainerRef} className="relative">
          {isFullscreen && (
            <button
              onClick={exitFullscreen}
              className="absolute top-2 right-2 z-10 px-2 py-1 rounded bg-white border border-gray-300 shadow hover:bg-gray-50"
              title="Exit Fullscreen"
            >
              ✕
            </button>
          )}
          {isFullscreen ? (
            <DailyGridView
              date={toDate(selectedDate)}
              appointments={sessions}
              students={students}
              trainers={trainers}
              config={{ ...GRID_CONFIG, laneWidthPx: 64 }}
            />
          ) : (
            <div className="bg-white/90 backdrop-blur rounded-2xl p-6 md:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.06)] ring-1 ring-primary-100">
              <DailyGridView
                date={toDate(selectedDate)}
                appointments={sessions}
                students={students}
                trainers={trainers}
                config={{ ...GRID_CONFIG, laneWidthPx: 64 }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
