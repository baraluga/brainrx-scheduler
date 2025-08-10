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
  onCancelled?: () => void;
};

const BUSINESS_START_MINUTES = 10 * 60;
const BUSINESS_END_MINUTES = 19 * 60;
const INCREMENT = 15;

const minutesToHHMM = (mins: number): string => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

const HHMMToMinutes = (time: string): number => {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};

const calculateNewEndTime = (newStartTime: string, originalDuration: number): string => {
  const startMins = HHMMToMinutes(newStartTime);
  const newEndMins = startMins + originalDuration;
  
  // Check if the calculated end time goes past business hours
  if (newEndMins > BUSINESS_END_MINUTES) {
    // Cap at the last available increment within business hours
    const lastAvailableEnd = Math.floor(BUSINESS_END_MINUTES / INCREMENT) * INCREMENT;
    return minutesToHHMM(lastAvailableEnd);
  }
  
  return minutesToHHMM(newEndMins);
};

const calculateNewStartTime = (newEndTime: string, originalDuration: number): string => {
  const endMins = HHMMToMinutes(newEndTime);
  const newStartMins = endMins - originalDuration;
  
  // Check if the calculated start time goes before business hours
  if (newStartMins < BUSINESS_START_MINUTES) {
    // Cap at the first available increment within business hours
    const firstAvailableStart = Math.ceil(BUSINESS_START_MINUTES / INCREMENT) * INCREMENT;
    return minutesToHHMM(firstAvailableStart);
  }
  
  return minutesToHHMM(newStartMins);
};

const toLocalDateInputValue = (d: Date): string => {
  const tzOffset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tzOffset).toISOString().slice(0, 10);
};

const isTodayDateString = (dateStr: string): boolean => {
  return dateStr === toLocalDateInputValue(new Date());
};

const generateStartTimeOptions = (dateStr?: string): string[] => {
  const latestStart = BUSINESS_END_MINUTES - 30;
  const options: string[] = [];
  let startFrom = BUSINESS_START_MINUTES;
  if (dateStr && isTodayDateString(dateStr)) {
    const now = new Date();
    const nowMins = now.getHours() * 60 + now.getMinutes();
    // do not allow selecting past times → ceil to next 15-min increment
    const minToday = Math.ceil(nowMins / INCREMENT) * INCREMENT;
    startFrom = Math.max(BUSINESS_START_MINUTES, minToday);
  }
  for (let t = startFrom; t <= latestStart; t += INCREMENT) {
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
    const duration = t - startMins;
    const displayText = `${minutesToHHMM(t)} (${duration} minutes)`;
    options.push(displayText);
  }
  return options;
};

// Note: end-time options should not be limited by the original duration.
// We always offer the full range (30–120 mins after start), and simply
// preselect a value that preserves duration when start time changes.


export default function EditSessionForm({ initial, onSaved, onCancel, onCancelled }: Props) {
  const [trainers] = useState<Trainer[]>(listTrainers());
  const [students] = useState(listStudents());
  const [existingSessions] = useState<Session[]>(listSessions());
  const [trainerId, setTrainerId] = useState(initial.trainerId);
  const [date, setDate] = useState(initial.date.split("T")[0]);
  const [startTime, setStartTime] = useState(initial.startTime);
  const [endTime, setEndTime] = useState(initial.endTime);
  const [assignedSeat, setAssignedSeat] = useState(initial.assignedSeat);
  const [sessionType, setSessionType] = useState(initial.sessionType);
  const [error, setError] = useState<string | null>(null);
  const [trainerSearch, setTrainerSearch] = useState("");
  const [showTrainerDropdown, setShowTrainerDropdown] = useState(false);
  const [seatWarning, setSeatWarning] = useState<string | null>(null);
  

  const SEAT_CONFIG = {
    slotsPerType: {
      "training-tabletop": 10,
      "training-digital": 10,
      "accelerate-rx": 3,
      remote: 4,
      gt: 4,
    } as Record<string, number>,
  };

  // Determine if this session is in the past based on its original scheduled end
  const isEditingLocked = useMemo(() => {
    try {
      const baseDate = new Date(initial.date);
      const [eh, em] = initial.endTime.split(":").map(Number);
      const end = new Date(baseDate);
      end.setHours(eh, em, 0, 0);
      return end.getTime() < Date.now() || initial.status === 'cancelled';
    } catch {
      return initial.status === 'cancelled';
    }
  }, [initial.date, initial.endTime, initial.status]);

  // Check if this is a training session that can be converted
  const isTrainingSession =
    sessionType === "training-tabletop" || sessionType === "training-digital";
  const canSwitchTrainingType = isTrainingSession;

  // Get available trainers based on session type
  const availableTrainers =
    sessionType === "gt"
      ? trainers.filter((trainer) => trainer.canDoGtAssessments)
      : trainers;

  // Filter trainers based on search
  const filteredTrainers = availableTrainers.filter((trainer) => {
    const name = (trainer.firstName || trainer.name || "").toLowerCase();
    return name.includes(trainerSearch.toLowerCase());
  });

  const getTrainerDisplayName = (trainerId: string) => {
    const trainer = trainers.find((t) => t.id === trainerId);
    return trainer?.firstName || trainer?.name || "Select a trainer";
  };

  const getStudentName = () => {
    if (initial.studentId) {
      const student = students.find((s) => s.id === initial.studentId);
      return student?.firstName || student?.name || "Unknown Student";
    }
    if (initial.clientName) {
      return initial.clientName;
    }
    return "Unknown Client";
  };

  const getSessionTypeDisplay = (type = sessionType) => {
    return type
      .replace("training-tabletop", "Training (Table-top)")
      .replace("training-digital", "Training (Digital)")
      .replace("accelerate-rx", "AccelerateRx")
      .replace("remote", "Remote")
      .replace("gt", "GT");
  };

  const handleTrainingTypeSwitch = () => {
    const newType =
      sessionType === "training-tabletop"
        ? "training-digital"
        : "training-tabletop";
    setSessionType(newType);
    setSeatWarning(null);

    // Check seat availability for the new type
    if (date && startTime && endTime) {
      const newTypeSeats = getAvailableSeats(
        newType,
        new Date(date).toISOString(),
        startTime,
        endTime,
        existingSessions,
        SEAT_CONFIG,
        initial.id
      );

      if (newTypeSeats.length === 0) {
        setSeatWarning(
          `No seats available for ${getSessionTypeDisplay(
            newType
          )} at this time. Please adjust the time slot.`
        );
        setAssignedSeat(0);
      } else {
        // Auto-assign first available seat
        setAssignedSeat(newTypeSeats[0]);
        if (newTypeSeats.length < 3) {
          // Show warning if limited availability
          setSeatWarning(
            `Limited availability: Only ${newTypeSeats.length} seat${
              newTypeSeats.length === 1 ? "" : "s"
            } available for ${getSessionTypeDisplay(newType)}.`
          );
        }
      }
    }
  };

  // Get available seats for the current time slot
  const availableSeats = useMemo(() => {
    if (!date || !startTime || !endTime) return [];
    return getAvailableSeats(
      sessionType,
      new Date(date).toISOString(),
      startTime,
      endTime,
      existingSessions,
      SEAT_CONFIG,
      initial.id // Exclude current session from conflict check
    );
  }, [date, startTime, endTime, existingSessions, sessionType, initial.id]);

  const canSave = useMemo(() => {
    if (!trainerId || !date || !startTime || !endTime || !assignedSeat)
      return false;
    const v = validateTimeSlot(startTime, endTime);
    return v.ok && availableSeats.length > 0;
  }, [trainerId, date, startTime, endTime, assignedSeat, availableSeats]);

  const onChangeStart = (val: string) => {
    if (isEditingLocked) return;
    const oldStartTime = startTime;
    const oldEndTime = endTime;
    
    setStartTime(val);
    
    // If we have both start and end times, preserve the duration
    if (oldStartTime && oldEndTime) {
      const duration = HHMMToMinutes(oldEndTime) - HHMMToMinutes(oldStartTime);
      const newEndTime = calculateNewEndTime(val, duration);
      
      // Check if the new end time is valid against full end-time options
      const allowedEndTimes = generateEndTimeOptions(val);
      const isValidNewEndTime = allowedEndTimes.some(option => 
        option.startsWith(newEndTime)
      );
      
      if (isValidNewEndTime) {
        setEndTime(newEndTime);
      } else {
        // If the calculated end time isn't valid, reset it
        setEndTime("");
        setAssignedSeat(0);
      }
    } else {
      // If no end time was set, reset it
      setEndTime("");
      setAssignedSeat(0);
    }
  };

  const onChangeEnd = (val: string) => {
    if (isEditingLocked) return;
    const oldStartTime = startTime;
    const oldEndTime = endTime;
    
    setEndTime(val);
    
    // If we have both start and end times, preserve the duration
    if (oldStartTime && oldEndTime) {
      const duration = HHMMToMinutes(oldEndTime) - HHMMToMinutes(oldStartTime);
      const newStartTime = calculateNewStartTime(val, duration);
      
      // Check if the new start time is valid
      const allowedStartTimes = generateStartTimeOptions();
      const isValidNewStartTime = allowedStartTimes.includes(newStartTime);
      
      if (isValidNewStartTime) {
        setStartTime(newStartTime);
      }
    }
    
    setAssignedSeat(0); // Reset seat when time changes
  };



  const onChangeDate = (val: string) => {
    if (isEditingLocked) return;
    setDate(val);
    setAssignedSeat(0); // Reset seat when date changes
  };

  // Auto-select seat when it becomes invalid or when starting with no seat
  useEffect(() => {
    if (availableSeats.length > 0) {
      if (!assignedSeat || !availableSeats.includes(assignedSeat)) {
        setAssignedSeat(
          availableSeats.includes(initial.assignedSeat)
            ? initial.assignedSeat
            : availableSeats[0]
        );
      }
    }
  }, [availableSeats, assignedSeat, initial.assignedSeat]);

  // no-op

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (isEditingLocked) {
      setError('This session can no longer be edited.');
      return;
    }
    // Prevent selecting past time when editing today
    if (date && isTodayDateString(date)) {
      const [sh, sm] = startTime.split(":").map(Number);
      const selMins = sh * 60 + sm;
      const now = new Date();
      const nowMins = now.getHours() * 60 + now.getMinutes();
      const minToday = Math.ceil(nowMins / INCREMENT) * INCREMENT;
      if (selMins < minToday) {
        setError('Start time cannot be in the past.');
        return;
      }
    }
    const v = validateTimeSlot(startTime, endTime);
    if (!v.ok) {
      setError(v.message);
      return;
    }
    try {
      const updated = updateSession(initial.id, {
        trainerId,
        assignedSeat,
        sessionType,
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

  const handleCancelSession = () => {
    try {
      const updated = updateSession(initial.id, { status: 'cancelled' });
      // Prefer dedicated callback for caller to show the appropriate toast
      if (onCancelled) {
        onCancelled();
      } else {
        onSaved(updated);
      }
    } catch (err) {
      setError('Failed to cancel session. Please try again.');
      // eslint-disable-next-line no-console
      console.error('Cancel session failed', err);
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-gray-600">Student:</span>
            <span className="ml-2 font-medium text-gray-900">
              {getStudentName()}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Type:</span>
            <span className="ml-2 font-medium text-gray-900">
              {getSessionTypeDisplay()}
            </span>
          </div>
        </div>
        {isEditingLocked && (
          <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
            {initial.status === 'cancelled' ? 'This session has been cancelled and cannot be edited.' : 'This session is in the past and cannot be edited.'}
          </div>
        )}
      </div>

      {/* Switch Training Type */}
      {canSwitchTrainingType && (
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-blue-900">
                Switch Training Type
              </h4>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`text-sm font-medium ${
                  sessionType === "training-tabletop"
                    ? "text-blue-600"
                    : "text-gray-500"
                }`}
              >
                Table-top
              </span>
              <button
                type="button"
                onClick={handleTrainingTypeSwitch}
                className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-blue-600 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                title={`Switch to ${
                  sessionType === "training-tabletop" ? "Digital" : "Table-top"
                }`}
                disabled={isEditingLocked}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    sessionType === "training-digital"
                      ? "translate-x-5"
                      : "translate-x-0"
                  }`}
                />
              </button>
              <span
                className={`text-sm font-medium ${
                  sessionType === "training-digital"
                    ? "text-blue-600"
                    : "text-gray-500"
                }`}
              >
                Digital
              </span>
            </div>
          </div>
          {seatWarning && (
            <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
              <div className="flex items-start gap-2">
                <svg
                  className="w-4 h-4 mt-0.5 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                {seatWarning}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Trainer */}
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Trainer *
        </label>
        {availableTrainers.length === 0 && initial.sessionType === "gt" && (
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
                setTrainerId("");
              }
            }}
            onFocus={() => setShowTrainerDropdown(true)}
            onBlur={() => setTimeout(() => setShowTrainerDropdown(false), 200)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Search for a trainer..."
            disabled={availableTrainers.length === 0 || isEditingLocked}
          />
          {showTrainerDropdown && availableTrainers.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
              {filteredTrainers.length === 0 ? (
                <div className="px-3 py-2 text-sm text-gray-500">
                  No trainers found
                </div>
              ) : (
                filteredTrainers.map((trainer) => (
                  <button
                    key={trainer.id}
                    type="button"
                    onClick={() => {
                      setTrainerId(trainer.id);
                      setTrainerSearch("");
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
        <label
          htmlFor="date"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Date *
        </label>
        <div
          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white cursor-pointer"
          onClick={() => {
            if (isEditingLocked) return;
            const el = document.getElementById(
              "edit-date"
            ) as HTMLInputElement | null;
            if (el) {
              // @ts-ignore - showPicker is experimental
              if (typeof el.showPicker === "function") {
                el.showPicker();
              } else {
                el.focus();
              }
            }
          }}
        >
            <input
            type="date"
            id="edit-date"
            value={date}
            onChange={(e) => onChangeDate(e.target.value)}
            className="w-full bg-transparent outline-none"
              min={toLocalDateInputValue(new Date())}
            disabled={isEditingLocked}
          />
        </div>
      </div>

      {/* Time Slot with Quick Presets */}
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="startTime"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Start Time *
            </label>
            <select
              id="startTime"
              value={startTime}
              onChange={(e) => onChangeStart(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              disabled={isEditingLocked}
            >
              {generateStartTimeOptions(date).map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="endTime"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              End Time *
            </label>
            <select
              id="endTime"
              value={endTime}
              onChange={(e) => onChangeEnd(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              disabled={isEditingLocked || !startTime}
            >
              <option value="">
                {startTime ? "Select end time" : "Select start time first"}
              </option>
              {generateEndTimeOptions(startTime).map((t) => (
                <option key={t} value={t.split(' (')[0]}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>


      </div>

      {/* Seat */}
      <div>
        <label
          htmlFor="assignedSeat"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Seat *
        </label>
        <select
          id="assignedSeat"
          value={assignedSeat}
          onChange={(e) => setAssignedSeat(Number(e.target.value))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          disabled={availableSeats.length === 0 || isEditingLocked}
        >
          <option value={0}>
            {availableSeats.length === 0
              ? "No seats available for selected time"
              : "Select a seat"}
          </option>
          {availableSeats.map((seat) => (
            <option key={seat} value={seat}>
              {seat}
            </option>
          ))}
        </select>
        {availableSeats.length === 0 && date && startTime && endTime && (
          <p className="mt-1 text-sm text-red-600">
            All seats for {getSessionTypeDisplay()} are occupied during this
            time slot.
            {canSwitchTrainingType && (
              <span className="text-blue-600">
                Try switching the training type above.
              </span>
            )}
          </p>
        )}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-4">
        <button
          type="button"
          onClick={handleCancelSession}
          disabled={initial.status === 'cancelled' || isEditingLocked}
          className={`sm:flex-1 py-2 px-4 rounded-md font-medium border transition-colors ${
            initial.status === 'cancelled' || isEditingLocked
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
              : 'bg-red-600 hover:bg-red-700 text-white'
          }`}
        >
          Cancel Session
        </button>
        <button
          type="submit"
          disabled={isEditingLocked || !canSave}
          className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
            !isEditingLocked && canSave
              ? "bg-primary-600 hover:bg-primary-700 text-white"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          Save Changes
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
        >
          Close
        </button>
      </div>
    </form>
  );
}
