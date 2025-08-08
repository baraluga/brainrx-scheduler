import { useMemo } from 'react'
import { Appointment, SessionType, Student, Trainer } from '../../types/index'

type DailyGridConfig = {
  businessStartMinutes: number // minutes from midnight (e.g., 10:00 → 600)
  businessEndMinutes: number   // minutes from midnight (e.g., 19:00 → 1140)
  incrementMinutes: number     // 15
  slotsPerType: Record<SessionType, number>
  laneWidthPx?: number         // default 120
}

type DailyGridViewProps = {
  date: Date
  appointments: Appointment[]
  students: Student[]
  trainers: Trainer[]
  config: DailyGridConfig
}

type PositionedAppointment = Appointment & {
  laneIndex: number
}

const PASTEL_COLORS = [
  '#93c5fd', // blue-300
  '#a5b4fc', // indigo-300
  '#c4b5fd', // violet-300
  '#f9a8d4', // pink-300
  '#fca5a5', // red-300
  '#fdba74', // orange-300
  '#fcd34d', // amber-300
  '#86efac', // green-300
  '#7dd3fc', // sky-300
  '#6ee7b7', // emerald-300
]

function minutesBetween(a: string, b: string): number {
  const [ah, am] = a.split(':').map(Number)
  const [bh, bm] = b.split(':').map(Number)
  return (bh * 60 + bm) - (ah * 60 + am)
}

function hhmmToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

function getTrainerColor(trainerId: string): string {
  // Stable color selection by hashing trainerId
  let hash = 0
  for (let i = 0; i < trainerId.length; i++) {
    hash = (hash * 31 + trainerId.charCodeAt(i)) >>> 0
  }
  const idx = hash % PASTEL_COLORS.length
  return PASTEL_COLORS[idx]
}

function placeInLanes(appointments: Appointment[], slotCount: number): PositionedAppointment[] {
  // Greedy lane assignment by start time
  const sorted = [...appointments].sort((a, b) => a.startTime.localeCompare(b.startTime) || a.endTime.localeCompare(b.endTime))
  const laneEndTimes: number[] = new Array(slotCount).fill(0) // minutes from midnight
  const positioned: PositionedAppointment[] = []

  for (const appt of sorted) {
    const startMins = hhmmToMinutes(appt.startTime)
    const endMins = hhmmToMinutes(appt.endTime)
    let placed = false
    for (let lane = 0; lane < slotCount; lane++) {
      if (startMins >= laneEndTimes[lane]) {
        laneEndTimes[lane] = endMins
        positioned.push({ ...appt, laneIndex: lane })
        placed = true
        break
      }
    }
    if (!placed) {
      // Overflow: place in last lane and let it visually overlap; add marker via negative laneIndex is too complex, so keep last lane
      const last = slotCount - 1
      positioned.push({ ...appt, laneIndex: last })
      laneEndTimes[last] = Math.max(laneEndTimes[last], endMins)
    }
  }

  return positioned
}

export default function DailyGridView({ date, appointments, students, trainers, config }: DailyGridViewProps) {
  const {
    businessStartMinutes,
    businessEndMinutes,
    incrementMinutes,
    slotsPerType,
    laneWidthPx,
  } = config

  const dateKey = date.toDateString()
  const dayAppointments = useMemo(() => {
    return appointments.filter((a) => new Date(a.date).toDateString() === dateKey)
  }, [appointments, dateKey])

  const getSessionType = (a: any): SessionType => {
    if (a.sessionType) return a.sessionType as SessionType
    if (a.appointmentType === 'training') return 'training-tabletop'
    if (a.appointmentType === 'gt-assessment') return 'gt'
    return 'training-tabletop'
  }

  const minsToLabel = (mins: number): string => {
    const h = Math.floor(mins / 60)
    const m = mins % 60
    const period = h >= 12 ? 'PM' : 'AM'
    const hh = h % 12 === 0 ? 12 : h % 12
    return `${hh}:${String(m).padStart(2, '0')} ${period}`
  }

  const timeSlots = useMemo(() => {
    const list: number[] = []
    for (let t = businessStartMinutes; t < businessEndMinutes; t += incrementMinutes) {
      list.push(t)
    }
    return list
  }, [businessStartMinutes, businessEndMinutes, incrementMinutes])

  const tabletopPositioned = useMemo(() => {
    return placeInLanes(
      dayAppointments.filter((a) => getSessionType(a) === 'training-tabletop'),
      slotsPerType['training-tabletop']
    )
  }, [dayAppointments, slotsPerType])

  const digitalPositioned = useMemo(() => {
    return placeInLanes(
      dayAppointments.filter((a) => getSessionType(a) === 'training-digital'),
      slotsPerType['training-digital']
    )
  }, [dayAppointments, slotsPerType])

  const arxPositioned = useMemo(() => {
    return placeInLanes(
      dayAppointments.filter((a) => getSessionType(a) === 'accelerate-rx'),
      slotsPerType['accelerate-rx']
    )
  }, [dayAppointments, slotsPerType])

  const remotePositioned = useMemo(() => {
    return placeInLanes(
      dayAppointments.filter((a) => getSessionType(a) === 'remote'),
      slotsPerType['remote']
    )
  }, [dayAppointments, slotsPerType])

  const gtPositioned = useMemo(() => {
    return placeInLanes(
      dayAppointments.filter((a) => getSessionType(a) === 'gt'),
      slotsPerType['gt']
    )
  }, [dayAppointments, slotsPerType])

  const rowHeight = 28 // px per 15 min
  const gridHeight = ((businessEndMinutes - businessStartMinutes) / incrementMinutes) * rowHeight
  const BLOCK_GAP = 4 // px – consistent horizontal and vertical spacing
  const LANE_WIDTH = laneWidthPx ?? 120 // px – wide enough to show 8-char nickname

  const getName = (id: string, list: Array<{ id: string; name?: string; firstName?: string }>) => {
    const item = list.find((x) => x.id === id)
    return item?.firstName || item?.name || 'Unknown'
  }

  const nowLineTop = (() => {
    const today = new Date()
    if (today.toDateString() !== dateKey) return null
    const nowMins = today.getHours() * 60 + today.getMinutes()
    if (nowMins < businessStartMinutes || nowMins > businessEndMinutes) return null
    return ((nowMins - businessStartMinutes) / incrementMinutes) * rowHeight
  })()

  const renderAppt = (p: PositionedAppointment) => {
    const startOffset = (hhmmToMinutes(p.startTime) - businessStartMinutes) / incrementMinutes * rowHeight
    const duration = minutesBetween(p.startTime, p.endTime)
    const height = Math.max(6, (duration / incrementMinutes) * rowHeight - BLOCK_GAP)
    const leftPx = p.laneIndex * LANE_WIDTH
    const trainer = trainers.find(t => t.id === p.trainerId)
    const color = getTrainerColor(p.trainerId)
    const borderColor = trainer?.canDoGtAssessments ? '#2563eb' : '#6b7280' // blue if GT-capable, gray otherwise
    const studentObj = students.find(s => s.id === p.studentId)
    const studentName = studentObj?.firstName || getName(p.studentId, students)
    const trainerNick = trainer?.firstName || getName(p.trainerId, trainers)

    return (
      <div
        key={p.id}
        className="absolute px-2 py-1 rounded-md overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-default"
        style={{
          top: startOffset + BLOCK_GAP / 2,
          height,
          left: leftPx + BLOCK_GAP / 2,
          width: LANE_WIDTH - BLOCK_GAP,
          backgroundColor: color,
          border: `1px solid ${borderColor}`
        }}
        title={`${studentName} — ${trainerNick}\n${p.startTime}–${p.endTime} (${p.status})`}
      >
        <div className="text-[11px] font-medium text-gray-900 truncate">{studentName}</div>
        <div className="text-[10px] text-gray-700">{trainerNick}</div>
      </div>
    )
  }

  const ttColWidth = slotsPerType['training-tabletop'] * LANE_WIDTH
  const dgColWidth = slotsPerType['training-digital'] * LANE_WIDTH
  const arxColWidth = slotsPerType['accelerate-rx'] * LANE_WIDTH
  const rmColWidth = slotsPerType['remote'] * LANE_WIDTH
  const gtColWidth = slotsPerType['gt'] * LANE_WIDTH

  return (
    <div className="bg-white shadow rounded-lg overflow-x-auto">
      <div className="grid" style={{ gridTemplateColumns: `120px ${ttColWidth}px ${dgColWidth}px ${arxColWidth}px ${rmColWidth}px ${gtColWidth}px` }}>
        {/* Two-level header */}
        <div className="border-b border-gray-200" />
        <div className="border-b border-gray-200 text-center font-semibold py-2">Training (Table-top)</div>
        <div className="border-b border-gray-200 text-center font-semibold py-2">Training (Digital)</div>
        <div className="border-b border-gray-200 text-center font-semibold py-2">AccelerateRx</div>
        <div className="border-b border-gray-200 text-center font-semibold py-2">Remote</div>
        <div className="border-b border-gray-200 text-center font-semibold py-2">GT</div>

        {/* Second header row with slot numbers */}
        <div className="border-b border-gray-200 bg-gray-50 text-xs text-gray-600 py-2 px-3">Time</div>
        <div className="border-b border-gray-200 bg-gray-50">
          <div className="grid" style={{ gridTemplateColumns: `repeat(${slotsPerType['training-tabletop']}, ${LANE_WIDTH}px)` }}>
            {Array.from({ length: slotsPerType['training-tabletop'] }).map((_, i) => (
              <div key={i} className="text-xs text-gray-600 text-center py-2 border-l first:border-l-0 border-gray-200">{i + 1}</div>
            ))}
          </div>
        </div>
        <div className="border-b border-gray-200 bg-gray-50">
          <div className="grid" style={{ gridTemplateColumns: `repeat(${slotsPerType['training-digital']}, ${LANE_WIDTH}px)` }}>
            {Array.from({ length: slotsPerType['training-digital'] }).map((_, i) => (
              <div key={i} className="text-xs text-gray-600 text-center py-2 border-l first:border-l-0 border-gray-200">{i + 1}</div>
            ))}
          </div>
        </div>
        <div className="border-b border-gray-200 bg-gray-50">
          <div className="grid" style={{ gridTemplateColumns: `repeat(${slotsPerType['accelerate-rx']}, ${LANE_WIDTH}px)` }}>
            {Array.from({ length: slotsPerType['accelerate-rx'] }).map((_, i) => (
              <div key={i} className="text-xs text-gray-600 text-center py-2 border-l first:border-l-0 border-gray-200">{i + 1}</div>
            ))}
          </div>
        </div>
        <div className="border-b border-gray-200 bg-gray-50">
          <div className="grid" style={{ gridTemplateColumns: `repeat(${slotsPerType['remote']}, ${LANE_WIDTH}px)` }}>
            {Array.from({ length: slotsPerType['remote'] }).map((_, i) => (
              <div key={i} className="text-xs text-gray-600 text-center py-2 border-l first:border-l-0 border-gray-200">{i + 1}</div>
            ))}
          </div>
        </div>
        <div className="border-b border-gray-200 bg-gray-50">
          <div className="grid" style={{ gridTemplateColumns: `repeat(${slotsPerType['gt']}, ${LANE_WIDTH}px)` }}>
            {Array.from({ length: slotsPerType['gt'] }).map((_, i) => (
              <div key={i} className="text-xs text-gray-600 text-center py-2 border-l first:border-l-0 border-gray-200">{i + 1}</div>
            ))}
          </div>
        </div>

        {/* Body: time column + two canvases */}
        <div>
          <div className="relative" style={{ height: gridHeight }}>
            {timeSlots.map((mins) => (
              <div key={mins} className="absolute w-full border-t border-gray-200 text-[11px] text-gray-600 pr-2" style={{ top: ((mins - businessStartMinutes) / incrementMinutes) * rowHeight - 0.5 }}>
                <div className="-mt-2 text-right pr-2">{minsToLabel(mins)}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="relative border-l border-gray-200" style={{ height: gridHeight, width: ttColWidth }}>
          {/* Background grid lines */}
          {timeSlots.map((mins) => (
            <div key={mins} className="absolute left-0 right-0 border-t border-gray-100" style={{ top: ((mins - businessStartMinutes) / incrementMinutes) * rowHeight }} />
          ))}
          {/* Appointments */}
          {tabletopPositioned.map(renderAppt)}
          {/* Now line */}
          {nowLineTop !== null && (
            <div className="absolute left-0 right-0 border-t-2 border-red-500" style={{ top: nowLineTop }} />
          )}
        </div>
        <div className="relative border-l border-gray-200" style={{ height: gridHeight, width: dgColWidth }}>
          {timeSlots.map((mins) => (
            <div key={mins} className="absolute left-0 right-0 border-t border-gray-100" style={{ top: ((mins - businessStartMinutes) / incrementMinutes) * rowHeight }} />
          ))}
          {digitalPositioned.map(renderAppt)}
          {nowLineTop !== null && (
            <div className="absolute left-0 right-0 border-t-2 border-red-500" style={{ top: nowLineTop }} />
          )}
        </div>
        <div className="relative border-l border-gray-200" style={{ height: gridHeight, width: arxColWidth }}>
          {timeSlots.map((mins) => (
            <div key={mins} className="absolute left-0 right-0 border-t border-gray-100" style={{ top: ((mins - businessStartMinutes) / incrementMinutes) * rowHeight }} />
          ))}
          {arxPositioned.map(renderAppt)}
          {nowLineTop !== null && (
            <div className="absolute left-0 right-0 border-t-2 border-red-500" style={{ top: nowLineTop }} />
          )}
        </div>
        <div className="relative border-l border-gray-200" style={{ height: gridHeight, width: rmColWidth }}>
          {timeSlots.map((mins) => (
            <div key={mins} className="absolute left-0 right-0 border-t border-gray-100" style={{ top: ((mins - businessStartMinutes) / incrementMinutes) * rowHeight }} />
          ))}
          {remotePositioned.map(renderAppt)}
          {nowLineTop !== null && (
            <div className="absolute left-0 right-0 border-t-2 border-red-500" style={{ top: nowLineTop }} />
          )}
        </div>
        <div className="relative border-l border-gray-200" style={{ height: gridHeight, width: gtColWidth }}>
          {timeSlots.map((mins) => (
            <div key={mins} className="absolute left-0 right-0 border-t border-gray-100" style={{ top: ((mins - businessStartMinutes) / incrementMinutes) * rowHeight }} />
          ))}
          {gtPositioned.map(renderAppt)}
          {nowLineTop !== null && (
            <div className="absolute left-0 right-0 border-t-2 border-red-500" style={{ top: nowLineTop }} />
          )}
        </div>
      </div>
    </div>
  )
}


