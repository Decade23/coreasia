import { ref, onMounted, onUnmounted } from 'vue'

export const useAntiCheat = () => {
    const cheatAttempts = ref<number>(0)
    const maxCheatAttempts = 3
    const isUserCheating = ref<boolean>(false)

    // Handlers
    const handleVisibilityChange = () => {
        if (document.hidden) {
            cheatAttempts.value++
            console.warn(`[Anti-Cheat System] Tab switched! Attempt: ${cheatAttempts.value}`)

            if (cheatAttempts.value >= maxCheatAttempts) {
                triggerDisqualification()
            } else {
                alert(`PERINGATAN KECURANGAN (${cheatAttempts.value}/${maxCheatAttempts})\nAnda terdeteksi meninggalkan halaman ujian. Ujian akan dihentikan secara sepihak jika ini terus berlanjut.`)
            }
        }
    }

    const handleContextMenu = (e: MouseEvent) => {
        e.preventDefault()
    }

    const handleKeyDown = (e: KeyboardEvent) => {
        // Prevent F12 (DevTools), Ctrl+Shift+I, Ctrl+C, Ctrl+V
        if (
            e.key === 'F12' ||
            (e.ctrlKey && e.shiftKey && e.key === 'I') ||
            (e.ctrlKey && (e.key === 'c' || e.key === 'v'))
        ) {
            e.preventDefault()
        }
    }

    /**
     * Triggers a fatal UI state and informs backend
     */
    const triggerDisqualification = () => {
        isUserCheating.value = true
        alert('DISANGGAH: Anda telah didiskualifikasi karena melanggar aturan integritas ujian (Tab Switch > 3 Jatah). Ujian telah dikunci.')
        // TODO: Connect to Exam Backend API to force-submit with 0 score
        navigateTo('/assessee')
    }

    /**
     * Bind event listeners to DOM
     */
    const mountAntiCheat = () => {
        if (import.meta.client) {
            document.addEventListener('visibilitychange', handleVisibilityChange)
            document.addEventListener('contextmenu', handleContextMenu)
            document.addEventListener('keydown', handleKeyDown)
        }
    }

    /**
     * Release event listeners to prevent memory leaks globally
     */
    const unmountAntiCheat = () => {
        if (import.meta.client) {
            document.removeEventListener('visibilitychange', handleVisibilityChange)
            document.removeEventListener('contextmenu', handleContextMenu)
            document.removeEventListener('keydown', handleKeyDown)
        }
    }

    return {
        cheatAttempts,
        maxCheatAttempts,
        isUserCheating,
        mountAntiCheat,
        unmountAntiCheat
    }
}
