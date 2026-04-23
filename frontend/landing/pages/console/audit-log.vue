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
  { label: tc('audit.actions.create'), value: 'create', class: 'ca-pill-info' },
  { label: tc('audit.actions.update'), value: 'update', class: 'ca-pill-gold' },
  { label: tc('audit.actions.delete'), value: 'delete', class: 'ca-pill-danger' },
  { label: tc('audit.actions.login'), value: 'login', class: 'ca-pill-info' },
  { label: tc('audit.actions.publish'), value: 'publish', class: 'ca-pill-emerald' },
  { label: tc('audit.actions.unpublish'), value: 'unpublish', class: 'ca-pill-muted' },
  { label: tc('audit.actions.upload'), value: 'upload', class: 'ca-pill-info' },
  { label: tc('audit.actions.ai_generate'), value: 'ai_generate', class: 'ca-pill-gold' },
  { label: tc('audit.actions.trigger'), value: 'trigger', class: 'ca-pill-gold' },
  { label: tc('audit.actions.copy'), value: 'copy', class: 'ca-pill-info' },
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
  return actionOptions.value.find(o => o.value === action)?.class || 'ca-pill-muted'
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

    <ConsoleModal
      :show="!!selectedLog"
      :title="tc('audit.detailTitle')"
      size="lg"
      @close="selectedLog = null"
    >
      <div v-if="selectedLog" class="space-y-4">
        <div>
          <span class="rounded-full px-2 py-0.5 text-[0.6rem] font-bold uppercase" :class="actionColor(selectedLog.action)">
            {{ actionLabel(selectedLog.action) }}
          </span>
        </div>
        <div class="rounded-lg border border-[color:var(--ca-border)] bg-[var(--ca-panel-bg)] p-3">
          <p class="text-sm text-[var(--ca-text)]">{{ selectedLog.description || `${selectedLog.action} ${selectedLog.resource}` }}</p>
        </div>
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
        <div v-if="selectedLog.resource_id" class="rounded-lg border border-[color:var(--ca-border)] bg-[var(--ca-panel-bg)] p-3">
          <p class="text-[0.65rem] font-semibold uppercase tracking-widest text-[var(--ca-subtle)]">Resource ID</p>
          <p class="mt-1 break-all font-mono text-xs text-[var(--ca-muted)]">{{ selectedLog.resource_id }}</p>
        </div>
        <div class="flex justify-end">
          <button type="button" class="ca-btn-secondary" @click="selectedLog = null">{{ tc('common.close') }}</button>
        </div>
      </div>
    </ConsoleModal>
  </div>
</template>
