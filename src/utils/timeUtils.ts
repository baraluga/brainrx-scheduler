import { TimeSlot } from '../types/index'

export const DAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday', 
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday'
]

export const DAY_ABBREVIATIONS = [
  'Sun',
  'Mon',
  'Tue',
  'Wed',
  'Thu',
  'Fri',
  'Sat'
]

export function formatTime(timeString: string): string {
  const [hours, minutes] = timeString.split(':').map(Number)
  const period = hours >= 12 ? 'PM' : 'AM'
  const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours
  const displayMinutes = minutes.toString().padStart(2, '0')
  return `${displayHours}:${displayMinutes} ${period}`
}

export function formatTimeSlot(slot: TimeSlot): string {
  return `${formatTime(slot.startTime)} - ${formatTime(slot.endTime)}`
}

export function getDayName(dayOfWeek: number): string {
  return DAY_NAMES[dayOfWeek] || 'Unknown'
}

export function getDayAbbreviation(dayOfWeek: number): string {
  return DAY_ABBREVIATIONS[dayOfWeek] || 'Unk'
}

export function validateTimeRange(startTime: string, endTime: string): string | undefined {
  if (!startTime || !endTime) {
    return 'Both start and end times are required'
  }

  const start = new Date(`2000-01-01T${startTime}:00`)
  const end = new Date(`2000-01-01T${endTime}:00`)

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return 'Invalid time format'
  }

  if (start >= end) {
    return 'End time must be after start time'
  }

  return undefined
}

export function checkTimeSlotOverlap(newSlot: TimeSlot, existingSlots: TimeSlot[]): boolean {
  const newStart = new Date(`2000-01-01T${newSlot.startTime}:00`)
  const newEnd = new Date(`2000-01-01T${newSlot.endTime}:00`)

  return existingSlots.some(slot => {
    if (slot.dayOfWeek !== newSlot.dayOfWeek) return false

    const existingStart = new Date(`2000-01-01T${slot.startTime}:00`)
    const existingEnd = new Date(`2000-01-01T${slot.endTime}:00`)

    return (
      (newStart >= existingStart && newStart < existingEnd) ||
      (newEnd > existingStart && newEnd <= existingEnd) ||
      (newStart <= existingStart && newEnd >= existingEnd)
    )
  })
}

export function sortTimeSlots(slots: TimeSlot[]): TimeSlot[] {
  return [...slots].sort((a, b) => {
    if (a.dayOfWeek !== b.dayOfWeek) {
      return a.dayOfWeek - b.dayOfWeek
    }
    return a.startTime.localeCompare(b.startTime)
  })
}

export function groupSlotsByDay(slots: TimeSlot[]): Record<number, TimeSlot[]> {
  return slots.reduce((groups, slot) => {
    if (!groups[slot.dayOfWeek]) {
      groups[slot.dayOfWeek] = []
    }
    groups[slot.dayOfWeek].push(slot)
    return groups
  }, {} as Record<number, TimeSlot[]>)
}

export function getAvailabilitySummary(slots: TimeSlot[]): string {
  if (slots.length === 0) return 'No availability set'
  
  const grouped = groupSlotsByDay(slots)
  const availableDays = Object.keys(grouped).length
  
  if (availableDays === 7) return 'Available daily'
  if (availableDays === 1) return `Available ${getDayName(parseInt(Object.keys(grouped)[0]))}`
  
  return `Available ${availableDays} days/week`
}