<script setup lang="ts" generic="T extends Record<string, any>">
import { ChevronUp, ChevronDown } from 'lucide-vue-next'

export interface DataTableColumn {
    key: string
    label: string
    sortable?: boolean
    class?: string
    headerClass?: string
}

const props = defineProps<{
    columns: DataTableColumn[]
    data: T[]
    loading?: boolean
    emptyText?: string
}>()

const emit = defineEmits<{
    (e: 'sort', key: string, direction: 'asc' | 'desc'): void
    (e: 'row-click', row: T): void
}>()

const sortKey = ref('')
const sortDir = ref<'asc' | 'desc'>('asc')

const handleSort = (col: DataTableColumn) => {
    if (!col.sortable) return
    if (sortKey.value === col.key) {
        sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
    } else {
        sortKey.value = col.key
        sortDir.value = 'asc'
    }
    emit('sort', sortKey.value, sortDir.value)
}
</script>

<template>
    <div class="ca-card overflow-hidden !rounded-[2rem] p-0">
        <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
                <thead>
                    <tr class="bg-core-900/80 border-b border-white/5">
                        <th
                            v-for="col in columns"
                            :key="col.key"
                            class="p-4 text-xs font-black text-content-subtle uppercase tracking-widest whitespace-nowrap"
                            :class="[col.headerClass, col.sortable ? 'cursor-pointer select-none hover:text-white transition-colors' : '']"
                            @click="handleSort(col)"
                        >
                            <div class="flex items-center gap-1.5">
                                <span>{{ col.label }}</span>
                                <template v-if="col.sortable && sortKey === col.key">
                                    <ChevronUp v-if="sortDir === 'asc'" class="w-3 h-3 text-brand" />
                                    <ChevronDown v-else class="w-3 h-3 text-brand" />
                                </template>
                            </div>
                        </th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-white/5">
                    <tr
                        v-for="(row, idx) in data"
                        :key="idx"
                        class="hover:bg-core-800 transition-colors"
                        @click="emit('row-click', row)"
                    >
                        <td
                            v-for="col in columns"
                            :key="col.key"
                            class="p-4"
                            :class="col.class"
                        >
                            <slot :name="`cell-${col.key}`" :row="row" :value="row[col.key]">
                                {{ row[col.key] }}
                            </slot>
                        </td>
                    </tr>

                    <tr v-if="data.length === 0 && !loading">
                        <td :colspan="columns.length" class="p-8 text-center text-content-subtle text-sm">
                            {{ emptyText || 'Tidak ada data yang ditemukan.' }}
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>
