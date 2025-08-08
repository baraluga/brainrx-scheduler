import { useState, useEffect, FormEvent } from 'react'
import { Trainer } from '../../types/index'

interface TrainerFormData {
  name: string
  email: string
  nickname: string
  canDoGtAssessments: boolean
}

interface TrainerFormErrors {
  name?: string
  email?: string
  nickname?: string
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
    nickname: initial?.nickname || '',
    canDoGtAssessments: initial?.canDoGtAssessments ?? false
  })

  const [errors, setErrors] = useState<TrainerFormErrors>({})

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
      case 'nickname':
        if (typeof value !== 'string') return undefined
        if (!value.trim()) return 'Nickname is required'
        if (value.trim().length > 8) return 'Nickname must be at most 8 characters'
        break
      
      case 'canDoGtAssessments':
        break
    }
    return undefined
  }

  const validateForm = () => {
    const newErrors: TrainerFormErrors = {}
    
    newErrors.name = validateField('name', formData.name)
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

    const submitData = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      nickname: formData.nickname.trim(),
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