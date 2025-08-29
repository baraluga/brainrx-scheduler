import { useState, useEffect, FormEvent, useMemo } from 'react'
import { Session, SessionType, Student, Trainer } from '../../types/index'
import { listStudents } from '../../services/students'
import { listTrainers } from '../../services/trainers'
import { listSessions } from '../../services/sessions'
import { validateTimeSlot, isTimeslotBlocked } from '../../utils/validation'
import { getAvailableSeats } from '../../utils/seatAvailability'

interface SessionFormData {
  sessionType: SessionType
  date: string
  startTime: string
  endTime: string
  assignedSeat: number | ''
  studentId: string
  clientName: string // Added for GT sessions
  trainerId: string
  notes: string
}

interface SessionFormErrors {
  sessionType?: string
  date?: string
  startTime?: string
  endTime?: string
  timeSlot?: string
  assignedSeat?: string
  studentId?: string
  clientName?: string
  trainerId?: string
}

interface SessionFormProps {
  initial?: Partial<Session>
  onSubmit: (data: Omit<Session, 'id' | 'createdAt' | 'updatedAt' | 'status'>) => void
  onCancel: () => void
  submitLabel?: string
}

export default function SessionForm({ initial, onSubmit, onCancel, submitLabel = 'Add Session' }: SessionFormProps) {
  const [students] = useState<Student[]>(listStudents())
  const [trainers] = useState<Trainer[]>(listTrainers())
  const [existingSessions] = useState<Session[]>(listSessions())
  
  // Business hours and time utilities
  const BUSINESS_START_MINUTES = 10 * 60 // 10:00
  const BUSINESS_END_MINUTES = 19 * 60 // 19:00
  const INCREMENT = 15

  const minutesToHHMM = (mins: number): string => {
    const h = Math.floor(mins / 60)
    const m = mins % 60
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
  }

  const toLocalDateInputValue = (d: Date): string => {
    const tzOffset = d.getTimezoneOffset() * 60000
    return new Date(d.getTime() - tzOffset).toISOString().slice(0, 10)
  }

  const isTodayDateString = (dateStr: string): boolean => {
    return dateStr === toLocalDateInputValue(new Date())
  }

  const generateStartTimeOptions = (dateStr?: string): string[] => {
    const latestStart = BUSINESS_END_MINUTES - 30 // ensure at least 30m duration
    const options: string[] = []
    let startFrom = BUSINESS_START_MINUTES
    if (dateStr && isTodayDateString(dateStr)) {
      const now = new Date()
      const nowMins = now.getHours() * 60 + now.getMinutes()
      const minToday = Math.ceil(nowMins / INCREMENT) * INCREMENT
      startFrom = Math.max(BUSINESS_START_MINUTES, minToday)
    }
    for (let t = startFrom; t <= latestStart; t += INCREMENT) {
      options.push(minutesToHHMM(t))
    }
    return options
  }

  const generateEndTimeOptions = (startTime?: string): string[] => {
    if (!startTime) return []
    const [sh, sm] = startTime.split(':').map(Number)
    const startMins = sh * 60 + sm
    const minEnd = startMins + 30
    const maxEnd = Math.min(startMins + 120, BUSINESS_END_MINUTES)
    const options: string[] = []
    for (let t = minEnd; t <= maxEnd; t += INCREMENT) {
      const duration = t - startMins
      const displayText = `${minutesToHHMM(t)} (${duration} minutes)`
      options.push(displayText)
    }
    return options
  }



  const SEAT_CONFIG = {
    slotsPerType: {
      "training-tabletop": 10,
      "training-digital": 10,
      "accelerate-rx": 3,
      remote: 4,
      gt: 4,
    } as Record<SessionType, number>,
  }

  const [formData, setFormData] = useState<SessionFormData>({
    sessionType: (initial as any)?.sessionType || 'training-tabletop',
    date: initial?.date ? initial.date.split('T')[0] : '',
    startTime: initial?.startTime || '',
    endTime: initial?.endTime || '',
    assignedSeat: initial?.assignedSeat || '',
    studentId: initial?.studentId || '',
    clientName: initial?.clientName || '',
    trainerId: initial?.trainerId || '',
    notes: initial?.notes || ''
  })

  const [studentSearch, setStudentSearch] = useState('')
  const [trainerSearch, setTrainerSearch] = useState('')
  const [showStudentDropdown, setShowStudentDropdown] = useState(false)
  const [showTrainerDropdown, setShowTrainerDropdown] = useState(false)

  const [errors, setErrors] = useState<SessionFormErrors>({})

  // Get available trainers based on session type
  const availableTrainers = formData.sessionType === 'gt'
    ? trainers.filter(trainer => trainer.canDoGtAssessments)
    : trainers

  // Filter students and trainers based on search
  const filteredStudents = students.filter(student => {
    const name = (student.firstName || student.name || '').toLowerCase()
    return name.includes(studentSearch.toLowerCase())
  })

  const filteredTrainers = availableTrainers.filter(trainer => {
    const name = (trainer.firstName || trainer.name || '').toLowerCase()
    return name.includes(trainerSearch.toLowerCase())
  })

  const getStudentDisplayName = (studentId: string) => {
    const student = students.find(s => s.id === studentId)
    return student?.firstName || student?.name || 'Select a student'
  }

  const getTrainerDisplayName = (trainerId: string) => {
    const trainer = trainers.find(t => t.id === trainerId)
    return trainer?.firstName || trainer?.name || 'Select a trainer'
  }

  // Get available seats based on session type and time slot
  const availableSeats = useMemo(() => {
    if (!formData.sessionType || !formData.date || !formData.startTime || !formData.endTime) {
      return []
    }
    return getAvailableSeats(
      formData.sessionType,
      new Date(formData.date).toISOString(),
      formData.startTime,
      formData.endTime,
      existingSessions,
      SEAT_CONFIG
    )
  }, [formData.sessionType, formData.date, formData.startTime, formData.endTime, existingSessions])

  // Auto-select first available seat when conditions change
  useEffect(() => {
    if (availableSeats.length > 0 && !formData.assignedSeat) {
      setFormData(prev => ({ ...prev, assignedSeat: availableSeats[0] }))
    }
    // Clear seat if it's no longer available
    else if (formData.assignedSeat && !availableSeats.includes(Number(formData.assignedSeat))) {
      setFormData(prev => ({ ...prev, assignedSeat: availableSeats[0] || '' }))
    }
  }, [availableSeats, formData.assignedSeat])

  const validateField = (name: string, value: string): string | undefined => {
    switch (name) {
      case 'sessionType':
        if (!value) return 'Session type is required'
        break
      
      case 'date':
        if (!value) return 'Date is required'
        const selectedDate = new Date(value)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        if (selectedDate < today) {
          return 'Date cannot be in the past'
        }
        break
      
      case 'startTime':
        if (!value) return 'Start time is required'
        // If date is today, disallow selecting past time
        if (formData.date && isTodayDateString(formData.date)) {
          const [sh, sm] = value.split(':').map(Number)
          const selMins = sh * 60 + sm
          const now = new Date()
          const nowMins = now.getHours() * 60 + now.getMinutes()
          const minToday = Math.ceil(nowMins / INCREMENT) * INCREMENT
          if (selMins < minToday) {
            return 'Start time cannot be in the past'
          }
        }
        break
      
      case 'endTime':
        if (!value) return 'End time is required'
        break
      
      case 'studentId':
        // Non-GT sessions always require a student
        if (formData.sessionType !== 'gt' && !value) {
          return 'Student is required'
        }
        break
      
      case 'clientName':
        // GT sessions always require a client name
        if (formData.sessionType === 'gt' && !value) {
          return 'Client name is required for GT sessions'
        }
        break
      
      case 'trainerId':
        if (!value) return 'Trainer is required'
        break
      
      case 'assignedSeat':
        if (!value) return 'Seat is required'
        break
    }
    return undefined
  }

  const validateTimeSlotField = () => {
    if (!formData.startTime || !formData.endTime) return undefined
    const validation = validateTimeSlot(formData.startTime, formData.endTime)
    if (!validation.ok) {
      return validation.message
    }
    if (formData.date && isTimeslotBlocked(formData.date, formData.startTime, formData.endTime)) {
      return 'Selected time falls within a blocked period'
    }
    return undefined
  }

  const validateForm = () => {
    const newErrors: SessionFormErrors = {}
    
    newErrors.sessionType = validateField('sessionType', formData.sessionType)
    newErrors.date = validateField('date', formData.date)
    newErrors.startTime = validateField('startTime', formData.startTime)
    newErrors.endTime = validateField('endTime', formData.endTime)
    newErrors.assignedSeat = validateField('assignedSeat', String(formData.assignedSeat))
    newErrors.studentId = validateField('studentId', formData.studentId)
    newErrors.clientName = validateField('clientName', formData.clientName)
    newErrors.trainerId = validateField('trainerId', formData.trainerId)
    
    // Validate time slot
    newErrors.timeSlot = validateTimeSlotField()
    
    setErrors(newErrors)
    return !Object.values(newErrors).some(error => error !== undefined)
  }

  const handleFieldChange = (field: keyof SessionFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear trainer selection if session type changes
    if (field === 'sessionType') {
      setFormData(prev => ({ ...prev, trainerId: '', assignedSeat: '', studentId: '', clientName: '' }))
      setTrainerSearch('')
      setStudentSearch('')
      // Clear errors when switching session types
      setErrors(prev => ({ ...prev, studentId: undefined, clientName: undefined }))
    }

    // If start time changes, maintain the same duration if possible
    if (field === 'startTime') {
      if (formData.startTime && formData.endTime) {
        // Calculate current duration
        const [oldSh, oldSm] = formData.startTime.split(':').map(Number)
        const [oldEh, oldEm] = formData.endTime.split(':').map(Number)
        const oldStartMins = oldSh * 60 + oldSm
        const oldEndMins = oldEh * 60 + oldEm
        const currentDuration = oldEndMins - oldStartMins
        
        // Calculate new end time with same duration
        const [newSh, newSm] = value.split(':').map(Number)
        const newStartMins = newSh * 60 + newSm
        const newEndMins = newStartMins + currentDuration
        
        // Check if new end time exceeds business hours
        if (newEndMins <= BUSINESS_END_MINUTES) {
          const newEndTime = minutesToHHMM(newEndMins)
          setFormData(prev => ({ ...prev, endTime: newEndTime, assignedSeat: '' }))
        } else {
          // Use the last available increment
          const maxEndMins = BUSINESS_END_MINUTES
          const newEndTime = minutesToHHMM(maxEndMins)
          setFormData(prev => ({ ...prev, endTime: newEndTime, assignedSeat: '' }))
        }
      } else {
        // If no end time was set, clear it
        setFormData(prev => ({ ...prev, endTime: '', assignedSeat: '' }))
      }
    }

    // Clear assigned seat if date or times change
    if (field === 'date' || field === 'endTime') {
      setFormData(prev => ({ ...prev, assignedSeat: '' }))
    }
    
    // Validate this field and update errors
    const fieldError = validateField(field, value)
    setErrors(prev => ({ ...prev, [field]: fieldError }))
    
    // Re-validate time slot when times change
    if (field === 'startTime' || field === 'endTime' || field === 'date') {
      const timeSlotError = validateTimeSlotField()
      setErrors(prev => ({ ...prev, timeSlot: timeSlotError }))
    }
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      // Focus first invalid field
      const firstErrorField = Object.keys(errors).find(key => errors[key as keyof SessionFormErrors])
      if (firstErrorField && firstErrorField !== 'timeSlot') {
        const element = document.getElementById(firstErrorField)
        element?.focus()
      }
      return
    }

    const submitData = {
      sessionType: formData.sessionType,
      assignedSeat: Number(formData.assignedSeat),
      date: new Date(formData.date).toISOString(),
      startTime: formData.startTime,
      endTime: formData.endTime,
      studentId: formData.sessionType === 'gt' ? undefined : formData.studentId,
      clientName: formData.sessionType === 'gt' ? formData.clientName : undefined,
      trainerId: formData.trainerId,
      notes: formData.notes.trim() || undefined,
      progress: undefined
    }

    onSubmit(submitData)
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onCancel()
    }
  }

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  const isValid = !Object.values(errors).some(error => error !== undefined)

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Session Type */}
      <div>
        <label htmlFor="sessionType" className="block text-sm font-medium text-gray-700 mb-2">
          Session Type *
        </label>
        <select
          id="sessionType"
          value={formData.sessionType}
          onChange={(e) => handleFieldChange('sessionType', e.target.value as SessionType)}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
            errors.sessionType ? 'border-red-500' : 'border-gray-300'
          }`}
          aria-invalid={!!errors.sessionType}
        >
          <option value="training-tabletop">Training (Table-top)</option>
          <option value="training-digital">Training (Digital)</option>
          <option value="accelerate-rx">AccelerateRx</option>
          <option value="remote">Remote</option>
          <option value="gt">GT</option>
        </select>
        {errors.sessionType && (
          <p className="mt-1 text-sm text-red-600">{errors.sessionType}</p>
        )}
      </div>

      {/* Student/Client Name */}
      {formData.sessionType === 'gt' ? (
        <div>
          <label htmlFor="clientName" className="block text-sm font-medium text-gray-700 mb-2">
            Client Name *
          </label>
          <input
            type="text"
            id="clientName"
            value={formData.clientName}
            onChange={(e) => {
              const value = e.target.value
              handleFieldChange('clientName', value)
            }}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
              errors.clientName ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter prospect's name..."
            aria-invalid={!!errors.clientName}
            required
          />
          {errors.clientName && (
            <p className="mt-1 text-sm text-red-600">{errors.clientName}</p>
          )}
        </div>
      ) : (
        <div className="relative">
          <label htmlFor="studentId" className="block text-sm font-medium text-gray-700 mb-2">
            Student *
          </label>
          <div className="relative">
            <input
              type="text"
              value={formData.studentId ? getStudentDisplayName(formData.studentId) : studentSearch}
              onChange={(e) => {
                setStudentSearch(e.target.value)
                if (formData.studentId) {
                  setFormData(prev => ({ ...prev, studentId: '' }))
                }
              }}
              onFocus={() => setShowStudentDropdown(true)}
              onBlur={() => setTimeout(() => setShowStudentDropdown(false), 200)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                errors.studentId ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Search for a student..."
              aria-invalid={!!errors.studentId}
            />
            {showStudentDropdown && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
                {filteredStudents.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-gray-500">No students found</div>
                ) : (
                  filteredStudents.map((student) => (
                    <button
                      key={student.id}
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, studentId: student.id }))
                        setStudentSearch('')
                        setShowStudentDropdown(false)
                      }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 focus:bg-gray-50"
                    >
                      {student.firstName || student.name}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
          {errors.studentId && (
            <p className="mt-1 text-sm text-red-600">{errors.studentId}</p>
          )}
        </div>
      )}

      {/* Date */}
      <div>
        <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
          Date *
        </label>
        <div
          className={`w-full px-3 py-2 border rounded-md ${errors.date ? 'border-red-500' : 'border-gray-300'} bg-white`}
          onClick={() => {
            const el = document.getElementById('date') as HTMLInputElement | null
            if (el) {
              // Try to open the native picker if available; otherwise focus
              // @ts-ignore - showPicker is experimental
              if (typeof el.showPicker === 'function') { el.showPicker() } else { el.focus() }
            }
          }}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              const el = document.getElementById('date') as HTMLInputElement | null
              if (el) {
                // @ts-ignore
                if (typeof el.showPicker === 'function') { el.showPicker() } else { el.focus() }
              }
            }
          }}
        >
          <input
            type="date"
            id="date"
            value={formData.date}
            onChange={(e) => handleFieldChange('date', e.target.value)}
            className="w-full bg-transparent outline-none"
            aria-invalid={!!errors.date}
            aria-describedby={errors.date ? 'date-error' : undefined}
            min={toLocalDateInputValue(new Date())}
          />
        </div>
        {errors.date && (
          <p id="date-error" className={`mt-1 text-sm ${errors.date.includes('Warning') ? 'text-yellow-600' : 'text-red-600'}`}>
            {errors.date}
          </p>
        )}
      </div>

      {/* Time Slot with Quick Presets */}
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-2">
              Start Time *
            </label>
            <select
              id="startTime"
              value={formData.startTime}
              onChange={(e) => handleFieldChange('startTime', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                errors.startTime ? 'border-red-500' : 'border-gray-300'
              }`}
              aria-invalid={!!errors.startTime}
              aria-describedby={errors.startTime ? 'startTime-error' : undefined}
            >
              <option value="">Select start time</option>
              {generateStartTimeOptions(formData.date).map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            {errors.startTime && (
              <p id="startTime-error" className="mt-1 text-sm text-red-600">{errors.startTime}</p>
            )}
          </div>

          <div>
            <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-2">
              End Time *
            </label>
            <select
              id="endTime"
              value={formData.endTime}
              onChange={(e) => {
                // Extract just the time part (before the duration suffix)
                const timeValue = e.target.value.split(' (')[0]
                handleFieldChange('endTime', timeValue)
              }}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                errors.endTime ? 'border-red-500' : 'border-gray-300'
              }`}
              aria-invalid={!!errors.endTime}
              aria-describedby={errors.endTime ? 'endTime-error' : undefined}
              disabled={!formData.startTime}
            >
              <option value="">{formData.startTime ? 'Select end time' : 'Select start time first'}</option>
              {generateEndTimeOptions(formData.startTime).map((t) => (
                <option key={t} value={t.split(' (')[0]}>
                  {t}
                </option>
              ))}
            </select>
            {errors.endTime && (
              <p id="endTime-error" className="mt-1 text-sm text-red-600">{errors.endTime}</p>
            )}
          </div>
        </div>
        

      </div>

      {/* Time slot validation error */}
      {errors.timeSlot && (
        <p className="text-sm text-red-600">
          {errors.timeSlot}
        </p>
      )}

      {/* Trainer */}
      <div className="relative">
        <label htmlFor="trainerId" className="block text-sm font-medium text-gray-700 mb-2">
          Trainer *
        </label>
        {availableTrainers.length === 0 && formData.sessionType === 'gt' && (
          <div className="mb-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800">
              No trainers are certified for GT Assessment. Please ensure at least one trainer has "GT Assessment" certification.
            </p>
          </div>
        )}
        <div className="relative">
          <input
            type="text"
            value={formData.trainerId ? getTrainerDisplayName(formData.trainerId) : trainerSearch}
            onChange={(e) => {
              setTrainerSearch(e.target.value)
              if (formData.trainerId) {
                setFormData(prev => ({ ...prev, trainerId: '' }))
              }
            }}
            onFocus={() => setShowTrainerDropdown(true)}
            onBlur={() => setTimeout(() => setShowTrainerDropdown(false), 200)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
              errors.trainerId ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Search for a trainer..."
            aria-invalid={!!errors.trainerId}
            disabled={availableTrainers.length === 0}
          />
          {showTrainerDropdown && availableTrainers.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
              {filteredTrainers.length === 0 ? (
                <div className="px-3 py-2 text-sm text-gray-500">No trainers found</div>
              ) : (
                filteredTrainers.map((trainer) => (
                  <button
                    key={trainer.id}
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, trainerId: trainer.id }))
                      setTrainerSearch('')
                      setShowTrainerDropdown(false)
                    }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 focus:bg-gray-50"
                  >
                    {trainer.firstName || trainer.name}
                  </button>
                ))
              )}
            </div>
          )}
        </div>
        {errors.trainerId && (
          <p className="mt-1 text-sm text-red-600">{errors.trainerId}</p>
        )}
      </div>

      {/* Seat */}
      <div>
        <label htmlFor="assignedSeat" className="block text-sm font-medium text-gray-700 mb-2">
          Seat *
        </label>
        <select
          id="assignedSeat"
          value={formData.assignedSeat}
          onChange={(e) => handleFieldChange('assignedSeat', e.target.value)}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
            errors.assignedSeat ? 'border-red-500' : 'border-gray-300'
          }`}
          aria-invalid={!!errors.assignedSeat}
          aria-describedby={errors.assignedSeat ? 'assignedSeat-error' : undefined}
          disabled={availableSeats.length === 0}
        >
          <option value="">
            {availableSeats.length === 0 
              ? 'No seats available for selected time' 
              : 'Select a seat'
            }
          </option>
          {availableSeats.map((seat) => (
            <option key={seat} value={seat}>
              {seat}
            </option>
          ))}
        </select>
        {errors.assignedSeat && (
          <p id="assignedSeat-error" className="mt-1 text-sm text-red-600">
            {errors.assignedSeat}
          </p>
        )}
        {availableSeats.length === 0 && formData.sessionType && formData.date && formData.startTime && formData.endTime && (
          <p className="mt-1 text-sm text-yellow-600">
            All seats for {formData.sessionType.replace('-', ' ')} are occupied during this time slot.
          </p>
        )}
      </div>

      {/* Notes */}
      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
          Notes
        </label>
        <textarea
          id="notes"
          rows={3}
          value={formData.notes}
          onChange={(e) => handleFieldChange('notes', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          placeholder="Optional notes about the session..."
        />
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={!isValid}
          className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
            isValid
              ? 'bg-primary-600 hover:bg-primary-700 text-white'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {submitLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}