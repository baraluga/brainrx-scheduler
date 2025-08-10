import { FormEvent, useMemo, useState, useEffect } from "react";
import { Session, Trainer } from "../../types";
import { listTrainers } from "../../services/trainers";
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

export default function EditSessionForm({ initial, onSaved, onCancel }: Props) {
  const [trainers] = useState<Trainer[]>(listTrainers());
  const [existingSessions] = useState<Session[]>(listSessions());
  const [trainerId, setTrainerId] = useState(initial.trainerId);
  const [date, setDate] = useState(initial.date.split("T")[0]);
  const [startTime, setStartTime] = useState(initial.startTime);
  const [endTime, setEndTime] = useState(initial.endTime);
  const [assignedSeat, setAssignedSeat] = useState(initial.assignedSeat);
  const [error, setError] = useState<string | null>(null);

  const SEAT_CONFIG = {
    slotsPerType: {
      "training-tabletop": 10,
      "training-digital": 10,
      "accelerate-rx": 3,
      remote: 4,
      gt: 4,
    } as Record<string, number>,
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
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-2 rounded bg-red-50 border border-red-200 text-sm text-red-700">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-ink-700 mb-2">
          Trainer
        </label>
        <select
          value={trainerId}
          onChange={(e) => setTrainerId(e.target.value)}
          className="w-full border rounded-md px-3 py-2"
        >
          {trainers.map((t) => (
            <option key={t.id} value={t.id}>
              {t.firstName || t.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-sm font-medium text-ink-700 mb-2">
            Date
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => onChangeDate(e.target.value)}
            className="w-full border rounded-md px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink-700 mb-2">
            Start
          </label>
          <select
            value={startTime}
            onChange={(e) => onChangeStart(e.target.value)}
            className="w-full border rounded-md px-3 py-2"
          >
            {generateStartTimeOptions().map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-ink-700 mb-2">
            End
          </label>
          <select
            value={endTime}
            onChange={(e) => onChangeEnd(e.target.value)}
            className="w-full border rounded-md px-3 py-2"
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

      {/* Seat */}
      <div>
        <label className="block text-sm font-medium text-ink-700 mb-2">
          Seat *
        </label>
        <select
          value={assignedSeat}
          onChange={(e) => setAssignedSeat(Number(e.target.value))}
          className="w-full border rounded-md px-3 py-2"
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
            All seats for {initial.sessionType.replace('-', ' ')} are occupied during this time slot.
          </p>
        )}
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={!canSave}
          className={`flex-1 btn-primary ${
            canSave ? "" : "opacity-50 cursor-not-allowed"
          }`}
        >
          Save
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 btn-secondary"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
