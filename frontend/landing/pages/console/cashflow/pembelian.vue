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
 * - SEDANG DIPROSES dan DITOLAK (migrasi CashFlow 20261117140000): pembelian
 *   Google Play yang belum atau tidak jadi menjadi kredit. Ringkasan empat
 *   ubin diganti CashflowPembelianProsesRingkas (kunci `proses` jawaban),
 *   tabelnya CashflowPembelianProsesTabel. Lama menunggu dihitung dari saat
 *   jawaban diterima (`kini`), tanpa pengatur waktu. Pilihan QRIS dimatikan
 *   di dua saringan itu karena keadaannya hanya ada di Play. Server lama
 *   menolak kedua nilai (22023 masukan_tidak_sah): halaman menulis keadaan
 *   tenang dengan jalan kembali ke semua status, bukan galat merah.
 */
import {
  SARING_JALUR_PEMBELIAN, SARING_STATUS_PEMBELIAN,
  gabungPembelian, halamanPembelian, kursorSesudah, prosesBelumDikenalServer, saringPembelianKeServer, saringProses,
  type HitunganProses, type Pembelian, type RingkasPembelian, type SaringJalurPembelian, type SaringStatusPembelian,
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
const hitungan = shallowRef<HitunganProses | null>(null)
const daftar = shallowRef<Pembelian[]>([])
const lanjut = ref<string | null>(null)
const memuatLagi = ref(false)
/** Saat jawaban terakhir diterima: patokan "sudah berapa lama menunggu". */
const kini = ref(0)
const belumAktif = computed(() => galat.value?.jenis === 'belum-aktif')
const tersaring = computed(() => q.value.status !== 'semua' || q.value.jalur !== 'semua')
/** Saringan Sedang diproses atau Ditolak: daftar catatan proses Google Play. */
const statusProses = computed(() => (saringProses(q.value.status) ? q.value.status : null))
const serverLama = computed(() => prosesBelumDikenalServer(galat.value, q.value.status))

/** Kunci saringan saat ini; jawaban untuk saringan lama dibuang. */
const kunciSaring = () => `${q.value.status}|${q.value.jalur}`
const argumen = () => ({ status: saringPembelianKeServer(q.value.status), jalur: saringPembelianKeServer(q.value.jalur) })

/** Halaman pertama beserta ringkasannya. Daftar lama dibuang lebih dulu,
 *  supaya baris saringan lama tidak tampil di bawah saringan baru. */
const muatAwal = () => {
  daftar.value = []
  ringkas.value = null
  hitungan.value = null
  lanjut.value = null
  return muat(async (terbaru) => {
    const a = argumen()
    const h = halamanPembelian(await api.aiPembelianDaftar(a.status, a.jalur, null))
    if (!terbaru()) return
    kini.value = Date.now()
    // Di saringan proses, ringkasan pembelian dari server berisi nol: diganti hitungan proses.
    ringkas.value = a.status && saringProses(a.status) ? null : h.ringkas
    hitungan.value = h.proses
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

const opsiStatus = computed(() => SARING_STATUS_PEMBELIAN.map(s => ({
  nilai: s, label: tcf(`pembelian.statusOpsi.${s}`) as string,
  ...(saringProses(s) ? { ket: tcf(`pembelian.statusOpsiKet.${s}`) as string } : {}),
})))
/* Keadaan proses hanya ada di Google Play: QRIS dimatikan di dua saringan itu. */
const opsiJalur = computed(() => SARING_JALUR_PEMBELIAN.map(j => ({
  nilai: j, label: tcf(`pembelian.jalurOpsi.${j}`) as string,
  ...(statusProses.value && j === 'qris' ? { mati: true, ket: tcf('pembelian.proses.hanyaPlay') as string } : {}),
})))
/** Pindah ke saringan proses dengan jalur QRIS: jalurnya kembali ke semua. */
const pilihStatus = (v: SaringStatusPembelian) =>
  setel(saringProses(v) && q.value.jalur === 'qris' ? { status: v, jalur: 'semua' as SaringJalurPembelian } : { status: v })
const judulKosong = computed(() => {
  if (statusProses.value && q.value.jalur !== 'qris') return tcf(`pembelian.proses.kosongJudul.${statusProses.value}`)
  return tersaring.value ? tcf('umum.kosongSaringJudul') : tcf('umum.kosongJudul')
})
const pesanKosong = computed(() => {
  if (statusProses.value) return tcf(`pembelian.proses.kosong.${q.value.jalur === 'qris' ? 'qris' : statusProses.value}`)
  return tersaring.value ? tcf('umum.kosongSaring') : tcf('pembelian.kosong')
})

useConsoleRemah().pasang(() => [
  { label: tc('layout.cashflow'), to: '/console/cashflow' },
  { label: tcf('nav.pembelian') },
])
</script>

<template>
  <div class="space-y-6">
    <ConsolePageHeader :title="tcf('pembelian.judul')" kicker="CashFlow" ringkas>
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
    <!-- Server sebelum 20261117140000: saringan proses belum dikenal. Tenang, dengan jalan kembali. -->
    <div
      v-else-if="serverLama" class="flex flex-wrap items-start gap-3 rounded-xl border border-dashed border-[color:var(--ca-border)] px-4 py-5 text-sm text-[var(--ca-muted)]"
      role="status" data-uji="pembelian-proses-server-lama"
    >
      <Icon name="lucide:hourglass" class="mt-0.5 h-5 w-5 shrink-0 text-[var(--ca-subtle)]" aria-hidden="true" />
      <div class="min-w-0 flex-1">
        <p class="font-semibold text-[var(--ca-text)]">{{ tcf('pembelian.proses.serverLama.judul') }}</p>
        <p class="mt-0.5">{{ tcf('pembelian.proses.serverLama.pesan') }}</p>
      </div>
      <button type="button" class="ca-btn-secondary shrink-0 text-sm" data-uji="pembelian-proses-kembali" @click="setel({ status: 'semua' })">
        {{ tcf('pembelian.proses.serverLama.kembali') }}
      </button>
    </div>
    <CashflowIzinKurang v-else-if="galat?.jenis === 'izin'" baca />
    <CashflowKeadaan
      v-else-if="pesanGalat" jenis="galat" :judul="tcf('umum.galatJudul')" :pesan="pesanGalat"
      :label-ulang="tcf('pembelian.cobaLagi')" :sibuk="memuat" data-uji="pembelian-galat" @ulang="muatAwal"
    />

    <template v-else>
      <CashflowPembelianRingkas v-if="ringkas" :ringkas="ringkas" />
      <CashflowPembelianProsesRingkas
        v-if="statusProses && hitungan" :hitungan="hitungan" :kini-ms="kini" :status="statusProses"
        @pilih="(v) => pilihStatus(v)"
      />

      <section class="ca-console-dialog min-w-0 overflow-hidden" aria-labelledby="cf-pembelian-daftar">
        <div class="flex flex-wrap items-center justify-between gap-3 border-b border-[color:var(--ca-border)] p-4">
          <div class="min-w-0">
            <h2 id="cf-pembelian-daftar" class="font-display text-base font-bold text-[var(--ca-text)]">{{ tcf('pembelian.daftar') }}</h2>
            <p v-if="statusProses" class="mt-1 max-w-2xl text-xs text-[var(--ca-muted)]" data-uji="pembelian-proses-ket">{{ tcf(`pembelian.proses.ket.${statusProses}`) }}</p>
          </div>
          <div class="flex min-w-0 flex-wrap items-center gap-2">
            <CashflowSegmen :opsi="opsiStatus" :nilai="q.status" :label="tcf('pembelian.saringStatus')" gulir @pilih="pilihStatus" />
            <CashflowSegmen :opsi="opsiJalur" :nilai="q.jalur" :label="tcf('pembelian.saringJalur')" @pilih="(v) => setel({ jalur: v })" />
          </div>
        </div>

        <CashflowKeadaan v-if="!daftar.length && memuat" jenis="memuat" polos :pesan="tcf('umum.memuat')" :baris="5" :kolom="6" />
        <CashflowKeadaan
          v-else-if="!daftar.length" jenis="kosong" polos icon="lucide:receipt"
          :judul="judulKosong" :pesan="pesanKosong"
        />
        <CashflowPembelianProsesTabel v-else-if="statusProses" :daftar="daftar" :kini-ms="kini" />
        <CashflowPembelianTabel v-else :daftar="daftar" />

        <div v-if="daftar.length" class="cf-tabel-kaki">
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
