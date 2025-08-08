import { STORAGE_KEYS, loadCollection, saveCollection } from './storage'

const SCHEMA_VERSION_KEY = 'brx_schema_version'
const TARGET_VERSION = 2

export function runMigrations(): void {
  const raw = localStorage.getItem(SCHEMA_VERSION_KEY)
  const currentVersion = raw ? parseInt(raw, 10) : 1

  if (currentVersion < 2) {
    migrateRemovePrograms()
    localStorage.setItem(SCHEMA_VERSION_KEY, String(2))
  }
}

function migrateRemovePrograms(): void {
  try {
    // Drop programs key entirely
    try {
      localStorage.removeItem('brx_programs')
    } catch {}

    // Remove programs from students
    const students = loadCollection<any>(STORAGE_KEYS.students)
    const sanitizedStudents = students.map((s) => {
      const { programs, ...rest } = s || {}
      return rest
    })
    saveCollection(STORAGE_KEYS.students, sanitizedStudents)

    // Remove programId from appointments
    const appointments = loadCollection<any>(STORAGE_KEYS.appointments)
    const sanitizedAppointments = appointments.map((a) => {
      const { programId, ...rest } = a || {}
      return rest
    })
    saveCollection(STORAGE_KEYS.appointments, sanitizedAppointments)
  } catch (error) {
    console.error('Migration (remove programs) failed:', error)
  }
}


