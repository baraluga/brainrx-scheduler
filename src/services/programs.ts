import { Program } from '../types/index'
import { STORAGE_KEYS } from '../utils/storage'
import * as crud from '../utils/crud'

export function listPrograms(): Program[] {
  return crud.getAll<Program>(STORAGE_KEYS.programs)
}

export function getProgram(id: string): Program | undefined {
  return crud.getById<Program>(STORAGE_KEYS.programs, id)
}

export function createProgram(data: Omit<Program, 'id' | 'createdAt' | 'updatedAt'>): Program {
  return crud.create<Program>(STORAGE_KEYS.programs, data)
}

export function updateProgram(id: string, updates: Partial<Omit<Program, 'id' | 'createdAt'>>): Program {
  return crud.update<Program>(STORAGE_KEYS.programs, id, updates)
}

export function deleteProgram(id: string): void {
  crud.remove(STORAGE_KEYS.programs, id)
}