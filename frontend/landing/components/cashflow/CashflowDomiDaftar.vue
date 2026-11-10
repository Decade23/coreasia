<script setup lang="ts">
/** Daftar percakapan Domi satu pengguna: judul, jumlah pesan, waktu. */
import type { Percakapan } from '~/adapters/cashflowDomi'

defineProps<{
  baris: Percakapan[]
  total: number | null
  adaLagi: boolean
  aktif: string | null
  formatWaktu: (v: string | Date | null | undefined) => string
}>()
const emit = defineEmits<{ pilih: [id: string]; lagi: [] }>()
const { tcf } = useCashflowI18n()
</script>

<template>
  <div class="min-w-0">
    <CashflowKeadaanKosong v-if="!baris.length" icon="lucide:message-circle" :pesan="tcf('domi.kosong')" />
    <ul v-else class="divide-y divide-[color:var(--ca-border)] overflow-hidden rounded-xl border border-[color:var(--ca-border)]" :aria-label="tcf('tab.domi')">
      <li v-for="p in baris" :key="p.id">
        <button
          type="button"
          class="w-full px-3 py-2.5 text-left transition hover:bg-[var(--ca-panel-bg-strong)]"
          :class="p.id === aktif ? 'bg-[var(--ca-panel-bg-strong)]' : ''"
          :aria-current="p.id === aktif ? 'true' : undefined"
          @click="emit('pilih', p.id)"
        >
          <span class="block truncate text-sm font-semibold text-[var(--ca-text)]">{{ p.judul || tcf('domi.tanpaJudul') }}</span>
          <span class="mt-0.5 flex items-center gap-2 text-xs text-[var(--ca-muted)]">
            <span>{{ tcf('domi.pesan')(p.jumlahPesan) }}</span>
            <span aria-hidden="true">·</span>
            <span>{{ formatWaktu(p.diperbaruiIso) }}</span>
          </span>
        </button>
      </li>
    </ul>
    <button v-if="adaLagi" type="button" class="ca-btn-secondary mt-2 w-full !px-3 !py-2 text-sm" @click="emit('lagi')">
      {{ tcf('domi.muatLagi') }}
    </button>
    <p v-if="total !== null && baris.length" class="mt-2 text-xs text-[var(--ca-subtle)]">{{ baris.length }} / {{ total }}</p>
  </div>
</template>
