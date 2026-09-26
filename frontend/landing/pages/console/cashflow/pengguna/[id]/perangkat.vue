<script setup lang="ts">
/**
 * Pengguna 360 › Perangkat — ranah `perangkat` (admin_perangkat_pengguna, migrasi 0095).
 * Tab tujuan skenario Antrean. Ranah ditambah saat tab diaktifkan pengguna
 * (CashflowPanelTab aktivasi) atau lewat "Muat data"; sebelum kasus memegang
 * ranah itu, RPC tab tidak dipanggil (useCashflowRanahBuku).
 *
 * Rentang jeda (p_hari 7/30/90) hanya di memori — bukan kunci struktur, dan
 * setiap rentang = satu pembacaan teraudit tersendiri. Tanpa kunci URL.
 */
import { HARI_PERANGKAT } from '~/adapters/cashflowPerangkat'

definePageMeta({
  layout: 'console',
  middleware: ['console', 'cashflow-admin'],
  scrollToTop: (to, from) => to.params.id !== from.params.id,
})
const { tcf } = useCashflowI18n()
const { id, dasar, namaRuang } = useCashflowPengguna()
const buku = useCashflowRanahBuku()
const kasus = useCashflowKasus()

const hari = ref<number>(HARI_PERANGKAT.bawaan)
const p = buku.perangkat(() => id.value, () => hari.value)
/* Jawaban rentang sebelumnya tetap tampil (redup) saat rentang baru dimuat. */
const tampil = shallowRef(p.data.value)
watch(p.data, (d) => { if (d) tampil.value = d })
watch(kasus.kunciKasus, () => { tampil.value = p.data.value })
</script>

<template>
  <div class="space-y-4">
    <p class="text-sm text-[var(--ca-muted)]">{{ tcf('perangkat.ket') }}</p>
    <CashflowPanelTab ranah="perangkat" aktivasi :memuat="p.memuat.value" :galat="p.galat.value" :pesan-galat="p.pesanGalat.value" :ada-data="!!tampil">
      <CashflowTabPerangkat
        v-if="tampil" :data="tampil" :hari="hari" :dasar="dasar" :nama-ruang="namaRuang" :memuat="p.memuat.value"
        @hari="(n: number) => (hari = n)"
      />
    </CashflowPanelTab>
  </div>
</template>
