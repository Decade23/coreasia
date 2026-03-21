<script setup lang="ts">
definePageMeta({ layout: 'console', middleware: 'console' })

const api = useAdminApi()
const toast = useToast()

const loading = ref(true)
const saving = ref(false)

const settings = ref({
  ai_enabled: true,
  ai_provider: 'claude',
  ai_model: '',
})

const providerOptions = [
  { label: 'Claude (Anthropic)', value: 'claude' },
  { label: 'OpenAI', value: 'openai' },
  { label: 'Groq', value: 'groq' },
  { label: 'Google Gemini', value: 'gemini' },
]

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
    modelsError.value = 'Tidak bisa memuat model. Pastikan API key tersimpan untuk provider ini.'
  } finally {
    modelsLoading.value = false
  }
}

watch(() => settings.value.ai_provider, (p) => {
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
    })
    toast.success('Pengaturan AI berhasil disimpan')
  } catch {
    toast.error('Gagal menyimpan pengaturan AI')
  } finally {
    saving.value = false
  }
}

const hasActiveKey = computed(() => !!activeKeyInfo.value)

onMounted(async () => {
  await fetchSettings()
  fetchModels(settings.value.ai_provider)
  fetchActiveKey(settings.value.ai_provider)
})
</script>

<template>
  <div>
    <div class="mb-6">
      <h1 class="font-display text-2xl font-bold text-[var(--ca-text)]">Pengaturan AI</h1>
      <p class="mt-1 text-sm text-[var(--ca-muted)]">Konfigurasi provider dan model untuk fitur AI</p>
    </div>

    <div v-if="loading" class="ca-card p-10 text-center">
      <Icon name="lucide:loader-2" class="mx-auto h-8 w-8 animate-spin text-[var(--ca-subtle)]" />
    </div>

    <div v-else class="space-y-6 max-w-2xl">
      <!-- Enable/Disable -->
      <div class="ca-card p-5">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="font-display font-semibold text-[var(--ca-text)]">Fitur AI</h3>
            <p class="mt-0.5 text-xs text-[var(--ca-muted)]">Aktifkan atau nonaktifkan fitur AI untuk generate artikel dan bot</p>
          </div>
          <button
            type="button"
            class="relative h-6 w-11 rounded-full transition-colors"
            :class="settings.ai_enabled ? 'bg-emerald-500' : 'bg-slate-600'"
            @click="settings.ai_enabled = !settings.ai_enabled"
          >
            <span
              class="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform shadow"
              :class="settings.ai_enabled ? 'translate-x-5' : 'translate-x-0'"
            />
          </button>
        </div>
      </div>

      <!-- Provider & Model -->
      <div class="ca-card p-5 space-y-4">
        <h3 class="font-display font-semibold text-[var(--ca-text)]">Provider & Model</h3>

        <SearchSelect
          id="ai-provider"
          v-model="settings.ai_provider"
          label="Provider AI Aktif"
          :options="providerOptions"
        />

        <!-- API Key status -->
        <div v-if="!hasActiveKey" class="rounded-lg border border-amber-400/20 bg-amber-500/5 p-3 flex items-start gap-2.5">
          <Icon name="lucide:alert-triangle" class="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
          <div class="text-xs">
            <p class="font-semibold text-amber-400">API key belum dikonfigurasi</p>
            <p class="mt-0.5 text-[var(--ca-muted)]">
              Tambahkan API key untuk <strong>{{ providerOptions.find(p => p.value === settings.ai_provider)?.label }}</strong> di
              <NuxtLink to="/console/api-keys" class="text-amber-400 underline">halaman API Keys</NuxtLink>.
            </p>
          </div>
        </div>
        <div v-else class="rounded-lg border border-emerald-400/20 bg-emerald-500/5 p-3 flex items-center gap-2.5">
          <Icon name="lucide:shield-check" class="h-4 w-4 text-emerald-400 shrink-0" />
          <p class="text-xs text-[var(--ca-muted)]">
            Menggunakan key <strong class="text-emerald-400">{{ activeKeyInfo?.name }}</strong> untuk {{ providerOptions.find(p => p.value === settings.ai_provider)?.label }}
          </p>
        </div>

        <div>
          <SearchSelect
            id="ai-model"
            v-model="settings.ai_model"
            label="Model AI"
            :options="modelOptions"
            :disabled="modelsLoading"
            :placeholder="modelsLoading ? 'Memuat model...' : 'Pilih model'"
          />
          <p v-if="modelsError" class="mt-1 text-[0.65rem] text-amber-400">{{ modelsError }}</p>
        </div>
      </div>

      <!-- Info -->
      <div class="ca-card p-5">
        <h3 class="font-display font-semibold text-[var(--ca-text)] mb-3">Cara Kerja</h3>
        <div class="space-y-2 text-xs text-[var(--ca-muted)]">
          <div class="flex items-start gap-2">
            <span class="mt-0.5 h-4 w-4 shrink-0 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center text-[0.6rem] font-bold">1</span>
            <p>Provider dan model yang dipilih di sini akan digunakan oleh <strong>AI Generate</strong> di halaman artikel dan <strong>Bot Scheduler</strong>.</p>
          </div>
          <div class="flex items-start gap-2">
            <span class="mt-0.5 h-4 w-4 shrink-0 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center text-[0.6rem] font-bold">2</span>
            <p>Bot bisa override provider/model di konfigurasi masing-masing. Pengaturan ini adalah <strong>default</strong>.</p>
          </div>
          <div class="flex items-start gap-2">
            <span class="mt-0.5 h-4 w-4 shrink-0 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center text-[0.6rem] font-bold">3</span>
            <p>Pastikan API key sudah ditambahkan di <NuxtLink to="/console/api-keys" class="text-amber-400 underline">API Keys</NuxtLink> untuk provider yang dipilih.</p>
          </div>
        </div>
      </div>

      <!-- Save -->
      <div class="flex justify-end">
        <button type="button" class="ca-btn-primary" :disabled="saving" @click="saveSettings">
          <Icon v-if="saving" name="lucide:loader-2" class="h-4 w-4 animate-spin" />
          {{ saving ? 'Menyimpan...' : 'Simpan Pengaturan' }}
        </button>
      </div>
    </div>
  </div>
</template>
