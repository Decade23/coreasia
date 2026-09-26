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
 *   aktivasi      (tab Fase 3, prop `aktivasi`) ranah ditambah OTOMATIS bila
 *                 tab ini baru diaktifkan pengguna (klik/ketuk/keyboard pada
 *                 tab); dibuka dari URL, refresh, atau Back → tombol "Muat
 *                 data" (satu klik = aktivasi). Tidak menyebut ranah. Lihat
 *                 useCashflowAktivasiTab (spek Fase 3 §6).
 *   galat         kalimat useCashflowMuat; izin-kurang → CashflowIzinKurang
 *   memuat        kerangka baris (hanya saat belum ada data)
 *   kosong        "memang kosong" — BEDA dengan "di luar kasus"
 * Selain itu isi tab (slot bawaan). Tidak ada dialog di jalur mana pun.
 */
import type { GalatAdmin } from '~/composables/cashflow/useCashflowAdmin'
import { useCashflowRanahAktivasi } from '~/composables/cashflow/useCashflowAktivasiTab'

const props = withDefaults(defineProps<{
  /** Ranah yang dibutuhkan tab ini; null = T0 (tanpa kasus). */
  ranah?: string | null
  memuat?: boolean
  galat?: GalatAdmin | null
  pesanGalat?: string
  adaData?: boolean
  kosong?: boolean
  pesanKosong?: string
  /** Tab Fase 3: ranah ditambah saat tab diaktifkan pengguna, selain itu "Muat data". */
  aktivasi?: boolean
}>(), { ranah: null, memuat: false, galat: null, pesanGalat: '', adaData: false, kosong: false, pesanKosong: '', aktivasi: false })

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
// ── Aktivasi (Fase 3) ──────────────────────────────────────────────────
/* Tanda aktivasi diambil SEKALI saat tab dipasang: hanya klik/ketuk/keyboard
   pada tab tepat sebelum ini yang dihitung (bukan URL, refresh, Back). */
const route = useRoute()
const aktivasiTab = useCashflowAktivasiTab()
const ranahAktivasi = props.aktivasi && props.ranah
  ? useCashflowRanahAktivasi(kasus, props.ranah, aktivasiTab.ambil(route.path), kerja => aksi(kerja))
  : null
const menambahAktivasi = computed(() => ranahAktivasi?.menambah.value === true)
const muatData = (e: MouseEvent) => { void ranahAktivasi?.muatData(e) }
onBeforeUnmount(() => ranahAktivasi?.henti())

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

    <div
      v-else-if="aktivasi && (diLuar || galat?.jenis === 'ranah')"
      class="flex flex-col items-start gap-3 rounded-xl border border-dashed border-[color:var(--ca-border)] px-4 py-5 text-sm text-[var(--ca-muted)] sm:flex-row sm:items-center"
      :aria-busy="menambahAktivasi || undefined"
    >
      <Icon name="lucide:database" class="h-5 w-5 shrink-0 text-[var(--ca-subtle)]" aria-hidden="true" />
      <span class="flex-1">{{ tcf('aktivasi.ket') }}</span>
      <button type="button" class="ca-btn-secondary !px-4 !py-2 text-sm" :disabled="menambahAktivasi" @click="muatData">
        {{ menambahAktivasi ? tcf('aktivasi.memuat') : tcf('aktivasi.muatData') }}
      </button>
    </div>

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
