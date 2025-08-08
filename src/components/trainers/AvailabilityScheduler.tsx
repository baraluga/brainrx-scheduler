import { useState } from 'react'
import { TimeSlot } from '../../types/index'
import { 
  DAY_NAMES, 
  formatTimeSlot, 
  validateTimeRange, 
  checkTimeSlotOverlap, 
  sortTimeSlots,
  groupSlotsByDay 
} from '../../utils/timeUtils'

interface AvailabilitySchedulerProps {
  availability: TimeSlot[]
  onChange: (availability: TimeSlot[]) => void
}

export default function AvailabilityScheduler({ availability, onChange }: AvailabilitySchedulerProps) {
  const [newSlot, setNewSlot] = useState({
    dayOfWeek: 1, // Default to Monday
    startTime: '09:00',
    endTime: '17:00'
  })
  const [error, setError] = useState<string>('')

  const handleAddSlot = () => {
    setError('')

    const timeError = validateTimeRange(newSlot.startTime, newSlot.endTime)
    if (timeError) {
      setError(timeError)
      return
    }

    const slotToAdd: TimeSlot = {
      dayOfWeek: newSlot.dayOfWeek,
      startTime: newSlot.startTime,
      endTime: newSlot.endTime
    }

    if (checkTimeSlotOverlap(slotToAdd, availability)) {
      setError('This time slot overlaps with an existing slot')
      return
    }

    const updatedAvailability = sortTimeSlots([...availability, slotToAdd])
    onChange(updatedAvailability)

    // Reset form but keep the same day
    setNewSlot(prev => ({
      ...prev,
      startTime: '09:00',
      endTime: '17:00'
    }))
  }

  const handleRemoveSlot = (index: number) => {
    const updatedAvailability = availability.filter((_, i) => i !== index)
    onChange(updatedAvailability)
  }

  const groupedSlots = groupSlotsByDay(availability)
  const sortedAvailability = sortTimeSlots(availability)

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <label htmlFor="dayOfWeek" className="block text-sm font-medium text-gray-700 mb-1">
            Day
          </label>
          <select
            id="dayOfWeek"
            value={newSlot.dayOfWeek}
            onChange={(e) => setNewSlot(prev => ({ ...prev, dayOfWeek: parseInt(e.target.value) }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {DAY_NAMES.map((day, index) => (
              <option key={index} value={index}>
                {day}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1">
          <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-1">
            Start Time
          </label>
          <input
            type="time"
            id="startTime"
            value={newSlot.startTime}
            onChange={(e) => setNewSlot(prev => ({ ...prev, startTime: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div className="flex-1">
          <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-1">
            End Time
          </label>
          <input
            type="time"
            id="endTime"
            value={newSlot.endTime}
            onChange={(e) => setNewSlot(prev => ({ ...prev, endTime: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div className="flex items-end">
          <button
            type="button"
            onClick={handleAddSlot}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
          >
            Add
          </button>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600">
          {error}
        </p>
      )}

      {availability.length > 0 ? (
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3">
            Current Availability ({availability.length} slot{availability.length !== 1 ? 's' : ''})
          </h4>
          
          <div className="grid gap-3">
            {DAY_NAMES.map((dayName, dayIndex) => {
              const daySlots = groupedSlots[dayIndex]
              if (!daySlots || daySlots.length === 0) return null

              return (
                <div key={dayIndex} className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-gray-700 w-20 flex-shrink-0">
                    {dayName}:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {daySlots.map((slot) => {
                      const slotIndex = sortedAvailability.findIndex(s => 
                        s.dayOfWeek === slot.dayOfWeek && 
                        s.startTime === slot.startTime && 
                        s.endTime === slot.endTime
                      )
                      return (
                        <span
                          key={`${slot.dayOfWeek}-${slot.startTime}-${slot.endTime}`}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-primary-100 text-primary-800 text-xs rounded-full"
                        >
                          {formatTimeSlot(slot)}
                          <button
                            type="button"
                            onClick={() => handleRemoveSlot(slotIndex)}
                            className="ml-1 hover:text-primary-600 focus:outline-none"
                            aria-label={`Remove ${formatTimeSlot(slot)} on ${dayName}`}
                          >
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </span>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No availability set</h3>
          <p className="mt-1 text-sm text-gray-500">Add time slots to define when this trainer is available.</p>
        </div>
      )}
    </div>
  )
}