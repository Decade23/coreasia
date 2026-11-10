/**
 * Percakapan Domi di console (Pengguna 360, tab Domi AI): bentuk data RPC dan
 * fungsi edge, plus pembacaan isi pesan menjadi susunan yang digambar panel.
 *
 * MURNI: tanpa jaringan dan tanpa Vue, bisa diuji langsung. Sumber kebenaran
 * tampilan ada di aplikasi (komponen Domi dan pembacanya), bentuk datanya di
 * blok jawaban yang disimpan server. Pembaca di sini sengaja LEBIH TOLERAN
 * dari aplikasi: aplikasi membuang blok yang tidak lolos, console harus
 * menampilkan semua yang tersimpan, jadi blok yang tidak dikenal atau
 * rusak menjadi satu kotak kecil berisi nama tipenya, bukan hilang diam-diam.
 *
 * adapters/ tidak di-auto-import Nuxt, selalu impor eksplisit.
 */
import { angka, rupiah } from './cashflow'
import { capWaktuWib } from './cashflowKasus'

// ── Kasus anak ───────────────────────────────────────────────────────────
/** Alasan kasus anak {teks, foto} untuk tab Domi. Bahasa Indonesia apa pun
 *  bahasa layar (audit dibaca lintas admin), berbeda dari alasan anak lain. */
export const alasanDomiOtomatis = (sekarang: Date = new Date()): string =>
  `Percakapan Domi dibuka dari console CashFlow · ${capWaktuWib(sekarang)}`

/** Halaman daftar dan pesan (server menjepit 50). */
export const LIMIT_DAFTAR_DOMI = 20
export const LIMIT_PESAN_DOMI = 30
/** Batas pesan per panggilan admin-lampiran jenis ai. */
export const MAKS_PESAN_GAMBAR = 12

// ── DTO: persis jawaban RPC ──────────────────────────────────────────────
export interface KursorPercakapan { d: string; i: string }
export interface PercakapanDTO { id: string; judul: string; jumlah_pesan: number; dibuat: string; diperbarui: string }
export interface PercakapanDaftarDTO {
  baris: PercakapanDTO[]; kursor_berikut: KursorPercakapan | null; total: number | null; halaman_pertama: boolean
}
export interface PesanDTO {
  id: number; peran: string; isi: unknown; dibuat: string; model: string | null
  token_masuk: number | null; token_keluar: number | null; biaya: number | string | null
}
export interface PesanDaftarDTO {
  percakapan: { id: string; judul: string; jumlah_pesan: number; dibuat: string; diperbarui: string }
  pesan: PesanDTO[]; kursor_sebelum: number | null; ada_lagi: boolean; halaman_pertama: boolean
}
export interface GambarDomiDTO { jenis?: string; pesan: number; urutan: number; jalur: string; url: string | null; kedaluwarsa_pada: string | null }
export interface GambarDaftarDomiDTO { berkas: GambarDomiDTO[]; berlaku_detik: number }

// ── Domain ───────────────────────────────────────────────────────────────
export interface Percakapan { id: string; judul: string; jumlahPesan: number; dibuatIso: string; diperbaruiIso: string }
export interface DaftarPercakapan { baris: Percakapan[]; kursorBerikut: KursorPercakapan | null; total: number | null; halamanPertama: boolean }

export interface PesanUser {
  peran: 'user'; id: number; dibuatIso: string; teks: string
  /** Pesan ini memang membawa gambar. */
  gambar: boolean
  /** Jalur foto urut kirim (1..5). Kosong untuk pesan lama atau unggahan gagal. */
  jalur: string[]
  /** Jumlah foto yang dikirim, bila server mencatatnya. */
  jumlahGambar: number | null
}
export interface InfoJawaban {
  /** Kredit yang dipotong. Jawaban lama belum menyimpannya, jadi null. */
  kredit: number | null
  biaya: number | null; tokenMasuk: number | null; tokenKeluar: number | null; model: string | null
}
export interface PesanAsisten {
  peran: 'asisten'; id: number; dibuatIso: string
  susunan: SusunanDomi[]
  saran: string[]
  info: InfoJawaban
  /** Jalur foto yang disebut draf di jawaban ini (kartu struk, kartu transaksi). */
  jalur: string[]
}
export type PesanDomi = PesanUser | PesanAsisten
export interface HalamanPesan {
  percakapan: Percakapan; pesan: PesanDomi[]; kursorSebelum: number | null; adaLagi: boolean; halamanPertama: boolean
}

// ── Pembantu baca ────────────────────────────────────────────────────────
type Obj = Record<string, unknown>
const objek = (v: unknown): Obj | null => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Obj) : null)
const teks = (v: unknown): string => (typeof v === 'string' ? v : '')
const teksAtauNull = (v: unknown): string | null => (typeof v === 'string' && v.trim() ? v : null)
const angkaAtauNull = (v: unknown): number | null => {
  const n = typeof v === 'number' ? v : typeof v === 'string' && v.trim() !== '' ? Number(v) : NaN
  return Number.isFinite(n) ? n : null
}
const cacah = (v: unknown): number => {
  const n = angkaAtauNull(v)
  return n === null ? 0 : n
}
const JALUR_GAMBAR = /^[0-9a-f-]{36}\/[0-9a-f-]{36}\/[0-9a-f-]{36}\.(jpg|png|webp)$/i
const jalurSah = (v: unknown): string | null => (typeof v === 'string' && JALUR_GAMBAR.test(v) ? v : null)

const PESAN_GAMBAR_BAWAAN = 'Tolong baca gambar ini.'
const BATAS_BLOK = 24

// ── Baca jawaban ─────────────────────────────────────────────────────────
export function keDaftarPercakapan(d: unknown): DaftarPercakapan {
  const o = objek(d) ?? {}
  const baris = Array.isArray(o.baris) ? o.baris : []
  const k = objek(o.kursor_berikut)
  return {
    baris: baris.map(objek).filter((b): b is Obj => !!b && typeof b.id === 'string').map(b => ({
      id: b.id as string, judul: teks(b.judul), jumlahPesan: cacah(b.jumlah_pesan),
      dibuatIso: teks(b.dibuat), diperbaruiIso: teks(b.diperbarui),
    })),
    kursorBerikut: k && typeof k.d === 'string' && typeof k.i === 'string' ? { d: k.d, i: k.i } : null,
    total: angkaAtauNull(o.total),
    halamanPertama: o.halaman_pertama === true,
  }
}

export function kePesanDaftar(d: unknown): HalamanPesan {
  const o = objek(d) ?? {}
  const p = objek(o.percakapan) ?? {}
  const baris = Array.isArray(o.pesan) ? o.pesan : []
  return {
    percakapan: { id: teks(p.id), judul: teks(p.judul), jumlahPesan: cacah(p.jumlah_pesan), dibuatIso: teks(p.dibuat), diperbaruiIso: teks(p.diperbarui) },
    pesan: baris.map(objek).filter((b): b is Obj => !!b).flatMap((b) => {
      const x = kePesan(b)
      return x ? [x] : []
    }),
    kursorSebelum: angkaAtauNull(o.kursor_sebelum),
    adaLagi: o.ada_lagi === true,
    halamanPertama: o.halaman_pertama === true,
  }
}

function kePesan(b: Obj): PesanDomi | null {
  const id = angkaAtauNull(b.id)
  if (id === null) return null
  const dibuatIso = teks(b.dibuat)
  const isi = objek(b.isi) ?? {}
  if (b.peran === 'user') {
    const gambar = isi.gambar === true
    const mentah = teks(isi.teks).trim()
    const tampil = gambar && mentah === PESAN_GAMBAR_BAWAAN ? '' : mentah
    const daftar = (Array.isArray(isi.gambar_jalur_daftar) ? isi.gambar_jalur_daftar : []).slice(0, 5).map(jalurSah).filter((j): j is string => !!j)
    const tunggal = jalurSah(isi.gambar_jalur)
    const jalur = daftar.length ? daftar : tunggal ? [tunggal] : []
    return { peran: 'user', id, dibuatIso, teks: tampil, gambar, jalur, jumlahGambar: angkaAtauNull(isi.gambar_jumlah) }
  }
  if (b.peran !== 'asisten') return null
  const blok = Array.isArray(isi.blok) ? isi.blok.slice(0, BATAS_BLOK) : []
  const susunan = susunBlok(blok)
  const saran = blok.flatMap((x) => {
    const s = objek(x)
    if (s?.tipe !== 'saran' || !Array.isArray(s.pilihan)) return []
    return s.pilihan.filter((p): p is string => typeof p === 'string' && !!p.trim()).slice(0, 3)
  })
  return {
    peran: 'asisten', id, dibuatIso, susunan, saran,
    info: {
      kredit: angkaAtauNull(isi.kredit_dipakai),
      biaya: angkaAtauNull(b.biaya), tokenMasuk: angkaAtauNull(b.token_masuk), tokenKeluar: angkaAtauNull(b.token_keluar),
      model: teksAtauNull(b.model),
    },
    jalur: jalurBlok(blok),
  }
}

/** Jalur foto draf dalam urutan blok (draf.gambar_jalur, isi.gambar_jalur). */
function jalurBlok(blok: unknown[]): string[] {
  const hasil: string[] = []
  for (const x of blok) {
    const b = objek(x)
    const j = jalurSah(objek(b?.draf)?.gambar_jalur) ?? jalurSah(objek(b?.isi)?.gambar_jalur)
    if (j && !hasil.includes(j)) hasil.push(j)
  }
  return hasil
}

// ── Teks tersusun ────────────────────────────────────────────────────────
export interface PotonganTeks { teks: string; tebal: boolean }
export type BarisTeks = { jenis: 'paragraf' | 'judul' | 'poin'; potongan: PotonganTeks[] }

const POLA_TEBAL = /\*\*([^*\n]+)\*\*/g
/** `**tebal**`, sisa `**` yang tidak berpasangan dibuang. */
export function pecahTebal(s: string): PotonganTeks[] {
  const hasil: PotonganTeks[] = []
  let akhir = 0
  for (const m of s.matchAll(POLA_TEBAL)) {
    const mulai = m.index ?? 0
    if (mulai > akhir) hasil.push({ teks: s.slice(akhir, mulai).replace(/\*\*/g, ''), tebal: false })
    hasil.push({ teks: m[1]!, tebal: true })
    akhir = mulai + m[0].length
  }
  if (akhir < s.length) hasil.push({ teks: s.slice(akhir).replace(/\*\*/g, ''), tebal: false })
  const bersih = hasil.filter(p => p.teks.length > 0)
  return bersih.length ? bersih : [{ teks: s.replace(/\*\*/g, ''), tebal: false }]
}

const ribuan = (n: string): string => n.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
export function rapikanUangTeks(s: string): string {
  return s
    .replace(/\b(\d{4,})\s+rupiah\b/gi, (_m, n: string) => `Rp ${ribuan(n)}`)
    .replace(/\bRp\.?\s*(\d{4,})\b/gi, (_m, n: string) => `Rp ${ribuan(n)}`)
    .replace(/\b(\d{4,})\b(?=\s*(?:ribu|juta|rb)\b)/gi, (n: string) => ribuan(n))
}

/** Baris berawalan tanda hubung jadi poin, baris seluruhnya **tebal** jadi judul. */
export function barisTeks(s: string): BarisTeks[] {
  const hasil: BarisTeks[] = []
  for (const mentah of rapikanUangTeks(s).split(/\r?\n/)) {
    const b = mentah.trim()
    if (!b) continue
    const poin = /^[-•]\s+(.+)$/.exec(b)
    if (poin) { hasil.push({ jenis: 'poin', potongan: pecahTebal(poin[1]!) }); continue }
    const judul = /^\*\*([^*]+?)\*\*:?$/.exec(b)
    if (judul) { hasil.push({ jenis: 'judul', potongan: [{ teks: judul[1]!, tebal: true }] }); continue }
    hasil.push({ jenis: 'paragraf', potongan: pecahTebal(b) })
  }
  return hasil
}

// ── Uang dan tabel ───────────────────────────────────────────────────────
export function kolomUang(judul: string): boolean {
  const k = (judul ?? '').toLowerCase()
  return ['nominal', 'jumlah', 'total', 'harga', 'saldo', 'biaya', 'sisa', 'anggaran', 'terpakai', 'pemasukan', 'pengeluaran', 'diterima', 'dibayar'].some(x => k.includes(x))
}
export function angkaDariSel(sel: string): number | null {
  let s = (sel ?? '').trim().toLowerCase()
  if (!s) return null
  let kali = 1
  if (/\bjuta\b/.test(s)) kali = 1_000_000
  else if (/\b(ribu|rb)\b/.test(s)) kali = 1_000
  s = s.replace(/\brp\.?/g, '').replace(/\b(juta|ribu|rb)\b/g, '').replace(/\s+/g, '').replace(/\./g, '').replace(/,/g, '.')
  if (!/^-?\d+(?:\.\d+)?$/.test(s)) return null
  const n = Number(s)
  return Number.isFinite(n) ? n * kali : null
}

/** Satuan angka di gelembung. Rupiah digambar di kertas, bukan di sini. */
export function nilaiSatuan(nilai: number, satuan: string, kali: string): string {
  if (satuan === 'persen') return `${Math.round(nilai * 10) / 10}%`
  if (satuan === 'kali') return `${Math.round(nilai * 10) / 10} ${kali}`
  if (satuan === 'rupiah') return rupiah(nilai)
  return angka(nilai)
}
/** Minus rupiah di kertas memakai tanda minus sungguhan, bukan tanda hubung. */
export const rpKertas = (n: number): string => rupiah(n).replace(/^-/, '−')

// ── Susunan gelembung ────────────────────────────────────────────────────
export interface BlokAksiTampil { label: string; tautan: string }
export interface AngkaTampil { label: string; nilai: number; satuan: string; utama: boolean }
export interface SpekGrafik { jenis: 'batang' | 'garis'; judul: string; satuan: string; data: { label: string; nilai: number }[] }

export type SusunanDomi =
  | { jenis: 'teks'; kunci: string; pertama: boolean; teks: string[]; aksi: BlokAksiTampil[] }
  | { jenis: 'angka'; kunci: string; pertama: boolean; blok: AngkaTampil }
  | { jenis: 'kertas'; kunci: string; utama: AngkaTampil | null; baris: AngkaTampil[] }
  | { jenis: 'grafik'; kunci: string; pertama: boolean; spek: SpekGrafik }
  | { jenis: 'tabel'; kunci: string; pertama: boolean; kolom: string[]; baris: string[][] }
  | { jenis: 'transaksi'; kunci: string; draf: Obj }
  | { jenis: 'draf'; kunci: string; aksi: string; ruang: string; isi: Obj; lipatAwal: boolean }
  | { jenis: 'asing'; kunci: string; label: string; pertama: boolean }

const AKSI_DRAF = new Set(['transfer', 'ubah_transaksi', 'hapus_transaksi', 'buat_jadwal', 'bayar_jadwal', 'lewati_jadwal',
  'arsip_jadwal', 'target_anggaran', 'tambah_dompet', 'tambah_kategori', 'struk', 'rencana', 'setoran_rencana', 'bayar_pos', 'ubah_rencana', 'pos_rencana'])

function bacaSpek(o: Obj): SpekGrafik | null {
  const s = objek(o.spec)
  if (!s || !Array.isArray(s.data)) return null
  const data = s.data.flatMap((x) => {
    const t = objek(x)
    const nilai = angkaAtauNull(t?.nilai)
    const label = teks(t?.label)
    return label && nilai !== null ? [{ label, nilai }] : []
  }).slice(0, 12)
  if (!data.length) return null
  // Sama dengan GrafikAi di aplikasi: selain batang digambar garis.
  return { jenis: s.jenis === 'batang' ? 'batang' : 'garis', judul: teks(s.judul), satuan: teks(s.satuan) || 'angka', data }
}

function bacaAngka(o: Obj): AngkaTampil | null {
  const label = teks(o.label)
  const nilai = angkaAtauNull(o.nilai)
  if (!label || nilai === null) return null
  const satuan = teks(o.satuan) || 'angka'
  return { label, nilai, satuan, utama: o.utama === true && satuan === 'rupiah' }
}

function bacaTabel(o: Obj): { kolom: string[]; baris: string[][] } | null {
  if (!Array.isArray(o.kolom) || !Array.isArray(o.baris)) return null
  const kolom = o.kolom.map(teks).filter(Boolean).slice(0, 8)
  if (!kolom.length) return null
  const baris = o.baris.filter(Array.isArray).slice(0, 10).map(r => kolom.map((_, i) => teks((r as unknown[])[i])))
  return baris.length ? { kolom, baris } : null
}

const labelAsing = (o: Obj | null): string => {
  const tipe = teks(o?.tipe) || 'tanpa-tipe'
  return tipe === 'draf' ? `draf:${teks(o?.aksi) || '?'}` : tipe
}

/** Blok jawaban → susunan. Teks berurutan satu gelembung, rupiah satu kertas, tautan menempel; yang tidak dikenal jadi kotak nama tipe. */
export function susunBlok(blok: unknown[]): SusunanDomi[] {
  const hasil: SusunanDomi[] = []
  let sudahUtama = false
  let strukKe = 0
  blok.forEach((b, i) => {
    const o = objek(b)
    const akhir = hasil[hasil.length - 1]
    const pertama = hasil.length === 0
    const asing = () => hasil.push({ jenis: 'asing', kunci: `asing-${i}`, label: labelAsing(o), pertama })
    switch (o?.tipe) {
      case 'saran':
        return
      case 'teks': {
        const t = teks(o.teks).trim()
        if (!t) return asing()
        if (akhir?.jenis === 'teks' && akhir.aksi.length === 0) akhir.teks.push(t)
        else hasil.push({ jenis: 'teks', kunci: `teks-${i}`, pertama, teks: [t], aksi: [] })
        return
      }
      case 'aksi': {
        const label = teks(o.label).trim()
        const tautan = teks(o.tautan).trim()
        if (!label) return asing()
        if (akhir?.jenis === 'teks') akhir.aksi.push({ label, tautan })
        else hasil.push({ jenis: 'teks', kunci: `teks-${i}`, pertama, teks: [], aksi: [{ label, tautan }] })
        return
      }
      case 'angka': {
        const a = bacaAngka(o)
        if (!a) return asing()
        if (a.satuan !== 'rupiah') { hasil.push({ jenis: 'angka', kunci: `angka-${i}`, pertama, blok: a }); return }
        const tandai = a.utama && !sudahUtama
        if (tandai) sudahUtama = true
        if (akhir?.jenis === 'kertas') {
          akhir.baris.push(a)
          if (tandai) akhir.utama = a
        } else hasil.push({ jenis: 'kertas', kunci: `kertas-${i}`, utama: tandai ? a : null, baris: [a] })
        return
      }
      case 'grafik': {
        const spek = bacaSpek(o)
        if (!spek) return asing()
        hasil.push({ jenis: 'grafik', kunci: `grafik-${i}`, pertama, spek })
        return
      }
      case 'tabel': {
        const t = bacaTabel(o)
        if (!t) return asing()
        hasil.push({ jenis: 'tabel', kunci: `tabel-${i}`, pertama, ...t })
        return
      }
      case 'transaksi': {
        const draf = objek(o.draf)
        if (!draf || angkaAtauNull(draf.nominal) === null) return asing()
        hasil.push({ jenis: 'transaksi', kunci: `transaksi-${i}`, draf })
        return
      }
      case 'draf': {
        const aksi = teks(o.aksi)
        const isi = objek(o.isi)
        if (!AKSI_DRAF.has(aksi) || !isi) return asing()
        const lipatAwal = aksi === 'struk' && strukKe > 0
        if (aksi === 'struk') strukKe += 1
        hasil.push({ jenis: 'draf', kunci: `draf-${i}`, aksi, ruang: teks(objek(o.ruang)?.nama), isi, lipatAwal })
        return
      }
      default:
        asing()
    }
  })
  for (const h of hasil) {
    if (h.jenis !== 'kertas') continue
    if (h.utama) h.baris = h.baris.filter(x => x !== h.utama)
    else if (h.baris.length === 1) { h.utama = h.baris[0]!; h.baris = [] }
  }
  return hasil
}

// ── Draf ─────────────────────────────────────────────────────────────────
/** Baris kartu draf: label + nilai, opsional nilai lama dicoret. */
export interface BarisDraf { label: string; nilai: string; lama?: string | null }
export interface KertasStruk {
  jenis: 'struk'
  toko: string; rincian: string
  barang: { nama: string; nilai: string; bawah?: string; bawahHijau?: boolean }[]
  ringkasan: { label: string; nilai: string; hijau?: boolean }[]
  total: string
  jalur: string | null
  kategori: string | null; catatan: string | null
  lipat: boolean
  /** Baris singkat kertas terlipat. */
  nominal: string
}
export interface KertasRencana { jenis: 'rencana'; nama: string; target: string; tenggat: string | null; pos: { nama: string; nilai: string }[] }
export interface KartuDraf {
  jenis: 'kartu'; ikon: string; warna: 'sky' | 'iris' | 'rose' | 'mint' | 'amber' | 'abu'
  judul: string; sub: string; tanggal: string | null
  nominal: string | null; nominalWarna?: 'mint' | null
  baris: BarisDraf[]
}
export type TampilDraf = KartuDraf | KertasStruk | KertasRencana
export type PenerjemahDraf = (kunci: string, ...arg: Array<string | number>) => string
export interface AlatDraf { tanggal: (iso: string) => string; t: PenerjemahDraf }

const uang = (v: unknown): number | null => {
  const n = angkaAtauNull(v)
  return n !== null && n >= 0 ? n : null
}
const pakaiNama = (o: Obj, k: string): string => teks(o[k])

/** Isi draf → bentuk tampil. Bentuk yang rusak jatuh ke null (panel memakai kotak nama tipe). */
export function rancangDraf(s: Extract<SusunanDomi, { jenis: 'draf' }>, a: AlatDraf): TampilDraf | null {
  const isi = s.isi
  const { t, tanggal } = a
  const masuk = isi.jenis === 'income'
  const nominalTanda = (n: number) => `${masuk ? '+' : '−'}${rupiah(n)}`
  const kategoriLabel = (v: unknown) => teks(v) || t('draf.tanpaKategori')
  const bersyarat = (b: BarisDraf | false | null): BarisDraf[] => (b ? [b] : [])
  switch (s.aksi) {
    case 'transfer': {
      const nominal = uang(isi.nominal)
      if (nominal === null) return null
      return {
        jenis: 'kartu', ikon: 'lucide:arrow-left-right', warna: 'sky', judul: t('draf.transfer'),
        sub: `${pakaiNama(isi, 'dari_nama')} → ${pakaiNama(isi, 'ke_nama')}`, tanggal: teksAtauNull(isi.tanggal),
        nominal: rupiah(nominal),
        baris: [
          { label: t('draf.dari'), nilai: pakaiNama(isi, 'dari_nama') },
          { label: t('draf.ke'), nilai: pakaiNama(isi, 'ke_nama') },
          { label: t('draf.tanggal'), nilai: tanggal(teks(isi.tanggal)) },
          ...bersyarat(!!teks(isi.catatan) && { label: t('draf.catatan'), nilai: teks(isi.catatan) }),
        ],
      }
    }
    case 'ubah_transaksi': {
      const se = objek(isi.sesudah)
      const so = objek(isi.sebelum)
      if (!se || !so) return null
      const nominal = uang(se.nominal)
      const lama = uang(so.nominal)
      if (nominal === null || lama === null) return null
      const masukUbah = se.jenis === 'income'
      const beda = (k: string) => teks(se[k]) !== teks(so[k])
      return {
        jenis: 'kartu', ikon: 'lucide:pencil', warna: 'iris', judul: t('draf.ubah'),
        sub: masukUbah ? t('draf.masuk') : t('draf.keluar'), tanggal: teksAtauNull(se.tanggal),
        nominal: `${masukUbah ? '+' : '−'}${rupiah(nominal)}`, nominalWarna: masukUbah ? 'mint' : null,
        baris: [
          { label: t('draf.nominal'), nilai: rupiah(nominal), lama: Math.abs(nominal - lama) >= 0.005 ? rupiah(lama) : null },
          { label: t('draf.kategori'), nilai: kategoriLabel(se.kategori), lama: beda('kategori') ? kategoriLabel(so.kategori) : null },
          { label: t('draf.dompet'), nilai: pakaiNama(se, 'dompet'), lama: beda('dompet') ? pakaiNama(so, 'dompet') : null },
          { label: t('draf.tanggal'), nilai: tanggal(teks(se.tanggal)), lama: beda('tanggal') ? tanggal(teks(so.tanggal)) : null },
          { label: t('draf.catatan'), nilai: teks(se.catatan) || '-', lama: beda('catatan') ? teks(so.catatan) || '-' : null },
        ],
      }
    }
    case 'hapus_transaksi': {
      const nominal = uang(isi.nominal)
      if (nominal === null) return null
      const transfer = objek(isi.transfer)
      return {
        jenis: 'kartu', ikon: 'lucide:trash-2', warna: 'rose', judul: t('draf.hapus'),
        sub: transfer ? `${teks(transfer.dari)} → ${teks(transfer.ke)}` : (masuk ? t('draf.masuk') : t('draf.keluar')),
        tanggal: teksAtauNull(isi.tanggal), nominal: transfer ? rupiah(nominal) : nominalTanda(nominal),
        baris: [
          ...bersyarat(!transfer && { label: t('draf.kategori'), nilai: kategoriLabel(isi.kategori) }),
          ...bersyarat(!transfer && { label: t('draf.dompet'), nilai: pakaiNama(isi, 'dompet') }),
          { label: t('draf.tanggal'), nilai: tanggal(teks(isi.tanggal)) },
          ...bersyarat(!!teks(isi.catatan) && { label: t('draf.catatan'), nilai: teks(isi.catatan) }),
        ],
      }
    }
    case 'buat_jadwal': {
      const nominal = uang(isi.nominal)
      if (nominal === null) return null
      const jumlah = angkaAtauNull(isi.jumlah)
      const sifat = isi.sifat === 'ulang' ? t('draf.berulang') : (jumlah ?? 0) > 1 ? t('draf.cicilanN', jumlah ?? 0) : t('draf.sekaliSaja')
      const irama = teks(isi.irama)
      return {
        jenis: 'kartu', ikon: masuk ? 'lucide:trending-up' : 'lucide:calendar-clock', warna: masuk ? 'mint' : 'iris', judul: t('draf.jadwal'),
        sub: teks(isi.nama), tanggal: null, nominal: rupiah(nominal), nominalWarna: masuk ? 'mint' : null,
        baris: [
          { label: t('draf.sifat'), nilai: sifat },
          ...bersyarat(jumlah !== 1 && !!irama && { label: t('draf.irama'), nilai: t(`draf.iramaNilai.${irama}`) }),
          { label: t('draf.tanggal'), nilai: tanggal(teks(isi.tanggal)) },
          { label: t('draf.dompet'), nilai: pakaiNama(isi, 'dompet') },
          { label: t('draf.kategori'), nilai: kategoriLabel(isi.kategori) },
          ...bersyarat(!!teks(isi.catatan) && { label: t('draf.catatan'), nilai: teks(isi.catatan) }),
        ],
      }
    }
    case 'bayar_jadwal': {
      const nominal = uang(isi.nominal)
      if (nominal === null) return null
      const biaya = uang(isi.biaya) ?? 0
      return {
        jenis: 'kartu', ikon: masuk ? 'lucide:trending-up' : 'lucide:trending-down', warna: masuk ? 'mint' : 'rose',
        judul: masuk ? t('draf.terima') : t('draf.bayar'), sub: teks(isi.judul), tanggal: teksAtauNull(isi.tanggal),
        nominal: nominalTanda(nominal), nominalWarna: masuk ? 'mint' : null,
        baris: [
          { label: t('draf.periode'), nilai: isi.mode === 'lunasi' ? t('draf.lunasiSisa') : tanggal(teks(isi.tempo)) },
          { label: t('draf.dompet'), nilai: pakaiNama(isi, 'dompet') },
          { label: t('draf.tanggal'), nilai: tanggal(teks(isi.tanggal)) },
          ...bersyarat(biaya > 0 && { label: t('draf.biaya'), nilai: rupiah(biaya) }),
        ],
      }
    }
    case 'lewati_jadwal':
      return {
        jenis: 'kartu', ikon: 'lucide:skip-forward', warna: 'amber', judul: t('draf.lewati'), sub: teks(isi.judul), tanggal: null, nominal: null,
        baris: [
          { label: t('draf.periode'), nilai: tanggal(teks(isi.tempo)) },
          { label: t('draf.alasan'), nilai: t(`draf.sebab.${teks(isi.sebab) || 'lain'}`) },
        ],
      }
    case 'arsip_jadwal':
      return { jenis: 'kartu', ikon: 'lucide:archive', warna: 'abu', judul: t('draf.arsip'), sub: teks(isi.judul), tanggal: null, nominal: null, baris: [] }
    case 'target_anggaran': {
      const nominal = uang(isi.nominal)
      if (nominal === null) return null
      const sebelum = uang(objek(isi.sebelum)?.nominal) ?? 0
      const bulan = tanggal(`${teks(isi.bulan)}-01`).replace(/^\d+\s+/, '')
      return {
        jenis: 'kartu', ikon: 'lucide:target', warna: 'iris', judul: t('draf.target'), sub: teks(isi.kategori) || t('draf.seluruhPengeluaran'), tanggal: null,
        nominal: rupiah(nominal),
        baris: [
          { label: t('draf.bulan'), nilai: bulan },
          { label: t('draf.berlaku'), nilai: isi.berulang ? t('draf.tiapBulan', bulan) : t('draf.hanyaBulan', bulan) },
          { label: t('draf.nominal'), nilai: rupiah(nominal), lama: sebelum > 0 ? rupiah(sebelum) : t('draf.tanpaTarget') },
        ],
      }
    }
    case 'tambah_dompet': {
      const saldo = uang(isi.saldo_awal) ?? 0
      const batas = uang(isi.batas_minus)
      return {
        jenis: 'kartu', ikon: 'lucide:wallet', warna: 'sky', judul: t('draf.dompetBaru'), sub: teks(isi.nama), tanggal: null, nominal: rupiah(saldo),
        baris: [
          { label: t('draf.sifat'), nilai: t(`draf.jenisDompet.${teks(isi.jenis) || 'cash'}`) },
          { label: t('draf.saldoAwal'), nilai: rupiah(saldo) },
          ...bersyarat(batas !== null && { label: t('draf.batasMinus'), nilai: rupiah(batas) }),
        ],
      }
    }
    case 'tambah_kategori':
      return {
        jenis: 'kartu', ikon: 'lucide:tag', warna: masuk ? 'mint' : 'rose', judul: t('draf.kategoriBaru'), sub: teks(isi.nama), tanggal: null, nominal: null,
        baris: [{ label: t('draf.sifat'), nilai: masuk ? t('draf.masuk') : t('draf.keluar') }],
      }
    case 'struk': return rancangStruk(s, a)
    case 'rencana': return rancangRencana(isi, a)
    case 'ubah_rencana': {
      const se = objek(isi.sesudah)
      const so = objek(isi.sebelum)
      if (!se || !so) return null
      const targetBaru = uang(se.target_nominal)
      if (targetBaru === null) return null
      const targetLama = uang(so.target_nominal)
      const perBaru = uang(isi.per_bulan_sesudah)
      const perLama = uang(isi.per_bulan_sebelum)
      const tgl = (v: unknown) => (teks(v) ? tanggal(teks(v)) : t('draf.tanpaTenggat'))
      return {
        jenis: 'kartu', ikon: 'lucide:calendar-clock', warna: 'iris', judul: t('draf.ubahRencana'), sub: teks(isi.nama), tanggal: null,
        nominal: rupiah(perBaru ?? targetBaru),
        baris: [
          { label: t('draf.tenggat'), nilai: tgl(se.tenggat), lama: teks(se.tenggat) !== teks(so.tenggat) ? tgl(so.tenggat) : null },
          { label: t('draf.targetNominal'), nilai: rupiah(targetBaru), lama: targetLama !== null && Math.abs(targetBaru - targetLama) >= 0.005 ? rupiah(targetLama) : null },
          ...bersyarat(perBaru !== null && { label: t('draf.perBulan'), nilai: rupiah(perBaru), lama: perLama !== null ? rupiah(perLama) : null }),
        ],
      }
    }
    case 'pos_rencana': {
      const pos = (Array.isArray(isi.pos) ? isi.pos : []).map(objek).filter((x): x is Obj => !!x)
      if (!pos.length) return null
      return {
        jenis: 'kartu', ikon: 'lucide:list-checks', warna: 'iris', judul: t('draf.posRencana'), sub: teks(isi.nama), tanggal: null,
        baris: pos.map((p) => {
          const n = uang(p.nominal)
          return { label: teks(p.nama), nilai: n !== null ? rupiah(n) : t('draf.tanpaNominal') }
        }),
      }
    }
    case 'setoran_rencana': {
      const nominal = uang(isi.nominal)
      if (nominal === null) return null
      const sebelum = uang(isi.terkumpul_sebelum) ?? 0
      const target = uang(isi.target_nominal)
      return {
        jenis: 'kartu', ikon: 'lucide:target', warna: 'iris', judul: t('draf.setoran'), sub: teks(isi.nama), tanggal: null,
        nominal: rupiah(nominal),
        baris: [
          { label: t('draf.rencanaNama'), nilai: teks(isi.nama) },
          { label: t('draf.terkumpul'), nilai: rupiah(sebelum + nominal), lama: rupiah(sebelum) },
          ...bersyarat(target !== null && { label: t('draf.targetNominal'), nilai: rupiah(target) }),
        ],
      }
    }
    case 'bayar_pos': {
      const nominal = uang(isi.nominal)
      if (nominal === null) return null
      const nominalPos = uang(isi.nominal_pos)
      const dompet = teks(isi.dompet_nama)
      return {
        jenis: 'kartu', ikon: 'lucide:trending-down', warna: 'rose', judul: t('draf.bayarPos'), sub: teks(isi.pos_nama),
        tanggal: dompet ? teksAtauNull(isi.tanggal) : null, nominal: `−${rupiah(nominal)}`,
        baris: [
          { label: t('draf.rencanaNama'), nilai: teks(isi.rencana_nama) },
          { label: t('draf.pos'), nilai: teks(isi.pos_nama) },
          ...bersyarat(nominalPos !== null && { label: t('draf.nominalPos'), nilai: rupiah(nominalPos) }),
          { label: t('draf.terbayarSebelum'), nilai: rupiah(uang(isi.terbayar_sebelum) ?? 0) },
          ...bersyarat(!!dompet && { label: t('draf.dompet'), nilai: dompet }),
        ],
      }
    }
    default: return null
  }
}

function rancangStruk(s: Extract<SusunanDomi, { jenis: 'draf' }>, a: AlatDraf): KertasStruk | null {
  const isi = s.isi
  const { t, tanggal } = a
  const total = uang(isi.total)
  if (total === null) return null
  const item = (Array.isArray(isi.item) ? isi.item : []).map(objek).filter((x): x is Obj => !!x)
  const barang = item.filter(x => x.tambahan !== true).map((x) => {
    const jumlah = uang(x.jumlah) ?? 0
    const qty = angkaAtauNull(x.qty)
    const harga = uang(x.harga)
    const potongan = uang(x.potongan)
    const bawah = [
      qty !== null && harga !== null && (qty !== 1 || potongan) ? t('draf.strukBaris', String(qty), rupiah(harga)) : null,
      potongan ? t('draf.strukPotongan', rupiah(potongan)) : null,
    ].filter(Boolean).join(', ')
    return { nama: teks(x.nama), nilai: rupiah(jumlah), bawah: bawah || undefined, bawahHijau: !!potongan }
  })
  const subtotal = uang(isi.subtotal) ?? total
  const pajak = uang(isi.pajak) ?? 0
  const layanan = uang(isi.layanan) ?? 0
  const diskon = uang(isi.diskon) ?? 0
  const ringkasan: KertasStruk['ringkasan'] = [
    ...(pajak > 0 || layanan > 0 || diskon > 0 ? [{ label: t('draf.strukSubtotal'), nilai: rupiah(subtotal) }] : []),
    ...(pajak > 0 ? [{ label: t('draf.strukPajak'), nilai: rupiah(pajak) }] : []),
    ...(layanan > 0 ? [{ label: t('draf.strukLayanan'), nilai: rupiah(layanan) }] : []),
    ...(diskon > 0 ? [{ label: t('draf.strukDiskon'), nilai: `−${rupiah(diskon)}`, hijau: true }] : []),
  ]
  const kategori = [...new Set(item.filter(x => x.tambahan !== true).map(x => teks(x.kategori) || t('draf.tanpaKategori')))].join(', ')
  return {
    jenis: 'struk', toko: teks(isi.toko),
    rincian: [tanggal(teks(isi.tanggal)), teks(isi.dompet_nama)].filter(Boolean).join(', '),
    barang, ringkasan, total: rupiah(total), jalur: jalurSah(isi.gambar_jalur),
    kategori: kategori || null, catatan: teks(isi.catatan) || null, lipat: s.lipatAwal, nominal: `−${rupiah(total)}`,
  }
}

function rancangRencana(isi: Obj, a: AlatDraf): KertasRencana | null {
  const target = uang(isi.target) ?? uang(isi.target_nominal)
  const pos = (Array.isArray(isi.pos) ? isi.pos : []).map(objek).filter((x): x is Obj => !!x)
    .map(x => ({ nama: teks(x.nama), nominal: uang(x.nominal) })).filter(x => x.nama)
  if (!pos.length && target === null) return null
  const totalPos = pos.reduce((n, p) => n + (p.nominal ?? 0), 0)
  return {
    jenis: 'rencana', nama: teks(isi.nama) || a.t('draf.rencana'), target: rupiah(target ?? totalPos),
    tenggat: teksAtauNull(isi.tenggat) ? a.tanggal(teks(isi.tenggat)) : null,
    pos: pos.map(p => ({ nama: p.nama, nilai: p.nominal !== null ? rupiah(p.nominal) : '-' })),
  }
}

/** Kartu draf transaksi (blok `transaksi`): nama, kategori, nominal, foto. */
export function rancangTransaksi(draf: Obj, a: AlatDraf): { nama: string; anak: string; nominal: string; masuk: boolean; jalur: string | null } {
  const masuk = draf.jenis === 'income'
  const nama = teks(draf.catatan) || (masuk ? a.t('draf.masuk') : a.t('draf.keluar'))
  const tgl = teks(draf.tanggal)
  return {
    nama, masuk,
    anak: [teks(draf.kategori) || a.t('draf.tanpaKategori'), tgl ? a.tanggal(tgl) : ''].filter(Boolean).join(', '),
    nominal: `${masuk ? '+' : '−'}${rupiah(angkaAtauNull(draf.nominal) ?? 0)}`,
    jalur: jalurSah(draf.gambar_jalur),
  }
}

// ── Info admin ───────────────────────────────────────────────────────────
/** Baris kecil pemakaian di bawah jawaban: "Kredit 3 · Rp 79 · 1.500 token · gpt-x". Null bila tidak ada apa pun. */
export function ringkasInfo(info: InfoJawaban, label: { kredit: (n: number) => string; token: (n: string) => string }): string | null {
  const bagian: string[] = []
  if (info.kredit !== null && info.kredit > 0) bagian.push(label.kredit(Math.round(info.kredit)))
  if (info.biaya !== null && info.biaya > 0) bagian.push(rupiah(Math.max(1, Math.round(info.biaya))))
  const token = (info.tokenMasuk ?? 0) + (info.tokenKeluar ?? 0)
  if (token > 0) bagian.push(label.token(angka(token)))
  if (info.model) bagian.push(info.model)
  return bagian.length ? bagian.join(' · ') : null
}

/** id pesan yang punya foto di halaman ini, dipecah per MAKS_PESAN_GAMBAR. */
export function petaPesanBerfoto(pesan: readonly PesanDomi[]): number[][] {
  const berfoto = pesan.filter(p => p.jalur.length > 0).map(p => p.id)
  const hasil: number[][] = []
  for (let i = 0; i < berfoto.length; i += MAKS_PESAN_GAMBAR) hasil.push(berfoto.slice(i, i + MAKS_PESAN_GAMBAR))
  return hasil
}
