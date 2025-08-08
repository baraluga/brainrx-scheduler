import { Program } from '../types/index'
import { STORAGE_KEYS } from '../utils/storage'
import * as crud from '../utils/crud'

export function listPrograms(): Program[] {
  return crud.getAll<Program>(STORAGE_KEYS.programs)
}

export function getProgram(id: string): Program | undefined {
  return crud.getById<Program>(STORAGE_KEYS.programs, id)
}

export function createProgram(data: Omit<Program, 'id' | 'createdAt' | 'updatedAt' | 'sessions'> & { sessions?: Program['sessions'] }): Program {
  const programData = {
    ...data,
    sessions: data.sessions || []
  }
  return crud.create<Program>(STORAGE_KEYS.programs, programData)
}

export function updateProgram(id: string, updates: Partial<Omit<Program, 'id' | 'createdAt'>>): Program {
  return crud.update<Program>(STORAGE_KEYS.programs, id, updates)
}

export function deleteProgram(id: string): void {
  crud.remove(STORAGE_KEYS.programs, id)
}