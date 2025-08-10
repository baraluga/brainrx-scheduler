import { useState, useCallback } from 'react'
import type { ToastMessage } from '../components/common/Toast'

let toastIdCounter = 0

export function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const addToast = useCallback((
    message: string, 
    type: ToastMessage['type'] = 'success',
    duration?: number
  ) => {
    const id = `toast-${++toastIdCounter}-${Date.now()}`
    const toast: ToastMessage = {
      id,
      message,
      type,
      duration
    }

    setToasts(prev => [toast, ...prev])
    
    return id
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  const showSuccess = useCallback((message: string, duration?: number) => 
    addToast(message, 'success', duration), [addToast])
  
  const showError = useCallback((message: string, duration?: number) => 
    addToast(message, 'error', duration), [addToast])
  
  const showWarning = useCallback((message: string, duration?: number) => 
    addToast(message, 'warning', duration), [addToast])
  
  const showInfo = useCallback((message: string, duration?: number) => 
    addToast(message, 'info', duration), [addToast])

  const clearAll = useCallback(() => {
    setToasts([])
  }, [])

  return {
    toasts,
    addToast,
    removeToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    clearAll
  }
}