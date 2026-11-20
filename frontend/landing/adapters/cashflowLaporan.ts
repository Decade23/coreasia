/**
 * Halaman Laporan console CashFlow: saldo uang nyata, jam ramai, angka
 * harian, ketukan Dukung CashFlow, dan asal pengguna.
 *
 * KONTRAK RPC (dibandingkan dengan migrasi oleh tests/cashflow/laporan.test.ts):
 * - admin_laporan_jam_ramai(p_hari 7..90, p_jenis null|pribadi|usaha)
 *   {hari, dari, sampai, jenis, zona, sel[{dow, jam, transaksi, orang}],
 *   total{transaksi, orang}}. dow ISO 1 Senin .. 7 Minggu, jam 0..23 WIB.
 *   Hanya sel berisi yang dikirim. Izin view.
 * - admin_laporan_harian(p_hari 7..90) {hari, dari, sampai, baris[...],
 *   ringkas{...}}: satu baris per tanggal. Izin view.
 * - admin_laporan_dukung(p_hari 7..90) {hari, dari, sampai, ketuk_pertama,
 *   harian[...], asal[{kunci, ketuk, orang}], ringkas{...}}. Izin view.
 *   Ketukan baru tercatat sejak aplikasi 1.4.4.
 * - admin_laporan_saldo(p_mode, p_jenis, p_cari, p_urut, p_arah, p_limit,
 *   p_offset, p_tanpa_internal, p_alasan) {mode, jenis, total, limit, offset,
 *   dihitung_pada, baris[...], ringkas{...}}. Izin pii, alasan wajib, setiap
 *   panggilan tercatat di audit (laporan_saldo).
 * - admin_laporan_asal(p_hari 7..365) {hari, sumber[{kunci, orang}],
 *   jawaban[{kunci, orang}], tanpa_data}. Migrasinya milik tiket lain
 *   (aplikasi 1.4.4). Server lama tidak punya RPC ini: halaman menulis
 *   "belum aktif" (PGRST202), bukan galat.
 * Ketiga laporan grafik berhenti di KEMARIN (WIB) dan tidak menghitung akun
 * internal, admin, daftar pengecualian, maupun akun uji pembelian.
 *
 * Fungsi MURNI semua: tanpa jaringan, tanpa state.
 */
import type { OpsiSegmen } from '~/utils/cashflow/segmen'

/** bigint dan numeric bisa pulang sebagai string. */
type Angka = number | string | null

/** Bagian halaman, urutan tab. Saldo terakhir karena butuh izin lebih dan menulis audit. */
export const BAGIAN_LAPORAN = ['harian', 'jam', 'dukung', 'asal', 'kebiasaan', 'saldo'] as const
export type BagianLaporan = typeof BAGIAN_LAPORAN[number]
/** Pilihan rentang (hari penuh sampai kemarin). Server menerima 7..90. */
export const RENTANG_LAPORAN = ['7', '30', '90'] as const
export type RentangLaporan = typeof RENTANG_LAPORAN[number]
/** Jenis ruang. 'semua' = null ke server. */
export const JENIS_LAPORAN = ['semua', 'pribadi', 'usaha'] as const
export type JenisLaporan = typeof JENIS_LAPORAN[number]
export const MODE_SALDO = ['ruang', 'pengguna'] as const
export type ModeSaldo = typeof MODE_SALDO[number]
/** Nilai p_urut yang dikenal server. anggota hanya mode ruang, ruang_lain hanya mode pengguna. */
export const URUT_SALDO = ['uang_nyata', 'piutang', 'arsip', 'dompet', 'minus', 'nama', 'terakhir', 'anggota', 'ruang_lain'] as const
export type UrutSaldo = typeof URUT_SALDO[number]
export const URUT_SALDO_RUANG: readonly UrutSaldo[] = ['uang_nyata', 'piutang', 'arsip', 'dompet', 'minus', 'nama', 'terakhir', 'anggota']
export const URUT_SALDO_PENGGUNA: readonly UrutSaldo[] = ['uang_nyata', 'piutang', 'arsip', 'dompet', 'minus', 'nama', 'terakhir', 'ruang_lain']
/** Baris per halaman laporan saldo. Server menerima sampai 100. */
export const PER_SALDO = 25
/** Alasan tetap untuk laporan saldo (pola daftar pengguna): halaman ini
 *  sendiri tujuannya. Server menuntut minimal 8 huruf dan mengauditnya. */
export const ALASAN_LAPORAN_SALDO = 'Laporan saldo uang nyata di console'
/** Kunci jawaban asal pengguna, urutan tetap dari server (kontrak spek). */
export const JAWABAN_ASAL = ['instagram', 'tiktok', 'whatsapp_teman', 'google', 'play_store', 'lainnya', 'lewati'] as const
export type JawabanAsal = typeof JAWABAN_ASAL[number]
/** Kunci asal ketukan Dukung yang punya label sendiri. Selain ini tampil apa adanya. */
export const ASAL_DUKUNG = ['setelan', 'pengumuman', 'lain', 'tanpa'] as const
/** Versi aplikasi pertama yang mencatat ketukan Dukung CashFlow (K9). */
export const VERSI_KETUK_DUKUNG = '1.4.4'
/** dow ISO 1..7, Senin dulu. */
export const HARI_PEKAN = [1, 2, 3, 4, 5, 6, 7] as const

export const jenisKeServer = (j: JenisLaporan): 'pribadi' | 'usaha' | null => (j === 'semua' ? null : j)
export const urutSah = (mode: ModeSaldo, urut: UrutSaldo): boolean =>
  (mode === 'ruang' ? URUT_SALDO_RUANG : URUT_SALDO_PENGGUNA).includes(urut)

// ── DTO: persis seperti yang dipulangkan RPC ─────────────────────────────
export interface SelJamDTO { dow: Angka; jam: Angka; transaksi: Angka; orang: Angka }
export interface JamRamaiDTO {
  hari: Angka; dari: string; sampai: string; jenis: string | null; zona: string
  sel: SelJamDTO[]; total: { transaksi: Angka; orang: Angka }
}
export interface BarisHarianDTO {
  tanggal: string; pendaftar: Angka; aktif: Angka; pencatat: Angka; transaksi: Angka
  tanya_domi: Angka; penanya_domi: Angka; beli_kredit: Angka; beli_rupiah: Angka
  dukung_lunas: Angka; dukung_rupiah: Angka
}
export interface HarianDTO {
  hari: Angka; dari: string; sampai: string; baris: BarisHarianDTO[]; ringkas: Omit<BarisHarianDTO, 'tanggal'>
}
export interface DukungHariDTO { tanggal: string; ketuk: Angka; orang_ketuk: Angka; qr: Angka; lunas: Angka; rupiah: Angka }
export interface DukungDTO {
  hari: Angka; dari: string; sampai: string; ketuk_pertama: string | null
  harian: DukungHariDTO[]; asal: Array<{ kunci: string; ketuk: Angka; orang: Angka }>
  ringkas: { ketuk: Angka; orang_ketuk: Angka; qr: Angka; lunas: Angka; rupiah: Angka }
}
export interface AsalDTO {
  hari: Angka; sumber: Array<{ kunci: string; orang: Angka }>; jawaban: Array<{ kunci: string; orang: Angka }>; tanpa_data: Angka
}
export interface IsiSaldoDTO {
  ruang: Angka; dompet: Angka; uang_nyata: Angka; piutang: Angka; arsip: Angka; dompet_minus: Angka; dompet_minus_total: Angka
}
export interface SaldoRuangDTO {
  workspace_id: string; nama: string | null; jenis: string; pemilik_id: string | null; pemilik_email: string | null
  pemilik_nama: string | null; internal: boolean; jumlah_anggota: Angka; jumlah_dompet: Angka; uang_nyata: Angka
  piutang: Angka; arsip: Angka; dompet_minus: Angka; dompet_minus_total: Angka; terakhir_catat: string | null
}
export interface SaldoPenggunaDTO {
  user_id: string; email: string | null; nama: string | null; internal: boolean
  pribadi: IsiSaldoDTO; usaha: IsiSaldoDTO; total: IsiSaldoDTO; ruang_lain: Angka; terakhir_catat: string | null
}
export interface RingkasSaldoDTO {
  jumlah: Angka; ruang: Angka; dompet: Angka; uang_nyata: Angka; piutang: Angka; arsip: Angka
  dompet_minus: Angka; dompet_minus_total: Angka; internal: Angka
  pribadi: { ruang: Angka; uang_nyata: Angka; piutang: Angka }
  usaha: { ruang: Angka; uang_nyata: Angka; piutang: Angka }
}
export interface SaldoDTO {
  mode: ModeSaldo; jenis: string | null; total: Angka; limit: Angka; offset: Angka; dihitung_pada: string
  baris: Array<SaldoRuangDTO | SaldoPenggunaDTO>; ringkas: RingkasSaldoDTO
}

// ── Domain ───────────────────────────────────────────────────────────────
const n = (v: Angka | undefined): number => {
  const x = typeof v === 'string' ? Number(v) : (v ?? 0)
  return Number.isFinite(x) ? x : 0
}

export interface SelJam { dow: number; jam: number; transaksi: number; orang: number }
export interface PetaJam {
  /** 7 baris (Senin..Minggu) x 24 kolom (jam 0..23). Sel kosong bernilai nol. */
  sel: SelJam[][]
  maks: number
  total: { transaksi: number; orang: number }
  /** Jumlah per hari pekan (indeks 0 = Senin) dan per jam. */
  perHari: number[]
  perJam: number[]
  /** Sel tersibuk, null bila kosong. Seri: hari lebih awal, lalu jam lebih awal. */
  puncak: SelJam | null
  dari: string
  sampai: string
}

export function kePetaJam(d: JamRamaiDTO | null | undefined): PetaJam {
  const sel: SelJam[][] = HARI_PEKAN.map(dow => Array.from({ length: 24 }, (_, jam) => ({ dow, jam, transaksi: 0, orang: 0 })))
  for (const s of d?.sel ?? []) {
    const dow = n(s.dow)
    const jam = n(s.jam)
    if (!Number.isInteger(dow) || !Number.isInteger(jam) || dow < 1 || dow > 7 || jam < 0 || jam > 23) continue
    sel[dow - 1]![jam] = { dow, jam, transaksi: Math.max(0, n(s.transaksi)), orang: Math.max(0, n(s.orang)) }
  }
  const datar = sel.flat()
  let puncak: SelJam | null = null
  for (const s of datar) if (s.transaksi > 0 && (!puncak || s.transaksi > puncak.transaksi)) puncak = s
  return {
    sel,
    maks: Math.max(0, ...datar.map(s => s.transaksi)),
    total: { transaksi: n(d?.total?.transaksi), orang: n(d?.total?.orang) },
    perHari: sel.map(b => b.reduce((a, s) => a + s.transaksi, 0)),
    perJam: Array.from({ length: 24 }, (_, j) => sel.reduce((a, b) => a + b[j]!.transaksi, 0)),
    puncak,
    dari: d?.dari ?? '',
    sampai: d?.sampai ?? '',
  }
}

/** Tingkat warna sel peta: 0 kosong, 1..4 makin ramai (seperempat dari sel tersibuk). */
export function tingkatSel(nilai: number, maks: number): 0 | 1 | 2 | 3 | 4 {
  if (nilai <= 0 || maks <= 0) return 0
  const r = nilai / maks
  return r > 0.75 ? 4 : r > 0.5 ? 3 : r > 0.25 ? 2 : 1
}

export const METRIK_HARIAN = [
  'pendaftar', 'aktif', 'pencatat', 'transaksi', 'tanya_domi', 'beli_kredit', 'dukung_lunas',
] as const
export type MetrikHarian = typeof METRIK_HARIAN[number]
export interface BarisHarian {
  tanggal: string; pendaftar: number; aktif: number; pencatat: number; transaksi: number
  tanyaDomi: number; penanyaDomi: number; beliKredit: number; beliRupiah: number; dukungLunas: number; dukungRupiah: number
}
export interface Harian { baris: BarisHarian[]; ringkas: Omit<BarisHarian, 'tanggal'>; dari: string; sampai: string }
const barisHarian = (b: Partial<BarisHarianDTO> | null | undefined): Omit<BarisHarian, 'tanggal'> => ({
  pendaftar: n(b?.pendaftar), aktif: n(b?.aktif), pencatat: n(b?.pencatat), transaksi: n(b?.transaksi),
  tanyaDomi: n(b?.tanya_domi), penanyaDomi: n(b?.penanya_domi), beliKredit: n(b?.beli_kredit), beliRupiah: n(b?.beli_rupiah),
  dukungLunas: n(b?.dukung_lunas), dukungRupiah: n(b?.dukung_rupiah),
})
export function keHarian(d: HarianDTO | null | undefined): Harian {
  const baris = (d?.baris ?? [])
    .filter(b => typeof b?.tanggal === 'string')
    .map(b => ({ tanggal: b.tanggal.slice(0, 10), ...barisHarian(b) }))
    .sort((a, b) => a.tanggal.localeCompare(b.tanggal))
  return { baris, ringkas: barisHarian(d?.ringkas), dari: d?.dari ?? '', sampai: d?.sampai ?? '' }
}
/** Kunci kamus → kolom domain. */
export const KOLOM_METRIK: Readonly<Record<MetrikHarian, keyof Omit<BarisHarian, 'tanggal'>>> = {
  pendaftar: 'pendaftar', aktif: 'aktif', pencatat: 'pencatat', transaksi: 'transaksi',
  tanya_domi: 'tanyaDomi', beli_kredit: 'beliKredit', dukung_lunas: 'dukungLunas',
}
export const seriHarian = (h: Harian, m: MetrikHarian): number[] => h.baris.map(b => b[KOLOM_METRIK[m]])
/** Banyaknya hari yang tidak nol: grafik garis baru bermakna mulai tiga titik. */
export const titikIsi = (seri: readonly number[]): number => seri.filter(v => v > 0).length

export interface Dukung {
  ketukPertama: string | null
  harian: Array<{ tanggal: string; ketuk: number; orangKetuk: number; qr: number; lunas: number; rupiah: number }>
  asal: Array<{ kunci: string; ketuk: number; orang: number }>
  ringkas: { ketuk: number; orangKetuk: number; qr: number; lunas: number; rupiah: number }
  dari: string
  sampai: string
}
export function keDukung(d: DukungDTO | null | undefined): Dukung {
  return {
    ketukPertama: typeof d?.ketuk_pertama === 'string' ? d.ketuk_pertama.slice(0, 10) : null,
    harian: (d?.harian ?? []).filter(h => typeof h?.tanggal === 'string').map(h => ({
      tanggal: h.tanggal.slice(0, 10), ketuk: n(h.ketuk), orangKetuk: n(h.orang_ketuk), qr: n(h.qr), lunas: n(h.lunas), rupiah: n(h.rupiah),
    })).sort((a, b) => a.tanggal.localeCompare(b.tanggal)),
    asal: (d?.asal ?? []).filter(a => typeof a?.kunci === 'string').map(a => ({ kunci: a.kunci, ketuk: n(a.ketuk), orang: n(a.orang) })),
    ringkas: {
      ketuk: n(d?.ringkas?.ketuk), orangKetuk: n(d?.ringkas?.orang_ketuk), qr: n(d?.ringkas?.qr),
      lunas: n(d?.ringkas?.lunas), rupiah: n(d?.ringkas?.rupiah),
    },
    dari: d?.dari ?? '',
    sampai: d?.sampai ?? '',
  }
}
/** Kunci asal Dukung yang punya label kamus, selain itu null (tampil apa adanya). */
export const kunciAsalDukung = (k: string): typeof ASAL_DUKUNG[number] | null =>
  (ASAL_DUKUNG as readonly string[]).includes(k) ? (k as typeof ASAL_DUKUNG[number]) : null

export interface Asal {
  sumber: Array<{ kunci: string; orang: number; khusus: 'tanpa_utm' | 'lain' | null }>
  jawaban: Array<{ kunci: JawabanAsal; orang: number }>
  tanpaData: number
  /** Orang dengan referrer (sumber) dan orang yang menjawab sungguhan (bukan lewati). */
  adaReferrer: number
  menjawab: number
}
export function keAsal(d: AsalDTO | null | undefined): Asal {
  const sumber = (d?.sumber ?? []).filter(s => typeof s?.kunci === 'string').map(s => ({
    kunci: s.kunci, orang: n(s.orang),
    khusus: s.kunci === '(tanpa_utm)' ? 'tanpa_utm' as const : s.kunci === '(lain)' ? 'lain' as const : null,
  }))
  const dariServer = new Map((d?.jawaban ?? []).map(j => [j?.kunci, n(j?.orang)]))
  const jawaban = JAWABAN_ASAL.map(kunci => ({ kunci, orang: dariServer.get(kunci) ?? 0 }))
  return {
    sumber,
    jawaban,
    tanpaData: n(d?.tanpa_data),
    adaReferrer: sumber.reduce((a, s) => a + s.orang, 0),
    menjawab: jawaban.filter(j => j.kunci !== 'lewati').reduce((a, j) => a + j.orang, 0),
  }
}

export interface IsiSaldo {
  ruang: number; dompet: number; uangNyata: number; piutang: number; arsip: number; dompetMinus: number; dompetMinusTotal: number
}
const keIsi = (x: Partial<IsiSaldoDTO> | null | undefined): IsiSaldo => ({
  ruang: n(x?.ruang), dompet: n(x?.dompet), uangNyata: n(x?.uang_nyata), piutang: n(x?.piutang), arsip: n(x?.arsip),
  dompetMinus: n(x?.dompet_minus), dompetMinusTotal: n(x?.dompet_minus_total),
})
export interface SaldoRuang {
  id: string; nama: string; jenis: 'pribadi' | 'usaha'; pemilikId: string | null; pemilikEmail: string; pemilikNama: string
  internal: boolean; anggota: number; isi: IsiSaldo; terakhir: string | null
}
export interface SaldoPengguna {
  id: string; email: string; nama: string; internal: boolean; pribadi: IsiSaldo; usaha: IsiSaldo; total: IsiSaldo
  ruangLain: number; terakhir: string | null
}
export interface RingkasSaldo {
  jumlah: number; isi: IsiSaldo; internal: number
  pribadi: { ruang: number; uangNyata: number; piutang: number }
  usaha: { ruang: number; uangNyata: number; piutang: number }
}
export interface Saldo {
  mode: ModeSaldo; total: number; ruang: SaldoRuang[]; pengguna: SaldoPengguna[]; ringkas: RingkasSaldo; dihitungPada: string | null
}
const sisiRingkas = (x: { ruang?: Angka; uang_nyata?: Angka; piutang?: Angka } | null | undefined) =>
  ({ ruang: n(x?.ruang), uangNyata: n(x?.uang_nyata), piutang: n(x?.piutang) })
export function keSaldo(d: SaldoDTO | null | undefined): Saldo {
  const mode: ModeSaldo = d?.mode === 'pengguna' ? 'pengguna' : 'ruang'
  const baris = d?.baris ?? []
  const r = d?.ringkas
  return {
    mode,
    total: n(d?.total),
    ruang: mode !== 'ruang' ? [] : (baris as SaldoRuangDTO[]).filter(b => typeof b?.workspace_id === 'string').map(b => ({
      id: b.workspace_id, nama: b.nama ?? '', jenis: b.jenis === 'usaha' ? 'usaha' : 'pribadi',
      pemilikId: b.pemilik_id ?? null, pemilikEmail: b.pemilik_email ?? '', pemilikNama: b.pemilik_nama ?? '',
      internal: b.internal === true, anggota: n(b.jumlah_anggota),
      isi: keIsi({
        ruang: 1, dompet: b.jumlah_dompet, uang_nyata: b.uang_nyata, piutang: b.piutang, arsip: b.arsip,
        dompet_minus: b.dompet_minus, dompet_minus_total: b.dompet_minus_total,
      }),
      terakhir: b.terakhir_catat ?? null,
    })),
    pengguna: mode !== 'pengguna' ? [] : (baris as SaldoPenggunaDTO[]).filter(b => typeof b?.user_id === 'string').map(b => ({
      id: b.user_id, email: b.email ?? '', nama: b.nama ?? '', internal: b.internal === true,
      pribadi: keIsi(b.pribadi), usaha: keIsi(b.usaha), total: keIsi(b.total), ruangLain: n(b.ruang_lain), terakhir: b.terakhir_catat ?? null,
    })),
    ringkas: {
      jumlah: n(r?.jumlah),
      isi: keIsi({ ruang: r?.ruang, dompet: r?.dompet, uang_nyata: r?.uang_nyata, piutang: r?.piutang, arsip: r?.arsip,
        dompet_minus: r?.dompet_minus, dompet_minus_total: r?.dompet_minus_total }),
      internal: n(r?.internal),
      pribadi: sisiRingkas(r?.pribadi),
      usaha: sisiRingkas(r?.usaha),
    },
    dihitungPada: typeof d?.dihitung_pada === 'string' ? d.dihitung_pada : null,
  }
}

/** Opsi pil dengan label dari kamus (pemanggil mengirim tcf). */
export const opsiDari = <T extends string>(nilai: readonly T[], label: (v: T) => string): OpsiSegmen<T>[] =>
  nilai.map(v => ({ nilai: v, label: label(v) }))

/** Rupiah ringkas untuk ubin: 1,2 M / 3,4 jt / 950 rb. Tanda minus dipertahankan. */
export function rupiahRingkasLaporan(v: number, bahasa: 'id' | 'en' = 'id'): string {
  const a = Math.abs(v)
  const tanda = v < 0 ? '−' : ''
  const koma = (x: number) => (Math.round(x * 10) / 10).toString().replace('.', bahasa === 'id' ? ',' : '.')
  if (a >= 1e12) return `${tanda}Rp ${koma(a / 1e12)} ${bahasa === 'id' ? 'T' : 'T'}`
  if (a >= 1e9) return `${tanda}Rp ${koma(a / 1e9)} ${bahasa === 'id' ? 'M' : 'B'}`
  if (a >= 1e6) return `${tanda}Rp ${koma(a / 1e6)} ${bahasa === 'id' ? 'jt' : 'M'}`
  if (a >= 1e3) return `${tanda}Rp ${koma(a / 1e3)} ${bahasa === 'id' ? 'rb' : 'K'}`
  return `${tanda}Rp ${Math.round(a)}`
}
