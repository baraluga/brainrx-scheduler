import { Trainer } from '../types/index'
import { STORAGE_KEYS } from '../utils/storage'
import * as crud from '../utils/crud'

export function listTrainers(): Trainer[] {
  return crud.getAll<Trainer>(STORAGE_KEYS.trainers)
}

export function getTrainer(id: string): Trainer | undefined {
  return crud.getById<Trainer>(STORAGE_KEYS.trainers, id)
}

export function createTrainer(data: Omit<Trainer, 'id' | 'createdAt' | 'updatedAt'>): Trainer {
  return crud.create<Trainer>(STORAGE_KEYS.trainers, data)
}

export function updateTrainer(id: string, updates: Partial<Omit<Trainer, 'id' | 'createdAt'>>): Trainer {
  return crud.update<Trainer>(STORAGE_KEYS.trainers, id, updates)
}

export function deleteTrainer(id: string): void {
  crud.remove(STORAGE_KEYS.trainers, id)
}