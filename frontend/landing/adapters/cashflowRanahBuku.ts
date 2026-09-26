/**
 * Ranah buku ruang (Fase 3, migrasi 0095) — Katalog, Jadwal, Usaha, Struk,
 * dan Patungan. DTO = persis kunci jsonb yang dibangun server; kontraknya
 * diuji terhadap migrasi (tests/cashflow/kontrak-fase3.test.ts). Perangkat
 * dan Kabar (milik ORANG, bukan ruang) ada di cashflowPerangkat.ts.
 *
 * Teks bebas tidak pernah ada di sini: note, merchant, catatan, judul/isi
 * sampah, receipt_path, kontak (id/nama/telepon) tidak dikirim server. Yang
 * ada hanya penanda `ada_*`. Kode tertutup (reason, sebab, arah, cadence,
 * ocr_status, kind) datang lewat daftar putih server: nilai asing menjadi
 * 'lain' + `kode_tak_dikenal`, dan UI menulisnya "Kode tidak dikenal".
 *
 * Kolom tulisan klien (icon, color) hanya dipakai bila lolos penyaring
 * (server dan sekali lagi di sini): warna yang tidak sah = null → netral,
 * tidak pernah masuk atribut style mentah.
 *
 * `kontak_sidik` (struk) hanya untuk mengelompokkan tampilan di dalam SATU
 * kasus: tidak disimpan ke storage/URL/ekspor, dan kasbon TIDAK dijumlahkan
 * per sidik (spek §3 R6, K-F3-5).
 *
 * adapters/ tidak di-auto-import Nuxt — selalu impor eksplisit.
 */
import { POLA_UUID, keArahUang, type ArahUang } from './cashflow'
import {
  bacaObjekKursor, isoSah, jenisUang, kursorTransaksiDariUrl,
  type JejakJadwalDTO, type JenisUang, type KursorTransaksi,
} from './cashflowBuku'

// ── Angka & kode ─────────────────────────────────────────────────────────
type Num = number | string
const angkaAtauNull = (v: Num | null | undefined): number | null => {
  if (v == null || v === '') return null
  const x = Number(v)
  return Number.isFinite(x) ? x : null
}
const angka0 = (v: Num | null | undefined): number => angkaAtauNull(v) ?? 0

/** Nilai kode dari daftar putih server → nilai itu; selain itu 'lain'. null tetap null. */
export function kodeDari<T extends string>(v: string | null | undefined, daftar: readonly T[]): T | 'lain' | null {
  if (v == null) return null
  return (daftar as readonly string[]).includes(v) ? (v as T) : 'lain'
}

/** Kode server → kunci kamus i18n (tcf memecah jalur di '.'; 'tx.hapus' → 'tx_hapus', 'hari-ini' → 'hari_ini'). */
export const kunciKode = (v: string): string => v.replace(/[.-]/g, '_')

/** Penyaring warna klien (spek §2.7): hanya #rgb…#rrggbbaa; selain itu null (netral). */
export const POLA_WARNA = /^#[0-9A-Fa-f]{3,8}$/
export const warnaAman = (v: string | null | undefined): string | null => (typeof v === 'string' && POLA_WARNA.test(v) ? v : null)
/** Penyaring ikon klien (spek §2.7). */
export const POLA_IKON = /^[a-z0-9-]{1,40}$/
export const ikonAman = (v: string | null | undefined): string | null => (typeof v === 'string' && POLA_IKON.test(v) ? v : null)

// ── Kosakata (daftar putih 0095 §2.7) ────────────────────────────────────
export const ALASAN_LEWATI = ['tutup', 'belum_ada_uang', 'bayar_di_luar', 'lain'] as const
export type AlasanLewati = typeof ALASAN_LEWATI[number]
export const ALASAN_STOK = ['awal', 'susut', 'opname', 'pakai'] as const
export type AlasanStok = typeof ALASAN_STOK[number]
export const SEBAB_RINCI_STOK = ['rusak', 'kedaluwarsa', 'hilang', 'tumpah', 'lain', 'rumah', 'contoh', 'hadiah', 'lupa_belanja', 'salah_catat', 'tidak_tahu'] as const
export type SebabRinciStok = typeof SEBAB_RINCI_STOK[number]
export const ARAH_PENYESUAIAN = ['tambah', 'kurang'] as const
export type ArahPenyesuaian = typeof ARAH_PENYESUAIAN[number]
export const SEBAB_PENYESUAIAN = ['denda', 'admin', 'potongan', 'pembulatan', 'lain'] as const
export type SebabPenyesuaian = typeof SEBAB_PENYESUAIAN[number]
export const IRAMA_JADWAL = ['week', 'month', 'year'] as const
export type IramaJadwal = typeof IRAMA_JADWAL[number]
export const KEADAAN_JADWAL = ['arsip', 'selesai', 'terlambat', 'hari-ini', 'akan-datang'] as const
export type KeadaanJadwal = typeof KEADAAN_JADWAL[number]
/** p_ocr admin_struk_ruang; 'tanpa' = ocr_status null. */
export const OCR_STRUK = ['pending', 'done', 'failed', 'tanpa'] as const
export type OcrStruk = typeof OCR_STRUK[number]
export const JENIS_RIWAYAT_PATUNGAN = ['bagi', 'lunas'] as const
export type JenisRiwayatPatungan = typeof JENIS_RIWAYAT_PATUNGAN[number]

// ── R1 admin_katalog_ruang (ranah katalog) ───────────────────────────────
export interface KategoriKatalogDTO {
  id: string; name: string; kind: string | null; icon: string | null; color: string | null
  tampilan_tak_sah: boolean; kode_tak_dikenal: boolean; archived: boolean; created_at: string; user_id: string | null
  jumlah_transaksi: number; terakhir_dipakai: string | null
}
/** admin_anggaran_bangun: target yang sudah diselesaikan untuk bulan itu (resolveFrom). */
export interface AnggaranDTO {
  lingkup: 'kategori' | 'keseluruhan'; category_id: string; target: Num; berulang: boolean
  sumber_id: string | null; tepat_id: string | null; berulang_id: string | null
  terpakai: Num; rasio: Num | null; kategori_kind: string | null; kategori_archived: boolean | null
  tampil_di_aplikasi: boolean | null
}
export interface BarisAnggaranDTO { id: string; category_id: string; month: string; amount: Num; created_at: string; user_id: string | null }
export interface KatalogDTO {
  kasus: string; workspace_id: string; bulan: string
  kategori: KategoriKatalogDTO[]; anggaran: AnggaranDTO[]; baris_anggaran: BarisAnggaranDTO[]
  terpotong: { kategori: boolean; baris_anggaran: boolean }
}
/** category_id lingkup keseluruhan (0 uuid) di budgets. */
export const KATEGORI_KESELURUHAN = '00000000-0000-0000-0000-000000000000'
/** p_bulan: 'YYYY-MM' (server menolak bentuk lain dengan 22023 bulan). */
export const POLA_BULAN = /^[0-9]{4}-(0[1-9]|1[0-2])$/

export interface KategoriKatalog {
  id: string; nama: string; arah: ArahUang | null; ikon: string | null; warna: string | null
  tampilanTakSah: boolean; kodeTakDikenal: boolean; arsip: boolean; dibuatIso: string; pembuat: string | null
  transaksi: number; terakhirDipakai: string | null
}
export interface Anggaran {
  keseluruhan: boolean; kategoriId: string | null; target: number; berulang: boolean
  sumberId: string | null; tepatId: string | null; berulangId: string | null
  terpakai: number; rasio: number | null; kategoriArah: ArahUang | null; kategoriArsip: boolean | null
  tampilDiAplikasi: boolean | null
}
export interface BarisAnggaran { id: string; kategoriId: string | null; bulan: string; berulang: boolean; nominal: number; dibuatIso: string; pembuat: string | null }
export interface Katalog {
  kasus: string; ruangId: string; bulan: string
  kategori: KategoriKatalog[]; anggaran: Anggaran[]; barisAnggaran: BarisAnggaran[]
  terpotong: { kategori: boolean; barisAnggaran: boolean }
}
export function keKatalog(d: KatalogDTO): Katalog {
  return {
    kasus: d.kasus,
    ruangId: d.workspace_id,
    bulan: d.bulan,
    kategori: (d.kategori ?? []).map(c => ({
      id: c.id,
      nama: c.name?.trim() || '—',
      arah: keArahUang(c.kind),
      ikon: ikonAman(c.icon),
      warna: warnaAman(c.color),
      tampilanTakSah: c.tampilan_tak_sah === true,
      kodeTakDikenal: c.kode_tak_dikenal === true,
      arsip: c.archived === true,
      dibuatIso: c.created_at,
      pembuat: c.user_id ?? null,
      transaksi: angka0(c.jumlah_transaksi),
      terakhirDipakai: c.terakhir_dipakai ?? null,
    })),
    anggaran: (d.anggaran ?? []).map(a => ({
      keseluruhan: a.lingkup === 'keseluruhan',
      kategoriId: a.lingkup === 'keseluruhan' ? null : a.category_id,
      target: angka0(a.target),
      berulang: a.berulang === true,
      sumberId: a.sumber_id ?? null,
      tepatId: a.tepat_id ?? null,
      berulangId: a.berulang_id ?? null,
      terpakai: angka0(a.terpakai),
      // null = tanpa target (bukan "0% terpakai").
      rasio: angkaAtauNull(a.rasio),
      kategoriArah: keArahUang(a.kategori_kind),
      kategoriArsip: a.kategori_archived ?? null,
      tampilDiAplikasi: a.tampil_di_aplikasi ?? null,
    })),
    barisAnggaran: (d.baris_anggaran ?? []).map(b => ({
      id: b.id,
      kategoriId: b.category_id === KATEGORI_KESELURUHAN ? null : b.category_id,
      bulan: b.month.startsWith('R:') ? b.month.slice(2) : b.month,
      berulang: b.month.startsWith('R:'),
      nominal: angka0(b.amount),
      dibuatIso: b.created_at,
      pembuat: b.user_id ?? null,
    })),
    terpotong: { kategori: d.terpotong?.kategori === true, barisAnggaran: d.terpotong?.baris_anggaran === true },
  }
}

// ── R2 admin_jadwal_ruang / R3 admin_jadwal_rinci (ranah jadwal) ─────────
/** Satu baris admin_jadwal_baris_inti — TANPA note. */
export interface JadwalBarisDTO {
  id: string; user_id: string | null; wallet_id: string | null; dompet_nama: string | null
  category_id: string | null; kategori_nama: string | null; title: string | null; kind: string | null; amount: Num
  cadence: string | null; anchor_day: number | null; anchor_month: number | null; start_on: string | null
  next_due: string | null; total_count: number | null; paid_count: number; skipped_count: number
  partial_paid: Num; dibayar_tercatat: Num; dibayar_awal: Num; progress_reset_at: string | null
  archived: boolean; created_at: string; ada_catatan: boolean; jumlah_pembayaran: number; jumlah_dilewati: number
  jumlah_penyesuaian: number; pembayaran_di_sampah: number; tempo_sekarang: string | null; next_due_basi: boolean
  terlambat: boolean; selesai: boolean; keadaan: string; kode_tak_dikenal: boolean
}
export interface RingkasJadwalDTO { total: number; aktif: number; arsip: number; selesai: number; terlambat: number; cicilan: number; berulang: number }
export interface JadwalRuangDTO { kasus: string; workspace_id: string; ringkas: RingkasJadwalDTO; baris: JadwalBarisDTO[]; terpotong: boolean }

export interface LewatiDTO { id: string; period_no: number; due_on: string | null; reason: string | null; kode_tak_dikenal: boolean; created_at: string; user_id: string | null }
export interface PenyesuaianDTO {
  id: string; tx_id: string | null; arah: string | null; nominal: Num; sebab: string | null; kode_tak_dikenal: boolean
  periode_ke: number | null; created_at: string; user_id: string | null
}
/** Pembayaran cicilan bila kasus memegang ranah transaksi (rinci). */
export interface PembayaranRinciDTO {
  id: string; occurred_at: string; created_at: string; amount: Num; kind: string | null
  installment_no: number | null; schedule_periods: number | null; pencatat: string | null
  ada_catatan: boolean; jejak_jadwal: JejakJadwalDTO | null
}
/** Tanpa ranah transaksi: hanya no, tanggal, nominal (K-F3-12). */
export interface PembayaranRingkasDTO { installment_no: number | null; occurred_at: string; amount: Num }
/** Sampah cicilan (hanya bila kasus memegang ranah jejak). */
export interface SampahJadwalDTO {
  id: string; tx_id: string; amount: Num | null; occurred_at: string | null; pencatat: string | null
  dihapus_oleh: string | null; dihapus_pada: string; dipulihkan_pada: string | null; status: string
}
export interface JadwalRinciDTO {
  kasus: string
  jadwal: JadwalBarisDTO
  lewati: LewatiDTO[]; lewati_lebih: boolean
  penyesuaian: PenyesuaianDTO[]; penyesuaian_lebih: boolean
  pembayaran: Array<PembayaranRinciDTO | PembayaranRingkasDTO>; pembayaran_lebih: boolean
  di_sampah: SampahJadwalDTO[]; di_sampah_lebih: boolean
  rinci: { pembayaran: boolean; di_sampah: boolean }
}

export interface JadwalBaris {
  id: string; pembuat: string | null; dompetId: string | null; dompet: string; kategoriId: string | null; kategori: string
  judul: string; arah: ArahUang | null; nominal: number; irama: IramaJadwal | 'lain' | null
  hariJangkar: number | null; bulanJangkar: number | null; mulai: string | null; nextDue: string | null
  totalKali: number | null; dibayarKali: number; dilewatiKali: number; sebagian: number
  dibayarTercatat: number; dibayarAwal: number; progressResetIso: string | null
  arsip: boolean; dibuatIso: string; adaCatatan: boolean
  pembayaran: number; dilewati: number; penyesuaian: number; pembayaranDiSampah: number
  tempoSekarang: string | null; nextDueBasi: boolean; terlambat: boolean; selesai: boolean
  keadaan: KeadaanJadwal | null; kodeTakDikenal: boolean
}
export interface JadwalRuang { kasus: string; ruangId: string; ringkas: RingkasJadwalDTO; baris: JadwalBaris[]; terpotong: boolean }

export function keJadwalBaris(d: JadwalBarisDTO): JadwalBaris {
  return {
    id: d.id,
    pembuat: d.user_id ?? null,
    dompetId: d.wallet_id ?? null,
    dompet: d.dompet_nama?.trim() || '—',
    kategoriId: d.category_id ?? null,
    kategori: d.kategori_nama?.trim() || '',
    judul: d.title?.trim() || '—',
    arah: keArahUang(d.kind),
    nominal: angka0(d.amount),
    irama: kodeDari(d.cadence, IRAMA_JADWAL),
    hariJangkar: d.anchor_day ?? null,
    bulanJangkar: d.anchor_month ?? null,
    mulai: d.start_on ?? null,
    nextDue: d.next_due ?? null,
    totalKali: d.total_count ?? null,
    dibayarKali: angka0(d.paid_count),
    dilewatiKali: angka0(d.skipped_count),
    sebagian: angka0(d.partial_paid),
    dibayarTercatat: angka0(d.dibayar_tercatat),
    dibayarAwal: angka0(d.dibayar_awal),
    progressResetIso: d.progress_reset_at ?? null,
    arsip: d.archived === true,
    dibuatIso: d.created_at,
    adaCatatan: d.ada_catatan === true,
    pembayaran: angka0(d.jumlah_pembayaran),
    dilewati: angka0(d.jumlah_dilewati),
    penyesuaian: angka0(d.jumlah_penyesuaian),
    pembayaranDiSampah: angka0(d.pembayaran_di_sampah),
    tempoSekarang: d.tempo_sekarang ?? null,
    nextDueBasi: d.next_due_basi === true,
    terlambat: d.terlambat === true,
    selesai: d.selesai === true,
    keadaan: (KEADAAN_JADWAL as readonly string[]).includes(d.keadaan) ? (d.keadaan as KeadaanJadwal) : null,
    kodeTakDikenal: d.kode_tak_dikenal === true,
  }
}
const ringkasJadwal = (r: Partial<RingkasJadwalDTO> | null | undefined): RingkasJadwalDTO => ({
  total: angka0(r?.total), aktif: angka0(r?.aktif), arsip: angka0(r?.arsip), selesai: angka0(r?.selesai),
  terlambat: angka0(r?.terlambat), cicilan: angka0(r?.cicilan), berulang: angka0(r?.berulang),
})
export const keJadwalRuang = (d: JadwalRuangDTO): JadwalRuang => ({
  kasus: d.kasus, ruangId: d.workspace_id, ringkas: ringkasJadwal(d.ringkas),
  baris: (d.baris ?? []).map(keJadwalBaris), terpotong: d.terpotong === true,
})

export interface Lewati { id: string; periode: number; jatuhTempo: string | null; alasan: AlasanLewati | 'lain' | null; kodeTakDikenal: boolean; dibuatIso: string; oleh: string | null }
export interface Penyesuaian {
  id: string; txId: string | null; arah: ArahPenyesuaian | 'lain' | null; nominal: number
  sebab: SebabPenyesuaian | 'lain' | null; kodeTakDikenal: boolean; periodeKe: number | null; dibuatIso: string; oleh: string | null
}
/** `rinci` false = tanpa ranah transaksi: hanya cicilanKe, tanggal, nominal. */
export interface PembayaranJadwal {
  rinci: boolean; id: string | null; tanggal: string; dibuatIso: string | null; nominal: number; jenis: JenisUang | null
  cicilanKe: number | null; periode: number | null; pencatat: string | null; adaCatatan: boolean; jejak: JejakJadwalDTO | null
}
export interface SampahJadwal {
  id: string; txId: string; nominal: number; tanggal: string | null; pencatat: string | null
  dihapusOleh: string | null; dihapusIso: string; dipulihkanIso: string | null; dipulihkan: boolean
}
export interface JadwalRinci {
  kasus: string; jadwal: JadwalBaris
  lewati: Lewati[]; lewatiLebih: boolean
  penyesuaian: Penyesuaian[]; penyesuaianLebih: boolean
  pembayaran: PembayaranJadwal[]; pembayaranLebih: boolean
  diSampah: SampahJadwal[]; diSampahLebih: boolean
  /** Server mengirim isi ranah lain rinci? (spek §2.8) — false = "buka tab X untuk rinciannya". */
  rinci: { pembayaran: boolean; diSampah: boolean }
}
const pembayaranRinci = (p: PembayaranRinciDTO | PembayaranRingkasDTO): p is PembayaranRinciDTO => 'id' in p
export function keJadwalRinci(d: JadwalRinciDTO): JadwalRinci {
  return {
    kasus: d.kasus,
    jadwal: keJadwalBaris(d.jadwal),
    lewati: (d.lewati ?? []).map(x => ({
      id: x.id, periode: angka0(x.period_no), jatuhTempo: x.due_on ?? null, alasan: kodeDari(x.reason, ALASAN_LEWATI),
      kodeTakDikenal: x.kode_tak_dikenal === true, dibuatIso: x.created_at, oleh: x.user_id ?? null,
    })),
    lewatiLebih: d.lewati_lebih === true,
    penyesuaian: (d.penyesuaian ?? []).map(x => ({
      id: x.id, txId: x.tx_id ?? null, arah: kodeDari(x.arah, ARAH_PENYESUAIAN), nominal: angka0(x.nominal),
      sebab: kodeDari(x.sebab, SEBAB_PENYESUAIAN), kodeTakDikenal: x.kode_tak_dikenal === true,
      periodeKe: x.periode_ke ?? null, dibuatIso: x.created_at, oleh: x.user_id ?? null,
    })),
    penyesuaianLebih: d.penyesuaian_lebih === true,
    pembayaran: (d.pembayaran ?? []).map((p): PembayaranJadwal => pembayaranRinci(p)
      ? {
          rinci: true, id: p.id, tanggal: p.occurred_at, dibuatIso: p.created_at, nominal: angka0(p.amount),
          jenis: jenisUang(p.kind, null), cicilanKe: p.installment_no ?? null, periode: p.schedule_periods ?? null,
          pencatat: p.pencatat ?? null, adaCatatan: p.ada_catatan === true, jejak: p.jejak_jadwal ?? null,
        }
      : {
          rinci: false, id: null, tanggal: p.occurred_at, dibuatIso: null, nominal: angka0(p.amount), jenis: null,
          cicilanKe: p.installment_no ?? null, periode: null, pencatat: null, adaCatatan: false, jejak: null,
        }),
    pembayaranLebih: d.pembayaran_lebih === true,
    diSampah: (d.di_sampah ?? []).map(s => ({
      id: s.id, txId: s.tx_id, nominal: angka0(s.amount), tanggal: s.occurred_at ?? null, pencatat: s.pencatat ?? null,
      dihapusOleh: s.dihapus_oleh ?? null, dihapusIso: s.dihapus_pada, dipulihkanIso: s.dipulihkan_pada ?? null,
      dipulihkan: s.status === 'dipulihkan',
    })),
    diSampahLebih: d.di_sampah_lebih === true,
    rinci: { pembayaran: d.rinci?.pembayaran === true, diSampah: d.rinci?.di_sampah === true },
  }
}

// ── R4 admin_usaha_ruang / R5 admin_stok_ruang (ranah usaha) ─────────────
export interface ProdukDTO {
  id: string; user_id: string | null; name: string; unit: string | null; kategori: string | null; ada_kategori: boolean
  sell_price: Num | null; cost_price: Num | null; track_stock: boolean; stok_min: Num | null; archived: boolean
  created_at: string; masuk: Num; keluar: Num; penyesuaian: Num; stok: Num | null; menipis: boolean; minus: boolean
  jumlah_terjual: number; terakhir_terjual: string | null; ada_foto: boolean
}
export interface RingkasUsahaDTO { total: number; aktif: number; arsip: number; berstok: number; menipis: number; minus: number }
export interface UsahaRuangDTO { kasus: string; workspace_id: string; ringkas: RingkasUsahaDTO; produk: ProdukDTO[]; terpotong: boolean }

export interface Produk {
  id: string; pembuat: string | null; nama: string; satuan: string | null; kategori: string | null; adaKategori: boolean
  hargaJual: number | null; hargaModal: number | null; lacakStok: boolean; stokMin: number | null; arsip: boolean
  dibuatIso: string; masuk: number; keluar: number; penyesuaian: number
  /** null = produk tanpa lacak stok. */
  stok: number | null; menipis: boolean; minus: boolean; terjual: number; terakhirTerjual: string | null; adaFoto: boolean
}
export interface UsahaRuang { kasus: string; ruangId: string; ringkas: RingkasUsahaDTO; produk: Produk[]; terpotong: boolean }
export function keUsahaRuang(d: UsahaRuangDTO): UsahaRuang {
  const r = d.ringkas
  return {
    kasus: d.kasus,
    ruangId: d.workspace_id,
    ringkas: {
      total: angka0(r?.total), aktif: angka0(r?.aktif), arsip: angka0(r?.arsip),
      berstok: angka0(r?.berstok), menipis: angka0(r?.menipis), minus: angka0(r?.minus),
    },
    produk: (d.produk ?? []).map(p => ({
      id: p.id,
      pembuat: p.user_id ?? null,
      nama: p.name?.trim() || '—',
      satuan: p.unit?.trim() || null,
      kategori: p.kategori?.trim() || null,
      adaKategori: p.ada_kategori === true,
      hargaJual: angkaAtauNull(p.sell_price),
      hargaModal: angkaAtauNull(p.cost_price),
      lacakStok: p.track_stock === true,
      stokMin: angkaAtauNull(p.stok_min),
      arsip: p.archived === true,
      dibuatIso: p.created_at,
      masuk: angka0(p.masuk),
      keluar: angka0(p.keluar),
      penyesuaian: angka0(p.penyesuaian),
      stok: p.track_stock === true ? angkaAtauNull(p.stok) : null,
      menipis: p.menipis === true,
      minus: p.minus === true,
      terjual: angka0(p.jumlah_terjual),
      terakhirTerjual: p.terakhir_terjual ?? null,
      adaFoto: p.ada_foto === true,
    })),
    terpotong: d.terpotong === true,
  }
}

export interface GerakStokDTO {
  id: string; product_id: string; produk_nama: string | null; delta: Num; reason: string | null; sebab_rinci: string | null
  kode_tak_dikenal: boolean; occurred_at: string; created_at: string; user_id: string | null; ada_catatan: boolean
}
export type KursorStok = KursorTransaksi
export interface StokRuangDTO {
  kasus: string; baris: GerakStokDTO[]; kursor_berikut: KursorStok | null
  /** Hanya halaman pertama. */
  total: number | null; halaman_pertama: boolean
}
export interface GerakStok {
  id: string; produkId: string; produk: string; delta: number; alasan: AlasanStok | 'lain' | null
  sebabRinci: SebabRinciStok | 'lain' | null; kodeTakDikenal: boolean; tanggal: string; dibuatIso: string
  oleh: string | null; adaCatatan: boolean
}
export const keGerakStok = (m: GerakStokDTO): GerakStok => ({
  id: m.id, produkId: m.product_id, produk: m.produk_nama?.trim() || '—', delta: angka0(m.delta),
  alasan: kodeDari(m.reason, ALASAN_STOK), sebabRinci: kodeDari(m.sebab_rinci, SEBAB_RINCI_STOK),
  kodeTakDikenal: m.kode_tak_dikenal === true, tanggal: m.occurred_at, dibuatIso: m.created_at,
  oleh: m.user_id ?? null, adaCatatan: m.ada_catatan === true,
})
/** ?kursor= stok = sumbu transaksi {o,c,i}. */
export const kursorStokDariUrl = kursorTransaksiDariUrl

// ── R6 admin_struk_ruang (ranah struk) ───────────────────────────────────
export interface StrukDTO {
  id: string; user_id: string | null; kind: string | null; ocr_status: string | null; kode_tak_dikenal: boolean
  uang_diterima: Num | null; created_at: string; tanggal: string | null; ada_merchant: boolean; ada_catatan: boolean
  ada_foto: boolean; jumlah_foto: number; ada_kontak: boolean; kontak_sidik: string | null; jumlah_baris: number
  nominal_total: Num; kembalian: Num | null; dompet_ids: string[] | null; kasbon: boolean; jumlah_produk: number
  baris_di_sampah: number
}
export interface RingkasStrukDTO {
  total: number; masuk: number; keluar: number; kasbon: number
  ocr: { pending: number; done: number; failed: number; tanpa: number }; dengan_foto: number
}
export interface KursorStruk { c: string; i: string }
export interface StrukRuangDTO {
  kasus: string
  /** Hanya halaman pertama. */
  ringkas: RingkasStrukDTO | null
  baris: StrukDTO[]; kursor_berikut: KursorStruk | null; total: number | null; halaman_pertama: boolean
}
/** Saringan admin_struk_ruang. `pencatat` TIDAK ikut URL (useState) dan tidak masuk audit. */
export interface SaringStruk {
  pencatat: string | null; jenis: ArahUang | null; kasbon: boolean | null; ocr: OcrStruk | null
  dari: string | null; sampai: string | null
}
export const SARING_STRUK_KOSONG: Readonly<SaringStruk> = { pencatat: null, jenis: null, kasbon: null, ocr: null, dari: null, sampai: null }
/** Arah UI → p_kind server. */
export const kindDariArah = (a: ArahUang | null): 'income' | 'expense' | null => (a === 'masuk' ? 'income' : a === 'keluar' ? 'expense' : null)

export interface Struk {
  id: string; pencatat: string | null; arah: ArahUang | null
  ocr: Exclude<OcrStruk, 'tanpa'> | 'lain' | null; kodeTakDikenal: boolean
  uangDiterima: number | null; dibuatIso: string; tanggal: string | null
  adaMerchant: boolean; adaCatatan: boolean; adaFoto: boolean; foto: number
  adaKontak: boolean
  /** Pengelompokan di dalam kasus ini saja — jangan simpan/ekspor/jumlahkan kasbon per sidik. */
  kontakSidik: string | null
  baris: number; nominal: number; kembalian: number | null; dompetIds: string[]; kasbon: boolean
  produk: number; barisDiSampah: number
}
export interface RingkasStruk { total: number; masuk: number; keluar: number; kasbon: number; ocr: Record<OcrStruk, number>; denganFoto: number }
export const keStruk = (g: StrukDTO): Struk => ({
  id: g.id,
  pencatat: g.user_id ?? null,
  arah: keArahUang(g.kind),
  ocr: kodeDari(g.ocr_status, ['pending', 'done', 'failed'] as const),
  kodeTakDikenal: g.kode_tak_dikenal === true,
  uangDiterima: angkaAtauNull(g.uang_diterima),
  dibuatIso: g.created_at,
  tanggal: g.tanggal ?? null,
  adaMerchant: g.ada_merchant === true,
  adaCatatan: g.ada_catatan === true,
  adaFoto: g.ada_foto === true,
  foto: angka0(g.jumlah_foto),
  adaKontak: g.ada_kontak === true,
  kontakSidik: g.kontak_sidik ?? null,
  baris: angka0(g.jumlah_baris),
  nominal: angka0(g.nominal_total),
  kembalian: angkaAtauNull(g.kembalian),
  dompetIds: Array.isArray(g.dompet_ids) ? g.dompet_ids.filter((x): x is string => typeof x === 'string') : [],
  kasbon: g.kasbon === true,
  produk: angka0(g.jumlah_produk),
  barisDiSampah: angka0(g.baris_di_sampah),
})
export const keRingkasStruk = (r: RingkasStrukDTO | null | undefined): RingkasStruk | null => (r
  ? {
      total: angka0(r.total), masuk: angka0(r.masuk), keluar: angka0(r.keluar), kasbon: angka0(r.kasbon),
      ocr: { pending: angka0(r.ocr?.pending), done: angka0(r.ocr?.done), failed: angka0(r.ocr?.failed), tanpa: angka0(r.ocr?.tanpa) },
      denganFoto: angka0(r.dengan_foto),
    }
  : null)
/** ?kursor= struk → {c, i}; rusak → null (halaman pertama). */
export function kursorStrukDariUrl(teks: string | null | undefined): KursorStruk | null {
  const o = bacaObjekKursor(teks)
  return o && isoSah(o.c) && typeof o.i === 'string' && POLA_UUID.test(o.i) ? { c: o.c, i: o.i } : null
}

// ── R7 admin_patungan_ruang / R8 admin_patungan_riwayat (ranah dompet) ───
export interface SaldoPatunganDTO { user_id: string; saldo: Num; ditalangi: Num; ditanggung: Num; bayar_lunas: Num; terima_lunas: Num }
export interface RingkasPatunganDTO {
  transaksi_dibagi: number; total_dibagi: Num; pelunasan: number; total_pelunasan: Num
  pelunasan_tanpa_transfer: number; selisih_bagi: Num; jumlah_saldo: Num; dibagi_tak_dihitung: number
}
export interface PatunganRuangDTO {
  kasus: string; workspace_id: string; fitur_patungan: boolean | null
  saldo: SaldoPatunganDTO[]; bekas: SaldoPatunganDTO[]; ringkas: RingkasPatunganDTO
}
export interface SaldoPatungan { orang: string; saldo: number; ditalangi: number; ditanggung: number; bayarLunas: number; terimaLunas: number }
export interface Patungan {
  kasus: string; ruangId: string; fitur: boolean
  /** Anggota saat ini (= saldo_patungan aplikasi). */
  saldo: SaldoPatungan[]
  /** Bekas anggota yang masih punya jejak patungan (K-F3-10). */
  bekas: SaldoPatungan[]
  ringkas: {
    transaksiDibagi: number; totalDibagi: number; pelunasan: number; totalPelunasan: number
    pelunasanTanpaTransfer: number; selisihBagi: number; jumlahSaldo: number; dibagiTakDihitung: number
  }
  /** jumlah_saldo harus 0; selain itu ada yang janggal di data. */
  seimbang: boolean
}
const keSaldo = (s: SaldoPatunganDTO): SaldoPatungan => ({
  orang: s.user_id, saldo: angka0(s.saldo), ditalangi: angka0(s.ditalangi), ditanggung: angka0(s.ditanggung),
  bayarLunas: angka0(s.bayar_lunas), terimaLunas: angka0(s.terima_lunas),
})
export function kePatungan(d: PatunganRuangDTO): Patungan {
  const r = d.ringkas
  const jumlahSaldo = angka0(r?.jumlah_saldo)
  return {
    kasus: d.kasus,
    ruangId: d.workspace_id,
    fitur: d.fitur_patungan === true,
    saldo: (d.saldo ?? []).map(keSaldo),
    bekas: (d.bekas ?? []).map(keSaldo),
    ringkas: {
      transaksiDibagi: angka0(r?.transaksi_dibagi), totalDibagi: angka0(r?.total_dibagi),
      pelunasan: angka0(r?.pelunasan), totalPelunasan: angka0(r?.total_pelunasan),
      pelunasanTanpaTransfer: angka0(r?.pelunasan_tanpa_transfer), selisihBagi: angka0(r?.selisih_bagi),
      jumlahSaldo, dibagiTakDihitung: angka0(r?.dibagi_tak_dihitung),
    },
    seimbang: Math.abs(jumlahSaldo) < 0.005,
  }
}

export interface BagiBarisDTO {
  id: string; occurred_at: string; created_at: string; amount: Num; kind: string | null; pencatat: string | null
  kategori_id: string | null; kategori: string | null; ada_catatan: boolean
  bagian: Array<{ user_id: string; nominal: Num }>; jumlah_bagian: number; selisih: Num; dihitung_saldo: boolean
}
export interface LunasBarisDTO {
  id: string; dari: string | null; ke: string | null; nominal: Num; transfer_group: string | null; dicatat_oleh: string | null
  pada: string; ada_catatan: boolean; ada_bukti: boolean; transfer_hidup: boolean
}
export type KursorBagi = KursorTransaksi
export interface KursorLunas { p: string; i: string }
export type PatunganRiwayatDTO =
  | { kasus: string; jenis: 'bagi'; baris: BagiBarisDTO[]; kursor_berikut: KursorBagi | null; total: number | null; halaman_pertama: boolean }
  | { kasus: string; jenis: 'lunas'; baris: LunasBarisDTO[]; kursor_berikut: KursorLunas | null; total: number | null; halaman_pertama: boolean }

export interface BagiBaris {
  id: string; tanggal: string; dibuatIso: string; nominal: number; arah: ArahUang | null; pembayar: string | null
  kategoriId: string | null; kategori: string; adaCatatan: boolean
  bagian: Array<{ orang: string; nominal: number }>; jumlahBagian: number; selisih: number
  /** false = split atas pemasukan: tidak ikut saldo patungan aplikasi (0073). */
  dihitungSaldo: boolean
}
export interface LunasBaris {
  id: string; dari: string | null; ke: string | null; nominal: number; transferGroup: string | null; dicatatOleh: string | null
  padaIso: string; adaCatatan: boolean; adaBukti: boolean; transferHidup: boolean
}
export const keBagiBaris = (b: BagiBarisDTO): BagiBaris => ({
  id: b.id, tanggal: b.occurred_at, dibuatIso: b.created_at, nominal: angka0(b.amount), arah: keArahUang(b.kind),
  pembayar: b.pencatat ?? null, kategoriId: b.kategori_id ?? null, kategori: b.kategori?.trim() || '',
  adaCatatan: b.ada_catatan === true,
  bagian: (b.bagian ?? []).map(x => ({ orang: x.user_id, nominal: angka0(x.nominal) })),
  jumlahBagian: angka0(b.jumlah_bagian), selisih: angka0(b.selisih), dihitungSaldo: b.dihitung_saldo === true,
})
export const keLunasBaris = (l: LunasBarisDTO): LunasBaris => ({
  id: l.id, dari: l.dari ?? null, ke: l.ke ?? null, nominal: angka0(l.nominal), transferGroup: l.transfer_group ?? null,
  dicatatOleh: l.dicatat_oleh ?? null, padaIso: l.pada, adaCatatan: l.ada_catatan === true, adaBukti: l.ada_bukti === true,
  transferHidup: l.transfer_hidup === true,
})
/** ?kursor= riwayat patungan menurut jenis: bagi {o,c,i}, lunas {p,i}.
 *  Kursor jenis lain → null (server menolaknya dengan 22023 kursor). */
export function kursorPatunganDariUrl(jenis: 'bagi', teks: string | null | undefined): KursorBagi | null
export function kursorPatunganDariUrl(jenis: 'lunas', teks: string | null | undefined): KursorLunas | null
export function kursorPatunganDariUrl(jenis: JenisRiwayatPatungan, teks: string | null | undefined): KursorBagi | KursorLunas | null
export function kursorPatunganDariUrl(jenis: JenisRiwayatPatungan, teks: string | null | undefined): KursorBagi | KursorLunas | null {
  if (jenis === 'bagi') return kursorTransaksiDariUrl(teks)
  const o = bacaObjekKursor(teks)
  return o && isoSah(o.p) && typeof o.i === 'string' && POLA_UUID.test(o.i) && Object.keys(o).length === 2 ? { p: o.p, i: o.i } : null
}
