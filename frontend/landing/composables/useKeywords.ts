/**
 * Keyword pool management composable.
 */

export interface KeywordDomain {
  id: string
  keyword: string
  category: string
  search_volume: number | null
  difficulty: number | null
  priority: number
  status: 'active' | 'used' | 'paused'
  source: 'manual' | 'ai_suggested'
  usage_count: number
  last_used_at: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface KeywordStats {
  total: number
  active: number
  used: number
  paused: number
  by_category: Record<string, number>
}

export interface KeywordSuggestion {
  keyword: string
  category: string
  search_volume_estimate: number
  difficulty_estimate: number
  rationale: string
}

interface KeywordListResponse {
  data: KeywordDomain[]
  meta: { total: number; page: number; per_page: number }
}

export const useKeywords = () => {
  const api = useAdminApi()
  const toast = useToast()
  const { tc } = useConsoleI18n()
  const items = ref<KeywordDomain[]>([])
  const total = ref(0)
  const loading = ref(false)
  const saving = ref(false)
  const error = ref('')
  const stats = ref<KeywordStats | null>(null)

  const fetchKeywords = async (params?: Record<string, any>) => {
    loading.value = true
    error.value = ''
    try {
      const query = new URLSearchParams()
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          if (v !== undefined && v !== null && v !== '') query.set(k, String(v))
        })
      }
      const qs = query.toString()
      const res = await api.get<KeywordDomain[]>(`/admin/keywords${qs ? `?${qs}` : ''}`) as unknown as KeywordListResponse
      items.value = res.data || []
      total.value = res.meta?.total || 0
    } catch (err: any) {
      error.value = err?.data?.errors?.message || tc('feedback.keywordsLoadFailed')
    } finally {
      loading.value = false
    }
  }

  const fetchStats = async () => {
    try {
      const res = await api.get<KeywordStats>('/admin/keywords/stats')
      stats.value = res.data || null
    } catch {
      // silently fail for stats
    }
  }

  const createKeyword = async (data: Record<string, any>): Promise<boolean> => {
    saving.value = true
    error.value = ''
    try {
      await api.post('/admin/keywords', data)
      toast.success(tc('feedback.keywordCreated'))
      return true
    } catch (err: any) {
      error.value = err?.data?.errors?.message || tc('feedback.keywordCreateFailed')
      toast.error(error.value)
      return false
    } finally {
      saving.value = false
    }
  }

  const createBatch = async (keywords: Record<string, any>[], source: string = 'ai_suggested'): Promise<boolean> => {
    saving.value = true
    error.value = ''
    try {
      await api.post('/admin/keywords/batch', { keywords, source })
      toast.success(tc('feedback.keywordBatchCreated'))
      return true
    } catch (err: any) {
      error.value = err?.data?.errors?.message || tc('feedback.keywordCreateFailed')
      toast.error(error.value)
      return false
    } finally {
      saving.value = false
    }
  }

  const updateKeyword = async (id: string, data: Record<string, any>): Promise<boolean> => {
    saving.value = true
    error.value = ''
    try {
      await api.put(`/admin/keywords/${id}`, data)
      toast.success(tc('feedback.keywordUpdated'))
      return true
    } catch (err: any) {
      error.value = err?.data?.errors?.message || tc('feedback.keywordUpdateFailed')
      toast.error(error.value)
      return false
    } finally {
      saving.value = false
    }
  }

  const deleteKeyword = async (id: string): Promise<boolean> => {
    saving.value = true
    error.value = ''
    try {
      await api.del(`/admin/keywords/${id}`)
      toast.success(tc('feedback.keywordDeleted'))
      return true
    } catch (err: any) {
      error.value = err?.data?.errors?.message || tc('feedback.keywordDeleteFailed')
      toast.error(error.value)
      return false
    } finally {
      saving.value = false
    }
  }

  const suggestKeywords = async (params: { niche: string; category: string; count: number }): Promise<KeywordSuggestion[]> => {
    saving.value = true
    error.value = ''
    try {
      const res = await api.post<{ suggestions: KeywordSuggestion[] }>('/admin/keywords/ai-suggest', params)
      return res.data?.suggestions || []
    } catch (err: any) {
      error.value = err?.data?.errors?.message || tc('feedback.keywordSuggestFailed')
      toast.error(error.value)
      return []
    } finally {
      saving.value = false
    }
  }

  return { items, total, loading, saving, error, stats, fetchKeywords, fetchStats, createKeyword, createBatch, updateKeyword, deleteKeyword, suggestKeywords }
}
