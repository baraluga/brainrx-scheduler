import { useEffect, useRef } from 'react'

interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
  type?: 'danger' | 'warning' | 'info'
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  type = 'danger'
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const cancelButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel()
      }
    }

    const handleClickOutside = (e: MouseEvent) => {
      if (dialogRef.current && !dialogRef.current.contains(e.target as Node)) {
        onCancel()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      document.addEventListener('mousedown', handleClickOutside)
      // Focus the cancel button when dialog opens
      setTimeout(() => cancelButtonRef.current?.focus(), 100)
      
      // Prevent body scroll
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('mousedown', handleClickOutside)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onCancel])

  if (!isOpen) return null

  const confirmButtonClass = type === 'danger' 
    ? 'bg-red-600 hover:bg-red-700 text-white'
    : type === 'warning'
    ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
    : 'bg-primary-600 hover:bg-primary-700 text-white'

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" />

        {/* Center dialog */}
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        
        <div
          ref={dialogRef}
          className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full"
          role="dialog"
          aria-modal="true"
          aria-labelledby="dialog-title"
          aria-describedby="dialog-description"
        >
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              {/* Icon */}
              <div className={`mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full ${
                type === 'danger' ? 'bg-red-100' : type === 'warning' ? 'bg-yellow-100' : 'bg-blue-100'
              } sm:mx-0 sm:h-10 sm:w-10`}>
                <svg 
                  className={`h-6 w-6 ${
                    type === 'danger' ? 'text-red-600' : type === 'warning' ? 'text-yellow-600' : 'text-blue-600'
                  }`}
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  {type === 'danger' ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  )}
                </svg>
              </div>
              
              {/* Content */}
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                <h3 id="dialog-title" className="text-lg leading-6 font-medium text-gray-900">
                  {title}
                </h3>
                <div className="mt-2">
                  <p id="dialog-description" className="text-sm text-gray-500">
                    {message}
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Action buttons */}
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              onClick={onConfirm}
              className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm transition-colors ${confirmButtonClass} ${
                type === 'danger' ? 'focus:ring-red-500' : type === 'warning' ? 'focus:ring-yellow-500' : 'focus:ring-primary-500'
              }`}
            >
              {confirmLabel}
            </button>
            <button
              ref={cancelButtonRef}
              type="button"
              onClick={onCancel}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm transition-colors"
            >
              {cancelLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}