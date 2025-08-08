import { generateId as utilGenerateId } from './index'

export const STORAGE_KEYS = {
  students: 'brx_students',
  trainers: 'brx_trainers',
  appointments: 'brx_appointments'
} as const

export function load<T>(key: string): T | null {
  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : null
  } catch (error) {
    console.error(`Error loading from localStorage key "${key}":`, error)
    return null
  }
}

export function save<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    console.error(`Error saving to localStorage key "${key}":`, error)
  }
}

export function loadCollection<T>(key: string): T[] {
  const collection = load<T[]>(key)
  return collection || []
}

export function saveCollection<T>(key: string, items: T[]): void {
  save(key, items)
}

export function generateId(): string {
  return utilGenerateId()
}

export function withCreateTimestamps<T>(item: T): T & { createdAt: string; updatedAt: string } {
  const now = new Date().toISOString()
  return {
    ...item,
    createdAt: now,
    updatedAt: now
  }
}

export function withUpdateTimestamp<T>(item: T): T & { updatedAt: string } {
  return {
    ...item,
    updatedAt: new Date().toISOString()
  }
}