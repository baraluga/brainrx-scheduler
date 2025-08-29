import { Session } from '../types/index'
import { EffectiveBlock } from '../types/blocked'
import { STORAGE_KEYS } from '../utils/storage'
import * as crud from '../utils/crud'

export function listSessions(): Session[] {
  return crud.getAll<Session>(STORAGE_KEYS.appointments)
}

export function getSession(id: string): Session | undefined {
  return crud.getById<Session>(STORAGE_KEYS.appointments, id)
}

export function createSession(data: Omit<Session, 'id' | 'createdAt' | 'updatedAt' | 'status'> & { status?: Session['status'] }): Session {
  const sessionData = {
    ...data,
    status: data.status || 'scheduled' as const
  }
  return crud.create<Session>(STORAGE_KEYS.appointments, sessionData)
}

export function updateSession(id: string, updates: Partial<Omit<Session, 'id' | 'createdAt'>>): Session {
  return crud.update<Session>(STORAGE_KEYS.appointments, id, updates)
}

export function deleteSession(id: string): void {
  crud.remove(STORAGE_KEYS.appointments, id)
}

// Back-compatibility aliases
export const listAppointments = listSessions
export const getAppointment = getSession
export const createAppointment = createSession
export const updateAppointment = updateSession
export const deleteAppointment = deleteSession

export function cancelSessionsOverlapping(block: EffectiveBlock): void {
  const sessions = listSessions()
  sessions.forEach((s) => {
    if (s.status !== 'scheduled') return
    const start = new Date(s.date)
    const [eh, em] = s.endTime.split(':').map(Number)
    const end = new Date(start)
    end.setHours(eh, em, 0, 0)
    if (start < block.end && end > block.start) {
      updateSession(s.id, { status: 'cancelled' })
    }
  })
}
