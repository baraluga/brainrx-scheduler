import { FormEvent, useMemo, useState, useEffect } from "react";
import { Session, Trainer } from "../../types";
import { listTrainers } from "../../services/trainers";
import { listStudents } from "../../services/students";
import { listSessions } from "../../services/sessions";
import { updateSession } from "../../services/sessions";
import { validateTimeSlot } from "../../utils/validation";
import { getAvailableSeats } from "../../utils/seatAvailability";

type Props = {
  initial: Session;
  onSaved: (updated: Session) => void;
  onCancel: () => void;
};

const BUSINESS_START_MINUTES = 10 * 60;
const BUSINESS_END_MINUTES = 19 * 60;
const INCREMENT = 15;

const minutesToHHMM = (mins: number): string => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

const generateStartTimeOptions = (): string[] => {
  const latestStart = BUSINESS_END_MINUTES - 30;
  const options: string[] = [];
  for (let t = BUSINESS_START_MINUTES; t <= latestStart; t += INCREMENT) {
    options.push(minutesToHHMM(t));
  }
  return options;
};

const generateEndTimeOptions = (startTime?: string): string[] => {
  if (!startTime) return [];
  const [sh, sm] = startTime.split(":").map(Number);
  const startMins = sh * 60 + sm;
  const minEnd = startMins + 30;
  const maxEnd = Math.min(startMins + 120, BUSINESS_END_MINUTES);
  const options: string[] = [];
  for (let t = minEnd; t <= maxEnd; t += INCREMENT) {
    options.push(minutesToHHMM(t));
  }
  return options;
};

const setQuickTimeSlot = (startTime: string, durationMinutes: number): string => {
  const [sh, sm] = startTime.split(":").map(Number);
  const startMins = sh * 60 + sm;
  const endMins = Math.min(startMins + durationMinutes, BUSINESS_END_MINUTES);
  return minutesToHHMM(endMins);
};

export default function EditSessionForm({ initial, onSaved, onCancel }: Props) {
  const [trainers] = useState<Trainer[]>(listTrainers());
  const [students] = useState(listStudents());
  const [existingSessions] = useState<Session[]>(listSessions());
  const [trainerId, setTrainerId] = useState(initial.trainerId);
  const [date, setDate] = useState(initial.date.split("T")[0]);
  const [startTime, setStartTime] = useState(initial.startTime);
  const [endTime, setEndTime] = useState(initial.endTime);
  const [assignedSeat, setAssignedSeat] = useState(initial.assignedSeat);
  const [error, setError] = useState<string | null>(null);
  const [trainerSearch, setTrainerSearch] = useState('');
  const [showTrainerDropdown, setShowTrainerDropdown] = useState(false);

  const SEAT_CONFIG = {
    slotsPerType: {
      "training-tabletop": 10,
      "training-digital": 10,
      "accelerate-rx": 3,
      remote: 4,
      gt: 4,
    } as Record<string, number>,
  };

  // Get available trainers based on session type
  const availableTrainers = initial.sessionType === 'gt'
    ? trainers.filter(trainer => trainer.canDoGtAssessments)
    : trainers;

  // Filter trainers based on search
  const filteredTrainers = availableTrainers.filter(trainer => {
    const name = (trainer.firstName || trainer.name || '').toLowerCase();
    return name.includes(trainerSearch.toLowerCase());
  });

  const getTrainerDisplayName = (trainerId: string) => {
    const trainer = trainers.find(t => t.id === trainerId);
    return trainer?.firstName || trainer?.name || 'Select a trainer';
  };

  const getStudentName = () => {
    const student = students.find(s => s.id === initial.studentId);
    return student?.firstName || student?.name || 'Unknown Student';
  };

  const getSessionTypeDisplay = () => {
    return initial.sessionType
      .replace('training-tabletop', 'Training (Table-top)')
      .replace('training-digital', 'Training (Digital)')
      .replace('accelerate-rx', 'AccelerateRx')
      .replace('remote', 'Remote')
      .replace('gt', 'GT');
  };

  // Get available seats for the current time slot
  const availableSeats = useMemo(() => {
    if (!date || !startTime || !endTime) return [];
    return getAvailableSeats(
      initial.sessionType,
      new Date(date).toISOString(),
      startTime,
      endTime,
      existingSessions,
      SEAT_CONFIG,
      initial.id // Exclude current session from conflict check
    );
  }, [date, startTime, endTime, existingSessions, initial.sessionType, initial.id]);

  const canSave = useMemo(() => {
    if (!trainerId || !date || !startTime || !endTime || !assignedSeat) return false;
    const v = validateTimeSlot(startTime, endTime);
    return v.ok;
  }, [trainerId, date, startTime, endTime, assignedSeat]);

  const onChangeStart = (val: string) => {
    setStartTime(val);
    const allowed = new Set(generateEndTimeOptions(val));
    if (!allowed.has(endTime)) {
      setEndTime("");
      setAssignedSeat(0); // Reset seat when time changes
    }
  };

  const onChangeEnd = (val: string) => {
    setEndTime(val);
    setAssignedSeat(0); // Reset seat when time changes
  };

  const handleQuickTimeSlot = (durationMinutes: number) => {
    if (!startTime) return;
    const newEndTime = setQuickTimeSlot(startTime, durationMinutes);
    setEndTime(newEndTime);
    setAssignedSeat(0); // Reset seat when time changes
    setError(null);
  };

  const onChangeDate = (val: string) => {
    setDate(val);
    setAssignedSeat(0); // Reset seat when date changes
  };

  // Auto-select seat when it becomes invalid or when starting with no seat
  useEffect(() => {
    if (availableSeats.length > 0) {
      if (!assignedSeat || !availableSeats.includes(assignedSeat)) {
        setAssignedSeat(availableSeats.includes(initial.assignedSeat) ? initial.assignedSeat : availableSeats[0]);
      }
    }
  }, [availableSeats, assignedSeat, initial.assignedSeat]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const v = validateTimeSlot(startTime, endTime);
    if (!v.ok) {
      setError(v.message);
      return;
    }
    try {
      const updated = updateSession(initial.id, {
        trainerId,
        assignedSeat,
        date: new Date(date).toISOString(),
        startTime,
        endTime,
      });
      onSaved(updated);
    } catch (err) {
      setError("Failed to save. Please try again.");
      // eslint-disable-next-line no-console
      console.error("Edit session save failed", err);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 rounded-md bg-red-50 border border-red-200 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Session Context */}
      <div className="bg-gray-50 p-4 rounded-lg border">
        <h3 className="text-sm font-medium text-gray-900 mb-2">Editing Session</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-gray-600">Student:</span>
            <span className="ml-2 font-medium text-gray-900">{getStudentName()}</span>
          </div>
          <div>
            <span className="text-gray-600">Type:</span>
            <span className="ml-2 font-medium text-gray-900">{getSessionTypeDisplay()}</span>
          </div>
        </div>
      </div>

      {/* Trainer */}
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Trainer *
        </label>
        {availableTrainers.length === 0 && initial.sessionType === 'gt' && (
          <div className="mb-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800">
              No trainers are certified for GT Assessment.
            </p>
          </div>
        )}
        <div className="relative">
          <input
            type="text"
            value={trainerId ? getTrainerDisplayName(trainerId) : trainerSearch}
            onChange={(e) => {
              setTrainerSearch(e.target.value);
              if (trainerId) {
                setTrainerId('');
              }
            }}
            onFocus={() => setShowTrainerDropdown(true)}
            onBlur={() => setTimeout(() => setShowTrainerDropdown(false), 200)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Search for a trainer..."
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
                      setTrainerId(trainer.id);
                      setTrainerSearch('');
                      setShowTrainerDropdown(false);
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
      </div>

      {/* Date */}
      <div>
        <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
          Date *
        </label>
        <div
          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white cursor-pointer"
          onClick={() => {
            const el = document.getElementById('edit-date') as HTMLInputElement | null;
            if (el) {
              // @ts-ignore - showPicker is experimental
              if (typeof el.showPicker === 'function') { el.showPicker(); } else { el.focus(); }
            }
          }}
        >
          <input
            type="date"
            id="edit-date"
            value={date}
            onChange={(e) => onChangeDate(e.target.value)}
            className="w-full bg-transparent outline-none"
          />
        </div>
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
              value={startTime}
              onChange={(e) => onChangeStart(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {generateStartTimeOptions().map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-2">
              End Time *
            </label>
            <select
              id="endTime"
              value={endTime}
              onChange={(e) => onChangeEnd(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              disabled={!startTime}
            >
              <option value="">
                {startTime ? "Select end time" : "Select start time first"}
              </option>
              {generateEndTimeOptions(startTime).map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        {startTime && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quick Duration
            </label>
            <div className="flex gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => handleQuickTimeSlot(30)}
                className="px-3 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50 transition-colors"
              >
                30 min
              </button>
              <button
                type="button"
                onClick={() => handleQuickTimeSlot(45)}
                className="px-3 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50 transition-colors"
              >
                45 min
              </button>
              <button
                type="button"
                onClick={() => handleQuickTimeSlot(60)}
                className="px-3 py-1 text-xs bg-primary-100 border border-primary-300 text-primary-700 rounded hover:bg-primary-200 transition-colors font-medium"
              >
                1 hour
              </button>
              <button
                type="button"
                onClick={() => handleQuickTimeSlot(90)}
                className="px-3 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50 transition-colors"
              >
                90 min
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Seat */}
      <div>
        <label htmlFor="assignedSeat" className="block text-sm font-medium text-gray-700 mb-2">
          Seat *
        </label>
        <select
          id="assignedSeat"
          value={assignedSeat}
          onChange={(e) => setAssignedSeat(Number(e.target.value))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          disabled={availableSeats.length === 0}
        >
          <option value={0}>
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
        {availableSeats.length === 0 && date && startTime && endTime && (
          <p className="mt-1 text-sm text-yellow-600">
            All seats for {getSessionTypeDisplay()} are occupied during this time slot.
          </p>
        )}
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={!canSave}
          className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
            canSave
              ? 'bg-primary-600 hover:bg-primary-700 text-white'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          Save Changes
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
  );
}
