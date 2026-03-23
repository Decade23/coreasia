<script setup lang="ts">
definePageMeta({ layout: 'console', middleware: 'console' })

const { items, loading, saving, error, fetchBots, createBot, updateBot, deleteBot, triggerBot } = useBotSchedules()
const toast = useToast()
const { tc, dateLocale } = useConsoleI18n()

const showFormModal = ref(false)
const showDeleteConfirm = ref(false)
const editingBot = ref<any>(null)
const deletingBot = ref<any>(null)
const triggerSuccess = ref<string | null>(null)
const triggeringBot = ref<string | null>(null)

const useDefaultAI = ref(true)
const initializingForm = ref(false)

const formData = ref({
  name: '',
  bot_type: 'article_generator',
  schedule: '08:00',
  timezone: 'Asia/Jakarta',
  provider: 'claude',
  model: '',
  tone: 'professional',
  language: 'id',
  word_count: 1200,
  auto_image: false,
})

const botTypeOptions = computed(() => [
  { label: 'Article Generator', value: 'article_generator' },
])

const timezoneOptions = [
  { label: 'WIB (Asia/Jakarta)', value: 'Asia/Jakarta' },
  { label: 'WITA (Asia/Makassar)', value: 'Asia/Makassar' },
  { label: 'WIT (Asia/Jayapura)', value: 'Asia/Jayapura' },
  { label: 'UTC', value: 'UTC' },
]

const api = useAdminApi()

const providerOptions = computed(() => [
  { label: tc('providers.claude'), value: 'claude' },
  { label: tc('providers.openai'), value: 'openai' },
  { label: tc('providers.groq'), value: 'groq' },
  { label: tc('providers.gemini'), value: 'gemini' },
])

// Dynamic model list fetched from provider API
const modelOptions = ref<{ label: string; value: string }[]>([])
const modelsLoading = ref(false)
const modelsError = ref('')

const fetchModels = async (provider: string) => {
  modelsLoading.value = true
  modelsError.value = ''
  try {
    const res = await api.get<{ id: string; name: string }[]>(`/admin/ai/models/${provider}`)
    if (res.data?.length) {
      modelOptions.value = res.data.map(m => ({ label: m.name, value: m.id }))
    } else {
      modelOptions.value = []
      modelsError.value = tc('apiKeys.modelsError')
    }
  } catch {
    modelOptions.value = []
    modelsError.value = tc('apiKeys.modelsError')
  } finally {
    modelsLoading.value = false
  }
}

const toneOptions = computed(() => [
  { label: tc('tones.professional'), value: 'professional' },
  { label: tc('tones.casual'), value: 'casual' },
  { label: tc('tones.informative'), value: 'informative' },
])

const languageOptions = computed(() => [
  { label: tc('languages.id'), value: 'id' },
  { label: tc('languages.en'), value: 'en' },
])

watch(() => formData.value.provider, (provider) => {
  if (initializingForm.value) return
  formData.value.model = ''
  fetchModels(provider)
})

onMounted(() => fetchBots())

const openCreate = () => {
  editingBot.value = null
  useDefaultAI.value = true
  formData.value = {
    name: '', bot_type: 'article_generator', schedule: '08:00', timezone: 'Asia/Jakarta',
    provider: 'claude', model: '',
    tone: 'professional', language: 'id', word_count: 1200, auto_image: false,
  }
  showFormModal.value = true
}

const openEdit = async (b: any) => {
  editingBot.value = b
  const cfg = typeof b.config === 'string' ? JSON.parse(b.config) : (b.config || {})
  const hasOverride = !!(cfg.provider || cfg.model)
  useDefaultAI.value = !hasOverride

  initializingForm.value = true
  const provider = cfg.provider || 'claude'
  formData.value = {
    name: b.name,
    bot_type: b.bot_type,
    schedule: b.schedule,
    timezone: b.timezone,
    provider,
    model: cfg.model || '',
    tone: cfg.tone || 'professional',
    language: cfg.language || 'id',
    word_count: cfg.word_count || 1200,
    auto_image: cfg.auto_image || false,
  }

  if (hasOverride) {
    await fetchModels(provider)
  }

  await nextTick()
  initializingForm.value = false
  showFormModal.value = true
}

const handleToggleDefaultAI = (val: boolean) => {
  useDefaultAI.value = val
  if (!val) {
    fetchModels(formData.value.provider)
  }
}

const handleSubmit = async () => {
  const configParsed: Record<string, any> = {
    tone: formData.value.tone,
    language: formData.value.language,
    word_count: formData.value.word_count,
    auto_image: formData.value.auto_image,
  }

  if (!useDefaultAI.value) {
    configParsed.provider = formData.value.provider
    configParsed.model = formData.value.model
  }

  let ok: boolean
  if (editingBot.value) {
    ok = await updateBot(editingBot.value.id, {
      name: formData.value.name,
      schedule: formData.value.schedule,
      timezone: formData.value.timezone,
      config: configParsed,
    })
  } else {
    ok = await createBot({
      name: formData.value.name,
      bot_type: formData.value.bot_type,
      schedule: formData.value.schedule,
      timezone: formData.value.timezone,
      config: configParsed,
    })
  }
  if (ok) {
    showFormModal.value = false
    fetchBots()
  }
}

const handleToggle = async (b: any) => {
  const ok = await updateBot(b.id, { is_active: !b.is_active })
  if (ok) fetchBots()
}

const handleTrigger = async (b: any) => {
  if (triggeringBot.value) return
  triggeringBot.value = b.id
  const ok = await triggerBot(b.id)
  if (ok) {
    // Poll until status changes from "running"
    const poll = async (retries = 0) => {
      if (retries >= 20) {
        triggeringBot.value = null
        return
      }
      await fetchBots()
      const bot = items.value.find(x => x.id === b.id)
      if (bot && bot.last_status !== 'running') {
        triggeringBot.value = null
        if (bot.last_status === 'error') {
          toast.error(bot.last_error || tc('feedback.botRunFailed'))
        } else if (bot.last_status === 'success') {
          toast.success(tc('bots.triggered'))
          triggerSuccess.value = b.id
          setTimeout(() => { triggerSuccess.value = null }, 3000)
        }
      } else {
        setTimeout(() => poll(retries + 1), 3000)
      }
    }
    setTimeout(() => poll(), 3000)
  } else {
    triggeringBot.value = null
  }
}

const handleDelete = (b: any) => {
  deletingBot.value = b
  showDeleteConfirm.value = true
}

const confirmDelete = async () => {
  const ok = await deleteBot(deletingBot.value.id)
  showDeleteConfirm.value = false
  if (ok) fetchBots()
}

const statusColor = (status: string) => {
  const map: Record<string, string> = {
    idle: 'bg-slate-500/10 text-[var(--ca-muted)]',
    running: 'bg-blue-500/10 text-blue-400',
    success: 'bg-emerald-500/10 text-emerald-400',
    error: 'bg-rose-500/10 text-rose-400',
  }
  return map[status] || map.idle
}

const statusLabel = (status: string) => {
  const map: Record<string, string> = {
    idle: tc('bots.statuses.idle'),
    running: tc('bots.statuses.running'),
    success: tc('bots.statuses.success'),
    error: tc('bots.statuses.error'),
  }
  return map[status] || status
}

const formatDate = (d: string | null) => {
  if (!d) return '-'
  return new Date(d).toLocaleString(dateLocale.value, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const configLabel = (b: any) => {
  const cfg = typeof b.config === 'string' ? JSON.parse(b.config) : (b.config || {})
  if (!cfg.provider && !cfg.model) return null
  return cfg
}
</script>

<template>
  <div>
    <ConsolePageHeader
      :kicker="tc('bots.kicker')"
      icon="lucide:bot"
      :title="tc('bots.title')"
      :description="tc('bots.description')"
    >
      <template #actions>
        <button type="button" class="ca-btn-primary" @click="openCreate">
          <Icon name="lucide:plus" class="h-4 w-4" />
          {{ tc('bots.add') }}
        </button>
      </template>
    </ConsolePageHeader>

    <div v-if="loading" class="ca-card p-10 text-center">
      <Icon name="lucide:loader-2" class="mx-auto h-8 w-8 animate-spin text-[var(--ca-subtle)]" />
    </div>

    <div v-else-if="!items.length" class="ca-card p-10 text-center">
      <Icon name="lucide:bot" class="mx-auto h-12 w-12 text-[var(--ca-subtle)]" />
      <p class="mt-3 text-sm text-[var(--ca-muted)]">{{ tc('bots.empty') }}</p>
      <button type="button" class="ca-btn-primary mt-4" @click="openCreate">{{ tc('bots.emptyAction') }}</button>
    </div>

    <div v-else class="space-y-4">
      <div v-for="b in items" :key="b.id" class="ca-card p-5">
        <!-- Header -->
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div class="flex items-center gap-3">
            <div class="inline-flex h-10 w-10 items-center justify-center rounded-xl" :class="b.is_active ? 'bg-emerald-500/10' : 'bg-slate-500/10'">
              <Icon name="lucide:bot" class="h-5 w-5" :class="b.is_active ? 'text-emerald-400' : 'text-[var(--ca-subtle)]'" />
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h3 class="font-display font-semibold text-[var(--ca-text)]">{{ b.name }}</h3>
                <span
                  class="rounded-full px-2 py-0.5 text-[0.6rem] font-bold uppercase"
                  :class="b.is_active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-500/10 text-[var(--ca-subtle)]'"
                >
                  {{ b.is_active ? 'Aktif' : 'Nonaktif' }}
                </span>
              </div>
              <div class="flex flex-wrap items-center gap-2 text-xs text-[var(--ca-muted)]">
                <span class="rounded bg-[var(--ca-panel-bg-strong)] px-1.5 py-0.5 font-mono text-[0.65rem]">{{ b.bot_type }}</span>
                <template v-if="configLabel(b)">
                  <span class="rounded bg-[var(--ca-panel-bg-strong)] px-1.5 py-0.5 text-[0.65rem]">
                    {{ providerOptions.find(p => p.value === configLabel(b).provider)?.label || configLabel(b).provider }}
                  </span>
                  <span v-if="configLabel(b).model" class="rounded bg-[var(--ca-panel-bg-strong)] px-1.5 py-0.5 font-mono text-[0.65rem]">
                    {{ configLabel(b).model.split('/').pop() }}
                  </span>
                </template>
                  <span v-else class="rounded bg-blue-500/10 px-1.5 py-0.5 text-[0.65rem] text-blue-400">
                    <Icon name="lucide:settings" class="mr-0.5 inline h-3 w-3" />
                    {{ tc('bots.useDefault') }}
                  </span>
                <span>
                  <Icon name="lucide:clock" class="mr-0.5 inline h-3 w-3" />
                  {{ b.schedule }} {{ b.timezone === 'Asia/Jakarta' ? 'WIB' : b.timezone }}
                </span>
              </div>
            </div>
          </div>
        <div class="flex items-center gap-1">
            <!-- Trigger -->
            <CaTooltip :text="triggeringBot === b.id ? tc('bots.running') : triggerSuccess === b.id ? tc('bots.triggered') : tc('bots.runNow')" position="bottom">
              <button
                type="button"
                class="rounded-lg p-1.5 transition"
                :class="[
                  triggeringBot === b.id ? 'text-blue-400 animate-pulse' :
                  triggerSuccess === b.id ? 'text-emerald-400' :
                  'text-[var(--ca-muted)] hover:bg-[var(--ca-panel-bg-strong)]'
                ]"
                :disabled="triggeringBot !== null"
                @click="handleTrigger(b)"
              >
                <Icon :name="triggeringBot === b.id ? 'lucide:loader-2' : triggerSuccess === b.id ? 'lucide:check' : 'lucide:play'" class="h-4 w-4" :class="{ 'animate-spin': triggeringBot === b.id }" />
              </button>
            </CaTooltip>
            <!-- Toggle active/inactive -->
            <CaTooltip :text="b.is_active ? tc('common.disabled') : tc('common.enabled')" position="bottom">
              <button
                type="button"
                class="rounded-lg p-1.5 transition"
                :class="b.is_active ? 'text-emerald-400 hover:bg-emerald-500/10' : 'text-[var(--ca-subtle)] hover:bg-[var(--ca-panel-bg-strong)]'"
                @click="handleToggle(b)"
              >
                <Icon :name="b.is_active ? 'lucide:toggle-right' : 'lucide:toggle-left'" class="h-4 w-4" />
              </button>
            </CaTooltip>
            <!-- Edit -->
            <CaTooltip :text="tc('bots.editConfig')" position="bottom">
              <button type="button" class="rounded-lg p-1.5 text-[var(--ca-muted)] hover:bg-[var(--ca-panel-bg-strong)]" @click="openEdit(b)">
                <Icon name="lucide:edit-3" class="h-4 w-4" />
              </button>
            </CaTooltip>
            <!-- Delete -->
            <CaTooltip :text="tc('common.delete')" position="bottom">
              <button type="button" class="rounded-lg p-1.5 text-rose-400 hover:bg-rose-500/10" @click="handleDelete(b)">
                <Icon name="lucide:trash-2" class="h-4 w-4" />
              </button>
            </CaTooltip>
          </div>
        </div>

        <!-- Status bar -->
        <div class="mt-4 flex flex-wrap items-center gap-4 rounded-lg border border-[color:var(--ca-border)] bg-[var(--ca-panel-bg)] px-4 py-2.5">
          <div class="flex items-center gap-2">
            <span class="text-[0.65rem] font-semibold uppercase tracking-wider text-[var(--ca-subtle)]">{{ tc('bots.statusLast') }}</span>
            <span v-if="triggeringBot === b.id" class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.6rem] font-bold uppercase bg-blue-500/10 text-blue-400">
              <Icon name="lucide:loader-2" class="h-3 w-3 animate-spin" />
              {{ tc('bots.running') }}
            </span>
            <span v-else class="rounded-full px-2 py-0.5 text-[0.6rem] font-bold uppercase" :class="statusColor(b.last_status)">
              {{ statusLabel(b.last_status) }}
            </span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-[0.65rem] font-semibold uppercase tracking-wider text-[var(--ca-subtle)]">{{ tc('bots.statusTime') }}</span>
            <span class="text-xs text-[var(--ca-muted)]">{{ formatDate(b.last_run_at) }}</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-[0.65rem] font-semibold uppercase tracking-wider text-[var(--ca-subtle)]">{{ tc('bots.statusRuns') }}</span>
            <span class="text-xs font-semibold text-[var(--ca-text)]">{{ b.run_count }}</span>
          </div>
          <CaTooltip v-if="b.last_error" :text="b.last_error" position="bottom">
            <div class="flex items-center gap-2">
              <span class="text-[0.65rem] font-semibold uppercase tracking-wider text-[var(--ca-subtle)]">{{ tc('bots.statusError') }}</span>
              <span class="text-xs text-rose-400 truncate max-w-[200px]">{{ b.last_error }}</span>
            </div>
          </CaTooltip>
        </div>
      </div>
    </div>

    <!-- Form Modal -->
    <Teleport to="body">
      <div v-if="showFormModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" @click.self="showFormModal = false">
        <div class="ca-card w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
          <h3 class="font-display text-lg font-bold text-[var(--ca-text)]">
            <Icon name="lucide:bot" class="mr-2 inline h-5 w-5 text-amber-400" />
            {{ editingBot ? tc('bots.formEdit') : tc('bots.formCreate') }}
          </h3>
          <form class="mt-4 space-y-3" autocomplete="off" @submit.prevent="handleSubmit">
            <BaseInput id="bot-name" v-model="formData.name" :label="tc('bots.name')" placeholder="Article Generator Harian" required autocomplete="off" />
            <SearchSelect
              v-if="!editingBot"
              id="bot-type"
              v-model="formData.bot_type"
              :label="tc('bots.type')"
              :options="botTypeOptions"
              required
            />
            <div class="grid gap-3 sm:grid-cols-2">
              <BaseInput id="bot-schedule" v-model="formData.schedule" :label="tc('bots.schedule')" placeholder="08:00" required autocomplete="off" />
              <SearchSelect
                id="bot-timezone"
                v-model="formData.timezone"
                :label="tc('bots.timezone')"
                :options="timezoneOptions"
                required
              />
            </div>

            <!-- AI Settings Toggle -->
            <BaseSwitch
              id="bot-default-ai"
              :model-value="useDefaultAI"
              :label="tc('bots.defaultAiTitle')"
              :description="tc('bots.defaultAiDesc')"
              @update:model-value="handleToggleDefaultAI"
            />

            <!-- AI Provider & Model (only when override) -->
            <template v-if="!useDefaultAI">
              <p class="text-[0.65rem] font-semibold uppercase tracking-widest text-[var(--ca-subtle)] pt-1">{{ tc('bots.overrideTitle') }}</p>
              <div class="grid gap-3 sm:grid-cols-2">
                <SearchSelect
                  id="bot-provider"
                  v-model="formData.provider"
                  :label="tc('apiKeys.provider')"
                  :options="providerOptions"
                  required
                />
                <div>
                  <SearchSelect
                    id="bot-model"
                    v-model="formData.model"
                    :label="tc('aiSettings.modelLabel')"
                    :options="modelOptions"
                    :disabled="modelsLoading"
                    :placeholder="modelsLoading ? tc('aiSettings.loadingModels') : tc('aiSettings.modelPlaceholder')"
                    required
                  />
                  <p v-if="modelsError" class="mt-1 text-[0.65rem] text-amber-400">{{ modelsError }}</p>
                </div>
              </div>
            </template>

            <div class="grid gap-3 sm:grid-cols-3">
              <SearchSelect
                id="bot-tone"
                v-model="formData.tone"
                :label="tc('bots.tone')"
                :options="toneOptions"
              />
              <SearchSelect
                id="bot-language"
                v-model="formData.language"
                :label="tc('bots.language')"
                :options="languageOptions"
              />
              <BaseInput id="bot-wordcount" v-model.number="formData.word_count" :label="tc('bots.wordCount')" type="number" placeholder="1200" autocomplete="off" />
            </div>

            <!-- Auto Image -->
            <BaseSwitch
              id="bot-auto-image"
              v-model="formData.auto_image"
              :label="tc('bots.autoImageTitle')"
              :description="tc('bots.autoImageDesc')"
            />

            <p v-if="error" class="text-sm text-rose-400">{{ error }}</p>

            <div class="flex justify-end gap-3 pt-2">
              <button type="button" class="ca-btn-secondary" @click="showFormModal = false">{{ tc('common.cancel') }}</button>
              <button type="submit" class="ca-btn-primary" :disabled="saving">{{ saving ? tc('common.processing') : tc('common.save') }}</button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

    <!-- Delete Confirm -->
    <Teleport to="body">
      <div v-if="showDeleteConfirm" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" @click.self="showDeleteConfirm = false">
        <div class="ca-card w-full max-w-md p-6">
          <h3 class="font-display text-lg font-bold text-[var(--ca-text)]">{{ tc('bots.deleteTitle') }}</h3>
          <p class="mt-2 text-sm text-[var(--ca-muted)]">{{ tc('bots.deleteDescription', { name: deletingBot?.name || '-' }) }}</p>
          <div class="mt-6 flex justify-end gap-3">
            <button type="button" class="ca-btn-secondary" @click="showDeleteConfirm = false">{{ tc('common.cancel') }}</button>
            <button type="button" class="rounded-lg bg-rose-500 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-600" @click="confirmDelete">{{ tc('common.delete') }}</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
