/**
 * Bagian "Kebiasaan pengguna aktif" di halaman Laporan console CashFlow.
 *
 * KONTRAK RPC (dibandingkan dengan migrasi oleh tests/cashflow/laporan-kebiasaan.test.ts):
 * - admin_laporan_kebiasaan(p_hari 7..365) {hari, akun, aktif,
 *   butir[{kunci, orang}]}. akun = akun pengguna luar, aktif = yang mencatat
 *   dalam rentang. Izin view, tanpa audit.
 * - admin_laporan_kebiasaan_daftar(p_kunci, p_hari, p_hal, p_alasan) {kunci,
 *   hari, total, hal, per_hal, terbuka, baris[{user_id, nama, email, daftar,
 *   terakhir_catat, catatan, ruang, ruang_bersama, hp, pesan_domi,
 *   beli_kredit}]}. p_kunci salah satu kunci butir atau 'aktif'. Kunci asing:
 *   22023 hint kunci. Izin pii (42501 izin-kurang), setiap panggilan tercatat
 *   di audit (laporan_kebiasaan).
 * Identitas mengikuti laporan saldo: halaman mengirim alasan tetap, server
 * memulangkan nama dan email utuh (terbuka true). Tanpa alasan email pulang
 * tersamar dan nama null (terbuka false). Sesi tanpa izin pii tidak memanggil
 * daftar sama sekali.
 *
 * Fungsi MURNI semua: tanpa jaringan, tanpa state.
 */

/** bigint dan numeric bisa pulang sebagai string. */
type Angka = number | string | null

/** Kunci butir yang punya label kamus, urutan server. */
export const KUNCI_KEBIASAAN = [
  'satu_ruang', 'banyak_ruang', 'catat_banyak_ruang', 'berbagi_ruang', 'banyak_hp', 'catat_usaha',
  'pakai_domi', 'beli_kredit', 'aktif_7', 'baru', 'baru_bertahan',
] as const
export type KunciKebiasaan = typeof KUNCI_KEBIASAAN[number]
/** Kunci daftar untuk semua yang mencatat dalam rentang. Bukan butir dari server. */
export const KUNCI_AKTIF = 'aktif'
/** Kunci yang punya label kamus (butir dan baris semua yang aktif). */
export const KUNCI_BERLABEL = [KUNCI_AKTIF, ...KUNCI_KEBIASAAN] as const
export type KunciBerlabel = typeof KUNCI_BERLABEL[number]
/** Bentuk kunci yang boleh masuk URL dan dikirim ke server. */
export const POLA_KUNCI_KEBIASAAN = /^[a-z][a-z0-9_]*$/
export const MAKS_KUNCI_KEBIASAAN = 40
/** Baris per halaman daftar orang bila server tidak menyebutnya. */
export const PER_DAFTAR_KEBIASAAN = 50
/** Alasan tetap daftar orang (pola laporan saldo): halaman ini sendiri
 *  tujuannya. Server menuntut minimal 8 huruf dan mengauditnya. */
export const ALASAN_LAPORAN_KEBIASAAN = 'Daftar orang per kebiasaan di Laporan console'

/**
 * Pembanding persen tiap butir. Butir kebiasaan dibanding yang aktif. Tiga
 * butir dihitung dari semua akun luar: beli_kredit dan baru dibanding semua
 * akun, baru_bertahan dibanding pendaftar baru di rentang yang sama.
 */
export type PembandingKebiasaan = 'aktif' | 'akun' | 'baru'
export const PEMBANDING_KEBIASAAN: Readonly<Record<KunciBerlabel, PembandingKebiasaan>> = {
  aktif: 'akun',
  satu_ruang: 'aktif', banyak_ruang: 'aktif', catat_banyak_ruang: 'aktif', berbagi_ruang: 'aktif', banyak_hp: 'aktif',
  catat_usaha: 'aktif', pakai_domi: 'aktif', aktif_7: 'aktif',
  beli_kredit: 'akun', baru: 'akun', baru_bertahan: 'baru',
}
/** Butir yang dihitung dari semua akun luar, bukan hanya yang aktif. */
export const DARI_SEMUA_AKUN: readonly KunciKebiasaan[] = ['beli_kredit', 'baru', 'baru_bertahan']

export const kunciBerlabel = (k: string): KunciBerlabel | null =>
  (KUNCI_BERLABEL as readonly string[]).includes(k) ? (k as KunciBerlabel) : null
export const kunciSah = (k: unknown): k is string =>
  typeof k === 'string' && k.length <= MAKS_KUNCI_KEBIASAAN && POLA_KUNCI_KEBIASAAN.test(k)

// ── DTO: persis seperti yang dipulangkan RPC ─────────────────────────────
export interface ButirKebiasaanDTO { kunci: string; orang: Angka }
export interface KebiasaanDTO { hari: Angka; akun: Angka; aktif: Angka; butir: ButirKebiasaanDTO[] }
export interface OrangKebiasaanDTO {
  user_id: string; nama: string | null; email: string | null; daftar: string | null; terakhir_catat: string | null
  catatan: Angka; ruang: Angka; ruang_bersama: Angka; hp: Angka; pesan_domi: Angka; beli_kredit: Angka
}
export interface DaftarKebiasaanDTO {
  kunci: string; hari: Angka; total: Angka; hal: Angka; per_hal: Angka; terbuka: boolean; baris: OrangKebiasaanDTO[]
}

// ── Domain ───────────────────────────────────────────────────────────────
/** Angka rusak (NaN, negatif, bukan angka) dibaca nol. */
const n = (v: unknown): number => {
  const x = typeof v === 'string' && v.trim() !== '' ? Number(v) : typeof v === 'number' ? v : 0
  return Number.isFinite(x) && x > 0 ? Math.round(x) : 0
}
const teks = (v: unknown): string => (typeof v === 'string' ? v.trim() : '')
const iso = (v: unknown): string | null => (typeof v === 'string' && !Number.isNaN(Date.parse(v)) ? v : null)

export interface ButirKebiasaan {
  kunci: string
  /** Kunci yang punya label kamus. null = kunci baru dari server, tampil apa adanya. */
  dikenal: KunciBerlabel | null
  orang: number
  /** Pembanding persennya, null untuk kunci yang belum dikenal. */
  pembanding: PembandingKebiasaan | null
  /** Persen bulat dari pembandingnya. null bila pembandingnya nol atau tidak dikenal. */
  persen: number | null
}
export interface Kebiasaan {
  hari: number
  akun: number
  aktif: number
  /** Baris pertama selalu semua yang aktif, lalu butir server menurut urutan server. */
  butir: ButirKebiasaan[]
}

/** Persen bulat, paling besar 100. null bila pembandingnya nol. */
export function persenKebiasaan(orang: number, dasar: number): number | null {
  if (!(dasar > 0)) return null
  return Math.min(100, Math.max(0, Math.round((orang / dasar) * 100)))
}

export function keKebiasaan(d: KebiasaanDTO | null | undefined): Kebiasaan {
  const akun = n(d?.akun)
  const aktif = n(d?.aktif)
  const mentah = Array.isArray(d?.butir) ? d.butir : []
  const terlihat = new Set<string>([KUNCI_AKTIF])
  const dariServer: Array<{ kunci: string; orang: number }> = []
  for (const b of mentah) {
    if (!kunciSah(b?.kunci) || terlihat.has(b.kunci)) continue
    terlihat.add(b.kunci)
    dariServer.push({ kunci: b.kunci, orang: n(b.orang) })
  }
  const dasar: Record<PembandingKebiasaan, number> = {
    aktif, akun, baru: dariServer.find(b => b.kunci === 'baru')?.orang ?? 0,
  }
  const butir = [{ kunci: KUNCI_AKTIF, orang: aktif }, ...dariServer].map((b): ButirKebiasaan => {
    const dikenal = kunciBerlabel(b.kunci)
    const pembanding = dikenal ? PEMBANDING_KEBIASAAN[dikenal] : null
    return { kunci: b.kunci, dikenal, orang: b.orang, pembanding, persen: pembanding ? persenKebiasaan(b.orang, dasar[pembanding]) : null }
  })
  return { hari: n(d?.hari), akun, aktif, butir }
}

export interface OrangKebiasaan {
  id: string
  /** Kosong bila tidak diisi pengguna, atau bila daftar pulang tersamar. */
  nama: string
  /** Utuh bila daftar terbuka, tersamar bila tidak. */
  email: string
  daftar: string | null
  terakhir: string | null
  catatan: number
  ruang: number
  ruangBersama: number
  hp: number
  pesanDomi: number
  beliKredit: number
}
export interface DaftarKebiasaan {
  kunci: string
  hari: number
  total: number
  hal: number
  perHal: number
  baris: OrangKebiasaan[]
  /** true = nama dan email utuh. false = email tersamar, nama tidak dikirim. */
  terbuka: boolean
}

export function keDaftarKebiasaan(d: DaftarKebiasaanDTO | null | undefined): DaftarKebiasaan {
  const baris = (Array.isArray(d?.baris) ? d.baris : [])
    .filter(b => typeof b?.user_id === 'string' && b.user_id !== '')
    .map((b): OrangKebiasaan => ({
      id: b.user_id, nama: teks(b.nama), email: teks(b.email), daftar: iso(b.daftar), terakhir: iso(b.terakhir_catat),
      catatan: n(b.catatan), ruang: n(b.ruang), ruangBersama: n(b.ruang_bersama), hp: n(b.hp),
      pesanDomi: n(b.pesan_domi), beliKredit: n(b.beli_kredit),
    }))
  return {
    kunci: teks(d?.kunci),
    hari: n(d?.hari),
    total: Math.max(n(d?.total), baris.length),
    hal: Math.max(1, n(d?.hal)),
    perHal: n(d?.per_hal) || PER_DAFTAR_KEBIASAAN,
    baris,
    terbuka: d?.terbuka === true,
  }
}
