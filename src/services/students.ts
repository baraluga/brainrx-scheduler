import { Student } from '../types/index'
import { STORAGE_KEYS } from '../utils/storage'
import * as crud from '../utils/crud'

export function listStudents(): Student[] {
  return crud.getAll<Student>(STORAGE_KEYS.students)
}

export function getStudent(id: string): Student | undefined {
  return crud.getById<Student>(STORAGE_KEYS.students, id)
}

export function createStudent(data: Omit<Student, 'id' | 'createdAt' | 'updatedAt' | 'role'>): Student {
  const studentData = {
    ...data,
    role: 'student' as const
  }
  return crud.create<Student>(STORAGE_KEYS.students, studentData)
}

export function updateStudent(id: string, updates: Partial<Omit<Student, 'id' | 'createdAt'>>): Student {
  return crud.update<Student>(STORAGE_KEYS.students, id, updates)
}

export function deleteStudent(id: string): void {
  crud.remove(STORAGE_KEYS.students, id)
}