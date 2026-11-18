/**
 * Form pengumuman (spek console 19 Nov 2026, K8, PF-01 dan PF-03): isian,
 * pemeriksaan per kolom dengan aturan yang sama dengan server
 * (pengumuman_periksa), galat server yang menempel di kolomnya, gaya tampilan,
 * dan pengecualian akun di SEMUA mode penerima.
 *
 * PENGECUALIAN DI SEMUA MODE. Pengecualian hanya ada di audience_rules. Maka
 * "Semua pengguna kecuali ...", "Beberapa pengguna kecuali ...", dan
 * "Kelompok kecuali ..." dikirim sebagai penerima `aturan`:
 *   semua      saring {}
 *   satu atau beberapa pengguna  saring {pengguna: [...]}
 *   kelompok   saring {kelompok: [...]}
 * ditambah kecuali_internal, kecuali_pengguna, kecuali_kelompok. Pengecualian
 * dibaca hidup oleh server. Tanpa pengecualian modenya tetap seperti dulu
 * (`all` tetap sampai ke aplikasi lama). Saat menyunting, aturan yang hanya
 * berisi daftar itu dibaca balik ke modenya (penerimaDari).
 *
 * TOMBOL. Alamat web HTTPS, atau tautan dalam aplikasi 1.4.4 dari daftar
 * terkunci (cashflow://ai, cashflow://dukung), sama dengan
 * pengumuman_tautan_sah di server (CashFlow 20261119131000, T4).
 *
 * GAYA. 'modal' = popup seperti sekarang, 'kartu' = kartu di Beranda yang
 * bisa ditutup (aplikasi 1.4.4, T4). Kartu hanya bisa dipilih bila server
 * sudah punya kolom gaya (`gayaAda`). Aplikasi sebelum 1.4.4 tetap
 * menampilkan pengumuman bergaya kartu sebagai popup.
 *
 * Fungsi MURNI semua: tanpa jaringan, tanpa state.
 */
import { LEVEL_PENGUMUMAN, type LevelPengumuman, type Pengumuman } from './cashflow'
import { keDatetimeLokalWib, dariDatetimeLokalWib } from './cashflowWaktu'
import { urlTombolPengumuman } from './cashflowPengumumanTautan'
import { penerimaSah, type JenisPenerima } from './cashflowPengumuman'
import {
  SARING_KOSONG, BATAS_KECUALI_PENGGUNA, BATAS_KECUALI_KELOMPOK, aturanKeDto,
  type Aturan, type AturanDTO, type Saring,
} from './cashflowPengumumanAturan'

// ── Batas (sama dengan pengumuman_periksa dan CHECK tabel) ───────────────
export const JUDUL_MAKS = 80
export const ISI_MAKS = 500
export const TOMBOL_MAKS = 40
export const ALASAN_MIN = 8
export const GAYA_PENGUMUMAN = ['modal', 'kartu'] as const
export type GayaPengumuman = typeof GAYA_PENGUMUMAN[number]

export const KOLOM_PENGUMUMAN = ['penerima', 'judul', 'isi', 'level', 'gaya', 'mulai', 'sampai', 'tombol', 'url', 'alasan'] as const
export type KolomPengumuman = typeof KOLOM_PENGUMUMAN[number]
/** Kode galat = kunci kamus pengumuman.form.galat.<kode>. */
export const KODE_GALAT_PENGUMUMAN = [
  'penerimaKosong', 'penerimaDitolak', 'aturanDitolak', 'saringDitolak', 'segmenDitolak', 'kecualiBanyak',
  'judulKosong', 'judulPanjang', 'judulServer', 'isiKosong', 'isiPanjang', 'isiServer', 'level', 'levelServer',
  'gaya', 'gayaBelumAda', 'mulaiRusak', 'sampaiRusak', 'sampaiSebelumMulai', 'waktuServer',
  'tombolKosong', 'tombolPanjang', 'urlKosong', 'urlTidakSah', 'tautanServer', 'alasanPendek',
] as const
export type KodeGalatPengumuman = typeof KODE_GALAT_PENGUMUMAN[number]
export type GalatPengumuman = Partial<Record<KolomPengumuman, KodeGalatPengumuman>>

export const panjangHuruf = (s: string): number => Array.from(s).length

// ── Pengecualian ─────────────────────────────────────────────────────────
export interface Kecuali { internal: boolean; pengguna: string[]; kelompok: string[] }
export const KECUALI_KOSONG: Readonly<Kecuali> = Object.freeze({ internal: false, pengguna: [], kelompok: [] })
export const adaKecuali = (k: Kecuali): boolean => k.internal || k.pengguna.length > 0 || k.kelompok.length > 0

export interface PenerimaIsian {
  jenis: JenisPenerima
  pengguna: string[]
  kelompok: string[]
  /** Hanya untuk jenis `aturan`: keluaran editor aturan (null = belum sah). */
  aturan: AturanDTO | null
  /** Untuk jenis selain `aturan` (aturan membawa pengecualiannya sendiri). */
  kecuali: Kecuali
}
export interface PenerimaKirim { penerima: JenisPenerima; pengguna: string[]; kelompok: string[]; aturan: AturanDTO | null }

/** Penerima siap kirim ke v4/v5 (p_penerima, p_pengguna, p_kelompok, p_aturan). null = belum sah. */
export function penerimaKirim(p: PenerimaIsian): PenerimaKirim | null {
  if (p.jenis === 'aturan') return p.aturan ? { penerima: 'aturan', pengguna: [], kelompok: [], aturan: p.aturan } : null
  if (!penerimaSah(p.jenis, p.pengguna, p.kelompok, null)) return null
  if (!adaKecuali(p.kecuali)) return { penerima: p.jenis, pengguna: [...p.pengguna], kelompok: [...p.kelompok], aturan: null }
  if (p.kecuali.pengguna.length > BATAS_KECUALI_PENGGUNA || p.kecuali.kelompok.length > BATAS_KECUALI_KELOMPOK) return null
  const saring: Saring = {
    ...SARING_KOSONG,
    pengguna: p.jenis === 'single' || p.jenis === 'users' ? [...new Set(p.pengguna)] : null,
    kelompok: p.jenis === 'groups' ? [...new Set(p.kelompok)] : null,
  }
  return {
    penerima: 'aturan', pengguna: [], kelompok: [],
    aturan: aturanKeDto({ segmenId: null, saring, kecualiInternal: p.kecuali.internal, kecualiPengguna: p.kecuali.pengguna, kecualiKelompok: p.kecuali.kelompok }),
  }
}

/** Saring tanpa apa pun selain daftar pengguna atau kelompok. */
function hanyaDaftar(s: Saring): boolean {
  return s.versiMin === null && s.versiDiBawah === null && s.versiTakDiketahui === 'ikut' && s.daftarSejak === null
    && s.daftarSampai === null && s.aktifHari === null && s.ruang === null && s.domiPakai === null && s.domiBeli === null
    && s.kreditHabis === null && s.nomorWa === null && s.umurMinHari === null && !(s.pengguna?.length && s.kelompok?.length)
}

/**
 * Penerima dari pengumuman tersimpan. Aturan "semua/beberapa pengguna/kelompok
 * kecuali ..." (bentuk yang dibuat penerimaKirim) kembali ke modenya. Aturan
 * lain, termasuk "semua pengguna" tanpa pengecualian, tetap mode aturan supaya
 * menyimpan ulang tidak diam-diam mengubah jangkauannya.
 */
export function penerimaDari(p: Pick<Pengumuman, 'penerima' | 'pengguna' | 'kelompok' | 'aturan'>): PenerimaIsian & { aturanAwal: Aturan | null } {
  const a = p.aturan
  if (p.penerima === 'aturan' && a && !a.segmenId && a.saring && a.asing.length === 0 && hanyaDaftar(a.saring)) {
    const kecuali: Kecuali = { internal: a.kecualiInternal, pengguna: [...a.kecualiPengguna], kelompok: [...a.kecualiKelompok] }
    const s = a.saring
    if (s.pengguna?.length) {
      return { jenis: s.pengguna.length === 1 ? 'single' : 'users', pengguna: [...s.pengguna], kelompok: [], aturan: null, kecuali, aturanAwal: null }
    }
    if (s.kelompok?.length) return { jenis: 'groups', pengguna: [], kelompok: [...s.kelompok], aturan: null, kecuali, aturanAwal: null }
    if (adaKecuali(kecuali)) return { jenis: 'all', pengguna: [], kelompok: [], aturan: null, kecuali, aturanAwal: null }
  }
  return {
    jenis: p.penerima, pengguna: [...p.pengguna], kelompok: [...p.kelompok], aturan: null,
    kecuali: { ...KECUALI_KOSONG, pengguna: [], kelompok: [] }, aturanAwal: p.penerima === 'aturan' ? a : null,
  }
}

// ── Isian ────────────────────────────────────────────────────────────────
export interface IsianPengumuman {
  judul: string
  isi: string
  level: LevelPengumuman
  gaya: GayaPengumuman
  /** datetime-local WIB. */
  mulai: string
  sampai: string
  tombol: string
  url: string
  alasan: string
  /** ISO asli saat menyunting: waktu yang tidak diubah dikirim persis (detik tidak hilang). */
  awalMulai: string | null
  awalSampai: string | null
}

export function isianBaru(kini: Date = new Date()): IsianPengumuman {
  return { judul: '', isi: '', level: 'info', gaya: 'modal', mulai: keDatetimeLokalWib(kini), sampai: '', tombol: '', url: '', alasan: '', awalMulai: null, awalSampai: null }
}

export function isianDari(p: Pick<Pengumuman, 'judul' | 'isi' | 'level' | 'gaya' | 'mulai' | 'sampai' | 'tombol' | 'url'>): IsianPengumuman {
  return {
    judul: p.judul, isi: p.isi,
    level: (LEVEL_PENGUMUMAN as readonly string[]).includes(p.level) ? (p.level as LevelPengumuman) : 'info',
    gaya: p.gaya ?? 'modal',
    mulai: keDatetimeLokalWib(p.mulai), sampai: p.sampai ? keDatetimeLokalWib(p.sampai) : '',
    tombol: p.tombol ?? '', url: p.url ?? '', alasan: '', awalMulai: p.mulai, awalSampai: p.sampai,
  }
}

export interface MuatanPengumuman {
  judul: string
  isi: string
  level: LevelPengumuman
  gaya: GayaPengumuman
  mulai: string
  sampai: string | null
  tombol: string | null
  url: string | null
  alasan: string
}

/** Waktu dari datetime-local: ISO asli bila tidak diubah, null = rusak. */
function waktu(nilai: string, asal: string | null): string | null {
  if (asal && keDatetimeLokalWib(asal) === nilai) return asal
  return dariDatetimeLokalWib(nilai)
}

/** Isian → muatan. `muatan` null bila ada galat. `penerimaOk` dari penerimaKirim. */
export function periksaIsianPengumuman(
  i: IsianPengumuman, opsi: { gayaAda: boolean; penerimaOk: boolean },
): { galat: GalatPengumuman; muatan: MuatanPengumuman | null } {
  const galat: GalatPengumuman = {}
  if (!opsi.penerimaOk) galat.penerima = 'penerimaKosong'
  const judul = i.judul.trim()
  if (!judul) galat.judul = 'judulKosong'
  else if (panjangHuruf(judul) > JUDUL_MAKS) galat.judul = 'judulPanjang'
  const isi = i.isi.trim()
  if (!isi) galat.isi = 'isiKosong'
  else if (panjangHuruf(isi) > ISI_MAKS) galat.isi = 'isiPanjang'
  if (!(LEVEL_PENGUMUMAN as readonly string[]).includes(i.level)) galat.level = 'level'
  if (!(GAYA_PENGUMUMAN as readonly string[]).includes(i.gaya)) galat.gaya = 'gaya'
  else if (i.gaya === 'kartu' && !opsi.gayaAda) galat.gaya = 'gayaBelumAda'
  const mulai = waktu(i.mulai, i.awalMulai)
  if (!mulai) galat.mulai = 'mulaiRusak'
  let sampai: string | null = null
  if (i.sampai.trim()) {
    sampai = waktu(i.sampai, i.awalSampai)
    if (!sampai) galat.sampai = 'sampaiRusak'
    else if (mulai && Date.parse(sampai) <= Date.parse(mulai)) galat.sampai = 'sampaiSebelumMulai'
  }
  const tombol = i.tombol.trim()
  const url = i.url.trim()
  if (tombol || url) {
    if (!tombol) galat.tombol = 'tombolKosong'
    else if (panjangHuruf(tombol) > TOMBOL_MAKS) galat.tombol = 'tombolPanjang'
    if (!url) galat.url = 'urlKosong'
    else if (!urlTombolPengumuman(url)) galat.url = 'urlTidakSah'
  }
  if (panjangHuruf(i.alasan.trim()) < ALASAN_MIN) galat.alasan = 'alasanPendek'
  if (Object.keys(galat).length || !mulai) return { galat, muatan: null }
  return {
    galat,
    muatan: {
      judul, isi, level: i.level, gaya: i.gaya, mulai, sampai,
      tombol: tombol || null, url: tombol ? urlTombolPengumuman(url) : null, alasan: i.alasan.trim(),
    },
  }
}

/** Hint server (22023) → kolom form dan kode galatnya. null = bukan galat kolom. */
const HINT_KOLOM: Readonly<Record<string, { kolom: KolomPengumuman; kode: KodeGalatPengumuman }>> = {
  'pengumuman-judul': { kolom: 'judul', kode: 'judulServer' },
  'pengumuman-isi': { kolom: 'isi', kode: 'isiServer' },
  'pengumuman-level': { kolom: 'level', kode: 'levelServer' },
  'pengumuman-waktu': { kolom: 'sampai', kode: 'waktuServer' },
  'pengumuman-tautan': { kolom: 'url', kode: 'tautanServer' },
  'alasan-pendek': { kolom: 'alasan', kode: 'alasanPendek' },
  penerima: { kolom: 'penerima', kode: 'penerimaDitolak' },
  aturan: { kolom: 'penerima', kode: 'aturanDitolak' },
  saring: { kolom: 'penerima', kode: 'saringDitolak' },
  segmen: { kolom: 'penerima', kode: 'segmenDitolak' },
  gaya: { kolom: 'gaya', kode: 'gaya' },
  'gaya-belum-ada': { kolom: 'gaya', kode: 'gayaBelumAda' },
}
export function galatServerPengumuman(g: { hint?: string } | null | undefined): { kolom: KolomPengumuman; kode: KodeGalatPengumuman } | null {
  return (g?.hint && HINT_KOLOM[g.hint]) || null
}
export const HINT_FORM_PENGUMUMAN = Object.keys(HINT_KOLOM)
