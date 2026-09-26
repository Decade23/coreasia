/**
 * Bantu tampilan tab ranah buku Ruang 360 (Katalog, Jadwal, Usaha + riwayat
 * stok) — fungsi murni di atas domain adapters/cashflowRanahBuku.ts, supaya
 * perilakunya diuji tanpa merender komponen (tests/cashflow/tampil-buku.test.ts).
 *
 * Tidak ada yang menghitung ulang rumus server di sini (terpakai, stok,
 * tempo, keadaan): layar menampilkan angka server apa adanya. Yang ada hanya
 * penyusunan (urut, kelompok, saring di memori) dan tafsir tampilan.
 *
 * adapters/ tidak di-auto-import Nuxt — selalu impor eksplisit.
 */
import { hariIniWib } from './cashflowWaktu'
import { POLA_BULAN, type Anggaran, type JadwalBaris, type KategoriKatalog, type Katalog, type Produk } from './cashflowRanahBuku'

// ── Bulan (Katalog) ──────────────────────────────────────────────────────
/** Bulan WIB kini 'YYYY-MM' (sama dengan bawaan server p_bulan null). */
export const bulanWibKini = (sekarang: Date = new Date()): string => hariIniWib(sekarang).slice(0, 7)

/** Geser 'YYYY-MM' n bulan; masukan tidak sah dipulangkan apa adanya. */
export function geserBulan(bulan: string, n: number): string {
  if (!POLA_BULAN.test(bulan)) return bulan
  const [t, b] = bulan.split('-').map(Number) as [number, number]
  const total = t * 12 + (b - 1) + n
  const tt = Math.floor(total / 12)
  const bb = total - tt * 12 + 1
  return `${String(tt).padStart(4, '0')}-${String(bb).padStart(2, '0')}`
}

/** 'YYYY-MM' → 'September 2026' / 'September 2026' (en); masukan tidak sah apa adanya. */
export function labelBulan(bulan: string, bahasa: 'id' | 'en' = 'id'): string {
  if (!POLA_BULAN.test(bulan)) return bulan
  const [t, b] = bulan.split('-').map(Number) as [number, number]
  return new Date(Date.UTC(t, b - 1, 1)).toLocaleDateString(bahasa === 'en' ? 'en-US' : 'id-ID', { month: 'long', year: 'numeric', timeZone: 'UTC' })
}

// ── Anggaran (Katalog) ───────────────────────────────────────────────────
export type NadaAnggaran = 'tanpa-target' | 'aman' | 'dekat' | 'lewat'
/** Nada bilah anggaran dari rasio server; null (target 0) = tanpa target, bukan 0%. */
export function nadaAnggaran(rasio: number | null): NadaAnggaran {
  if (rasio == null) return 'tanpa-target'
  if (rasio > 1) return 'lewat'
  if (rasio >= 0.8) return 'dekat'
  return 'aman'
}
/** Lebar bilah 0..100 (dijepit; rasio > 1 tetap penuh, angka aslinya ditulis terpisah). */
export const lebarBilah = (rasio: number | null): number => (rasio == null ? 0 : Math.max(0, Math.min(100, Math.round(rasio * 100))))

export interface BarisAnggaranTampil extends Anggaran { nama: string; kategori: KategoriKatalog | null }
/**
 * Keseluruhan dulu, lalu target kategori: yang tampil di aplikasi dulu, lalu
 * yang tidak (target di kategori pemasukan/arsip — sumber keluhan "target
 * saya hilang"), masing-masing urut nama. Nama kategori dari daftar
 * kategori katalog yang sama; kategori di luar daftar (terpotong) = null.
 */
export function susunAnggaran(k: Pick<Katalog, 'anggaran' | 'kategori'>, labelKeseluruhan: string): BarisAnggaranTampil[] {
  const peta = new Map(k.kategori.map(c => [c.id, c]))
  const baris = k.anggaran.map((a): BarisAnggaranTampil => {
    const kat = a.kategoriId ? peta.get(a.kategoriId) ?? null : null
    return { ...a, kategori: kat, nama: a.keseluruhan ? labelKeseluruhan : (kat?.nama ?? a.kategoriId?.slice(0, 8) ?? '—') }
  })
  const bobot = (a: BarisAnggaranTampil) => (a.keseluruhan ? 0 : a.tampilDiAplikasi === false ? 2 : 1)
  return baris.sort((a, b) => bobot(a) - bobot(b) || a.nama.localeCompare(b.nama, 'id'))
}

// ── Kategori (Katalog) ───────────────────────────────────────────────────
export interface KelompokKategori { arah: 'keluar' | 'masuk' | 'lain'; kategori: KategoriKatalog[] }
/** Pengeluaran, pemasukan, lalu kode tak dikenal; urutan dalam kelompok = urutan server. */
export function kelompokkanKategori(daftar: KategoriKatalog[]): KelompokKategori[] {
  const hasil: KelompokKategori[] = [
    { arah: 'keluar', kategori: daftar.filter(c => c.arah === 'keluar') },
    { arah: 'masuk', kategori: daftar.filter(c => c.arah === 'masuk') },
    { arah: 'lain', kategori: daftar.filter(c => c.arah === null) },
  ]
  return hasil.filter(g => g.kategori.length)
}

// ── Saringan arsip (Jadwal, Usaha) ───────────────────────────────────────
export const PILIHAN_ARSIP = ['semua', 'aktif', 'arsip'] as const
export type PilihanArsip = typeof PILIHAN_ARSIP[number]
/** p_arsip server: null = semua, false = tanpa arsip, true = arsip saja. */
export const arsipDariPilihan = (p: PilihanArsip): boolean | null => (p === 'aktif' ? false : p === 'arsip' ? true : null)

// ── Jadwal ───────────────────────────────────────────────────────────────
export interface ProgresJadwal {
  /** cicilan = punya total_count; berulang = tanpa batas. */
  jenis: 'cicilan' | 'berulang'
  dibayar: number; dilewati: number; total: number | null
  /** 0..100 atas total (cicilan); null untuk berulang. */
  persen: number | null
}
/** "10 dari 24 dibayar": dari paid_count/skipped_count/total_count server, tanpa dihitung ulang. */
export function progresJadwal(j: Pick<JadwalBaris, 'totalKali' | 'dibayarKali' | 'dilewatiKali'>): ProgresJadwal {
  if (j.totalKali == null || j.totalKali <= 0) {
    return { jenis: 'berulang', dibayar: j.dibayarKali, dilewati: j.dilewatiKali, total: null, persen: null }
  }
  const persen = Math.max(0, Math.min(100, Math.round((j.dibayarKali / j.totalKali) * 100)))
  return { jenis: 'cicilan', dibayar: j.dibayarKali, dilewati: j.dilewatiKali, total: j.totalKali, persen }
}
/** Nada pil keadaan jadwal. */
export function nadaKeadaan(k: JadwalBaris['keadaan']): 'bahaya' | 'emas' | 'hijau' | 'netral' {
  if (k === 'terlambat') return 'bahaya'
  if (k === 'hari-ini') return 'emas'
  if (k === 'selesai') return 'hijau'
  return 'netral'
}

// ── Produk (Usaha) ───────────────────────────────────────────────────────
export interface KategoriProduk { nama: string; jumlah: number }
/** Daftar kategori produk (K-F3-13, T2) untuk chip saringan, urut nama; tanpa kategori tidak ikut. */
export function kategoriProduk(produk: Produk[]): KategoriProduk[] {
  const n = new Map<string, number>()
  for (const p of produk) if (p.kategori) n.set(p.kategori, (n.get(p.kategori) ?? 0) + 1)
  return [...n.entries()].map(([nama, jumlah]) => ({ nama, jumlah })).sort((a, b) => a.nama.localeCompare(b.nama, 'id'))
}
export interface SaringProduk {
  /** Teks cari nama (hanya di memori, tidak ke URL). */
  cari: string
  /** Nama kategori; '' = semua. */
  kategori: string
  /** Hanya yang perlu perhatian (menipis atau minus). */
  perhatian: boolean
}
export const SARING_PRODUK_KOSONG: Readonly<SaringProduk> = { cari: '', kategori: '', perhatian: false }
/** Saring di memori atas jawaban server (tanpa RPC tambahan, tanpa audit tambahan). */
export function saringProduk(produk: Produk[], s: SaringProduk): Produk[] {
  const cari = s.cari.trim().toLocaleLowerCase('id')
  return produk.filter(p =>
    (!cari || p.nama.toLocaleLowerCase('id').includes(cari))
    && (!s.kategori || p.kategori === s.kategori)
    && (!s.perhatian || p.menipis || p.minus))
}
/** Tanda +/− untuk delta stok (warna saja tidak cukup). */
export const deltaTeks = (d: number, fmt: (n: number) => string = String): string => (d > 0 ? `+${fmt(d)}` : d < 0 ? `−${fmt(Math.abs(d))}` : fmt(0))
/** Kuantitas stok (numeric, bisa pecahan: 2,5 kg) — tidak dibulatkan seperti angka(); '—' untuk null. */
export function kuantitas(n: number | null | undefined, bahasa: 'id' | 'en' = 'id'): string {
  if (n == null || !Number.isFinite(n)) return '—'
  return n.toLocaleString(bahasa === 'en' ? 'en-US' : 'id-ID', { maximumFractionDigits: 3 })
}

// ── Perangkat & Kabar (Pengguna 360) ─────────────────────────────────────
/** Jeda antrean dalam satuan terbaca: 12 dtk, 3 mnt, 5 jam, 2 hari ('—' untuk null).
 *  Jam dipakai sampai < 2 hari (sama dengan jedaTiba jejak). */
export function durasiSingkat(detik: number | null | undefined, bahasa: 'id' | 'en' = 'id'): string {
  if (detik == null || !Number.isFinite(detik)) return '—'
  const tanda = detik < 0 ? '−' : ''
  const d = Math.abs(detik)
  const [s, m, j, h] = bahasa === 'en' ? ['s', 'min', 'h', 'd'] : ['dtk', 'mnt', 'jam', 'hari']
  if (d < 60) return `${tanda}${Math.round(d)} ${s}`
  if (d < 3600) return `${tanda}${Math.round(d / 60)} ${m}`
  if (d < 86400 * 2) return `${tanda}${Math.round(d / 3600)} ${j}`
  return `${tanda}${Math.round(d / 86400)} ${h}`
}
/** Tanggal WIB 'YYYY-MM-DD' dari ISO (saringan Jejak ?dari=&sampai= satu hari); null bila rusak. */
export function tanggalWibDariIso(iso: string | null | undefined): string | null {
  if (!iso) return null
  const t = new Date(iso)
  return Number.isFinite(t.getTime()) ? hariIniWib(t) : null
}
/** Pilihan rentang tab Perangkat (p_hari 1..90; server menolak di luar itu). */
export const PILIHAN_HARI_PERANGKAT = [7, 30, 90] as const
/** Saringan baca kabar: belum = true, sudah = false, semua = null. */
export const PILIHAN_BACA_KABAR = ['semua', 'belum', 'sudah'] as const
export type PilihanBacaKabar = typeof PILIHAN_BACA_KABAR[number]
export const belumDariPilihan = (p: PilihanBacaKabar): boolean | null => (p === 'belum' ? true : p === 'sudah' ? false : null)
export const pilihanDariBelum = (b: boolean | null): PilihanBacaKabar => (b === true ? 'belum' : b === false ? 'sudah' : 'semua')
