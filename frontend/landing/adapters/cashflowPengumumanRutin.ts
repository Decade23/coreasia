/**
 * Pengumuman rutin di console CashFlow (spek console 19 Nov 2026, K5,
 * PR-01 sampai PR-05). Kontrak dikunci migrasi CashFlow 20261119123000
 * (dibandingkan tests/cashflow/pengumuman-rutin.test.ts begitu fungsinya ada
 * di folder migrasi):
 *
 * admin_daftar_pengumuman_rutin() -> {sakelar, versi_min, umur_min_hari,
 *   gaya_ada, templat: [{id, topik, judul, isi, tombol, url, aturan,
 *   jeda_hari, jam_mulai, jam_akhir, bobot, aktif, dibuat, versi, terbit,
 *   terakhir_terbit}], terakhir: {id, rutin_id, topik, judul, mulai, sampai}
 *   | null, rencana: {templat_id, topik, mulai, sampai, sebab, paling_cepat}}
 *   Izin view, tanpa audit.
 * admin_simpan_pengumuman_rutin(p_id, p_versi, p_topik, p_judul, p_isi,
 *   p_tombol, p_url, p_aturan, p_jeda_hari, p_jam_mulai, p_jam_akhir,
 *   p_bobot, p_aktif, p_alasan) -> uuid. Izin pii. p_versi null = buat,
 *   terisi = sunting (40001 rutin-basi, P0002 rutin). 22023 rutin-topik,
 *   rutin-jeda, rutin-jam, rutin-bobot, rutin-aktif, aturan, saring,
 *   pengumuman-judul, pengumuman-isi, pengumuman-tautan, alasan-pendek.
 *   Akun internal selalu dikecualikan (dipaksa server).
 * admin_hapus_pengumuman_rutin(p_id, p_alasan) -> void. Izin pii. P0002 rutin.
 *
 * Saat terbit, server menambah: umur akun paling sedikit 3 hari, versi
 * aplikasi paling rendah versi_min (build 1.4.4 yang menampilkan kartu),
 * versi yang tidak diketahui tidak ikut, akun internal tidak ikut. Console
 * hanya menampilkannya, tidak mengirimnya.
 *
 * Fungsi MURNI semua.
 */
import {
  ISIAN_SARING_KOSONG, SARING_KOSONG, aturanKeDto, isianDariSaring, keAturan, periksaIsianSaring, uuidSah,
  BATAS_KECUALI_PENGGUNA, BATAS_KECUALI_KELOMPOK,
  type Aturan, type AturanDTO, type IsianSaring, type KodeGalatSaring,
} from './cashflowPengumumanAturan'
import { ALASAN_MIN, ISI_MAKS, JUDUL_MAKS, TOMBOL_MAKS, panjangHuruf } from './cashflowPengumumanForm'
import { urlTombolPengumuman } from './cashflowPengumumanTautan'

export const TOPIK_RUTIN = ['dukung', 'domi', 'lain'] as const
export type TopikRutin = typeof TOPIK_RUTIN[number]
export const JEDA_MIN = 2
export const JEDA_MAKS = 30
export const JEDA_BAWAAN = 3
export const JAM_MULAI_MIN = 6
export const JAM_MULAI_MAKS = 20
export const JAM_AKHIR_MIN = 7
export const JAM_AKHIR_MAKS = 21
export const JAM_MULAI_BAWAAN = 9
export const JAM_AKHIR_BAWAAN = 20
export const BOBOT_MIN = 1
export const BOBOT_MAKS = 10
/** Bawaan server bila tidak ada sakelar versi_min (build sesudah 1.4.3). */
export const VERSI_KARTU_BAWAAN = 26111900
/** Kunci sakelar di app_config dan versionCode Play paling rendah yang menerima kartu (aplikasi 1.4.4). */
export const KUNCI_SAKELAR_RUTIN = 'pengumuman_rutin'
export const VERSI_MIN_SAKELAR = 26111903
/**
 * Nilai app_config untuk menyalakan atau mematikan jadwal. versi_min yang
 * sudah tersimpan dipertahankan selama tidak lebih rendah dari aplikasi
 * pertama yang mengenal kartu, supaya aplikasi lama tidak pernah menerima.
 * Mematikan tetap menyimpan barisnya (nyala false), jadi versi_min tidak hilang.
 */
export function nilaiSakelarRutin(nyala: boolean, versiMinKini: number): { nyala: boolean; versi_min: number } {
  const v = Number.isInteger(versiMinKini) && versiMinKini >= VERSI_MIN_SAKELAR ? versiMinKini : VERSI_MIN_SAKELAR
  return { nyala, versi_min: v }
}
export const CATATAN_SAKELAR_RUTIN = 'Pengumuman rutin harian. nyala true = jadwal boleh menerbitkan. versi_min = versionCode paling rendah yang menerima.'
export const SEBAB_RENCANA = ['tanpa_templat', 'jeda', 'lewat_jam', 'ada_aktif'] as const
export type SebabRencana = typeof SEBAB_RENCANA[number]

// ── DTO ──────────────────────────────────────────────────────────────────
type Angka = number | string | null | undefined
export interface TemplatRutinDTO {
  id: string; topik: string; judul: string; isi: string; tombol: string | null; url: string | null; aturan: unknown
  jeda_hari: Angka; jam_mulai: Angka; jam_akhir: Angka; bobot: Angka; aktif: boolean; dibuat: string; versi: string
  terbit: Angka; terakhir_terbit: string | null
}
export interface DaftarRutinDTO {
  sakelar: boolean; versi_min: Angka; umur_min_hari: Angka; gaya_ada: boolean
  templat: TemplatRutinDTO[] | null
  terakhir: { id: string; rutin_id: string | null; topik: string | null; judul: string; mulai: string; sampai: string | null } | null
  rencana: { templat_id: string | null; topik: string | null; mulai: string | null; sampai: string | null; sebab: string | null; paling_cepat: string | null } | null
}

// ── Domain ───────────────────────────────────────────────────────────────
export interface TemplatRutin {
  id: string
  topik: TopikRutin | null
  topikAsli: string
  judul: string
  isi: string
  tombol: string | null
  url: string | null
  /** null bila aturan tersimpan tidak terbaca console. */
  aturan: Aturan | null
  jedaHari: number
  jamMulai: number
  jamAkhir: number
  bobot: number
  aktif: boolean
  dibuat: string
  versi: string
  terbit: number
  terakhirTerbit: string | null
}
export interface DaftarRutin {
  sakelar: boolean
  versiMin: number
  umurMinHari: number
  gayaAda: boolean
  templat: TemplatRutin[]
  terakhir: { id: string; rutinId: string | null; topik: TopikRutin | null; judul: string; mulai: string; sampai: string | null } | null
  rencana: { templatId: string | null; topik: TopikRutin | null; mulai: string | null; sampai: string | null; sebab: SebabRencana | null; sebabAsli: string | null; palingCepat: string | null }
}

const angka = (x: Angka, cadangan: number): number => {
  const n = Number(x)
  return x === null || x === undefined || x === '' || !Number.isFinite(n) ? cadangan : n
}
const topik = (x: unknown): TopikRutin | null => (typeof x === 'string' && (TOPIK_RUTIN as readonly string[]).includes(x) ? (x as TopikRutin) : null)
const objek = (x: unknown): Record<string, unknown> | null => (x && typeof x === 'object' && !Array.isArray(x) ? (x as Record<string, unknown>) : null)

export function keTemplatRutin(d: TemplatRutinDTO): TemplatRutin {
  return {
    id: d.id, topik: topik(d.topik), topikAsli: String(d.topik ?? ''), judul: d.judul ?? '', isi: d.isi ?? '',
    tombol: d.tombol || null, url: d.url || null, aturan: keAturan(d.aturan),
    jedaHari: angka(d.jeda_hari, JEDA_BAWAAN), jamMulai: angka(d.jam_mulai, JAM_MULAI_BAWAAN), jamAkhir: angka(d.jam_akhir, JAM_AKHIR_BAWAAN),
    bobot: angka(d.bobot, 1), aktif: d.aktif === true, dibuat: d.dibuat, versi: d.versi,
    terbit: angka(d.terbit, 0), terakhirTerbit: d.terakhir_terbit || null,
  }
}

export function keDaftarRutin(raw: unknown): DaftarRutin {
  const o = objek(raw) ?? {}
  const t = objek(o.terakhir)
  const r = objek(o.rencana) ?? {}
  const sebab = typeof r.sebab === 'string' ? r.sebab : null
  return {
    sakelar: o.sakelar === true,
    versiMin: angka(o.versi_min as Angka, VERSI_KARTU_BAWAAN),
    umurMinHari: angka(o.umur_min_hari as Angka, 3),
    gayaAda: o.gaya_ada === true,
    templat: (Array.isArray(o.templat) ? o.templat : [])
      .filter((x): x is TemplatRutinDTO => !!objek(x) && uuidSah((x as TemplatRutinDTO).id))
      .map(keTemplatRutin),
    terakhir: t && uuidSah(t.id) ? {
      id: String(t.id), rutinId: uuidSah(t.rutin_id) ? String(t.rutin_id) : null, topik: topik(t.topik),
      judul: typeof t.judul === 'string' ? t.judul : '', mulai: String(t.mulai ?? ''), sampai: typeof t.sampai === 'string' ? t.sampai : null,
    } : null,
    rencana: {
      templatId: uuidSah(r.templat_id) ? String(r.templat_id) : null, topik: topik(r.topik),
      mulai: typeof r.mulai === 'string' ? r.mulai : null, sampai: typeof r.sampai === 'string' ? r.sampai : null,
      sebab: (SEBAB_RENCANA as readonly string[]).includes(sebab ?? '') ? (sebab as SebabRencana) : null, sebabAsli: sebab,
      palingCepat: typeof r.paling_cepat === 'string' ? r.paling_cepat : null,
    },
  }
}

// ── Isian ────────────────────────────────────────────────────────────────
export const KOLOM_RUTIN = ['topik', 'judul', 'isi', 'tombol', 'url', 'saring', 'kecuali', 'jeda', 'jam_mulai', 'jam_akhir', 'bobot', 'alasan'] as const
export type KolomRutin = typeof KOLOM_RUTIN[number]
/** Kode = kunci kamus pengumuman.rutin.galat.<kode>. */
export const KODE_GALAT_RUTIN = [
  'topik', 'judulKosong', 'judulPanjang', 'isiKosong', 'isiPanjang', 'tombolKosong', 'tombolPanjang', 'urlKosong', 'urlTidakSah',
  'saring', 'kecualiBanyak', 'jeda', 'jamMulai', 'jamAkhir', 'jamTerbalik', 'bobot', 'alasanPendek',
  'topikServer', 'judulServer', 'isiServer', 'tautanServer', 'saringServer', 'jedaServer', 'jamServer', 'bobotServer',
] as const
export type KodeGalatRutin = typeof KODE_GALAT_RUTIN[number]
export type GalatRutin = Partial<Record<KolomRutin, KodeGalatRutin>>

export interface IsianRutin {
  topik: TopikRutin
  judul: string
  isi: string
  tombol: string
  url: string
  saring: IsianSaring
  kecualiPengguna: string[]
  kecualiKelompok: string[]
  jedaHari: string
  jamMulai: string
  jamAkhir: string
  bobot: string
  aktif: boolean
  alasan: string
}

export function isianRutinBaru(t: TopikRutin = 'dukung'): IsianRutin {
  return {
    topik: t, judul: '', isi: '', tombol: '', url: '', saring: { ...ISIAN_SARING_KOSONG }, kecualiPengguna: [], kecualiKelompok: [],
    jedaHari: String(JEDA_BAWAAN), jamMulai: String(JAM_MULAI_BAWAAN), jamAkhir: String(JAM_AKHIR_BAWAAN), bobot: '1',
    aktif: false, alasan: '',
  }
}

export function isianDariTemplat(t: TemplatRutin): IsianRutin {
  return {
    topik: t.topik ?? 'lain', judul: t.judul, isi: t.isi, tombol: t.tombol ?? '', url: t.url ?? '',
    saring: t.aturan?.saring ? isianDariSaring(t.aturan.saring) : { ...ISIAN_SARING_KOSONG },
    kecualiPengguna: [...(t.aturan?.kecualiPengguna ?? [])], kecualiKelompok: [...(t.aturan?.kecualiKelompok ?? [])],
    jedaHari: String(t.jedaHari), jamMulai: String(t.jamMulai), jamAkhir: String(t.jamAkhir), bobot: String(t.bobot),
    aktif: t.aktif, alasan: '',
  }
}

export interface MuatanRutin {
  topik: TopikRutin
  judul: string
  isi: string
  tombol: string | null
  url: string | null
  aturan: AturanDTO
  jedaHari: number
  jamMulai: number
  jamAkhir: number
  bobot: number
  aktif: boolean
  alasan: string
}

const bulat = (t: string): number | null => (/^\d{1,3}$/.test(t.trim()) ? Number(t.trim()) : null)

/** Isian → muatan; muatan null bila ada galat. Galat saringan ikut dikembalikan untuk panel saringan. */
export function periksaIsianRutin(i: IsianRutin): { galat: GalatRutin; galatSaring: KodeGalatSaring[]; muatan: MuatanRutin | null } {
  const galat: GalatRutin = {}
  if (!(TOPIK_RUTIN as readonly string[]).includes(i.topik)) galat.topik = 'topik'
  const judul = i.judul.trim()
  if (!judul) galat.judul = 'judulKosong'
  else if (panjangHuruf(judul) > JUDUL_MAKS) galat.judul = 'judulPanjang'
  const isi = i.isi.trim()
  if (!isi) galat.isi = 'isiKosong'
  else if (panjangHuruf(isi) > ISI_MAKS) galat.isi = 'isiPanjang'
  const tombol = i.tombol.trim()
  const url = i.url.trim()
  if (tombol || url) {
    if (!tombol) galat.tombol = 'tombolKosong'
    else if (panjangHuruf(tombol) > TOMBOL_MAKS) galat.tombol = 'tombolPanjang'
    if (!url) galat.url = 'urlKosong'
    else if (!urlTombolPengumuman(url)) galat.url = 'urlTidakSah'
  }
  const s = periksaIsianSaring(i.saring)
  if (!s.saring) galat.saring = 'saring'
  if (i.kecualiPengguna.length > BATAS_KECUALI_PENGGUNA || i.kecualiKelompok.length > BATAS_KECUALI_KELOMPOK) galat.kecuali = 'kecualiBanyak'
  const jeda = bulat(i.jedaHari)
  if (jeda === null || jeda < JEDA_MIN || jeda > JEDA_MAKS) galat.jeda = 'jeda'
  const jamMulai = bulat(i.jamMulai)
  const jamAkhir = bulat(i.jamAkhir)
  if (jamMulai === null || jamMulai < JAM_MULAI_MIN || jamMulai > JAM_MULAI_MAKS) galat.jam_mulai = 'jamMulai'
  if (jamAkhir === null || jamAkhir < JAM_AKHIR_MIN || jamAkhir > JAM_AKHIR_MAKS) galat.jam_akhir = 'jamAkhir'
  else if (jamMulai !== null && jamAkhir <= jamMulai) galat.jam_akhir = 'jamTerbalik'
  const bobot = bulat(i.bobot)
  if (bobot === null || bobot < BOBOT_MIN || bobot > BOBOT_MAKS) galat.bobot = 'bobot'
  if (panjangHuruf(i.alasan.trim()) < ALASAN_MIN) galat.alasan = 'alasanPendek'
  if (Object.keys(galat).length || !s.saring || jeda === null || jamMulai === null || jamAkhir === null || bobot === null) {
    return { galat, galatSaring: s.galat, muatan: null }
  }
  return {
    galat, galatSaring: s.galat,
    muatan: {
      topik: i.topik, judul, isi, tombol: tombol || null, url: tombol ? urlTombolPengumuman(url) : null,
      // Akun internal selalu dikecualikan (server juga memaksanya).
      aturan: aturanKeDto({ segmenId: null, saring: { ...SARING_KOSONG, ...s.saring }, kecualiInternal: true,
        kecualiPengguna: i.kecualiPengguna, kecualiKelompok: i.kecualiKelompok }),
      jedaHari: jeda, jamMulai, jamAkhir, bobot, aktif: i.aktif, alasan: i.alasan.trim(),
    },
  }
}

const HINT_RUTIN: Readonly<Record<string, { kolom: KolomRutin; kode: KodeGalatRutin }>> = {
  'rutin-topik': { kolom: 'topik', kode: 'topikServer' },
  'pengumuman-judul': { kolom: 'judul', kode: 'judulServer' },
  'pengumuman-isi': { kolom: 'isi', kode: 'isiServer' },
  'pengumuman-tautan': { kolom: 'url', kode: 'tautanServer' },
  aturan: { kolom: 'saring', kode: 'saringServer' },
  saring: { kolom: 'saring', kode: 'saringServer' },
  'rutin-jeda': { kolom: 'jeda', kode: 'jedaServer' },
  'rutin-jam': { kolom: 'jam_akhir', kode: 'jamServer' },
  'rutin-bobot': { kolom: 'bobot', kode: 'bobotServer' },
  'alasan-pendek': { kolom: 'alasan', kode: 'alasanPendek' },
}
export function galatServerRutin(g: { hint?: string } | null | undefined): { kolom: KolomRutin; kode: KodeGalatRutin } | null {
  return (g?.hint && HINT_RUTIN[g.hint]) || null
}
export const HINT_FORM_RUTIN = [...Object.keys(HINT_RUTIN), 'rutin-basi', 'rutin-kunci', 'rutin', 'rutin-aktif']

/** Jam bulat 0..23 → "09.00". */
export const jamTampil = (jam: number): string => `${String(jam).padStart(2, '0')}.00`
