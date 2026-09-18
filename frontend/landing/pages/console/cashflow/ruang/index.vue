<script setup lang="ts">
/**
 * Daftar ruang — nama buatan pengguna dan pemilik TERSAMAR.
 *
 * Berkas ini index.vue di dalam folder ruang/, bukan ruang.vue: begitu
 * ruang/[id].vue ada (Fase 2), ruang.vue yang hidup berdampingan dengan
 * folder ruang/ otomatis menjadi INDUK rute, dan tanpa <NuxtPage/> halaman
 * detail dirender kosong.
 *
 * Server memotong di p_limit (maks. 500). Kalau total_semua lebih besar,
 * layar mengatakannya — dulu berhenti di 200 baris tanpa pemberitahuan.
 */
definePageMeta({ layout: 'console', middleware: ['console', 'cashflow-admin'] })
import { samarkanEmail, samarkanNamaRuang, type RuangDTO } from '~/adapters/cashflow'
const { tcf, formatTanggal } = useCashflowI18n()
const api = useCashflowAdmin()
const { memuat, pesanGalat, muat } = useCashflowMuat({ awal: true })

const MAKS = 500
const rows = ref<RuangDTO[]>([])
const total = ref(0)
onMounted(() => muat(async () => {
  rows.value = await api.daftarRuang(MAKS, 0)
  total.value = rows.value.length ? Number(rows.value[0]?.total_semua ?? rows.value.length) : 0
}))

const columns = computed(() => [
  { key: 'nama', label: tcf('ruang.nama'), type: 'text' as const, class: 'text-[var(--ca-text)]' },
  { key: 'pemilik', label: tcf('ruang.pemilik'), type: 'text' as const, class: 'font-mono' },
  { key: 'jumlah_anggota', label: tcf('ruang.anggota'), type: 'text' as const, width: '90px', class: 'tabular-nums text-right' },
  { key: 'jumlah_tx', label: tcf('ruang.tx'), type: 'text' as const, width: '110px', class: 'tabular-nums text-right' },
  { key: 'undangan_aktif', label: tcf('ruang.undangan'), type: 'text' as const, width: '120px', class: 'tabular-nums text-right' },
  { key: 'dibuat', label: tcf('ruang.dibuat'), type: 'text' as const, width: '120px' },
])
const data = computed(() => rows.value.map(r => ({
  ...r, nama: samarkanNamaRuang(r.nama), pemilik: samarkanEmail(r.pemilik_email), dibuat: formatTanggal(r.created_at),
})))
const terpotong = computed(() => total.value > rows.value.length)
</script>

<template>
  <div class="space-y-6">
    <ConsolePageHeader :title="tcf('ruang.judul')" kicker="CashFlow"><template #meta><CashflowNav /></template></ConsolePageHeader>
    <p class="text-sm text-[var(--ca-muted)]">{{ tcf('ruang.ket') }}</p>
    <p v-if="pesanGalat" class="text-sm ca-tone-danger">{{ pesanGalat }}</p>
    <p v-if="terpotong" class="text-xs ca-tone-gold">{{ tcf('umum.potong')(rows.length, total) }}</p>
    <!-- Muat gagal tanpa baris = galat saja; "Belum ada data." di bawahnya terbaca
         seolah produk tidak punya ruang. -->
    <div v-if="!pesanGalat || rows.length" class="ca-console-dialog overflow-hidden">
      <DataTable :columns="columns" :data="data" :loading="memuat" empty-icon="lucide:layers" :empty-text="tcf('umum.kosong')" />
    </div>
  </div>
</template>
