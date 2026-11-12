/**
 * Paket kredit Domi di console: daftar, tambah, ubah, nonaktifkan, hapus.
 *
 * KONTRAK RPC (migrasi CashFlow paket kredit; dibandingkan dengan migrasinya
 * oleh tests/cashflow/paket.test.ts):
 * - admin_ai_paket_daftar() → {paket: [baris], kini}: semua paket termasuk
 *   yang nonaktif dan khusus uji, urut urutan lalu kode (collate C). Baris =
 *   semua kolom tabel ai_paket_kredit (kode, kredit, harga normal,
 *   harga_promo, promo_mulai, promo_sampai, label, bawaan, aktif, khusus_uji,
 *   urutan, diubah, diubah_oleh) + efektif (paket efektif sekarang) + promo
 *   (status) + terjual (pembelian lunas) + pernah_dibeli (pembelian apa pun).
 *   `kini` = jam server, dipakai sebagai jam halaman (kiniServer).
 * - admin_ai_paket_simpan(p_paket jsonb) → bentuk yang sama dengan daftar.
 *   Tambah atau ubah per kode dan MENGGABUNG: kunci yang dikirim menimpa,
 *   yang tidak dikirim tetap. Aksi baris mengirim kode + kolom yang berubah
 *   saja (MuatanSebagian). Isian ditolak: 22023 `paket_tidak_sah`, hint =
 *   nama kolom (kolomDariGalat) atau 'paket' / kunci asing. Satu bawaan
 *   dijaga server, dan bawaan harus aktif dan bukan khusus uji (CHECK).
 * - admin_ai_paket_hapus(p_kode text) → bentuk yang sama dengan daftar.
 *   Pernah dibeli: 23503 `paket_sudah_dibeli` (paketSudahDibeli). Kode tidak
 *   ada: P0002 `paket_tidak_ada`.
 * Penjaganya sama dengan admin_ai_setelan_simpan: membaca butuh
 * cashflow:view, menulis butuh cashflow:pii. Audit ditulis server
 * (set_ai_paket, hapus_ai_paket).
 *
 * HARGA. Yang ditagih SELALU dihitung server saat pembelian dibuat. Status
 * promo dan harga tampil di sini hanya untuk tabel dan pratinjau, dengan
 * aturan yang sama: promo berlaku bila harga_promo terisi dan
 * mulai <= sekarang < sampai (batas kosong = terbuka), dan
 * hemat = round((1 - promo / normal) * 100), dihitung dari bilangan bulat
 * supaya tidak meleset karena pecahan biner.
 *
 * Aturan isian (periksaIsian) menyalin CHECK server: kode ^[a-z0-9_-]{1,24}$,
 * kredit 1..10000, harga 1..10.000.000, harga promo >= 1 dan < harga,
 * sampai > mulai bila keduanya ada, label 1..24 huruf tanpa karakter kendali,
 * bawaan hanya untuk paket aktif yang bukan khusus uji. Server tetap penentu.
 *
 * Fungsi MURNI semua: tanpa jaringan, tanpa state.
 */
import { dariDatetimeLokalWib, keDatetimeLokalWib } from './cashflowWaktu'

export const POLA_KODE_PAKET = /^[a-z0-9_-]{1,24}$/
export const KREDIT_MIN = 1
export const KREDIT_MAKS = 10_000
export const HARGA_MIN = 1
export const HARGA_MAKS = 10_000_000
export const LABEL_MAKS = 24
const INT_MIN = -2_147_483_648
const INT_MAKS = 2_147_483_647

/** Kolom isian = kunci p_paket = nama kolom yang dipakai server sebagai hint galat. */
export const KOLOM_PAKET = [
  'kode', 'kredit', 'harga', 'harga_promo', 'promo_mulai', 'promo_sampai', 'label', 'urutan', 'bawaan', 'aktif', 'khusus_uji',
] as const
export type KolomPaket = typeof KOLOM_PAKET[number]

// ── DTO: persis seperti yang dipulangkan RPC ─────────────────────────────
/** int dan bigint bisa pulang sebagai angka atau teks. */
type Angka = number | string | null
/** Paket efektif sekarang, bentuk yang sama dengan yang dibaca aplikasi. */
export interface PaketEfektifDTO {
  kode: string
  kredit: Angka
  harga: Angka
  harga_normal: Angka
  hemat_persen: Angka
  label: string | null
  promo_sampai: string | null
  bawaan: boolean | null
}
export interface PaketAdminDTO {
  kode: string
  kredit: Angka
  harga: Angka
  harga_promo: Angka
  promo_mulai: string | null
  promo_sampai: string | null
  label: string | null
  bawaan: boolean | null
  aktif: boolean | null
  khusus_uji: boolean | null
  urutan: Angka
  diubah: string | null
  diubah_oleh: string | null
  efektif?: PaketEfektifDTO | null
  /** tanpa | terjadwal | berlaku | berakhir, pada jam server `kini`. */
  promo?: string | null
  /** Pembelian lunas. */
  terjual?: Angka
  /** Ada pembelian apa pun (lunas, menunggu, kedaluwarsa, batal). Hapus ditolak. */
  pernah_dibeli?: boolean | null
}
export type DaftarPaketDTO = { paket: PaketAdminDTO[] | null; kini?: string | null } | PaketAdminDTO[] | null

// ── Domain: bentuk yang dipakai tabel, form, dan pratinjau ───────────────
export interface PaketKredit {
  kode: string
  kredit: number
  /** Harga normal, rupiah. */
  harga: number
  hargaPromo: number | null
  promoMulai: string | null
  promoSampai: string | null
  label: string | null
  bawaan: boolean
  aktif: boolean
  khususUji: boolean
  urutan: number
  /** Cap waktu perubahan terakhir, dipakai sebagai versi saat menyunting. */
  diubah: string | null
  /** Jumlah pembelian lunas. null = server tidak mengirim angkanya. */
  terjual: number | null
  /** Ada pembelian apa pun dengan kode ini: server akan menolak hapus. */
  pernahDibeli: boolean
}

export type StatusPromo = 'tanpa' | 'terjadwal' | 'berlaku' | 'berakhir'
export const STATUS_PROMO: readonly StatusPromo[] = ['berlaku', 'terjadwal', 'berakhir', 'tanpa']

/** Bilangan bulat dari angka atau teks angka; selain itu null. */
function bulat(v: unknown): number | null {
  if (typeof v === 'number') return Number.isInteger(v) ? v : null
  if (typeof v === 'string' && /^-?\d+$/.test(v.trim())) {
    const n = Number(v.trim())
    return Number.isSafeInteger(n) ? n : null
  }
  return null
}
const teksAtauNull = (v: unknown): string | null => (typeof v === 'string' && v.trim() ? v : null)

export function kePaket(dto: PaketAdminDTO): PaketKredit {
  const terjual = bulat(dto.terjual)
  return {
    kode: typeof dto.kode === 'string' ? dto.kode : '',
    kredit: bulat(dto.kredit) ?? 0,
    harga: bulat(dto.harga) ?? 0,
    hargaPromo: bulat(dto.harga_promo),
    promoMulai: teksAtauNull(dto.promo_mulai),
    promoSampai: teksAtauNull(dto.promo_sampai),
    label: teksAtauNull(dto.label),
    bawaan: dto.bawaan === true,
    // Kolom NOT NULL default true: nilai yang tak terbaca dianggap aktif.
    aktif: dto.aktif !== false,
    khususUji: dto.khusus_uji === true,
    urutan: bulat(dto.urutan) ?? 0,
    diubah: teksAtauNull(dto.diubah),
    terjual,
    pernahDibeli: dto.pernah_dibeli === true || (terjual ?? 0) > 0,
  }
}

/** Baris dari jawaban daftar, apa pun bentuk luarnya. Baris tanpa kode dibuang. */
export function barisPaket(dto: DaftarPaketDTO | unknown): PaketAdminDTO[] {
  const larik = Array.isArray(dto) ? dto : (dto && typeof dto === 'object' && Array.isArray((dto as { paket?: unknown }).paket))
    ? (dto as { paket: unknown[] }).paket
    : []
  return larik.filter((b): b is PaketAdminDTO => !!b && typeof b === 'object' && typeof (b as { kode?: unknown }).kode === 'string')
}

/** Urutan yang sama dengan server: `urutan`, lalu `kode`. */
export function urutkanPaket(daftar: readonly PaketKredit[]): PaketKredit[] {
  return [...daftar].sort((a, b) => a.urutan - b.urutan || (a.kode < b.kode ? -1 : a.kode > b.kode ? 1 : 0))
}

export function daftarPaket(dto: DaftarPaketDTO | unknown): PaketKredit[] {
  return urutkanPaket(barisPaket(dto).map(kePaket))
}

/** Jam server dari jawaban daftar/simpan/hapus (ms), atau null. Halaman
 *  memakainya sebagai jam status promo supaya jam laptop yang meleset tidak
 *  membuat "terjadwal" terbaca "berlaku". */
export function kiniServer(dto: DaftarPaketDTO | unknown): number | null {
  const k = dto && typeof dto === 'object' && !Array.isArray(dto) ? (dto as { kini?: unknown }).kini : null
  if (typeof k !== 'string') return null
  const t = Date.parse(k)
  return Number.isNaN(t) ? null : t
}

const waktu = (iso: string | null): number | null => {
  if (!iso) return null
  const t = Date.parse(iso)
  return Number.isNaN(t) ? null : t
}

/** Status promo pada `kini`, aturan yang sama dengan kolom `promo` dan
 *  `efektif` di server. Dihitung di sini karena form menilai isian yang belum
 *  disimpan, dan tabel ikut memakainya supaya keduanya tidak pernah berbeda.
 *  Harga promo yang tidak lebih murah (dicegah CHECK) dianggap tanpa promo. */
export function statusPromo(p: Pick<PaketKredit, 'harga' | 'hargaPromo' | 'promoMulai' | 'promoSampai'>, kini: number): StatusPromo {
  if (p.hargaPromo === null || p.hargaPromo < 1 || p.hargaPromo >= p.harga) return 'tanpa'
  const mulai = waktu(p.promoMulai)
  const sampai = waktu(p.promoSampai)
  if (sampai !== null && kini >= sampai) return 'berakhir'
  if (mulai !== null && kini < mulai) return 'terjadwal'
  return 'berlaku'
}

/** round((1 - promo / normal) * 100) dengan bilangan bulat. */
export function hematPersen(normal: number, promo: number): number {
  if (!(normal > 0) || !(promo >= 0) || promo >= normal) return 0
  return Math.round((100 * (normal - promo)) / normal)
}

export interface HargaTampil {
  /** Yang ditagih bila dibeli pada saat `kini`. */
  harga: number
  /** Harga coret; null bila tidak ada promo yang berlaku. */
  hargaNormal: number | null
  hematPersen: number | null
  promoSampai: string | null
  status: StatusPromo
}

/** Bentuk efektif yang dilihat pengguna aplikasi pada saat `kini` (sama dengan
 *  bentuk paket efektif server: harga, harga_normal, hemat_persen, promo_sampai). */
export function hargaTampil(p: Pick<PaketKredit, 'harga' | 'hargaPromo' | 'promoMulai' | 'promoSampai'>, kini: number): HargaTampil {
  const status = statusPromo(p, kini)
  if (status !== 'berlaku' || p.hargaPromo === null) {
    return { harga: p.harga, hargaNormal: null, hematPersen: null, promoSampai: null, status }
  }
  return { harga: p.hargaPromo, hargaNormal: p.harga, hematPersen: hematPersen(p.harga, p.hargaPromo), promoSampai: p.promoSampai, status }
}

/** Bentuk yang sama saat promo berlaku (untuk pratinjau promo terjadwal). */
export function hargaSaatPromo(p: Pick<PaketKredit, 'harga' | 'hargaPromo' | 'promoSampai'>): HargaTampil | null {
  if (p.hargaPromo === null || p.hargaPromo < 1 || p.hargaPromo >= p.harga) return null
  return { harga: p.hargaPromo, hargaNormal: p.harga, hematPersen: hematPersen(p.harga, p.hargaPromo), promoSampai: p.promoSampai, status: 'berlaku' }
}

// ── Isian form → muatan p_paket ──────────────────────────────────────────
/** Isian form apa adanya (teks), tanggal sebagai datetime-local WIB. */
export interface IsianPaket {
  kode: string
  kredit: string
  harga: string
  hargaPromo: string
  promoMulai: string
  promoSampai: string
  label: string
  urutan: string
  bawaan: boolean
  aktif: boolean
  khususUji: boolean
}

/** p_paket lengkap (form): kunci = kolom tabel yang bisa ditulis. */
export interface MuatanPaket {
  kode: string
  kredit: number
  harga: number
  harga_promo: number | null
  promo_mulai: string | null
  promo_sampai: string | null
  label: string | null
  urutan: number
  bawaan: boolean
  aktif: boolean
  khusus_uji: boolean
}
/** p_paket untuk aksi baris: kode + kolom yang berubah. Server menggabung,
 *  jadi kolom lain (yang mungkin baru diubah admin lain) tidak tertimpa. */
export type MuatanSebagian = Pick<MuatanPaket, 'kode'> & Partial<Omit<MuatanPaket, 'kode'>>

export type KodeGalatPaket =
  | 'kodePola' | 'kodeTerpakai' | 'kreditRentang' | 'hargaRentang' | 'promoRentang' | 'promoTidakLebihMurah'
  | 'tanggalRusak' | 'sampaiSebelumMulai' | 'labelPanjang' | 'labelKarakter' | 'urutanAngka' | 'bawaanSyarat' | 'server'
export type GalatIsian = Partial<Record<KolomPaket, KodeGalatPaket>>

/** Isian kosong untuk paket baru: aktif, urutan sesudah yang terakhir. */
export function isianBaru(daftar: readonly PaketKredit[]): IsianPaket {
  const terakhir = daftar.reduce((m, p) => Math.max(m, p.urutan), 0)
  return {
    kode: '', kredit: '', harga: '', hargaPromo: '', promoMulai: '', promoSampai: '', label: '',
    urutan: String(daftar.length ? terakhir + 10 : 10), bawaan: false, aktif: true, khususUji: false,
  }
}

export function isianDariPaket(p: PaketKredit): IsianPaket {
  return {
    kode: p.kode,
    kredit: String(p.kredit),
    harga: String(p.harga),
    hargaPromo: p.hargaPromo === null ? '' : String(p.hargaPromo),
    promoMulai: p.promoMulai ? keDatetimeLokalWib(p.promoMulai) : '',
    promoSampai: p.promoSampai ? keDatetimeLokalWib(p.promoSampai) : '',
    label: p.label ?? '',
    urutan: String(p.urutan),
    bawaan: p.bawaan,
    aktif: p.aktif,
    khususUji: p.khususUji,
  }
}

/** Rupiah atau jumlah yang diketik: titik ribuan dan spasi boleh ('25.000'). */
function angkaKetik(s: string): number | null {
  const t = s.replace(/[.\s]/g, '')
  if (!/^\d+$/.test(t)) return null
  const n = Number(t)
  return Number.isSafeInteger(n) ? n : null
}
function urutanKetik(s: string): number | null {
  const t = s.trim()
  if (!/^-?\d+$/.test(t)) return null
  const n = Number(t)
  return n >= INT_MIN && n <= INT_MAKS ? n : null
}
/** Karakter kendali C0, DEL, C1. */
const adaKendali = (s: string): boolean => Array.from(s).some((c) => {
  const n = c.codePointAt(0) ?? 0
  return n < 0x20 || (n >= 0x7f && n <= 0x9f)
})
/** Panjang dalam huruf (code point), sama dengan char_length() Postgres. */
export const panjangHuruf = (s: string): number => Array.from(s).length

/** datetime-local WIB → ISO. Sama persis dengan nilai asal = ISO asal (detiknya tetap). */
function tanggalKirim(nilai: string, asal: string | null): string | null | 'rusak' {
  if (!nilai.trim()) return null
  if (asal && keDatetimeLokalWib(asal) === nilai) return asal
  return dariDatetimeLokalWib(nilai) ?? 'rusak'
}

export interface HasilPeriksa { galat: GalatIsian; muatan: MuatanPaket | null }

/**
 * Periksa isian seperti server, lalu rakit p_paket. `kodeTerpakai` hanya
 * diisi untuk paket BARU: simpan server menimpa per kode, jadi kode yang
 * sudah ada akan mengubah paket lama tanpa sadar. `asal` = paket yang sedang
 * disunting (tanggal yang tidak diubah dikirim persis).
 * Tanpa harga promo, jendela promo dikirim kosong. Bawaan harus aktif dan
 * bukan khusus uji (CHECK ai_paket_kredit_bawaan_check, hint bawaan).
 */
export function periksaIsian(isian: IsianPaket, opsi: { kodeTerpakai?: readonly string[]; asal?: PaketKredit | null } = {}): HasilPeriksa {
  const galat: GalatIsian = {}
  const kode = isian.kode.trim()
  if (!POLA_KODE_PAKET.test(kode)) galat.kode = 'kodePola'
  else if (opsi.kodeTerpakai?.includes(kode)) galat.kode = 'kodeTerpakai'

  const kredit = angkaKetik(isian.kredit)
  if (kredit === null || kredit < KREDIT_MIN || kredit > KREDIT_MAKS) galat.kredit = 'kreditRentang'
  const harga = angkaKetik(isian.harga)
  if (harga === null || harga < HARGA_MIN || harga > HARGA_MAKS) galat.harga = 'hargaRentang'

  let hargaPromo: number | null = null
  let mulai: string | null = null
  let sampai: string | null = null
  if (isian.hargaPromo.trim()) {
    hargaPromo = angkaKetik(isian.hargaPromo)
    if (hargaPromo === null || hargaPromo < 1) galat.harga_promo = 'promoRentang'
    else if (harga !== null && hargaPromo >= harga) galat.harga_promo = 'promoTidakLebihMurah'
    const m = tanggalKirim(isian.promoMulai, opsi.asal?.promoMulai ?? null)
    const s = tanggalKirim(isian.promoSampai, opsi.asal?.promoSampai ?? null)
    if (m === 'rusak') galat.promo_mulai = 'tanggalRusak'
    else mulai = m
    if (s === 'rusak') galat.promo_sampai = 'tanggalRusak'
    else sampai = s
    if (mulai && sampai && Date.parse(sampai) <= Date.parse(mulai)) galat.promo_sampai = 'sampaiSebelumMulai'
  }

  const labelBersih = isian.label.trim()
  // Server menolak karakter kendali ([[:cntrl:]]): tab, baris baru, dan sejenisnya.
  if (adaKendali(labelBersih)) galat.label = 'labelKarakter'
  else if (panjangHuruf(labelBersih) > LABEL_MAKS) galat.label = 'labelPanjang'
  const urutan = urutanKetik(isian.urutan)
  if (urutan === null) galat.urutan = 'urutanAngka'
  if (isian.bawaan && (!isian.aktif || isian.khususUji)) galat.bawaan = 'bawaanSyarat'

  if (Object.keys(galat).length) return { galat, muatan: null }
  return {
    galat,
    muatan: {
      kode, kredit: kredit!, harga: harga!, harga_promo: hargaPromo,
      promo_mulai: mulai, promo_sampai: sampai, label: labelBersih || null,
      urutan: urutan!, bawaan: isian.bawaan, aktif: isian.aktif, khusus_uji: isian.khususUji,
    },
  }
}

/** Aksi baris Nonaktifkan / Aktifkan. Paket bawaan yang dinonaktifkan ikut
 *  dilepas bawaannya: CHECK server menolak bawaan yang nonaktif. */
export function muatanAktif(p: Pick<PaketKredit, 'kode' | 'bawaan'>, aktif: boolean): MuatanSebagian {
  return !aktif && p.bawaan ? { kode: p.kode, aktif: false, bawaan: false } : { kode: p.kode, aktif }
}

/** Jadikan bawaan hanya untuk paket yang terlihat semua orang. */
export const bolehJadiBawaan = (p: Pick<PaketKredit, 'aktif' | 'khususUji' | 'bawaan'>): boolean => p.aktif && !p.khususUji && !p.bawaan

/** Pratinjau dari isian yang sedang diketik. Angka yang belum sah jadi 0 atau
 *  tanpa promo, supaya pratinjau tidak pernah menampilkan harga palsu. */
export function paketDariIsian(isian: IsianPaket, asal: PaketKredit | null = null): Pick<PaketKredit, 'kode' | 'kredit' | 'harga' | 'hargaPromo' | 'promoMulai' | 'promoSampai' | 'label' | 'khususUji'> {
  const harga = angkaKetik(isian.harga) ?? 0
  const promo = isian.hargaPromo.trim() ? angkaKetik(isian.hargaPromo) : null
  const sah = (v: string | null | 'rusak') => (v === 'rusak' ? null : v)
  return {
    kode: isian.kode.trim(),
    kredit: angkaKetik(isian.kredit) ?? 0,
    harga,
    hargaPromo: promo !== null && promo >= 1 && promo < harga ? promo : null,
    promoMulai: sah(tanggalKirim(isian.promoMulai, asal?.promoMulai ?? null)),
    promoSampai: sah(tanggalKirim(isian.promoSampai, asal?.promoSampai ?? null)),
    label: isian.label.trim() || null,
    khususUji: isian.khususUji,
  }
}

// ── Urutan ───────────────────────────────────────────────────────────────
/**
 * Geser satu paket naik (-1) atau turun (+1) di urutan tampil. Hasilnya
 * daftar {kode, urutan} yang perlu disimpan: bila urutan keduanya berbeda,
 * cukup ditukar (dua tulisan). Bila sama (mis. semua 0), seluruh daftar
 * dinomori ulang 10, 20, 30, … dan hanya yang berubah ikut dikirim.
 */
export function geserUrutan(daftar: readonly PaketKredit[], kode: string, arah: -1 | 1): Array<{ kode: string; urutan: number }> {
  const urut = urutkanPaket(daftar)
  const i = urut.findIndex(p => p.kode === kode)
  const j = i + arah
  if (i < 0 || j < 0 || j >= urut.length) return []
  const a = urut[i]!
  const b = urut[j]!
  if (a.urutan !== b.urutan) return [{ kode: a.kode, urutan: b.urutan }, { kode: b.kode, urutan: a.urutan }]
  const baru = [...urut]
  baru[i] = b
  baru[j] = a
  return baru
    .map((p, k) => ({ kode: p.kode, urutan: (k + 1) * 10 }))
    .filter(x => urut.find(p => p.kode === x.kode)!.urutan !== x.urutan)
}

// ── Galat server ─────────────────────────────────────────────────────────
interface GalatBaca { message?: string; hint?: string }

/** 22023 paket_tidak_sah: kolom yang ditolak (hint), atau null bila bukan galat itu / hint tak dikenal. */
export function kolomDariGalat(g: GalatBaca | null | undefined): KolomPaket | null {
  if (!g || g.message !== 'paket_tidak_sah') return null
  return (KOLOM_PAKET as readonly string[]).includes(g.hint ?? '') ? (g.hint as KolomPaket) : null
}

/** Hapus ditolak karena paket pernah dibeli (23503). */
export function paketSudahDibeli(g: GalatBaca | null | undefined): boolean {
  return !!g && g.message === 'paket_sudah_dibeli'
}

/** Kode yang diubah atau dihapus sudah tidak ada (P0002). */
export function paketTidakAda(g: GalatBaca | null | undefined): boolean {
  return !!g && g.message === 'paket_tidak_ada'
}

/** Ringkasan untuk kepala halaman. */
export function ringkasPaket(daftar: readonly PaketKredit[], kini: number): { total: number; aktif: number; promo: number } {
  return {
    total: daftar.length,
    aktif: daftar.filter(p => p.aktif).length,
    promo: daftar.filter(p => p.aktif && statusPromo(p, kini) === 'berlaku').length,
  }
}
