import { useMemo, useState, FormEvent } from 'react'
import { Student, Trainer } from '../../types'
import { listStudents } from '../../services/students'
import { listTrainers } from '../../services/trainers'
import { createSession } from '../../services/sessions'
import { validateTimeSlot } from '../../utils/validation'

type TimeSlot = { startTime: string; endTime: string }

type Props = {
  onCreated: (count: number) => void
  onCancel: () => void
}

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

// Business days (Tue-Sat) per request
const BUSINESS_WEEKDAYS: number[] = [2,3,4,5,6] // Tue=2 .. Sat=6 per Date.getDay()
const weekdayLabels: { key: number; label: string }[] = [
  { key: 2, label: 'Tue' },
  { key: 3, label: 'Wed' },
  { key: 4, label: 'Thu' },
  { key: 5, label: 'Fri' },
  { key: 6, label: 'Sat' },
]

export default function OnboardStudentForm({ onCreated, onCancel }: Props) {
  const [students] = useState<Student[]>(listStudents())
  const [trainers] = useState<Trainer[]>(listTrainers())

  const [studentId, setStudentId] = useState('')
  const [trainerId, setTrainerId] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [weekdays, setWeekdays] = useState<Record<number, boolean>>({ 2: true, 3: true, 4: true, 5: true, 6: false })
  const [slotsByDay, setSlotsByDay] = useState<Record<number, TimeSlot>>({ 2: {startTime:'', endTime:''}, 3:{startTime:'',endTime:''}, 4:{startTime:'',endTime:''}, 5:{startTime:'',endTime:''}, 6:{startTime:'',endTime:''} })
  const [error, setError] = useState<string | null>(null)

  const toggleWeekday = (d: number) => setWeekdays(prev => ({ ...prev, [d]: !prev[d] }))

  const canSubmit = useMemo(() => {
    if (!studentId || !trainerId || !startDate || !endDate) return false
    if (new Date(startDate) > new Date(endDate)) return false
    const selectedDays = BUSINESS_WEEKDAYS.filter(d => weekdays[d])
    if (selectedDays.length === 0) return false
    for (const d of selectedDays) {
      const s = slotsByDay[d]
      if (!s || !s.startTime || !s.endTime) return false
      const v = validateTimeSlot(s.startTime, s.endTime)
      if (!v.ok) return false
    }
    return true
  }, [studentId, trainerId, startDate, endDate, weekdays, slotsByDay])

  const updateDaySlot = (dayKey: number, patch: Partial<TimeSlot>) => {
    setSlotsByDay(prev => {
      const current = prev[dayKey] || { startTime: '', endTime: '' }
      const next = { ...current, ...patch }
      if (patch.startTime) {
        const allowed = new Set(generateEndTimeOptions(patch.startTime))
        if (!allowed.has(next.endTime)) next.endTime = ''
      }
      return { ...prev, [dayKey]: next }
    })
  }

  const datesInRange = (): Date[] => {
    const out: Date[] = []
    const from = new Date(startDate)
    const to = new Date(endDate)
    for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) {
      const wd = d.getDay() // 0..6, Sunday=0
      if (BUSINESS_WEEKDAYS.includes(wd) && weekdays[wd]) {
        out.push(new Date(d))
      }
    }
    return out
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      const selectedDates = datesInRange()
      let created = 0
      for (const date of selectedDates) {
        const isoDate = new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString()
        const wd = date.getDay()
        const s = slotsByDay[wd]
        if (s) {
          const validation = validateTimeSlot(s.startTime, s.endTime)
          if (validation.ok) {
            createSession({
              sessionType: 'training-tabletop',
              assignedSeat: 1, // Default to seat 1 for onboarding
              date: isoDate,
              startTime: s.startTime,
              endTime: s.endTime,
              studentId,
              trainerId,
              notes: undefined,
              progress: undefined,
            })
            created++
          }
        }
      }
      onCreated(created)
    } catch (err: any) {
      setError('Failed to create sessions. Please try again.')
      // eslint-disable-next-line no-console
      console.error('Onboard create failed', err)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <div className="p-2 rounded bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-ink-700 mb-2">Student *</label>
          <select value={studentId} onChange={e => setStudentId(e.target.value)} className="w-full border rounded-md px-3 py-2">
            <option value="">Select a student</option>
            {students.map(s => (
              <option key={s.id} value={s.id}>{s.firstName || s.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-ink-700 mb-2">Trainer *</label>
          <select value={trainerId} onChange={e => setTrainerId(e.target.value)} className="w-full border rounded-md px-3 py-2">
            <option value="">Select a trainer</option>
            {trainers.map(t => (
              <option key={t.id} value={t.id}>{t.firstName || t.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-ink-700 mb-2">Start Date *</label>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full border rounded-md px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink-700 mb-2">End Date *</label>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full border rounded-md px-3 py-2" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-ink-700 mb-2">Preferred Weekdays</label>
        <div className="flex flex-wrap gap-2">
          {weekdayLabels.map(w => (
            <label key={w.key} className={`inline-flex items-center px-3 py-1 rounded-full border cursor-pointer ${weekdays[w.key] ? 'bg-primary-100 border-primary-200 text-ink-700' : 'bg-white border-gray-200 text-ink-500'}`}>
              <input type="checkbox" checked={!!weekdays[w.key]} onChange={() => toggleWeekday(w.key)} className="sr-only" />
              {w.label}
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <label className="block text-sm font-medium text-ink-700">Preferred Time Per Selected Day</label>
        {weekdayLabels.filter(w => weekdays[w.key]).map(w => {
          const slot = slotsByDay[w.key] || { startTime: '', endTime: '' }
          return (
            <div key={w.key} className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-end">
              <div className="sm:col-span-1 font-medium text-ink-700">{w.label}</div>
              <div className="sm:col-span-2">
                <label className="block text-xs text-ink-500 mb-1">Start</label>
                <select value={slot.startTime} onChange={e => updateDaySlot(w.key, { startTime: e.target.value })} className="w-full border rounded-md px-3 py-2">
                  <option value="">Select start time</option>
                  {generateStartTimeOptions().map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs text-ink-500 mb-1">End</label>
                <select value={slot.endTime} onChange={e => updateDaySlot(w.key, { endTime: e.target.value })} className="w-full border rounded-md px-3 py-2" disabled={!slot.startTime}>
                  <option value="">{slot.startTime ? 'Select end time' : 'Select start time first'}</option>
                  {generateEndTimeOptions(slot.startTime).map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={!canSubmit} className={`flex-1 btn-primary ${canSubmit ? '' : 'opacity-50 cursor-not-allowed'}`}>Create Sessions</button>
        <button type="button" onClick={onCancel} className="flex-1 btn-secondary">Cancel</button>
      </div>
    </form>
  )
}


