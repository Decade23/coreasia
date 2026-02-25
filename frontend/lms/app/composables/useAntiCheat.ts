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
            }
            // Warning is now handled reactively by the UI component watching cheatAttempts
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

    const triggerDisqualification = () => {
        isUserCheating.value = true
        // Navigation and force-submission handled by the consuming page
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
        unmountAntiCheat,
    }
}
