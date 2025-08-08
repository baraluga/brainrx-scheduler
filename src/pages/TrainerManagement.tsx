import { useState, useMemo, useEffect } from 'react'
import { Trainer } from '../types/index'
import { listTrainers, createTrainer, updateTrainer, deleteTrainer, getTrainer } from '../services/trainers'
// Availability summary removed; trainers assumed available during business hours
import TrainerForm from '../components/trainers/TrainerForm'
import ConfirmDialog from '../components/common/ConfirmDialog'
import EmptyState from '../components/common/EmptyState'

type ViewMode = 'list' | 'add' | 'edit'

export default function TrainerManagement() {
  const [trainers, setTrainers] = useState<Trainer[]>(listTrainers())
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [editingTrainer, setEditingTrainer] = useState<Trainer | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean
    trainer: Trainer | null
  }>({ isOpen: false, trainer: null })
  const [toast, setToast] = useState<{
    message: string
    type: 'success' | 'error'
  } | null>(null)

  // Debounced search with useEffect
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
    }, 250)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Filter trainers based on search query
  const filteredTrainers = useMemo(() => {
    if (!debouncedSearchQuery.trim()) return trainers

    const query = debouncedSearchQuery.toLowerCase()
    return trainers.filter(trainer => {
      const name = (trainer.firstName || trainer.name || '').toLowerCase()
      return name.includes(query) || trainer.email.toLowerCase().includes(query)
    })
  }, [trainers, debouncedSearchQuery])

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 5000)
  }

  const refreshTrainers = () => {
    setTrainers(listTrainers())
  }

  const handleAddTrainer = () => {
    setViewMode('add')
    setEditingTrainer(null)
  }

  const handleEditTrainer = (trainer: Trainer) => {
    // Check if trainer still exists (handle concurrent deletion)
    const currentTrainer = getTrainer(trainer.id)
    if (!currentTrainer) {
      showToast('Trainer not found. It may have been deleted.', 'error')
      refreshTrainers()
      return
    }
    
    setEditingTrainer(currentTrainer)
    setViewMode('edit')
  }

  const handleDeleteClick = (trainer: Trainer) => {
    setDeleteConfirm({ isOpen: true, trainer })
  }

  const handleDeleteConfirm = () => {
    if (deleteConfirm.trainer) {
      try {
        deleteTrainer(deleteConfirm.trainer.id)
        refreshTrainers()
        showToast('Trainer deleted successfully')
        console.log('Trainer deleted:', deleteConfirm.trainer.name)
      } catch (error) {
        showToast('Failed to delete trainer', 'error')
        console.error('Delete failed:', error)
      }
    }
    setDeleteConfirm({ isOpen: false, trainer: null })
  }

  const handleFormSubmit = (data: Omit<Trainer, 'id' | 'createdAt' | 'updatedAt' | 'role'>) => {
    try {
      if (viewMode === 'add') {
        const trainerData = { ...data, role: 'trainer' as const }
        const newTrainer = createTrainer(trainerData)
        refreshTrainers()
        showToast('Trainer created successfully')
        console.log('Trainer created:', newTrainer)
      } else if (viewMode === 'edit' && editingTrainer) {
        const updatedTrainer = updateTrainer(editingTrainer.id, data)
        refreshTrainers()
        showToast('Trainer updated successfully')
        console.log('Trainer updated:', updatedTrainer)
      }
      setViewMode('list')
      setEditingTrainer(null)
    } catch (error) {
      const action = viewMode === 'add' ? 'create' : 'update'
      showToast(`Failed to ${action} trainer`, 'error')
      console.error(`${action} failed:`, error)
    }
  }

  const handleFormCancel = () => {
    setViewMode('list')
    setEditingTrainer(null)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  if (viewMode === 'add' || viewMode === 'edit') {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold leading-7 text-gray-900">
            {viewMode === 'add' ? 'Add New Trainer' : 'Edit Trainer'}
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            {viewMode === 'add' ? 'Create a new trainer profile' : 'Update the trainer information'}
          </p>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <TrainerForm
            initial={editingTrainer || undefined}
            onSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
            submitLabel={viewMode === 'add' ? 'Create Trainer' : 'Update Trainer'}
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
            Trainers
          </h2>
          <p className="mt-2 text-sm text-gray-600">Manage trainer profiles.</p>
        </div>
        <button
          onClick={handleAddTrainer}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
        >
          <svg className="-ml-1 mr-2 h-5 w-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Add Trainer
        </button>
      </div>

      {/* Search */}
      {trainers.length > 0 && (
        <div className="max-w-md">
          <label htmlFor="search" className="sr-only">Search trainers</label>
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
      )}

      {/* Trainers list */}
      {filteredTrainers.length === 0 ? (
        <div className="bg-white shadow rounded-lg">
          <EmptyState
            title={trainers.length === 0 ? "No trainers yet" : "No trainers found"}
            description={trainers.length === 0 
              ? "Get started by adding your first trainer."
              : searchQuery
              ? `No trainers match your search for "${searchQuery}".`
              : "No trainers found."
            }
            actionLabel={trainers.length === 0 ? "Add your first trainer" : undefined}
            onAction={trainers.length === 0 ? handleAddTrainer : undefined}
          />
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trainer
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">GT Assessments</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Updated</th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTrainers.map((trainer) => (
                  <tr key={trainer.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {trainer.firstName || trainer.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {trainer.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {trainer.canDoGtAssessments ? 'Yes' : 'No'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(trainer.updatedAt)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleEditTrainer(trainer)}
                        className="text-primary-600 hover:text-primary-900 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteClick(trainer)}
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
              Showing {filteredTrainers.length} of {trainers.length} trainers
              {searchQuery && ` matching "${searchQuery}"`}
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        title="Delete Trainer"
        message={`Are you sure you want to delete "${deleteConfirm.trainer?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        type="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteConfirm({ isOpen: false, trainer: null })}
      />
    </div>
  )
}