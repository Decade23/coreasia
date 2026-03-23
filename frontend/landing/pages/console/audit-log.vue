<script setup lang="ts">
definePageMeta({ layout: 'console', middleware: 'console' })

const { logs, loading, error, totalItems, fetchLogs } = useAuditLogs()
const { tc } = useConsoleI18n()
const { formatDateTime } = useConsoleDateTime()
const currentPage = ref(1)
const resourceFilter = ref('')
const selectedLog = ref<any>(null)

onMounted(() => fetchLogs(1, ''))

watch(resourceFilter, (val) => {
  currentPage.value = 1
  fetchLogs(1, val)
})

const actionOptions = computed(() => [
  { label: tc('audit.actions.create'), value: 'create', class: 'bg-cyan-500/10 text-cyan-400' },
  { label: tc('audit.actions.update'), value: 'update', class: 'bg-amber-500/10 text-amber-400' },
  { label: tc('audit.actions.delete'), value: 'delete', class: 'bg-rose-500/10 text-rose-400' },
  { label: tc('audit.actions.login'), value: 'login', class: 'bg-purple-500/10 text-purple-400' },
  { label: tc('audit.actions.publish'), value: 'publish', class: 'bg-emerald-500/10 text-emerald-400' },
  { label: tc('audit.actions.unpublish'), value: 'unpublish', class: 'bg-slate-500/10 text-[var(--ca-muted)]' },
  { label: tc('audit.actions.upload'), value: 'upload', class: 'bg-blue-500/10 text-blue-400' },
  { label: tc('audit.actions.ai_generate'), value: 'ai_generate', class: 'bg-violet-500/10 text-violet-400' },
  { label: tc('audit.actions.trigger'), value: 'trigger', class: 'bg-orange-500/10 text-orange-400' },
  { label: tc('audit.actions.copy'), value: 'copy', class: 'bg-sky-500/10 text-sky-400' },
])

const columns = computed(() => [
  { key: 'action', label: tc('common.actions'), type: 'badge' as const, options: actionOptions.value, width: '120px' },
  { key: 'description', label: tc('audit.descriptionLabel'), type: 'text' as const, class: 'text-[var(--ca-text)]' },
  { key: 'user_name', label: tc('audit.user'), type: 'text' as const },
  { key: 'resource', label: tc('audit.resource'), type: 'status' as const },
  { key: 'ip_address', label: tc('audit.ipAddress'), type: 'text' as const, width: '120px' },
  { key: 'created_at', label: tc('audit.time'), type: 'date' as const, width: '160px' },
])

const resourceOptions = computed(() => [
  { label: tc('audit.allResources'), value: '' },
  { label: tc('audit.filters.articles'), value: 'articles' },
  { label: tc('audit.filters.adminUsers'), value: 'admin_users' },
  { label: tc('audit.filters.botSchedules'), value: 'bot_schedules' },
  { label: tc('audit.filters.files'), value: 'files' },
])

const tableData = computed(() =>
  logs.value.map(log => ({
    ...log,
    description: log.description || `${log.action} ${log.resource}`,
  }))
)

const actionLabel = (action: string) => {
  return actionOptions.value.find(o => o.value === action)?.label || action
}

const actionColor = (action: string) => {
  return actionOptions.value.find(o => o.value === action)?.class || 'bg-slate-500/10 text-[var(--ca-muted)]'
}

const handleRowClick = (row: any) => {
  selectedLog.value = row
}
</script>

<template>
  <div>
    <ConsolePageHeader
      :kicker="tc('audit.kicker')"
      icon="lucide:scroll-text"
      :title="tc('audit.title')"
      :description="tc('audit.description')"
    >
      <template #actions>
        <SearchSelect
          id="resource-filter"
          v-model="resourceFilter"
          :placeholder="tc('audit.allResources')"
          :options="resourceOptions"
        />
      </template>
    </ConsolePageHeader>

    <DataTable
      :columns="columns"
      :data="tableData"
      :loading="loading"
      empty-icon="lucide:scroll-text"
      :empty-text="tc('audit.empty')"
      @row-click="handleRowClick"
    />

    <!-- Pagination -->
    <div v-if="totalItems > 20" class="mt-4 flex items-center justify-between">
      <p class="text-xs text-[var(--ca-muted)]">{{ tc('common.totalEntries', { count: totalItems }) }}</p>
      <div class="flex gap-2">
        <button
          type="button"
          class="ca-btn-secondary !px-3 !py-1.5 text-xs"
          :disabled="currentPage <= 1"
          @click="currentPage--; fetchLogs(currentPage, resourceFilter)"
        >
          {{ tc('audit.previous') }}
        </button>
        <span class="flex items-center px-2 text-xs text-[var(--ca-muted)]">{{ currentPage }}</span>
        <button
          type="button"
          class="ca-btn-secondary !px-3 !py-1.5 text-xs"
          :disabled="currentPage * 20 >= totalItems"
          @click="currentPage++; fetchLogs(currentPage, resourceFilter)"
        >
          {{ tc('audit.next') }}
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
                <h3 class="font-display text-lg font-bold text-[var(--ca-text)]">{{ tc('audit.detailTitle') }}</h3>
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
                <p class="text-[0.65rem] font-semibold uppercase tracking-widest text-[var(--ca-subtle)]">{{ tc('audit.user') }}</p>
                <p class="mt-1 text-sm font-medium text-[var(--ca-text)]">{{ selectedLog.user_name || tc('audit.system') }}</p>
              </div>
              <div class="rounded-lg border border-[color:var(--ca-border)] bg-[var(--ca-panel-bg)] p-3">
                <p class="text-[0.65rem] font-semibold uppercase tracking-widest text-[var(--ca-subtle)]">{{ tc('audit.resource') }}</p>
                <p class="mt-1 text-sm font-medium text-[var(--ca-text)]">{{ selectedLog.resource || '-' }}</p>
              </div>
              <div class="rounded-lg border border-[color:var(--ca-border)] bg-[var(--ca-panel-bg)] p-3">
                <p class="text-[0.65rem] font-semibold uppercase tracking-widest text-[var(--ca-subtle)]">{{ tc('audit.ipAddress') }}</p>
                <p class="mt-1 font-mono text-sm text-[var(--ca-text)]">{{ selectedLog.ip_address || '-' }}</p>
              </div>
              <div class="rounded-lg border border-[color:var(--ca-border)] bg-[var(--ca-panel-bg)] p-3">
                <p class="text-[0.65rem] font-semibold uppercase tracking-widest text-[var(--ca-subtle)]">{{ tc('audit.time') }}</p>
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
            <button type="button" class="ca-btn-secondary" @click="selectedLog = null">{{ tc('common.close') }}</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
