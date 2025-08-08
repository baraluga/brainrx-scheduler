import { listStudents } from '../services/students'
import { listTrainers } from '../services/trainers'
import { listAppointments } from '../services/appointments'
import { Appointment } from '../types/index'

function Dashboard() {
  const students = listStudents()
  const trainers = listTrainers()
  const appointments = listAppointments()
  
  const today = new Date().toDateString()
  const todaysAppointments = appointments.filter((appointment: Appointment) => {
    const appointmentDate = new Date(appointment.date).toDateString()
    return appointmentDate === today && appointment.status === 'scheduled'
  })

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 pb-5">
        <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
          Dashboard
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Welcome to BrainRX Scheduler. Manage your students, trainers, and sessions all in one place.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-medium">S</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Active Students</dt>
                  <dd className="text-lg font-medium text-gray-900">{students.length}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-medium">T</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Trainers</dt>
                  <dd className="text-lg font-medium text-gray-900">{trainers.length}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-medium">C</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Today's Sessions</dt>
                  <dd className="text-lg font-medium text-gray-900">{todaysAppointments.length}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Quick Actions</h3>
          <div className="mt-5">
            <div className="flex flex-wrap gap-3">
              <button className="btn-primary">Add Session</button>
              <button className="btn-secondary">Add Student</button>
              <button className="btn-secondary">View Reports</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard