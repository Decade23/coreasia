<script setup lang="ts">
/**
 * Baris riwayat stok (admin_stok_ruang, ranah usaha): pergerakan TANPA sisi
 * uang dari stock_moves — kode alasan dan sebab rinci lewat kamus (K-F3-2),
 * catatan tidak dikirim (hanya penanda). Jual-beli ada di tab Transaksi.
 * Halaman memegang kursor, saringan produk, dan pager.
 */
import type { GerakStok } from '~/adapters/cashflowRanahBuku'
import { deltaTeks, kuantitas } from '~/adapters/cashflowTampilBuku'

defineProps<{
  baris: GerakStok[]
  /** Saringan produk aktif: nama kolom Produk tidak diulang. */
  satuProduk?: boolean
  labelOrang: (uid: string | null) => string
  memuat?: boolean
}>()
const emit = defineEmits<{ produk: [id: string] }>()
const { tcf, bahasa, formatTanggal } = useCashflowI18n()
const teksDelta = (d: number) => deltaTeks(d, n => kuantitas(n, bahasa.value))
const labelSebab = (m: GerakStok) => {
  if (m.kodeTakDikenal && (m.alasan === 'lain' || m.sebabRinci === 'lain')) return tcf('kode.takDikenal')
  const a = m.alasan ? tcf(`kode.alasanStok.${m.alasan}`) : '—'
  return m.sebabRinci ? `${a} · ${tcf(`kode.sebabRinci.${m.sebabRinci}`)}` : a
}
</script>

<template>
  <ol class="ca-console-dialog divide-y divide-[color:var(--ca-border)] text-sm" :class="{ 'opacity-60': memuat }">
    <li v-for="m in baris" :key="m.id" class="flex flex-wrap items-center gap-x-3 gap-y-0.5 px-4 py-2">
      <span class="w-24 shrink-0 text-xs tabular-nums text-[var(--ca-subtle)]">{{ formatTanggal(m.tanggal) }}</span>
      <span class="min-w-0 flex-1">
        <button v-if="!satuProduk" type="button" class="font-medium text-[var(--ca-text)] underline-offset-2 hover:underline" @click="emit('produk', m.produkId)">{{ m.produk }}</button>
        <span class="text-xs text-[var(--ca-muted)]"><template v-if="!satuProduk"> · </template>{{ labelSebab(m) }}</span>
        <Icon v-if="m.adaCatatan" name="lucide:sticky-note" class="ml-1 inline h-3.5 w-3.5 text-[var(--ca-subtle)]" :aria-label="tcf('stok.adaCatatan')" />
        <span class="block text-xs text-[var(--ca-subtle)]">{{ tcf('stok.oleh') }} <span class="font-mono">{{ labelOrang(m.oleh) }}</span></span>
      </span>
      <span class="font-semibold tabular-nums" :class="m.delta < 0 ? 'text-[var(--ca-danger-text)]' : m.delta > 0 ? 'text-[var(--ca-emerald-text)]' : 'text-[var(--ca-text)]'">{{ teksDelta(m.delta) }}</span>
    </li>
  </ol>
</template>
