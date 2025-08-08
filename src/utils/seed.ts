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
      appointmentType: 'training',
      studentId: studentIds[0],
      trainerId: trainerIds[0],
      date: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 10, 0).toISOString(),
      startTime: '10:00',
      endTime: '11:00',
      status: 'scheduled',
      notes: 'Initial assessment session'
    },
    {
      appointmentType: 'gt-assessment',
      studentId: studentIds[1],
      trainerId: trainerIds[1],
      date: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 14, 0).toISOString(),
      startTime: '14:00',
      endTime: '15:00',
      status: 'scheduled',
      notes: 'Follow-up session'
    },
    {
      appointmentType: 'training',
      studentId: studentIds[2],
      trainerId: trainerIds[2],
      date: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 16, 0).toISOString(),
      startTime: '16:00',
      endTime: '17:00',
      status: 'scheduled'
    },
    {
      appointmentType: 'training',
      studentId: studentIds[3],
      trainerId: trainerIds[0],
      date: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1, 9, 0).toISOString(),
      startTime: '09:00',
      endTime: '10:00',
      status: 'scheduled',
      notes: 'Progress evaluation'
    },
    {
      appointmentType: 'training',
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
}