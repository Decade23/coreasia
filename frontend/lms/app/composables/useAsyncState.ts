import { ref, type Ref } from 'vue'

interface AsyncState<T> {
    data: Ref<T | null>
    pending: Ref<boolean>
    error: Ref<string | null>
    execute: () => Promise<void>
    reset: () => void
}

/**
 * useAsyncState
 * Wraps an async function with loading, error, and data state management.
 * Useful for pages/components that fetch data on mount.
 */
export const useAsyncState = <T>(
    fetcher: () => Promise<T>,
    options?: { immediate?: boolean }
): AsyncState<T> => {
    const data = ref<T | null>(null) as Ref<T | null>
    const pending = ref(false)
    const error = ref<string | null>(null)

    const execute = async () => {
        pending.value = true
        error.value = null
        try {
            data.value = await fetcher()
        } catch (e: any) {
            error.value = e?.data?.message || e?.message || 'Terjadi kesalahan'
            console.error('[useAsyncState]', e)
        } finally {
            pending.value = false
        }
    }

    const reset = () => {
        data.value = null
        pending.value = false
        error.value = null
    }

    if (options?.immediate !== false) {
        execute()
    }

    return { data, pending, error, execute, reset }
}
