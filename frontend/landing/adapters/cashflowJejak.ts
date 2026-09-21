/**
 * Jejak (Fase 1, migrasi 0090 §8) — peristiwa yang DILAKUKAN subjek, ranah
 * `jejak` (T2). Server mengirim kunci kolom yang berubah TANPA nilainya dan
 * `ada_judul` saja: judul (nama pedagang, catatan) dan nilai `selisih` adalah
 * teks bebas T3, dibuka lewat admin_teks jenis 'jejak' (id bigint).
 *
 * Jeda tiba = pada (jam server) − pada_perangkat (jam perangkat pencatat):
 * berapa lama catatan itu menunggu di antrean HP sebelum sampai ke server.
 *
 * adapters/ tidak di-auto-import Nuxt — selalu impor eksplisit.
 */
import { keArahUang, type ArahUang } from './cashflow'
import { bacaObjekKursor, isoSah } from './cashflowBuku'

/** CHECK peristiwa.jenis (M/0053:68-73). */
export const JENIS_PERISTIWA = [
  'tx.catat', 'tx.ubah', 'tx.hapus', 'tx.pulih', 'tx.buang',
  'struk.catat', 'struk.hapus',
  'dompet.arsip', 'dompet.pulih',
  'kategori.arsip', 'kategori.pulih',
  'anggota.gabung', 'anggota.keluar', 'anggota.peran',
] as const
export type JenisPeristiwa = typeof JENIS_PERISTIWA[number]

/** Satu baris admin_jejak. */
export interface JejakBarisDTO {
  id: number; workspace_id: string; aktor: string | null; jenis: string; sasaran_id: string | null
  nominal: number | string | null; arah: string | null; tanggal: string | null
  pada: string; pada_perangkat: string | null; jeda_tiba_detik: number | null
  kunci: string[]; ada_judul: boolean
}
export interface KursorJejak { p: string; i: number }
export interface JejakDTO {
  baris: JejakBarisDTO[]
  kursor_berikut: KursorJejak | null
  /** Hanya di halaman pertama. */
  total: number | null
  halaman_pertama: boolean
}

/** Saringan admin_jejak (aktor = subjek kasus). Semua kunci struktur → URL. */
export interface SaringJejak {
  ruang: string | null
  jenis: JenisPeristiwa | null
  dari: string | null
  sampai: string | null
}

/** Ke mana `sasaran_id` menunjuk, menurut jenisnya. */
export type JenisSasaran = 'transaksi' | 'pengguna' | 'lain'
export function jenisSasaran(jenis: string): JenisSasaran {
  if (jenis.startsWith('tx.')) return 'transaksi'
  if (jenis.startsWith('anggota.')) return 'pengguna'
  return 'lain'
}

export interface JejakBaris {
  id: number
  ruangId: string
  aktor: string | null
  jenis: string
  sasaranId: string | null
  sasaran: JenisSasaran
  nominal: number | null
  arah: ArahUang | null
  tanggal: string | null
  padaIso: string
  padaPerangkatIso: string | null
  jedaTiba: number | null
  kunci: string[]
  adaJudul: boolean
}

export function keJejakBaris(d: JejakBarisDTO): JejakBaris {
  const n = d.nominal == null || d.nominal === '' ? Number.NaN : Number(d.nominal)
  return {
    id: Number(d.id),
    ruangId: d.workspace_id,
    aktor: d.aktor ?? null,
    jenis: d.jenis,
    sasaranId: d.sasaran_id ?? null,
    sasaran: jenisSasaran(d.jenis),
    nominal: Number.isFinite(n) ? n : null,
    arah: keArahUang(d.arah),
    tanggal: d.tanggal ?? null,
    padaIso: d.pada,
    padaPerangkatIso: d.pada_perangkat ?? null,
    jedaTiba: d.jeda_tiba_detik == null ? null : Number(d.jeda_tiba_detik),
    kunci: Array.isArray(d.kunci) ? d.kunci.filter((k): k is string => typeof k === 'string') : [],
    adaJudul: d.ada_judul === true,
  }
}

/** Jeda tiba sebagai angka + satuan; kalimatnya milik i18n. < 60 dtk dianggap wajar (null). */
export type JedaTiba = { satuan: 'detik' | 'menit' | 'jam' | 'hari'; n: number } | null
export function jedaTiba(detik: number | null | undefined, ambang = 60): JedaTiba {
  if (detik == null || !Number.isFinite(detik) || Math.abs(detik) < ambang) return null
  const d = Math.abs(detik)
  if (d < 60) return { satuan: 'detik', n: Math.round(d) }
  if (d < 3600) return { satuan: 'menit', n: Math.round(d / 60) }
  if (d < 86400 * 2) return { satuan: 'jam', n: Math.round(d / 3600) }
  return { satuan: 'hari', n: Math.round(d / 86400) }
}

// ── Kursor ───────────────────────────────────────────────────────────────
const bulat = (v: unknown): v is number => typeof v === 'number' && Number.isSafeInteger(v) && v > 0

/** ?kursor= jejak → {p, i}; rusak → null (halaman pertama). */
export function kursorJejakDariUrl(teks: string | null | undefined): KursorJejak | null {
  const o = bacaObjekKursor(teks)
  return o && isoSah(o.p) && bulat(o.i) ? { p: o.p, i: o.i } : null
}

/** ?kursor= riwayat akses → {t, i} (admin_riwayat_akses). */
export function kursorAksesDariUrl(teks: string | null | undefined): { t: string; i: number } | null {
  const o = bacaObjekKursor(teks)
  return o && isoSah(o.t) && bulat(o.i) ? { t: o.t, i: o.i } : null
}
