import { useState, useMemo } from 'react'
import { Program } from '../types/index'
import { listPrograms, createProgram, updateProgram, deleteProgram, getProgram } from '../services/programs'
import ProgramForm from '../components/programs/ProgramForm'
import ConfirmDialog from '../components/common/ConfirmDialog'
import EmptyState from '../components/common/EmptyState'

type ViewMode = 'list' | 'add' | 'edit'

export default function ProgramManagement() {
  const [programs, setPrograms] = useState<Program[]>(listPrograms())
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [editingProgram, setEditingProgram] = useState<Program | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean
    program: Program | null
  }>({ isOpen: false, program: null })
  const [toast, setToast] = useState<{
    message: string
    type: 'success' | 'error'
  } | null>(null)

  // Filter programs based on search query
  const filteredPrograms = useMemo(() => {
    if (!searchQuery.trim()) return programs
    const query = searchQuery.toLowerCase()
    return programs.filter(program => 
      program.name.toLowerCase().includes(query)
    )
  }, [programs, searchQuery])

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 5000)
  }

  const refreshPrograms = () => {
    setPrograms(listPrograms())
  }

  const handleAddProgram = () => {
    setViewMode('add')
    setEditingProgram(null)
  }

  const handleEditProgram = (program: Program) => {
    // Check if program still exists (handle concurrent deletion)
    const currentProgram = getProgram(program.id)
    if (!currentProgram) {
      showToast('Program not found. It may have been deleted.', 'error')
      refreshPrograms()
      return
    }
    
    setEditingProgram(currentProgram)
    setViewMode('edit')
  }

  const handleDeleteClick = (program: Program) => {
    setDeleteConfirm({ isOpen: true, program })
  }

  const handleDeleteConfirm = () => {
    if (deleteConfirm.program) {
      try {
        deleteProgram(deleteConfirm.program.id)
        refreshPrograms()
        showToast('Program deleted successfully')
        console.log('Program deleted:', deleteConfirm.program.name)
      } catch (error) {
        showToast('Failed to delete program', 'error')
        console.error('Delete failed:', error)
      }
    }
    setDeleteConfirm({ isOpen: false, program: null })
  }

  const handleFormSubmit = (data: Omit<Program, 'id' | 'createdAt' | 'updatedAt' | 'sessions'>) => {
    try {
      if (viewMode === 'add') {
        const newProgram = createProgram(data)
        refreshPrograms()
        showToast('Program created successfully')
        console.log('Program created:', newProgram)
      } else if (viewMode === 'edit' && editingProgram) {
        const updatedProgram = updateProgram(editingProgram.id, data)
        refreshPrograms()
        showToast('Program updated successfully')
        console.log('Program updated:', updatedProgram)
      }
      setViewMode('list')
      setEditingProgram(null)
    } catch (error) {
      const action = viewMode === 'add' ? 'create' : 'update'
      showToast(`Failed to ${action} program`, 'error')
      console.error(`${action} failed:`, error)
    }
  }

  const handleFormCancel = () => {
    setViewMode('list')
    setEditingProgram(null)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength).trim() + '...'
  }

  const capitalize = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1)
  }

  if (viewMode === 'add' || viewMode === 'edit') {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold leading-7 text-gray-900">
            {viewMode === 'add' ? 'Add New Program' : 'Edit Program'}
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            {viewMode === 'add' 
              ? 'Create a new brain training program'
              : 'Update the program details'
            }
          </p>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <ProgramForm
            initial={editingProgram || undefined}
            onSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
            submitLabel={viewMode === 'add' ? 'Create Program' : 'Update Program'}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Toast notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-md shadow-lg ${
          toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Programs
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Manage brain training programs and their curricula.
          </p>
        </div>
        <button
          onClick={handleAddProgram}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
        >
          <svg className="-ml-1 mr-2 h-5 w-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Add Program
        </button>
      </div>

      {/* Search */}
      {programs.length > 0 && (
        <div className="max-w-md">
          <label htmlFor="search" className="sr-only">Search programs</label>
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
              placeholder="Search programs by name..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>
      )}

      {/* Programs list */}
      {filteredPrograms.length === 0 ? (
        <div className="bg-white shadow rounded-lg">
          <EmptyState
            title={programs.length === 0 ? "No programs yet" : "No programs found"}
            description={programs.length === 0 
              ? "Get started by creating your first brain training program."
              : `No programs match "${searchQuery}". Try adjusting your search.`
            }
            actionLabel={programs.length === 0 ? "Add your first program" : undefined}
            onAction={programs.length === 0 ? handleAddProgram : undefined}
          />
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Program
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Difficulty
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duration
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Target Age
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
                {filteredPrograms.map((program) => (
                  <tr key={program.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {program.name}
                        </div>
                        {program.description && (
                          <div className="text-sm text-gray-500">
                            {truncateText(program.description, 100)}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        program.difficulty === 'beginner' 
                          ? 'bg-green-100 text-green-800'
                          : program.difficulty === 'intermediate'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {capitalize(program.difficulty)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {program.duration} min
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {program.targetAge.min}–{program.targetAge.max} years
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(program.updatedAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleEditProgram(program)}
                        className="text-primary-600 hover:text-primary-900 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteClick(program)}
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
        </div>
      )}

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        title="Delete Program"
        message={`Are you sure you want to delete "${deleteConfirm.program?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        type="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteConfirm({ isOpen: false, program: null })}
      />
    </div>
  )
}