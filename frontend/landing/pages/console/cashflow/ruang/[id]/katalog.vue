<script setup lang="ts">
/**
 * Ruang 360 › Katalog (kategori + anggaran) — ranah `katalog` (admin_katalog_ruang, migrasi 0095).
 * Ranah ditambah saat tab diaktifkan pengguna (CashflowPanelTab aktivasi)
 * atau lewat "Muat data"; sebelum kasus memegang ranah itu, RPC tab tidak
 * dipanggil (useCashflowRanahBuku). Isi di CashflowTabKatalog.
 *
 * Bulan hanya di memori (null = bulan WIB kini, bawaan server). Jawaban
 * terakhir tetap tampil selama bulan lain dimuat, supaya tombol bulan tidak
 * hilang di tengah jalan.
 */
import type { Katalog } from '~/adapters/cashflowRanahBuku'

definePageMeta({
  layout: 'console',
  middleware: ['console', 'cashflow-admin'],
  scrollToTop: (to, from) => to.params.id !== from.params.id,
})
const { tcf } = useCashflowI18n()
const { id, dasar, labelOrang } = useCashflowRuang()
const kasus = useCashflowKasus()
const bulan = ref<string | null>(null)
const r = useCashflowRanahBuku().katalog(() => id.value, () => bulan.value)
const tampil = shallowRef<Katalog | null>(null)
watch(r.data, (d) => { if (d) tampil.value = d }, { immediate: true })
// Kasus berganti: jawaban kasus lama tidak dipakai sebagai tampilan sementara.
watch(kasus.kunciKasus, () => { tampil.value = r.data.value })
</script>

<template>
  <div class="space-y-4">
    <p class="text-sm text-[var(--ca-muted)]">{{ tcf('katalog.ket') }}</p>
    <CashflowPanelTab ranah="katalog" aktivasi :memuat="r.memuat.value" :galat="r.galat.value" :pesan-galat="r.pesanGalat.value" :ada-data="!!tampil">
      <CashflowTabKatalog v-if="tampil" :katalog="tampil" :dasar="dasar" :label-orang="labelOrang" :memuat="r.memuat.value" @bulan="b => (bulan = b)" />
    </CashflowPanelTab>
  </div>
</template>
