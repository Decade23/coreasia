<script setup lang="ts">
/**
 * Detail satu orang — HANYA sesudah alasan.
 *
 * Setiap kunjungan meminta alasan lagi dan menulis tiga baris audit (detail,
 * aktivitas, transaksi). Tidak ada cache alasan: komentar lama menjanjikan
 * cache 15 menit per pengguna, tapi itu tidak pernah dibuat. Penggantinya
 * bukan cache di peramban melainkan KASUS di Fase 1 — dicatat server, terikat
 * pelaku, berumur 30 menit. Catatan bebas transaksi tetap tersembunyi sampai
 * alasan tingkat investigasi, yang tercatat sebagai aksi audit terpisah.
 *
 * Angka ubin diambil dari jumlah{} server: yang DICATAT orang ini di semua
 * ruang, termasuk kaki transfer — labelnya menyebut itu. Angka per ruang
 * belum dikirim server, jadi tampil "—" (lihat adapters/cashflow.ts).
 */
definePageMeta({ layout: 'console', middleware: ['console', 'cashflow-admin'] })
import {
  keDetailPengguna, rupiah, angka, samarkanEmail, jedaDaftarKeCatatan, keArahUang,
  type DetailPenggunaDTO, type AktivitasDTO, type TransaksiLamaDTO, type ArahUang,
} from '~/adapters/cashflow'
const { tcf, bahasa, formatTanggal, formatJam } = useCashflowI18n()
const { tc } = useConsoleI18n()
const api = useCashflowAdmin()
const route = useRoute()
const router = useRouter()
const indeks = useCashflowIndeks()
const { memuat, galat, pesanGalat, muat, aksi } = useCashflowMuat()
const id = computed(() => String(route.params.id))

const BATAS = 100
const gerbang = ref(true)
const gerbangInvestigasi = ref(false)
const alasan = ref('')
const alasanPada = ref<Date | null>(null)
/* DTO disimpan; tanggal tampilan dibentuk ulang bila bahasa berganti. */
const detailMentah = shallowRef<DetailPenggunaDTO | null>(null)
const detail = computed(() => (detailMentah.value ? keDetailPengguna(detailMentah.value, bahasa.value) : null))
const aktivitas = ref<AktivitasDTO[]>([])
const transaksi = ref<TransaksiLamaDTO[]>([])
const tampilkanCatatan = ref(false)

const buka = async (a: string) => {
  gerbang.value = false
  alasan.value = a
  alasanPada.value = new Date()
  const ok = await muat(async () => {
    /* Detail DULU, sendirian. Hanya admin_detail_pengguna_v2 yang tahu orangnya
       tidak ada (P0002), dan baris auditnya ikut ter-rollback. Aktivitas dan
       transaksi menulis audit tanpa memeriksa itu, dan masing-masing commit
       sendiri. Kalau ketiganya paralel, UUID dari palet atau target audit yang
       akunnya sudah hilang meninggalkan dua baris audit permanen atas orang
       yang tidak ada. */
    const d = await api.detailPengguna(id.value, a)
    const [ak, tx] = await Promise.all([
      api.aktivitasPengguna(id.value, a, BATAS),
      api.transaksiPengguna(id.value, a, BATAS),
    ])
    detailMentah.value = d
    aktivitas.value = ak
    transaksi.value = tx
  })
  // Alasan ditolak (klien, atau 22023 server): buka gerbang lagi alih-alih
  // meninggalkan halaman buntu. Kalimat server tetap tampil di halaman.
  if (!ok && (galat.value?.jenis === 'alasan' || galat.value?.jenis === 'argumen')) gerbang.value = true
}

/** Catatan bebas: alasan kedua, dicatat server sebagai baca_transaksi ulang
 *  dengan alasan bertingkat "INVESTIGASI — …" supaya terlihat jelas di audit. */
const bukaCatatan = async (a: string) => {
  gerbangInvestigasi.value = false
  await aksi(async () => {
    transaksi.value = await api.transaksiPengguna(id.value, `INVESTIGASI — ${a}`, BATAS)
    tampilkanCatatan.value = true
  })
}

const kembali = computed(() => indeks.daftarTerakhir.value)
/* RIWAYAT. Detail ini tidak boleh terulang lewat Back: setiap kedatangan
   meminta alasan dan, bila dikonfirmasi, menulis tiga baris audit. Maka tidak
   ada jalan keluar ke DAFTAR yang MENAMBAH entri ([daftar, detail, daftar] →
   Back membuka detail lagi). Semua jalan ke daftar lewat keDaftar: panah,
   remah, tab Pengguna, dan item Pengguna di palet (lewat CashflowNav). Tidak
   ada pula yang mengganti detail dengan URL yang sama dengan entri
   sebelumnya ([daftar, daftar] → Back pertama tidak berbuat apa-apa).
   Satu-satunya yang benar: mundur bila tujuannya memang entri sebelumnya,
   selain itu ganti entri.
   history.state.back = fullPath entri sebelumnya (vue-router); null bila tab
   dibuka langsung di sini. /masuk tidak dihitung asal: sebabnya sudah basi,
   dan tanpa sebab ia langsung menyambung kembali ke sini. */
const asal = (): string | null => {
  if (!import.meta.client) return null
  const b: unknown = window.history.state?.back
  return typeof b === 'string' && !b.startsWith('/console/cashflow/masuk') ? b : null
}
/** Panah kembali & remah "Pengguna": ke DAFTAR, apa pun asalnya. */
const keDaftar = () => (asal() === kembali.value ? router.back() : navigateTo(kembali.value, { replace: true }))
/** Batal/Esc di gerbang: ke ASAL (Audit, halaman lain lewat palet), bukan ke
 *  daftar — daftar bisa langsung memuat email utuh semua orang dengan alasan
 *  tersimpan (dan menulis audit), padahal admin baru saja memilih Batal. */
const tutupGerbang = () => (asal() ? router.back() : navigateTo(kembali.value, { replace: true }))

/* Remah: label subjek selalu TERSAMAR (juga sesudah dibuka) — bilah atas
   terlihat dari seberang ruangan dan ikut tangkapan layar. */
const labelSubjek = computed(() =>
  detail.value ? samarkanEmail(detail.value.email) : (indeks.labelUntuk(id.value) ?? id.value.slice(0, 8)))
useConsoleRemah().pasang(() => [
  { label: tc('layout.cashflow'), to: '/console/cashflow' },
  { label: tcf('nav.pengguna'), to: kembali.value, aksi: keDaftar },
  { label: labelSubjek.value },
])

/* "Catatan pertama" hanya jujur bila SEMUA transaksinya termuat: yang dimuat
   hanya BATAS terbaru, dan yang tertua di antaranya belum tentu yang pertama. */
const jedaLengkap = computed(() => !!detail.value && transaksi.value.length >= detail.value.jumlah.transaksi)
const jeda = computed(() => {
  if (!detail.value || !jedaLengkap.value) return null
  const pertama = [...transaksi.value].sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)))[0]
  return jedaDaftarKeCatatan(detail.value.daftarIso, pertama?.created_at ?? null)
})
const teksJeda = computed(() => {
  if (!detail.value) return ''
  if (!jedaLengkap.value) return tcf('pengguna.jedaTakLengkap')
  return jeda.value ? tcf('pengguna.jedaSetelah')(jeda.value.n, jeda.value.satuan) : tcf('pengguna.jedaBelum')
})

/* Arah dari adapter: server mengirim 'income'/'expense' (peristiwa.arah,
   transactions.kind). Membandingkan dengan 'masuk' membuat semua pemasukan
   merah — dan nominal tampil tanpa tanda, jadi terbaca pengeluaran. */
const nada = (a: ArahUang | null) => (a === 'masuk' ? 'ca-tone-emerald' : a === 'keluar' ? 'ca-tone-danger' : 'ca-tone-info')
const tanpaAngka = (v: number | null) => (v == null ? '—' : angka(v))
const tanpaRupiah = (v: number | null) => (v == null ? '—' : rupiah(v))
</script>

<template>
  <div class="space-y-6">
    <ConsolePageHeader
      :title="tcf('pengguna.detail')" kicker="CashFlow"
      :back-to="kembali" :back-action="keDaftar" :back-label="tcf('pengguna.kembaliKeDaftar')"
    >
      <template #meta><CashflowNav :aksi-daftar="keDaftar" /></template>
    </ConsolePageHeader>

    <CashflowReasonGate :show="gerbang" @close="tutupGerbang" @konfirmasi="buka" />
    <CashflowReasonGate :show="gerbangInvestigasi" investigasi @close="gerbangInvestigasi = false" @konfirmasi="bukaCatatan" />

    <p v-if="pesanGalat" class="text-sm ca-tone-danger">{{ pesanGalat }}</p>
    <p v-else-if="memuat" class="text-sm text-[var(--ca-muted)]">{{ tcf('umum.memuat') }}</p>
    <CashflowKeadaanKosong v-else-if="!gerbang && !detail" :pesan="tcf('umum.kosong')" icon="lucide:user" />

    <template v-else-if="detail">
      <p class="rounded-xl border border-[color:var(--ca-gold-border)] bg-[var(--ca-gold-bg)] px-4 py-2 text-xs text-[var(--ca-text)]">
        {{ tcf('pengguna.dibukaDengan') }}: <strong>{{ alasan }}</strong> · {{ tcf('pengguna.pada') }} {{ formatJam(alasanPada) }} WIB
      </p>

      <section class="ca-console-dialog p-5">
        <h2 class="break-all font-display text-xl font-bold text-[var(--ca-text)]">{{ detail.email }}</h2>
        <p class="text-sm text-[var(--ca-muted)]">
          {{ detail.namaTampil }} · {{ tcf('pengguna.daftar') }} {{ detail.daftar }} · {{ tcf('pengguna.masuk') }} {{ detail.masukTerakhir }}
          <span v-if="detail.ditangguhkan" class="ca-pill-danger ml-1">{{ tcf('pengguna.ditangguhkan') }}</span>
        </p>
        <p class="mt-2 text-sm text-[var(--ca-text)]">{{ teksJeda }}</p>
      </section>

      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <CashflowStatTile icon="lucide:layers" warna="sky" :label="tcf('pengguna.ruangnya')" :nilai="detail.ruang.length" />
        <CashflowStatTile icon="lucide:list" warna="amber" :label="tcf('pengguna.transaksi')" :nilai="angka(detail.jumlah.transaksi)" :keterangan="tcf('pengguna.ubinKet')" />
        <CashflowStatTile icon="lucide:arrow-down-left" warna="emerald" :label="tcf('pengguna.kolom.masuk')" :nilai="rupiah(detail.jumlah.pemasukan)" :keterangan="tcf('pengguna.ubinKet')" />
        <CashflowStatTile icon="lucide:arrow-up-right" warna="rose" :label="tcf('pengguna.kolom.keluar')" :nilai="rupiah(detail.jumlah.pengeluaran)" :keterangan="tcf('pengguna.ubinKet')" />
      </div>
      <p class="text-xs text-[var(--ca-subtle)] tabular-nums">{{ tcf('pengguna.dompetJadwal')(detail.jumlah.dompet, detail.jumlah.jadwal) }}</p>

      <section class="ca-console-dialog overflow-x-auto p-5">
        <h3 class="font-display text-base font-bold text-[var(--ca-text)]">{{ tcf('pengguna.ruangnya') }}</h3>
        <CashflowKeadaanKosong v-if="!detail.ruang.length" class="mt-3" :pesan="tcf('umum.kosong')" icon="lucide:layers" />
        <template v-else>
          <table class="mt-3 w-full text-sm">
            <thead><tr class="text-left text-xs uppercase tracking-wide text-[var(--ca-muted)]">
              <th class="py-2 pr-3">{{ tcf('pengguna.kolom.nama') }}</th><th class="py-2 px-3">{{ tcf('pengguna.kolom.peran') }}</th>
              <th class="py-2 px-3 text-right">{{ tcf('pengguna.kolom.anggota') }}</th><th class="py-2 px-3 text-right">{{ tcf('pengguna.kolom.tx') }}</th>
              <th class="py-2 px-3 text-right">{{ tcf('pengguna.kolom.masuk') }}</th><th class="py-2 px-3 text-right">{{ tcf('pengguna.kolom.keluar') }}</th>
              <th class="py-2 px-3 text-right">{{ tcf('pengguna.kolom.dompet') }}</th><th class="py-2 pl-3 text-right">{{ tcf('pengguna.kolom.jadwal') }}</th>
            </tr></thead>
            <tbody>
              <tr v-for="r in detail.ruang" :key="r.id" class="border-t border-[color:var(--ca-border)] text-[var(--ca-text)]">
                <td class="py-2 pr-3">{{ r.nama }}</td><td class="py-2 px-3">{{ r.peran }}{{ r.pemilik ? ` · ${tcf('pengguna.pemilik')}` : '' }}</td>
                <td class="py-2 px-3 text-right tabular-nums">{{ r.anggota }}</td><td class="py-2 px-3 text-right tabular-nums text-[var(--ca-subtle)]">{{ tanpaAngka(r.transaksi) }}</td>
                <td class="py-2 px-3 text-right tabular-nums text-[var(--ca-subtle)]">{{ tanpaRupiah(r.pemasukan) }}</td><td class="py-2 px-3 text-right tabular-nums text-[var(--ca-subtle)]">{{ tanpaRupiah(r.pengeluaran) }}</td>
                <td class="py-2 px-3 text-right tabular-nums text-[var(--ca-subtle)]">{{ tanpaAngka(r.dompet) }}</td><td class="py-2 pl-3 text-right tabular-nums text-[var(--ca-subtle)]">{{ tanpaAngka(r.jadwal) }}</td>
              </tr>
            </tbody>
          </table>
          <p class="mt-2 text-xs text-[var(--ca-subtle)]">{{ tcf('pengguna.perRuangMenyusul') }}</p>
        </template>
      </section>

      <section class="ca-console-dialog p-5">
        <h3 class="font-display text-base font-bold text-[var(--ca-text)]">{{ tcf('pengguna.aktivitas') }}</h3>
        <CashflowKeadaanKosong v-if="!aktivitas.length" class="mt-3" :pesan="tcf('umum.kosong')" icon="lucide:activity" />
        <ol v-else class="mt-3 space-y-1.5 text-sm">
          <li v-for="(a, i) in aktivitas" :key="i" class="flex flex-wrap items-baseline gap-x-3 border-t border-[color:var(--ca-border)] pt-1.5 first:border-0">
            <span class="w-24 shrink-0 text-xs text-[var(--ca-subtle)] tabular-nums">{{ formatTanggal(a.tanggal) }}</span>
            <span class="rounded-full bg-[var(--ca-panel-bg-strong)] px-2 text-xs text-[var(--ca-muted)]">{{ a.jenis }}</span>
            <span class="text-[var(--ca-text)]">{{ a.judul || '—' }}</span>
            <span v-if="a.nominal != null" class="ml-auto tabular-nums" :class="nada(keArahUang(a.arah))">{{ rupiah(a.nominal) }}</span>
          </li>
        </ol>
      </section>

      <section class="ca-console-dialog overflow-x-auto p-5">
        <div class="flex items-center justify-between gap-3">
          <h3 class="font-display text-base font-bold text-[var(--ca-text)]">{{ tcf('pengguna.transaksi') }}</h3>
          <button v-if="!tampilkanCatatan && transaksi.length" type="button" class="ca-btn-secondary text-xs" @click="gerbangInvestigasi = true">{{ tcf('pengguna.tampilkanCatatan') }}</button>
        </div>
        <p v-if="!tampilkanCatatan" class="mt-1 text-xs text-[var(--ca-subtle)]">{{ tcf('pengguna.catatanTersembunyi') }}</p>
        <!-- Hanya BATAS terbaru yang dimuat; totalnya dari jumlah{} server. -->
        <p v-if="transaksi.length < detail.jumlah.transaksi" class="mt-1 text-xs ca-tone-gold">
          {{ tcf('pengguna.txPotong')(transaksi.length, detail.jumlah.transaksi) }}
        </p>
        <CashflowKeadaanKosong v-if="!transaksi.length" class="mt-3" :pesan="tcf('umum.kosong')" icon="lucide:list" />
        <table v-else class="mt-3 w-full text-sm">
          <thead><tr class="text-left text-xs uppercase tracking-wide text-[var(--ca-muted)]">
            <th class="py-2 pr-3">{{ tcf('aktivitas.tanggal') }}</th><th class="py-2 px-3">{{ tcf('pengguna.ruangnya') }}</th>
            <th class="py-2 px-3">{{ tcf('pengguna.kolom.dompet') }}</th><th class="py-2 px-3">{{ tcf('pengguna.kolom.kategori') }}</th>
            <th v-if="tampilkanCatatan" class="py-2 px-3">{{ tcf('pengguna.kolom.catatan') }}</th><th class="py-2 pl-3 text-right">{{ tcf('aktivitas.nominal') }}</th>
          </tr></thead>
          <tbody>
            <tr v-for="t in transaksi" :key="t.id" class="border-t border-[color:var(--ca-border)] text-[var(--ca-text)]">
              <td class="py-1.5 pr-3 whitespace-nowrap">{{ formatTanggal(t.occurred_at) }}</td>
              <td class="py-1.5 px-3">{{ t.workspace }}</td><td class="py-1.5 px-3">{{ t.wallet }}</td><td class="py-1.5 px-3">{{ t.category || '—' }}</td>
              <td v-if="tampilkanCatatan" class="py-1.5 px-3 text-[var(--ca-muted)]">{{ t.note || '—' }}</td>
              <td class="py-1.5 pl-3 text-right tabular-nums" :class="nada(keArahUang(t.kind))">{{ rupiah(t.amount) }}</td>
            </tr>
          </tbody>
        </table>
      </section>
    </template>
  </div>
</template>
