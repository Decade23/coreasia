<script setup lang="ts">
definePageMeta({ layout: 'console', middleware: 'console' })

const { items, loading, saving, error, fetchKeys, createKey, updateKey, deleteKey, copyKey } = useApiKeys()
const { user: currentAdmin } = useAdminAuth()

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

const showKeyValue = ref(false)
const changingKey = ref(false)

const providerOptions = [
  { label: 'Claude (Anthropic)', value: 'claude' },
  { label: 'OpenAI', value: 'openai' },
  { label: 'Groq', value: 'groq' },
  { label: 'Google Gemini', value: 'gemini' },
  { label: 'Lainnya', value: 'other' },
]

onMounted(() => fetchKeys())

const openCreate = () => {
  editingKey.value = null
  changingKey.value = false
  showKeyValue.value = false
  formData.value = { name: '', provider: 'claude', key_value: '', description: '' }
  showFormModal.value = true
}

const openEdit = (k: any) => {
  editingKey.value = k
  changingKey.value = false
  showKeyValue.value = false
  formData.value = {
    name: k.name,
    provider: k.provider,
    key_value: '',
    description: k.description || '',
  }
  showFormModal.value = true
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
    await navigator.clipboard.writeText(val)
    copySuccess.value = k.id
    setTimeout(() => { copySuccess.value = null }, 2000)
  }
}

const formatDate = (d: string) => new Date(d).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })
</script>

<template>
  <div>
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="font-display text-2xl font-bold text-[var(--ca-text)]">API Keys</h1>
        <p class="mt-1 text-sm text-[var(--ca-muted)]">Kelola API key untuk integrasi layanan</p>
      </div>
      <button v-if="currentAdmin?.role === 'super_admin'" type="button" class="ca-btn-primary" @click="openCreate">
        <Icon name="lucide:plus" class="h-4 w-4" />
        Tambah Key
      </button>
    </div>

    <!-- Info box -->
    <div class="mb-4 rounded-xl border border-amber-300/20 bg-amber-500/5 p-4">
      <div class="flex gap-3">
        <Icon name="lucide:info" class="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
        <div class="text-xs text-[var(--ca-muted)]">
          <p>API key digunakan oleh sistem untuk integrasi AI article generator dan fitur lainnya.</p>
          <p class="mt-1">Key yang aktif dengan provider <strong>claude</strong> akan otomatis digunakan untuk generate artikel.</p>
        </div>
      </div>
    </div>

    <div v-if="loading" class="ca-card p-10 text-center">
      <Icon name="lucide:loader-2" class="mx-auto h-8 w-8 animate-spin text-[var(--ca-subtle)]" />
    </div>

    <div v-else-if="!items.length" class="ca-card p-10 text-center">
      <Icon name="lucide:key-round" class="mx-auto h-12 w-12 text-[var(--ca-subtle)]" />
      <p class="mt-3 text-sm text-[var(--ca-muted)]">Belum ada API key</p>
      <button type="button" class="ca-btn-primary mt-4" @click="openCreate">Tambah Key Pertama</button>
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
          </div>
          <div class="mt-1 flex flex-wrap items-center gap-3 text-xs text-[var(--ca-muted)]">
            <span class="rounded bg-[var(--ca-panel-bg-strong)] px-1.5 py-0.5 font-mono text-[0.65rem]">{{ k.provider }}</span>
            <span class="font-mono tracking-wider text-[var(--ca-subtle)]">{{ k.key_masked }}</span>
            <span v-if="k.description" class="hidden sm:inline">· {{ k.description }}</span>
          </div>
          <p class="mt-1 text-[0.65rem] text-[var(--ca-subtle)]">Dibuat {{ formatDate(k.created_at) }}</p>
        </div>

        <div class="flex items-center gap-1 shrink-0">
          <!-- Copy -->
          <CaTooltip :text="copySuccess === k.id ? 'Tersalin!' : 'Salin key'" position="bottom">
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
          <CaTooltip :text="k.is_active ? 'Nonaktifkan' : 'Aktifkan'" position="bottom">
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
          <CaTooltip text="Edit" position="bottom">
            <button
              type="button"
              class="rounded-lg p-1.5 text-[var(--ca-muted)] hover:bg-[var(--ca-panel-bg-strong)]"
              @click="openEdit(k)"
            >
              <Icon name="lucide:edit-3" class="h-4 w-4" />
            </button>
          </CaTooltip>
          <!-- Delete -->
          <CaTooltip text="Hapus" position="bottom">
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
            {{ editingKey ? 'Edit API Key' : 'Tambah API Key' }}
          </h3>
          <form class="mt-4 space-y-3" autocomplete="off" data-form-type="other" @submit.prevent="handleSubmit">
            <BaseInput id="apikey-name" v-model="formData.name" label="Nama" placeholder="Claude AI Production" required autocomplete="off" />
            <SearchSelect
              id="apikey-provider"
              v-model="formData.provider"
              label="Provider"
              :options="providerOptions"
              required
            />
            <div>
              <label class="ca-field-label">
                API Key
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
                  Ganti Key
                </button>
              </div>

              <!-- Create mode or changing key: show input -->
              <div v-else class="relative">
                <input
                  id="apikey-value"
                  v-model="formData.key_value"
                  type="text"
                  :class="['ca-field-control font-mono tracking-wider border-[color:var(--ca-border)] focus:border-amber-300/40 pr-10', !showKeyValue ? 'ca-text-masked' : '']"
                  :placeholder="editingKey ? 'Masukkan key baru...' : 'sk-ant-api03-...'"
                  :required="!editingKey"
                  autocomplete="off"
                  spellcheck="false"
                />
                <button
                  type="button"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--ca-subtle)] hover:text-[var(--ca-muted)] transition"
                  @click="showKeyValue = !showKeyValue"
                >
                  <Icon :name="showKeyValue ? 'lucide:eye-off' : 'lucide:eye'" class="h-4 w-4" />
                </button>
              </div>

              <p class="mt-1 text-[0.65rem] text-[var(--ca-subtle)]">
                {{ editingKey && !changingKey ? 'Key tersimpan aman. Klik "Ganti Key" untuk mengubah.' : 'Key disimpan terenkripsi dan tidak bisa dilihat setelah disimpan' }}
              </p>
            </div>
            <BaseInput id="apikey-desc" v-model="formData.description" label="Deskripsi (opsional)" placeholder="Untuk generate artikel harian" autocomplete="off" />

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
          <h3 class="font-display text-lg font-bold text-[var(--ca-text)]">Hapus API Key?</h3>
          <p class="mt-2 text-sm text-[var(--ca-muted)]">
            Apakah yakin menghapus <strong>{{ deletingKey?.name }}</strong> ({{ deletingKey?.provider }})?
            Layanan yang menggunakan key ini akan berhenti berfungsi.
          </p>
          <div class="mt-6 flex justify-end gap-3">
            <button type="button" class="ca-btn-secondary" @click="showDeleteConfirm = false">Batal</button>
            <button type="button" class="rounded-lg bg-rose-500 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-600" @click="confirmDelete">Hapus</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
