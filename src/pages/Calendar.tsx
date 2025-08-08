import { useState, useMemo, useRef, useEffect } from "react";
import { Appointment, Student, Trainer, SessionType } from "../types/index";
import { listAppointments, createAppointment } from "../services/appointments";
import { listStudents } from "../services/students";
import { listTrainers } from "../services/trainers";
import AppointmentForm from "../components/appointments/AppointmentForm";
import OnboardStudentForm from "../components/calendar/OnboardStudentForm";
import Modal from "../components/common/Modal";
import DailyGridView from "../components/calendar/DailyGridView";

function Calendar() {
  const [appointments, setAppointments] = useState<Appointment[]>(
    listAppointments()
  );
  const [students] = useState<Student[]>(listStudents());
  const [trainers] = useState<Trainer[]>(listTrainers());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isOnboardOpen, setIsOnboardOpen] = useState(false);
  const gridContainerRef = useRef<HTMLDivElement | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "daily-grid">("daily-grid");
  // Helpers to handle local date input values (YYYY-MM-DD) without UTC shifts
  const toLocalDateInputValue = (d: Date): string => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };
  const fromLocalDateInputValue = (value: string): Date => {
    const [y, m, d] = value.split("-").map(Number);
    return new Date(y, (m || 1) - 1, d || 1);
  };
  const [selectedDate, setSelectedDate] = useState<string>(toLocalDateInputValue(new Date()));

  const showToast = (
    message: string,
    type: "success" | "error" = "success"
  ) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  const refreshAppointments = () => {
    setAppointments(listAppointments());
  };

  // Group appointments by date for display
  const appointmentsByDate = useMemo(() => {
    const grouped: Record<string, Appointment[]> = {};

    appointments.forEach((appointment) => {
      const dateKey = new Date(appointment.date).toLocaleDateString();
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(appointment);
    });

    // Sort appointments within each date by start time
    Object.keys(grouped).forEach((date) => {
      grouped[date].sort((a, b) => a.startTime.localeCompare(b.startTime));
    });

    return grouped;
  }, [appointments]);

  const sortedDates = Object.keys(appointmentsByDate).sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime()
  );

  const goPrevDay = () => {
    const d = fromLocalDateInputValue(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(toLocalDateInputValue(d));
  };
  const goNextDay = () => {
    const d = fromLocalDateInputValue(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(toLocalDateInputValue(d));
  };

  // Fullscreen controls
  const enterFullscreen = async () => {
    const el: any = gridContainerRef.current
    if (!el) return
    if (el.requestFullscreen) {
      await el.requestFullscreen()
    } else if (el.webkitRequestFullscreen) {
      el.webkitRequestFullscreen()
    } else if (el.msRequestFullscreen) {
      el.msRequestFullscreen()
    }
  }
  const exitFullscreen = async () => {
    const doc: any = document
    if (document.exitFullscreen) {
      await document.exitFullscreen()
    } else if (doc.webkitExitFullscreen) {
      doc.webkitExitFullscreen()
    } else if (doc.msExitFullscreen) {
      doc.msExitFullscreen()
    }
  }
  useEffect(() => {
    const onChange = () => {
      const anyDoc: any = document
      const fsEl = document.fullscreenElement || anyDoc.webkitFullscreenElement || anyDoc.msFullscreenElement
      setIsFullscreen(fsEl === gridContainerRef.current)
    }
    document.addEventListener('fullscreenchange', onChange)
    // Safari/WebKit
    document.addEventListener('webkitfullscreenchange', onChange as any)
    return () => {
      document.removeEventListener('fullscreenchange', onChange)
      document.removeEventListener('webkitfullscreenchange', onChange as any)
    }
  }, [])

  const GRID_CONFIG = {
    businessStartMinutes: 10 * 60,
    businessEndMinutes: 19 * 60,
    incrementMinutes: 15,
    laneWidthPx: 64,
    slotsPerType: {
      'training-tabletop': 10,
      'training-digital': 10,
      'accelerate-rx': 3,
      'remote': 4,
      'gt': 4,
    } as Record<SessionType, number>,
  };

  const handleCreateAppointment = (
    data: Omit<Appointment, "id" | "createdAt" | "updatedAt" | "status">
  ) => {
    try {
      const newAppointment = createAppointment(data);
      refreshAppointments();
      setIsModalOpen(false);
      showToast("Session added successfully");
      console.log("Appointment created:", newAppointment);
    } catch (error) {
      showToast("Failed to add session", "error");
      console.error("Create appointment failed:", error);
    }
  };

  const getStudentName = (studentId: string) => {
    const s = students.find((x) => x.id === studentId)
    return s?.firstName || s?.name || "Unknown Student";
  };

  const getTrainerName = (trainerId: string) => {
    const t = trainers.find((x) => x.id === trainerId)
    return t?.firstName || t?.name || "Unknown Trainer";
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(":").map(Number);
    const period = hours >= 12 ? "PM" : "AM";
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      {/* Toast notification */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-md shadow-lg ${
            toast.type === "success"
              ? "bg-green-500 text-white"
              : "bg-red-500 text-white"
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-wrap justify-between items-start gap-4">
        <div>
          <h2 className="text-2xl font-bold leading-7 text-ink-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Calendar
          </h2>
          <p className="mt-1 text-sm text-ink-500">
            View and manage training session schedules.
          </p>
        </div>
        <div className="flex flex-col md:flex-row md:items-center gap-3 w-full md:w-auto">
          {viewMode === "daily-grid" && (
            <div className="flex flex-wrap items-center gap-2">
              <button onClick={goPrevDay} className="px-2 py-1 rounded border text-sm border-gray-300 hover:bg-gray-50">◀</button>
              <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="px-2 py-1 border text-sm border-gray-300 rounded" />
              <button onClick={() => setSelectedDate(toLocalDateInputValue(new Date()))} className="px-2 py-1 rounded border text-sm border-gray-300 hover:bg-gray-50">Today</button>
              <button onClick={goNextDay} className="px-2 py-1 rounded border text-sm border-gray-300 hover:bg-gray-50">▶</button>
              <button onClick={() => (isFullscreen ? exitFullscreen() : enterFullscreen())} className="px-2 py-1 rounded border text-sm border-gray-300 hover:bg-gray-50" title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}>
                {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
              </button>
            </div>
          )}
          <div className="flex items-center gap-2">
            <select
              aria-label="View"
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value as "list" | "daily-grid")}
              className="px-2 py-1 border text-sm border-gray-300 rounded"
            >
              <option value="list">List</option>
              <option value="daily-grid">Daily Grid</option>
            </select>
            <button onClick={() => setIsModalOpen(true)} className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors">
              <svg className="-ml-1 mr-2 h-5 w-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Add Session
            </button>
            <button onClick={() => setIsOnboardOpen(true)} className="inline-flex items-center px-3 py-2 border border-gray-200 text-sm font-medium rounded-md text-ink-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors">
              Onboard Student
            </button>
          </div>
        </div>
      </div>

      {viewMode === "list" ? (
        <div className="bg-white shadow rounded-lg">
          {appointments.length === 0 ? (
            <div className="px-4 py-12 text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m0 0V7a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V9a2 2 0 012-2h12V7z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No sessions
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by adding your first session.
              </p>
              <div className="mt-6">
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  <svg
                    className="-ml-1 mr-2 h-5 w-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Add Session
                </button>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {sortedDates
                .filter((dateKey) => {
                  // hide historical dates by default; show today and future
                  const d = new Date(dateKey);
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  return d >= today;
                })
                .map((dateKey) => (
                  <div key={dateKey} className="p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      {formatDate(dateKey)}
                    </h3>
                    <div className="space-y-3">
                      {appointmentsByDate[dateKey].map((appointment) => (
                        <div
                          key={appointment.id}
                          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <div className="text-sm font-medium text-gray-900">
                                {formatTime(appointment.startTime)} -{" "}
                                {formatTime(appointment.endTime)}
                              </div>
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                {((appointment as any).sessionType || '').replace('training-', 'training (').replace('digital', 'digital)').replace('tabletop', 'table-top)') || 'Session'}
                              </span>
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  appointment.status === "scheduled"
                                    ? "bg-green-100 text-green-800"
                                    : appointment.status === "completed"
                                    ? "bg-gray-100 text-gray-800"
                                    : appointment.status === "cancelled"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-yellow-100 text-yellow-800"
                                }`}
                              >
                                {appointment.status}
                              </span>
                            </div>
                            <div className="mt-1 text-sm text-gray-600">
                              {getStudentName(appointment.studentId)}
                            </div>
                            <div className="text-xs text-gray-500">
                              Trainer: {getTrainerName(appointment.trainerId)}
                            </div>
                            {appointment.notes && (
                              <div className="mt-1 text-xs text-gray-500">
                                Notes: {appointment.notes}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              {/* Control to show past sessions */}
              <div className="p-4 text-center">
                <details>
                  <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-900">
                    Show past sessions
                  </summary>
                  <div className="mt-4 space-y-6">
                    {sortedDates
                      .filter((dateKey) => {
                        const d = new Date(dateKey);
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        return d < today;
                      })
                      .map((dateKey) => (
                        <div key={dateKey} className="px-6">
                          <h3 className="text-sm font-medium text-gray-700 mb-2">
                            {formatDate(dateKey)}
                          </h3>
                          <div className="space-y-3">
                            {appointmentsByDate[dateKey].map((appointment) => (
                              <div
                                key={appointment.id}
                                className="flex items-center justify-between p-3 bg-gray-50 rounded"
                              >
                                <div className="text-sm text-gray-700">
                                  {formatTime(appointment.startTime)} -{" "}
                                  {formatTime(appointment.endTime)} •{" "}
                                  {getStudentName(appointment.studentId)}{" "}
                                  (Trainer:{" "}
                                  {getTrainerName(appointment.trainerId)})
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                  </div>
                </details>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div ref={gridContainerRef} className="relative">
          {isFullscreen && (
            <button
              onClick={exitFullscreen}
              className="absolute top-2 right-2 z-10 px-2 py-1 rounded bg-white border border-gray-300 shadow hover:bg-gray-50"
              title="Exit Fullscreen"
            >
              ✕
            </button>
          )}
          <DailyGridView
            date={fromLocalDateInputValue(selectedDate)}
            appointments={appointments}
            students={students}
            trainers={trainers}
            config={{ ...GRID_CONFIG, nowOffsetMinutes: 600 }}
          />
        </div>
      )}

      {/* Add Session Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Session"
        size="lg"
      >
        <AppointmentForm
          onSubmit={handleCreateAppointment}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>

      {/* Onboard Student Modal */}
      <Modal
        isOpen={isOnboardOpen}
        onClose={() => setIsOnboardOpen(false)}
        title="Onboard Student"
        size="lg"
      >
        <OnboardStudentForm
          onCreated={(count) => {
            refreshAppointments();
            setIsOnboardOpen(false);
            showToast(`${count} session${count === 1 ? '' : 's'} created`);
          }}
          onCancel={() => setIsOnboardOpen(false)}
        />
      </Modal>
    </div>
  );
}

export default Calendar;
