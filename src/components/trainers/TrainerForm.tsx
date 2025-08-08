import { useState, useEffect, FormEvent } from 'react'
import { Trainer, TimeSlot } from '../../types/index'
import AvailabilityScheduler from './AvailabilityScheduler'

interface TrainerFormData {
  name: string
  email: string
  specializations: string[]
  certifications: string[]
  availableHours: TimeSlot[]
}

interface TrainerFormErrors {
  name?: string
  email?: string
  specializations?: string
  certifications?: string
}

interface TrainerFormProps {
  initial?: Partial<Trainer>
  onSubmit: (data: Omit<Trainer, 'id' | 'createdAt' | 'updatedAt' | 'role'>) => void
  onCancel: () => void
  submitLabel?: string
}

export default function TrainerForm({ initial, onSubmit, onCancel, submitLabel = 'Save Trainer' }: TrainerFormProps) {
  const [formData, setFormData] = useState<TrainerFormData>({
    name: initial?.name || '',
    email: initial?.email || '',
    specializations: initial?.specializations || [],
    certifications: initial?.certifications || [],
    availableHours: initial?.availableHours || []
  })

  const [errors, setErrors] = useState<TrainerFormErrors>({})
  const [newSpecialization, setNewSpecialization] = useState('')
  const [newCertification, setNewCertification] = useState('')

  const validateField = (name: string, value: string | string[]): string | undefined => {
    switch (name) {
      case 'name':
        if (typeof value !== 'string') return undefined
        if (!value.trim()) return 'Trainer name is required'
        if (value.trim().length < 2) return 'Name must be at least 2 characters'
        if (value.trim().length > 100) return 'Name must be less than 100 characters'
        break
      
      case 'email':
        if (typeof value !== 'string') return undefined
        if (!value.trim()) return 'Email is required'
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(value)) return 'Please enter a valid email address'
        break
      
      case 'specializations':
        if (!Array.isArray(value)) return undefined
        if (value.length === 0) return 'At least one specialization is required'
        break

      case 'certifications':
        if (!Array.isArray(value)) return undefined
        if (value.length === 0) return 'At least one certification is required'
        break
    }
    return undefined
  }

  const validateForm = () => {
    const newErrors: TrainerFormErrors = {}
    
    newErrors.name = validateField('name', formData.name)
    newErrors.email = validateField('email', formData.email)
    newErrors.specializations = validateField('specializations', formData.specializations)
    newErrors.certifications = validateField('certifications', formData.certifications)
    
    setErrors(newErrors)
    return !Object.values(newErrors).some(error => error !== undefined)
  }

  const handleFieldChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    const fieldError = validateField(field, value)
    setErrors(prev => ({ ...prev, [field]: fieldError }))
  }

  const handleAddSpecialization = () => {
    const specialization = newSpecialization.trim()
    if (!specialization) return
    
    if (formData.specializations.includes(specialization)) {
      return // Don't add duplicates
    }
    
    const updatedSpecializations = [...formData.specializations, specialization]
    setFormData(prev => ({ ...prev, specializations: updatedSpecializations }))
    setNewSpecialization('')
    
    // Validate specializations
    const error = validateField('specializations', updatedSpecializations)
    setErrors(prev => ({ ...prev, specializations: error }))
  }

  const handleRemoveSpecialization = (index: number) => {
    const updatedSpecializations = formData.specializations.filter((_, i) => i !== index)
    setFormData(prev => ({ ...prev, specializations: updatedSpecializations }))
    
    // Validate specializations
    const error = validateField('specializations', updatedSpecializations)
    setErrors(prev => ({ ...prev, specializations: error }))
  }

  const handleAddCertification = () => {
    const certification = newCertification.trim()
    if (!certification) return
    
    if (formData.certifications.includes(certification)) {
      return // Don't add duplicates
    }
    
    const updatedCertifications = [...formData.certifications, certification]
    setFormData(prev => ({ ...prev, certifications: updatedCertifications }))
    setNewCertification('')
    
    // Validate certifications
    const error = validateField('certifications', updatedCertifications)
    setErrors(prev => ({ ...prev, certifications: error }))
  }

  const handleRemoveCertification = (index: number) => {
    const updatedCertifications = formData.certifications.filter((_, i) => i !== index)
    setFormData(prev => ({ ...prev, certifications: updatedCertifications }))
    
    // Validate certifications
    const error = validateField('certifications', updatedCertifications)
    setErrors(prev => ({ ...prev, certifications: error }))
  }

  const handleAvailabilityChange = (availableHours: TimeSlot[]) => {
    setFormData(prev => ({ ...prev, availableHours }))
  }

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

    const submitData = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      specializations: formData.specializations,
      certifications: formData.certifications,
      availableHours: formData.availableHours
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
            Trainer Name *
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
      </div>

      {/* Specializations */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Specializations *</h3>
        
        <div className="flex gap-2">
          <input
            type="text"
            value={newSpecialization}
            onChange={(e) => setNewSpecialization(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSpecialization())}
            placeholder="e.g., Cognitive Training, Memory Enhancement..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <button
            type="button"
            onClick={handleAddSpecialization}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
          >
            Add
          </button>
        </div>

        {errors.specializations && (
          <p className="text-sm text-red-600">
            {errors.specializations}
          </p>
        )}

        {formData.specializations.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {formData.specializations.map((specialization, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 px-3 py-1 bg-primary-100 text-primary-800 text-sm rounded-full"
              >
                {specialization}
                <button
                  type="button"
                  onClick={() => handleRemoveSpecialization(index)}
                  className="ml-1 hover:text-primary-600 focus:outline-none"
                  aria-label={`Remove ${specialization} specialization`}
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Certifications */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Certifications *</h3>
        
        <div className="flex gap-2">
          <input
            type="text"
            value={newCertification}
            onChange={(e) => setNewCertification(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCertification())}
            placeholder="e.g., BrainRx Certified, Neurofeedback Specialist..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <button
            type="button"
            onClick={handleAddCertification}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
          >
            Add
          </button>
        </div>

        {errors.certifications && (
          <p className="text-sm text-red-600">
            {errors.certifications}
          </p>
        )}

        {formData.certifications.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {formData.certifications.map((certification, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full"
              >
                {certification}
                <button
                  type="button"
                  onClick={() => handleRemoveCertification(index)}
                  className="ml-1 hover:text-green-600 focus:outline-none"
                  aria-label={`Remove ${certification} certification`}
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Availability */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Availability</h3>
        <AvailabilityScheduler
          availability={formData.availableHours}
          onChange={handleAvailabilityChange}
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