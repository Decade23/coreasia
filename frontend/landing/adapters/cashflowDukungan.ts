/**
 * Dukungan sukarela untuk CashFlow: QRIS lewat web (dan kelak Google Play).
 *
 * Halaman web membuat satu QR per dukungan. Setiap QR yang sampai ke
 * penyedia pembayaran bisa kena biaya walau tidak dibayar, jadi console
 * menampilkan bukan hanya uang yang masuk, tapi juga berapa QR yang
 * ditinggal dan perkiraan biayanya.
 *
 * KONTRAK RPC (dibandingkan dengan migrasi oleh tests/cashflow/dukungan.test.ts):
 * - admin_dukungan_ringkas(p_dari date, p_sampai date) returns jsonb
 *   {dari, sampai, masuk, lunas, rata, qr_dibuat, qr_tidak_dibayar,
 *   gagal_dibuat, menunggu, perlu_tinjau, dikembalikan, biaya_qr, biaya_mdr,
 *   biaya_perkiraan, bersih_perkiraan, per_nominal[{nominal, qr, dibayar}],
 *   play{lunas, masuk}, buka, uji_disembunyikan}. Dukungan uji (kunci mode
 *   uji penyedia) tidak dihitung, hanya jumlahnya yang disebut.
 * - admin_dukungan_daftar(p_sumber, p_status, p_dari, p_sampai, p_batas,
 *   p_sebelum) returns jsonb {dari, sampai, ada_lagi, baris[...]}: terbaru
 *   dulu, halaman berikutnya lewat p_sebelum = `dibuat` baris terakhir.
 * - Rentang tanggal WIB, inklusif. 42501 bukan admin, 22023 hint
 *   rentang/sumber/status/batas.
 *
 * Nama dan pesan ditulis pengunjung halaman web dan tampil sebagai TEKS
 * POLOS (interpolasi biasa, tidak pernah dirender sebagai HTML).
 *
 * Fungsi MURNI semua: tanpa jaringan, tanpa state.
 */
import type { NilaiJson } from './cashflow'
import { geserHari } from './cashflowWaktu'

/** Nilai kolom dukungan.sumber (CHECK di migrasi). */
export const SUMBER_DUKUNGAN = ['web_qris', 'play'] as const
export type SumberDukungan = typeof SUMBER_DUKUNGAN[number]
/** Nilai kolom dukungan.status (CHECK di migrasi). */
export const STATUS_DUKUNGAN = ['menunggu', 'lunas', 'kedaluwarsa', 'gagal', 'perlu_tinjau', 'dikembalikan'] as const
export type StatusDukungan = typeof STATUS_DUKUNGAN[number]
/** Kelompok per_nominal, urutan dari server. */
export const NOMINAL_DUKUNGAN = ['25000', '50000', '100000', 'lain'] as const
export type NominalDukungan = typeof NOMINAL_DUKUNGAN[number]
/** Pilihan rentang di halaman (hari, termasuk hari ini). Server menerima 1..366. */
export const RENTANG_DUKUNGAN = ['7', '30', '90'] as const
export type RentangDukungan = typeof RENTANG_DUKUNGAN[number]
/** Saringan di URL: 'semua' = tanpa saringan (null ke server). */
export const SARING_SUMBER = ['semua', ...SUMBER_DUKUNGAN] as const
export const SARING_STATUS = ['semua', ...STATUS_DUKUNGAN] as const
/** p_batas per halaman daftar (server menerima 1..200). */
export const BATAS_DAFTAR_DUKUNGAN = 50

// ── DTO: persis seperti yang dipulangkan RPC ─────────────────────────────
/** bigint dan numeric bisa pulang sebagai string. */
type Angka = number | string | null
export interface PerNominalDTO { nominal: string; qr: Angka; dibayar: Angka }
export interface RingkasDukunganDTO {
  dari: string
  sampai: string
  masuk: Angka
  lunas: Angka
  rata: Angka
  /** QR yang sampai ke penyedia (punya ref_luar): dasar biaya per QR. */
  qr_dibuat: Angka
  /** QR yang sampai ke penyedia lalu kedaluwarsa atau gagal. */
  qr_tidak_dibayar: Angka
  /** Penyedia gagal membuat QR (tanpa ref_luar), jadi tanpa biaya. */
  gagal_dibuat: Angka
  menunggu: Angka
  perlu_tinjau: Angka
  dikembalikan: Angka
  biaya_qr: Angka
  biaya_mdr: Angka
  biaya_perkiraan: Angka
  bersih_perkiraan: Angka
  per_nominal: PerNominalDTO[] | null
  play: { lunas: Angka; masuk: Angka } | null
  /** Sakelar dukung_web: halaman /dukung menerima dukungan. */
  buka: boolean | null
  /** Dukungan uji di rentang ini yang tidak ikut dihitung. */
  uji_disembunyikan: Angka
}
export interface DukunganDTO {
  kode: string
  sumber: string
  uji: boolean | null
  jumlah: Angka
  jumlah_dibayar: Angka
  status: string
  nama: string | null
  pesan: string | null
  /** Nama penerbit QRIS yang dikirim penyedia (mis. aplikasi dompet). */
  penerbit: string | null
  /** Id permintaan bayar di penyedia, untuk mencocokkan dengan dashboard-nya. */
  ref_luar: string | null
  dibuat: string
  dibayar_pada: string | null
  habis_pada: string | null
}
export interface DaftarDukunganDTO {
  dari: string
  sampai: string
  ada_lagi: boolean | null
  baris: DukunganDTO[] | null
}

// ── Domain ───────────────────────────────────────────────────────────────
export interface PerNominal {
  nominal: NominalDukungan
  qr: number
  dibayar: number
  /** 0..1, dibayar dari QR yang dibuat; null bila belum ada QR. */
  porsi: number | null
}
export interface RingkasDukungan {
  dari: string
  sampai: string
  masuk: number
  lunas: number
  rata: number
  qrDibuat: number
  qrTidakDibayar: number
  gagalDibuat: number
  menunggu: number
  perluTinjau: number
  dikembalikan: number
  biayaPerkiraan: number
  bersihPerkiraan: number
  perNominal: PerNominal[]
  play: { lunas: number; masuk: number }
  buka: boolean
  ujiDisembunyikan: number
}
export interface Dukungan {
  kode: string
  sumber: SumberDukungan | null
  uji: boolean
  jumlah: number
  /** Hanya bila beda dengan jumlah (perlu ditinjau); selain itu null. */
  jumlahDibayarBeda: number | null
  status: StatusDukungan | null
  nama: string | null
  pesan: string | null
  penerbit: string | null
  refLuar: string | null
  dibuatIso: string
  dibayarIso: string | null
}

const bil = (v: Angka | undefined): number => {
  const n = typeof v === 'string' ? Number(v) : (v ?? 0)
  return Number.isFinite(n) ? n : 0
}
const bilAtauNull = (v: Angka | undefined): number | null => {
  if (v == null || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}
const dari = <T extends string>(daftar: readonly T[], v: unknown): T | null =>
  (typeof v === 'string' && (daftar as readonly string[]).includes(v) ? v as T : null)
/** Teks pengunjung: kosong atau spasi saja dianggap tidak diisi. */
const isi = (v: unknown): string | null => (typeof v === 'string' && v.trim() ? v : null)

export function keRingkasDukungan(d: RingkasDukunganDTO): RingkasDukungan {
  const perNominal = NOMINAL_DUKUNGAN.map((nominal) => {
    const x = (d.per_nominal ?? []).find(p => p.nominal === nominal)
    const qr = bil(x?.qr)
    const dibayar = bil(x?.dibayar)
    return { nominal, qr, dibayar, porsi: qr > 0 ? Math.min(1, dibayar / qr) : null }
  })
  return {
    dari: d.dari,
    sampai: d.sampai,
    masuk: bil(d.masuk),
    lunas: bil(d.lunas),
    rata: bil(d.rata),
    qrDibuat: bil(d.qr_dibuat),
    qrTidakDibayar: bil(d.qr_tidak_dibayar),
    gagalDibuat: bil(d.gagal_dibuat),
    menunggu: bil(d.menunggu),
    perluTinjau: bil(d.perlu_tinjau),
    dikembalikan: bil(d.dikembalikan),
    biayaPerkiraan: bil(d.biaya_perkiraan),
    bersihPerkiraan: bil(d.bersih_perkiraan),
    perNominal,
    play: { lunas: bil(d.play?.lunas), masuk: bil(d.play?.masuk) },
    buka: d.buka === true,
    ujiDisembunyikan: bil(d.uji_disembunyikan),
  }
}

export function keDukungan(d: DukunganDTO): Dukungan {
  const jumlah = bil(d.jumlah)
  const dibayar = bilAtauNull(d.jumlah_dibayar)
  return {
    kode: d.kode,
    sumber: dari(SUMBER_DUKUNGAN, d.sumber),
    uji: d.uji === true,
    jumlah,
    jumlahDibayarBeda: dibayar != null && dibayar !== jumlah ? dibayar : null,
    status: dari(STATUS_DUKUNGAN, d.status),
    nama: isi(d.nama),
    pesan: isi(d.pesan),
    penerbit: isi(d.penerbit),
    refLuar: isi(d.ref_luar),
    dibuatIso: d.dibuat,
    dibayarIso: d.dibayar_pada ?? null,
  }
}

export const barisDukungan = (d: DaftarDukunganDTO | null | undefined): DukunganDTO[] =>
  (Array.isArray(d?.baris) ? d.baris : [])

/** Halaman berikutnya ditempel di bawah; kode yang sudah ada tidak digandakan
 *  (jawaban yang tiba dua kali, atau baris yang bergeser karena data baru). */
export function gabungDukungan(lama: readonly Dukungan[], baru: readonly Dukungan[]): Dukungan[] {
  const ada = new Set(lama.map(d => d.kode))
  return [...lama, ...baru.filter(d => !ada.has(d.kode))]
}

/** p_sebelum untuk halaman berikutnya: `dibuat` baris terakhir; null bila kosong. */
export const kursorDukungan = (daftar: readonly Dukungan[]): string | null =>
  daftar.length ? daftar[daftar.length - 1]!.dibuatIso : null

/** Rentang tanggal WIB inklusif `hari` hari sampai `hariIni` ('YYYY-MM-DD'). */
export function rentangDukungan(hari: RentangDukungan, hariIni: string): { dari: string; sampai: string } {
  return { dari: geserHari(hariIni, -(Number(hari) - 1)), sampai: hariIni }
}

/** Saringan URL → argumen server (null = semua). */
export const saringKeServer = <T extends string>(v: T | 'semua'): T | null => (v === 'semua' ? null : v)

/** Lencana status: kelas pill yang ada di main.css. Perlu ditinjau kuning
 *  (uang masuk tapi jumlahnya beda), lunas hijau, sisanya redup. */
export function pillStatus(s: StatusDukungan | null): string {
  switch (s) {
    case 'lunas': return 'ca-pill-emerald'
    case 'perlu_tinjau': return 'ca-pill-gold'
    case 'menunggu': return 'ca-pill-info'
    case 'dikembalikan': return 'ca-pill-danger'
    default: return 'ca-pill-muted'
  }
}

// ── Sakelar dukung_web (halaman Sakelar) ─────────────────────────────────
/** Kunci app_config sakelar halaman /dukung. TIDAK publik: hanya fungsi
 *  server yang membacanya. Server menganggap buka hanya bila aktif === true
 *  persis; kunci yang tidak ada = mati (bawaan di kode fungsi). */
export const KUNCI_SAKELAR_DUKUNG = 'dukung_web'
/** Catatan bawaan bila baris belum punya catatan (sama dengan migrasi). */
export const CATATAN_SAKELAR_DUKUNG = 'Dukung CashFlow lewat web (QRIS Xendit). aktif true = halaman /dukung menerima dukungan. batas_harian = QR per hari WIB untuk semua orang, batas_ip_* = QR per alamat IP. penerima = nama yang tampil di aplikasi bank pembayar.'

export interface SakelarDukung {
  /** Baris dukung_web ada di app_config. */
  ada: boolean
  /** Nilai tersimpan objek JSON biasa (bukan larik/teks). */
  objek: boolean
  aktif: boolean
  batasHarian: number | null
  batasIp10: number | null
  batasIpHarian: number | null
  penerima: string | null
}
const objekJson = (v: unknown): v is { [kunci: string]: NilaiJson } =>
  !!v && typeof v === 'object' && !Array.isArray(v)
const bulat = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? Math.floor(v) : null)

export function bacaSakelarDukung(baris: { nilai: NilaiJson } | null | undefined): SakelarDukung {
  if (!baris) return { ada: false, objek: false, aktif: false, batasHarian: null, batasIp10: null, batasIpHarian: null, penerima: null }
  const v = baris.nilai
  if (!objekJson(v)) return { ada: true, objek: false, aktif: false, batasHarian: null, batasIp10: null, batasIpHarian: null, penerima: null }
  return {
    ada: true,
    objek: true,
    aktif: v.aktif === true,
    batasHarian: bulat(v.batas_harian),
    batasIp10: bulat(v.batas_ip_10menit),
    batasIpHarian: bulat(v.batas_ip_harian),
    penerima: typeof v.penerima === 'string' && v.penerima.trim() ? v.penerima.trim() : null,
  }
}

/** Nilai baru: hanya `aktif` yang diganti, kunci lain (batas, penerima)
 *  dipertahankan apa adanya. Nilai yang bukan objek diganti {aktif}. */
export function nilaiSakelarDukung(nilai: NilaiJson | undefined, aktif: boolean): { [kunci: string]: NilaiJson } {
  return objekJson(nilai) ? { ...nilai, aktif } : { aktif }
}
