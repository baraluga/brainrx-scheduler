import { useMemo, useRef, useState } from "react";
import { Session, SessionType, Student, Trainer } from "../../types/index";

 type DailyGridConfig = {
   businessStartMinutes: number; // minutes from midnight (e.g., 10:00 → 600)
   businessEndMinutes: number; // minutes from midnight (e.g., 19:00 → 1140)
   incrementMinutes: number; // 15
   slotsPerType: Record<SessionType, number>;
   laneWidthPx?: number; // default 120
   nowOffsetMinutes?: number; // dev/demo: offset current time indicator
 };

type DailyGridViewProps = {
  date: Date;
  appointments: Session[];
  students: Student[];
  trainers: Trainer[];
  config: DailyGridConfig;
  onSelect?: (session: Session) => void;
  onSeatChange?: (session: Session, newSeat: number) => void;
};

type PositionedSession = Session & {
  laneIndex: number;
};

// Expanded, more distinct palette
const TRAINER_COLORS = [
  "#60a5fa",
  "#818cf8",
  "#a78bfa",
  "#f472b6",
  "#fb7185",
  "#fb923c",
  "#f59e0b",
  "#34d399",
  "#22d3ee",
  "#4ade80",
  "#93c5fd",
  "#a5b4fc",
  "#c4b5fd",
  "#f9a8d4",
  "#fca5a5",
  "#fdba74",
  "#fcd34d",
  "#7dd3fc",
  "#6ee7b7",
  "#86efac",
];

function minutesBetween(a: string, b: string): number {
  const [ah, am] = a.split(":").map(Number);
  const [bh, bm] = b.split(":").map(Number);
  return bh * 60 + bm - (ah * 60 + am);
}

function hhmmToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function buildTrainerColorMap(trainers: Trainer[]): Map<string, string> {
  const ids = [...trainers].map((t) => t.id).sort();
  const map = new Map<string, string>();
  const n = TRAINER_COLORS.length;
  const step = 7;
  ids.forEach((id, index) => {
    map.set(id, TRAINER_COLORS[(index * step) % n]);
  });
  return map;
}

function placeInSeats(
  appointments: Session[],
  slotCount: number
): PositionedSession[] {
  // Use assigned seat from session data (1-indexed) and convert to 0-indexed for display
  return appointments.map(appt => ({
    ...appt,
    laneIndex: Math.max(0, Math.min(appt.assignedSeat - 1, slotCount - 1)) // Convert 1-indexed to 0-indexed and clamp to valid range
  }));
}

export default function DailyGridView({
  date,
  appointments,
  students,
  trainers,
  config,
  onSelect,
  onSeatChange,
}: DailyGridViewProps) {
  const {
    businessStartMinutes,
    businessEndMinutes,
    incrementMinutes,
    slotsPerType,
     laneWidthPx,
     nowOffsetMinutes,
  } = config;

  const dateKey = date.toDateString();
  const daySessions = useMemo(() => {
    return appointments.filter(
      (a) => new Date(a.date).toDateString() === dateKey
    );
  }, [appointments, dateKey]);

  const getSessionType = (a: any): SessionType => {
    if (a.sessionType) return a.sessionType as SessionType;
    if (a.appointmentType === "training") return "training-tabletop";
    if (a.appointmentType === "gt-assessment") return "gt";
    return "training-tabletop";
  };

  const minsToLabel = (mins: number): string => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    const period = h >= 12 ? "PM" : "AM";
    const hh = h % 12 === 0 ? 12 : h % 12;
    return `${hh}:${String(m).padStart(2, "0")} ${period}`;
  };

  const timeSlots = useMemo(() => {
    const list: number[] = [];
    for (
      let t = businessStartMinutes;
      t < businessEndMinutes;
      t += incrementMinutes
    ) {
      list.push(t);
    }
    return list;
  }, [businessStartMinutes, businessEndMinutes, incrementMinutes]);

  // Hide the first increment (e.g., 10:00) for visual symmetry with the hidden last increment
  const timeSlotsNoFirst = useMemo(() => timeSlots.slice(1), [timeSlots])

  const tabletopPositioned = useMemo(() => {
    return placeInSeats(
      daySessions.filter((a) => getSessionType(a) === "training-tabletop"),
      slotsPerType["training-tabletop"]
    );
  }, [daySessions, slotsPerType]);

  const digitalPositioned = useMemo(() => {
    return placeInSeats(
      daySessions.filter((a) => getSessionType(a) === "training-digital"),
      slotsPerType["training-digital"]
    );
  }, [daySessions, slotsPerType]);

  const arxPositioned = useMemo(() => {
    return placeInSeats(
      daySessions.filter((a) => getSessionType(a) === "accelerate-rx"),
      slotsPerType["accelerate-rx"]
    );
  }, [daySessions, slotsPerType]);

  const remotePositioned = useMemo(() => {
    return placeInSeats(
      daySessions.filter((a) => getSessionType(a) === "remote"),
      slotsPerType["remote"]
    );
  }, [daySessions, slotsPerType]);

  const gtPositioned = useMemo(() => {
    return placeInSeats(
      daySessions.filter((a) => getSessionType(a) === "gt"),
      slotsPerType["gt"]
    );
  }, [daySessions, slotsPerType]);

  const rowHeight = 28; // px per 15 min
  const gridHeight =
    ((businessEndMinutes - businessStartMinutes) / incrementMinutes) *
    rowHeight;
  const BLOCK_GAP = 4; // px – consistent horizontal and vertical spacing
  const LANE_WIDTH = laneWidthPx ?? 120; // px – wide enough to show 8-char nickname

  const getName = (
    id: string,
    list: Array<{ id: string; name?: string; firstName?: string }>
  ) => {
    const item = list.find((x) => x.id === id);
    return item?.firstName || item?.name || "Unknown";
  };
  const trainerColorMap = useMemo(
    () => buildTrainerColorMap(trainers),
    [trainers]
  );

  // Tinted backgrounds per session type (distinct from trainer block colors)
  const COLUMN_BG: Record<SessionType, string> = {
    'training-tabletop': 'rgba(125, 211, 252, 0.12)',   // sky-400 @12%
    'training-digital': 'rgba(129, 140, 248, 0.12)',    // indigo-400 @12%
    'accelerate-rx': 'rgba(245, 158, 11, 0.12)',        // amber-500 @12%
    'remote': 'rgba(52, 211, 153, 0.12)',               // emerald-400 @12%
    'gt': 'rgba(192, 132, 252, 0.12)',                  // purple-400 @12%
  }
  const HEADER_BG: Record<SessionType, string> = {
    'training-tabletop': 'rgba(125, 211, 252, 0.35)',
    'training-digital': 'rgba(129, 140, 248, 0.35)',
    'accelerate-rx': 'rgba(245, 158, 11, 0.35)',
    'remote': 'rgba(52, 211, 153, 0.35)',
    'gt': 'rgba(192, 132, 252, 0.35)',
  }

   const nowLineTop = (() => {
    const today = new Date();
    if (today.toDateString() !== dateKey) return null;
     let nowMins = today.getHours() * 60 + today.getMinutes();
     if (typeof nowOffsetMinutes === 'number') {
       nowMins = (nowMins + nowOffsetMinutes + 1440) % 1440;
     }
    if (nowMins < businessStartMinutes || nowMins > businessEndMinutes)
      return null;
    return ((nowMins - businessStartMinutes) / incrementMinutes) * rowHeight;
  })();

   const currentSlotTop = (() => {
    const today = new Date();
    if (today.toDateString() !== dateKey) return null;
     let nowMins = today.getHours() * 60 + today.getMinutes();
     if (typeof nowOffsetMinutes === 'number') {
       nowMins = (nowMins + nowOffsetMinutes + 1440) % 1440;
     }
    if (nowMins < businessStartMinutes || nowMins > businessEndMinutes)
      return null;
    const slotIndex = Math.floor(
      (nowMins - businessStartMinutes) / incrementMinutes
    );
    return slotIndex * rowHeight;
  })();

  const [editOverlayVisibleId, setEditOverlayVisibleId] = useState<string | null>(null);
  const hoverTimerRef = useRef<number | null>(null);
  const [draggingSessionId, setDraggingSessionId] = useState<string | null>(null);
  const [draggingSessionType, setDraggingSessionType] = useState<SessionType | null>(null);
  const [dragHover, setDragHover] = useState<{ type: SessionType; laneIndex: number } | null>(null);
  const [successFlashId, setSuccessFlashId] = useState<string | null>(null);

  const handleMouseEnter = (sessionId: string) => {
    if (hoverTimerRef.current) {
      window.clearTimeout(hoverTimerRef.current);
    }
    hoverTimerRef.current = window.setTimeout(() => {
      setEditOverlayVisibleId(sessionId);
    }, 500);
  };

  const handleMouseLeave = (sessionId: string) => {
    if (hoverTimerRef.current) {
      window.clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    setEditOverlayVisibleId((current) => (current === sessionId ? null : current));
  };

  const renderAppt = (p: PositionedSession) => {
    const startOffset =
      ((hhmmToMinutes(p.startTime) - businessStartMinutes) / incrementMinutes) *
      rowHeight;
    const duration = minutesBetween(p.startTime, p.endTime);
    const height = Math.max(
      6,
      (duration / incrementMinutes) * rowHeight - BLOCK_GAP
    );
    const leftPx = p.laneIndex * LANE_WIDTH;
    const trainer = trainers.find((t) => t.id === p.trainerId);
    const color = trainerColorMap.get(p.trainerId) || TRAINER_COLORS[0];
    const borderColor = trainer?.canDoGtAssessments ? "#2563eb" : "#6b7280"; // blue if GT-capable, gray otherwise
    const studentObj = students.find((s) => s.id === p.studentId);
    const studentName = studentObj?.firstName || p.clientName || getName(p.studentId || '', students);
    const trainerNick = trainer?.firstName || getName(p.trainerId, trainers);
    //

    const isDragging = draggingSessionId === p.id;
    const isFlashingSuccess = successFlashId === p.id;

    return (
      <div
        key={p.id}
        className={`group absolute px-2 py-1 rounded-md overflow-hidden shadow-sm hover:shadow-md transition ${onSeatChange ? 'cursor-grab active:cursor-grabbing hover:-translate-y-0.5' : 'cursor-default'} ${isDragging ? 'ring-2 ring-primary-500 opacity-85' : ''} ${isFlashingSuccess ? 'ring-2 ring-emerald-500' : ''}`}
        style={{
          top: startOffset + BLOCK_GAP / 2,
          height,
          left: leftPx + BLOCK_GAP / 2,
          width: LANE_WIDTH - BLOCK_GAP,
          backgroundColor: color,
          border: `1px solid ${borderColor}`,
        }}
        title={`${studentName} — ${trainerNick}\n${p.startTime}–${p.endTime} (${p.status})`}
        onMouseEnter={() => handleMouseEnter(p.id)}
        onMouseLeave={() => handleMouseLeave(p.id)}
        draggable={!!onSeatChange}
        onDragStart={(e) => {
          if (!onSeatChange) return;
          setDraggingSessionId(p.id);
          setDraggingSessionType(p.sessionType);
          try {
            e.dataTransfer?.setData('text/plain', p.id);
            e.dataTransfer?.setDragImage(e.currentTarget, 10, 10);
          } catch {}
        }}
        onDragEnd={() => {
          setDraggingSessionId(null);
          setDraggingSessionType(null);
          setDragHover(null);
        }}
      >
        {onSelect && editOverlayVisibleId === p.id && (
          <button
            type="button"
            aria-label="Edit session"
            onClick={(e) => {
              e.stopPropagation();
              onSelect?.(p);
            }}
            className="absolute top-1 right-1 z-10 px-1.5 py-0.5 rounded text-[10px] bg-white/90 text-gray-800 border border-gray-300 shadow-sm"
          >
            Edit
          </button>
        )}
        <div className="text-[12px] font-bold text-ink-900 truncate leading-tight">
          {studentName}
        </div>
        <div className="text-[10px] text-ink-700 leading-tight">{trainerNick}</div>
      </div>
    );
  };

  const ttColWidth = slotsPerType["training-tabletop"] * LANE_WIDTH;
  const dgColWidth = slotsPerType["training-digital"] * LANE_WIDTH;
  const arxColWidth = slotsPerType["accelerate-rx"] * LANE_WIDTH;
  const rmColWidth = slotsPerType["remote"] * LANE_WIDTH;
  const gtColWidth = slotsPerType["gt"] * LANE_WIDTH;

  return (
    <div className="bg-white shadow rounded-lg overflow-x-auto">
      <div
        className="grid"
        style={{
          gridTemplateColumns: `120px ${ttColWidth}px ${dgColWidth}px ${arxColWidth}px ${rmColWidth}px ${gtColWidth}px`,
        }}
      >
        {/* Two-level header */}
        <div className="border-b border-r border-gray-200 sticky left-0 z-20 bg-white" />
        <div className="border-b border-gray-200 text-center font-semibold py-2" style={{ backgroundColor: HEADER_BG['training-tabletop'] }}>
          Training (Table-top)
        </div>
        <div className="border-b border-gray-200 text-center font-semibold py-2" style={{ backgroundColor: HEADER_BG['training-digital'] }}>
          Training (Digital)
        </div>
        <div className="border-b border-gray-200 text-center font-semibold py-2" style={{ backgroundColor: HEADER_BG['accelerate-rx'] }}>
          AccelerateRx
        </div>
        <div className="border-b border-gray-200 text-center font-semibold py-2" style={{ backgroundColor: HEADER_BG['remote'] }}>
          Remote
        </div>
        <div className="border-b border-gray-200 text-center font-semibold py-2" style={{ backgroundColor: HEADER_BG['gt'] }}>
          GT
        </div>

        {/* Second header row with slot numbers */}
        <div className="border-b border-r border-gray-200 bg-gray-50 text-xs text-gray-600 py-2 px-3 sticky left-0 z-20">
          Time
        </div>
        <div className="border-b border-gray-200" style={{ backgroundColor: HEADER_BG['training-tabletop'] }}>
          <div
            className="grid"
            style={{
              gridTemplateColumns: `repeat(${slotsPerType["training-tabletop"]}, ${LANE_WIDTH}px)`,
            }}
          >
            {Array.from({ length: slotsPerType["training-tabletop"] }).map(
              (_, i) => (
                <div
                  key={i}
                  className="text-xs text-gray-600 text-center py-2 border-l first:border-l-0 border-gray-200"
                >
                  {i + 1}
                </div>
              )
            )}
          </div>
        </div>
        <div className="border-b border-gray-200" style={{ backgroundColor: HEADER_BG['training-digital'] }}>
          <div
            className="grid"
            style={{
              gridTemplateColumns: `repeat(${slotsPerType["training-digital"]}, ${LANE_WIDTH}px)`,
            }}
          >
            {Array.from({ length: slotsPerType["training-digital"] }).map(
              (_, i) => (
                <div
                  key={i}
                  className="text-xs text-gray-600 text-center py-2 border-l first:border-l-0 border-gray-200"
                >
                  {i + 1}
                </div>
              )
            )}
          </div>
        </div>
        <div className="border-b border-gray-200" style={{ backgroundColor: HEADER_BG['accelerate-rx'] }}>
          <div
            className="grid"
            style={{
              gridTemplateColumns: `repeat(${slotsPerType["accelerate-rx"]}, ${LANE_WIDTH}px)`,
            }}
          >
            {Array.from({ length: slotsPerType["accelerate-rx"] }).map(
              (_, i) => (
                <div
                  key={i}
                  className="text-xs text-gray-600 text-center py-2 border-l first:border-l-0 border-gray-200"
                >
                  {i + 1}
                </div>
              )
            )}
          </div>
        </div>
        <div className="border-b border-gray-200" style={{ backgroundColor: HEADER_BG['remote'] }}>
          <div
            className="grid"
            style={{
              gridTemplateColumns: `repeat(${slotsPerType["remote"]}, ${LANE_WIDTH}px)`,
            }}
          >
            {Array.from({ length: slotsPerType["remote"] }).map((_, i) => (
              <div
                key={i}
                className="text-xs text-gray-600 text-center py-2 border-l first:border-l-0 border-gray-200"
              >
                {i + 1}
              </div>
            ))}
          </div>
        </div>
        <div className="border-b border-gray-200" style={{ backgroundColor: HEADER_BG['gt'] }}>
          <div
            className="grid"
            style={{
              gridTemplateColumns: `repeat(${slotsPerType["gt"]}, ${LANE_WIDTH}px)`,
            }}
          >
            {Array.from({ length: slotsPerType["gt"] }).map((_, i) => (
              <div
                key={i}
                className="text-xs text-gray-600 text-center py-2 border-l first:border-l-0 border-gray-200"
              >
                {i + 1}
              </div>
            ))}
          </div>
        </div>

        {/* Body: time column + canvases */}
        <div className="sticky left-0 z-10 bg-white border-r border-gray-200">
          <div className="relative" style={{ height: gridHeight }}>
            {nowLineTop !== null && (
              <div
                className="pointer-events-none absolute left-0 right-0 h-0.5 bg-red-500/60"
                style={{ top: nowLineTop }}
              />
            )}
            {currentSlotTop !== null && (
              <div
                className="absolute left-0 right-0"
                style={{
                  top: currentSlotTop,
                  height: rowHeight,
                  backgroundColor: "rgba(251, 191, 36, 0.15)",
                }}
              />
            )}
          {timeSlotsNoFirst.map((mins) => (
              <div
                key={mins}
                className="absolute w-full border-t border-gray-200 text-[11px] text-gray-600 pr-2"
                style={{
                  top:
                    ((mins - businessStartMinutes) / incrementMinutes) *
                      rowHeight -
                    0.5,
                }}
              >
                <div className="-mt-2 text-right pr-2">{minsToLabel(mins)}</div>
              </div>
            ))}
          </div>
        </div>
        <div
          className="relative border-l border-gray-200"
          style={{ height: gridHeight, width: ttColWidth, backgroundColor: COLUMN_BG['training-tabletop'] }}
          onDragOver={(e) => {
            if (draggingSessionType !== 'training-tabletop') return;
            e.preventDefault();
            const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
            const x = e.clientX - rect.left;
            const laneIndex = Math.max(0, Math.min(Math.floor(x / LANE_WIDTH), slotsPerType['training-tabletop'] - 1));
            setDragHover({ type: 'training-tabletop', laneIndex });
          }}
          onDragLeave={() => {
            if (draggingSessionType !== 'training-tabletop') return;
            setDragHover((h) => (h && h.type === 'training-tabletop' ? null : h));
          }}
          onDrop={(e) => {
            if (!onSeatChange || draggingSessionType !== 'training-tabletop' || !draggingSessionId) return;
            e.preventDefault();
            const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
            const x = e.clientX - rect.left;
            const laneIndex = Math.max(0, Math.min(Math.floor(x / LANE_WIDTH), slotsPerType['training-tabletop'] - 1));
            const session = daySessions.find((s) => s.id === draggingSessionId);
            if (session && session.sessionType === 'training-tabletop') {
              const newSeat = laneIndex + 1;
              if (newSeat !== session.assignedSeat) {
                onSeatChange(session, newSeat);
                setSuccessFlashId(session.id);
                window.setTimeout(() => setSuccessFlashId((id) => (id === session.id ? null : id)), 700);
              }
            }
            setDragHover(null);
            setDraggingSessionId(null);
            setDraggingSessionType(null);
          }}
        >
          {/* Background grid lines */}
          {currentSlotTop !== null && (
            <div
              className="absolute left-0 right-0"
              style={{
                top: currentSlotTop,
                height: rowHeight,
                backgroundColor: "rgba(251, 191, 36, 0.15)",
              }}
            />
          )}
          {timeSlotsNoFirst.map((mins) => (
            <div
              key={mins}
              className="absolute left-0 right-0 border-t border-gray-100"
              style={{
                top:
                  ((mins - businessStartMinutes) / incrementMinutes) *
                  rowHeight,
              }}
            />
          ))}
          {/* Hover lane indicator (drag) */}
          {dragHover && draggingSessionType === 'training-tabletop' && dragHover.type === 'training-tabletop' && (
            <div
              className="absolute top-0 bottom-0 pointer-events-none"
              style={{
                left: dragHover.laneIndex * LANE_WIDTH,
                width: LANE_WIDTH,
                backgroundColor: 'rgba(255,255,255,0.25)',
                outline: '2px dashed rgba(55, 65, 81, 0.6)',
                outlineOffset: '-2px',
              }}
            />
          )}
          {/* Sessions */}
          {tabletopPositioned.map(renderAppt)}
          {/* Now line */}
          {nowLineTop !== null && (
            <div
              className="pointer-events-none absolute left-0 right-0 h-0.5 bg-red-500/60"
              style={{ top: nowLineTop }}
            />
          )}
        </div>
        <div
          className="relative border-l border-gray-200"
          style={{ height: gridHeight, width: dgColWidth, backgroundColor: COLUMN_BG['training-digital'] }}
          onDragOver={(e) => {
            if (draggingSessionType !== 'training-digital') return;
            e.preventDefault();
            const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
            const x = e.clientX - rect.left;
            const laneIndex = Math.max(0, Math.min(Math.floor(x / LANE_WIDTH), slotsPerType['training-digital'] - 1));
            setDragHover({ type: 'training-digital', laneIndex });
          }}
          onDragLeave={() => {
            if (draggingSessionType !== 'training-digital') return;
            setDragHover((h) => (h && h.type === 'training-digital' ? null : h));
          }}
          onDrop={(e) => {
            if (!onSeatChange || draggingSessionType !== 'training-digital' || !draggingSessionId) return;
            e.preventDefault();
            const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
            const x = e.clientX - rect.left;
            const laneIndex = Math.max(0, Math.min(Math.floor(x / LANE_WIDTH), slotsPerType['training-digital'] - 1));
            const session = daySessions.find((s) => s.id === draggingSessionId);
            if (session && session.sessionType === 'training-digital') {
              const newSeat = laneIndex + 1;
              if (newSeat !== session.assignedSeat) {
                onSeatChange(session, newSeat);
                setSuccessFlashId(session.id);
                window.setTimeout(() => setSuccessFlashId((id) => (id === session.id ? null : id)), 700);
              }
            }
            setDragHover(null);
            setDraggingSessionId(null);
            setDraggingSessionType(null);
          }}
        >
          {currentSlotTop !== null && (
            <div
              className="absolute left-0 right-0"
              style={{
                top: currentSlotTop,
                height: rowHeight,
                backgroundColor: "rgba(251, 191, 36, 0.15)",
              }}
            />
          )}
          {timeSlotsNoFirst.map((mins) => (
            <div
              key={mins}
              className="absolute left-0 right-0 border-t border-gray-100"
              style={{
                top:
                  ((mins - businessStartMinutes) / incrementMinutes) *
                  rowHeight,
              }}
            />
          ))}
          {dragHover && draggingSessionType === 'training-digital' && dragHover.type === 'training-digital' && (
            <div
              className="absolute top-0 bottom-0 pointer-events-none"
              style={{
                left: dragHover.laneIndex * LANE_WIDTH,
                width: LANE_WIDTH,
                backgroundColor: 'rgba(255,255,255,0.25)',
                outline: '2px dashed rgba(55, 65, 81, 0.6)',
                outlineOffset: '-2px',
              }}
            />
          )}
          {digitalPositioned.map(renderAppt)}
          {nowLineTop !== null && (
            <div
              className="pointer-events-none absolute left-0 right-0 h-0.5 bg-red-500/60"
              style={{ top: nowLineTop }}
            />
          )}
        </div>
        <div
          className="relative border-l border-gray-200"
          style={{ height: gridHeight, width: arxColWidth, backgroundColor: COLUMN_BG['accelerate-rx'] }}
          onDragOver={(e) => {
            if (draggingSessionType !== 'accelerate-rx') return;
            e.preventDefault();
            const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
            const x = e.clientX - rect.left;
            const laneIndex = Math.max(0, Math.min(Math.floor(x / LANE_WIDTH), slotsPerType['accelerate-rx'] - 1));
            setDragHover({ type: 'accelerate-rx', laneIndex });
          }}
          onDragLeave={() => {
            if (draggingSessionType !== 'accelerate-rx') return;
            setDragHover((h) => (h && h.type === 'accelerate-rx' ? null : h));
          }}
          onDrop={(e) => {
            if (!onSeatChange || draggingSessionType !== 'accelerate-rx' || !draggingSessionId) return;
            e.preventDefault();
            const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
            const x = e.clientX - rect.left;
            const laneIndex = Math.max(0, Math.min(Math.floor(x / LANE_WIDTH), slotsPerType['accelerate-rx'] - 1));
            const session = daySessions.find((s) => s.id === draggingSessionId);
            if (session && session.sessionType === 'accelerate-rx') {
              const newSeat = laneIndex + 1;
              if (newSeat !== session.assignedSeat) {
                onSeatChange(session, newSeat);
                setSuccessFlashId(session.id);
                window.setTimeout(() => setSuccessFlashId((id) => (id === session.id ? null : id)), 700);
              }
            }
            setDragHover(null);
            setDraggingSessionId(null);
            setDraggingSessionType(null);
          }}
        >
          {currentSlotTop !== null && (
            <div
              className="absolute left-0 right-0"
              style={{
                top: currentSlotTop,
                height: rowHeight,
                backgroundColor: "rgba(251, 191, 36, 0.15)",
              }}
            />
          )}
          {timeSlotsNoFirst.map((mins) => (
            <div
              key={mins}
              className="absolute left-0 right-0 border-t border-gray-100"
              style={{
                top:
                  ((mins - businessStartMinutes) / incrementMinutes) *
                  rowHeight,
              }}
            />
          ))}
          {dragHover && draggingSessionType === 'accelerate-rx' && dragHover.type === 'accelerate-rx' && (
            <div
              className="absolute top-0 bottom-0 pointer-events-none"
              style={{
                left: dragHover.laneIndex * LANE_WIDTH,
                width: LANE_WIDTH,
                backgroundColor: 'rgba(255,255,255,0.25)',
                outline: '2px dashed rgba(55, 65, 81, 0.6)',
                outlineOffset: '-2px',
              }}
            />
          )}
          {arxPositioned.map(renderAppt)}
          {nowLineTop !== null && (
            <div
              className="pointer-events-none absolute left-0 right-0 h-0.5 bg-red-500/60"
              style={{ top: nowLineTop }}
            />
          )}
        </div>
        <div
          className="relative border-l border-gray-200"
          style={{ height: gridHeight, width: rmColWidth, backgroundColor: COLUMN_BG['remote'] }}
          onDragOver={(e) => {
            if (draggingSessionType !== 'remote') return;
            e.preventDefault();
            const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
            const x = e.clientX - rect.left;
            const laneIndex = Math.max(0, Math.min(Math.floor(x / LANE_WIDTH), slotsPerType['remote'] - 1));
            setDragHover({ type: 'remote', laneIndex });
          }}
          onDragLeave={() => {
            if (draggingSessionType !== 'remote') return;
            setDragHover((h) => (h && h.type === 'remote' ? null : h));
          }}
          onDrop={(e) => {
            if (!onSeatChange || draggingSessionType !== 'remote' || !draggingSessionId) return;
            e.preventDefault();
            const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
            const x = e.clientX - rect.left;
            const laneIndex = Math.max(0, Math.min(Math.floor(x / LANE_WIDTH), slotsPerType['remote'] - 1));
            const session = daySessions.find((s) => s.id === draggingSessionId);
            if (session && session.sessionType === 'remote') {
              const newSeat = laneIndex + 1;
              if (newSeat !== session.assignedSeat) {
                onSeatChange(session, newSeat);
                setSuccessFlashId(session.id);
                window.setTimeout(() => setSuccessFlashId((id) => (id === session.id ? null : id)), 700);
              }
            }
            setDragHover(null);
            setDraggingSessionId(null);
            setDraggingSessionType(null);
          }}
        >
          {currentSlotTop !== null && (
            <div
              className="absolute left-0 right-0"
              style={{
                top: currentSlotTop,
                height: rowHeight,
                backgroundColor: "rgba(251, 191, 36, 0.15)",
              }}
            />
          )}
          {timeSlotsNoFirst.map((mins) => (
            <div
              key={mins}
              className="absolute left-0 right-0 border-t border-gray-100"
              style={{
                top:
                  ((mins - businessStartMinutes) / incrementMinutes) *
                  rowHeight,
              }}
            />
          ))}
          {dragHover && draggingSessionType === 'remote' && dragHover.type === 'remote' && (
            <div
              className="absolute top-0 bottom-0 pointer-events-none"
              style={{
                left: dragHover.laneIndex * LANE_WIDTH,
                width: LANE_WIDTH,
                backgroundColor: 'rgba(255,255,255,0.25)',
                outline: '2px dashed rgba(55, 65, 81, 0.6)',
                outlineOffset: '-2px',
              }}
            />
          )}
          {remotePositioned.map(renderAppt)}
          {nowLineTop !== null && (
            <div
              className="pointer-events-none absolute left-0 right-0 h-0.5 bg-red-500/60"
              style={{ top: nowLineTop }}
            />
          )}
        </div>
        <div
          className="relative border-l border-gray-200"
          style={{ height: gridHeight, width: gtColWidth, backgroundColor: COLUMN_BG['gt'] }}
          onDragOver={(e) => {
            if (draggingSessionType !== 'gt') return;
            e.preventDefault();
            const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
            const x = e.clientX - rect.left;
            const laneIndex = Math.max(0, Math.min(Math.floor(x / LANE_WIDTH), slotsPerType['gt'] - 1));
            setDragHover({ type: 'gt', laneIndex });
          }}
          onDragLeave={() => {
            if (draggingSessionType !== 'gt') return;
            setDragHover((h) => (h && h.type === 'gt' ? null : h));
          }}
          onDrop={(e) => {
            if (!onSeatChange || draggingSessionType !== 'gt' || !draggingSessionId) return;
            e.preventDefault();
            const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
            const x = e.clientX - rect.left;
            const laneIndex = Math.max(0, Math.min(Math.floor(x / LANE_WIDTH), slotsPerType['gt'] - 1));
            const session = daySessions.find((s) => s.id === draggingSessionId);
            if (session && session.sessionType === 'gt') {
              const newSeat = laneIndex + 1;
              if (newSeat !== session.assignedSeat) {
                onSeatChange(session, newSeat);
                setSuccessFlashId(session.id);
                window.setTimeout(() => setSuccessFlashId((id) => (id === session.id ? null : id)), 700);
              }
            }
            setDragHover(null);
            setDraggingSessionId(null);
            setDraggingSessionType(null);
          }}
        >
          {currentSlotTop !== null && (
            <div
              className="absolute left-0 right-0"
              style={{
                top: currentSlotTop,
                height: rowHeight,
                backgroundColor: "rgba(251, 191, 36, 0.15)",
              }}
            />
          )}
          {timeSlotsNoFirst.map((mins) => (
            <div
              key={mins}
              className="absolute left-0 right-0 border-t border-gray-100"
              style={{
                top:
                  ((mins - businessStartMinutes) / incrementMinutes) *
                  rowHeight,
              }}
            />
          ))}
          {dragHover && draggingSessionType === 'gt' && dragHover.type === 'gt' && (
            <div
              className="absolute top-0 bottom-0 pointer-events-none"
              style={{
                left: dragHover.laneIndex * LANE_WIDTH,
                width: LANE_WIDTH,
                backgroundColor: 'rgba(255,255,255,0.25)',
                outline: '2px dashed rgba(55, 65, 81, 0.6)',
                outlineOffset: '-2px',
              }}
            />
          )}
          {gtPositioned.map(renderAppt)}
          {nowLineTop !== null && (
            <div
              className="pointer-events-none absolute left-0 right-0 h-0.5 bg-red-500/60 animate-pulse"
              style={{ top: nowLineTop }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
