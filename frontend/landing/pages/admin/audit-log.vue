<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin' })

const { logs, loading, error, totalItems, fetchLogs } = useAuditLogs()
const currentPage = ref(1)
const resourceFilter = ref('')

onMounted(() => fetchLogs())

watch(resourceFilter, (val) => fetchLogs(1, val))

const formatDate = (d: string) => new Date(d).toLocaleString('id-ID', {
  year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
})

const actionColor = (action: string) => {
  const colors: Record<string, string> = {
    create: 'bg-cyan-500/10 text-cyan-400',
    update: 'bg-amber-500/10 text-amber-400',
    delete: 'bg-rose-500/10 text-rose-400',
    login: 'bg-purple-500/10 text-purple-400',
    publish: 'bg-emerald-500/10 text-emerald-400',
    unpublish: 'bg-slate-500/10 text-[var(--ca-muted)]',
    upload: 'bg-blue-500/10 text-blue-400',
    ai_generate: 'bg-violet-500/10 text-violet-400',
  }
  return colors[action] || 'bg-slate-500/10 text-[var(--ca-muted)]'
}
</script>

<template>
  <div>
    <div class="mb-6">
      <h1 class="font-display text-2xl font-bold text-[var(--ca-text)]">Audit Log</h1>
      <p class="mt-1 text-sm text-[var(--ca-muted)]">Riwayat aktivitas admin</p>
    </div>

    <div class="mb-4">
      <select v-model="resourceFilter" class="ca-field-control border-[color:var(--ca-border)] w-48">
        <option value="">Semua Resource</option>
        <option value="articles">Articles</option>
        <option value="admin_users">Admin Users</option>
        <option value="files">Files</option>
      </select>
    </div>

    <div v-if="loading" class="ca-card p-10 text-center">
      <Icon name="lucide:loader-2" class="mx-auto h-8 w-8 animate-spin text-[var(--ca-subtle)]" />
    </div>

    <div v-else-if="!logs.length" class="ca-card p-10 text-center">
      <Icon name="lucide:scroll-text" class="mx-auto h-12 w-12 text-[var(--ca-subtle)]" />
      <p class="mt-3 text-sm text-[var(--ca-muted)]">Belum ada aktivitas</p>
    </div>

    <div v-else class="space-y-2">
      <div v-for="log in logs" :key="log.id" class="ca-card flex items-start gap-4 p-4">
        <span class="mt-0.5 rounded-full px-2 py-0.5 text-[0.65rem] font-bold uppercase" :class="actionColor(log.action)">
          {{ log.action }}
        </span>
        <div class="flex-1 min-w-0">
          <p class="text-sm text-[var(--ca-text)]">{{ log.description || `${log.action} ${log.resource}` }}</p>
          <div class="mt-1 flex flex-wrap gap-3 text-xs text-[var(--ca-subtle)]">
            <span v-if="log.user_name">{{ log.user_name }}</span>
            <span>{{ log.resource }}</span>
            <span v-if="log.ip_address">{{ log.ip_address }}</span>
          </div>
        </div>
        <span class="shrink-0 text-xs text-[var(--ca-subtle)]">{{ formatDate(log.created_at) }}</span>
      </div>

      <!-- Pagination -->
      <div v-if="totalItems > 20" class="mt-4 flex items-center justify-between">
        <p class="text-xs text-[var(--ca-muted)]">{{ totalItems }} entri</p>
        <div class="flex gap-2">
          <button type="button" class="ca-btn-secondary !px-3 !py-1.5 text-xs" :disabled="currentPage <= 1" @click="currentPage--; fetchLogs(currentPage, resourceFilter)">Prev</button>
          <button type="button" class="ca-btn-secondary !px-3 !py-1.5 text-xs" :disabled="currentPage * 20 >= totalItems" @click="currentPage++; fetchLogs(currentPage, resourceFilter)">Next</button>
        </div>
      </div>
    </div>
  </div>
</template>
