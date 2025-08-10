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
    migrateSplitNames()
    localStorage.setItem(SCHEMA_VERSION_KEY, '4')
  }
  if (currentVersion < 6) {
    migrateEnsureNames()
    localStorage.setItem(SCHEMA_VERSION_KEY, '6')
  }
  if (currentVersion < 7) {
    migrateAddAssignedSeats()
    localStorage.setItem(SCHEMA_VERSION_KEY, '7')
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

    // Remove programId from sessions
    const sessions = loadCollection<any>(STORAGE_KEYS.appointments)
    const sanitizedSessions = sessions.map((a) => {
      const { programId, ...rest } = a || {}
      return rest
    })
    saveCollection(STORAGE_KEYS.appointments, sanitizedSessions)
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

function migrateSplitNames(): void {
  try {
    const split = (full?: string) => {
      const base = (full || '').trim()
      if (!base) return { firstName: undefined, lastName: undefined }
      const parts = base.split(/\s+/)
      const firstName = parts[0]
      const lastName = parts.slice(1).join(' ') || undefined
      return { firstName, lastName }
    }

    const students = loadCollection<any>(STORAGE_KEYS.students)
    const migratedStudents = students.map((s) => {
      const { firstName, lastName } = split(s?.name)
      return { ...s, firstName: s?.firstName || firstName, lastName: s?.lastName || lastName }
    })
    saveCollection(STORAGE_KEYS.students, migratedStudents)

    const trainers = loadCollection<any>(STORAGE_KEYS.trainers)
    const migratedTrainers = trainers.map((t) => {
      const { firstName, lastName } = split(t?.name)
      // remove nickname if exists
      const { nickname, ...rest } = t || {}
      return { ...rest, firstName: t?.firstName || firstName, lastName: t?.lastName || lastName }
    })
    saveCollection(STORAGE_KEYS.trainers, migratedTrainers)
  } catch (error) {
    console.error('Migration (split names) failed:', error)
  }
}

function migrateEnsureNames(): void {
  try {
    const split = (full?: string) => {
      const base = (full || '').trim()
      if (!base) return { firstName: undefined, lastName: undefined }
      const parts = base.split(/\s+/)
      const firstName = parts[0]
      const lastName = parts.slice(1).join(' ') || undefined
      return { firstName, lastName }
    }

    const students = loadCollection<any>(STORAGE_KEYS.students)
    const fixedStudents = students.map((s) => {
      if (s?.firstName) return s
      const { firstName, lastName } = split(s?.name)
      return { ...s, firstName, lastName: s?.lastName || lastName }
    })
    saveCollection(STORAGE_KEYS.students, fixedStudents)

    const trainers = loadCollection<any>(STORAGE_KEYS.trainers)
    const fixedTrainers = trainers.map((t) => {
      if (t?.firstName) return t
      const { firstName, lastName } = split(t?.name)
      const { nickname, ...rest } = t || {}
      return { ...rest, firstName, lastName: t?.lastName || lastName }
    })
    saveCollection(STORAGE_KEYS.trainers, fixedTrainers)
  } catch (error) {
    console.error('Migration (ensure names) failed:', error)
  }
}

function migrateAddAssignedSeats(): void {
  try {
    const sessions = loadCollection<any>(STORAGE_KEYS.appointments)
    const sessionsWithSeats = sessions.map((session) => {
      // If session already has assignedSeat, keep it; otherwise assign seat 1 as default
      if (session?.assignedSeat) return session
      return { ...session, assignedSeat: 1 }
    })
    saveCollection(STORAGE_KEYS.appointments, sessionsWithSeats)
  } catch (error) {
    console.error('Migration (add assigned seats) failed:', error)
  }
}

