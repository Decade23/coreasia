<script setup lang="ts">
definePageMeta({ layout: 'console', middleware: 'console' })

const { logs, loading, error, totalItems, fetchLogs } = useAuditLogs()
const currentPage = ref(1)
const resourceFilter = ref('')
const selectedLog = ref<any>(null)

onMounted(() => fetchLogs(1, ''))

watch(resourceFilter, (val) => {
  currentPage.value = 1
  fetchLogs(1, val)
})

const actionOptions = [
  { label: 'create', value: 'create', class: 'bg-cyan-500/10 text-cyan-400' },
  { label: 'update', value: 'update', class: 'bg-amber-500/10 text-amber-400' },
  { label: 'delete', value: 'delete', class: 'bg-rose-500/10 text-rose-400' },
  { label: 'login', value: 'login', class: 'bg-purple-500/10 text-purple-400' },
  { label: 'publish', value: 'publish', class: 'bg-emerald-500/10 text-emerald-400' },
  { label: 'unpublish', value: 'unpublish', class: 'bg-slate-500/10 text-[var(--ca-muted)]' },
  { label: 'upload', value: 'upload', class: 'bg-blue-500/10 text-blue-400' },
  { label: 'ai_generate', value: 'ai_generate', class: 'bg-violet-500/10 text-violet-400' },
  { label: 'trigger', value: 'trigger', class: 'bg-orange-500/10 text-orange-400' },
]

const columns = [
  { key: 'action', label: 'Aksi', type: 'badge' as const, options: actionOptions, width: '120px' },
  { key: 'description', label: 'Deskripsi', type: 'text' as const, class: 'text-[var(--ca-text)]' },
  { key: 'user_name', label: 'User', type: 'text' as const },
  { key: 'resource', label: 'Resource', type: 'status' as const },
  { key: 'ip_address', label: 'IP', type: 'text' as const, width: '120px' },
  { key: 'created_at', label: 'Waktu', type: 'date' as const, width: '160px' },
]

const tableData = computed(() =>
  logs.value.map(log => ({
    ...log,
    description: log.description || `${log.action} ${log.resource}`,
  }))
)

const actionLabel = (action: string) => {
  const map: Record<string, string> = {
    create: 'Buat Baru',
    update: 'Perbarui',
    delete: 'Hapus',
    login: 'Login',
    publish: 'Publish',
    unpublish: 'Unpublish',
    upload: 'Upload',
    ai_generate: 'Generate AI',
    trigger: 'Trigger Bot',
  }
  return map[action] || action
}

const actionColor = (action: string) => {
  return actionOptions.find(o => o.value === action)?.class || 'bg-slate-500/10 text-[var(--ca-muted)]'
}

const formatDateTime = (d: string) => {
  if (!d) return '-'
  return new Date(d).toLocaleString('id-ID', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  })
}

const handleRowClick = (row: any) => {
  selectedLog.value = row
}
</script>

<template>
  <div>
    <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="font-display text-2xl font-bold text-[var(--ca-text)]">Audit Log</h1>
        <p class="mt-1 text-sm text-[var(--ca-muted)]">Riwayat aktivitas admin</p>
      </div>
      <div class="w-48">
        <SearchSelect
          id="resource-filter"
          v-model="resourceFilter"
          placeholder="Semua Resource"
          :options="[
            { label: 'Semua Resource', value: '' },
            { label: 'Articles', value: 'articles' },
            { label: 'Admin Users', value: 'admin_users' },
            { label: 'Bot Schedules', value: 'bot_schedules' },
            { label: 'Files', value: 'files' },
          ]"
        />
      </div>
    </div>

    <DataTable
      :columns="columns"
      :data="tableData"
      :loading="loading"
      empty-icon="lucide:scroll-text"
      empty-text="Belum ada aktivitas"
      @row-click="handleRowClick"
    />

    <!-- Pagination -->
    <div v-if="totalItems > 20" class="mt-4 flex items-center justify-between">
      <p class="text-xs text-[var(--ca-muted)]">{{ totalItems }} entri total</p>
      <div class="flex gap-2">
        <button
          type="button"
          class="ca-btn-secondary !px-3 !py-1.5 text-xs"
          :disabled="currentPage <= 1"
          @click="currentPage--; fetchLogs(currentPage, resourceFilter)"
        >
          Prev
        </button>
        <span class="flex items-center px-2 text-xs text-[var(--ca-muted)]">{{ currentPage }}</span>
        <button
          type="button"
          class="ca-btn-secondary !px-3 !py-1.5 text-xs"
          :disabled="currentPage * 20 >= totalItems"
          @click="currentPage++; fetchLogs(currentPage, resourceFilter)"
        >
          Next
        </button>
      </div>
    </div>

    <!-- Detail Modal -->
    <Teleport to="body">
      <div v-if="selectedLog" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" @click.self="selectedLog = null">
        <div class="ca-card w-full max-w-lg p-6">
          <div class="flex items-start justify-between mb-5">
            <div class="flex items-center gap-3">
              <div class="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--ca-panel-bg-strong)]">
                <Icon name="lucide:scroll-text" class="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <h3 class="font-display text-lg font-bold text-[var(--ca-text)]">Detail Log</h3>
                <span class="rounded-full px-2 py-0.5 text-[0.6rem] font-bold uppercase" :class="actionColor(selectedLog.action)">
                  {{ actionLabel(selectedLog.action) }}
                </span>
              </div>
            </div>
            <button type="button" class="rounded-lg p-1.5 text-[var(--ca-subtle)] hover:bg-[var(--ca-panel-bg-strong)]" @click="selectedLog = null">
              <Icon name="lucide:x" class="h-5 w-5" />
            </button>
          </div>

          <div class="space-y-3">
            <!-- Description -->
            <div class="rounded-lg border border-[color:var(--ca-border)] bg-[var(--ca-panel-bg)] p-3">
              <p class="text-sm text-[var(--ca-text)]">{{ selectedLog.description || `${selectedLog.action} ${selectedLog.resource}` }}</p>
            </div>

            <!-- Details grid -->
            <div class="grid grid-cols-2 gap-3">
              <div class="rounded-lg border border-[color:var(--ca-border)] bg-[var(--ca-panel-bg)] p-3">
                <p class="text-[0.65rem] font-semibold uppercase tracking-widest text-[var(--ca-subtle)]">User</p>
                <p class="mt-1 text-sm font-medium text-[var(--ca-text)]">{{ selectedLog.user_name || 'System' }}</p>
              </div>
              <div class="rounded-lg border border-[color:var(--ca-border)] bg-[var(--ca-panel-bg)] p-3">
                <p class="text-[0.65rem] font-semibold uppercase tracking-widest text-[var(--ca-subtle)]">Resource</p>
                <p class="mt-1 text-sm font-medium text-[var(--ca-text)]">{{ selectedLog.resource || '-' }}</p>
              </div>
              <div class="rounded-lg border border-[color:var(--ca-border)] bg-[var(--ca-panel-bg)] p-3">
                <p class="text-[0.65rem] font-semibold uppercase tracking-widest text-[var(--ca-subtle)]">IP Address</p>
                <p class="mt-1 font-mono text-sm text-[var(--ca-text)]">{{ selectedLog.ip_address || '-' }}</p>
              </div>
              <div class="rounded-lg border border-[color:var(--ca-border)] bg-[var(--ca-panel-bg)] p-3">
                <p class="text-[0.65rem] font-semibold uppercase tracking-widest text-[var(--ca-subtle)]">Waktu</p>
                <p class="mt-1 text-sm text-[var(--ca-text)]">{{ formatDateTime(selectedLog.created_at) }}</p>
              </div>
            </div>

            <!-- Resource ID -->
            <div v-if="selectedLog.resource_id" class="rounded-lg border border-[color:var(--ca-border)] bg-[var(--ca-panel-bg)] p-3">
              <p class="text-[0.65rem] font-semibold uppercase tracking-widest text-[var(--ca-subtle)]">Resource ID</p>
              <p class="mt-1 font-mono text-xs text-[var(--ca-muted)] break-all">{{ selectedLog.resource_id }}</p>
            </div>
          </div>

          <div class="mt-5 flex justify-end">
            <button type="button" class="ca-btn-secondary" @click="selectedLog = null">Tutup</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
