/**
 * Ranah milik ORANG (Fase 3, migrasi 0095) — Perangkat (admin_perangkat_
 * pengguna, ranah perangkat) dan Kabar (admin_kabar_pengguna, ranah kabar).
 * Hanya ada di Pengguna 360: kasus bersubjek ruang tidak bisa memegang
 * kedua ranah ini (22023 ranah-ruang).
 *
 * Yang tidak pernah datang dari server: token perangkat (hanya `sidik` HMAC
 * per subjek), id sesi mentah, IP, user_agent (K-F3-6), aktor_nama kabar
 * (K-F3-3; hanya `ada_nama_aktor`), judul kabar di luar kategori/peran.
 * `platform`, `versi_aplikasi`, `kode_build` adalah LAPORAN klien yang sudah
 * disaring server; dirender sebagai teks, tidak pernah v-html.
 *
 * adapters/ tidak di-auto-import Nuxt — selalu impor eksplisit.
 */
import { POLA_UUID } from './cashflow'
import { bacaObjekKursor, isoSah } from './cashflowBuku'
import { kodeDari } from './cashflowRanahBuku'

type Num = number | string
const angkaAtauNull = (v: Num | null | undefined): number | null => {
  if (v == null || v === '') return null
  const x = Number(v)
  return Number.isFinite(x) ? x : null
}
const angka0 = (v: Num | null | undefined): number => angkaAtauNull(v) ?? 0

// ── R9 admin_perangkat_pengguna (ranah perangkat) ────────────────────────
export const PLATFORM_PERANGKAT = ['android', 'ios', 'web'] as const
export type PlatformPerangkat = typeof PLATFORM_PERANGKAT[number]
export const VARIAN_APLIKASI = ['prod', 'uat'] as const
export type VarianAplikasi = typeof VARIAN_APLIKASI[number]
export const AAL_SESI = ['aal1', 'aal2', 'aal3'] as const
export type AalSesi = typeof AAL_SESI[number]
/** p_hari: 1..90 (server menolak di luar itu dengan 22023 hari, tidak dijepit). */
export const HARI_PERANGKAT = { min: 1, maks: 90, bawaan: 30 } as const
export const hariSah = (n: unknown): n is number =>
  typeof n === 'number' && Number.isInteger(n) && n >= HARI_PERANGKAT.min && n <= HARI_PERANGKAT.maks

export interface PerangkatDTO {
  sidik: string; platform: string | null; varian: string | null; versi_aplikasi: string | null
  kode_build: string | null; versi_tak_sah: boolean; updated_at: string
}
export interface SesiPerangkatDTO {
  sidik: string; created_at: string; updated_at: string | null; refreshed_at: string | null
  aal: string | null; not_after: string | null; aktif: boolean
}
export interface RingkasJedaDTO {
  n: number; p50: number | null; p95: number | null; maks: number | null; lebih_1_menit: number; lebih_1_jam: number
  lebih_1_hari: number; jam_maju: number; tanpa_jam_perangkat: number
}
export interface JedaHarianDTO { tanggal: string; n: number; p95: number | null; maks: number | null }
/** Rinci (kasus memegang jejak) atau ringkas (hanya waktu). */
export type JedaTerbesarDTO =
  | { peristiwa_id: number; workspace_id: string; sasaran_id: string | null; pada: string; pada_perangkat: string; jeda_tiba_detik: number }
  | { pada: string; pada_perangkat: string; jeda_tiba_detik: number }
export interface PerangkatPenggunaDTO {
  kasus: string; user_id: string; hari: number
  perangkat: PerangkatDTO[]; sesi: SesiPerangkatDTO[]; sesi_disembunyikan: boolean
  terpotong: { perangkat: boolean; sesi: boolean }
  jeda: { ringkas: RingkasJedaDTO; per_hari: JedaHarianDTO[]; terbesar: JedaTerbesarDTO[]; rinci: { terbesar: boolean } }
}

export interface Perangkat {
  sidik: string; platform: PlatformPerangkat | 'lain' | null; varian: VarianAplikasi | null
  versi: string | null; kodeBuild: string | null; versiTakSah: boolean; terakhirIso: string
}
export interface SesiPerangkat {
  sidik: string; dibuatIso: string; diperbaruiIso: string | null; disegarkanIso: string | null
  aal: AalSesi | 'lain' | null; berakhirIso: string | null; aktif: boolean
}
export interface JedaTerbesar {
  /** null bila kasus tanpa ranah jejak (rinci.terbesar false). */
  peristiwaId: number | null; ruangId: string | null; sasaranId: string | null
  padaIso: string; padaPerangkatIso: string; detik: number
}
export interface PerangkatPengguna {
  kasus: string; orang: string; hari: number
  perangkat: Perangkat[]; sesi: SesiPerangkat[]
  /** Subjek staf platform: sesi tidak dikirim (bukan "tanpa sesi"). */
  sesiDisembunyikan: boolean
  terpotong: { perangkat: boolean; sesi: boolean }
  jeda: {
    ringkas: {
      n: number; p50: number | null; p95: number | null; maks: number | null
      lebih1Menit: number; lebih1Jam: number; lebih1Hari: number; jamMaju: number; tanpaJamPerangkat: number
    }
    perHari: Array<{ tanggal: string; n: number; p95: number | null; maks: number | null }>
    terbesar: JedaTerbesar[]
    rinci: boolean
  }
}
export function kePerangkatPengguna(d: PerangkatPenggunaDTO): PerangkatPengguna {
  const r = d.jeda?.ringkas
  return {
    kasus: d.kasus,
    orang: d.user_id,
    hari: angka0(d.hari),
    perangkat: (d.perangkat ?? []).map(p => ({
      sidik: p.sidik,
      platform: kodeDari(p.platform, PLATFORM_PERANGKAT),
      varian: (VARIAN_APLIKASI as readonly string[]).includes(p.varian ?? '') ? (p.varian as VarianAplikasi) : null,
      versi: p.versi_aplikasi ?? null,
      kodeBuild: p.kode_build ?? null,
      versiTakSah: p.versi_tak_sah === true,
      terakhirIso: p.updated_at,
    })),
    sesi: (d.sesi ?? []).map(s => ({
      sidik: s.sidik,
      dibuatIso: s.created_at,
      diperbaruiIso: s.updated_at ?? null,
      disegarkanIso: s.refreshed_at ?? null,
      aal: kodeDari(s.aal, AAL_SESI),
      berakhirIso: s.not_after ?? null,
      aktif: s.aktif === true,
    })),
    sesiDisembunyikan: d.sesi_disembunyikan === true,
    terpotong: { perangkat: d.terpotong?.perangkat === true, sesi: d.terpotong?.sesi === true },
    jeda: {
      ringkas: {
        n: angka0(r?.n), p50: angkaAtauNull(r?.p50), p95: angkaAtauNull(r?.p95), maks: angkaAtauNull(r?.maks),
        lebih1Menit: angka0(r?.lebih_1_menit), lebih1Jam: angka0(r?.lebih_1_jam), lebih1Hari: angka0(r?.lebih_1_hari),
        jamMaju: angka0(r?.jam_maju), tanpaJamPerangkat: angka0(r?.tanpa_jam_perangkat),
      },
      perHari: (d.jeda?.per_hari ?? []).map(h => ({ tanggal: h.tanggal, n: angka0(h.n), p95: angkaAtauNull(h.p95), maks: angkaAtauNull(h.maks) })),
      terbesar: (d.jeda?.terbesar ?? []).map(t => ('peristiwa_id' in t
        ? { peristiwaId: angka0(t.peristiwa_id), ruangId: t.workspace_id, sasaranId: t.sasaran_id ?? null, padaIso: t.pada, padaPerangkatIso: t.pada_perangkat, detik: angka0(t.jeda_tiba_detik) }
        : { peristiwaId: null, ruangId: null, sasaranId: null, padaIso: t.pada, padaPerangkatIso: t.pada_perangkat, detik: angka0(t.jeda_tiba_detik) })),
      rinci: d.jeda?.rinci?.terbesar === true,
    },
  }
}

// ── R10 admin_kabar_pengguna (ranah kabar) ───────────────────────────────
export const JENIS_KABAR = ['tx.hapus', 'tx.besar', 'anggota.masuk', 'peran.ubah', 'rangkuman'] as const
export type JenisKabar = typeof JENIS_KABAR[number]
export const PERAN_KABAR = ['owner', 'admin', 'member', 'viewer'] as const
export type PeranKabar = typeof PERAN_KABAR[number]

export interface KabarDTO {
  id: number; workspace_id: string; jenis: string; kode_tak_dikenal: boolean; aktor: string | null
  akun_ada: boolean | null; ada_nama_aktor: boolean; sasaran_id: string | null; nominal: Num | null
  tanggal: string | null; pada: string; dibaca_pada: string | null
  /** Hanya tx.hapus / tx.besar: nama kategori (label beku). */
  kategori?: string | null
  /** Hanya peran.ubah (daftar putih peran). */
  peran_baru?: string | null
  /** Hanya rangkuman: cacah/masuk/keluar/pencatat bertipe angka. */
  isi?: { cacah?: number; masuk?: number; keluar?: number; pencatat?: number }
}
export interface SetelanKabarDTO {
  workspace_id: string; tersimpan: boolean; hapus: boolean; masuk: boolean; peran: boolean
  ambang: Num | null; rangkuman_jam: number | null; zona: string | null
}
export interface RingkasKabarDTO {
  total: number; belum_dibaca: number
  per_jenis: Record<JenisKabar | 'lain', number>
}
export interface KursorKabar { p: string; i: number }
export interface KabarPenggunaDTO {
  kasus: string; user_id: string
  /** Hanya halaman pertama. */
  ringkas: RingkasKabarDTO | null
  setelan: SetelanKabarDTO[] | null
  baris: KabarDTO[]; kursor_berikut: KursorKabar | null; total: number | null; halaman_pertama: boolean
}
/** Saringan admin_kabar_pengguna. `belum` true = belum dibaca, false = sudah dibaca, null = semua. */
export interface SaringKabar { ruang: string | null; jenis: JenisKabar | null; belum: boolean | null }
export const SARING_KABAR_KOSONG: Readonly<SaringKabar> = { ruang: null, jenis: null, belum: null }

export interface Kabar {
  id: number; ruangId: string; jenis: JenisKabar | 'lain'; kodeTakDikenal: boolean
  aktor: string | null; akunAda: boolean | null; adaNamaAktor: boolean; sasaranId: string | null
  nominal: number | null; tanggal: string | null; padaIso: string; dibacaIso: string | null; dibaca: boolean
  kategori: string | null; peranBaru: PeranKabar | 'lain' | null
  isi: { cacah: number | null; masuk: number | null; keluar: number | null; pencatat: number | null } | null
}
export interface SetelanKabar {
  ruangId: string; tersimpan: boolean; hapus: boolean; masuk: boolean; peran: boolean
  ambang: number | null; rangkumanJam: number | null; zona: string | null
}
export interface RingkasKabar { total: number; belumDibaca: number; perJenis: Record<JenisKabar | 'lain', number> }

export function keKabar(k: KabarDTO): Kabar {
  const jenis = kodeDari(k.jenis, JENIS_KABAR) ?? 'lain'
  const isi = k.isi && typeof k.isi === 'object'
    ? { cacah: angkaAtauNull(k.isi.cacah), masuk: angkaAtauNull(k.isi.masuk), keluar: angkaAtauNull(k.isi.keluar), pencatat: angkaAtauNull(k.isi.pencatat) }
    : null
  return {
    id: angka0(k.id),
    ruangId: k.workspace_id,
    jenis,
    kodeTakDikenal: k.kode_tak_dikenal === true,
    aktor: k.aktor ?? null,
    akunAda: k.akun_ada ?? null,
    adaNamaAktor: k.ada_nama_aktor === true,
    sasaranId: k.sasaran_id ?? null,
    nominal: angkaAtauNull(k.nominal),
    tanggal: k.tanggal ?? null,
    padaIso: k.pada,
    dibacaIso: k.dibaca_pada ?? null,
    dibaca: !!k.dibaca_pada,
    kategori: jenis === 'tx.hapus' || jenis === 'tx.besar' ? (k.kategori?.trim() || null) : null,
    peranBaru: jenis === 'peran.ubah' ? kodeDari(k.peran_baru, PERAN_KABAR) : null,
    isi: jenis === 'rangkuman' ? isi : null,
  }
}
export const keSetelanKabar = (s: SetelanKabarDTO): SetelanKabar => ({
  ruangId: s.workspace_id, tersimpan: s.tersimpan === true, hapus: s.hapus === true, masuk: s.masuk === true,
  peran: s.peran === true, ambang: angkaAtauNull(s.ambang), rangkumanJam: s.rangkuman_jam ?? null, zona: s.zona ?? null,
})
export const keRingkasKabar = (r: RingkasKabarDTO | null | undefined): RingkasKabar | null => {
  if (!r) return null
  const pj = r.per_jenis ?? {}
  const perJenis = Object.fromEntries([...JENIS_KABAR, 'lain' as const].map(j => [j, angka0(pj[j])])) as Record<JenisKabar | 'lain', number>
  return { total: angka0(r.total), belumDibaca: angka0(r.belum_dibaca), perJenis }
}
/** ?kursor= kabar → {p, i bigint}; rusak → null (halaman pertama). */
export function kursorKabarDariUrl(teks: string | null | undefined): KursorKabar | null {
  const o = bacaObjekKursor(teks)
  return o && isoSah(o.p) && typeof o.i === 'number' && Number.isSafeInteger(o.i) && o.i > 0 ? { p: o.p, i: o.i } : null
}
/** p_ws kabar: hanya uuid yang dikirim (id rusak dari URL = semua ruang lingkup). */
export const ruangKabarSah = (v: string | null | undefined): string | null => (v && POLA_UUID.test(v) ? v : null)
