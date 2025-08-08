import { ReactNode } from 'react'

interface EmptyStateProps {
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
  icon?: ReactNode
}

export default function EmptyState({ 
  title, 
  description, 
  actionLabel, 
  onAction, 
  icon 
}: EmptyStateProps) {
  const defaultIcon = (
    <svg 
      className="mx-auto h-12 w-12 text-gray-400" 
      fill="none" 
      viewBox="0 0 24 24" 
      stroke="currentColor" 
      aria-hidden="true"
    >
      <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        strokeWidth={2} 
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
      />
    </svg>
  )

  return (
    <div className="text-center py-12">
      <div className="mb-4">
        {icon || defaultIcon}
      </div>
      <h3 className="mt-2 text-sm font-medium text-gray-900">
        {title}
      </h3>
      <p className="mt-1 text-sm text-gray-500">
        {description}
      </p>
      {actionLabel && onAction && (
        <div className="mt-6">
          <button
            type="button"
            onClick={onAction}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
          >
            <svg 
              className="-ml-1 mr-2 h-5 w-5" 
              fill="currentColor" 
              viewBox="0 0 20 20" 
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path 
                fillRule="evenodd" 
                d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" 
                clipRule="evenodd" 
              />
            </svg>
            {actionLabel}
          </button>
        </div>
      )}
    </div>
  )
}