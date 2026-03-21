/**
 * AI article generation composable.
 */

export interface AIGenerateParams {
  topic: string
  keywords: string[]
  tone: string
  language: string
  word_count: number
  category: string
}

export interface AIGenerateResult {
  title: string
  slug: string
  description: string
  content: string
  tags: string[]
  read_time: number
}

export const useAIGenerate = () => {
  const api = useAdminApi()
  const toast = useToast()
  const generating = ref(false)
  const result = ref<AIGenerateResult | null>(null)
  const error = ref('')

  const generateArticle = async (params: AIGenerateParams): Promise<AIGenerateResult | null> => {
    generating.value = true
    error.value = ''
    result.value = null
    try {
      const res = await api.post<AIGenerateResult>('/admin/ai/generate', params)
      if (res.errors) {
        error.value = res.errors.message
        return null
      }
      result.value = res.data
      toast.success('Artikel berhasil di-generate')
      return res.data
    } catch (err: any) {
      error.value = err?.data?.errors?.message || 'Gagal generate artikel. Coba lagi nanti.'
      toast.error(error.value)
      return null
    } finally {
      generating.value = false
    }
  }

  return { generating, result, error, generateArticle }
}
