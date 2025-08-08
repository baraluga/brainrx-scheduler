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
}

export interface Trainer extends User {
  role: 'trainer'
  nickname: string
  canDoGtAssessments: boolean
}

export interface Session {
  id: string
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

// TimeSlot removed; trainers are assumed available during business hours

export interface CalendarEvent {
  id: string
  title: string
  start: string
  end: string
  type: 'session' | 'break' | 'meeting'
  studentName?: string
  trainerName?: string
}

export type AppointmentType = 'training' | 'gt-assessment'

export type Appointment = Omit<Session, 'programId'> & { appointmentType: AppointmentType }