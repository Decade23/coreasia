/**
 * Toast notification composable.
 * Provides success/error/info/warning toast methods accessible from anywhere.
 *
 * Opsi tambahan (console, Fase 0c putaran 2):
 *   - `kunci`: kunci i18n console, diterjemahkan saat dirender (ToastContainer),
 *     jadi pemanggil di luar setup (mis. useAdminApi) tidak butuh useConsoleI18n;
 *   - `aksi`: satu tombol yang ditekan pengguna sendiri (mis. "Muat ulang");
 *   - `id`: toast ber-id sama tidak ditumpuk selama masih tampil.
 * duration 0 = tetap tampil sampai ditutup atau aksinya ditekan.
 */

export interface AksiToast {
  kunci: string
  jalankan: () => void
}

export interface OpsiToast {
  id?: string
  kunci?: string
  aksi?: AksiToast
}

export interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info' | 'warning'
  duration: number
  kunci?: string
  aksi?: AksiToast
}

const toasts = ref<Toast[]>([])

let counter = 0

function addToast(message: string, type: Toast['type'], duration: number, opsi: OpsiToast = {}) {
  if (opsi.id && toasts.value.some(t => t.id === opsi.id)) return
  const id = opsi.id || `toast-${++counter}-${Date.now()}`
  toasts.value.push({ id, message, type, duration, kunci: opsi.kunci, aksi: opsi.aksi })

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
  const success = (message: string, duration = 4000, opsi?: OpsiToast) => addToast(message, 'success', duration, opsi)
  const error = (message: string, duration = 6000, opsi?: OpsiToast) => addToast(message, 'error', duration, opsi)
  const info = (message: string, duration = 4000, opsi?: OpsiToast) => addToast(message, 'info', duration, opsi)
  const warning = (message: string, duration = 5000, opsi?: OpsiToast) => addToast(message, 'warning', duration, opsi)
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
