import { useState, useEffect, FormEvent, useMemo } from 'react'
import { Session, SessionType, Student, Trainer } from '../../types/index'
import { listStudents } from '../../services/students'
import { listTrainers } from '../../services/trainers'
import { listSessions } from '../../services/sessions'
import { validateTimeSlot } from '../../utils/validation'
import { getAvailableSeats } from '../../utils/seatAvailability'

interface SessionFormData {
  sessionType: SessionType
  date: string
  startTime: string
  endTime: string
  assignedSeat: number | ''
  studentId: string
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

  const generateStartTimeOptions = (): string[] => {
    const latestStart = BUSINESS_END_MINUTES - 30 // ensure at least 30m duration
    const options: string[] = []
    for (let t = BUSINESS_START_MINUTES; t <= latestStart; t += INCREMENT) {
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
      options.push(minutesToHHMM(t))
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
    trainerId: initial?.trainerId || '',
    notes: initial?.notes || ''
  })

  const [errors, setErrors] = useState<SessionFormErrors>({})

  // Get available trainers based on session type
  const availableTrainers = formData.sessionType === 'gt'
    ? trainers.filter(trainer => trainer.canDoGtAssessments)
    : trainers

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
          return 'Warning: Date is in the past'
        }
        break
      
      case 'startTime':
        if (!value) return 'Start time is required'
        break
      
      case 'endTime':
        if (!value) return 'End time is required'
        break
      
      case 'studentId':
        if (!value) return 'Student is required'
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
      setFormData(prev => ({ ...prev, trainerId: '', assignedSeat: '' }))
    }

    // If start time changes, ensure end time remains valid; otherwise clear it
    if (field === 'startTime') {
      const allowedEnds = new Set(generateEndTimeOptions(value))
      if (!allowedEnds.has(formData.endTime)) {
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
    if (field === 'startTime' || field === 'endTime') {
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
      studentId: formData.studentId,
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
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Session Type *
        </label>
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="radio"
              name="sessionType"
              value="training-tabletop"
              checked={formData.sessionType === 'training-tabletop'}
              onChange={(e) => handleFieldChange('sessionType', e.target.value as SessionType)}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
            />
            <span className="ml-2 text-sm text-gray-700">Training (Table-top)</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="sessionType"
              value="training-digital"
              checked={formData.sessionType === 'training-digital'}
              onChange={(e) => handleFieldChange('sessionType', e.target.value as SessionType)}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
            />
            <span className="ml-2 text-sm text-gray-700">Training (Digital)</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="sessionType"
              value="accelerate-rx"
              checked={formData.sessionType === 'accelerate-rx'}
              onChange={(e) => handleFieldChange('sessionType', e.target.value as SessionType)}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
            />
            <span className="ml-2 text-sm text-gray-700">AccelerateRx</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="sessionType"
              value="remote"
              checked={formData.sessionType === 'remote'}
              onChange={(e) => handleFieldChange('sessionType', e.target.value as SessionType)}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
            />
            <span className="ml-2 text-sm text-gray-700">Remote</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="sessionType"
              value="gt"
              checked={formData.sessionType === 'gt'}
              onChange={(e) => handleFieldChange('sessionType', e.target.value as SessionType)}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
            />
            <span className="ml-2 text-sm text-gray-700">GT</span>
          </label>
        </div>
        {errors.sessionType && (
          <p className="mt-1 text-sm text-red-600">
            {errors.sessionType}
          </p>
        )}
      </div>

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
          />
        </div>
        {errors.date && (
          <p id="date-error" className={`mt-1 text-sm ${errors.date.includes('Warning') ? 'text-yellow-600' : 'text-red-600'}`}>
            {errors.date}
          </p>
        )}
      </div>

      {/* Time Slot */}
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
            {generateStartTimeOptions().map((t) => (
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
            onChange={(e) => handleFieldChange('endTime', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
              errors.endTime ? 'border-red-500' : 'border-gray-300'
            }`}
            aria-invalid={!!errors.endTime}
            aria-describedby={errors.endTime ? 'endTime-error' : undefined}
            disabled={!formData.startTime}
          >
            <option value="">{formData.startTime ? 'Select end time' : 'Select start time first'}</option>
            {generateEndTimeOptions(formData.startTime).map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          {errors.endTime && (
            <p id="endTime-error" className="mt-1 text-sm text-red-600">{errors.endTime}</p>
          )}
        </div>
      </div>

      {/* Time slot validation error */}
      {errors.timeSlot && (
        <p className="text-sm text-red-600">
          {errors.timeSlot}
        </p>
      )}

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

      {/* Student */}
      <div>
        <label htmlFor="studentId" className="block text-sm font-medium text-gray-700 mb-2">
          Student *
        </label>
        <select
          id="studentId"
          value={formData.studentId}
          onChange={(e) => handleFieldChange('studentId', e.target.value)}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
            errors.studentId ? 'border-red-500' : 'border-gray-300'
          }`}
          aria-invalid={!!errors.studentId}
          aria-describedby={errors.studentId ? 'studentId-error' : undefined}
        >
          <option value="">Select a student</option>
          {students.map((student) => (
            <option key={student.id} value={student.id}>
              {student.firstName || student.name}
            </option>
          ))}
        </select>
        {errors.studentId && (
          <p id="studentId-error" className="mt-1 text-sm text-red-600">
            {errors.studentId}
          </p>
        )}
      </div>

      {/* Program removed */}

      {/* Trainer */}
      <div>
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
        <select
          id="trainerId"
          value={formData.trainerId}
          onChange={(e) => handleFieldChange('trainerId', e.target.value)}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
            errors.trainerId ? 'border-red-500' : 'border-gray-300'
          }`}
          aria-invalid={!!errors.trainerId}
          aria-describedby={errors.trainerId ? 'trainerId-error' : undefined}
          disabled={availableTrainers.length === 0}
        >
          <option value="">Select a trainer</option>
          {availableTrainers.map((trainer) => (
            <option key={trainer.id} value={trainer.id}>
              {trainer.firstName || trainer.name}
            </option>
          ))}
        </select>
        {errors.trainerId && (
          <p id="trainerId-error" className="mt-1 text-sm text-red-600">
            {errors.trainerId}
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