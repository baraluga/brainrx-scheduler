import { Session, SessionType } from '../types'

export interface SeatConfig {
  slotsPerType: Record<SessionType, number>
}

// Check if two time ranges overlap (including partial overlaps)
function timeRangesOverlap(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  const toMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number)
    return hours * 60 + minutes
  }

  const start1Mins = toMinutes(start1)
  const end1Mins = toMinutes(end1)
  const start2Mins = toMinutes(start2)
  const end2Mins = toMinutes(end2)

  // Two ranges overlap if: start1 < end2 AND start2 < end1
  return start1Mins < end2Mins && start2Mins < end1Mins
}

export function getAvailableSeats(
  sessionType: SessionType,
  date: string,
  startTime: string,
  endTime: string,
  existingSessions: Session[],
  config: SeatConfig,
  excludeSessionId?: string // For editing existing sessions
): number[] {
  const maxSeats = config.slotsPerType[sessionType]
  const targetDate = new Date(date).toDateString()

  // Find sessions of the same type on the same date that overlap with the proposed time
  const conflictingSessions = existingSessions.filter(session => {
    // Skip the session being edited
    if (excludeSessionId && session.id === excludeSessionId) {
      return false
    }

    // Only check sessions of the same type on the same date
    if (session.sessionType !== sessionType) {
      return false
    }

    const sessionDate = new Date(session.date).toDateString()
    if (sessionDate !== targetDate) {
      return false
    }

    // Check if time ranges overlap
    return timeRangesOverlap(startTime, endTime, session.startTime, session.endTime)
  })

  // Get occupied seats
  const occupiedSeats = new Set(
    conflictingSessions.map(session => session.assignedSeat).filter(seat => seat != null)
  )

  // Generate available seats (1-indexed)
  const availableSeats: number[] = []
  for (let seat = 1; seat <= maxSeats; seat++) {
    if (!occupiedSeats.has(seat)) {
      availableSeats.push(seat)
    }
  }

  return availableSeats
}

export function getFirstAvailableSeat(
  sessionType: SessionType,
  date: string,
  startTime: string,
  endTime: string,
  existingSessions: Session[],
  config: SeatConfig,
  excludeSessionId?: string
): number | null {
  const availableSeats = getAvailableSeats(
    sessionType,
    date,
    startTime,
    endTime,
    existingSessions,
    config,
    excludeSessionId
  )
  
  return availableSeats.length > 0 ? availableSeats[0] : null
}