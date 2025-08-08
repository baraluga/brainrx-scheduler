import { useState, useEffect, FormEvent } from 'react'
import { Program } from '../../types/index'

interface ProgramFormData {
  name: string
  description: string
  duration: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  targetAge: {
    min: string
    max: string
  }
}

interface ProgramFormErrors {
  name?: string
  description?: string
  duration?: string
  difficulty?: string
  targetAgeMin?: string
  targetAgeMax?: string
}

interface ProgramFormProps {
  initial?: Partial<Program>
  onSubmit: (data: Omit<Program, 'id' | 'createdAt' | 'updatedAt' | 'sessions'>) => void
  onCancel: () => void
  submitLabel?: string
}

export default function ProgramForm({ initial, onSubmit, onCancel, submitLabel = 'Save Program' }: ProgramFormProps) {
  const [formData, setFormData] = useState<ProgramFormData>({
    name: initial?.name || '',
    description: initial?.description || '',
    duration: initial?.duration?.toString() || '',
    difficulty: initial?.difficulty || 'beginner',
    targetAge: {
      min: initial?.targetAge?.min?.toString() || '',
      max: initial?.targetAge?.max?.toString() || ''
    }
  })

  const [errors, setErrors] = useState<ProgramFormErrors>({})

  const validateField = (name: string, value: string): string | undefined => {
    switch (name) {
      case 'name':
        if (!value.trim()) return 'Program name is required'
        if (value.trim().length < 2) return 'Program name must be at least 2 characters'
        if (value.trim().length > 100) return 'Program name must be less than 100 characters'
        break
      
      case 'description':
        if (value.length > 1000) return 'Description must be less than 1000 characters'
        break
      
      case 'duration':
        if (!value.trim()) return 'Duration is required'
        const duration = parseInt(value)
        if (isNaN(duration) || duration < 1 || duration > 365) {
          return 'Duration must be between 1 and 365 minutes'
        }
        break
      
      case 'targetAgeMin':
        if (!value.trim()) return 'Minimum age is required'
        const minAge = parseInt(value)
        if (isNaN(minAge) || minAge < 3 || minAge > 120) {
          return 'Minimum age must be between 3 and 120'
        }
        break
      
      case 'targetAgeMax':
        if (!value.trim()) return 'Maximum age is required'
        const maxAge = parseInt(value)
        const minAgeValue = parseInt(formData.targetAge.min)
        if (isNaN(maxAge) || maxAge < 3 || maxAge > 120) {
          return 'Maximum age must be between 3 and 120'
        }
        if (!isNaN(minAgeValue) && maxAge < minAgeValue) {
          return 'Maximum age must be greater than or equal to minimum age'
        }
        break
    }
    return undefined
  }

  const validateForm = () => {
    const newErrors: ProgramFormErrors = {}
    
    newErrors.name = validateField('name', formData.name)
    newErrors.description = validateField('description', formData.description)
    newErrors.duration = validateField('duration', formData.duration)
    newErrors.targetAgeMin = validateField('targetAgeMin', formData.targetAge.min)
    newErrors.targetAgeMax = validateField('targetAgeMax', formData.targetAge.max)
    
    setErrors(newErrors)
    return !Object.values(newErrors).some(error => error !== undefined)
  }

  const handleFieldChange = (field: string, value: string) => {
    if (field.startsWith('targetAge.')) {
      const subField = field.split('.')[1]
      setFormData(prev => ({
        ...prev,
        targetAge: {
          ...prev.targetAge,
          [subField]: value
        }
      }))
    } else {
      setFormData(prev => ({ ...prev, [field]: value }))
    }
    
    
    // Validate this field and update errors
    const fieldError = validateField(field === 'targetAge.min' ? 'targetAgeMin' : field === 'targetAge.max' ? 'targetAgeMax' : field, value)
    setErrors(prev => ({ 
      ...prev, 
      [field === 'targetAge.min' ? 'targetAgeMin' : field === 'targetAge.max' ? 'targetAgeMax' : field]: fieldError 
    }))
    
    // Also validate targetAgeMax when targetAgeMin changes
    if (field === 'targetAge.min' && formData.targetAge.max) {
      const maxError = validateField('targetAgeMax', formData.targetAge.max)
      setErrors(prev => ({ ...prev, targetAgeMax: maxError }))
    }
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      // Focus first invalid field
      const firstErrorField = Object.keys(errors).find(key => errors[key as keyof ProgramFormErrors])
      if (firstErrorField) {
        const element = document.getElementById(firstErrorField)
        element?.focus()
      }
      return
    }

    const submitData = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      duration: parseInt(formData.duration),
      difficulty: formData.difficulty,
      targetAge: {
        min: parseInt(formData.targetAge.min),
        max: parseInt(formData.targetAge.max)
      }
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
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
          Program Name *
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
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
          Description
        </label>
        <textarea
          id="description"
          rows={3}
          value={formData.description}
          onChange={(e) => handleFieldChange('description', e.target.value)}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
            errors.description ? 'border-red-500' : 'border-gray-300'
          }`}
          aria-invalid={!!errors.description}
          aria-describedby={errors.description ? 'description-error' : undefined}
        />
        {errors.description && (
          <p id="description-error" className="mt-1 text-sm text-red-600">
            {errors.description}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-2">
          Duration (minutes) *
        </label>
        <input
          type="number"
          id="duration"
          min="1"
          max="365"
          value={formData.duration}
          onChange={(e) => handleFieldChange('duration', e.target.value)}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
            errors.duration ? 'border-red-500' : 'border-gray-300'
          }`}
          aria-invalid={!!errors.duration}
          aria-describedby={errors.duration ? 'duration-error' : undefined}
        />
        {errors.duration && (
          <p id="duration-error" className="mt-1 text-sm text-red-600">
            {errors.duration}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="difficulty" className="block text-sm font-medium text-gray-700 mb-2">
          Difficulty Level *
        </label>
        <select
          id="difficulty"
          value={formData.difficulty}
          onChange={(e) => handleFieldChange('difficulty', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="targetAgeMin" className="block text-sm font-medium text-gray-700 mb-2">
            Min Age *
          </label>
          <input
            type="number"
            id="targetAgeMin"
            min="3"
            max="120"
            value={formData.targetAge.min}
            onChange={(e) => handleFieldChange('targetAge.min', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
              errors.targetAgeMin ? 'border-red-500' : 'border-gray-300'
            }`}
            aria-invalid={!!errors.targetAgeMin}
            aria-describedby={errors.targetAgeMin ? 'targetAgeMin-error' : undefined}
          />
          {errors.targetAgeMin && (
            <p id="targetAgeMin-error" className="mt-1 text-sm text-red-600">
              {errors.targetAgeMin}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="targetAgeMax" className="block text-sm font-medium text-gray-700 mb-2">
            Max Age *
          </label>
          <input
            type="number"
            id="targetAgeMax"
            min="3"
            max="120"
            value={formData.targetAge.max}
            onChange={(e) => handleFieldChange('targetAge.max', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
              errors.targetAgeMax ? 'border-red-500' : 'border-gray-300'
            }`}
            aria-invalid={!!errors.targetAgeMax}
            aria-describedby={errors.targetAgeMax ? 'targetAgeMax-error' : undefined}
          />
          {errors.targetAgeMax && (
            <p id="targetAgeMax-error" className="mt-1 text-sm text-red-600">
              {errors.targetAgeMax}
            </p>
          )}
        </div>
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