import { useState, useEffect, FormEvent } from 'react'
import { Appointment, AppointmentType, Student, Program, Trainer } from '../../types/index'
import { listStudents } from '../../services/students'
import { listPrograms } from '../../services/programs'
import { listTrainers } from '../../services/trainers'
import { validateTimeSlot } from '../../utils/validation'

interface AppointmentFormData {
  appointmentType: AppointmentType
  date: string
  startTime: string
  endTime: string
  studentId: string
  programId: string
  trainerId: string
  notes: string
}

interface AppointmentFormErrors {
  appointmentType?: string
  date?: string
  startTime?: string
  endTime?: string
  timeSlot?: string
  studentId?: string
  programId?: string
  trainerId?: string
}

interface AppointmentFormProps {
  initial?: Partial<Appointment>
  onSubmit: (data: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt' | 'status'>) => void
  onCancel: () => void
  submitLabel?: string
}

export default function AppointmentForm({ initial, onSubmit, onCancel, submitLabel = 'Create Appointment' }: AppointmentFormProps) {
  const [students] = useState<Student[]>(listStudents())
  const [programs] = useState<Program[]>(listPrograms())
  const [trainers] = useState<Trainer[]>(listTrainers())
  
  const [formData, setFormData] = useState<AppointmentFormData>({
    appointmentType: initial?.appointmentType || 'training',
    date: initial?.date ? initial.date.split('T')[0] : '',
    startTime: initial?.startTime || '',
    endTime: initial?.endTime || '',
    studentId: initial?.studentId || '',
    programId: initial?.programId || '',
    trainerId: initial?.trainerId || '',
    notes: initial?.notes || ''
  })

  const [errors, setErrors] = useState<AppointmentFormErrors>({})

  // Get available trainers based on appointment type
  const availableTrainers = formData.appointmentType === 'gt-assessment'
    ? trainers.filter(trainer => trainer.certifications.some(cert => cert.toLowerCase().includes('gt assessment')))
    : trainers

  const validateField = (name: string, value: string): string | undefined => {
    switch (name) {
      case 'appointmentType':
        if (!value) return 'Appointment type is required'
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
      
      case 'programId':
        if (!value) return 'Program is required'
        break
      
      case 'trainerId':
        if (!value) return 'Trainer is required'
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
    const newErrors: AppointmentFormErrors = {}
    
    newErrors.appointmentType = validateField('appointmentType', formData.appointmentType)
    newErrors.date = validateField('date', formData.date)
    newErrors.startTime = validateField('startTime', formData.startTime)
    newErrors.endTime = validateField('endTime', formData.endTime)
    newErrors.studentId = validateField('studentId', formData.studentId)
    newErrors.programId = validateField('programId', formData.programId)
    newErrors.trainerId = validateField('trainerId', formData.trainerId)
    
    // Validate time slot
    newErrors.timeSlot = validateTimeSlotField()
    
    setErrors(newErrors)
    return !Object.values(newErrors).some(error => error !== undefined)
  }

  const handleFieldChange = (field: keyof AppointmentFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear trainer selection if appointment type changes
    if (field === 'appointmentType') {
      setFormData(prev => ({ ...prev, trainerId: '' }))
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
      const firstErrorField = Object.keys(errors).find(key => errors[key as keyof AppointmentFormErrors])
      if (firstErrorField && firstErrorField !== 'timeSlot') {
        const element = document.getElementById(firstErrorField)
        element?.focus()
      }
      return
    }

    const submitData = {
      appointmentType: formData.appointmentType,
      date: new Date(formData.date).toISOString(),
      startTime: formData.startTime,
      endTime: formData.endTime,
      studentId: formData.studentId,
      programId: formData.programId,
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
      {/* Appointment Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Appointment Type *
        </label>
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="radio"
              name="appointmentType"
              value="training"
              checked={formData.appointmentType === 'training'}
              onChange={(e) => handleFieldChange('appointmentType', e.target.value as AppointmentType)}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
            />
            <span className="ml-2 text-sm text-gray-700">Training Session</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="appointmentType"
              value="gt-assessment"
              checked={formData.appointmentType === 'gt-assessment'}
              onChange={(e) => handleFieldChange('appointmentType', e.target.value as AppointmentType)}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
            />
            <span className="ml-2 text-sm text-gray-700">GT Assessment</span>
          </label>
        </div>
        {errors.appointmentType && (
          <p className="mt-1 text-sm text-red-600">
            {errors.appointmentType}
          </p>
        )}
      </div>

      {/* Date */}
      <div>
        <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
          Date *
        </label>
        <input
          type="date"
          id="date"
          value={formData.date}
          onChange={(e) => handleFieldChange('date', e.target.value)}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
            errors.date ? 'border-red-500' : 'border-gray-300'
          }`}
          aria-invalid={!!errors.date}
          aria-describedby={errors.date ? 'date-error' : undefined}
        />
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
          <input
            type="time"
            id="startTime"
            step="900" // 15-minute steps
            value={formData.startTime}
            onChange={(e) => handleFieldChange('startTime', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
              errors.startTime ? 'border-red-500' : 'border-gray-300'
            }`}
            aria-invalid={!!errors.startTime}
            aria-describedby={errors.startTime ? 'startTime-error' : undefined}
          />
          {errors.startTime && (
            <p id="startTime-error" className="mt-1 text-sm text-red-600">
              {errors.startTime}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-2">
            End Time *
          </label>
          <input
            type="time"
            id="endTime"
            step="900" // 15-minute steps
            value={formData.endTime}
            onChange={(e) => handleFieldChange('endTime', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
              errors.endTime ? 'border-red-500' : 'border-gray-300'
            }`}
            aria-invalid={!!errors.endTime}
            aria-describedby={errors.endTime ? 'endTime-error' : undefined}
          />
          {errors.endTime && (
            <p id="endTime-error" className="mt-1 text-sm text-red-600">
              {errors.endTime}
            </p>
          )}
        </div>
      </div>

      {/* Time slot validation error */}
      {errors.timeSlot && (
        <p className="text-sm text-red-600">
          {errors.timeSlot}
        </p>
      )}

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
              {student.name}
            </option>
          ))}
        </select>
        {errors.studentId && (
          <p id="studentId-error" className="mt-1 text-sm text-red-600">
            {errors.studentId}
          </p>
        )}
      </div>

      {/* Program */}
      <div>
        <label htmlFor="programId" className="block text-sm font-medium text-gray-700 mb-2">
          Program *
        </label>
        <select
          id="programId"
          value={formData.programId}
          onChange={(e) => handleFieldChange('programId', e.target.value)}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
            errors.programId ? 'border-red-500' : 'border-gray-300'
          }`}
          aria-invalid={!!errors.programId}
          aria-describedby={errors.programId ? 'programId-error' : undefined}
        >
          <option value="">Select a program</option>
          {programs.map((program) => (
            <option key={program.id} value={program.id}>
              {program.name}
            </option>
          ))}
        </select>
        {errors.programId && (
          <p id="programId-error" className="mt-1 text-sm text-red-600">
            {errors.programId}
          </p>
        )}
      </div>

      {/* Trainer */}
      <div>
        <label htmlFor="trainerId" className="block text-sm font-medium text-gray-700 mb-2">
          Trainer *
        </label>
        {availableTrainers.length === 0 && formData.appointmentType === 'gt-assessment' && (
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
              {trainer.name}
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
          placeholder="Optional notes about the appointment..."
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