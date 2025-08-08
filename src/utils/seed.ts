import { Student, Trainer, Appointment } from '../types/index'
import { listStudents, createStudent } from '../services/students'
import { listTrainers, createTrainer } from '../services/trainers'
import { listAppointments, createAppointment } from '../services/appointments'

// Programs removed

const seedTrainers = (): string[] => {
  const trainers: Omit<Trainer, 'id' | 'createdAt' | 'updatedAt'>[] = [
    {
      name: 'Dr. Sarah Johnson',
      firstName: 'Sarah',
      lastName: 'Johnson',
      email: 'sarah.johnson@brainrx.com',
      role: 'trainer',
      canDoGtAssessments: true
    },
    {
      name: 'Michael Chen',
      firstName: 'Michael',
      lastName: 'Chen',
      email: 'michael.chen@brainrx.com',
      role: 'trainer',
      canDoGtAssessments: false
    },
    {
      name: 'Lisa Rodriguez',
      firstName: 'Lisa',
      lastName: 'Rodriguez',
      email: 'lisa.rodriguez@brainrx.com',
      role: 'trainer',
      canDoGtAssessments: true
    }
  ]

  return trainers.map(trainer => createTrainer(trainer).id)
}

const seedStudents = (): string[] => {
  const students: Omit<Student, 'id' | 'createdAt' | 'updatedAt'>[] = [
    {
      name: 'Emma Wilson',
      firstName: 'Emma',
      lastName: 'Wilson',
      role: 'student',
      dateOfBirth: '2012-03-15T00:00:00.000Z',
      guardianName: 'Jennifer Wilson',
      guardianPhone: '(555) 123-4567',
      medicalNotes: 'Mild attention difficulties',
      
    },
    {
      name: 'Alex Thompson',
      firstName: 'Alex',
      lastName: 'Thompson',
      role: 'student',
      dateOfBirth: '2010-07-22T00:00:00.000Z',
      guardianName: 'David Thompson',
      guardianPhone: '(555) 234-5678',
      
    },
    {
      name: 'Maya Patel',
      firstName: 'Maya',
      lastName: 'Patel',
      role: 'student',
      dateOfBirth: '2014-11-08T00:00:00.000Z',
      guardianName: 'Priya Patel',
      guardianPhone: '(555) 345-6789',
      medicalNotes: 'Processing speed challenges',
      
    },
    {
      name: 'Jordan Davis',
      firstName: 'Jordan',
      lastName: 'Davis',
      role: 'student',
      dateOfBirth: '2013-01-30T00:00:00.000Z',
      guardianName: 'Angela Davis',
      guardianPhone: '(555) 456-7890',
      
    },
    {
      name: 'Sophie Martinez',
      firstName: 'Sophie',
      lastName: 'Martinez',
      role: 'student',
      dateOfBirth: '2011-09-12T00:00:00.000Z',
      guardianName: 'Carlos Martinez',
      guardianPhone: '(555) 567-8901',
      medicalNotes: 'Working memory support needed',
      
    }
  ]

  return students.map(student => createStudent(student).id)
}

const seedAppointments = (studentIds: string[], trainerIds: string[]): void => {
  const today = new Date()
  const appointments: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>[] = [
    {
      sessionType: 'training-tabletop' as any,
      studentId: studentIds[0],
      trainerId: trainerIds[0],
      date: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 10, 0).toISOString(),
      startTime: '10:00',
      endTime: '11:00',
      status: 'scheduled',
      notes: 'Initial assessment session'
    },
    {
      sessionType: 'gt' as any,
      studentId: studentIds[1],
      trainerId: trainerIds[1],
      date: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 14, 0).toISOString(),
      startTime: '14:00',
      endTime: '15:00',
      status: 'scheduled',
      notes: 'Follow-up session'
    },
    {
      sessionType: 'training-digital' as any,
      studentId: studentIds[2],
      trainerId: trainerIds[2],
      date: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 16, 0).toISOString(),
      startTime: '16:00',
      endTime: '17:00',
      status: 'scheduled'
    },
    {
      sessionType: 'accelerate-rx' as any,
      studentId: studentIds[3],
      trainerId: trainerIds[0],
      date: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1, 9, 0).toISOString(),
      startTime: '09:00',
      endTime: '10:00',
      status: 'scheduled',
      notes: 'Progress evaluation'
    },
    {
      sessionType: 'training-tabletop' as any,
      studentId: studentIds[4],
      trainerId: trainerIds[1],
      date: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1, 11, 0).toISOString(),
      startTime: '11:00',
      endTime: '12:00',
      status: 'completed',
      notes: 'Excellent progress shown',
      progress: {
        completed: true,
        score: 85,
        observations: 'Student showed significant improvement in working memory tasks',
        recommendations: 'Continue with current plan, consider advancing difficulty'
      }
    }
  ]

  appointments.forEach(appointment => createAppointment(appointment))
}

// Seed a dense set of appointments for August 9, 2025 to visualize the daily grid
const seedAug9_2025IfLight = (): void => {
  const target = new Date(2025, 7, 9) // Aug is month index 7
  const targetKey = target.toDateString()
  const existing = listAppointments().filter(a => new Date(a.date).toDateString() === targetKey)
  const existingCount = existing.length
  // If we already have a busy day, skip. Otherwise, top it up to be dense.
  const MIN_TARGET_COUNT = 45
  if (existingCount >= MIN_TARGET_COUNT) return

  const students = listStudents()
  const trainers = listTrainers()
  if (students.length === 0 || trainers.length === 0) return

  // Helper generators
  const minutesToHHMM = (mins: number): string => {
    const h = Math.floor(mins / 60)
    const m = mins % 60
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
  }

  const BUSINESS_START = 10 * 60
  const BUSINESS_END = 19 * 60
  const INCREMENT = 15

  const randomFrom = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]
  const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n))

  const createBlock = (startMins: number, durationMins: number, type: any): Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'> => {
    const s = minutesToHHMM(startMins)
    const e = minutesToHHMM(startMins + durationMins)
    const student = randomFrom(students)
    // For GT, ensure trainer can do GT if available; else fall back to any
    const eligibleTrainers = type === 'gt' ? trainers.filter(t => t.canDoGtAssessments) : trainers
    const trainer = (eligibleTrainers.length ? randomFrom(eligibleTrainers) : randomFrom(trainers))
    return {
      sessionType: type,
      studentId: student.id,
      trainerId: trainer.id,
      date: new Date(2025, 7, 9, Math.floor(startMins / 60), startMins % 60).toISOString(),
      startTime: s,
      endTime: e,
      status: 'scheduled',
      notes: ''
    }
  }

  const appts: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>[] = []
  const MAX_TRAINING_TO_ADD = 40
  const MAX_GT_TO_ADD = 3
  let addedTraining = 0
  let addedGT = 0

  // Generate a rich set of Training appointments across the day
  for (let lane = 0; lane < 10 && addedTraining < MAX_TRAINING_TO_ADD; lane++) {
    let cursor = BUSINESS_START + lane * 6 // stagger lanes a bit
    while (cursor < BUSINESS_END - 30 && addedTraining < MAX_TRAINING_TO_ADD) {
      const durChoices = [30, 45, 60, 75, 90, 105, 120]
      const duration = durChoices[Math.floor(Math.random() * durChoices.length)]
      const roundedDuration = duration - (duration % INCREMENT)
      const safeDuration = clamp(roundedDuration, 30, 120)
      if (cursor + safeDuration > BUSINESS_END) break
      appts.push(createBlock(cursor, safeDuration, 'training-tabletop'))
      addedTraining++
      // gap between 15-45 minutes
      const gapChoices = [15, 15, 30, 30, 45]
      const gap = gapChoices[Math.floor(Math.random() * gapChoices.length)]
      cursor += safeDuration + gap
    }
  }

  // Generate GT Assessment appointments (fewer lanes)
  for (let lane = 0; lane < 4 && addedGT < MAX_GT_TO_ADD; lane++) {
    let cursor = BUSINESS_START + lane * 10
    while (cursor < BUSINESS_END - 30 && addedGT < MAX_GT_TO_ADD) {
      const durChoices = [30, 45, 60, 75, 90]
      const duration = durChoices[Math.floor(Math.random() * durChoices.length)]
      const roundedDuration = duration - (duration % INCREMENT)
      const safeDuration = clamp(roundedDuration, 30, 120)
      if (cursor + safeDuration > BUSINESS_END) break
      appts.push(createBlock(cursor, safeDuration, 'gt'))
      addedGT++
      const gapChoices = [15, 30, 30, 45]
      const gap = gapChoices[Math.floor(Math.random() * gapChoices.length)]
      cursor += safeDuration + gap
    }
  }

  // Persist
  appts.forEach(a => createAppointment(a))
  console.log(`[seed] Added ${appts.length} demo appointments for Aug 9, 2025 (existing: ${existingCount})`)
}

export function seedIfEmpty(): void {
  // Check if data already exists
  const existingStudents = listStudents()
  const existingTrainers = listTrainers()
  const existingAppointments = listAppointments()

  // Only seed if all collections are empty
  if (existingStudents.length === 0 && 
      existingTrainers.length === 0 && 
      existingAppointments.length === 0) {
    
    console.log('Seeding initial data...')
    
    // Seed in dependency order
    const trainerIds = seedTrainers()
    const studentIds = seedStudents()
    seedAppointments(studentIds, trainerIds)
    
    console.log('Seed data created successfully')
  }

  // Always attempt to seed the dense demo day for Aug 9, 2025 if it's not present
  seedAug9_2025IfLight()
}