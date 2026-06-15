<script setup lang="ts">
definePageMeta({ layout: 'console', middleware: 'console' })

const { tc } = useConsoleI18n()
const { can } = usePermissions()
const cad = useCadConsole()
const { licenses, devices, summary, loading, saving } = cad

type Tab = 'analytics' | 'licenses' | 'devices'
const tab = ref<Tab>('analytics')

const showImport = ref(false)
const importText = ref('')
const importTier = ref('lifetime')
const deleteTarget = ref<string | null>(null)

const loadTab = async (t: Tab) => {
  tab.value = t
  if (t === 'analytics') await cad.fetchAnalytics()
  else if (t === 'licenses') await cad.fetchLicenses()
  else await cad.fetchDevices()
}

onMounted(() => loadTab('analytics'))

const submitImport = async () => {
  const keys = importText.value.split('\n').map(s => s.trim()).filter(Boolean)
  if (!keys.length) return
  const okk = await cad.importKeys(keys, importTier.value)
  if (okk) {
    showImport.value = false
    importText.value = ''
  }
}

const confirmDelete = async () => {
  if (deleteTarget.value) {
    await cad.deleteLicense(deleteTarget.value)
    deleteTarget.value = null
  }
}

const barWidth = (count: number, arr: { count: number }[]) => {
  const max = Math.max(1, ...arr.map(a => a.count))
  return Math.round((count / max) * 100)
}
const fmtDate = (s: string | null) => (s ? new Date(s).toLocaleDateString('id-ID') : '-')
const shortHash = (h: string) => (h ? h.slice(0, 12) + '…' : '-')
const statusClass = (s: string) =>
  s === 'active'
    ? 'bg-emerald-500/10 text-emerald-400'
    : s === 'revoked'
      ? 'bg-rose-500/10 text-rose-400'
      : 'bg-amber-500/10 text-amber-400'

const tabs: { key: Tab; label: string; icon: string; perm: string }[] = [
  { key: 'analytics', label: tc('cad.tabAnalytics'), icon: 'lucide:bar-chart-3', perm: 'cad:analytics:view' },
  { key: 'licenses', label: tc('cad.tabLicenses'), icon: 'lucide:key-round', perm: 'cad:licenses:list' },
  { key: 'devices', label: tc('cad.tabDevices'), icon: 'lucide:monitor-smartphone', perm: 'cad:devices:list' },
]
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 class="font-display text-2xl font-bold text-[var(--ca-text)]">{{ tc('cad.title') }}</h1>
        <p class="mt-1 text-sm text-[var(--ca-muted)]">{{ tc('cad.subtitle') }}</p>
      </div>
      <button
        v-if="can('cad:licenses:import')"
        type="button"
        class="ca-btn-primary"
        @click="showImport = true"
      >
        <Icon name="lucide:upload" class="h-4 w-4" />
        {{ tc('cad.import') }}
      </button>
    </div>

    <!-- Tabs -->
    <div class="flex flex-wrap gap-2">
      <button
        v-for="t in tabs"
        :key="t.key"
        v-show="can(t.perm)"
        type="button"
        class="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition"
        :class="tab === t.key
          ? 'border-[color:var(--ca-gold-border)] bg-[var(--ca-panel-bg-strong)] text-[var(--ca-text)]'
          : 'border-[color:var(--ca-border)] text-[var(--ca-muted)] hover:text-[var(--ca-text)]'"
        @click="loadTab(t.key)"
      >
        <Icon :name="t.icon" class="h-4 w-4" />
        {{ t.label }}
      </button>
    </div>

    <!-- ANALYTICS -->
    <div v-if="tab === 'analytics'" class="space-y-5">
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div class="ca-card p-5">
          <p class="text-xs uppercase tracking-wide text-[var(--ca-subtle)]">{{ tc('cad.totalLicenses') }}</p>
          <p class="mt-2 text-2xl font-bold text-[var(--ca-text)]">{{ summary?.total_licenses ?? 0 }}</p>
        </div>
        <div class="ca-card p-5">
          <p class="text-xs uppercase tracking-wide text-[var(--ca-subtle)]">{{ tc('cad.activeLicenses') }}</p>
          <p class="mt-2 text-2xl font-bold text-[var(--ca-text)]">{{ summary?.active_licenses ?? 0 }}</p>
        </div>
        <div class="ca-card p-5">
          <p class="text-xs uppercase tracking-wide text-[var(--ca-subtle)]">{{ tc('cad.totalDevices') }}</p>
          <p class="mt-2 text-2xl font-bold text-[var(--ca-text)]">{{ summary?.total_devices ?? 0 }}</p>
        </div>
        <div class="ca-card p-5">
          <p class="text-xs uppercase tracking-wide text-[var(--ca-subtle)]">{{ tc('cad.activeDevices') }}</p>
          <p class="mt-2 text-2xl font-bold text-[var(--ca-text)]">{{ summary?.active_devices ?? 0 }}</p>
        </div>
      </div>

      <div class="grid gap-4 lg:grid-cols-2">
        <div class="ca-card p-5">
          <h3 class="mb-3 text-sm font-semibold text-[var(--ca-text)]">{{ tc('cad.byVersion') }}</h3>
          <p v-if="!summary?.by_version?.length" class="text-sm text-[var(--ca-muted)]">{{ tc('cad.noData') }}</p>
          <div v-for="row in summary?.by_version || []" :key="row.label" class="mb-2">
            <div class="flex justify-between text-xs text-[var(--ca-muted)]">
              <span>{{ row.label }}</span><span>{{ row.count }}</span>
            </div>
            <div class="mt-1 h-2 rounded-full bg-[var(--ca-panel-bg-strong)]">
              <div class="h-2 rounded-full bg-[var(--ca-accent)]" :style="{ width: barWidth(row.count, summary?.by_version || []) + '%' }" />
            </div>
          </div>
        </div>
        <div class="ca-card p-5">
          <h3 class="mb-3 text-sm font-semibold text-[var(--ca-text)]">{{ tc('cad.byOs') }}</h3>
          <p v-if="!summary?.by_os?.length" class="text-sm text-[var(--ca-muted)]">{{ tc('cad.noData') }}</p>
          <div v-for="row in summary?.by_os || []" :key="row.label" class="mb-2">
            <div class="flex justify-between text-xs text-[var(--ca-muted)]">
              <span>{{ row.label }}</span><span>{{ row.count }}</span>
            </div>
            <div class="mt-1 h-2 rounded-full bg-[var(--ca-panel-bg-strong)]">
              <div class="h-2 rounded-full bg-[var(--ca-accent)]" :style="{ width: barWidth(row.count, summary?.by_os || []) + '%' }" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- LICENSES -->
    <div v-else-if="tab === 'licenses'" class="ca-card overflow-hidden">
      <p class="border-b border-[color:var(--ca-border)] px-4 py-2 text-xs text-[var(--ca-subtle)]">{{ tc('cad.revokeNote') }}</p>
      <div v-if="loading" class="p-6 text-sm text-[var(--ca-muted)]">…</div>
      <p v-else-if="!licenses.length" class="p-6 text-sm text-[var(--ca-muted)]">{{ tc('cad.empty') }}</p>
      <div v-else class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead class="text-xs uppercase text-[var(--ca-subtle)]">
            <tr class="border-b border-[color:var(--ca-border)]">
              <th class="px-4 py-3">{{ tc('cad.colKey') }}</th>
              <th class="px-4 py-3">{{ tc('cad.colEmail') }}</th>
              <th class="px-4 py-3">{{ tc('cad.colTier') }}</th>
              <th class="px-4 py-3">{{ tc('cad.colStatus') }}</th>
              <th class="px-4 py-3">{{ tc('cad.colDevices') }}</th>
              <th class="px-4 py-3">{{ tc('cad.colCreated') }}</th>
              <th class="px-4 py-3 text-right">{{ tc('cad.colActions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="l in licenses" :key="l.id" class="border-b border-[color:var(--ca-border)]/60">
              <td class="px-4 py-3 font-mono text-xs text-[var(--ca-text)]">{{ l.key_masked }}</td>
              <td class="px-4 py-3 text-[var(--ca-muted)]">{{ l.email || '-' }}</td>
              <td class="px-4 py-3 text-[var(--ca-muted)]">{{ l.tier }}</td>
              <td class="px-4 py-3">
                <span class="rounded-full px-2 py-0.5 text-xs font-semibold" :class="statusClass(l.status)">{{ l.status }}</span>
              </td>
              <td class="px-4 py-3 text-[var(--ca-muted)]">{{ l.device_count }} / {{ l.device_limit }}</td>
              <td class="px-4 py-3 text-[var(--ca-muted)]">{{ fmtDate(l.created_at) }}</td>
              <td class="px-4 py-3">
                <div class="flex items-center justify-end gap-1.5">
                  <button v-if="can('cad:licenses:copy')" type="button" class="ca-header-btn !h-8 !min-w-8" :title="tc('cad.copy')" @click="cad.copyKey(l.id)">
                    <Icon name="lucide:copy" class="h-3.5 w-3.5" />
                  </button>
                  <button v-if="can('cad:licenses:update') && l.status === 'active'" type="button" class="ca-header-btn !h-8 !min-w-8" :title="tc('cad.revoke')" :disabled="saving" @click="cad.setStatus(l.id, 'revoked')">
                    <Icon name="lucide:ban" class="h-3.5 w-3.5" />
                  </button>
                  <button v-if="can('cad:licenses:update') && l.status !== 'active'" type="button" class="ca-header-btn !h-8 !min-w-8" :title="tc('cad.activate')" :disabled="saving" @click="cad.setStatus(l.id, 'active')">
                    <Icon name="lucide:check-circle" class="h-3.5 w-3.5" />
                  </button>
                  <button v-if="can('cad:licenses:delete')" type="button" class="ca-header-btn !h-8 !min-w-8 text-rose-400" :title="tc('cad.delete')" @click="deleteTarget = l.id">
                    <Icon name="lucide:trash-2" class="h-3.5 w-3.5" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- DEVICES -->
    <div v-else class="ca-card overflow-hidden">
      <div v-if="loading" class="p-6 text-sm text-[var(--ca-muted)]">…</div>
      <p v-else-if="!devices.length" class="p-6 text-sm text-[var(--ca-muted)]">{{ tc('cad.emptyDevices') }}</p>
      <div v-else class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead class="text-xs uppercase text-[var(--ca-subtle)]">
            <tr class="border-b border-[color:var(--ca-border)]">
              <th class="px-4 py-3">{{ tc('cad.colDevice') }}</th>
              <th class="px-4 py-3">{{ tc('cad.colAppVer') }}</th>
              <th class="px-4 py-3">{{ tc('cad.colOs') }}</th>
              <th class="px-4 py-3">{{ tc('cad.colLastSeen') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="d in devices" :key="d.id" class="border-b border-[color:var(--ca-border)]/60">
              <td class="px-4 py-3 font-mono text-xs text-[var(--ca-text)]">{{ shortHash(d.device_hash) }}</td>
              <td class="px-4 py-3 text-[var(--ca-muted)]">{{ d.app_version || '-' }}</td>
              <td class="px-4 py-3 text-[var(--ca-muted)]">{{ d.os_version || '-' }}</td>
              <td class="px-4 py-3 text-[var(--ca-muted)]">{{ fmtDate(d.last_seen) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Import modal -->
    <ConsoleModal :show="showImport" :title="tc('cad.importTitle')" size="md" @close="showImport = false">
      <div class="space-y-3">
        <p class="text-sm text-[var(--ca-muted)]">{{ tc('cad.importHint') }}</p>
        <textarea
          v-model="importText"
          rows="8"
          class="w-full rounded-xl border border-[color:var(--ca-border)] bg-[var(--ca-panel-bg)] p-3 font-mono text-xs text-[var(--ca-text)]"
          placeholder="CADM-XXXX..."
        />
        <div class="flex justify-end gap-3">
          <button type="button" class="ca-btn-secondary" @click="showImport = false">{{ tc('common.cancel') }}</button>
          <button type="button" class="ca-btn-primary" :disabled="saving" @click="submitImport">{{ tc('cad.importBtn') }}</button>
        </div>
      </div>
    </ConsoleModal>

    <!-- Delete confirm -->
    <ConsoleModal :show="!!deleteTarget" :title="tc('cad.delete')" size="sm" @close="deleteTarget = null">
      <div class="text-center">
        <p class="text-sm text-[var(--ca-muted)]">{{ tc('cad.deleteConfirm') }}</p>
        <div class="mt-6 flex justify-center gap-3">
          <button type="button" class="ca-btn-secondary" @click="deleteTarget = null">{{ tc('common.cancel') }}</button>
          <button type="button" class="ca-btn-danger !px-4 !py-2.5" :disabled="saving" @click="confirmDelete">{{ tc('cad.delete') }}</button>
        </div>
      </div>
    </ConsoleModal>
  </div>
</template>
