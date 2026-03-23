<script setup lang="ts">
definePageMeta({ layout: 'console', middleware: 'console' })

const { items, loading, saving, error, fetchKeys, createKey, updateKey, deleteKey, copyKey } = useApiKeys()
const { user: currentAdmin } = useAdminAuth()
const api = useAdminApi()
const { tc, dateLocale } = useConsoleI18n()

// Track which provider's key is currently in use by AI
const aiProvider = ref('')
const activeKeyId = ref<string | null>(null)

const fetchAIContext = async () => {
  try {
    const res = await api.get<Record<string, string>>('/admin/ai/settings')
    aiProvider.value = res.data?.ai_provider || 'claude'
  } catch { aiProvider.value = 'claude' }
  try {
    const res = await api.get<{ id: string }>(`/admin/ai/active-key/${aiProvider.value}`)
    activeKeyId.value = res.data?.id || null
  } catch { activeKeyId.value = null }
}

const showFormModal = ref(false)
const showDeleteConfirm = ref(false)
const editingKey = ref<any>(null)
const deletingKey = ref<any>(null)
const copySuccess = ref<string | null>(null)

const formData = ref({
  name: '',
  provider: 'claude',
  key_value: '',
  description: '',
})

const changingKey = ref(false)

const providerOptions = computed(() => [
  { label: tc('providers.claude'), value: 'claude' },
  { label: tc('providers.openai'), value: 'openai' },
  { label: tc('providers.groq'), value: 'groq' },
  { label: tc('providers.gemini'), value: 'gemini' },
  { label: tc('providers.other'), value: 'other' },
])

const availableModels = ref<{ id: string; name: string }[]>([])
const modelsLoading = ref(false)

const fetchModelsForProvider = async (provider: string) => {
  if (provider === 'other') { availableModels.value = []; return }
  modelsLoading.value = true
  try {
    const res = await api.get<{ id: string; name: string }[]>(`/admin/ai/models/${provider}`)
    availableModels.value = res.data || []
  } catch {
    availableModels.value = []
  } finally {
    modelsLoading.value = false
  }
}

watch(() => formData.value.provider, (p) => {
  if (showFormModal.value) fetchModelsForProvider(p)
})

onMounted(() => { fetchKeys(); fetchAIContext() })

const openCreate = () => {
  editingKey.value = null
  changingKey.value = false
  formData.value = { name: '', provider: 'claude', key_value: '', description: '' }
  showFormModal.value = true
  fetchModelsForProvider('claude')
}

const openEdit = (k: any) => {
  editingKey.value = k
  changingKey.value = false
  formData.value = {
    name: k.name,
    provider: k.provider,
    key_value: '',
    description: k.description || '',
  }
  showFormModal.value = true
  fetchModelsForProvider(k.provider)
}

const handleSubmit = async () => {
  let ok: boolean
  if (editingKey.value) {
    const data: Record<string, any> = {
      name: formData.value.name,
      provider: formData.value.provider,
      description: formData.value.description || null,
    }
    if (formData.value.key_value) {
      data.key_value = formData.value.key_value
    }
    ok = await updateKey(editingKey.value.id, data)
  } else {
    ok = await createKey(formData.value)
  }
  if (ok) {
    showFormModal.value = false
    fetchKeys()
  }
}

const handleDelete = (k: any) => {
  deletingKey.value = k
  showDeleteConfirm.value = true
}

const confirmDelete = async () => {
  const ok = await deleteKey(deletingKey.value.id)
  showDeleteConfirm.value = false
  if (ok) fetchKeys()
}

const handleToggleActive = async (k: any) => {
  const ok = await updateKey(k.id, { is_active: !k.is_active })
  if (ok) fetchKeys()
}

const handleCopy = async (k: any) => {
  const val = await copyKey(k.id)
  if (val) {
    copySuccess.value = k.id
    setTimeout(() => { copySuccess.value = null }, 2000)
  }
}

const formatDate = (d: string) => new Date(d).toLocaleDateString(dateLocale.value, { year: 'numeric', month: 'short', day: 'numeric' })
</script>

<template>
  <div>
    <ConsolePageHeader
      :kicker="tc('apiKeys.kicker')"
      icon="lucide:key-round"
      :title="tc('apiKeys.title')"
      :description="tc('apiKeys.description')"
    >
      <template #actions>
        <button v-if="currentAdmin?.role === 'super_admin'" type="button" class="ca-btn-primary" @click="openCreate">
          <Icon name="lucide:plus" class="h-4 w-4" />
          {{ tc('apiKeys.add') }}
        </button>
      </template>
    </ConsolePageHeader>

    <!-- Info box -->
    <div class="mb-4 rounded-[1.5rem] border border-amber-300/20 bg-amber-500/5 p-4">
      <div class="flex gap-3">
        <Icon name="lucide:info" class="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
        <div class="text-xs text-[var(--ca-muted)]">
          <p>{{ tc('apiKeys.infoTitle') }}</p>
          <p class="mt-1">
            {{ tc('apiKeys.infoBody', { provider: aiProvider || 'claude' }) }}
            <NuxtLink to="/console/ai-settings" class="text-amber-400 underline">{{ tc('layout.aiSettings') }}</NuxtLink>.
          </p>
        </div>
      </div>
    </div>

    <div v-if="loading" class="ca-card p-10 text-center">
      <Icon name="lucide:loader-2" class="mx-auto h-8 w-8 animate-spin text-[var(--ca-subtle)]" />
    </div>

    <div v-else-if="!items.length" class="ca-card p-10 text-center">
      <Icon name="lucide:key-round" class="mx-auto h-12 w-12 text-[var(--ca-subtle)]" />
      <p class="mt-3 text-sm text-[var(--ca-muted)]">{{ tc('apiKeys.empty') }}</p>
      <button type="button" class="ca-btn-primary mt-4" @click="openCreate">{{ tc('apiKeys.emptyAction') }}</button>
    </div>

    <div v-else class="space-y-3">
      <div
        v-for="k in items"
        :key="k.id"
        class="ca-card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2">
            <Icon name="lucide:key-round" class="h-4 w-4 text-amber-400" />
            <span class="text-sm font-semibold text-[var(--ca-text)]">{{ k.name }}</span>
            <span
              class="rounded-full px-2 py-0.5 text-[0.6rem] font-bold uppercase"
              :class="k.is_active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-500/10 text-[var(--ca-muted)]'"
            >
              {{ k.is_active ? 'Aktif' : 'Nonaktif' }}
            </span>
            <span
              v-if="activeKeyId === k.id"
              class="rounded-full bg-amber-500/10 px-2 py-0.5 text-[0.6rem] font-bold uppercase text-amber-400"
            >
              {{ tc('apiKeys.usedByAI') }}
            </span>
          </div>
          <div class="mt-1 flex flex-wrap items-center gap-3 text-xs text-[var(--ca-muted)]">
            <span class="rounded bg-[var(--ca-panel-bg-strong)] px-1.5 py-0.5 font-mono text-[0.65rem]">{{ k.provider }}</span>
            <span class="font-mono tracking-wider text-[var(--ca-subtle)]">{{ k.key_masked }}</span>
            <span v-if="k.description" class="hidden sm:inline">· {{ k.description }}</span>
          </div>
          <p class="mt-1 text-[0.65rem] text-[var(--ca-subtle)]">{{ tc('apiKeys.createdAt', { date: formatDate(k.created_at) }) }}</p>
        </div>

        <div class="flex items-center gap-1 shrink-0">
          <!-- Copy -->
          <CaTooltip :text="copySuccess === k.id ? tc('common.copied') : tc('apiKeys.copy')" position="bottom">
            <button
              type="button"
              class="rounded-lg p-1.5 transition"
              :class="copySuccess === k.id ? 'text-emerald-400' : 'text-[var(--ca-muted)] hover:bg-[var(--ca-panel-bg-strong)]'"
              @click="handleCopy(k)"
            >
              <Icon :name="copySuccess === k.id ? 'lucide:check' : 'lucide:copy'" class="h-4 w-4" />
            </button>
          </CaTooltip>
          <!-- Toggle active -->
          <CaTooltip :text="k.is_active ? tc('apiKeys.deactivate') : tc('apiKeys.activate')" position="bottom">
            <button
              type="button"
              class="rounded-lg p-1.5 transition"
              :class="k.is_active ? 'text-emerald-400 hover:bg-emerald-500/10' : 'text-[var(--ca-subtle)] hover:bg-[var(--ca-panel-bg-strong)]'"
              @click="handleToggleActive(k)"
            >
              <Icon :name="k.is_active ? 'lucide:toggle-right' : 'lucide:toggle-left'" class="h-4 w-4" />
            </button>
          </CaTooltip>
          <!-- Edit -->
          <CaTooltip :text="tc('common.edit')" position="bottom">
            <button
              type="button"
              class="rounded-lg p-1.5 text-[var(--ca-muted)] hover:bg-[var(--ca-panel-bg-strong)]"
              @click="openEdit(k)"
            >
              <Icon name="lucide:edit-3" class="h-4 w-4" />
            </button>
          </CaTooltip>
          <!-- Delete -->
          <CaTooltip :text="tc('common.delete')" position="bottom">
            <button
              type="button"
              class="rounded-lg p-1.5 text-rose-400 hover:bg-rose-500/10"
              @click="handleDelete(k)"
            >
              <Icon name="lucide:trash-2" class="h-4 w-4" />
            </button>
          </CaTooltip>
        </div>
      </div>
    </div>

    <!-- Form Modal -->
    <Teleport to="body">
      <div v-if="showFormModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" @click.self="showFormModal = false">
        <div class="ca-card w-full max-w-lg p-6">
          <h3 class="font-display text-lg font-bold text-[var(--ca-text)]">
            <Icon name="lucide:key-round" class="mr-2 inline h-5 w-5 text-amber-400" />
            {{ editingKey ? tc('apiKeys.formEditTitle') : tc('apiKeys.formCreateTitle') }}
          </h3>
          <form class="mt-4 space-y-3" autocomplete="off" data-form-type="other" @submit.prevent="handleSubmit">
            <BaseInput id="apikey-name" v-model="formData.name" :label="tc('apiKeys.name')" placeholder="Claude AI Production" required autocomplete="off" />
            <SearchSelect
              id="apikey-provider"
              v-model="formData.provider"
              :label="tc('apiKeys.provider')"
              :options="providerOptions"
              required
            />
            <div>
              <label class="ca-field-label">
                {{ tc('apiKeys.keyLabel') }}
                <span v-if="!editingKey" class="ca-required">*</span>
              </label>

              <!-- Edit mode: show masked key + change button -->
              <div v-if="editingKey && !changingKey" class="flex items-center gap-2">
                <div class="ca-field-control flex-1 flex items-center gap-2 border-[color:var(--ca-border)]">
                  <Icon name="lucide:shield-check" class="h-4 w-4 text-emerald-400 shrink-0" />
                  <span class="font-mono text-sm text-[var(--ca-muted)]">{{ editingKey.key_masked || '••••••••' }}</span>
                </div>
                <button
                  type="button"
                  class="shrink-0 rounded-lg border border-amber-400/30 px-3 py-2.5 text-xs font-semibold text-amber-400 hover:bg-amber-500/10 transition"
                  @click="changingKey = true"
                >
                  {{ tc('apiKeys.replaceKey') }}
                </button>
              </div>

              <!-- Create mode or changing key: show input -->
              <div v-else>
                <BasePasswordInput
                  id="apikey-value"
                  v-model="formData.key_value"
                  input-class="font-mono tracking-wider"
                  :placeholder="editingKey ? tc('apiKeys.replaceKey') : tc('apiKeys.keyPlaceholder')"
                  :required="!editingKey"
                  autocomplete="off"
                  show-label="Show API key"
                  hide-label="Hide API key"
                />
              </div>

              <p class="mt-1 text-[0.65rem] text-[var(--ca-subtle)]">
                {{ editingKey && !changingKey ? tc('apiKeys.keyHelperEdit') : tc('apiKeys.keyHelperCreate') }}
              </p>
            </div>
            <BaseInput id="apikey-desc" v-model="formData.description" :label="tc('apiKeys.descriptionField')" placeholder="Untuk generate artikel harian" autocomplete="off" />

            <!-- Available models info -->
            <div v-if="formData.provider !== 'other'" class="rounded-lg border border-[color:var(--ca-border)] bg-[var(--ca-panel-bg)] p-3">
              <p class="text-[0.65rem] font-semibold uppercase tracking-widest text-[var(--ca-subtle)] mb-2">
                <Icon name="lucide:cpu" class="mr-1 inline h-3 w-3" />
                {{ tc('apiKeys.modelsTitle') }} · {{ providerOptions.find(p => p.value === formData.provider)?.label }}
              </p>
              <div v-if="modelsLoading" class="flex items-center gap-2 text-xs text-[var(--ca-muted)]">
                <Icon name="lucide:loader-2" class="h-3 w-3 animate-spin" />
                {{ tc('apiKeys.modelsLoading') }}
              </div>
              <div v-else-if="availableModels.length" class="flex flex-wrap gap-1.5">
                <span
                  v-for="m in availableModels.slice(0, 8)"
                  :key="m.id"
                  class="rounded bg-[var(--ca-panel-bg-strong)] px-1.5 py-0.5 font-mono text-[0.6rem] text-[var(--ca-muted)]"
                >
                  {{ m.name || m.id }}
                </span>
                <span v-if="availableModels.length > 8" class="text-[0.6rem] text-[var(--ca-subtle)]">
                  +{{ availableModels.length - 8 }} lainnya
                </span>
              </div>
              <p v-else class="text-[0.6rem] text-amber-400">
                <Icon name="lucide:alert-triangle" class="mr-1 inline h-3 w-3" />
                {{ tc('apiKeys.modelsError') }}
              </p>
            </div>

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
          <h3 class="font-display text-lg font-bold text-[var(--ca-text)]">{{ tc('apiKeys.deleteTitle') }}</h3>
          <p class="mt-2 text-sm text-[var(--ca-muted)]">
            {{ tc('apiKeys.deleteDescription', { name: deletingKey?.name || '-' }) }}
          </p>
          <div class="mt-6 flex justify-end gap-3">
            <button type="button" class="ca-btn-secondary" @click="showDeleteConfirm = false">{{ tc('common.cancel') }}</button>
            <button type="button" class="rounded-lg bg-rose-500 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-600" @click="confirmDelete">{{ tc('common.delete') }}</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
