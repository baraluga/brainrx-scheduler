import { useState, useMemo } from 'react'
import { Appointment, Student, Trainer } from '../types/index'
import { listAppointments, createAppointment } from '../services/appointments'
import { listStudents } from '../services/students'
import { listTrainers } from '../services/trainers'
import AppointmentForm from '../components/appointments/AppointmentForm'
import Modal from '../components/common/Modal'
import DailyGridView from '../components/calendar/DailyGridView'

function Calendar() {
  const [appointments, setAppointments] = useState<Appointment[]>(listAppointments())
  const [students] = useState<Student[]>(listStudents())
  const [trainers] = useState<Trainer[]>(listTrainers())
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [toast, setToast] = useState<{
    message: string
    type: 'success' | 'error'
  } | null>(null)
  const [viewMode, setViewMode] = useState<'list' | 'daily-grid'>('list')
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().slice(0,10))

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 5000)
  }

  const refreshAppointments = () => {
    setAppointments(listAppointments())
  }

  // Group appointments by date for display
  const appointmentsByDate = useMemo(() => {
    const grouped: Record<string, Appointment[]> = {}
    
    appointments.forEach(appointment => {
      const dateKey = new Date(appointment.date).toLocaleDateString()
      if (!grouped[dateKey]) {
        grouped[dateKey] = []
      }
      grouped[dateKey].push(appointment)
    })
    
    // Sort appointments within each date by start time
    Object.keys(grouped).forEach(date => {
      grouped[date].sort((a, b) => a.startTime.localeCompare(b.startTime))
    })
    
    return grouped
  }, [appointments])

  const sortedDates = Object.keys(appointmentsByDate).sort((a, b) => 
    new Date(a).getTime() - new Date(b).getTime()
  )

  const goPrevDay = () => {
    const d = new Date(selectedDate)
    d.setDate(d.getDate() - 1)
    setSelectedDate(d.toISOString().slice(0,10))
  }
  const goNextDay = () => {
    const d = new Date(selectedDate)
    d.setDate(d.getDate() + 1)
    setSelectedDate(d.toISOString().slice(0,10))
  }

  const GRID_CONFIG = {
    businessStartMinutes: 10 * 60,
    businessEndMinutes: 19 * 60,
    incrementMinutes: 15,
    slotsPerType: {
      'training': 10,
      'gt-assessment': 4,
    } as const
  }

  const handleCreateAppointment = (data: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt' | 'status'>) => {
    try {
      const newAppointment = createAppointment(data)
      refreshAppointments()
      setIsModalOpen(false)
      showToast('Appointment created successfully')
      console.log('Appointment created:', newAppointment)
    } catch (error) {
      showToast('Failed to create appointment', 'error')
      console.error('Create appointment failed:', error)
    }
  }

  const getStudentName = (studentId: string) => {
    return students.find(s => s.id === studentId)?.name || 'Unknown Student'
  }

  const getTrainerName = (trainerId: string) => {
    return trainers.find(t => t.id === trainerId)?.name || 'Unknown Trainer'
  }

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':').map(Number)
    const period = hours >= 12 ? 'PM' : 'AM'
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  return (
    <div className="space-y-6">
      {/* Toast notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-md shadow-lg ${
          toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Calendar
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            View and manage training session schedules and appointments.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-2 mr-4">
            <button onClick={goPrevDay} className="px-2 py-1 rounded border border-gray-300 hover:bg-gray-50">◀</button>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-2 py-1 border border-gray-300 rounded"
            />
            <button onClick={goNextDay} className="px-2 py-1 rounded border border-gray-300 hover:bg-gray-50">▶</button>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">View:</label>
            <select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value as 'list' | 'daily-grid')}
              className="px-2 py-1 border border-gray-300 rounded"
            >
              <option value="list">List</option>
              <option value="daily-grid">Daily Grid</option>
            </select>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="ml-2 inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
          >
            <svg className="-ml-1 mr-2 h-5 w-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Create Appointment
          </button>
        </div>
      </div>

      {viewMode === 'list' ? (
        <div className="bg-white shadow rounded-lg">
          {appointments.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m0 0V7a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V9a2 2 0 012-2h12V7z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No appointments</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating your first appointment.</p>
            <div className="mt-6">
              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <svg className="-ml-1 mr-2 h-5 w-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Create Appointment
              </button>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {sortedDates.map(dateKey => (
              <div key={dateKey} className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {formatDate(dateKey)}
                </h3>
                <div className="space-y-3">
                  {appointmentsByDate[dateKey].map(appointment => (
                    <div
                      key={appointment.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div className="text-sm font-medium text-gray-900">
                            {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
                          </div>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            appointment.appointmentType === 'training' 
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}>
                            {appointment.appointmentType === 'training' ? 'Training' : 'GT Assessment'}
                          </span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            appointment.status === 'scheduled' ? 'bg-green-100 text-green-800' :
                            appointment.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                            appointment.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {appointment.status}
                          </span>
                        </div>
                        <div className="mt-1 text-sm text-gray-600">{getStudentName(appointment.studentId)}</div>
                        <div className="text-xs text-gray-500">
                          Trainer: {getTrainerName(appointment.trainerId)}
                        </div>
                        {appointment.notes && (
                          <div className="mt-1 text-xs text-gray-500">
                            Notes: {appointment.notes}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      ) : (
        <DailyGridView
          date={new Date(selectedDate)}
          appointments={appointments}
          students={students}
          trainers={trainers}
          config={GRID_CONFIG}
        />
      )}

      {/* Create Appointment Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Appointment"
        size="lg"
      >
        <AppointmentForm
          onSubmit={handleCreateAppointment}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>
    </div>
  )
}

export default Calendar