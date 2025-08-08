import { Appointment } from '../types/index'
import { STORAGE_KEYS } from '../utils/storage'
import * as crud from '../utils/crud'

export function listAppointments(): Appointment[] {
  return crud.getAll<Appointment>(STORAGE_KEYS.appointments)
}

export function getAppointment(id: string): Appointment | undefined {
  return crud.getById<Appointment>(STORAGE_KEYS.appointments, id)
}

export function createAppointment(data: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt' | 'status'> & { status?: Appointment['status'] }): Appointment {
  const appointmentData = {
    ...data,
    status: data.status || 'scheduled' as const
  }
  return crud.create<Appointment>(STORAGE_KEYS.appointments, appointmentData)
}

export function updateAppointment(id: string, updates: Partial<Omit<Appointment, 'id' | 'createdAt'>>): Appointment {
  return crud.update<Appointment>(STORAGE_KEYS.appointments, id, updates)
}

export function deleteAppointment(id: string): void {
  crud.remove(STORAGE_KEYS.appointments, id)
}