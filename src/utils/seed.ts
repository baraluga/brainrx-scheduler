import { Student, Trainer, Session } from '../types/index'
import { listStudents, createStudent } from '../services/students'
import { listTrainers, createTrainer } from '../services/trainers'
import { listSessions, createSession } from '../services/sessions'

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

const seedSessions = (studentIds: string[], trainerIds: string[]): void => {
  const today = new Date()
  const sessions: Omit<Session, 'id' | 'createdAt' | 'updatedAt'>[] = [
    {
      sessionType: 'training-tabletop' as any,
      assignedSeat: 1,
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
      assignedSeat: 1,
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
      assignedSeat: 1,
      studentId: studentIds[2],
      trainerId: trainerIds[2],
      date: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 16, 0).toISOString(),
      startTime: '16:00',
      endTime: '17:00',
      status: 'scheduled'
    },
    {
      sessionType: 'accelerate-rx' as any,
      assignedSeat: 1,
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
      assignedSeat: 2,
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

  sessions.forEach(session => createSession(session))
}

// Seed a realistic set of sessions for August 9, 2025 based on real usage patterns
const seedAug9_2025IfLight = (): void => {
  const target = new Date(2025, 7, 9) // Aug is month index 7
  const targetKey = target.toDateString()
  const existing = listSessions().filter(a => new Date(a.date).toDateString() === targetKey)
  // Count existing per session type so we only top-up to small caps
  const countByType: Record<'training-tabletop'|'training-digital'|'accelerate-rx'|'remote'|'gt', number> = {
    'training-tabletop': existing.filter((a: any) => (a.sessionType ?? (a.appointmentType === 'training' ? 'training-tabletop' : '')) === 'training-tabletop').length,
    'training-digital': existing.filter((a: any) => (a.sessionType) === 'training-digital').length,
    'accelerate-rx': existing.filter((a: any) => (a.sessionType) === 'accelerate-rx').length,
    'remote': existing.filter((a: any) => (a.sessionType) === 'remote').length,
    'gt': existing.filter((a: any) => (a.sessionType ?? (a.appointmentType === 'gt-assessment' ? 'gt' : '')) === 'gt').length,
  }

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
  const LUNCH_START = 12 * 60 + 30
  const LUNCH_END = 13 * 60 + 30
  const INCREMENT = 15

  const randomFrom = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]
  // const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n))

  const createBlock = (startMins: number, durationMins: number, type: any): Omit<Session, 'id' | 'createdAt' | 'updatedAt'> => {
    const s = minutesToHHMM(startMins)
    const e = minutesToHHMM(startMins + durationMins)
    const student = randomFrom(students)
    // For GT, ensure trainer can do GT if available; else fall back to any
    const eligibleTrainers = type === 'gt' ? trainers.filter(t => t.canDoGtAssessments) : trainers
    const trainer = (eligibleTrainers.length ? randomFrom(eligibleTrainers) : randomFrom(trainers))
    return {
      sessionType: type,
      assignedSeat: Math.floor(Math.random() * 3) + 1, // Random seat 1-3
      studentId: student.id,
      trainerId: trainer.id,
      date: new Date(2025, 7, 9, Math.floor(startMins / 60), startMins % 60).toISOString(),
      startTime: s,
      endTime: e,
      status: 'scheduled',
      notes: ''
    }
  }
  const appts: Omit<Session, 'id' | 'createdAt' | 'updatedAt'>[] = []

  // Generic generator that respects lane capacity, avoids overlaps, and follows density by time window
  type GenConfig = {
    type: 'training-tabletop' | 'training-digital' | 'accelerate-rx' | 'remote' | 'gt'
    lanes: number
    windows: Array<{ start: number; end: number; probability: number }>
    durationDist: number[] // list of allowed durations (mins), weighted by duplication
    gapDist: number[]      // allowed gaps after a session (mins), weighted by duplication
    cap?: number           // optional absolute cap of sessions
  }

  const generate = (cfg: GenConfig) => {
    const laneFreeAt = new Array(cfg.lanes).fill(BUSINESS_START)
    let total = 0
    for (const win of cfg.windows) {
      // Walk the window in increments and attempt to schedule on free lanes
      for (let t = win.start; t < win.end; t += INCREMENT) {
        for (let lane = 0; lane < cfg.lanes; lane++) {
          if (cfg.cap && total >= cfg.cap) return
          if (laneFreeAt[lane] > t) continue
          if (Math.random() > win.probability) continue
          // Choose duration/gap
          const duration = randomFrom(cfg.durationDist)
          const end = t + duration
          if (end > win.end || end > BUSINESS_END || (t < LUNCH_END && end > LUNCH_START)) {
            continue
          }
          appts.push(createBlock(t, duration, cfg.type))
          total++
          laneFreeAt[lane] = end + randomFrom(cfg.gapDist)
        }
      }
    }
  }

  // Distributions: skew towards 30–45 mins, some 60–75
  const DURATION_TRAIN = [30, 30, 45, 45, 45, 60, 60, 75]
  const GAP_TRAIN = [15, 15, 15, 30]

  const DURATION_LIGHT = [30, 45, 45, 60]
  const GAP_LIGHT = [15, 30]

  // Windows reflecting the screenshot pattern: light morning, lunch break, dense afternoon
  const windowsMorning = [{ start: BUSINESS_START, end: LUNCH_START, probability: 0.12 }]
  const windowsAfternoon = [{ start: LUNCH_END, end: BUSINESS_END - 30, probability: 0.5 }]

  // Desired small caps per type ("handful")
  const CAP_TT = 6
  const CAP_DG = 6
  const CAP_ARX = 3
  const CAP_RM = 4
  const CAP_GT = 3

  // Compute remaining to top up
  const remTT = Math.max(0, CAP_TT - countByType['training-tabletop'])
  const remDG = Math.max(0, CAP_DG - countByType['training-digital'])
  const remARX = Math.max(0, CAP_ARX - countByType['accelerate-rx'])
  const remRM = Math.max(0, CAP_RM - countByType['remote'])
  const remGT = Math.max(0, CAP_GT - countByType['gt'])

  // Table-top and Digital: top-up to caps
  if (remTT > 0) {
    generate({
      type: 'training-tabletop',
      lanes: 10,
      windows: [...windowsMorning, ...windowsAfternoon],
      durationDist: DURATION_TRAIN,
      gapDist: GAP_TRAIN,
      cap: remTT,
    })
  }
  if (remDG > 0) {
    generate({
      type: 'training-digital',
      lanes: 10,
      windows: [...windowsMorning, ...windowsAfternoon],
      durationDist: DURATION_TRAIN,
      gapDist: GAP_TRAIN,
      cap: remDG,
    })
  }

  // AccelerateRx: few lanes, moderate density in afternoon
  if (remARX > 0) {
    generate({
      type: 'accelerate-rx',
      lanes: 3,
      windows: [{ start: LUNCH_END, end: BUSINESS_END - 45, probability: 0.35 }],
      durationDist: DURATION_LIGHT,
      gapDist: GAP_LIGHT,
      cap: remARX,
    })
  }

  // Remote: small number, light spread in afternoon
  if (remRM > 0) {
    generate({
      type: 'remote',
      lanes: 4,
      windows: [{ start: LUNCH_END + 30, end: BUSINESS_END - 30, probability: 0.25 }],
      durationDist: DURATION_LIGHT,
      gapDist: GAP_LIGHT,
      cap: remRM,
    })
  }

  // GT: explicitly cap at ~3 sessions, later afternoon
  if (remGT > 0) {
    generate({
      type: 'gt',
      lanes: 4,
      windows: [{ start: LUNCH_END + 30, end: BUSINESS_END - 60, probability: 0.5 }],
      durationDist: [45, 60, 60],
      gapDist: [15, 30],
      cap: remGT,
    })
  }

  // Persist
  appts.forEach(a => createSession(a))
  console.log(`[seed] Added ${appts.length} sessions for Aug 9, 2025 (existing by type: ${JSON.stringify(countByType)})`)
}

export function seedIfEmpty(): void {
  // Check if data already exists
  const existingStudents = listStudents()
  const existingTrainers = listTrainers()
  const existingSessions = listSessions()

  // Only seed if all collections are empty
  if (existingStudents.length === 0 && 
      existingTrainers.length === 0 && 
      existingSessions.length === 0) {
    
    console.log('Seeding initial data...')
    
    // Seed in dependency order
    const trainerIds = seedTrainers()
    const studentIds = seedStudents()
    seedSessions(studentIds, trainerIds)
    
    console.log('Seed data created successfully')
  }

  // Always attempt to seed the dense demo day for Aug 9, 2025 if it's not present
  seedAug9_2025IfLight()
}