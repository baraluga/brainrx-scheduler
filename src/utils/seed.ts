import { Student, Trainer, Program, Appointment } from '../types/index'
import { listStudents, createStudent } from '../services/students'
import { listTrainers, createTrainer } from '../services/trainers'
import { listPrograms, createProgram } from '../services/programs'
import { listAppointments, createAppointment } from '../services/appointments'

const seedPrograms = (): string[] => {
  const programs: Omit<Program, 'id' | 'createdAt' | 'updatedAt'>[] = [
    {
      name: 'Basic Cognitive Training',
      description: 'Fundamental cognitive exercises for improving attention and memory',
      duration: 45,
      difficulty: 'beginner',
      targetAge: { min: 6, max: 12 },
      sessions: []
    },
    {
      name: 'Advanced Memory Enhancement',
      description: 'Intensive memory training for enhanced cognitive performance',
      duration: 60,
      difficulty: 'advanced',
      targetAge: { min: 13, max: 18 },
      sessions: []
    },
    {
      name: 'Attention Focus Program',
      description: 'Specialized program for improving focus and concentration',
      duration: 50,
      difficulty: 'intermediate',
      targetAge: { min: 8, max: 16 },
      sessions: []
    },
    {
      name: 'Executive Function Training',
      description: 'Training for planning, working memory, and cognitive flexibility',
      duration: 55,
      difficulty: 'advanced',
      targetAge: { min: 10, max: 18 },
      sessions: []
    }
  ]

  return programs.map(program => createProgram(program).id)
}

const seedTrainers = (): string[] => {
  const trainers: Omit<Trainer, 'id' | 'createdAt' | 'updatedAt'>[] = [
    {
      name: 'Dr. Sarah Johnson',
      email: 'sarah.johnson@brainrx.com',
      role: 'trainer',
      specializations: ['Cognitive Training', 'Memory Enhancement'],
      certifications: ['BrainRx Certified Trainer', 'Cognitive Training Specialist'],
      availableHours: [
        { dayOfWeek: 1, startTime: '09:00', endTime: '17:00' },
        { dayOfWeek: 2, startTime: '09:00', endTime: '17:00' },
        { dayOfWeek: 3, startTime: '09:00', endTime: '17:00' }
      ]
    },
    {
      name: 'Michael Chen',
      email: 'michael.chen@brainrx.com',
      role: 'trainer',
      specializations: ['Attention Training', 'Executive Function'],
      certifications: ['BrainRx Certified Trainer', 'ADHD Specialist'],
      availableHours: [
        { dayOfWeek: 2, startTime: '10:00', endTime: '18:00' },
        { dayOfWeek: 4, startTime: '10:00', endTime: '18:00' },
        { dayOfWeek: 5, startTime: '10:00', endTime: '18:00' }
      ]
    },
    {
      name: 'Lisa Rodriguez',
      email: 'lisa.rodriguez@brainrx.com',
      role: 'trainer',
      specializations: ['Processing Speed', 'Auditory Processing'],
      certifications: ['BrainRx Certified Trainer', 'Auditory Processing Specialist'],
      availableHours: [
        { dayOfWeek: 1, startTime: '08:00', endTime: '16:00' },
        { dayOfWeek: 3, startTime: '08:00', endTime: '16:00' },
        { dayOfWeek: 5, startTime: '08:00', endTime: '16:00' }
      ]
    }
  ]

  return trainers.map(trainer => createTrainer(trainer).id)
}

const seedStudents = (): string[] => {
  const students: Omit<Student, 'id' | 'createdAt' | 'updatedAt'>[] = [
    {
      name: 'Emma Wilson',
      email: 'emma.wilson.parent@email.com',
      role: 'student',
      dateOfBirth: '2012-03-15T00:00:00.000Z',
      guardianName: 'Jennifer Wilson',
      guardianEmail: 'jennifer.wilson@email.com',
      guardianPhone: '(555) 123-4567',
      medicalNotes: 'Mild attention difficulties',
      programs: [] // Will be populated with actual Program objects later if needed
    },
    {
      name: 'Alex Thompson',
      email: 'alex.thompson.parent@email.com',
      role: 'student',
      dateOfBirth: '2010-07-22T00:00:00.000Z',
      guardianName: 'David Thompson',
      guardianEmail: 'david.thompson@email.com',
      guardianPhone: '(555) 234-5678',
      programs: []
    },
    {
      name: 'Maya Patel',
      email: 'maya.patel.parent@email.com',
      role: 'student',
      dateOfBirth: '2014-11-08T00:00:00.000Z',
      guardianName: 'Priya Patel',
      guardianEmail: 'priya.patel@email.com',
      guardianPhone: '(555) 345-6789',
      medicalNotes: 'Processing speed challenges',
      programs: []
    },
    {
      name: 'Jordan Davis',
      email: 'jordan.davis.parent@email.com',
      role: 'student',
      dateOfBirth: '2013-01-30T00:00:00.000Z',
      guardianName: 'Angela Davis',
      guardianEmail: 'angela.davis@email.com',
      guardianPhone: '(555) 456-7890',
      programs: []
    },
    {
      name: 'Sophie Martinez',
      email: 'sophie.martinez.parent@email.com',
      role: 'student',
      dateOfBirth: '2011-09-12T00:00:00.000Z',
      guardianName: 'Carlos Martinez',
      guardianEmail: 'carlos.martinez@email.com',
      guardianPhone: '(555) 567-8901',
      medicalNotes: 'Working memory support needed',
      programs: []
    }
  ]

  return students.map(student => createStudent(student).id)
}

const seedAppointments = (studentIds: string[], trainerIds: string[], programIds: string[]): void => {
  const today = new Date()
  const appointments: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>[] = [
    {
      programId: programIds[0],
      studentId: studentIds[0],
      trainerId: trainerIds[0],
      date: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 10, 0).toISOString(),
      startTime: '10:00',
      endTime: '10:45',
      status: 'scheduled',
      notes: 'Initial assessment session'
    },
    {
      programId: programIds[1],
      studentId: studentIds[1],
      trainerId: trainerIds[1],
      date: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 14, 0).toISOString(),
      startTime: '14:00',
      endTime: '15:00',
      status: 'scheduled',
      notes: 'Follow-up session'
    },
    {
      programId: programIds[2],
      studentId: studentIds[2],
      trainerId: trainerIds[2],
      date: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 16, 0).toISOString(),
      startTime: '16:00',
      endTime: '16:50',
      status: 'scheduled'
    },
    {
      programId: programIds[0],
      studentId: studentIds[3],
      trainerId: trainerIds[0],
      date: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1, 9, 0).toISOString(),
      startTime: '09:00',
      endTime: '09:45',
      status: 'scheduled',
      notes: 'Progress evaluation'
    },
    {
      programId: programIds[3],
      studentId: studentIds[4],
      trainerId: trainerIds[1],
      date: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1, 11, 0).toISOString(),
      startTime: '11:00',
      endTime: '11:55',
      status: 'completed',
      notes: 'Excellent progress shown',
      progress: {
        completed: true,
        score: 85,
        observations: 'Student showed significant improvement in working memory tasks',
        recommendations: 'Continue with current program, consider advancing difficulty'
      }
    }
  ]

  appointments.forEach(appointment => createAppointment(appointment))
}

export function seedIfEmpty(): void {
  // Check if data already exists
  const existingStudents = listStudents()
  const existingTrainers = listTrainers()
  const existingPrograms = listPrograms()
  const existingAppointments = listAppointments()

  // Only seed if all collections are empty
  if (existingStudents.length === 0 && 
      existingTrainers.length === 0 && 
      existingPrograms.length === 0 && 
      existingAppointments.length === 0) {
    
    console.log('Seeding initial data...')
    
    // Seed in dependency order
    const programIds = seedPrograms()
    const trainerIds = seedTrainers()
    const studentIds = seedStudents()
    seedAppointments(studentIds, trainerIds, programIds)
    
    console.log('Seed data created successfully')
  }
}