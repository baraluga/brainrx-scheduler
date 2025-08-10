import { Session } from '../types/index'
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