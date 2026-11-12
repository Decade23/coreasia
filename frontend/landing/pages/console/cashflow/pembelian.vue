<script setup lang="ts">
/**
 * Pembelian kredit Domi: siapa membeli, paket apa, lewat Google Play atau
 * QRIS, dan statusnya. Kontrak RPC: adapters/cashflowPembelian.ts.
 *
 * - Ringkasan (CashflowPembelianRingkas): lunas, nominal kotor, perkiraan
 *   diterima, dan batal. Server menghitungnya atas SEMUA pembelian yang cocok
 *   saringan, tanpa pembelian uji. Ringkasan diambil dari halaman pertama
 *   supaya angkanya sejalan dengan baris teratas daftar.
 * - Daftar: terbaru dulu, saringan status dan jalur di URL (?status, ?jalur;
 *   replace). "Muat lebih banyak" memakai p_sebelum = `lanjut` jawaban
 *   terakhir. Jawaban untuk saringan lama dibuang.
 * - AUDIT. Daftar memuat email pembeli, jadi server mencatat SETIAP panggilan
 *   di audit (pola RPC admin yang membuka data pengguna). Karena itu tidak ada
 *   muat berkala: server hanya dipanggil saat halaman dibuka, saringan diganti,
 *   atau admin menekan Muat ulang, Coba lagi, atau Muat lebih banyak.
 * - IZIN. Penjaganya server. Sesi tanpa izin membuka data pengguna dijawab
 *   42501 izin-kurang dan CashflowIzinKurang (baca) menjelaskan jalan
 *   keluarnya, sama dengan halaman lain yang membuka data pengguna.
 * - RPC belum ada (console tayang lebih dulu dari migrasinya): PGRST202, atau
 *   42883 yang menyebut RPC itu sendiri, ditulis "fitur belum aktif".
 * - Email, nama, dan nomor pesanan tampil sebagai teks polos.
 */
import {
  SARING_JALUR_PEMBELIAN, SARING_STATUS_PEMBELIAN,
  gabungPembelian, halamanPembelian, kursorSesudah, saringPembelianKeServer,
  type Pembelian, type RingkasPembelian,
} from '~/adapters/cashflowPembelian'
import type { SkemaQuery } from '~/adapters/cashflowQuery'

definePageMeta({ layout: 'console', middleware: ['console', 'cashflow-admin'] })

const { tcf } = useCashflowI18n()
const { tc } = useConsoleI18n()
const api = useCashflowAdmin()
const { memuat, galat, pesanGalat, muat, aksi, batal } = useCashflowMuat({ awal: true })

const SKEMA = {
  status: { jenis: 'pilihan', opsi: SARING_STATUS_PEMBELIAN, bawaan: 'semua' },
  jalur: { jenis: 'pilihan', opsi: SARING_JALUR_PEMBELIAN, bawaan: 'semua' },
} as const satisfies SkemaQuery
const { nilai: q, setel } = useCashflowQuery(SKEMA)

const ringkas = shallowRef<RingkasPembelian | null>(null)
const daftar = shallowRef<Pembelian[]>([])
const lanjut = ref<string | null>(null)
const memuatLagi = ref(false)
const belumAktif = computed(() => galat.value?.jenis === 'belum-aktif')
const tersaring = computed(() => q.value.status !== 'semua' || q.value.jalur !== 'semua')

/** Kunci saringan saat ini; jawaban untuk saringan lama dibuang. */
const kunciSaring = () => `${q.value.status}|${q.value.jalur}`
const argumen = () => ({ status: saringPembelianKeServer(q.value.status), jalur: saringPembelianKeServer(q.value.jalur) })

/** Halaman pertama beserta ringkasannya. Daftar lama dibuang lebih dulu,
 *  supaya baris saringan lama tidak tampil di bawah saringan baru. */
const muatAwal = () => {
  daftar.value = []
  ringkas.value = null
  lanjut.value = null
  return muat(async (terbaru) => {
    const a = argumen()
    const h = halamanPembelian(await api.aiPembelianDaftar(a.status, a.jalur, null))
    if (!terbaru()) return
    ringkas.value = h.ringkas
    daftar.value = h.baris
    lanjut.value = kursorSesudah(null, h)
  })
}
watch(kunciSaring, () => { void muatAwal() })
onMounted(() => { void muatAwal() })
onBeforeUnmount(batal)

const muatLagi = async () => {
  if (memuatLagi.value || memuat.value || !lanjut.value) return
  memuatLagi.value = true
  const kunci = kunciSaring()
  const sebelum = lanjut.value
  try {
    await aksi(async () => {
      const a = argumen()
      const h = halamanPembelian(await api.aiPembelianDaftar(a.status, a.jalur, sebelum))
      if (kunci !== kunciSaring()) return
      daftar.value = gabungPembelian(daftar.value, h.baris)
      lanjut.value = kursorSesudah(sebelum, h)
    })
  } finally {
    memuatLagi.value = false
  }
}

const opsiStatus = computed(() => SARING_STATUS_PEMBELIAN.map(s => ({ nilai: s, label: tcf(`pembelian.statusOpsi.${s}`) as string })))
const opsiJalur = computed(() => SARING_JALUR_PEMBELIAN.map(j => ({ nilai: j, label: tcf(`pembelian.jalurOpsi.${j}`) as string })))

useConsoleRemah().pasang(() => [
  { label: tc('layout.cashflow'), to: '/console/cashflow' },
  { label: tcf('nav.pembelian') },
])
</script>

<template>
  <div class="space-y-6">
    <ConsolePageHeader :title="tcf('pembelian.judul')" kicker="CashFlow">
      <template #meta><CashflowNav /></template>
      <template #actions>
        <button
          type="button" class="ca-btn-secondary inline-flex items-center gap-2" :disabled="memuat || memuatLagi || belumAktif"
          data-uji="pembelian-muat-ulang" @click="muatAwal"
        >
          <Icon name="lucide:refresh-cw" class="h-4 w-4" :class="memuat ? 'animate-spin' : ''" aria-hidden="true" />{{ tcf('pembelian.muatUlang') }}
        </button>
      </template>
    </ConsolePageHeader>
    <p class="max-w-3xl text-sm text-[var(--ca-muted)]">{{ tcf('pembelian.ket') }}</p>

    <div v-if="belumAktif" class="flex items-start gap-3 rounded-xl border border-dashed border-[color:var(--ca-border)] px-4 py-5 text-sm text-[var(--ca-muted)]" role="status" data-uji="pembelian-belum-aktif">
      <Icon name="lucide:hourglass" class="mt-0.5 h-5 w-5 shrink-0 text-[var(--ca-subtle)]" aria-hidden="true" />
      <span>{{ tcf('pembelian.belumAktif') }}</span>
    </div>
    <CashflowIzinKurang v-else-if="galat?.jenis === 'izin'" baca />
    <div v-else-if="pesanGalat" class="flex flex-wrap items-center gap-3" data-uji="pembelian-galat">
      <p class="text-sm ca-tone-danger" role="alert">{{ pesanGalat }}</p>
      <button type="button" class="ca-btn-secondary !px-3 !py-1.5 text-xs" :disabled="memuat" @click="muatAwal">{{ tcf('pembelian.cobaLagi') }}</button>
    </div>

    <template v-else>
      <p v-if="memuat && !ringkas" class="text-sm text-[var(--ca-muted)]" role="status">{{ tcf('umum.memuat') }}</p>
      <CashflowPembelianRingkas v-if="ringkas" :ringkas="ringkas" />

      <section class="ca-console-dialog min-w-0 overflow-hidden" aria-labelledby="cf-pembelian-daftar">
        <div class="flex flex-wrap items-center justify-between gap-3 border-b border-[color:var(--ca-border)] p-4">
          <h2 id="cf-pembelian-daftar" class="font-display text-base font-bold text-[var(--ca-text)]">{{ tcf('pembelian.daftar') }}</h2>
          <div class="flex flex-wrap items-center gap-2">
            <CashflowSegmen :opsi="opsiStatus" :nilai="q.status" :label="tcf('pembelian.saringStatus')" @pilih="(v) => setel({ status: v })" />
            <CashflowSegmen :opsi="opsiJalur" :nilai="q.jalur" :label="tcf('pembelian.saringJalur')" @pilih="(v) => setel({ jalur: v })" />
          </div>
        </div>

        <div v-if="!daftar.length" class="p-4" :aria-busy="memuat ? 'true' : undefined">
          <CashflowKeadaanKosong
            :pesan="memuat ? tcf('umum.memuat') : tersaring ? tcf('umum.kosongSaring') : tcf('pembelian.kosong')"
            icon="lucide:receipt"
          />
        </div>
        <CashflowPembelianTabel v-else :daftar="daftar" />

        <div v-if="daftar.length" class="flex flex-wrap items-center justify-between gap-3 border-t border-[color:var(--ca-border)] px-4 py-3 text-xs text-[var(--ca-muted)]">
          <span class="tabular-nums">{{ tcf('pembelian.ditampilkan')(daftar.length) }}</span>
          <button v-if="lanjut" type="button" class="ca-btn-secondary text-sm" :disabled="memuatLagi" data-uji="pembelian-muat-lagi" @click="muatLagi">
            {{ memuatLagi ? tcf('pembelian.memuatLagi') : tcf('pembelian.muatLagi') }}
          </button>
          <span v-else>{{ tcf('pembelian.habis') }}</span>
        </div>
      </section>
    </template>
  </div>
</template>
