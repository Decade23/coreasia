<script setup lang="ts">
/**
 * Nominal rupiah bernada: masuk --ca-emerald-text, keluar --ca-danger-text,
 * kaki transfer --ca-info-text (bukan uang masuk/keluar sungguhan). Tanda
 * (+/−) ikut tertulis — warna saja tidak cukup untuk pembaca buta warna.
 */
import { rupiah } from '~/adapters/cashflow'
import type { JenisUang } from '~/adapters/cashflowBuku'

const props = withDefaults(defineProps<{ nilai: number | null; jenis?: JenisUang | null; arah?: 'masuk' | 'keluar' | null }>(), { jenis: null, arah: null })

const tanda = computed(() => {
  const a = props.jenis === 'transfer' ? props.arah : (props.jenis ?? props.arah)
  return a === 'masuk' ? '+' : a === 'keluar' ? '−' : ''
})
const nada = computed(() => {
  if (props.jenis === 'transfer') return 'text-[var(--ca-info-text)]'
  const a = props.jenis ?? props.arah
  return a === 'masuk' ? 'text-[var(--ca-emerald-text)]' : a === 'keluar' ? 'text-[var(--ca-danger-text)]' : 'text-[var(--ca-text)]'
})
</script>

<template>
  <span class="whitespace-nowrap tabular-nums" :class="nada">{{ nilai == null ? '—' : `${tanda}${rupiah(nilai)}` }}</span>
</template>
