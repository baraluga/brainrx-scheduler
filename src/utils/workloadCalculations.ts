import { startOfWeek, endOfWeek } from 'date-fns'
import { listSessions } from '../services/sessions'
import { listTrainers } from '../services/trainers'

export interface TrainerWorkload {
  trainerId: string
  trainerName: string
  studentCount: number
  status: 'ideal' | 'approaching' | 'overloaded'
}

export interface WorkloadConfig {
  idealStudentCount: number
  approachingThreshold: number
}

export const DEFAULT_WORKLOAD_CONFIG: WorkloadConfig = {
  idealStudentCount: 3,
  approachingThreshold: 1.5
}

export function calculateTrainerWorkloads(
  config: WorkloadConfig = DEFAULT_WORKLOAD_CONFIG
): TrainerWorkload[] {
  const trainers = listTrainers()
  const sessions = listSessions()
  
  // Use a broader time range - last 7 days to next 7 days for more flexible matching
  const now = new Date()
  const pastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const futureWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)


  const trainerWorkloads: TrainerWorkload[] = trainers.map(trainer => {
    // Get all scheduled sessions for this trainer (regardless of date for now)
    const allTrainerSessions = sessions.filter(session => 
      session.trainerId === trainer.id && session.status === 'scheduled'
    )
    
    // Filter by date range
    const trainerSessions = allTrainerSessions.filter(session => {
      const sessionDate = new Date(session.date)
      return sessionDate >= pastWeek && sessionDate <= futureWeek
    })


    const uniqueStudents = new Set(
      trainerSessions
        .filter(session => session.studentId)
        .map(session => session.studentId)
    )

    const studentCount = uniqueStudents.size
    const status = getWorkloadStatus(studentCount, config)


    return {
      trainerId: trainer.id,
      trainerName: trainer.name,
      studentCount,
      status
    }
  })

  return trainerWorkloads.sort((a, b) => b.studentCount - a.studentCount)
}

function getWorkloadStatus(
  studentCount: number, 
  config: WorkloadConfig
): 'ideal' | 'approaching' | 'overloaded' {
  if (studentCount <= config.idealStudentCount) {
    return 'ideal'
  } else if (studentCount <= config.idealStudentCount * config.approachingThreshold) {
    return 'approaching'
  } else {
    return 'overloaded'
  }
}

export function getStatusColor(status: 'ideal' | 'approaching' | 'overloaded'): string {
  switch (status) {
    case 'ideal':
      return '#10b981'
    case 'approaching':
      return '#f59e0b'
    case 'overloaded':
      return '#ef4444'
  }
}

export function getWorkloadSummary(workloads: TrainerWorkload[]) {
  const total = workloads.length
  const overloaded = workloads.filter(w => w.status === 'overloaded').length
  const approaching = workloads.filter(w => w.status === 'approaching').length
  const ideal = workloads.filter(w => w.status === 'ideal').length
  const averageLoad = total > 0 
    ? Math.round((workloads.reduce((sum, w) => sum + w.studentCount, 0) / total) * 10) / 10 
    : 0

  return {
    total,
    overloaded,
    approaching,
    ideal,
    averageLoad
  }
}