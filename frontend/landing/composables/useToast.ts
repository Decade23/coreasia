/**
 * Toast notification composable.
 * Provides success/error/info/warning toast methods accessible from anywhere.
 */

export interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info' | 'warning'
  duration: number
}

const toasts = ref<Toast[]>([])

let counter = 0

function addToast(message: string, type: Toast['type'], duration: number) {
  const id = `toast-${++counter}-${Date.now()}`
  toasts.value.push({ id, message, type, duration })

  if (duration > 0) {
    setTimeout(() => {
      removeToast(id)
    }, duration)
  }
}

function removeToast(id: string) {
  toasts.value = toasts.value.filter(t => t.id !== id)
}

export function useToast() {
  const success = (message: string, duration = 4000) => addToast(message, 'success', duration)
  const error = (message: string, duration = 6000) => addToast(message, 'error', duration)
  const info = (message: string, duration = 4000) => addToast(message, 'info', duration)
  const warning = (message: string, duration = 5000) => addToast(message, 'warning', duration)
  const dismissAll = () => { toasts.value = [] }

  return {
    toasts: readonly(toasts),
    success,
    error,
    info,
    warning,
    dismissAll,
    removeToast,
  }
}
