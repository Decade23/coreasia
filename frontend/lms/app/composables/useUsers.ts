import { ref } from 'vue'
import type { UserDTO } from '~/adapters/UserAdapter'
import { UserAdapter, type UserDomain } from '~/adapters/UserAdapter'
import { coreApi } from '~/services/api/CoreApiService'

export interface CreateUserPayload {
    email: string
    password: string
    full_name: string
    phone_number?: string
    role: string
}

export interface UpdateUserPayload {
    email: string
    full_name: string
    phone_number?: string
    role: string
    is_active: boolean
}

interface UserListResponse {
    data: UserDTO[]
    page: number
    per_page: number
    total: number
}

export const useUsers = () => {
    const users = ref<UserDomain[]>([])
    const loading = ref(false)
    const saving = ref(false)
    const error = ref<string | null>(null)
    const totalItems = ref(0)
    const currentPage = ref(1)
    const searchQuery = ref('')

    const fetchUsers = async (page = 1, search = '') => {
        loading.value = true
        error.value = null
        searchQuery.value = search
        try {
            const response = await coreApi.get<UserListResponse>('/users', {
                page,
                per_page: 10,
                search,
            })
            users.value = UserAdapter.toDomainList(response.data)
            totalItems.value = response.total
            currentPage.value = response.page
        } catch (e: any) {
            error.value = e?.data?.message || e?.message || 'Gagal memuat daftar pengguna'
            console.error('[useUsers] fetchUsers:', e)
        } finally {
            loading.value = false
        }
    }

    const createUser = async (data: CreateUserPayload): Promise<boolean> => {
        saving.value = true
        error.value = null
        try {
            await coreApi.post('/users', data)
            await fetchUsers(currentPage.value, searchQuery.value)
            return true
        } catch (e: any) {
            error.value = e?.data?.message || e?.message || 'Gagal membuat pengguna baru'
            console.error('[useUsers] createUser:', e)
            return false
        } finally {
            saving.value = false
        }
    }

    const updateUser = async (id: string, data: UpdateUserPayload): Promise<boolean> => {
        saving.value = true
        error.value = null
        try {
            await coreApi.put(`/users/${id}`, data)
            await fetchUsers(currentPage.value, searchQuery.value)
            return true
        } catch (e: any) {
            error.value = e?.data?.message || e?.message || 'Gagal memperbarui pengguna'
            console.error('[useUsers] updateUser:', e)
            return false
        } finally {
            saving.value = false
        }
    }

    const deleteUser = async (id: string): Promise<boolean> => {
        saving.value = true
        error.value = null
        try {
            await coreApi.delete(`/users/${id}`)
            await fetchUsers(currentPage.value, searchQuery.value)
            return true
        } catch (e: any) {
            error.value = e?.data?.message || e?.message || 'Gagal menghapus pengguna'
            console.error('[useUsers] deleteUser:', e)
            return false
        } finally {
            saving.value = false
        }
    }

    return {
        users,
        loading,
        saving,
        error,
        totalItems,
        currentPage,
        searchQuery,
        fetchUsers,
        createUser,
        updateUser,
        deleteUser,
    }
}
