import { Session, SessionType, Student, Trainer } from "../../types";

type UpcomingListProps = {
  title?: string;
  sessions: Session[];
  students: Student[];
  trainers: Trainer[];
  variant?: "sidebar" | "mobile";
  maxHeightClass?: string;
};

function formatTime(timeString: string): string {
  const [hours, minutes] = timeString.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
}

function getTypeLabel(t: SessionType): string {
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
}

function getStudentName(s: Session, students: Student[]): string {
  if (s.studentId) {
    const found = students.find((x) => x.id === s.studentId);
    return found?.firstName || found?.name || "Unknown Student";
  }
  if (s.clientName) return s.clientName;
  return "Unknown Client";
}

function getTrainerName(id: string, trainers: Trainer[]): string {
  const t = trainers.find((x) => x.id === id);
  return t?.firstName || t?.name || "Unknown Trainer";
}

function SessionRow({ s, students, trainers }: { s: Session; students: Student[]; trainers: Trainer[] }) {
  return (
    <div className="py-3 flex items-start justify-between">
      <div className="flex-1">
        <div className="text-[15px] md:text-base font-extrabold text-ink-900">
          {formatTime(s.startTime)} – {formatTime(s.endTime)}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-2 pr-1 pl-[1px]">
          <span className="inline-flex items-center pl-2 pr-2 py-0.5 rounded-full text-[11px] font-semibold bg-primary-50 text-primary-700 ring-1 ring-primary-200">
            {getTypeLabel(s.sessionType)}
          </span>
          {s.assignedSeat ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-gray-50 text-gray-700 ring-1 ring-gray-200">
              Seat {s.assignedSeat}
            </span>
          ) : null}
        </div>
        <div className="mt-1 text-xs text-ink-700">
          {getStudentName(s, students)}
          <span className="mx-1 text-ink-400">•</span>
          Trainer: {getTrainerName(s.trainerId, trainers)}
        </div>
      </div>
    </div>
  );
}

export default function UpcomingList({
  title = "Upcoming Sessions",
  sessions,
  students,
  trainers,
  variant = "sidebar",
  maxHeightClass = "max-h-[70vh]",
}: UpcomingListProps) {
  if (variant === "mobile") {
    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-extrabold text-ink-900 flex items-center gap-2">
            <span className="inline-flex w-2 h-2 rounded-full bg-green-500 animate-pulse shadow" />
            {title}
          </h1>
        </div>
        <div className="space-y-3">
          {sessions.length === 0 ? (
            <div className="text-sm text-ink-500">No upcoming sessions</div>
          ) : (
            sessions.map((s) => (
              <div key={s.id} className="bg-white rounded-xl p-4 shadow-sm ring-1 ring-primary-100">
                <SessionRow s={s} students={students} trainers={trainers} />
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  // Sidebar variant
  return (
    <div className="bg-white/90 backdrop-blur rounded-2xl p-5 shadow-[0_8px_30px_rgba(0,0,0,0.06)] ring-1 ring-primary-100 overflow-visible">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-ink-900">{title}</h2>
      </div>
      <div className={`mt-3 divide-y divide-gray-100 overflow-y-auto overflow-x-visible no-scrollbar ${maxHeightClass}`}>
        {sessions.length === 0 ? (
          <div className="py-6 text-sm text-ink-500 text-center">No upcoming sessions</div>
        ) : (
          sessions.map((s) => <SessionRow key={s.id} s={s} students={students} trainers={trainers} />)
        )}
      </div>
    </div>
  );
}


