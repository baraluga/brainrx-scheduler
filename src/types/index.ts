export interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'trainer' | 'student'
  createdAt: string
  updatedAt: string
}

export interface Student extends User {
  role: 'student'
  dateOfBirth: string
  guardianName?: string
  guardianEmail?: string
  guardianPhone?: string
  medicalNotes?: string
  programs: Program[]
}

export interface Trainer extends User {
  role: 'trainer'
  specializations: string[]
  certifications: string[]
  availableHours: TimeSlot[]
}

export interface Program {
  id: string
  name: string
  description: string
  duration: number
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  targetAge: {
    min: number
    max: number
  }
  sessions: Session[]
  createdAt: string
  updatedAt: string
}

export interface Session {
  id: string
  programId: string
  studentId: string
  trainerId: string
  date: string
  startTime: string
  endTime: string
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show'
  notes?: string
  progress?: SessionProgress
  createdAt: string
  updatedAt: string
}

export interface SessionProgress {
  completed: boolean
  score?: number
  observations: string
  recommendations: string
}

export interface TimeSlot {
  dayOfWeek: number
  startTime: string
  endTime: string
}

export interface CalendarEvent {
  id: string
  title: string
  start: string
  end: string
  type: 'session' | 'break' | 'meeting'
  studentName?: string
  trainerName?: string
}

export type Appointment = Session