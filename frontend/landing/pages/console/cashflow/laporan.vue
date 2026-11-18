<script setup lang="ts">
/**
 * Laporan — grafik dan tabel CashFlow (spek console laporan 19 Nov 2026,
 * K2, K4, K7, K9). Lima bagian, satu terbuka sekali waktu (?bagian=):
 *
 * - Harian (bawaan), Jam ramai, Dukung CashFlow, Asal pengguna: agregat
 *   berizin view, tanpa audit, sampai KEMARIN, tanpa akun tim. Rentang
 *   7/30/90 hari (?hari=). Jam ramai bisa disaring jenis ruang (?jenis=).
 * - Saldo: uang nyata per ruang atau per pengguna (?mode=), izin pii, alasan
 *   tetap halaman ini, dan SETIAP muatan menulis satu baris audit
 *   laporan_saldo. Karena itu saldo hanya dimuat saat bagiannya dibuka, dan
 *   cari hanya dikirim saat tombol Cari ditekan, bukan per ketikan.
 *
 * Setiap bagian membaca RPC-nya sendiri. Server yang belum memasang
 * migrasinya menjawab PGRST202: bagian itu menulis "belum aktif", halaman
 * lain tetap jalan (asal pengguna datang dari migrasi aplikasi 1.4.4).
 * Teks cari tidak pernah masuk URL (adapters/cashflowQuery).
 */
definePageMeta({ layout: 'console', middleware: ['console', 'cashflow-admin'] })
import { angka, rupiah } from '~/adapters/cashflow'
import { jumlahHalaman } from '~/adapters/cashflowDaftar'
import { tanggalPendek, waktuDetikWib } from '~/adapters/cashflowWaktu'
import {
  BAGIAN_LAPORAN, JENIS_LAPORAN, METRIK_HARIAN, MODE_SALDO, PER_SALDO, RENTANG_LAPORAN, URUT_SALDO,
  jenisKeServer, keAsal, keDukung, keHarian, kePetaJam, keSaldo, kunciAsalDukung, opsiDari, rupiahRingkasLaporan,
  seriHarian, titikIsi, urutSah, KOLOM_METRIK,
  type Asal, type BagianLaporan, type Dukung, type Harian, type MetrikHarian, type PetaJam, type Saldo,
  type SaldoPengguna, type SaldoRuang, type UrutSaldo,
} from '~/adapters/cashflowLaporan'
import type { SkemaQuery } from '~/adapters/cashflowQuery'

const { tcf, bahasa } = useCashflowI18n()
const { tc } = useConsoleI18n()
const api = useCashflowAdmin()
const sesi = useCashflowSesi()
const { memuat, galat, pesanGalat, muat, batal } = useCashflowMuat({ awal: true })

const SKEMA = {
  bagian: { jenis: 'pilihan', opsi: BAGIAN_LAPORAN, bawaan: 'harian' },
  hari: { jenis: 'pilihan', opsi: RENTANG_LAPORAN, bawaan: '30' },
  jenis: { jenis: 'pilihan', opsi: JENIS_LAPORAN, bawaan: 'semua' },
  mode: { jenis: 'pilihan', opsi: MODE_SALDO, bawaan: 'ruang' },
  urut: { jenis: 'pilihan', opsi: URUT_SALDO, bawaan: 'uang_nyata' },
  arah: { jenis: 'pilihan', opsi: ['asc', 'desc'], bawaan: 'desc' },
  hal: { jenis: 'halaman', bawaan: 1 },
} as const satisfies SkemaQuery
const { nilai: q, setel } = useCashflowQuery(SKEMA)

const harian = shallowRef<Harian | null>(null)
const peta = shallowRef<PetaJam | null>(null)
const dukung = shallowRef<Dukung | null>(null)
const asal = shallowRef<Asal | null>(null)
const saldo = shallowRef<Saldo | null>(null)
/** Kunci muatan yang terakhir berhasil (penanda uji dan pemeriksa basi). */
const kunciTampil = ref('')
/* Kerangka memuat hanya bila bagian ini belum punya data sama sekali. Ganti
   halaman, urutan, atau jenis membiarkan isi lama tampil sampai yang baru
   tiba (pola daftar Pengguna), dengan bilah sibuk di tabel. */
const adaData = computed(() => {
  switch (q.value.bagian) {
    case 'harian': return !!harian.value
    case 'jam': return !!peta.value
    case 'dukung': return !!dukung.value
    case 'asal': return !!asal.value
    default: return !!saldo.value
  }
})

const izinSaldo = computed(() => sesi.boleh('cashflow:pii'))
const belumAktif = computed(() => galat.value?.jenis === 'belum-aktif')
const izinDitolak = computed(() => galat.value?.jenis === 'izin')
const hari = computed(() => Number(q.value.hari))

/* Saldo: cari dan tanpa tim hanya di memori (teks cari tidak masuk URL). */
const cari = ref('')
const cariDiterapkan = ref('')
const tanpaTim = ref(false)

const kunciMuat = computed(() => {
  const v = q.value
  if (v.bagian === 'saldo') return `saldo|${v.mode}|${v.jenis}|${v.urut}|${v.arah}|${v.hal}|${tanpaTim.value}|${cariDiterapkan.value}`
  if (v.bagian === 'jam') return `jam|${v.hari}|${v.jenis}`
  return `${v.bagian}|${v.hari}`
})

const muatBagian = () => muat(async (terbaru) => {
  const v = q.value
  const kunci = kunciMuat.value
  if (v.bagian === 'harian') {
    const d = await api.laporanHarian(hari.value)
    if (!terbaru()) return
    harian.value = keHarian(d)
  } else if (v.bagian === 'jam') {
    const d = await api.laporanJamRamai(hari.value, jenisKeServer(v.jenis))
    if (!terbaru()) return
    peta.value = kePetaJam(d)
  } else if (v.bagian === 'dukung') {
    const d = await api.laporanDukung(hari.value)
    if (!terbaru()) return
    dukung.value = keDukung(d)
  } else if (v.bagian === 'asal') {
    const d = await api.laporanAsal(hari.value)
    if (!terbaru()) return
    asal.value = keAsal(d)
  } else {
    if (!izinSaldo.value) { saldo.value = null; return }
    if (!urutSah(v.mode, v.urut)) { await setel({ urut: 'uang_nyata', hal: 1 }); return }
    const d = await api.laporanSaldo({
      mode: v.mode, jenis: jenisKeServer(v.jenis), cari: cariDiterapkan.value, urut: v.urut, arah: v.arah,
      hal: v.hal, tanpaInternal: tanpaTim.value,
    })
    if (!terbaru()) return
    const s = keSaldo(d)
    const maks = jumlahHalaman(s.total, PER_SALDO)
    if (s.total > 0 && v.hal > maks) { await setel({ hal: maks }); return }
    saldo.value = s
  }
  kunciTampil.value = kunci
})
watch(kunciMuat, () => { void muatBagian() })
onMounted(() => { void muatBagian() })
onBeforeUnmount(batal)

// ── pilihan atas ─────────────────────────────────────────────────────────
const opsiBagian = computed(() => opsiDari(BAGIAN_LAPORAN, b => tcf(`laporan.bagian.${b}`) as string))
const opsiHari = computed(() => opsiDari(RENTANG_LAPORAN, h => tcf('laporan.hari')(Number(h)) as string))
const opsiJenis = computed(() => opsiDari(JENIS_LAPORAN, j => tcf(`laporan.jam.jenis.${j}`) as string))
const opsiMode = computed(() => opsiDari(MODE_SALDO, m => tcf(`laporan.saldo.mode.${m}`) as string))
const pilihBagian = (b: BagianLaporan) => setel({ bagian: b, hal: 1 })
const pilihHari = (h: typeof RENTANG_LAPORAN[number]) => setel({ hari: h })
const pilihJenis = (j: typeof JENIS_LAPORAN[number]) => setel({ jenis: j, hal: 1 })
const pilihMode = (m: typeof MODE_SALDO[number]) => setel({ mode: m, hal: 1, urut: urutSah(m, q.value.urut) ? q.value.urut : 'uang_nyata' })
const tgl = (ymd: string) => tanggalPendek(ymd, bahasa.value)
const rentangTeks = (d: { dari: string; sampai: string } | null) => (d?.dari && d.sampai ? tcf('laporan.rentang')(tgl(d.dari), tgl(d.sampai)) : '')

// ── harian ───────────────────────────────────────────────────────────────
const kartuHarian = computed(() => {
  const h = harian.value
  if (!h) return []
  const ket: Record<MetrikHarian, string> = {
    pendaftar: tcf('laporan.harian.ketPendaftar'),
    aktif: tcf('laporan.harian.ketAktif'),
    pencatat: tcf('laporan.harian.ketPencatat'),
    transaksi: tcf('laporan.harian.ketTransaksi'),
    tanya_domi: tcf('laporan.harian.ketTanya')(angka(h.ringkas.penanyaDomi)),
    beli_kredit: tcf('laporan.harian.ketBeli')(rupiah(h.ringkas.beliRupiah)),
    dukung_lunas: tcf('laporan.harian.ketDukung')(rupiah(h.ringkas.dukungRupiah)),
  }
  return METRIK_HARIAN.map(m => {
    const seri = seriHarian(h, m)
    return { m, label: tcf(`laporan.harian.metrik.${m}`) as string, nilai: angka(h.ringkas[KOLOM_METRIK[m]]), ket: ket[m], seri, isi: titikIsi(seri) }
  })
})
const barisHarianTurun = computed(() => [...(harian.value?.baris ?? [])].reverse())

// ── jam ramai ────────────────────────────────────────────────────────────
const hariPanjang = computed(() => tcf('laporan.jam.hariPanjang') as unknown as string[])
const perHariPekan = computed(() => (peta.value?.perHari ?? []).map((nilai, i) => ({ label: hariPanjang.value[i] ?? '', nilai })))

// ── dukung ───────────────────────────────────────────────────────────────
const seriKetuk = computed(() => dukung.value?.harian.map(h => h.ketuk) ?? [])
const labelAsalDukung = (k: string) => { const x = kunciAsalDukung(k); return x ? tcf(`laporan.dukung.asal.${x}`) as string : k }
const barisAsalDukung = computed(() => (dukung.value?.asal ?? []).map(a => ({ label: labelAsalDukung(a.kunci), nilai: a.ketuk, keterangan: tcf('laporan.dukung.ketukKet')(angka(a.orang)) })))

// ── asal pengguna ────────────────────────────────────────────────────────
const barisSumber = computed(() => (asal.value?.sumber ?? []).map(s => ({
  label: s.khusus ? tcf(`laporan.asal.sumberKhusus.${s.khusus}`) as string : s.kunci, nilai: s.orang,
})))
const barisJawaban = computed(() => (asal.value?.jawaban ?? []).map(j => ({ label: tcf(`laporan.asal.jawaban.${j.kunci}`) as string, nilai: j.orang })))

// ── saldo ────────────────────────────────────────────────────────────────
const jalankanCari = async () => {
  if (q.value.hal !== 1) await setel({ hal: 1 })
  cariDiterapkan.value = cari.value.trim()
}
watch(tanpaTim, () => { if (q.value.hal !== 1) void setel({ hal: 1 }) })
const urutPilihan = computed({
  get: () => q.value.urut,
  set: (u: UrutSaldo) => { if (u !== q.value.urut) void setel({ urut: u, arah: u === 'nama' ? 'asc' : 'desc', hal: 1 }) },
})
const pilihanUrut = computed(() => URUT_SALDO.filter(u => urutSah(q.value.mode, u)).map(u => ({ nilai: u, label: tcf(`laporan.saldo.urutOpsi.${u}`) as string })))
const balikArah = () => { void setel({ arah: q.value.arah === 'asc' ? 'desc' : 'asc', hal: 1 }) }
/* Kepala kolom: kunci yang sama membalik arah, kunci lain mulai dari arah wajarnya. */
const urutKolom = (key: string) => {
  const u = URUT_SALDO.find(x => x === key)
  if (!u || !urutSah(q.value.mode, u)) return
  void setel(u === q.value.urut ? { arah: q.value.arah === 'asc' ? 'desc' : 'asc', hal: 1 } : { urut: u, arah: u === 'nama' ? 'asc' : 'desc', hal: 1 })
}
const gantiHalaman = (h: number) => { void setel({ hal: h }) }
const jumlahHal = computed(() => jumlahHalaman(saldo.value?.total ?? 0, PER_SALDO))
const rp = (v: number) => rupiah(v)
const rpRingkas = (v: number) => rupiahRingkasLaporan(v, bahasa.value)
const waktu = (iso: string | null) => (iso ? waktuDetikWib(iso, bahasa.value) : '—')
const kolomRuang = computed(() => [
  { key: 'nama', label: tcf('laporan.saldo.kolom.ruang'), sortable: true, filterable: false },
  { key: 'pemilik', label: tcf('laporan.saldo.kolom.pemilik'), filterable: false },
  { key: 'uang_nyata', label: tcf('laporan.saldo.kolom.uang'), sortable: true, filterable: false, width: '150px', class: 'cf-ka', headerClass: 'cf-ka' },
  { key: 'piutang', label: tcf('laporan.saldo.kolom.piutang'), sortable: true, filterable: false, width: '120px', class: 'cf-ka', headerClass: 'cf-ka' },
  { key: 'minus', label: tcf('laporan.saldo.kolom.minus'), sortable: true, filterable: false, width: '150px', class: 'cf-ka', headerClass: 'cf-ka' },
  { key: 'dompet', label: tcf('laporan.saldo.kolom.dompet'), sortable: true, filterable: false, width: '84px', class: 'cf-ka', headerClass: 'cf-ka' },
  { key: 'anggota', label: tcf('laporan.saldo.kolom.anggota'), sortable: true, filterable: false, width: '92px', class: 'cf-ka', headerClass: 'cf-ka' },
  { key: 'terakhir', label: tcf('laporan.saldo.kolom.terakhir'), sortable: true, filterable: false, width: '170px' },
])
const kolomPengguna = computed(() => [
  { key: 'nama', label: tcf('laporan.saldo.kolom.pengguna'), sortable: true, filterable: false },
  { key: 'pribadi', label: tcf('laporan.saldo.kolom.pribadi'), filterable: false, width: '140px', class: 'cf-ka', headerClass: 'cf-ka' },
  { key: 'usaha', label: tcf('laporan.saldo.kolom.usaha'), filterable: false, width: '140px', class: 'cf-ka', headerClass: 'cf-ka' },
  { key: 'uang_nyata', label: tcf('laporan.saldo.kolom.total'), sortable: true, filterable: false, width: '150px', class: 'cf-ka', headerClass: 'cf-ka' },
  { key: 'piutang', label: tcf('laporan.saldo.kolom.piutang'), sortable: true, filterable: false, width: '120px', class: 'cf-ka', headerClass: 'cf-ka' },
  { key: 'minus', label: tcf('laporan.saldo.kolom.minus'), sortable: true, filterable: false, width: '140px', class: 'cf-ka', headerClass: 'cf-ka' },
  { key: 'ruang_lain', label: tcf('laporan.saldo.kolom.ruangLain'), sortable: true, filterable: false, width: '110px', class: 'cf-ka', headerClass: 'cf-ka' },
  { key: 'terakhir', label: tcf('laporan.saldo.kolom.terakhir'), sortable: true, filterable: false, width: '170px' },
])
interface BarisRuang { id: string; r: SaldoRuang }
interface BarisPengguna { id: string; p: SaldoPengguna }
const barisRuang = computed<BarisRuang[]>(() => (saldo.value?.ruang ?? []).map(r => ({ id: r.id, r })))
const barisPengguna = computed<BarisPengguna[]>(() => (saldo.value?.pengguna ?? []).map(p => ({ id: p.id, p })))
const keRuang360 = (id: string) => `/console/cashflow/ruang/${id}`
const kePengguna360 = (id: string) => `/console/cashflow/pengguna/${id}`
const minusTeks = (n: number, total: number) => (n ? tcf('laporan.saldo.minusIsi')(angka(n), rp(total)) : '—')

useConsoleRemah().pasang(() => [
  { label: tc('layout.cashflow'), to: '/console/cashflow' },
  { label: tcf('nav.laporan') },
])
</script>

<template>
  <div class="space-y-5">
    <ConsolePageHeader :title="tcf('laporan.judul')" :description="tcf('laporan.ket')" kicker="CashFlow" ringkas>
      <template #meta><CashflowNav /></template>
    </ConsolePageHeader>

    <div class="flex flex-wrap items-center gap-2.5" data-uji="laporan-alat">
      <CashflowSegmen :opsi="opsiBagian" :nilai="q.bagian" :label="tcf('laporan.bagianLabel')" gulir @pilih="pilihBagian" />
      <CashflowSegmen v-if="q.bagian !== 'saldo'" :opsi="opsiHari" :nilai="q.hari" :label="tcf('laporan.rentangLabel')" @pilih="pilihHari" />
    </div>

    <!-- Bagian yang RPC-nya belum ada di server. -->
    <div v-if="belumAktif" class="flex items-start gap-3 rounded-xl border border-dashed border-[color:var(--ca-border)] px-4 py-5 text-sm text-[var(--ca-muted)]" role="status" data-uji="laporan-belum-aktif">
      <Icon name="lucide:hourglass" class="mt-0.5 h-5 w-5 shrink-0 text-[var(--ca-subtle)]" aria-hidden="true" />
      <span>{{ tcf('laporan.belumAktif') }}</span>
    </div>
    <CashflowIzinKurang v-else-if="q.bagian === 'saldo' && (!izinSaldo || izinDitolak)" baca :pesan="tcf('laporan.saldo.butuhTotp')" />
    <CashflowKeadaan
      v-else-if="pesanGalat" jenis="galat" :judul="tcf('umum.galatJudul')" :pesan="pesanGalat"
      :label-ulang="tcf('umum.cobaLagi')" :sibuk="memuat" @ulang="muatBagian()"
    />
    <CashflowKeadaan v-else-if="memuat && !adaData" jenis="memuat" :pesan="tcf('umum.memuat')" :baris="5" :kolom="4" />

    <!-- ── Harian ─────────────────────────────────────────────────────── -->
    <template v-else-if="q.bagian === 'harian' && harian">
      <p class="text-xs text-[var(--ca-subtle)]" data-uji="laporan-rentang">{{ rentangTeks(harian) }} {{ tcf('laporan.tanpaTim') }}</p>
      <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" data-uji="laporan-harian-kartu">
        <section v-for="k in kartuHarian" :key="k.m" class="ca-console-dialog min-w-0 p-4" :data-metrik="k.m">
          <p class="text-[0.8125rem] font-bold text-[var(--ca-subtle)]">{{ k.label }}</p>
          <p class="mt-1 text-2xl font-bold tabular-nums text-[var(--ca-text)]">{{ k.nilai }}</p>
          <p class="mt-0.5 text-xs text-[var(--ca-subtle)]">{{ k.ket }}</p>
          <div class="mt-3">
            <CashflowSparkline v-if="k.isi >= 3" :data="k.seri" :label="k.label" :tinggi="40" />
            <p v-else class="text-xs text-[var(--ca-subtle)]">{{ tcf('laporan.sedikit')(k.isi) }}</p>
          </div>
        </section>
      </div>
      <section class="min-w-0">
        <h2 class="mb-3 font-display text-base font-bold text-[var(--ca-text)]">{{ tcf('laporan.harian.tabelJudul') }}</h2>
        <CashflowTabel lebar-min="44rem" data-uji="laporan-harian-tabel">
          <thead>
            <tr>
              <th scope="col">{{ tcf('laporan.harian.kolom.tanggal') }}</th>
              <th scope="col" class="cf-ka">{{ tcf('laporan.harian.kolom.pendaftar') }}</th>
              <th scope="col" class="cf-ka">{{ tcf('laporan.harian.kolom.aktif') }}</th>
              <th scope="col" class="cf-ka">{{ tcf('laporan.harian.kolom.pencatat') }}</th>
              <th scope="col" class="cf-ka">{{ tcf('laporan.harian.kolom.transaksi') }}</th>
              <th scope="col" class="cf-ka">{{ tcf('laporan.harian.kolom.tanya') }}</th>
              <th scope="col" class="cf-ka">{{ tcf('laporan.harian.kolom.beli') }}</th>
              <th scope="col" class="cf-ka">{{ tcf('laporan.harian.kolom.dukung') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="b in barisHarianTurun" :key="b.tanggal">
              <td class="whitespace-nowrap">{{ tgl(b.tanggal) }}</td>
              <td class="cf-ka">{{ angka(b.pendaftar) }}</td>
              <td class="cf-ka">{{ angka(b.aktif) }}</td>
              <td class="cf-ka">{{ angka(b.pencatat) }}</td>
              <td class="cf-ka cf-kuat">{{ angka(b.transaksi) }}</td>
              <td class="cf-ka">{{ angka(b.tanyaDomi) }}</td>
              <td class="cf-ka">{{ angka(b.beliKredit) }}<span v-if="b.beliRupiah" class="cf-dua">{{ rpRingkas(b.beliRupiah) }}</span></td>
              <td class="cf-ka">{{ angka(b.dukungLunas) }}<span v-if="b.dukungRupiah" class="cf-dua">{{ rpRingkas(b.dukungRupiah) }}</span></td>
            </tr>
          </tbody>
        </CashflowTabel>
      </section>
    </template>

    <!-- ── Jam ramai ──────────────────────────────────────────────────── -->
    <template v-else-if="q.bagian === 'jam' && peta">
      <section class="ca-console-dialog min-w-0 p-5" data-uji="laporan-jam">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div class="min-w-0">
            <h2 class="font-display text-base font-bold text-[var(--ca-text)]">{{ tcf('laporan.jam.judul') }}</h2>
            <p class="mt-1 text-xs text-[var(--ca-subtle)]">{{ tcf('laporan.jam.ket') }}</p>
          </div>
          <CashflowSegmen :opsi="opsiJenis" :nilai="q.jenis" :label="tcf('laporan.jam.jenisLabel')" @pilih="pilihJenis" />
        </div>
        <p class="mt-2 text-xs text-[var(--ca-subtle)]">{{ rentangTeks(peta) }} {{ tcf('laporan.tanpaTim') }}</p>
        <p class="mt-1 text-sm font-semibold tabular-nums text-[var(--ca-text)]" data-uji="laporan-jam-total">{{ tcf('laporan.jam.total')(angka(peta.total.transaksi), angka(peta.total.orang)) }}</p>
        <div class="mt-4">
          <CashflowPetaJam :peta="peta" />
        </div>
      </section>
      <section class="ca-console-dialog min-w-0 p-5">
        <h2 class="font-display text-base font-bold text-[var(--ca-text)]">{{ tcf('laporan.jam.perHari') }}</h2>
        <div class="mt-4">
          <CashflowBarRows v-if="peta.total.transaksi" :baris="perHariPekan" />
          <CashflowKeadaanKosong v-else :pesan="tcf('laporan.jam.kosong')" icon="lucide:calendar-clock" />
        </div>
      </section>
    </template>

    <!-- ── Dukung CashFlow ────────────────────────────────────────────── -->
    <template v-else-if="q.bagian === 'dukung' && dukung">
      <p class="rounded-xl border border-[color:var(--ca-gold-border)] bg-[var(--ca-gold-bg)] px-4 py-3 text-sm text-[var(--ca-text)]" data-uji="laporan-dukung-k9">
        {{ tcf('laporan.dukung.k9') }}
        <span class="font-semibold">{{ dukung.ketukPertama ? tcf('laporan.dukung.sejak')(tgl(dukung.ketukPertama)) : tcf('laporan.dukung.belumAda') }}</span>
      </p>
      <p class="text-xs text-[var(--ca-subtle)]">{{ rentangTeks(dukung) }} {{ tcf('laporan.tanpaTim') }}</p>
      <div class="grid gap-4 sm:grid-cols-3">
        <CashflowStatTile icon="lucide:hand-heart" warna="emerald" :label="tcf('laporan.dukung.ketuk')" :nilai="angka(dukung.ringkas.ketuk)" :keterangan="tcf('laporan.dukung.ketukKet')(angka(dukung.ringkas.orangKetuk))" />
        <CashflowStatTile icon="lucide:qr-code" warna="sky" :label="tcf('laporan.dukung.qr')" :nilai="angka(dukung.ringkas.qr)" :keterangan="tcf('laporan.dukung.qrKet')" />
        <CashflowStatTile icon="lucide:heart-handshake" warna="amber" :label="tcf('laporan.dukung.lunas')" :nilai="angka(dukung.ringkas.lunas)" :keterangan="tcf('laporan.dukung.lunasKet')(rupiah(dukung.ringkas.rupiah))" />
      </div>
      <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section class="ca-console-dialog min-w-0 p-5">
          <h2 class="font-display text-base font-bold text-[var(--ca-text)]">{{ tcf('laporan.dukung.grafik') }}</h2>
          <div class="mt-4">
            <CashflowSparkline v-if="titikIsi(seriKetuk) >= 3" :data="seriKetuk" :label="tcf('laporan.dukung.grafik')" />
            <CashflowKeadaanKosong v-else :pesan="tcf('laporan.sedikit')(titikIsi(seriKetuk))" icon="lucide:activity" />
          </div>
        </section>
        <section class="ca-console-dialog min-w-0 p-5">
          <h2 class="font-display text-base font-bold text-[var(--ca-text)]">{{ tcf('laporan.dukung.asalJudul') }}</h2>
          <div class="mt-4">
            <CashflowBarRows v-if="barisAsalDukung.length" :baris="barisAsalDukung" />
            <CashflowKeadaanKosong v-else :pesan="tcf('laporan.dukung.asalKosong')" icon="lucide:hand-heart" />
          </div>
        </section>
      </div>
      <NuxtLink to="/console/cashflow/dukungan" class="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--ca-text)] underline-offset-2 hover:underline">
        {{ tcf('laporan.dukung.keDukungan') }} <Icon name="lucide:chevron-right" class="h-4 w-4" aria-hidden="true" />
      </NuxtLink>
    </template>

    <!-- ── Asal pengguna ──────────────────────────────────────────────── -->
    <template v-else-if="q.bagian === 'asal' && asal">
      <p class="text-sm text-[var(--ca-muted)]">{{ tcf('laporan.asal.ket')(q.hari) }}</p>
      <p class="text-xs font-semibold tabular-nums text-[var(--ca-text)]" data-uji="laporan-asal-ringkas">
        {{ tcf('laporan.asal.ringkas')(angka(asal.adaReferrer), angka(asal.menjawab)) }}
        <span class="font-normal text-[var(--ca-subtle)]">{{ tcf('laporan.asal.tanpaData')(angka(asal.tanpaData)) }}</span>
      </p>
      <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section class="ca-console-dialog min-w-0 p-5" data-uji="laporan-asal-sumber">
          <h2 class="font-display text-base font-bold text-[var(--ca-text)]">{{ tcf('laporan.asal.sumberJudul') }}</h2>
          <div class="mt-4">
            <CashflowBarRows v-if="barisSumber.length" :baris="barisSumber" />
            <CashflowKeadaanKosong v-else :pesan="tcf('laporan.asal.sumberKosong')" icon="lucide:link" />
          </div>
        </section>
        <section class="ca-console-dialog min-w-0 p-5" data-uji="laporan-asal-jawaban">
          <h2 class="font-display text-base font-bold text-[var(--ca-text)]">{{ tcf('laporan.asal.jawabanJudul') }}</h2>
          <div class="mt-4"><CashflowBarRows :baris="barisJawaban" /></div>
        </section>
      </div>
    </template>

    <!-- ── Saldo ──────────────────────────────────────────────────────── -->
    <template v-else-if="q.bagian === 'saldo' && saldo">
      <div class="space-y-1 text-xs text-[var(--ca-muted)]">
        <p>{{ tcf('laporan.saldo.ket') }}</p>
        <p v-if="q.mode === 'pengguna'">{{ tcf('laporan.saldo.ketPengguna') }}</p>
        <p class="text-[var(--ca-subtle)]">{{ tcf('laporan.saldo.audit') }} <template v-if="saldo.dihitungPada">{{ tcf('laporan.saldo.dihitung')(waktu(saldo.dihitungPada)) }}</template></p>
      </div>
      <div class="flex flex-wrap items-center gap-2.5" data-uji="saldo-alat">
        <CashflowSegmen :opsi="opsiMode" :nilai="q.mode" :label="tcf('laporan.saldo.modeLabel')" @pilih="pilihMode" />
        <CashflowSegmen :opsi="opsiJenis" :nilai="q.jenis" :label="tcf('laporan.jam.jenisLabel')" @pilih="pilihJenis" />
        <form class="flex min-w-0 flex-[1_1_18rem] gap-2" @submit.prevent="jalankanCari">
          <input v-model="cari" type="search" maxlength="200" class="ca-input min-w-0 flex-1" :aria-label="tcf('laporan.saldo.cari')" :placeholder="tcf('laporan.saldo.cari')" data-uji="saldo-cari">
          <button type="submit" class="ca-btn-secondary !px-4 !py-2 text-sm">{{ tcf('laporan.saldo.cariTombol') }}</button>
        </form>
        <label class="inline-flex items-center gap-2 text-sm font-semibold text-[var(--ca-muted)]">
          <input v-model="tanpaTim" type="checkbox" class="h-4 w-4" data-uji="saldo-tanpa-tim">{{ tcf('laporan.saldo.tanpaTim') }}
        </label>
        <div class="flex min-w-0 items-center gap-1.5">
          <label class="flex min-w-0 items-center gap-2 text-sm font-semibold text-[var(--ca-muted)]">
            {{ tcf('laporan.saldo.urut') }}
            <select v-model="urutPilihan" class="ca-input min-w-0 !w-auto !py-2 text-sm font-semibold" data-uji="saldo-urut">
              <option v-for="o in pilihanUrut" :key="o.nilai" :value="o.nilai">{{ o.label }}</option>
            </select>
          </label>
          <button
            type="button" class="ca-btn-secondary !px-2.5 !py-2" data-uji="saldo-arah" :data-arah="q.arah"
            :aria-label="`${tcf('laporan.saldo.urut')}: ${q.arah === 'desc' ? tcf('laporan.saldo.turun') : tcf('laporan.saldo.naik')}`"
            :title="tcf('laporan.saldo.arahUrut')(q.arah === 'desc')" @click="balikArah"
          ><Icon :name="q.arah === 'desc' ? 'lucide:arrow-down' : 'lucide:arrow-up'" class="h-4 w-4" aria-hidden="true" /></button>
        </div>
      </div>

      <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-5" data-uji="saldo-ubin">
        <CashflowStatTile icon="lucide:wallet" warna="emerald" :label="tcf('laporan.saldo.ubinUang')" :nilai="rp(saldo.ringkas.isi.uangNyata)" :keterangan="tcf('laporan.saldo.ubinUangKet')(angka(saldo.ringkas.jumlah))" />
        <CashflowStatTile icon="lucide:user" warna="sky" :label="tcf('laporan.saldo.ubinPribadi')" :nilai="rp(saldo.ringkas.pribadi.uangNyata)" :keterangan="tcf('laporan.saldo.ubinRuangKet')(angka(saldo.ringkas.pribadi.ruang))" />
        <CashflowStatTile icon="lucide:store" warna="amber" :label="tcf('laporan.saldo.ubinUsaha')" :nilai="rp(saldo.ringkas.usaha.uangNyata)" :keterangan="tcf('laporan.saldo.ubinRuangKet')(angka(saldo.ringkas.usaha.ruang))" />
        <CashflowStatTile icon="lucide:notebook-pen" warna="netral" :label="tcf('laporan.saldo.ubinPiutang')" :nilai="rp(saldo.ringkas.isi.piutang)" :keterangan="tcf('laporan.saldo.ubinPiutangKet')" />
        <CashflowStatTile icon="lucide:trending-down" warna="rose" :label="tcf('laporan.saldo.ubinMinus')" :nilai="rp(saldo.ringkas.isi.dompetMinusTotal)" :keterangan="tcf('laporan.saldo.ubinMinusKet')(angka(saldo.ringkas.isi.dompetMinus))" />
      </div>

      <CashflowKeadaan v-if="!saldo.total" jenis="kosong" icon="lucide:wallet" :judul="tcf('umum.kosongSaringJudul')" :pesan="tcf('laporan.saldo.kosong')" />
      <div v-else class="min-w-0 space-y-3" data-uji="saldo-daftar">
        <!-- Layar lebar: tabel berurut server. Layar sempit: satu kartu per baris. -->
        <div class="cf-tabel-wadah hidden lg:block">
          <DataTable
            v-if="q.mode === 'ruang'"
            :columns="kolomRuang" :data="barisRuang" :loading="memuat" :sort="{ key: q.urut, arah: q.arah }" :show-count="false"
            @sort="urutKolom" @row-click="(row: BarisRuang) => navigateTo(keRuang360(row.id))"
          >
            <template #cell-nama="{ row }">
              <NuxtLink :to="keRuang360(row.id)" class="cf-kuat block min-w-0 truncate underline-offset-2 hover:underline" :title="row.r.nama" :aria-label="tcf('laporan.saldo.bukaRuang')(row.r.nama)" @click.stop>{{ row.r.nama }}</NuxtLink>
              <span class="cf-dua flex items-center gap-1.5">
                <span>{{ tcf(`laporan.saldo.jenis.${row.r.jenis}`) }}</span>
                <span v-if="row.r.internal" class="ca-pill-info !px-1.5 !py-0 text-[0.7rem]" :title="tcf('laporan.saldo.timKet')">{{ tcf('laporan.saldo.tim') }}</span>
              </span>
            </template>
            <template #cell-pemilik="{ row }">
              <NuxtLink v-if="row.r.pemilikId" :to="kePengguna360(row.r.pemilikId)" class="block min-w-0 truncate underline-offset-2 hover:underline" :title="row.r.pemilikEmail" @click.stop>{{ row.r.pemilikEmail }}</NuxtLink>
              <span v-if="row.r.pemilikNama" class="cf-dua block truncate">{{ row.r.pemilikNama }}</span>
            </template>
            <template #cell-uang_nyata="{ row }"><span class="cf-kuat whitespace-nowrap" :class="row.r.isi.uangNyata < 0 ? 'ca-tone-danger' : ''">{{ rp(row.r.isi.uangNyata) }}</span></template>
            <template #cell-piutang="{ row }"><span class="whitespace-nowrap">{{ rp(row.r.isi.piutang) }}</span><span v-if="row.r.isi.arsip" class="cf-dua whitespace-nowrap">{{ tcf('laporan.saldo.kolom.arsip') }} {{ rpRingkas(row.r.isi.arsip) }}</span></template>
            <template #cell-minus="{ row }"><span class="whitespace-nowrap" :class="row.r.isi.dompetMinus ? 'ca-tone-danger' : 'cf-redup'">{{ minusTeks(row.r.isi.dompetMinus, row.r.isi.dompetMinusTotal) }}</span></template>
            <template #cell-dompet="{ row }">{{ angka(row.r.isi.dompet) }}</template>
            <template #cell-anggota="{ row }">{{ angka(row.r.anggota) }}</template>
            <template #cell-terakhir="{ row }"><span class="whitespace-nowrap text-xs">{{ waktu(row.r.terakhir) }}</span></template>
          </DataTable>
          <DataTable
            v-else
            :columns="kolomPengguna" :data="barisPengguna" :loading="memuat" :sort="{ key: q.urut, arah: q.arah }" :show-count="false"
            @sort="urutKolom" @row-click="(row: BarisPengguna) => navigateTo(kePengguna360(row.id))"
          >
            <template #cell-nama="{ row }">
              <NuxtLink :to="kePengguna360(row.id)" class="cf-kuat block min-w-0 truncate underline-offset-2 hover:underline" :title="row.p.email" :aria-label="tcf('laporan.saldo.bukaPengguna')(row.p.email)" @click.stop>{{ row.p.email }}</NuxtLink>
              <span class="cf-dua flex min-w-0 items-center gap-1.5">
                <span v-if="row.p.internal" class="ca-pill-info shrink-0 !px-1.5 !py-0 text-[0.7rem]" :title="tcf('laporan.saldo.timKet')">{{ tcf('laporan.saldo.tim') }}</span>
                <span v-if="row.p.nama" class="min-w-0 truncate">{{ row.p.nama }}</span>
              </span>
            </template>
            <template #cell-pribadi="{ row }"><span class="whitespace-nowrap" :class="row.p.pribadi.uangNyata < 0 ? 'ca-tone-danger' : ''">{{ rp(row.p.pribadi.uangNyata) }}</span><span class="cf-dua whitespace-nowrap">{{ tcf('laporan.saldo.ruangMilik')(angka(row.p.pribadi.ruang)) }}</span></template>
            <template #cell-usaha="{ row }"><span class="whitespace-nowrap" :class="row.p.usaha.uangNyata < 0 ? 'ca-tone-danger' : ''">{{ rp(row.p.usaha.uangNyata) }}</span><span class="cf-dua whitespace-nowrap">{{ tcf('laporan.saldo.ruangMilik')(angka(row.p.usaha.ruang)) }}</span></template>
            <template #cell-uang_nyata="{ row }"><span class="cf-kuat whitespace-nowrap" :class="row.p.total.uangNyata < 0 ? 'ca-tone-danger' : ''">{{ rp(row.p.total.uangNyata) }}</span></template>
            <template #cell-piutang="{ row }"><span class="whitespace-nowrap">{{ rp(row.p.total.piutang) }}</span></template>
            <template #cell-minus="{ row }"><span class="whitespace-nowrap" :class="row.p.total.dompetMinus ? 'ca-tone-danger' : 'cf-redup'">{{ minusTeks(row.p.total.dompetMinus, row.p.total.dompetMinusTotal) }}</span></template>
            <template #cell-ruang_lain="{ row }"><span :title="row.p.ruangLain ? tcf('laporan.saldo.ruangLain')(angka(row.p.ruangLain)) : tcf('laporan.saldo.tanpaRuangLain')">{{ angka(row.p.ruangLain) }}</span></template>
            <template #cell-terakhir="{ row }"><span class="whitespace-nowrap text-xs">{{ waktu(row.p.terakhir) }}</span></template>
          </DataTable>
        </div>

        <ul class="min-w-0 space-y-3 lg:hidden" :aria-busy="memuat">
          <template v-if="q.mode === 'ruang'">
            <li v-for="row in barisRuang" :key="row.id" class="ca-console-dialog relative min-w-0 p-4">
              <NuxtLink :to="keRuang360(row.id)" class="cf-kuat block min-w-0 break-words text-[0.9375rem] after:absolute after:inset-0 after:rounded-[inherit]">{{ row.r.nama }}</NuxtLink>
              <p class="mt-1 flex min-w-0 flex-wrap items-center gap-1.5 text-xs text-[var(--ca-muted)]">
                <span>{{ tcf(`laporan.saldo.jenis.${row.r.jenis}`) }}</span>
                <span v-if="row.r.internal" class="ca-pill-info !px-2 !py-0.5 text-[0.7rem]">{{ tcf('laporan.saldo.tim') }}</span>
                <span class="min-w-0 break-all">{{ row.r.pemilikEmail }}</span>
              </p>
              <dl class="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 border-t border-[color:var(--ca-border)] pt-3">
                <div class="min-w-0"><dt class="text-xs font-semibold text-[var(--ca-subtle)]">{{ tcf('laporan.saldo.kolom.uang') }}</dt><dd class="cf-kuat mt-0.5 break-words text-sm tabular-nums" :class="row.r.isi.uangNyata < 0 ? 'ca-tone-danger' : ''">{{ rp(row.r.isi.uangNyata) }}</dd></div>
                <div class="min-w-0"><dt class="text-xs font-semibold text-[var(--ca-subtle)]">{{ tcf('laporan.saldo.kolom.piutang') }}</dt><dd class="mt-0.5 break-words text-sm tabular-nums text-[var(--ca-text)]">{{ rp(row.r.isi.piutang) }}</dd></div>
                <div class="min-w-0"><dt class="text-xs font-semibold text-[var(--ca-subtle)]">{{ tcf('laporan.saldo.kolom.minus') }}</dt><dd class="mt-0.5 break-words text-sm tabular-nums text-[var(--ca-text)]">{{ minusTeks(row.r.isi.dompetMinus, row.r.isi.dompetMinusTotal) }}</dd></div>
                <div class="min-w-0"><dt class="text-xs font-semibold text-[var(--ca-subtle)]">{{ tcf('laporan.saldo.kolom.terakhir') }}</dt><dd class="mt-0.5 break-words text-xs tabular-nums text-[var(--ca-text)]">{{ waktu(row.r.terakhir) }}</dd></div>
              </dl>
            </li>
          </template>
          <template v-else>
            <li v-for="row in barisPengguna" :key="row.id" class="ca-console-dialog relative min-w-0 p-4">
              <NuxtLink :to="kePengguna360(row.id)" class="cf-kuat block min-w-0 break-all text-[0.9375rem] after:absolute after:inset-0 after:rounded-[inherit]">{{ row.p.email }}</NuxtLink>
              <p v-if="row.p.nama || row.p.internal" class="mt-1 flex min-w-0 flex-wrap items-center gap-1.5 text-xs text-[var(--ca-muted)]">
                <span v-if="row.p.internal" class="ca-pill-info !px-2 !py-0.5 text-[0.7rem]">{{ tcf('laporan.saldo.tim') }}</span>
                <span v-if="row.p.nama" class="min-w-0 break-words">{{ row.p.nama }}</span>
              </p>
              <dl class="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 border-t border-[color:var(--ca-border)] pt-3">
                <div class="min-w-0"><dt class="text-xs font-semibold text-[var(--ca-subtle)]">{{ tcf('laporan.saldo.kolom.total') }}</dt><dd class="cf-kuat mt-0.5 break-words text-sm tabular-nums" :class="row.p.total.uangNyata < 0 ? 'ca-tone-danger' : ''">{{ rp(row.p.total.uangNyata) }}</dd></div>
                <div class="min-w-0"><dt class="text-xs font-semibold text-[var(--ca-subtle)]">{{ tcf('laporan.saldo.kolom.ruangLain') }}</dt><dd class="mt-0.5 text-sm tabular-nums text-[var(--ca-text)]">{{ angka(row.p.ruangLain) }}</dd></div>
                <div class="min-w-0"><dt class="text-xs font-semibold text-[var(--ca-subtle)]">{{ tcf('laporan.saldo.kolom.pribadi') }}</dt><dd class="mt-0.5 break-words text-sm tabular-nums text-[var(--ca-text)]">{{ rp(row.p.pribadi.uangNyata) }}</dd></div>
                <div class="min-w-0"><dt class="text-xs font-semibold text-[var(--ca-subtle)]">{{ tcf('laporan.saldo.kolom.usaha') }}</dt><dd class="mt-0.5 break-words text-sm tabular-nums text-[var(--ca-text)]">{{ rp(row.p.usaha.uangNyata) }}</dd></div>
              </dl>
            </li>
          </template>
        </ul>
        <CashflowHalaman :hal="q.hal" :jumlah-halaman="jumlahHal" :total="saldo.total" :per="PER_SALDO" :memuat="memuat" lompat @ganti="gantiHalaman" />
      </div>
    </template>
  </div>
</template>
