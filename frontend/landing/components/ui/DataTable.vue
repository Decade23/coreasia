<script setup lang="ts">
/**
 * Smart DataTable with per-column filtering.
 * Detects column types (text, date, status) and provides appropriate filter UIs.
 */

interface Column {
  key: string
  label: string
  type?: 'text' | 'date' | 'status' | 'badge'
  /** For status/badge columns: distinct values for filter dropdown */
  options?: Array<{ label: string; value: string; class?: string }>
  /** Custom render class */
  class?: string
  /** Column width */
  width?: string
  /** Sortable */
  sortable?: boolean
}

interface Props {
  columns: Column[]
  data: any[]
  loading?: boolean
  emptyIcon?: string
  emptyText?: string
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  emptyIcon: 'lucide:inbox',
  emptyText: 'Tidak ada data',
})

const emit = defineEmits<{
  'row-click': [row: any]
}>()

// Per-column filters
const columnFilters = ref<Record<string, string>>({})
const activeFilter = ref<string | null>(null)
const filterRef = ref<HTMLElement | null>(null)

const toggleFilter = (key: string) => {
  activeFilter.value = activeFilter.value === key ? null : key
}

const clearFilter = (key: string) => {
  columnFilters.value[key] = ''
  activeFilter.value = null
}

// Click outside to close filter
if (import.meta.client) {
  const onClick = (e: MouseEvent) => {
    if (activeFilter.value && filterRef.value && !filterRef.value.contains(e.target as Node)) {
      activeFilter.value = null
    }
  }
  onMounted(() => document.addEventListener('click', onClick))
  onBeforeUnmount(() => document.removeEventListener('click', onClick))
}

// Filtered data
const filteredData = computed(() => {
  let result = [...props.data]
  for (const [key, value] of Object.entries(columnFilters.value)) {
    if (!value) continue
    const col = props.columns.find(c => c.key === key)
    if (!col) continue

    if (col.type === 'date') {
      result = result.filter(row => {
        const d = row[key]
        if (!d) return false
        return new Date(d).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' }).toLowerCase().includes(value.toLowerCase())
      })
    } else if (col.type === 'status' || col.type === 'badge') {
      result = result.filter(row => String(row[key]).toLowerCase() === value.toLowerCase())
    } else {
      result = result.filter(row => {
        const v = row[key]
        if (v == null) return false
        return String(v).toLowerCase().includes(value.toLowerCase())
      })
    }
  }
  return result
})

// Get distinct values for status/badge columns
const getDistinctValues = (key: string, col: Column): Array<{ label: string; value: string }> => {
  if (col.options) return col.options
  const values = [...new Set(props.data.map(r => r[key]).filter(Boolean))]
  return values.map(v => ({ label: String(v), value: String(v) }))
}

const activeFilterCount = computed(() =>
  Object.values(columnFilters.value).filter(Boolean).length
)

const formatDate = (d: string) => {
  if (!d) return '-'
  return new Date(d).toLocaleString('id-ID', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  })
}
</script>

<template>
  <div>
    <!-- Active filters indicator -->
    <div v-if="activeFilterCount > 0" class="mb-3 flex items-center gap-2">
      <span class="text-xs text-[var(--ca-muted)]">{{ activeFilterCount }} filter aktif</span>
      <button
        type="button"
        class="text-xs text-rose-400 hover:text-rose-300 transition"
        @click="columnFilters = {}"
      >
        Hapus semua
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="ca-card p-10 text-center">
      <Icon name="lucide:loader-2" class="mx-auto h-8 w-8 animate-spin text-[var(--ca-subtle)]" />
    </div>

    <!-- Empty -->
    <div v-else-if="!filteredData.length" class="ca-card p-10 text-center">
      <Icon :name="emptyIcon" class="mx-auto h-12 w-12 text-[var(--ca-subtle)]" />
      <p class="mt-3 text-sm text-[var(--ca-muted)]">{{ emptyText }}</p>
    </div>

    <!-- Table -->
    <div v-else class="overflow-x-auto overflow-y-auto max-h-[60vh] ca-scrollbar">
      <table class="w-full">
        <thead class="sticky top-0 z-10 bg-[var(--ca-bg)]">
          <tr class="border-b border-[color:var(--ca-border)]">
            <th
              v-for="col in columns"
              :key="col.key"
              class="relative px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--ca-muted)]"
              :style="col.width ? { width: col.width } : undefined"
            >
              <div class="flex items-center gap-1.5">
                <span>{{ col.label }}</span>
                <!-- Column filter trigger -->
                <CaTooltip :text="`Filter ${col.label}`">
                  <button
                    type="button"
                    class="rounded p-0.5 transition"
                    :class="columnFilters[col.key] ? 'text-brand-primary' : 'text-[var(--ca-subtle)] hover:text-[var(--ca-muted)]'"
                    @click.stop="toggleFilter(col.key)"
                  >
                    <Icon name="lucide:more-vertical" class="h-3.5 w-3.5" />
                  </button>
                </CaTooltip>
              </div>

              <!-- Filter dropdown -->
              <div
                v-if="activeFilter === col.key"
                ref="filterRef"
                class="absolute left-0 top-full z-20 mt-1 w-56 rounded-xl border border-[color:var(--ca-border)] bg-[var(--ca-bg)] p-3 shadow-xl"
                @click.stop
              >
                <p class="mb-2 text-[0.65rem] font-bold uppercase tracking-widest text-[var(--ca-subtle)]">
                  Filter: {{ col.label }}
                </p>

                <!-- Text/date filter -->
                <template v-if="!col.type || col.type === 'text' || col.type === 'date'">
                  <input
                    v-model="columnFilters[col.key]"
                    type="text"
                    class="ca-field-control w-full border-[color:var(--ca-border)] text-xs"
                    :placeholder="col.type === 'date' ? 'Mar 2026, dll' : `Cari ${col.label.toLowerCase()}...`"
                  />
                </template>

                <!-- Status/badge filter -->
                <template v-else-if="col.type === 'status' || col.type === 'badge'">
                  <div class="max-h-40 space-y-1 overflow-y-auto">
                    <button
                      type="button"
                      class="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs transition"
                      :class="!columnFilters[col.key] ? 'bg-[var(--ca-kicker-bg)] text-brand-primary' : 'text-[var(--ca-muted)] hover:bg-[var(--ca-panel-bg-strong)]'"
                      @click="clearFilter(col.key)"
                    >
                      Semua
                    </button>
                    <button
                      v-for="opt in getDistinctValues(col.key, col)"
                      :key="opt.value"
                      type="button"
                      class="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs transition"
                      :class="columnFilters[col.key] === opt.value ? 'bg-[var(--ca-kicker-bg)] text-brand-primary' : 'text-[var(--ca-muted)] hover:bg-[var(--ca-panel-bg-strong)]'"
                      @click="columnFilters[col.key] = opt.value; activeFilter = null"
                    >
                      {{ opt.label }}
                    </button>
                  </div>
                </template>

                <div class="mt-2 flex justify-end">
                  <button
                    type="button"
                    class="text-[0.65rem] text-rose-400 hover:text-rose-300"
                    @click="clearFilter(col.key)"
                  >
                    Reset
                  </button>
                </div>
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(row, i) in filteredData"
            :key="i"
            class="border-b border-[color:var(--ca-border)] transition hover:bg-[var(--ca-panel-bg)] cursor-pointer"
            @click="emit('row-click', row)"
          >
            <td
              v-for="col in columns"
              :key="col.key"
              class="px-4 py-3 text-sm"
              :class="col.class || 'text-[var(--ca-muted)]'"
            >
              <slot :name="`cell-${col.key}`" :row="row" :value="row[col.key]">
                <template v-if="col.type === 'date'">
                  {{ formatDate(row[col.key]) }}
                </template>
                <template v-else-if="col.type === 'badge'">
                  <span
                    class="rounded-full px-2 py-0.5 text-[0.68rem] font-bold uppercase"
                    :class="col.options?.find(o => o.value === row[col.key])?.class || 'bg-slate-500/10 text-[var(--ca-muted)]'"
                  >
                    {{ row[col.key] }}
                  </span>
                </template>
                <template v-else>
                  {{ row[col.key] ?? '-' }}
                </template>
              </slot>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Result count -->
      <div class="mt-3 px-4 text-xs text-[var(--ca-subtle)]">
        {{ filteredData.length }} dari {{ data.length }} entri
      </div>
    </div>
  </div>
</template>
