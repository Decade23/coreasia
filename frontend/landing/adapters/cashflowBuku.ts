/**
 * Buku (Fase 1, migrasi 0090) — kepala pengguna (T0), Pengguna 360 (akun +
 * ruang, T1), transaksi berkeyset (T2), laci transaksi, teks bebas (T3), dan
 * pencarian global. DTO = persis kunci jsonb yang dibangun server; kontraknya
 * diuji terhadap migrasi (tests/cashflow/kontrak-fase1.test.ts).
 *
 * Teks bebas TIDAK PERNAH ada di bentuk T2: transaksi hanya membawa
 * `ada_catatan`, sampah `ada_catatan`, riwayat `ada_judul`. Isinya datang
 * terpisah lewat admin_teks (kasus anak) dan ditempel di UI per id.
 *
 * Kursor keyset dari server (objek jsonb) dibawa di URL sebagai base64url
 * (?kursor=) supaya riwayat peramban = tumpukan halaman. Isinya hanya kunci
 * urut (tanggal, waktu, id), bukan isi data; tetap divalidasi saat dibaca —
 * URL yang diutak-atik jatuh ke halaman pertama.
 *
 * adapters/ tidak di-auto-import Nuxt — selalu impor eksplisit.
 */
import { POLA_UUID, samarkanEmail, keArahUang, type ArahUang } from './cashflow'
import { tanggalPendek, type BahasaWaktu } from './cashflowWaktu'
import type { RuangCalon } from './cashflowKasus'

const angka = (v: number | string | null | undefined): number => {
  const x = Number(v ?? 0)
  return Number.isFinite(x) ? x : 0
}
const angkaAtauNull = (v: number | string | null | undefined): number | null => {
  if (v == null || v === '') return null
  const x = Number(v)
  return Number.isFinite(x) ? x : null
}

// ── Kepala (T0) ──────────────────────────────────────────────────────────
/** admin_pengguna_kepala.ruang[] — hanya untuk pemegang cashflow:pii. */
export interface RuangKepalaDTO {
  workspace_id: string; nama: string | null; jenis: string | null; peran: string | null
  pemilik: boolean; bekas_anggota: boolean; jumlah_anggota: number; tx_oleh_dia: number
}
export interface KepalaPenggunaDTO {
  user_id: string; email: string | null; daftar: string; masuk_terakhir: string | null
  /** jumlah_ruang/jumlah_transaksi null = pemanggil tanpa pii (M/0090 §2). */
  banned_until: string | null; jumlah_ruang: number | null; jumlah_transaksi: number | null
  akses_30hari: number
  /** null = pemanggil tanpa izin pii (lingkup kasus otomatis tidak dikirim). */
  ruang: RuangKepalaDTO[] | null
}
export interface KepalaPengguna {
  id: string
  emailTersamar: string
  daftarIso: string
  masukTerakhirIso: string | null
  ditangguhkan: boolean
  /** null = sesi tanpa pii: server tidak mengirim hitungan per orang (M/0089 §15 (d)). */
  jumlahRuang: number | null
  jumlahTransaksi: number | null
  akses30: number
  /** null = tanpa pii: kasus tidak bisa dibuka dari sesi ini (masuk ulang ber-TOTP). */
  ruang: RuangCalon[] | null
}

export function keKepala(d: KepalaPenggunaDTO, sekarang: number = Date.now()): KepalaPengguna {
  return {
    id: d.user_id,
    emailTersamar: samarkanEmail(d.email),
    daftarIso: d.daftar,
    masukTerakhirIso: d.masuk_terakhir ?? null,
    ditangguhkan: !!d.banned_until && Date.parse(d.banned_until) > sekarang,
    jumlahRuang: angkaAtauNull(d.jumlah_ruang),
    jumlahTransaksi: angkaAtauNull(d.jumlah_transaksi),
    akses30: angka(d.akses_30hari),
    ruang: Array.isArray(d.ruang)
      ? d.ruang.map(r => ({
          id: r.workspace_id,
          nama: r.nama || '—',
          jenis: r.jenis ?? null,
          peran: r.peran ?? null,
          pemilik: r.pemilik === true,
          bekas: r.bekas_anggota === true,
          anggota: angka(r.jumlah_anggota),
          tx: angka(r.tx_oleh_dia),
        }))
      : null,
  }
}

// ── Pengguna 360 (T1 ranah akun) ─────────────────────────────────────────
export interface AkunDTO {
  user_id: string; email: string; display_name: string; nama_meta: string | null
  email_confirmed_at: string | null; provider: string | null; providers: string[] | null
  daftar: string; masuk_terakhir: string | null; banned_until: string | null
  sesi: { jumlah: number; terakhir: string | null } | null
  mfa: boolean
}
export interface AgregatRuangDTO {
  transaksi: number; masuk_bersih: number | string; keluar_bersih: number | string
  terakhir_catat: string | null; dompet: number
}
export interface RuangDalamDTO {
  workspace_id: string; dalam_lingkup: true; nama: string; jenis: string | null; peran: string | null
  pemilik: boolean; bekas_anggota: boolean; joined_at: string | null; jumlah_anggota: number
  tx_oleh_dia: number; masuk_bersih_dia: number | string; keluar_bersih_dia: number | string
  terakhir_catat_dia: string | null; agregat: AgregatRuangDTO | null
}
export interface RuangLuarDTO {
  workspace_id: string; dalam_lingkup: false; nama: string | null; jenis: string | null; peran: string | null
  pemilik: boolean; bekas_anggota: boolean; jumlah_anggota: number; tx_oleh_dia: number
}
export interface Hitung360DTO {
  ruang: number; ruang_dalam_lingkup: number; transaksi: number; jejak: number; sampah: number
  /* 0095 (lencana Perangkat/Kabar). null/tidak ada = server sebelum 0095. */
  perangkat?: number | null; kabar?: number | null; kabar_belum?: number | null
}
export interface Pengguna360DTO {
  kasus: string
  akun: AkunDTO
  hitung: Hitung360DTO
  pertama_catat: string | null
  total: { transaksi: number; masuk_bersih: number | string; keluar_bersih: number | string }
  ruang: Array<RuangDalamDTO | RuangLuarDTO>
}

export interface Akun {
  id: string
  email: string
  namaTampil: string
  namaMeta: string | null
  emailTerkonfirmasiIso: string | null
  provider: string[]
  daftarIso: string
  masukTerakhirIso: string | null
  ditangguhkanSampaiIso: string | null
  ditangguhkan: boolean
  sesi: number
  sesiTerakhirIso: string | null
  mfa: boolean
}
export interface RuangSubjek {
  id: string
  dalamLingkup: boolean
  /** Utuh di dalam lingkup, tersamar di luar. */
  nama: string
  jenis: string | null
  peran: string | null
  pemilik: boolean
  bekas: boolean
  gabungIso: string | null
  anggota: number
  txOlehDia: number
  /** Hanya di dalam lingkup; null di luar (server tidak mengirim). */
  masukBersihDia: number | null
  keluarBersihDia: number | null
  terakhirCatatDiaIso: string | null
  agregat: { transaksi: number; masukBersih: number; keluarBersih: number; terakhirCatatIso: string | null; dompet: number } | null
}
export interface Pengguna360 {
  kasus: string
  akun: Akun
  hitung: Hitung360DTO
  pertamaCatatIso: string | null
  /** Dalam lingkup, tanpa kaki transfer. */
  total: { transaksi: number; masukBersih: number; keluarBersih: number }
  ruang: RuangSubjek[]
}

export function ke360(d: Pengguna360DTO, sekarang: number = Date.now()): Pengguna360 {
  const a = d.akun
  const provider = Array.isArray(a.providers) && a.providers.length
    ? a.providers.filter((p): p is string => typeof p === 'string')
    : a.provider ? [a.provider] : []
  return {
    kasus: d.kasus,
    akun: {
      id: a.user_id,
      email: a.email,
      namaTampil: a.display_name?.trim() || '—',
      namaMeta: a.nama_meta?.trim() || null,
      emailTerkonfirmasiIso: a.email_confirmed_at ?? null,
      provider,
      daftarIso: a.daftar,
      masukTerakhirIso: a.masuk_terakhir ?? null,
      ditangguhkanSampaiIso: a.banned_until ?? null,
      ditangguhkan: !!a.banned_until && Date.parse(a.banned_until) > sekarang,
      sesi: angka(a.sesi?.jumlah),
      sesiTerakhirIso: a.sesi?.terakhir ?? null,
      mfa: a.mfa === true,
    },
    hitung: {
      ruang: angka(d.hitung?.ruang), ruang_dalam_lingkup: angka(d.hitung?.ruang_dalam_lingkup),
      transaksi: angka(d.hitung?.transaksi), jejak: angka(d.hitung?.jejak), sampah: angka(d.hitung?.sampah),
      perangkat: angkaAtauNull(d.hitung?.perangkat), kabar: angkaAtauNull(d.hitung?.kabar),
      kabar_belum: angkaAtauNull(d.hitung?.kabar_belum),
    },
    pertamaCatatIso: d.pertama_catat ?? null,
    total: { transaksi: angka(d.total?.transaksi), masukBersih: angka(d.total?.masuk_bersih), keluarBersih: angka(d.total?.keluar_bersih) },
    ruang: (d.ruang ?? []).map((r): RuangSubjek => r.dalam_lingkup
      ? {
          id: r.workspace_id, dalamLingkup: true, nama: r.nama || '—', jenis: r.jenis ?? null, peran: r.peran ?? null,
          pemilik: r.pemilik === true, bekas: r.bekas_anggota === true, gabungIso: r.joined_at ?? null,
          anggota: angka(r.jumlah_anggota), txOlehDia: angka(r.tx_oleh_dia),
          masukBersihDia: angka(r.masuk_bersih_dia), keluarBersihDia: angka(r.keluar_bersih_dia),
          terakhirCatatDiaIso: r.terakhir_catat_dia ?? null,
          agregat: r.agregat
            ? {
                transaksi: angka(r.agregat.transaksi), masukBersih: angka(r.agregat.masuk_bersih),
                keluarBersih: angka(r.agregat.keluar_bersih), terakhirCatatIso: r.agregat.terakhir_catat ?? null,
                dompet: angka(r.agregat.dompet),
              }
            : null,
        }
      : {
          id: r.workspace_id, dalamLingkup: false, nama: r.nama || '—', jenis: r.jenis ?? null, peran: r.peran ?? null,
          pemilik: r.pemilik === true, bekas: r.bekas_anggota === true, gabungIso: null,
          anggota: angka(r.jumlah_anggota), txOlehDia: angka(r.tx_oleh_dia),
          masukBersihDia: null, keluarBersihDia: null, terakhirCatatDiaIso: null, agregat: null,
        }),
  }
}

// ── Transaksi (T2 ranah transaksi) ───────────────────────────────────────
/** Satu baris admin_transaksi_bangun (0090 §4) — TANPA note. */
export interface TransaksiBarisDTO {
  id: string; workspace_id: string; pencatat: string | null
  dompet_id: string | null; dompet: string | null; kategori_id: string | null; kategori: string | null
  kind: string; amount: number | string; occurred_at: string; occurred_time: string | null
  created_at: string; updated_at: string | null; dicatat_pada: string | null
  transfer_group: string | null; pasangan_id: string | null
  group_id: string | null; schedule_id: string | null; installment_no: number | null
  schedule_periods: number | null; product_id: string | null; qty: number | string | null
  unit_price: number | string | null; cost_at_sale: number | string | null
  ada_catatan: boolean; ada_lampiran: boolean; masa_depan: boolean
}
/** Satu baris admin_sampah_bangun (0090 §5) — tanpa isi/note/judul. */
export interface SampahBarisDTO {
  id: string; tx_id: string; workspace_id: string; kind: string | null; amount: number | string | null
  occurred_at: string | null; dompet_id: string | null; dompet_nama: string | null; kategori_id: string | null
  transfer_group: string | null; group_id: string | null; schedule_id: string | null
  ada_foto: boolean | null; ada_catatan: boolean; pencatat: string | null
  dihapus_oleh: string | null; dihapus_pada: string; dipulihkan_oleh: string | null; dipulihkan_pada: string | null
}
export interface KursorTransaksi { o: string; c: string; i: string }
export interface TransaksiCariDTO {
  baris: TransaksiBarisDTO[]
  kursor_berikut: KursorTransaksi | null
  /** Hanya di halaman pertama (p_kursor null). */
  total: number | null
  /** Hanya di halaman pertama dan bila p_termasuk_sampah. Paling banyak 50 baris. */
  sampah: SampahBarisDTO[] | null
  /** true = ada baris sampah ke-51 yang tidak ikut (0092, kontrak 3). Server
   *  sebelum 0092 tidak mengirimnya — dibaca toleran lewat adaSampahLebih. */
  sampah_lebih?: boolean | null
  halaman_pertama: boolean
  mode: 'pengguna' | 'ruang'
}

/** Masuk/keluar sungguhan, atau kaki transfer (transfer_group terisi). */
export type JenisUang = 'masuk' | 'keluar' | 'transfer'
export const JENIS_TRANSAKSI = ['masuk', 'keluar', 'transfer'] as const
/** p_cek admin_transaksi_bangun (0090 §4). */
export const CEK_TRANSAKSI = ['masa_depan', 'transfer_pincang', 'dompet_arsip', 'calon_ganda'] as const
export type CekTransaksi = typeof CEK_TRANSAKSI[number]

/** Saringan admin_transaksi_cari mode pengguna. Kunci struktur (ruang,
 *  dompet, kategori, jenis, dari, sampai, cek, sampah) ikut URL; nominal
 *  (min/maks) TIDAK — terlalu mengungkap untuk riwayat peramban. Server hanya
 *  mencatat NAMA saringan yang aktif, bukan nilainya. */
export interface SaringTransaksi {
  ruang: string | null
  dompet: string | null
  kategori: string | null
  jenis: JenisUang | null
  dari: string | null
  sampai: string | null
  min: number | null
  maks: number | null
  cek: CekTransaksi | null
  sampah: boolean
}

export interface TransaksiBaris {
  id: string
  ruangId: string
  pencatat: string | null
  dompetId: string | null
  dompet: string
  kategoriId: string | null
  kategori: string
  arah: ArahUang | null
  jenis: JenisUang | null
  nominal: number
  tanggal: string          // occurred_at 'YYYY-MM-DD' (kolom date — diformat dari teks)
  jam: string | null       // occurred_time 'HH:MM'
  dibuatIso: string
  diubahIso: string | null
  transfer: boolean
  pasanganId: string | null
  grupId: string | null
  jadwalId: string | null
  cicilanKe: number | null
  produkId: string | null
  qty: number | null
  adaCatatan: boolean
  adaLampiran: boolean
  masaDepan: boolean
}

export function jenisUang(kind: string | null | undefined, transferGroup: string | null | undefined): JenisUang | null {
  if (transferGroup) return 'transfer'
  const a = keArahUang(kind)
  return a
}

export function keTransaksiBaris(d: TransaksiBarisDTO): TransaksiBaris {
  return {
    id: d.id,
    ruangId: d.workspace_id,
    pencatat: d.pencatat ?? null,
    dompetId: d.dompet_id ?? null,
    dompet: d.dompet?.trim() || '—',
    kategoriId: d.kategori_id ?? null,
    kategori: d.kategori?.trim() || '',
    arah: keArahUang(d.kind),
    jenis: jenisUang(d.kind, d.transfer_group),
    nominal: angka(d.amount),
    tanggal: d.occurred_at,
    jam: d.occurred_time ? d.occurred_time.slice(0, 5) : null,
    dibuatIso: d.created_at,
    diubahIso: d.updated_at ?? null,
    transfer: !!d.transfer_group,
    pasanganId: d.pasangan_id ?? null,
    grupId: d.group_id ?? null,
    jadwalId: d.schedule_id ?? null,
    cicilanKe: d.installment_no ?? null,
    produkId: d.product_id ?? null,
    qty: angkaAtauNull(d.qty),
    adaCatatan: d.ada_catatan === true,
    adaLampiran: d.ada_lampiran === true,
    masaDepan: d.masa_depan === true,
  }
}

export interface SampahBaris {
  id: string               // sampah.id — id untuk admin_teks jenis 'sampah'
  txId: string             // id transaksi yang dihapus — kunci laci ?tx=
  ruangId: string
  jenis: JenisUang | null
  nominal: number
  tanggal: string | null
  dompet: string
  adaCatatan: boolean
  adaFoto: boolean
  pencatat: string | null
  dihapusOleh: string | null
  dihapusIso: string
  dipulihkanIso: string | null
}

/** Sampah terpotong di 50 baris? Hanya `true` persis yang dihitung: kunci yang
 *  tidak ada (server sebelum 0092), null, atau nilai lain = tidak terpotong. */
export const adaSampahLebih = (d: Pick<TransaksiCariDTO, 'sampah_lebih'> | null | undefined): boolean =>
  d?.sampah_lebih === true

/** Angka di judul "Di sampah (…)": akhiran "+" bila server memotong daftarnya,
 *  supaya 50 baris yang tampil tidak terbaca sebagai jumlah seluruhnya. */
export const labelJumlahSampah = (n: number, lebih: boolean): string => (lebih ? `${n}+` : `${n}`)

export function keSampahBaris(d: SampahBarisDTO): SampahBaris {
  return {
    id: d.id,
    txId: d.tx_id,
    ruangId: d.workspace_id,
    jenis: jenisUang(d.kind, d.transfer_group),
    nominal: angka(d.amount),
    tanggal: d.occurred_at ?? null,
    dompet: d.dompet_nama?.trim() || '—',
    adaCatatan: d.ada_catatan === true,
    adaFoto: d.ada_foto === true,
    pencatat: d.pencatat ?? null,
    dihapusOleh: d.dihapus_oleh ?? null,
    dihapusIso: d.dihapus_pada,
    dipulihkanIso: d.dipulihkan_pada ?? null,
  }
}

// ── Kursor di URL ────────────────────────────────────────────────────────
const POLA_TANGGAL = /^\d{4}-\d{2}-\d{2}$/
/** Kursor bentuk base64url di URL (tanpa padding). */
export const POLA_KURSOR_URL = /^[A-Za-z0-9_-]{1,600}$/

function keBase64Url(teks: string): string {
  const b = typeof btoa === 'function'
    ? btoa(String.fromCharCode(...new TextEncoder().encode(teks)))
    : Buffer.from(teks, 'utf8').toString('base64')
  return b.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}
function dariBase64Url(s: string): string | null {
  try {
    const b = s.replace(/-/g, '+').replace(/_/g, '/')
    const pad = b + '='.repeat((4 - (b.length % 4)) % 4)
    if (typeof atob === 'function') {
      const biner = atob(pad)
      return new TextDecoder().decode(Uint8Array.from(biner, c => c.charCodeAt(0)))
    }
    return Buffer.from(pad, 'base64').toString('utf8')
  } catch {
    return null
  }
}

/** Objek kursor server → teks URL. */
export function kursorKeUrl(k: object | null | undefined): string {
  return k ? keBase64Url(JSON.stringify(k)) : ''
}

/** Teks ?kursor= → objek JSON mentah; bentuk tak sah → null. Pemanggil
 *  memeriksa kunci dan tipenya sendiri (per jenis kursor). */
export function bacaObjekKursor(teks: string | null | undefined): Record<string, unknown> | null {
  if (!teks || !POLA_KURSOR_URL.test(teks)) return null
  const json = dariBase64Url(teks)
  if (!json) return null
  try {
    const o: unknown = JSON.parse(json)
    return o && typeof o === 'object' && !Array.isArray(o) ? (o as Record<string, unknown>) : null
  } catch {
    return null
  }
}
/** Stempel waktu ISO (bentuk yang dikirim server di kursor). */
export const isoSah = (v: unknown): v is string => typeof v === 'string' && v.length <= 40 && Number.isFinite(Date.parse(v))

/** ?kursor= transaksi → {o, c, i}; rusak → null (halaman pertama). */
export function kursorTransaksiDariUrl(teks: string | null | undefined): KursorTransaksi | null {
  const o = bacaObjekKursor(teks)
  return o && typeof o.o === 'string' && POLA_TANGGAL.test(o.o) && isoSah(o.c) && typeof o.i === 'string' && POLA_UUID.test(o.i)
    ? { o: o.o, c: o.c, i: o.i } : null
}

// ── Laci: admin_transaksi_rinci (0090 §7) ────────────────────────────────
/** transactions.jejak_jadwal — hanya kunci yang dikenal (jejak_jadwal_aman). */
export interface JejakJadwalDTO {
  v?: number; periode?: number; tutup?: number; amount?: number; total?: number | null
  sebab?: 'utang' | 'potong'; due_awal?: string; due_akhir?: string
  sebelum?: { paid?: number; partial?: number } | null
}
export type TransaksiRinciTxDTO = TransaksiBarisDTO & { jejak_jadwal: JejakJadwalDTO | null }
export interface SampahRinciDTO {
  id: string; sampah_id: string; workspace_id: string; pencatat: string | null
  dompet_id: string | null; dompet_nama: string | null; kategori_id: string | null
  kind: string | null; amount: number | string | null; occurred_at: string | null
  transfer_group: string | null; group_id: string | null; schedule_id: string | null
  schedule_periods: number | null; ada_foto: boolean | null; ada_catatan: boolean
  dihapus_oleh: string | null; dihapus_pada: string; dipulihkan_oleh: string | null; dipulihkan_pada: string | null
}
export interface PasanganDTO {
  id: string; workspace_id: string; dompet_id: string | null; dompet: string | null
  kind: string; amount: number | string; pencatat: string | null
}
export interface GrupPenuhDTO {
  id: string; kind: string | null; ocr_status: string | null; ada_merchant: boolean; ada_catatan: boolean
  ada_foto: boolean; ada_kontak: boolean; uang_diterima: number | string | null; created_at: string; jumlah_baris: number
}
export interface JadwalPenuhDTO {
  id: string; nama: string | null; kind: string | null; amount: number | string | null; cadence: string | null
  total_count: number | null; paid_count: number | null; archived: boolean | null; ada_catatan: boolean
}
export interface ProdukPenuhDTO {
  id: string; nama: string | null; unit: string | null; sell_price: number | string | null
  cost_price: number | string | null; archived: boolean | null
}
/** Konteks ranah lain tanpa ranahnya di kasus: hanya id (+ label struktur). */
export interface TerbatasDTO { id: string; nama?: string | null; terbatas: true }
export interface RiwayatTxDTO {
  id: number; jenis: string; aktor: string | null; pada: string; pada_perangkat: string | null
  jeda_tiba_detik: number | null; kunci: string[]; ada_judul: boolean
  nominal: number | string | null; arah: string | null; tanggal: string | null
}
export interface TransaksiRinciDTO {
  sumber: 'transaksi' | 'sampah'
  transaksi: TransaksiRinciTxDTO | SampahRinciDTO
  pasangan: PasanganDTO[]
  grup: GrupPenuhDTO | TerbatasDTO | null
  jadwal: JadwalPenuhDTO | TerbatasDTO | null
  produk: ProdukPenuhDTO | TerbatasDTO | null
  lampiran: { ada_bukti: boolean | null; jumlah: number | null } | null
  riwayat: RiwayatTxDTO[]
}

export const terbatas = (x: object | null | undefined): x is TerbatasDTO => !!x && (x as TerbatasDTO).terbatas === true

export interface RiwayatTx {
  id: number
  jenis: string
  aktor: string | null
  padaIso: string
  jedaTiba: number | null
  kunci: string[]
  adaJudul: boolean
  nominal: number | null
  arah: ArahUang | null
}
export const keRiwayatTx = (r: RiwayatTxDTO): RiwayatTx => ({
  id: Number(r.id),
  jenis: r.jenis,
  aktor: r.aktor ?? null,
  padaIso: r.pada,
  jedaTiba: r.jeda_tiba_detik == null ? null : Number(r.jeda_tiba_detik),
  kunci: Array.isArray(r.kunci) ? r.kunci.filter((k): k is string => typeof k === 'string') : [],
  adaJudul: r.ada_judul === true,
  nominal: angkaAtauNull(r.nominal),
  arah: keArahUang(r.arah),
})

export interface TransaksiRinci {
  sumber: 'transaksi' | 'sampah'
  id: string
  /** sampah.id bila sumbernya sampah — id untuk admin_teks jenis 'sampah'. */
  sampahId: string | null
  ruangId: string
  pencatat: string | null
  jenis: JenisUang | null
  arah: ArahUang | null
  nominal: number
  tanggal: string | null
  jam: string | null
  dompet: string
  kategori: string
  dibuatIso: string | null
  diubahIso: string | null
  dicatatPerangkatIso: string | null
  adaCatatan: boolean
  masaDepan: boolean
  cicilanKe: number | null
  qty: number | null
  hargaSatuan: number | null
  hpp: number | null
  dihapusOleh: string | null
  dihapusIso: string | null
  dipulihkanIso: string | null
  jejakJadwal: JejakJadwalDTO | null
  /** Kaki lain transfer yang sama (dalam lingkup kasus). */
  pasangan: Array<{ id: string; dompet: string; arah: ArahUang | null; nominal: number; pencatat: string | null }>
  grup: GrupPenuhDTO | TerbatasDTO | null
  jadwal: JadwalPenuhDTO | TerbatasDTO | null
  produk: ProdukPenuhDTO | TerbatasDTO | null
  lampiran: { adaBukti: boolean; jumlah: number | null }
  riwayat: RiwayatTx[]
}

const adalahSampahRinci = (d: TransaksiRinciDTO): d is TransaksiRinciDTO & { transaksi: SampahRinciDTO } => d.sumber === 'sampah'

export function keRinci(d: TransaksiRinciDTO): TransaksiRinci {
  const umum = {
    pasangan: (d.pasangan ?? []).map(p => ({
      id: p.id, dompet: p.dompet?.trim() || '—', arah: keArahUang(p.kind), nominal: angka(p.amount), pencatat: p.pencatat ?? null,
    })),
    grup: d.grup ?? null,
    jadwal: d.jadwal ?? null,
    produk: d.produk ?? null,
    lampiran: { adaBukti: d.lampiran?.ada_bukti === true, jumlah: d.lampiran?.jumlah ?? null },
    riwayat: (d.riwayat ?? []).map(keRiwayatTx),
  }
  if (adalahSampahRinci(d)) {
    const s = d.transaksi
    return {
      ...umum,
      sumber: 'sampah', id: s.id, sampahId: s.sampah_id, ruangId: s.workspace_id, pencatat: s.pencatat ?? null,
      jenis: jenisUang(s.kind, s.transfer_group), arah: keArahUang(s.kind), nominal: angka(s.amount),
      tanggal: s.occurred_at ?? null, jam: null, dompet: s.dompet_nama?.trim() || '—', kategori: '',
      dibuatIso: null, diubahIso: null, dicatatPerangkatIso: null, adaCatatan: s.ada_catatan === true, masaDepan: false,
      cicilanKe: null, qty: null, hargaSatuan: null, hpp: null,
      dihapusOleh: s.dihapus_oleh ?? null, dihapusIso: s.dihapus_pada ?? null, dipulihkanIso: s.dipulihkan_pada ?? null,
      jejakJadwal: null,
    }
  }
  const t = d.transaksi as TransaksiRinciTxDTO
  const b = keTransaksiBaris(t)
  return {
    ...umum,
    sumber: 'transaksi', id: b.id, sampahId: null, ruangId: b.ruangId, pencatat: b.pencatat,
    jenis: b.jenis, arah: b.arah, nominal: b.nominal, tanggal: b.tanggal, jam: b.jam,
    dompet: b.dompet, kategori: b.kategori, dibuatIso: b.dibuatIso, diubahIso: b.diubahIso,
    dicatatPerangkatIso: t.dicatat_pada ?? null, adaCatatan: b.adaCatatan, masaDepan: b.masaDepan,
    cicilanKe: b.cicilanKe, qty: b.qty, hargaSatuan: angkaAtauNull(t.unit_price), hpp: angkaAtauNull(t.cost_at_sale),
    dihapusOleh: null, dihapusIso: null, dipulihkanIso: null,
    jejakJadwal: t.jejak_jadwal ?? null,
  }
}

// ── Teks bebas (T3): admin_teks (0090 §9) ────────────────────────────────
export const JENIS_TEKS = ['transaksi', 'struk', 'jejak', 'sampah', 'jadwal', 'lewati', 'stok', 'lampiran', 'pelunasan'] as const
export type JenisTeks = typeof JENIS_TEKS[number]
/** Batas p_ids per panggilan admin_teks. */
export const BATAS_TEKS = 100
/** Ranah T2 yang wajib ada di kasus INDUK untuk membuka teks jenis ini. */
export const RANAH_TEKS: Record<JenisTeks, readonly string[]> = {
  transaksi: ['transaksi'], struk: ['struk'], jejak: ['jejak'], sampah: ['transaksi', 'jejak'],
  jadwal: ['jadwal'], lewati: ['jadwal'], stok: ['usaha'], lampiran: ['lampiran'], pelunasan: ['dompet'],
}

/** Nilai kolom teks: teks, null, atau jsonb (peristiwa.selisih). */
export type NilaiTeksDTO = string | number | boolean | null | NilaiTeksDTO[] | { [k: string]: NilaiTeksDTO }
export interface TeksBarisDTO { id: string | number; [kolom: string]: NilaiTeksDTO }
export interface TeksDTO { jenis: string; baris: TeksBarisDTO[] }

/** Satu potong teks terbuka yang siap tampil: label kolom + isi. */
export interface PotongTeks { kolom: string; isi: string }

function teksNilai(v: NilaiTeksDTO): string {
  if (v == null) return ''
  if (typeof v === 'string') return v
  return JSON.stringify(v)
}

/** Baris admin_teks → potongan per id. `selisih` {kolom: [lama, baru]} dipecah
 *  per kolom supaya terbaca "kolom: lama → baru". Kolom kosong dilewati. */
export function keTeks(d: TeksDTO): Map<string, PotongTeks[]> {
  const hasil = new Map<string, PotongTeks[]>()
  for (const b of d.baris ?? []) {
    const potong: PotongTeks[] = []
    for (const [kolom, nilai] of Object.entries(b)) {
      if (kolom === 'id' || nilai == null || nilai === '') continue
      if (kolom === 'selisih' && typeof nilai === 'object' && !Array.isArray(nilai)) {
        for (const [k, v] of Object.entries(nilai)) {
          const pasang = Array.isArray(v) ? `${teksNilai(v[0] ?? null)} → ${teksNilai(v[1] ?? null)}` : teksNilai(v)
          potong.push({ kolom: `selisih.${k}`, isi: pasang })
        }
        continue
      }
      const isi = teksNilai(nilai)
      if (isi.trim()) potong.push({ kolom, isi })
    }
    hasil.set(String(b.id), potong)
  }
  return hasil
}

// ── Cari global: admin_cari_v2 (0094 §9 = admin_cari 0090 §10 + ruang) ────
export type HasilCariDTO =
  | { jenis: 'pengguna'; id: string; email: string | null }
  /** 0094: uuid / awalan uuid ruang. Nama & pemilik tersamar server; isi di balik kasus. */
  | { jenis: 'ruang'; id: string; nama: string | null; jenis_ruang: string | null; pemilik: string | null }
  | { jenis: 'transaksi'; id: string; pencatat: string | null }
  | { jenis: 'sampah'; id: string; sampah_id: string; pencatat: string | null }
export interface CariDTO { jenis_kueri: 'email' | 'uuid' | 'awalan'; jumlah: number; hasil: HasilCariDTO[] }
/** Batas hasil admin_cari_v2. */
export const BATAS_CARI = 20

/** Masukan yang dilayani server (selain itu 22023 kueri-tidak-didukung). */
export function bisaCariServer(q: string): boolean {
  const t = q.trim()
  if (!t || t.length > 254) return false
  if (t.includes('@')) return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)
  if (POLA_UUID.test(t)) return true
  return /^[0-9a-f-]+$/i.test(t) && t.replace(/-/g, '').length >= 8 && t.replace(/-/g, '').length <= 32
}

export interface HasilCari {
  kunci: string
  jenis: HasilCariDTO['jenis']
  id: string
  label: string
  /** Tujuan; null = tidak bisa dibuka (sampah tanpa pencatat). */
  ke: string | null
}

const AKAR = '/console/cashflow/pengguna'
const AKAR_RUANG = '/console/cashflow/ruang'
/** Hasil → rute: pengguna → kepala; ruang → kepala Ruang 360 (Fase 2);
 *  transaksi/sampah → laci di tab Transaksi pencatatnya (server tidak
 *  mengirim ruang transaksi di hasil cari; laci jatuh ke sampah bila id
 *  tidak hidup). */
export function keHasilCari(h: HasilCariDTO): HasilCari {
  if (h.jenis === 'pengguna') {
    return { kunci: `p-${h.id}`, jenis: 'pengguna', id: h.id, label: samarkanEmail(h.email), ke: `${AKAR}/${h.id}` }
  }
  if (h.jenis === 'ruang') {
    const pemilik = h.pemilik ? ` · ${samarkanEmail(h.pemilik)}` : ''
    return { kunci: `r-${h.id}`, jenis: 'ruang', id: h.id, label: `${h.nama || h.id.slice(0, 8)}${pemilik}`, ke: `${AKAR_RUANG}/${h.id}` }
  }
  const pencatat = h.pencatat
  return {
    kunci: `${h.jenis === 'sampah' ? 's' : 't'}-${h.id}`,
    jenis: h.jenis,
    id: h.id,
    label: h.id.slice(0, 8),
    ke: pencatat ? `${AKAR}/${pencatat}/transaksi?tx=${h.id}` : null,
  }
}

/** '3 Sep 2026 · 14.05' dari kolom date + time transaksi (tanpa zona: milik pengguna). */
export function tanggalJam(tanggal: string | null, jam: string | null, bahasa: BahasaWaktu = 'id'): string {
  const t = tanggalPendek(tanggal, bahasa)
  if (!jam) return t
  return `${t} · ${bahasa === 'en' ? jam : jam.replace(':', '.')}`
}
