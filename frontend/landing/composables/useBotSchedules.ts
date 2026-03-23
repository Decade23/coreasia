/**
 * Bot schedule management composable.
 */

interface BotSchedule {
  id: string
  name: string
  bot_type: string
  schedule: string
  timezone: string
  is_active: boolean
  last_run_at: string | null
  last_status: string
  last_error: string | null
  run_count: number
  config: Record<string, any>
  created_at: string
  updated_at: string
}

export const useBotSchedules = () => {
  const api = useAdminApi()
  const toast = useToast()
  const { tc } = useConsoleI18n()
  const items = ref<BotSchedule[]>([])
  const loading = ref(false)
  const saving = ref(false)
  const error = ref('')

  const fetchBots = async () => {
    loading.value = true
    error.value = ''
    try {
      const res = await api.get<BotSchedule[]>('/admin/bots')
      items.value = res.data || []
    } catch (err: any) {
      error.value = err?.data?.errors?.message || tc('feedback.botsLoadFailed')
    } finally {
      loading.value = false
    }
  }

  const createBot = async (data: Record<string, any>): Promise<boolean> => {
    saving.value = true
    error.value = ''
    try {
      await api.post('/admin/bots', data)
      toast.success(tc('feedback.botCreated'))
      return true
    } catch (err: any) {
      error.value = err?.data?.errors?.message || tc('feedback.botCreateFailed')
      toast.error(error.value)
      return false
    } finally {
      saving.value = false
    }
  }

  const updateBot = async (id: string, data: Record<string, any>): Promise<boolean> => {
    saving.value = true
    error.value = ''
    try {
      await api.put(`/admin/bots/${id}`, data)
      toast.success(tc('feedback.botUpdated'))
      return true
    } catch (err: any) {
      error.value = err?.data?.errors?.message || tc('feedback.botUpdateFailed')
      toast.error(error.value)
      return false
    } finally {
      saving.value = false
    }
  }

  const deleteBot = async (id: string): Promise<boolean> => {
    saving.value = true
    error.value = ''
    try {
      await api.del(`/admin/bots/${id}`)
      toast.success(tc('feedback.botDeleted'))
      return true
    } catch (err: any) {
      error.value = err?.data?.errors?.message || tc('feedback.botDeleteFailed')
      toast.error(error.value)
      return false
    } finally {
      saving.value = false
    }
  }

  const triggerBot = async (id: string): Promise<boolean> => {
    try {
      await api.post(`/admin/bots/${id}/trigger`)
      toast.info(tc('feedback.botTriggerQueued'))
      return true
    } catch {
      toast.error(tc('feedback.botTriggerFailed'))
      return false
    }
  }

  return { items, loading, saving, error, fetchBots, createBot, updateBot, deleteBot, triggerBot }
}
