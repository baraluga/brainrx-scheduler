import { STORAGE_KEYS, loadCollection, saveCollection } from './storage'

const SCHEMA_VERSION_KEY = 'brx_schema_version'

export function runMigrations(): void {
  const raw = localStorage.getItem(SCHEMA_VERSION_KEY)
  const currentVersion = raw ? parseInt(raw, 10) : 1

  if (currentVersion < 2) {
    migrateRemovePrograms()
    localStorage.setItem(SCHEMA_VERSION_KEY, '2')
  }
  if (currentVersion < 3) {
    migrateSimplifyTrainers()
    localStorage.setItem(SCHEMA_VERSION_KEY, '3')
  }
  if (currentVersion < 4) {
    migrateAddTrainerNickname()
    localStorage.setItem(SCHEMA_VERSION_KEY, '4')
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


function migrateSimplifyTrainers(): void {
  try {
    const trainers = loadCollection<any>(STORAGE_KEYS.trainers)
    const simplified = trainers.map((t) => {
      const canDoGtAssessments = Array.isArray(t?.certifications)
        ? t.certifications.some((c: string) => String(c).toLowerCase().includes('gt assessment'))
        : false
      const { specializations, certifications, availableHours, ...rest } = t || {}
      return { ...rest, canDoGtAssessments: Boolean(t?.canDoGtAssessments ?? canDoGtAssessments) }
    })
    saveCollection(STORAGE_KEYS.trainers, simplified)
  } catch (error) {
    console.error('Migration (simplify trainers) failed:', error)
  }
}

function migrateAddTrainerNickname(): void {
  try {
    const trainers = loadCollection<any>(STORAGE_KEYS.trainers)
    const updated = trainers.map((t) => {
      const base = (t?.name || '').trim()
      const nickname = (t?.nickname && String(t.nickname).trim()) || base.split(' ')[0] || 'Trainer'
      return { ...t, nickname }
    })
    saveCollection(STORAGE_KEYS.trainers, updated)
  } catch (error) {
    console.error('Migration (add trainer nickname) failed:', error)
  }
}

