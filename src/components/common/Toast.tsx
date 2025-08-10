import { useEffect, useState } from 'react'

export interface ToastMessage {
  id: string
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
  duration?: number
}

interface ToastProps {
  message: ToastMessage
  onRemove: (id: string) => void
}

export function Toast({ message, onRemove }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isRemoving, setIsRemoving] = useState(false)

  useEffect(() => {
    // Trigger enter animation
    const timer = setTimeout(() => setIsVisible(true), 10)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    const duration = message.duration || 5000
    const timer = setTimeout(() => {
      setIsRemoving(true)
      setTimeout(() => onRemove(message.id), 300) // Wait for exit animation
    }, duration)
    
    return () => clearTimeout(timer)
  }, [message.id, message.duration, onRemove])

  const getToastStyles = () => {
    switch (message.type) {
      case 'success':
        return 'bg-primary-100 text-ink-700 border-primary-200'
      case 'error':
        return 'bg-red-50 text-red-700 border-red-200'
      case 'warning':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200'
      case 'info':
        return 'bg-blue-50 text-blue-700 border-blue-200'
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }

  return (
    <div
      className={`
        transform transition-all duration-300 ease-in-out
        ${isVisible && !isRemoving 
          ? 'translate-x-0 opacity-100' 
          : 'translate-x-full opacity-0'
        }
        ${getToastStyles()}
        px-4 py-3 rounded-lg shadow-lg border backdrop-blur-sm
        max-w-md mx-4 mb-3
        pointer-events-auto cursor-pointer
      `}
      onClick={() => {
        setIsRemoving(true)
        setTimeout(() => onRemove(message.id), 300)
      }}
    >
      <div className="flex items-start gap-2">
        <div className="flex-1 text-sm font-medium">
          {message.message}
        </div>
        <button 
          className="text-current opacity-70 hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.stopPropagation()
            setIsRemoving(true)
            setTimeout(() => onRemove(message.id), 300)
          }}
        >
          ✕
        </button>
      </div>
    </div>
  )
}

interface ToastContainerProps {
  toasts: ToastMessage[]
  onRemove: (id: string) => void
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 right-0 z-[9999] pointer-events-none">
      <div className="flex flex-col-reverse">
        {toasts.map((message) => (
          <Toast
            key={message.id}
            message={message}
            onRemove={onRemove}
          />
        ))}
      </div>
    </div>
  )
}