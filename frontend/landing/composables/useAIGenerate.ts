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
  featured_image_warning?: string
}

export const useAIGenerate = () => {
  const api = useAdminApi()
  const toast = useToast()
  const { tc } = useConsoleI18n()
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
      toast.success(tc('feedback.aiGenerated'))
      return res.data
    } catch (err: any) {
      const msg = err?.data?.errors?.message
      if (msg) {
        error.value = msg
      } else if (err?.status === 429 || err?.statusCode === 429) {
        error.value = tc('feedback.aiRateLimited')
      } else {
        error.value = tc('feedback.aiGenerateFailed')
      }
      toast.error(error.value)
      return null
    } finally {
      generating.value = false
    }
  }

  return { generating, result, error, generateArticle }
}
