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
  auto_image?: boolean
}

export interface AIGenerateResult {
  title: string
  slug: string
  description: string
  content: string
  tags: string[]
  read_time: number
  featured_image?: string
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
        toast.error(error.value)
        return null
      }
      result.value = res.data
      toast.success('Artikel berhasil di-generate')
      return res.data
    } catch (err: any) {
      const msg = err?.data?.errors?.message
      if (msg) {
        error.value = msg
      } else if (err?.status === 429 || err?.statusCode === 429) {
        error.value = 'Rate limit tercapai. Coba lagi dalam beberapa menit.'
      } else {
        error.value = 'Gagal generate artikel. Periksa koneksi dan coba lagi.'
      }
      toast.error(error.value)
      return null
    } finally {
      generating.value = false
    }
  }

  return { generating, result, error, generateArticle }
}
