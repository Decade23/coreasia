import { defineStore } from 'pinia'

export type ToastVariant = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
    id: string
    message: string
    variant: ToastVariant
    duration: number
}

export interface AppNotification {
    id: string
    title: string
    message: string
    type: 'info' | 'success' | 'warning' | 'error'
    isRead: boolean
    createdAt: Date
}

let toastCounter = 0

export const useNotificationStore = defineStore('notification', () => {
    const toasts = ref<Toast[]>([])
    const notifications = ref<AppNotification[]>([])
    const unreadCount = computed(() => notifications.value.filter(n => !n.isRead).length)

    const addToast = (message: string, variant: ToastVariant = 'info', duration = 4000) => {
        const id = `toast-${++toastCounter}`
        toasts.value.push({ id, message, variant, duration })
        setTimeout(() => removeToast(id), duration)
    }

    const removeToast = (id: string) => {
        toasts.value = toasts.value.filter(t => t.id !== id)
    }

    const success = (message: string) => addToast(message, 'success')
    const error = (message: string) => addToast(message, 'error', 6000)
    const warning = (message: string) => addToast(message, 'warning')
    const info = (message: string) => addToast(message, 'info')

    const markAsRead = (id: string) => {
        const n = notifications.value.find(n => n.id === id)
        if (n) n.isRead = true
    }

    const markAllAsRead = () => {
        notifications.value.forEach(n => { n.isRead = true })
    }

    return {
        toasts,
        notifications,
        unreadCount,
        addToast,
        removeToast,
        success,
        error,
        warning,
        info,
        markAsRead,
        markAllAsRead,
    }
})
