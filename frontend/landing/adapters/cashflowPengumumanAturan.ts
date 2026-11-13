/**
 * Sasaran pengumuman berbasis aturan di console CashFlow: penerima jenis
 * `aturan`, segmen tersimpan, pratinjau penerima, dan daftar akun internal.
 *
 * KONTRAK (dikunci di spek bagian S, dibandingkan dengan migrasinya oleh
 * tests/cashflow/pengumuman-aturan.test.ts begitu fungsinya ada di folder
 * migrasi):
 *
 * saring (jsonb, semua kunci opsional, digabung AND, kunci asing ditolak 22023):
 *   versi_min, versi_di_bawah     versionCode Android 1..KODE_MAKS, di_bawah eksklusif
 *   versi_tak_diketahui           'ikut' (bawaan) | 'tidak', hanya berarti bila ada saringan versi
 *   daftar_sejak, daftar_sampai   'YYYY-MM-DD' WIB, inklusif
 *   aktif_dalam_hari              1..365
 *   ruang                         'usaha' | 'pribadi_saja'
 *   domi_pakai, domi_beli, kredit_habis   boolean
 *   nomor_wa                      'ada' | 'belum'
 *
 * audience_rules (jsonb):
 *   {v: 1, segmen_id: uuid|null, saring: saring|null, kecuali_internal,
 *    kecuali_pengguna: uuid[] (<= 1000), kecuali_kelompok: uuid[] (<= 100)}
 *   Tepat satu dari segmen_id atau saring. saring {} = semua pengguna.
 *
 * admin_pratinjau_penerima_pengumuman → {jumlah, tak_terjangkau_versi_lama,
 *   versi_tak_diketahui, dikecualikan_internal, dikecualikan_lain,
 *   contoh: [{email_tersamar, versi}] (<= 10)}
 * admin_daftar_segmen_pengumuman → [{id, nama, saring, jumlah, dipakai, diubah}]
 * admin_daftar_akun_internal     → [{user_id, email, jenis, catatan, diubah}]
 *
 * DTO di bawah = bentuk server apa adanya. Domain = bentuk yang dipakai
 * halaman. Nilai yang tidak dikenal (kunci baru, tipe salah) tidak pernah
 * dipakai diam-diam: dibuang dari domain dan dicatat di `asing`, supaya layar
 * bisa berkata "ada saringan yang belum dikenal console".
 *
 * Fungsi MURNI semua: tanpa jaringan, tanpa state. adapters/ TIDAK di-auto-
 * import Nuxt, selalu impor eksplisit.
 */
import { KODE_MAKS, RILIS_PLAY } from './cashflowVersi'
import { tanggalPendek, type BahasaWaktu } from './cashflowWaktu'

// ── Batas (sama dengan kontrak server) ───────────────────────────────────
export const BATAS_KECUALI_PENGGUNA = 1000
export const BATAS_KECUALI_KELOMPOK = 100
export const AKTIF_HARI_MAKS = 365
export const NAMA_SEGMEN_MAKS = 60
export const CATATAN_INTERNAL_MAKS = 120
export const CONTOH_MAKS = 10
/** Aplikasi di bawah versi ini (pengumuman_aktif_v2) hanya menerima pengumuman `all`. */
export const VERSI_SASARAN = { kode: 26110702, versi: '1.3.8' } as const

/** Kunci saring yang dikenal console = kunci yang diterima server. */
export const KUNCI_SARING = [
  'versi_min', 'versi_di_bawah', 'versi_tak_diketahui', 'daftar_sejak', 'daftar_sampai',
  'aktif_dalam_hari', 'ruang', 'domi_pakai', 'domi_beli', 'kredit_habis', 'nomor_wa',
] as const
export type KunciSaring = typeof KUNCI_SARING[number]
export const KUNCI_ATURAN = ['v', 'segmen_id', 'saring', 'kecuali_internal', 'kecuali_pengguna', 'kecuali_kelompok'] as const
export const RUANG_SARING = ['usaha', 'pribadi_saja'] as const
export const NOMOR_WA_SARING = ['ada', 'belum'] as const
export const VERSI_TAK_DIKETAHUI = ['ikut', 'tidak'] as const
export const JENIS_AKUN_INTERNAL = ['pemilik', 'uji', 'peninjau', 'lain'] as const
export type RuangSaring = typeof RUANG_SARING[number]
export type NomorWaSaring = typeof NOMOR_WA_SARING[number]
export type VersiTakDiketahui = typeof VERSI_TAK_DIKETAHUI[number]
export type JenisAkunInternal = typeof JENIS_AKUN_INTERNAL[number]

// ── DTO: persis seperti yang dikirim dan dipulangkan server ─────────────
/** int dan bigint bisa pulang sebagai angka atau teks. */
type Angka = number | string | null | undefined
export interface SaringDTO {
  versi_min?: number
  versi_di_bawah?: number
  versi_tak_diketahui?: VersiTakDiketahui
  daftar_sejak?: string
  daftar_sampai?: string
  aktif_dalam_hari?: number
  ruang?: RuangSaring
  domi_pakai?: boolean
  domi_beli?: boolean
  kredit_habis?: boolean
  nomor_wa?: NomorWaSaring
}
export interface AturanDTO {
  v: 1
  segmen_id: string | null
  saring: SaringDTO | null
  kecuali_internal: boolean
  kecuali_pengguna: string[]
  kecuali_kelompok: string[]
}
export interface ContohPenerimaDTO { email_tersamar: string | null; versi: number | string | null }
export interface PratinjauPenerimaDTO {
  jumlah: Angka
  tak_terjangkau_versi_lama: Angka
  versi_tak_diketahui: Angka
  dikecualikan_internal: Angka
  dikecualikan_lain: Angka
  contoh: ContohPenerimaDTO[] | null
}
export interface SegmenDTO { id: string; nama: string; saring: unknown; jumlah: Angka; dipakai: Angka; diubah: string }
export interface AkunInternalDTO { user_id: string; email: string | null; jenis: string; catatan: string | null; diubah: string }

// ── Domain ───────────────────────────────────────────────────────────────
export interface Saring {
  versiMin: number | null
  versiDiBawah: number | null
  versiTakDiketahui: VersiTakDiketahui
  daftarSejak: string | null
  daftarSampai: string | null
  aktifHari: number | null
  ruang: RuangSaring | null
  domiPakai: boolean | null
  domiBeli: boolean | null
  kreditHabis: boolean | null
  nomorWa: NomorWaSaring | null
}
export const SARING_KOSONG: Saring = Object.freeze({
  versiMin: null, versiDiBawah: null, versiTakDiketahui: 'ikut', daftarSejak: null, daftarSampai: null,
  aktifHari: null, ruang: null, domiPakai: null, domiBeli: null, kreditHabis: null, nomorWa: null,
})
export interface Aturan {
  segmenId: string | null
  /** null bila aturan memakai segmen. */
  saring: Saring | null
  kecualiInternal: boolean
  kecualiPengguna: string[]
  kecualiKelompok: string[]
  /** Kunci atau nilai dari server yang tidak dikenal console (dibuang dari domain). */
  asing: string[]
}
export interface ContohPenerima { email: string; versi: string | null }
export interface PratinjauPenerima {
  jumlah: number | null
  takTerjangkau: number | null
  versiTakDiketahui: number | null
  dikecualikanInternal: number | null
  dikecualikanLain: number | null
  contoh: ContohPenerima[]
}
export interface Segmen { id: string; nama: string; saring: Saring; asing: string[]; jumlah: number | null; dipakai: number; diubah: string }
export interface AkunInternal {
  userId: string
  /** Utuh atau tersamar, sesuai jawaban server (izin pii). */
  email: string
  /** null = jenis dari server yang tidak dikenal console (lihat jenisAsli). */
  jenis: JenisAkunInternal | null
  jenisAsli: string
  catatan: string
  diubah: string
}

// ── Pembantu bentuk ──────────────────────────────────────────────────────
const objek = (x: unknown): Record<string, unknown> | null =>
  x && typeof x === 'object' && !Array.isArray(x) ? (x as Record<string, unknown>) : null
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
export const uuidSah = (x: unknown): x is string => typeof x === 'string' && UUID.test(x)
/** versionCode Android yang sah: bilangan bulat 1..KODE_MAKS. */
export const kodeVersiSah = (x: unknown): x is number => typeof x === 'number' && Number.isInteger(x) && x >= 1 && x <= KODE_MAKS
/** 'YYYY-MM-DD' yang benar-benar ada di kalender. */
export function tanggalSah(x: unknown): x is string {
  if (typeof x !== 'string') return false
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(x)
  if (!m) return false
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])))
  return d.getUTCFullYear() === Number(m[1]) && d.getUTCMonth() === Number(m[2]) - 1 && d.getUTCDate() === Number(m[3])
}
const hariSah = (x: unknown): x is number => typeof x === 'number' && Number.isInteger(x) && x >= 1 && x <= AKTIF_HARI_MAKS
const angka = (x: Angka): number | null => {
  if (x === null || x === undefined || x === '') return null
  const n = Number(x)
  return Number.isFinite(n) ? n : null
}
const daftarUuid = (x: unknown, kunci: string, asing: string[]): string[] => {
  if (!Array.isArray(x)) { if (x !== undefined) asing.push(kunci); return [] }
  const sah = x.filter(uuidSah)
  if (sah.length !== x.length) asing.push(kunci)
  return [...new Set(sah)]
}

// ── Nama versi ───────────────────────────────────────────────────────────
/** Pilihan versi untuk saringan: rilis Play yang dikenal, terbaru dulu. */
export const PILIHAN_VERSI: ReadonlyArray<{ kode: number; versi: string }> = Object.entries(RILIS_PLAY)
  .map(([k, v]) => ({ kode: Number(k), versi: v }))
  .sort((a, b) => b.kode - a.kode)
/** '1.4.1' bila kodenya rilis Play yang dikenal, selain itu angkanya. */
export const labelVersi = (kode: number): string => RILIS_PLAY[kode] ?? String(kode)

// ── Saring: server → domain → server ────────────────────────────────────
/** Saring dari server. Kunci asing dan nilai bertipe salah dibuang dan dicatat. */
export function keSaring(raw: unknown): { saring: Saring; asing: string[] } {
  const o = objek(raw)
  if (!o) return { saring: { ...SARING_KOSONG }, asing: raw === null || raw === undefined ? [] : ['saring'] }
  const asing: string[] = Object.keys(o).filter(k => !(KUNCI_SARING as readonly string[]).includes(k))
  const ambil = <T>(kunci: KunciSaring, sah: (x: unknown) => x is T): T | null => {
    if (!(kunci in o)) return null
    if (sah(o[kunci])) return o[kunci] as T
    asing.push(kunci)
    return null
  }
  const pilihan = <T extends string>(daftar: readonly T[]) => (x: unknown): x is T => typeof x === 'string' && (daftar as readonly string[]).includes(x)
  const boolean = (x: unknown): x is boolean => typeof x === 'boolean'
  return {
    saring: {
      versiMin: ambil('versi_min', kodeVersiSah),
      versiDiBawah: ambil('versi_di_bawah', kodeVersiSah),
      versiTakDiketahui: ambil('versi_tak_diketahui', pilihan(VERSI_TAK_DIKETAHUI)) ?? 'ikut',
      daftarSejak: ambil('daftar_sejak', tanggalSah),
      daftarSampai: ambil('daftar_sampai', tanggalSah),
      aktifHari: ambil('aktif_dalam_hari', hariSah),
      ruang: ambil('ruang', pilihan(RUANG_SARING)),
      domiPakai: ambil('domi_pakai', boolean),
      domiBeli: ambil('domi_beli', boolean),
      kreditHabis: ambil('kredit_habis', boolean),
      nomorWa: ambil('nomor_wa', pilihan(NOMOR_WA_SARING)),
    },
    asing,
  }
}

export const adaSaringVersi = (s: Saring): boolean => s.versiMin !== null || s.versiDiBawah !== null

/** Saring untuk dikirim: hanya kunci yang terisi. versi_tak_diketahui hanya
 *  bila ada saringan versi (selain itu tidak berarti apa-apa). */
export function saringKeDto(s: Saring): SaringDTO {
  const d: SaringDTO = {}
  if (s.versiMin !== null) d.versi_min = s.versiMin
  if (s.versiDiBawah !== null) d.versi_di_bawah = s.versiDiBawah
  if (adaSaringVersi(s)) d.versi_tak_diketahui = s.versiTakDiketahui
  if (s.daftarSejak !== null) d.daftar_sejak = s.daftarSejak
  if (s.daftarSampai !== null) d.daftar_sampai = s.daftarSampai
  if (s.aktifHari !== null) d.aktif_dalam_hari = s.aktifHari
  if (s.ruang !== null) d.ruang = s.ruang
  if (s.domiPakai !== null) d.domi_pakai = s.domiPakai
  if (s.domiBeli !== null) d.domi_beli = s.domiBeli
  if (s.kreditHabis !== null) d.kredit_habis = s.kreditHabis
  if (s.nomorWa !== null) d.nomor_wa = s.nomorWa
  return d
}

// ── Isian formulir saringan ──────────────────────────────────────────────
type TigaPilihan = '' | 'ya' | 'tidak'
export interface IsianSaring {
  /** '' = tanpa batas; versionCode sebagai teks. */
  versiMin: string
  versiDiBawah: string
  versiTakDiketahui: VersiTakDiketahui
  /** '' atau 'YYYY-MM-DD' (input type=date). */
  daftarSejak: string
  daftarSampai: string
  aktifHari: string
  ruang: '' | RuangSaring
  domiPakai: TigaPilihan
  domiBeli: TigaPilihan
  kreditHabis: TigaPilihan
  nomorWa: '' | NomorWaSaring
}
export const ISIAN_SARING_KOSONG: IsianSaring = Object.freeze({
  versiMin: '', versiDiBawah: '', versiTakDiketahui: 'ikut', daftarSejak: '', daftarSampai: '', aktifHari: '',
  ruang: '', domiPakai: '', domiBeli: '', kreditHabis: '', nomorWa: '',
})
const keTiga = (b: boolean | null): TigaPilihan => (b === null ? '' : b ? 'ya' : 'tidak')
const dariTiga = (t: TigaPilihan): boolean | null => (t === '' ? null : t === 'ya')

export function isianDariSaring(s: Saring): IsianSaring {
  return {
    versiMin: s.versiMin === null ? '' : String(s.versiMin),
    versiDiBawah: s.versiDiBawah === null ? '' : String(s.versiDiBawah),
    versiTakDiketahui: s.versiTakDiketahui,
    daftarSejak: s.daftarSejak ?? '',
    daftarSampai: s.daftarSampai ?? '',
    aktifHari: s.aktifHari === null ? '' : String(s.aktifHari),
    ruang: s.ruang ?? '',
    domiPakai: keTiga(s.domiPakai),
    domiBeli: keTiga(s.domiBeli),
    kreditHabis: keTiga(s.kreditHabis),
    nomorWa: s.nomorWa ?? '',
  }
}

export const KODE_GALAT_SARING = ['versiMin', 'versiDiBawah', 'versiTerbalik', 'daftarSejak', 'daftarSampai', 'daftarTerbalik', 'aktifHari'] as const
export type KodeGalatSaring = typeof KODE_GALAT_SARING[number]

/** Teks bilangan bulat murni ('26111301', bukan '2.6e7' atau '12abc'). */
const bulat = (t: string): number | null => (/^\d{1,10}$/.test(t.trim()) ? Number(t.trim()) : null)

/** Isian → saring. `saring` null bila ada galat; galat dalam kode kamus. */
export function periksaIsianSaring(i: IsianSaring): { saring: Saring | null; galat: KodeGalatSaring[] } {
  const galat: KodeGalatSaring[] = []
  const versi = (t: string, kode: KodeGalatSaring) => {
    if (!t.trim()) return null
    const n = bulat(t)
    if (n === null || !kodeVersiSah(n)) { galat.push(kode); return null }
    return n
  }
  const versiMin = versi(i.versiMin, 'versiMin')
  const versiDiBawah = versi(i.versiDiBawah, 'versiDiBawah')
  if (versiMin !== null && versiDiBawah !== null && versiMin >= versiDiBawah) galat.push('versiTerbalik')
  const tanggal = (t: string, kode: KodeGalatSaring) => {
    if (!t.trim()) return null
    if (!tanggalSah(t.trim())) { galat.push(kode); return null }
    return t.trim()
  }
  const daftarSejak = tanggal(i.daftarSejak, 'daftarSejak')
  const daftarSampai = tanggal(i.daftarSampai, 'daftarSampai')
  if (daftarSejak && daftarSampai && daftarSejak > daftarSampai) galat.push('daftarTerbalik')
  let aktifHari: number | null = null
  if (i.aktifHari.trim()) {
    aktifHari = bulat(i.aktifHari)
    if (aktifHari === null || !hariSah(aktifHari)) { galat.push('aktifHari'); aktifHari = null }
  }
  if (galat.length) return { saring: null, galat }
  return {
    saring: {
      versiMin, versiDiBawah, versiTakDiketahui: i.versiTakDiketahui === 'tidak' ? 'tidak' : 'ikut',
      daftarSejak, daftarSampai, aktifHari,
      ruang: i.ruang || null,
      domiPakai: dariTiga(i.domiPakai), domiBeli: dariTiga(i.domiBeli), kreditHabis: dariTiga(i.kreditHabis),
      nomorWa: i.nomorWa || null,
    },
    galat,
  }
}

// ── Aturan ───────────────────────────────────────────────────────────────
/** audience_rules dari server. null bila bukan objek atau tidak punya dasar
 *  (segmen atau saring) yang terbaca. */
export function keAturan(raw: unknown): Aturan | null {
  const o = objek(raw)
  if (!o) return null
  const asing: string[] = Object.keys(o).filter(k => !(KUNCI_ATURAN as readonly string[]).includes(k))
  if (o.v !== 1) asing.push('v')
  const segmenId = uuidSah(o.segmen_id) ? o.segmen_id : null
  if (o.segmen_id !== null && o.segmen_id !== undefined && !segmenId) asing.push('segmen_id')
  let saring: Saring | null = null
  if (!segmenId && objek(o.saring)) {
    const s = keSaring(o.saring)
    saring = s.saring
    asing.push(...s.asing.map(k => `saring.${k}`))
  }
  if (!segmenId && !saring) return null
  if (typeof o.kecuali_internal !== 'boolean') asing.push('kecuali_internal')
  return {
    segmenId, saring,
    // Bawaan nyala: bila nilainya tidak terbaca, jangan diam-diam memasukkan akun internal.
    kecualiInternal: o.kecuali_internal !== false,
    kecualiPengguna: daftarUuid(o.kecuali_pengguna, 'kecuali_pengguna', asing),
    kecualiKelompok: daftarUuid(o.kecuali_kelompok, 'kecuali_kelompok', asing),
    asing,
  }
}

/** Aturan untuk dikirim (p_aturan). Tepat satu dari segmen_id atau saring. */
export function aturanKeDto(a: Pick<Aturan, 'segmenId' | 'saring' | 'kecualiInternal' | 'kecualiPengguna' | 'kecualiKelompok'>): AturanDTO {
  return {
    v: 1,
    segmen_id: a.segmenId,
    saring: a.segmenId ? null : saringKeDto(a.saring ?? SARING_KOSONG),
    kecuali_internal: a.kecualiInternal,
    kecuali_pengguna: [...new Set(a.kecualiPengguna)],
    kecuali_kelompok: [...new Set(a.kecualiKelompok)],
  }
}

export type GalatAturan = 'dasar' | 'kecualiPengguna' | 'kecualiKelompok'
/** Pemeriksaan bentuk sebelum dikirim (server memeriksa lagi). */
export function periksaAturan(d: AturanDTO): GalatAturan[] {
  const galat: GalatAturan[] = []
  if ((d.segmen_id === null) === (d.saring === null) || (d.segmen_id !== null && !uuidSah(d.segmen_id))) galat.push('dasar')
  if (d.kecuali_pengguna.length > BATAS_KECUALI_PENGGUNA || !d.kecuali_pengguna.every(uuidSah)) galat.push('kecualiPengguna')
  if (d.kecuali_kelompok.length > BATAS_KECUALI_KELOMPOK || !d.kecuali_kelompok.every(uuidSah)) galat.push('kecualiKelompok')
  return galat
}

// ── Pratinjau ────────────────────────────────────────────────────────────
function labelContohVersi(v: unknown): string | null {
  if (typeof v === 'number') return kodeVersiSah(v) ? labelVersi(v) : null
  if (typeof v !== 'string' || !v.trim()) return null
  const n = bulat(v)
  if (n !== null) return kodeVersiSah(n) ? labelVersi(n) : null
  return v.trim().slice(0, 20)
}

export function kePratinjauPenerima(raw: unknown): PratinjauPenerima {
  const o = objek(raw) ?? {}
  const contoh = Array.isArray(o.contoh) ? o.contoh : []
  return {
    jumlah: angka(o.jumlah as Angka),
    takTerjangkau: angka(o.tak_terjangkau_versi_lama as Angka),
    versiTakDiketahui: angka(o.versi_tak_diketahui as Angka),
    dikecualikanInternal: angka(o.dikecualikan_internal as Angka),
    dikecualikanLain: angka(o.dikecualikan_lain as Angka),
    contoh: contoh
      .map(objek)
      .filter((c): c is Record<string, unknown> => !!c && typeof c.email_tersamar === 'string' && !!c.email_tersamar.trim())
      .slice(0, CONTOH_MAKS)
      .map(c => ({ email: String(c.email_tersamar).trim(), versi: labelContohVersi(c.versi) })),
  }
}

// ── Segmen ───────────────────────────────────────────────────────────────
export function keSegmen(d: SegmenDTO): Segmen {
  const s = keSaring(d.saring)
  return {
    id: d.id, nama: typeof d.nama === 'string' ? d.nama : '', saring: s.saring, asing: s.asing,
    jumlah: angka(d.jumlah), dipakai: angka(d.dipakai) ?? 0, diubah: d.diubah,
  }
}
export const keDaftarSegmen = (raw: unknown): Segmen[] =>
  (Array.isArray(raw) ? raw : []).filter((x): x is SegmenDTO => !!objek(x) && uuidSah((x as SegmenDTO).id)).map(keSegmen)

/** Nama segmen ganda dari server: pelanggaran unik kolom nama announcement_segments (23505). */
export function segmenGandaDariGalat(g: { message?: string } | null | undefined): boolean {
  return !!g && /unique constraint "[^"]*announcement_segments[^"]*"/i.test(g.message ?? '')
}
/** Penolakan hapus karena segmen masih dirujuk pengumuman aktif atau terjadwal (23503). */
export const segmenDipakaiDariGalat = (g: { hint?: string } | null | undefined): boolean => !!g && g.hint === 'segmen-dipakai'

export type GalatNamaSegmen = 'kosong' | 'panjang' | 'ganda'
export function periksaNamaSegmen(nama: string, daftar: readonly Pick<Segmen, 'id' | 'nama'>[], id: string | null = null): GalatNamaSegmen | null {
  const n = nama.trim()
  if (!n) return 'kosong'
  if (Array.from(n).length > NAMA_SEGMEN_MAKS) return 'panjang'
  if (daftar.some(s => s.id !== id && s.nama.trim().toLowerCase() === n.toLowerCase())) return 'ganda'
  return null
}

// ── Akun internal ────────────────────────────────────────────────────────
export function keAkunInternal(d: AkunInternalDTO): AkunInternal {
  const jenis = (JENIS_AKUN_INTERNAL as readonly string[]).includes(d.jenis) ? (d.jenis as JenisAkunInternal) : null
  return {
    userId: d.user_id, email: typeof d.email === 'string' ? d.email : '', jenis, jenisAsli: String(d.jenis ?? ''),
    catatan: typeof d.catatan === 'string' ? d.catatan : '', diubah: d.diubah,
  }
}
export const keDaftarAkunInternal = (raw: unknown): AkunInternal[] =>
  (Array.isArray(raw) ? raw : []).filter((x): x is AkunInternalDTO => !!objek(x) && uuidSah((x as AkunInternalDTO).user_id)).map(keAkunInternal)

export const catatanInternalSah = (c: string): boolean => Array.from(c.trim()).length <= CATATAN_INTERNAL_MAKS

// ── Ringkasan aturan dalam kalimat awam ──────────────────────────────────
/** Bentuk kamus pengumuman.ringkas (ID dan EN sama bentuknya). */
export interface KamusRingkas {
  semua: string
  segmen: (nama: string) => string
  segmenHilang: string
  versiAntara: (a: string, b: string) => string
  versiMin: (a: string) => string
  versiDiBawah: (b: string) => string
  tanpaVersiTakDiketahui: string
  daftarAntara: (a: string, b: string) => string
  daftarSejak: (a: string) => string
  daftarSampai: (b: string) => string
  aktif: (n: number) => string
  ruang: Readonly<Record<RuangSaring, string>>
  domiPakai: Readonly<Record<'ya' | 'tidak', string>>
  domiBeli: Readonly<Record<'ya' | 'tidak', string>>
  kreditHabis: Readonly<Record<'ya' | 'tidak', string>>
  nomorWa: Readonly<Record<NomorWaSaring, string>>
  saringLain: string
  kecuali: (daftar: string) => string
  internal: string
  termasukInternal: string
  pengguna: (n: number) => string
  kelompok: (n: number) => string
  dan: string
  tidakTerbaca: string
}

/** 'a', 'a dan b', 'a, b, dan c'. */
export function gabungDaftar(bagian: readonly string[], dan: string): string {
  if (bagian.length <= 1) return bagian[0] ?? ''
  if (bagian.length === 2) return `${bagian[0]} ${dan} ${bagian[1]}`
  return `${bagian.slice(0, -1).join(', ')}, ${dan} ${bagian[bagian.length - 1]}`
}

/** Bagian kalimat untuk saringan (tanpa dasar dan pengecualian). */
export function bagianSaring(s: Saring, k: KamusRingkas, bahasa: BahasaWaktu): string[] {
  const b: string[] = []
  const ya = (x: boolean) => (x ? 'ya' : 'tidak') as 'ya' | 'tidak'
  if (s.versiMin !== null && s.versiDiBawah !== null) b.push(k.versiAntara(labelVersi(s.versiMin), labelVersi(s.versiDiBawah)))
  else if (s.versiMin !== null) b.push(k.versiMin(labelVersi(s.versiMin)))
  else if (s.versiDiBawah !== null) b.push(k.versiDiBawah(labelVersi(s.versiDiBawah)))
  if (adaSaringVersi(s) && s.versiTakDiketahui === 'tidak') b.push(k.tanpaVersiTakDiketahui)
  const tgl = (x: string) => tanggalPendek(x, bahasa)
  if (s.daftarSejak && s.daftarSampai) b.push(k.daftarAntara(tgl(s.daftarSejak), tgl(s.daftarSampai)))
  else if (s.daftarSejak) b.push(k.daftarSejak(tgl(s.daftarSejak)))
  else if (s.daftarSampai) b.push(k.daftarSampai(tgl(s.daftarSampai)))
  if (s.aktifHari !== null) b.push(k.aktif(s.aktifHari))
  if (s.ruang) b.push(k.ruang[s.ruang])
  if (s.domiPakai !== null) b.push(k.domiPakai[ya(s.domiPakai)])
  if (s.domiBeli !== null) b.push(k.domiBeli[ya(s.domiBeli)])
  if (s.kreditHabis !== null) b.push(k.kreditHabis[ya(s.kreditHabis)])
  if (s.nomorWa) b.push(k.nomorWa[s.nomorWa])
  return b
}

/** "Semua pengguna, versi di bawah 1.4.1, kecuali akun internal". */
export function kalimatAturan(
  a: Aturan | null, k: KamusRingkas,
  opsi: { bahasa: BahasaWaktu; segmenNama?: string | null },
): string {
  if (!a) return k.tidakTerbaca
  const bagian: string[] = []
  if (a.segmenId) bagian.push(opsi.segmenNama ? k.segmen(opsi.segmenNama) : k.segmenHilang)
  else bagian.push(k.semua, ...bagianSaring(a.saring ?? SARING_KOSONG, k, opsi.bahasa))
  if (a.asing.some(x => x.startsWith('saring.'))) bagian.push(k.saringLain)
  const kecuali: string[] = []
  if (a.kecualiInternal) kecuali.push(k.internal)
  if (a.kecualiPengguna.length) kecuali.push(k.pengguna(a.kecualiPengguna.length))
  if (a.kecualiKelompok.length) kecuali.push(k.kelompok(a.kecualiKelompok.length))
  if (kecuali.length) bagian.push(k.kecuali(gabungDaftar(kecuali, k.dan)))
  if (!a.kecualiInternal) bagian.push(k.termasukInternal)
  return bagian.join(', ')
}

/** Ringkasan saringan saja (daftar segmen): "Semua pengguna, aktif dalam 30 hari terakhir". */
export function kalimatSaring(s: Saring, k: KamusRingkas, bahasa: BahasaWaktu): string {
  return [k.semua, ...bagianSaring(s, k, bahasa)].join(', ')
}
