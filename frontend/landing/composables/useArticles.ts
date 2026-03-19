/**
 * Article management composable for admin panel.
 */

export interface ArticleDomain {
  id: string
  slug: string
  title: string
  description: string
  content: string
  category: string
  tags: string[]
  author: string
  read_time: number
  status: string
  featured_image: string | null
  seo_title: string | null
  seo_description: string | null
  published_at: string | null
  created_at: string
  updated_at: string
}

export const useArticles = () => {
  const api = useAdminApi()
  const items = ref<ArticleDomain[]>([])
  const currentItem = ref<ArticleDomain | null>(null)
  const loading = ref(false)
  const saving = ref(false)
  const error = ref('')
  const totalItems = ref(0)
  const currentPage = ref(1)

  const fetchArticles = async (page = 1, params: Record<string, string> = {}) => {
    loading.value = true
    error.value = ''
    try {
      const res = await api.get<ArticleDomain[]>('/admin/articles', { page, per_page: 10, ...params })
      items.value = res.data || []
      totalItems.value = res.meta?.total || 0
      currentPage.value = page
    } catch (err: any) {
      error.value = err?.data?.errors?.message || 'Gagal memuat artikel'
    } finally {
      loading.value = false
    }
  }

  const fetchArticle = async (id: string) => {
    loading.value = true
    error.value = ''
    try {
      const res = await api.get<ArticleDomain>(`/admin/articles/${id}`)
      currentItem.value = res.data
    } catch (err: any) {
      error.value = err?.data?.errors?.message || 'Gagal memuat artikel'
    } finally {
      loading.value = false
    }
  }

  const createArticle = async (data: Record<string, any>): Promise<boolean> => {
    saving.value = true
    error.value = ''
    try {
      await api.post('/admin/articles', data)
      return true
    } catch (err: any) {
      error.value = err?.data?.errors?.message || 'Gagal membuat artikel'
      return false
    } finally {
      saving.value = false
    }
  }

  const updateArticle = async (id: string, data: Record<string, any>): Promise<boolean> => {
    saving.value = true
    error.value = ''
    try {
      await api.put(`/admin/articles/${id}`, data)
      return true
    } catch (err: any) {
      error.value = err?.data?.errors?.message || 'Gagal mengupdate artikel'
      return false
    } finally {
      saving.value = false
    }
  }

  const deleteArticle = async (id: string): Promise<boolean> => {
    saving.value = true
    error.value = ''
    try {
      await api.del(`/admin/articles/${id}`)
      return true
    } catch (err: any) {
      error.value = err?.data?.errors?.message || 'Gagal menghapus artikel'
      return false
    } finally {
      saving.value = false
    }
  }

  const publishArticle = async (id: string): Promise<boolean> => {
    saving.value = true
    try {
      await api.post(`/admin/articles/${id}/publish`)
      return true
    } catch (err: any) {
      error.value = err?.data?.errors?.message || 'Gagal mempublish artikel'
      return false
    } finally {
      saving.value = false
    }
  }

  const unpublishArticle = async (id: string): Promise<boolean> => {
    saving.value = true
    try {
      await api.post(`/admin/articles/${id}/unpublish`)
      return true
    } catch (err: any) {
      error.value = err?.data?.errors?.message || 'Gagal meng-unpublish artikel'
      return false
    } finally {
      saving.value = false
    }
  }

  const fetchStats = async () => {
    try {
      const res = await api.get<Record<string, number>>('/admin/articles/stats')
      return res.data || {}
    } catch {
      return {}
    }
  }

  return {
    items, currentItem, loading, saving, error, totalItems, currentPage,
    fetchArticles, fetchArticle, createArticle, updateArticle, deleteArticle,
    publishArticle, unpublishArticle, fetchStats,
  }
}
