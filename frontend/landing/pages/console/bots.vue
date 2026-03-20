<script setup lang="ts">
definePageMeta({ layout: 'console', middleware: 'console' })

const { items, loading, saving, error, fetchBots, createBot, updateBot, deleteBot, triggerBot } = useBotSchedules()

const showFormModal = ref(false)
const showDeleteConfirm = ref(false)
const editingBot = ref<any>(null)
const deletingBot = ref<any>(null)
const triggerSuccess = ref<string | null>(null)

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
})

const botTypeOptions = [
  { label: 'Article Generator', value: 'article_generator' },
]

const timezoneOptions = [
  { label: 'WIB (Asia/Jakarta)', value: 'Asia/Jakarta' },
  { label: 'WITA (Asia/Makassar)', value: 'Asia/Makassar' },
  { label: 'WIT (Asia/Jayapura)', value: 'Asia/Jayapura' },
  { label: 'UTC', value: 'UTC' },
]

const api = useAdminApi()

const providerOptions = [
  { label: 'Claude (Anthropic)', value: 'claude' },
  { label: 'OpenAI', value: 'openai' },
  { label: 'Groq', value: 'groq' },
  { label: 'Google Gemini', value: 'gemini' },
]

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
      modelsError.value = 'Tidak ada model tersedia. Pastikan API key sudah dikonfigurasi.'
    }
  } catch {
    modelOptions.value = []
    modelsError.value = 'Gagal mengambil daftar model. Pastikan API key untuk provider ini sudah ditambahkan.'
  } finally {
    modelsLoading.value = false
  }
}

const toneOptions = [
  { label: 'Profesional', value: 'professional' },
  { label: 'Kasual', value: 'casual' },
  { label: 'Informatif', value: 'informative' },
]

const languageOptions = [
  { label: 'Bahasa Indonesia', value: 'id' },
  { label: 'English', value: 'en' },
]

watch(() => formData.value.provider, (provider) => {
  formData.value.model = ''
  fetchModels(provider)
})

onMounted(() => fetchBots())

const openCreate = () => {
  editingBot.value = null
  formData.value = {
    name: '', bot_type: 'article_generator', schedule: '08:00', timezone: 'Asia/Jakarta',
    provider: 'claude', model: '',
    tone: 'professional', language: 'id', word_count: 1200,
  }
  fetchModels('claude')
  showFormModal.value = true
}

const openEdit = (b: any) => {
  editingBot.value = b
  const cfg = typeof b.config === 'string' ? JSON.parse(b.config) : (b.config || {})
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
  }
  fetchModels(provider)
  showFormModal.value = true
}

const handleSubmit = async () => {
  const configParsed = {
    provider: formData.value.provider,
    model: formData.value.model,
    tone: formData.value.tone,
    language: formData.value.language,
    word_count: formData.value.word_count,
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
  const ok = await triggerBot(b.id)
  if (ok) {
    triggerSuccess.value = b.id
    setTimeout(() => { triggerSuccess.value = null }, 3000)
    fetchBots()
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
    idle: 'Menunggu',
    running: 'Berjalan',
    success: 'Berhasil',
    error: 'Gagal',
  }
  return map[status] || status
}

const formatDate = (d: string | null) => {
  if (!d) return '-'
  return new Date(d).toLocaleString('id-ID', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}
</script>

<template>
  <div>
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="font-display text-2xl font-bold text-[var(--ca-text)]">Bot Scheduler</h1>
        <p class="mt-1 text-sm text-[var(--ca-muted)]">Kelola bot otomatis untuk generate konten</p>
      </div>
      <button type="button" class="ca-btn-primary" @click="openCreate">
        <Icon name="lucide:plus" class="h-4 w-4" />
        Tambah Bot
      </button>
    </div>

    <div v-if="loading" class="ca-card p-10 text-center">
      <Icon name="lucide:loader-2" class="mx-auto h-8 w-8 animate-spin text-[var(--ca-subtle)]" />
    </div>

    <div v-else-if="!items.length" class="ca-card p-10 text-center">
      <Icon name="lucide:bot" class="mx-auto h-12 w-12 text-[var(--ca-subtle)]" />
      <p class="mt-3 text-sm text-[var(--ca-muted)]">Belum ada bot scheduler</p>
      <button type="button" class="ca-btn-primary mt-4" @click="openCreate">Tambah Bot Pertama</button>
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
                <span v-if="b.config?.provider" class="rounded bg-[var(--ca-panel-bg-strong)] px-1.5 py-0.5 text-[0.65rem]">
                  {{ providerOptions.find(p => p.value === b.config.provider)?.label || b.config.provider }}
                </span>
                <span v-if="b.config?.model" class="rounded bg-[var(--ca-panel-bg-strong)] px-1.5 py-0.5 font-mono text-[0.65rem]">
                  {{ b.config.model.split('/').pop() }}
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
            <CaTooltip :text="triggerSuccess === b.id ? 'Berhasil dipicu!' : 'Jalankan sekarang'" position="bottom">
              <button
                type="button"
                class="rounded-lg p-1.5 transition"
                :class="triggerSuccess === b.id ? 'text-emerald-400' : 'text-[var(--ca-muted)] hover:bg-[var(--ca-panel-bg-strong)]'"
                @click="handleTrigger(b)"
              >
                <Icon :name="triggerSuccess === b.id ? 'lucide:check' : 'lucide:play'" class="h-4 w-4" />
              </button>
            </CaTooltip>
            <!-- Toggle active/inactive -->
            <CaTooltip :text="b.is_active ? 'Nonaktifkan jadwal' : 'Aktifkan jadwal'" position="bottom">
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
            <CaTooltip text="Edit konfigurasi" position="bottom">
              <button type="button" class="rounded-lg p-1.5 text-[var(--ca-muted)] hover:bg-[var(--ca-panel-bg-strong)]" @click="openEdit(b)">
                <Icon name="lucide:edit-3" class="h-4 w-4" />
              </button>
            </CaTooltip>
            <!-- Delete -->
            <CaTooltip text="Hapus bot" position="bottom">
              <button type="button" class="rounded-lg p-1.5 text-rose-400 hover:bg-rose-500/10" @click="handleDelete(b)">
                <Icon name="lucide:trash-2" class="h-4 w-4" />
              </button>
            </CaTooltip>
          </div>
        </div>

        <!-- Status bar -->
        <div class="mt-4 flex flex-wrap items-center gap-4 rounded-lg border border-[color:var(--ca-border)] bg-[var(--ca-panel-bg)] px-4 py-2.5">
          <div class="flex items-center gap-2">
            <span class="text-[0.65rem] font-semibold uppercase tracking-wider text-[var(--ca-subtle)]">Terakhir</span>
            <span class="rounded-full px-2 py-0.5 text-[0.6rem] font-bold uppercase" :class="statusColor(b.last_status)">
              {{ statusLabel(b.last_status) }}
            </span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-[0.65rem] font-semibold uppercase tracking-wider text-[var(--ca-subtle)]">Waktu</span>
            <span class="text-xs text-[var(--ca-muted)]">{{ formatDate(b.last_run_at) }}</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-[0.65rem] font-semibold uppercase tracking-wider text-[var(--ca-subtle)]">Total Run</span>
            <span class="text-xs font-semibold text-[var(--ca-text)]">{{ b.run_count }}</span>
          </div>
          <CaTooltip v-if="b.last_error" :text="b.last_error" position="bottom">
            <div class="flex items-center gap-2">
              <span class="text-[0.65rem] font-semibold uppercase tracking-wider text-[var(--ca-subtle)]">Error</span>
              <span class="text-xs text-rose-400 truncate max-w-[200px]">{{ b.last_error }}</span>
            </div>
          </CaTooltip>
        </div>
      </div>
    </div>

    <!-- Form Modal -->
    <Teleport to="body">
      <div v-if="showFormModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" @click.self="showFormModal = false">
        <div class="ca-card w-full max-w-lg p-6">
          <h3 class="font-display text-lg font-bold text-[var(--ca-text)]">
            <Icon name="lucide:bot" class="mr-2 inline h-5 w-5 text-amber-400" />
            {{ editingBot ? 'Edit Bot' : 'Tambah Bot' }}
          </h3>
          <form class="mt-4 space-y-3" autocomplete="off" @submit.prevent="handleSubmit">
            <BaseInput id="bot-name" v-model="formData.name" label="Nama Bot" placeholder="Article Generator Harian" required autocomplete="off" />
            <SearchSelect
              v-if="!editingBot"
              id="bot-type"
              v-model="formData.bot_type"
              label="Tipe Bot"
              :options="botTypeOptions"
              required
            />
            <div class="grid gap-3 sm:grid-cols-2">
              <BaseInput id="bot-schedule" v-model="formData.schedule" label="Jadwal (HH:MM)" placeholder="08:00" required autocomplete="off" />
              <SearchSelect
                id="bot-timezone"
                v-model="formData.timezone"
                label="Timezone"
                :options="timezoneOptions"
                required
              />
            </div>

            <!-- AI Provider & Model -->
            <p class="text-[0.65rem] font-semibold uppercase tracking-widest text-[var(--ca-subtle)] pt-2">Konfigurasi AI</p>
            <div class="grid gap-3 sm:grid-cols-2">
              <SearchSelect
                id="bot-provider"
                v-model="formData.provider"
                label="Provider"
                :options="providerOptions"
                required
              />
              <div>
                <SearchSelect
                  id="bot-model"
                  v-model="formData.model"
                  label="Model"
                  :options="modelOptions"
                  :disabled="modelsLoading"
                  :placeholder="modelsLoading ? 'Memuat model...' : 'Pilih model'"
                  required
                />
                <p v-if="modelsError" class="mt-1 text-[0.65rem] text-amber-400">{{ modelsError }}</p>
              </div>
            </div>
            <div class="grid gap-3 sm:grid-cols-3">
              <SearchSelect
                id="bot-tone"
                v-model="formData.tone"
                label="Tone"
                :options="toneOptions"
              />
              <SearchSelect
                id="bot-language"
                v-model="formData.language"
                label="Bahasa"
                :options="languageOptions"
              />
              <BaseInput id="bot-wordcount" v-model.number="formData.word_count" label="Jumlah Kata" type="number" placeholder="1200" autocomplete="off" />
            </div>

            <p v-if="error" class="text-sm text-rose-400">{{ error }}</p>

            <div class="flex justify-end gap-3 pt-2">
              <button type="button" class="ca-btn-secondary" @click="showFormModal = false">Batal</button>
              <button type="submit" class="ca-btn-primary" :disabled="saving">{{ saving ? 'Menyimpan...' : 'Simpan' }}</button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

    <!-- Delete Confirm -->
    <Teleport to="body">
      <div v-if="showDeleteConfirm" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" @click.self="showDeleteConfirm = false">
        <div class="ca-card w-full max-w-md p-6">
          <h3 class="font-display text-lg font-bold text-[var(--ca-text)]">Hapus Bot?</h3>
          <p class="mt-2 text-sm text-[var(--ca-muted)]">Apakah yakin menghapus <strong>{{ deletingBot?.name }}</strong>? Bot akan berhenti berjalan.</p>
          <div class="mt-6 flex justify-end gap-3">
            <button type="button" class="ca-btn-secondary" @click="showDeleteConfirm = false">Batal</button>
            <button type="button" class="rounded-lg bg-rose-500 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-600" @click="confirmDelete">Hapus</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
