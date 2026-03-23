<script setup lang="ts">
definePageMeta({ layout: 'console', middleware: 'console' })

const api = useAdminApi()
const toast = useToast()
const { tc } = useConsoleI18n()

const loading = ref(true)
const saving = ref(false)

const settings = ref({
  ai_enabled: true,
  ai_provider: 'claude',
  ai_model: '',
  ai_auto_image: false,
})

const providerOptions = computed(() => [
  { label: tc('providers.claude'), value: 'claude' },
  { label: tc('providers.openai'), value: 'openai' },
  { label: tc('providers.groq'), value: 'groq' },
  { label: tc('providers.gemini'), value: 'gemini' },
])

const modelOptions = ref<{ label: string; value: string }[]>([])
const modelsLoading = ref(false)
const modelsError = ref('')

// Active key info for current provider
const activeKeyInfo = ref<{ id: string; name: string; provider: string } | null>(null)

const fetchSettings = async () => {
  loading.value = true
  try {
    const res = await api.get<Record<string, string>>('/admin/ai/settings')
    if (res.data) {
      settings.value.ai_enabled = res.data.ai_enabled !== 'false'
      settings.value.ai_provider = res.data.ai_provider || 'claude'
      settings.value.ai_model = res.data.ai_model || ''
      settings.value.ai_auto_image = res.data.ai_auto_image === 'true'
    }
  } catch {
    // Use defaults
  }
  loading.value = false
}

const fetchActiveKey = async (provider: string) => {
  activeKeyInfo.value = null
  try {
    const res = await api.get<{ id: string; name: string; provider: string }>(`/admin/ai/active-key/${provider}`)
    activeKeyInfo.value = res.data || null
  } catch { /* ignore */ }
}

const fetchModels = async (provider: string) => {
  modelsLoading.value = true
  modelsError.value = ''
  try {
    const res = await api.get<{ id: string; name: string }[]>(`/admin/ai/models/${provider}`)
    modelOptions.value = (res.data || []).map(m => ({ label: m.name || m.id, value: m.id }))
  } catch {
    modelOptions.value = []
    modelsError.value = tc('aiSettings.modelsMissing')
  } finally {
    modelsLoading.value = false
  }
}

const initialized = ref(false)

watch(() => settings.value.ai_provider, (p) => {
  if (!initialized.value) return
  settings.value.ai_model = ''
  fetchModels(p)
  fetchActiveKey(p)
})

const saveSettings = async () => {
  saving.value = true
  try {
    await api.put('/admin/ai/settings', {
      ai_enabled: String(settings.value.ai_enabled),
      ai_provider: settings.value.ai_provider,
      ai_model: settings.value.ai_model,
      ai_auto_image: String(settings.value.ai_auto_image),
    })
    toast.success(tc('feedback.aiSettingsSaved'))
  } catch {
    toast.error(tc('feedback.aiSettingsSaveFailed'))
  } finally {
    saving.value = false
  }
}

const hasActiveKey = computed(() => !!activeKeyInfo.value)

onMounted(async () => {
  await fetchSettings()
  await fetchModels(settings.value.ai_provider)
  fetchActiveKey(settings.value.ai_provider)
  initialized.value = true
})
</script>

<template>
  <div>
    <ConsolePageHeader
      :kicker="tc('aiSettings.kicker')"
      icon="lucide:sparkles"
      :title="tc('aiSettings.title')"
      :description="tc('aiSettings.description')"
    />

    <div v-if="loading" class="ca-card p-10 text-center">
      <Icon name="lucide:loader-2" class="mx-auto h-8 w-8 animate-spin text-[var(--ca-subtle)]" />
    </div>

    <div v-else class="space-y-6 max-w-2xl">
      <!-- Enable/Disable -->
      <BaseSwitch
        id="ai-enabled"
        v-model="settings.ai_enabled"
        :label="tc('aiSettings.featureTitle')"
        :description="tc('aiSettings.featureDesc')"
      />

      <!-- Auto Image -->
      <BaseSwitch
        id="ai-auto-image"
        v-model="settings.ai_auto_image"
        :label="tc('aiSettings.autoImageTitle')"
        :description="tc('aiSettings.autoImageDesc')"
      />

      <!-- Provider & Model -->
      <div class="ca-card p-5 space-y-4 relative z-10">
        <h3 class="font-display font-semibold text-[var(--ca-text)]">{{ tc('aiSettings.providerTitle') }}</h3>

        <SearchSelect
          id="ai-provider"
          v-model="settings.ai_provider"
          :label="tc('aiSettings.providerLabel')"
          :options="providerOptions"
          :placeholder="tc('aiSettings.providerPlaceholder')"
        />

        <!-- API Key status -->
        <div v-if="!hasActiveKey" class="rounded-lg border border-amber-400/20 bg-amber-500/5 p-3 flex items-start gap-2.5">
          <Icon name="lucide:alert-triangle" class="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
          <div class="text-xs">
            <p class="font-semibold text-amber-400">{{ tc('aiSettings.keyMissingTitle') }}</p>
            <p class="mt-0.5 text-[var(--ca-muted)]">
              {{ tc('aiSettings.keyMissingDesc', { provider: providerOptions.find(p => p.value === settings.ai_provider)?.label || settings.ai_provider }) }}
              <NuxtLink to="/console/api-keys" class="text-amber-400 underline">{{ tc('layout.apiKeys') }}</NuxtLink>.
            </p>
          </div>
        </div>
        <div v-else class="rounded-lg border border-emerald-400/20 bg-emerald-500/5 p-3 flex items-center gap-2.5">
          <Icon name="lucide:shield-check" class="h-4 w-4 text-emerald-400 shrink-0" />
          <p class="text-xs text-[var(--ca-muted)]">
            {{ tc('aiSettings.keyActiveDesc', { name: activeKeyInfo?.name || '-', provider: providerOptions.find(p => p.value === settings.ai_provider)?.label || settings.ai_provider }) }}
          </p>
        </div>

        <div>
          <SearchSelect
            id="ai-model"
            v-model="settings.ai_model"
            :label="tc('aiSettings.modelLabel')"
            :options="modelOptions"
            :disabled="modelsLoading"
            :placeholder="modelsLoading ? tc('aiSettings.loadingModels') : tc('aiSettings.modelPlaceholder')"
          />
          <p v-if="modelsError" class="mt-1 text-[0.65rem] text-amber-400">{{ modelsError }}</p>
        </div>
      </div>

      <!-- Info -->
      <div class="ca-card p-5">
        <h3 class="font-display font-semibold text-[var(--ca-text)] mb-3">{{ tc('aiSettings.howItWorks') }}</h3>
        <div class="space-y-2 text-xs text-[var(--ca-muted)]">
          <div class="flex items-start gap-2">
            <span class="mt-0.5 h-4 w-4 shrink-0 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center text-[0.6rem] font-bold">1</span>
            <p>{{ tc('aiSettings.howStep1') }}</p>
          </div>
          <div class="flex items-start gap-2">
            <span class="mt-0.5 h-4 w-4 shrink-0 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center text-[0.6rem] font-bold">2</span>
            <p>{{ tc('aiSettings.howStep2') }}</p>
          </div>
          <div class="flex items-start gap-2">
            <span class="mt-0.5 h-4 w-4 shrink-0 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center text-[0.6rem] font-bold">3</span>
            <p>{{ tc('aiSettings.howStep3') }} <NuxtLink to="/console/api-keys" class="text-amber-400 underline">{{ tc('layout.apiKeys') }}</NuxtLink>.</p>
          </div>
        </div>
      </div>

      <!-- Save -->
      <div class="flex justify-end">
        <button type="button" class="ca-btn-primary" :disabled="saving" @click="saveSettings">
          <Icon v-if="saving" name="lucide:loader-2" class="h-4 w-4 animate-spin" />
          {{ saving ? tc('aiSettings.saving') : tc('aiSettings.save') }}
        </button>
      </div>
    </div>
  </div>
</template>
