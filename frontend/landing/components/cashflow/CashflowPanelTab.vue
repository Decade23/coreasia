<script setup lang="ts">
/**
 * Keadaan satu tab Pengguna 360 — satu tempat untuk semua keadaan, supaya
 * setiap tab membedakannya dengan cara yang sama:
 *   tanpa kasus   kasus dibuka OTOMATIS (useCashflowKasus) — yang tampil
 *                 menurut tahapnya: sedang membuka (kerangka), tanpa izin pii
 *                 (masuk ulang ber-TOTP), batas laju, gagal (Coba lagi), atau
 *                 sesi mati (keterangan singkat; induk mengarahkan ke /masuk)
 *   di luar kasus kasus ada, ranah tab ini tidak (kasus lama) → "Tambah
 *                 ranah" satu klik (alasan diwarisi server; tercatat)
 *   galat         kalimat useCashflowMuat; izin-kurang → CashflowIzinKurang
 *   memuat        kerangka baris (hanya saat belum ada data)
 *   kosong        "memang kosong" — BEDA dengan "di luar kasus"
 * Selain itu isi tab (slot bawaan). Tidak ada dialog di jalur mana pun.
 */
import type { GalatAdmin } from '~/composables/cashflow/useCashflowAdmin'

const props = withDefaults(defineProps<{
  /** Ranah yang dibutuhkan tab ini; null = T0 (tanpa kasus). */
  ranah?: string | null
  memuat?: boolean
  galat?: GalatAdmin | null
  pesanGalat?: string
  adaData?: boolean
  kosong?: boolean
  pesanKosong?: string
}>(), { ranah: null, memuat: false, galat: null, pesanGalat: '', adaData: false, kosong: false, pesanKosong: '' })

const { tcf } = useCashflowI18n()
const kasus = useCashflowKasus()
const { aksi, pesanUntuk } = useCashflowMuat()
const menambah = ref(false)
const mencoba = ref(false)

const tanpaKasus = computed(() => !!props.ranah && !kasus.kasus.value)
const tahap = computed(() => kasus.keadaan.value.tahap)
const diLuar = computed(() => !!props.ranah && !!kasus.kasus.value && !kasus.punyaRanah(props.ranah))
const labelRanah = computed(() => (props.ranah ? tcf(`ranah.${props.ranah}`) : ''))
const batas = computed(() => kasus.keadaan.value.batas)
const pesanBuka = computed(() => {
  const g = kasus.keadaan.value.galat
  if (!g) return tcf('umum.gagal')
  return g.hint === 'buka-beruntun' ? tcf('kasus.bukaBeruntun') : pesanUntuk(g)
})

const tambahRanah = async () => {
  if (!props.ranah || menambah.value) return
  menambah.value = true
  try {
    await aksi(() => kasus.tambah([props.ranah!]), { sukses: tcf('kasus.ranahDitambah')(labelRanah.value) })
  } finally {
    menambah.value = false
  }
}
const cobaLagi = async () => {
  if (mencoba.value) return
  mencoba.value = true
  try { await kasus.cobaLagi() } finally { mencoba.value = false }
}
</script>

<template>
  <div>
    <template v-if="tanpaKasus">
      <CashflowIzinKurang v-if="tahap === 'izin'" />
      <p v-else-if="tahap === 'sesi'" class="rounded-xl border border-dashed border-[color:var(--ca-border)] px-4 py-3 text-sm text-[var(--ca-muted)]" role="status">
        {{ tcf('galat.sesiBerakhir') }}
      </p>
      <div
        v-else-if="tahap === 'batas' || tahap === 'galat'"
        class="flex flex-col items-start gap-3 rounded-xl border border-[color:var(--ca-danger-border)] bg-[var(--ca-danger-bg)] px-4 py-3 text-sm text-[var(--ca-danger-text)] sm:flex-row sm:items-center"
        role="alert"
      >
        <span class="flex-1">{{ tahap === 'batas' && batas ? tcf('kasus.batas')(batas.batas.jam, batas.batas.hari) : pesanBuka }}</span>
        <button type="button" class="ca-btn-secondary !px-4 !py-2 text-sm" :disabled="mencoba" @click="cobaLagi">
          {{ mencoba ? tcf('umum.memuat') : tcf('kasus.cobaLagi') }}
        </button>
      </div>
      <div v-else class="space-y-2" aria-busy="true" :aria-label="tcf('kasus.bilah.membuka')">
        <div v-for="n in 5" :key="n" class="h-10 animate-pulse rounded-lg bg-[var(--ca-panel-bg-strong)]" />
      </div>
    </template>

    <div v-else-if="diLuar || galat?.jenis === 'ranah'" class="flex flex-col items-start gap-3 rounded-xl border border-dashed border-[color:var(--ca-gold-border)] px-4 py-5 text-sm text-[var(--ca-muted)] sm:flex-row sm:items-center">
      <Icon name="lucide:circle-slash" class="h-5 w-5 shrink-0 text-[var(--ca-gold-text)]" aria-hidden="true" />
      <span class="flex-1">{{ tcf('kasus.diLuarKasus')(labelRanah) }}</span>
      <button type="button" class="ca-btn-secondary !px-4 !py-2 text-sm" :disabled="menambah" @click="tambahRanah">
        {{ menambah ? tcf('umum.memuat') : tcf('kasus.tambahkanRanah')(labelRanah) }}
      </button>
    </div>

    <CashflowIzinKurang v-else-if="galat?.jenis === 'izin'" />

    <p v-else-if="galat" class="rounded-xl border border-[color:var(--ca-danger-border)] bg-[var(--ca-danger-bg)] px-4 py-3 text-sm text-[var(--ca-danger-text)]" role="alert">
      {{ pesanGalat || galat.message }}
    </p>

    <div v-else-if="memuat && !adaData" class="space-y-2" aria-busy="true" :aria-label="tcf('umum.memuat')">
      <div v-for="n in 5" :key="n" class="h-10 animate-pulse rounded-lg bg-[var(--ca-panel-bg-strong)]" />
    </div>

    <CashflowKeadaanKosong v-else-if="kosong" :pesan="pesanKosong || tcf('umum.memangKosong')" />

    <slot v-else />
  </div>
</template>
