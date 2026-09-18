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
  /** Sortable — hanya berlaku di mode urut terkendali (prop `sort`) */
  sortable?: boolean
  /** Kelas untuk <th> (opt-in). Pasangan `class` milik <td>: kolom yang
   *  disembunyikan di layar sempit menyembunyikan kepalanya juga. */
  headerClass?: string
}

interface Props {
  columns: Column[]
  data: any[]
  loading?: boolean
  emptyIcon?: string
  emptyText?: string
  /** OPT-IN: urut terkendali. Bila diisi (termasuk null), kepala kolom
   *  `sortable` bisa diklik dan tabel HANYA memancarkan `sort`; pemanggil yang
   *  mengurutkan seluruh baris sebelum memotongnya per halaman. Tanpa prop ini
   *  tabel tampil persis seperti sebelumnya. */
  sort?: { key: string; arah: 'asc' | 'desc' } | null
  /** OPT-IN: saringan kolom terkendali (v-model:filters). Bila diisi, tabel
   *  tidak menyaring `data` sendiri — pemanggil menyaring SEMUA baris, bukan
   *  hanya halaman yang tampil. */
  filters?: Record<string, string>
  /** Baris "n dari m entri" di bawah tabel. */
  showCount?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  emptyIcon: 'lucide:inbox',
  emptyText: 'Tidak ada data',
  sort: undefined,
  filters: undefined,
  showCount: true,
})
const { tc } = useConsoleI18n()
const { formatDateTime } = useConsoleDateTime()

const emit = defineEmits<{
  'row-click': [row: any]
  'sort': [key: string]
  'update:filters': [filters: Record<string, string>]
}>()

const modeUrut = computed(() => props.sort !== undefined)
const saringTerkendali = computed(() => props.filters !== undefined)
const ariaSort = (key: string) => {
  if (!modeUrut.value) return undefined
  if (props.sort?.key !== key) return 'none'
  return props.sort.arah === 'asc' ? 'ascending' : 'descending'
}

// Per-column filters
const columnFilters = ref<Record<string, string>>({ ...(props.filters ?? {}) })
const activeFilter = ref<string | null>(null)
const filterRef = ref<HTMLElement | null>(null)

// Mode terkendali: isian kolom tetap di columnFilters (template tidak berubah),
// dicerminkan dua arah dengan prop `filters`. Mode lama tidak menyentuh ini.
watch(columnFilters, (v) => {
  if (!saringTerkendali.value) return
  const bersih = Object.fromEntries(Object.entries(v).filter(([, isi]) => !!isi))
  if (JSON.stringify(bersih) !== JSON.stringify(props.filters ?? {})) emit('update:filters', bersih)
}, { deep: true })
watch(() => props.filters, (v) => {
  if (!saringTerkendali.value) return
  const kini = Object.fromEntries(Object.entries(columnFilters.value).filter(([, isi]) => !!isi))
  if (JSON.stringify(kini) !== JSON.stringify(v ?? {})) columnFilters.value = { ...(v ?? {}) }
}, { deep: true })

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
  if (saringTerkendali.value) return props.data
  let result = [...props.data]
  for (const [key, value] of Object.entries(columnFilters.value)) {
    if (!value) continue
    const col = props.columns.find(c => c.key === key)
    if (!col) continue

    if (col.type === 'date') {
      result = result.filter(row => {
        const d = row[key]
        if (!d) return false
        return formatDateTime(d).toLowerCase().includes(value.toLowerCase())
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

const formatDate = (d: string) => formatDateTime(d)
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
        {{ tc('common.clearAll') }}
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
    <div v-else class="ca-console-table-wrap ca-scrollbar">
      <table class="ca-console-table">
        <thead class="sticky top-0 z-10">
          <tr>
            <th
              v-for="col in columns"
              :key="col.key"
              class="relative"
              :class="col.headerClass"
              :style="col.width ? { width: col.width } : undefined"
              :aria-sort="ariaSort(col.key)"
            >
              <div class="flex items-center gap-1.5">
                <button
                  v-if="modeUrut && col.sortable"
                  type="button"
                  class="inline-flex items-center gap-1 uppercase transition hover:text-[var(--ca-text)]"
                  :class="sort?.key === col.key ? 'text-[var(--ca-text)]' : ''"
                  @click.stop="emit('sort', col.key)"
                >
                  {{ col.label }}
                  <Icon
                    :name="sort?.key !== col.key ? 'lucide:chevrons-up-down' : sort.arah === 'asc' ? 'lucide:arrow-up' : 'lucide:arrow-down'"
                    class="h-3 w-3"
                    :class="sort?.key === col.key ? '' : 'opacity-40'"
                  />
                </button>
                <span v-else>{{ col.label }}</span>
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
                class="ca-console-dialog absolute left-0 top-full z-20 mt-2 w-56 p-3"
                @click.stop
              >
                <p class="mb-2 text-[0.65rem] font-bold uppercase tracking-widest text-[var(--ca-subtle)]">
                  Filter: {{ col.label }}
                </p>

                <!-- Text/date filter -->
                <template v-if="!col.type || col.type === 'text' || col.type === 'date'">
                  <BaseInput
                    :id="`filter-${col.key}`"
                    v-model="columnFilters[col.key]"
                    type="text"
                    input-class="text-xs"
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
                      {{ tc('common.all') }}
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
                    {{ tc('common.reset') }}
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
            class="cursor-pointer"
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
      <div v-if="showCount" class="mt-3 px-4 text-xs text-[var(--ca-subtle)]">
        {{ filteredData.length }} dari {{ data.length }} entri
      </div>
    </div>
  </div>
</template>
