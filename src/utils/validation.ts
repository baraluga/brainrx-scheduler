import { startOfDay, endOfDay } from 'date-fns'
import { listEffectiveBlocks } from '../services/blockedDays'

export function isValidTimeIncrement(time: string, incrementMinutes = 15): boolean {
  const [hours, minutes] = time.split(':').map(Number)
  if (isNaN(hours) || isNaN(minutes)) return false
  
  return minutes % incrementMinutes === 0
}

export function getDurationMinutes(startTime: string, endTime: string): number {
  const [startHours, startMinutes] = startTime.split(':').map(Number)
  const [endHours, endMinutes] = endTime.split(':').map(Number)
  
  if (isNaN(startHours) || isNaN(startMinutes) || isNaN(endHours) || isNaN(endMinutes)) {
    return 0
  }
  
  const startTotalMinutes = startHours * 60 + startMinutes
  const endTotalMinutes = endHours * 60 + endMinutes
  
  return endTotalMinutes - startTotalMinutes
}

export function validateTimeSlot(startTime: string, endTime: string): { ok: true } | { ok: false; message: string } {
  // Check if times are valid format
  if (!startTime || !endTime) {
    return { ok: false, message: 'Both start and end times are required' }
  }
  
  // Check 15-minute increments
  if (!isValidTimeIncrement(startTime) || !isValidTimeIncrement(endTime)) {
    return { ok: false, message: 'Times must be in 15-minute increments' }
  }
  
  const duration = getDurationMinutes(startTime, endTime)
  
  // Check if end is after start
  if (duration <= 0) {
    return { ok: false, message: 'End time must be after start time' }
  }
  
  // Check duration bounds (30-120 minutes)
  if (duration < 30) {
    return { ok: false, message: 'Duration must be at least 30 minutes' }
  }
  
  if (duration > 120) {
    return { ok: false, message: 'Duration must be no more than 2 hours' }
  }
  
  return { ok: true }
}

export function isTimeslotBlocked(date: string, startTime: string, endTime: string): boolean {
  const day = new Date(date)
  const blocks = listEffectiveBlocks({ from: startOfDay(day), to: endOfDay(day) })
  const [sh, sm] = startTime.split(':').map(Number)
  const [eh, em] = endTime.split(':').map(Number)
  const start = new Date(day)
  start.setHours(sh, sm, 0, 0)
  const end = new Date(day)
  end.setHours(eh, em, 0, 0)
  return blocks.some(b => start < b.end && end > b.start)
}
