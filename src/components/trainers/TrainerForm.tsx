import { useState, useEffect, FormEvent } from 'react'
import { Trainer } from '../../types/index'

interface TrainerFormData {
  firstName: string
  lastName: string
  email: string
  canDoGtAssessments: boolean
}

interface TrainerFormErrors {
  firstName?: string
  lastName?: string
  email?: string
}

interface TrainerFormProps {
  initial?: Partial<Trainer>
  onSubmit: (data: Omit<Trainer, 'id' | 'createdAt' | 'updatedAt' | 'role'>) => void
  onCancel: () => void
  submitLabel?: string
}

export default function TrainerForm({ initial, onSubmit, onCancel, submitLabel = 'Save Trainer' }: TrainerFormProps) {
  const [formData, setFormData] = useState<TrainerFormData>({
    firstName: initial?.firstName || (initial?.name?.split(' ')?.[0] ?? ''),
    lastName: initial?.lastName || (initial?.name?.split(' ').slice(1).join(' ') ?? ''),
    email: initial?.email || '',
    canDoGtAssessments: initial?.canDoGtAssessments ?? false
  })

  const [errors, setErrors] = useState<TrainerFormErrors>({})

  const validateField = (name: string, value: string | string[]): string | undefined => {
    switch (name) {
      case 'firstName':
        if (typeof value !== 'string') return undefined
        if (!value.trim()) return 'First name is required'
        if (value.trim().length < 2) return 'Name must be at least 2 characters'
        if (value.trim().length > 100) return 'Name must be less than 100 characters'
        break
      case 'lastName':
        if (typeof value !== 'string') return undefined
        if (value.trim().length > 100) return 'Last name must be less than 100 characters'
        break
      
      case 'email':
        if (typeof value !== 'string') return undefined
        if (!value.trim()) return 'Email is required'
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(value)) return 'Please enter a valid email address'
        break
      
      case 'canDoGtAssessments':
        break
    }
    return undefined
  }

  const validateForm = () => {
    const newErrors: TrainerFormErrors = {}
    
    newErrors.firstName = validateField('firstName', formData.firstName)
    newErrors.lastName = validateField('lastName', formData.lastName)
    newErrors.email = validateField('email', formData.email)
    newErrors.nickname = validateField('nickname', formData.nickname)
    // no additional required fields
    
    setErrors(newErrors)
    return !Object.values(newErrors).some(error => error !== undefined)
  }

  const handleFieldChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    const fieldError = validateField(field, value)
    setErrors(prev => ({ ...prev, [field]: fieldError }))
  }

  // Removed specialization/certification/availability handlers

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      // Focus first invalid field
      const firstErrorField = Object.keys(errors).find(key => errors[key as keyof TrainerFormErrors])
      if (firstErrorField) {
        const element = document.getElementById(firstErrorField)
        element?.focus()
      }
      return
    }

    const fullName = `${formData.firstName} ${formData.lastName}`.trim()
    const submitData = {
      name: fullName,
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim() || undefined,
      email: formData.email.trim(),
      canDoGtAssessments: Boolean(formData.canDoGtAssessments)
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
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
              First Name *
            </label>
            <input
              type="text"
              id="firstName"
              value={formData.firstName}
              onChange={(e) => handleFieldChange('firstName', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                errors.firstName ? 'border-red-500' : 'border-gray-300'
              }`}
              aria-invalid={!!errors.firstName}
              aria-describedby={errors.firstName ? 'firstName-error' : undefined}
            />
            {errors.firstName && (
              <p id="firstName-error" className="mt-1 text-sm text-red-600">
                {errors.firstName}
              </p>
            )}
          </div>
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
              Last Name
            </label>
            <input
              type="text"
              id="lastName"
              value={formData.lastName}
              onChange={(e) => handleFieldChange('lastName', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                errors.lastName ? 'border-red-500' : 'border-gray-300'
              }`}
              aria-invalid={!!errors.lastName}
              aria-describedby={errors.lastName ? 'lastName-error' : undefined}
            />
            {errors.lastName && (
              <p id="lastName-error" className="mt-1 text-sm text-red-600">
                {errors.lastName}
              </p>
            )}
          </div>
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
          <label htmlFor="nickname" className="block text-sm font-medium text-gray-700 mb-2">
            Nickname (max 8 chars) *
          </label>
          <input
            type="text"
            id="nickname"
            value={formData.nickname}
            onChange={(e) => handleFieldChange('nickname', e.target.value)}
            maxLength={8}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
              errors.nickname ? 'border-red-500' : 'border-gray-300'
            }`}
            aria-invalid={!!errors.nickname}
            aria-describedby={errors.nickname ? 'nickname-error' : undefined}
          />
          {errors.nickname && (
            <p id="nickname-error" className="mt-1 text-sm text-red-600">
              {errors.nickname}
            </p>
          )}
        </div>
      </div>

      {/* GT Assessment Capability */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Capabilities</h3>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={formData.canDoGtAssessments}
            onChange={(e) => setFormData(prev => ({ ...prev, canDoGtAssessments: e.target.checked }))}
            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
          />
          <span className="text-sm text-gray-700">Can do GT Assessments</span>
        </label>
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