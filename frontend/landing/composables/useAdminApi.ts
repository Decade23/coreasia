/**
 * Admin API composable — authenticated API client for admin panel.
 * Extends the gateway API pattern with JWT token injection.
 */

interface ApiResponse<T> {
  data: T
  meta?: { total: number; page: number; per_page: number }
  errors?: { code: string; message: string; details?: Array<{ field: string; message: string }> }
}

export const useAdminApi = () => {
  const config = useRuntimeConfig()
  // Use public URL for client-side calls (browser), internal URL for SSR
  const baseURL = import.meta.client
    ? (config.public?.gatewayPublicUrl || 'http://localhost:8084/api')
    : (config.public?.gatewayUrl || 'http://localhost:8081/api')
  const token = useCookie('auth_admin_token')

  const headers = () => {
    const h: Record<string, string> = { 'Content-Type': 'application/json' }
    if (token.value) h['Authorization'] = `Bearer ${token.value}`
    return h
  }

  const get = async <T>(path: string, params?: Record<string, any>): Promise<ApiResponse<T>> => {
    return await $fetch<ApiResponse<T>>(`${baseURL}${path}`, {
      method: 'GET',
      headers: headers(),
      params,
    })
  }

  const post = async <T>(path: string, body?: any): Promise<ApiResponse<T>> => {
    return await $fetch<ApiResponse<T>>(`${baseURL}${path}`, {
      method: 'POST',
      headers: headers(),
      body,
    })
  }

  const put = async <T>(path: string, body?: any): Promise<ApiResponse<T>> => {
    return await $fetch<ApiResponse<T>>(`${baseURL}${path}`, {
      method: 'PUT',
      headers: headers(),
      body,
    })
  }

  const del = async <T>(path: string): Promise<void> => {
    await $fetch(`${baseURL}${path}`, {
      method: 'DELETE',
      headers: headers(),
    })
  }

  const upload = async (path: string, file: File): Promise<ApiResponse<{ url: string }>> => {
    const formData = new FormData()
    formData.append('file', file)
    const h: Record<string, string> = {}
    if (token.value) h['Authorization'] = `Bearer ${token.value}`
    return await $fetch<ApiResponse<{ url: string }>>(`${baseURL}${path}`, {
      method: 'POST',
      headers: h,
      body: formData,
    })
  }

  return { get, post, put, del, upload, baseURL }
}
