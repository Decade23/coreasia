<script setup lang="ts">
definePageMeta({ layout: 'console', middleware: 'console' })

const { logs, loading, error, totalItems, fetchLogs } = useAuditLogs()
const currentPage = ref(1)
const resourceFilter = ref('')

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
]

const columns = [
  { key: 'action', label: 'Aksi', type: 'badge' as const, options: actionOptions, width: '120px' },
  { key: 'description', label: 'Deskripsi', type: 'text' as const, class: 'text-[var(--ca-text)]' },
  { key: 'user_name', label: 'User', type: 'text' as const },
  { key: 'resource', label: 'Resource', type: 'status' as const },
  { key: 'ip_address', label: 'IP', type: 'text' as const, width: '120px' },
  { key: 'created_at', label: 'Waktu', type: 'date' as const, width: '160px' },
]

// Map logs to add fallback description
const tableData = computed(() =>
  logs.value.map(log => ({
    ...log,
    description: log.description || `${log.action} ${log.resource}`,
  }))
)
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
  </div>
</template>
