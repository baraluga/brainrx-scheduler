import { useState, useMemo, useEffect } from 'react'
import { Student } from '../types/index'
import { listStudents, createStudent, updateStudent, deleteStudent, getStudent } from '../services/students'
import StudentForm from '../components/students/StudentForm'
import ConfirmDialog from '../components/common/ConfirmDialog'
import EmptyState from '../components/common/EmptyState'
import { ToastContainer } from '../components/common/Toast'
import { useToast } from '../hooks/useToast'

type ViewMode = 'list' | 'add' | 'edit'

export default function StudentManagement() {
  const [students, setStudents] = useState<Student[]>(listStudents())
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean
    student: Student | null
  }>({ isOpen: false, student: null })
  const { toasts, removeToast, showSuccess, showError } = useToast()

  // Debounced search with useEffect
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
    }, 250)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Filter students based on search query
  const filteredStudents = useMemo(() => {
    let filtered = students

    // Filter by search query (name or email)
    if (debouncedSearchQuery.trim()) {
      const query = debouncedSearchQuery.toLowerCase()
      filtered = filtered.filter(student => {
        const name = (student.firstName || student.name || '').toLowerCase()
        return name.includes(query)
      })
    }

    return filtered
  }, [students, debouncedSearchQuery])

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    if (type === 'success') {
      showSuccess(message)
    } else {
      showError(message)
    }
  }

  const refreshStudents = () => {
    setStudents(listStudents())
  }

  const calculateAge = (dateOfBirth: string): number => {
    const birth = new Date(dateOfBirth)
    const today = new Date()
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    
    return age
  }

  const handleAddStudent = () => {
    setViewMode('add')
    setEditingStudent(null)
  }

  const handleEditStudent = (student: Student) => {
    // Check if student still exists (handle concurrent deletion)
    const currentStudent = getStudent(student.id)
    if (!currentStudent) {
      showToast('Student not found. It may have been deleted.', 'error')
      refreshStudents()
      return
    }
    
    setEditingStudent(currentStudent)
    setViewMode('edit')
  }

  const handleDeleteClick = (student: Student) => {
    setDeleteConfirm({ isOpen: true, student })
  }

  const handleDeleteConfirm = () => {
    if (deleteConfirm.student) {
      try {
        deleteStudent(deleteConfirm.student.id)
        refreshStudents()
        showToast('Student deleted successfully')
        console.log('Student deleted:', deleteConfirm.student.name)
      } catch (error) {
        showToast('Failed to delete student', 'error')
        console.error('Delete failed:', error)
      }
    }
    setDeleteConfirm({ isOpen: false, student: null })
  }

  const handleFormSubmit = (data: Omit<Student, 'id' | 'createdAt' | 'updatedAt' | 'role'>) => {
    try {
      if (viewMode === 'add') {
        const newStudent = createStudent(data)
        refreshStudents()
        showToast('Student created successfully')
        console.log('Student created:', newStudent)
      } else if (viewMode === 'edit' && editingStudent) {
        const updatedStudent = updateStudent(editingStudent.id, data)
        refreshStudents()
        showToast('Student updated successfully')
        console.log('Student updated:', updatedStudent)
      }
      setViewMode('list')
      setEditingStudent(null)
    } catch (error) {
      const action = viewMode === 'add' ? 'create' : 'update'
      showToast(`Failed to ${action} student`, 'error')
      console.error(`${action} failed:`, error)
    }
  }

  const handleFormCancel = () => {
    setViewMode('list')
    setEditingStudent(null)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  if (viewMode === 'add' || viewMode === 'edit') {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold leading-7 text-gray-900">
            {viewMode === 'add' ? 'Add New Student' : 'Edit Student'}
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            {viewMode === 'add' 
              ? 'Create a new student profile'
              : 'Update the student information'
            }
          </p>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <StudentForm
            initial={editingStudent || undefined}
            onSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
            submitLabel={viewMode === 'add' ? 'Create Student' : 'Update Student'}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Toast notifications */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Students
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Manage student profiles, progress tracking, and enrollment.
          </p>
        </div>
        <button
          onClick={handleAddStudent}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
        >
          <svg className="-ml-1 mr-2 h-5 w-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Add Student
        </button>
      </div>

      {/* Search and Filter Controls */}
      {students.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 max-w-md">
            <label htmlFor="search" className="sr-only">Search students</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>
              <input
                type="text"
                id="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or email..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* Students list */}
      {filteredStudents.length === 0 ? (
        <div className="bg-white shadow rounded-lg">
          <EmptyState
            title={students.length === 0 ? "No students yet" : "No students found"}
            description={students.length === 0 
              ? "Get started by adding your first student."
              : searchQuery
              ? `No students match your current search.`
              : "No students found."
            }
            actionLabel={students.length === 0 ? "Add your first student" : undefined}
            onAction={students.length === 0 ? handleAddStudent : undefined}
          />
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Age
                  </th>
                  
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Updated
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {student.firstName || student.name}
                        </div>
                        {student.guardianName && (
                          <div className="text-sm text-gray-500">
                            Guardian: {student.guardianName}
                          </div>
                        )}
                        {student.medicalNotes && (
                          <div className="text-xs text-red-600 mt-1">
                            Medical notes available
                          </div>
                        )}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {calculateAge(student.dateOfBirth)} years
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(student.updatedAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleEditStudent(student)}
                        className="text-primary-600 hover:text-primary-900 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteClick(student)}
                        className="text-red-600 hover:text-red-900 transition-colors"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary */}
          <div className="bg-gray-50 px-6 py-3">
              <div className="text-sm text-gray-600">
                Showing {filteredStudents.length} of {students.length} students
                {searchQuery && ` matching "${searchQuery}"`}
              </div>
          </div>
        </div>
      )}

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        title="Delete Student"
        message={`Are you sure you want to delete "${deleteConfirm.student?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        type="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteConfirm({ isOpen: false, student: null })}
      />
    </div>
  )
}