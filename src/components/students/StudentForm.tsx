import { useState, useEffect, FormEvent } from 'react'
import { Student } from '../../types/index'

interface StudentFormData {
  name: string
  email: string
  dateOfBirth: string
  guardianName: string
  guardianEmail: string
  guardianPhone: string
  medicalNotes: string
}

interface StudentFormErrors {
  name?: string
  email?: string
  dateOfBirth?: string
  guardianEmail?: string
  guardianPhone?: string
}

interface StudentFormProps {
  initial?: Partial<Student>
  onSubmit: (data: Omit<Student, 'id' | 'createdAt' | 'updatedAt' | 'role'>) => void
  onCancel: () => void
  submitLabel?: string
}

export default function StudentForm({ initial, onSubmit, onCancel, submitLabel = 'Save Student' }: StudentFormProps) {
  const [formData, setFormData] = useState<StudentFormData>({
    name: initial?.name || '',
    email: initial?.email || '',
    dateOfBirth: initial?.dateOfBirth ? initial.dateOfBirth.split('T')[0] : '', // Convert from ISO to date input format
    guardianName: initial?.guardianName || '',
    guardianEmail: initial?.guardianEmail || '',
    guardianPhone: initial?.guardianPhone || '',
    medicalNotes: initial?.medicalNotes || '',
  })

  const [errors, setErrors] = useState<StudentFormErrors>({})

  const validateField = (name: string, value: string): string | undefined => {
    switch (name) {
      case 'name':
        if (!value.trim()) return 'Student name is required'
        if (value.trim().length < 2) return 'Name must be at least 2 characters'
        if (value.trim().length > 100) return 'Name must be less than 100 characters'
        break
      
      case 'email':
        if (!value.trim()) return 'Email is required'
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(value)) return 'Please enter a valid email address'
        break
      
      case 'dateOfBirth':
        if (!value.trim()) return 'Date of birth is required'
        const birthDate = new Date(value)
        const today = new Date()
        const age = today.getFullYear() - birthDate.getFullYear()
        const monthDiff = today.getMonth() - birthDate.getMonth()
        const finalAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) ? age - 1 : age
        
        if (isNaN(birthDate.getTime())) return 'Please enter a valid date'
        if (finalAge < 3 || finalAge > 120) return 'Age must be between 3 and 120 years'
        if (birthDate > today) return 'Date of birth cannot be in the future'
        break
      
      case 'guardianEmail':
        if (value.trim()) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
          if (!emailRegex.test(value)) return 'Please enter a valid email address'
        }
        break
      
      case 'guardianPhone':
        if (value.trim()) {
          const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/
          if (!phoneRegex.test(value.replace(/[\s\-\(\)]/g, ''))) {
            return 'Please enter a valid phone number'
          }
        }
        break
    }
    return undefined
  }

  const validateForm = () => {
    const newErrors: StudentFormErrors = {}
    
    newErrors.name = validateField('name', formData.name)
    newErrors.email = validateField('email', formData.email)
    newErrors.dateOfBirth = validateField('dateOfBirth', formData.dateOfBirth)
    newErrors.guardianEmail = validateField('guardianEmail', formData.guardianEmail)
    newErrors.guardianPhone = validateField('guardianPhone', formData.guardianPhone)
    
    setErrors(newErrors)
    return !Object.values(newErrors).some(error => error !== undefined)
  }

  const handleFieldChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Validate this field and update errors
    const fieldError = validateField(field, value)
    setErrors(prev => ({ ...prev, [field]: fieldError }))
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      // Focus first invalid field
      const firstErrorField = Object.keys(errors).find(key => errors[key as keyof StudentFormErrors])
      if (firstErrorField) {
        const element = document.getElementById(firstErrorField)
        element?.focus()
      }
      return
    }

    const submitData = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      dateOfBirth: new Date(formData.dateOfBirth).toISOString(),
      guardianName: formData.guardianName.trim() || undefined,
      guardianEmail: formData.guardianEmail.trim() || undefined,
      guardianPhone: formData.guardianPhone.trim() || undefined,
      medicalNotes: formData.medicalNotes.trim() || undefined
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
      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
        
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            Student Name *
          </label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={(e) => handleFieldChange('name', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
              errors.name ? 'border-red-500' : 'border-gray-300'
            }`}
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? 'name-error' : undefined}
          />
          {errors.name && (
            <p id="name-error" className="mt-1 text-sm text-red-600">
              {errors.name}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            Email *
          </label>
          <input
            type="email"
            id="email"
            value={formData.email}
            onChange={(e) => handleFieldChange('email', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
              errors.email ? 'border-red-500' : 'border-gray-300'
            }`}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'email-error' : undefined}
          />
          {errors.email && (
            <p id="email-error" className="mt-1 text-sm text-red-600">
              {errors.email}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 mb-2">
            Date of Birth *
          </label>
          <input
            type="date"
            id="dateOfBirth"
            value={formData.dateOfBirth}
            onChange={(e) => handleFieldChange('dateOfBirth', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
              errors.dateOfBirth ? 'border-red-500' : 'border-gray-300'
            }`}
            aria-invalid={!!errors.dateOfBirth}
            aria-describedby={errors.dateOfBirth ? 'dateOfBirth-error' : undefined}
          />
          {errors.dateOfBirth && (
            <p id="dateOfBirth-error" className="mt-1 text-sm text-red-600">
              {errors.dateOfBirth}
            </p>
          )}
        </div>
      </div>

      {/* Guardian Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Guardian Information</h3>
        
        <div>
          <label htmlFor="guardianName" className="block text-sm font-medium text-gray-700 mb-2">
            Guardian Name
          </label>
          <input
            type="text"
            id="guardianName"
            value={formData.guardianName}
            onChange={(e) => handleFieldChange('guardianName', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div>
          <label htmlFor="guardianEmail" className="block text-sm font-medium text-gray-700 mb-2">
            Guardian Email
          </label>
          <input
            type="email"
            id="guardianEmail"
            value={formData.guardianEmail}
            onChange={(e) => handleFieldChange('guardianEmail', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
              errors.guardianEmail ? 'border-red-500' : 'border-gray-300'
            }`}
            aria-invalid={!!errors.guardianEmail}
            aria-describedby={errors.guardianEmail ? 'guardianEmail-error' : undefined}
          />
          {errors.guardianEmail && (
            <p id="guardianEmail-error" className="mt-1 text-sm text-red-600">
              {errors.guardianEmail}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="guardianPhone" className="block text-sm font-medium text-gray-700 mb-2">
            Guardian Phone
          </label>
          <input
            type="tel"
            id="guardianPhone"
            value={formData.guardianPhone}
            onChange={(e) => handleFieldChange('guardianPhone', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
              errors.guardianPhone ? 'border-red-500' : 'border-gray-300'
            }`}
            aria-invalid={!!errors.guardianPhone}
            aria-describedby={errors.guardianPhone ? 'guardianPhone-error' : undefined}
            placeholder="e.g., +1 (555) 123-4567"
          />
          {errors.guardianPhone && (
            <p id="guardianPhone-error" className="mt-1 text-sm text-red-600">
              {errors.guardianPhone}
            </p>
          )}
        </div>
      </div>

      {/* Medical Information */}
      <div>
        <label htmlFor="medicalNotes" className="block text-sm font-medium text-gray-700 mb-2">
          Medical Notes
        </label>
        <textarea
          id="medicalNotes"
          rows={3}
          value={formData.medicalNotes}
          onChange={(e) => handleFieldChange('medicalNotes', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          placeholder="Any medical conditions, allergies, or special notes..."
        />
      </div>

      {/* Program Selection removed */}

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