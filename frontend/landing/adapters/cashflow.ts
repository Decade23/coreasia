/**
 * Adapter modul CashFlow — DTO dari RPC Supabase → bentuk yang dibutuhkan UI.
 *
 * Fungsi MURNI semua: tanpa jaringan, tanpa state. Inilah satu-satunya tempat
 * pengetahuan "bentuk data server" hidup; komponen tidak pernah membaca DTO.
 *
 * PENYAMARAN EMAIL DI SINI, BUKAN DI KOMPONEN. Daftar pengguna wajib tersamar
 * secara bawaan (kebijakan privasi: pembukaan data pribadi harus beralasan dan
 * tercatat). Kalau penyamaran ada di komponen tabel, satu komponen baru yang
 * lupa menyamarkan = kebocoran. Di adapter, data yang sampai ke UI memang
 * sudah tersamar. Sejak Fase 0b (migrasi 0087/0088) server pun menyamarkan
 * sendiri, dan email utuh hanya datang lewat jalur beralasan yang menulis
 * audit: admin_daftar_pengguna_v2 dengan alasan (butuh cashflow:pii sejak
 * 0089), admin_config_buka, dan admin_pengguna_360 di balik kasus. Penyamaran
 * di sini tetap dijalankan sebagai sabuk kedua — samarkanEmail/
 * samarkanNamaRuang idempoten atas bentuk server.
 *
 * Fase 1 dipecah per domain: cashflowKasus.ts (kasus, riwayat akses, audit
 * v3), cashflowBuku.ts (kepala, 360, transaksi, laci, teks, cari), dan
 * cashflowJejak.ts. Bentuk RPC yang dicabut 0091 (detail_pengguna_v2,
 * aktivitas_pengguna, baca_transaksi_v2, baca_catatan_transaksi,
 * daftar_audit_v2) sudah tidak ada di sini.
 *
 * Waktu (WIB) hidup di cashflowWaktu.ts dan diekspor ulang dari sini, supaya
 * `import { tanggalPendek } from '~/adapters/cashflow'` yang lama tetap jalan.
 * adapters/ TIDAK di-auto-import Nuxt — selalu impor eksplisit.
 */
import { tanggalPendek, hariIniWib, geserHari, type BahasaWaktu } from './cashflowWaktu'

export {
  ZONA_WIB, BULAN, BULAN_EN, tanggalPendek, tanggalWib, hariIniWib, geserHari,
  jamWib, waktuPendekWib, keDatetimeLokalWib, dariDatetimeLokalWib,
} from './cashflowWaktu'
export type { BahasaWaktu } from './cashflowWaktu'

// ── DTO: persis seperti yang dipulangkan RPC ─────────────────────────────
export interface StatsDTO {
  total_pengguna: number
  total_ruang: number
  total_transaksi: number
  transaksi_per_hari: Array<{ tanggal: string; jumlah: number }>
}
export interface PenggunaDTO {
  user_id: string
  /** Tersamar oleh server (ded***@gmail.com) kecuali daftar dibuka dengan alasan. */
  email: string
  display_name: string | null
  created_at: string
  last_sign_in: string | null
  /** Terbaru antara masuk terakhir dan transaksi terakhir (0081). */
  aktivitas_terakhir?: string | null
  /** true = server memulangkan email utuh (daftar dibuka dengan alasan). */
  terbuka?: boolean
  banned_until: string | null
  /** null = sesi tanpa cashflow:pii (M/0089 §15 (d)): hitungan per orang yang
   *  di-poll bersama hitungan per ruang menyusun graf keanggotaan. */
  jumlah_ruang: number | null
  jumlah_tx: number | null
  total_semua: number
}
export interface CorongDTO { urut: number; langkah: string; jumlah: number }
/** Nilai jsonb apa adanya (app_config.value, admin_audit.detail, admin_config_buka). */
export type NilaiJson = string | number | boolean | null | NilaiJson[] | { [kunci: string]: NilaiJson }
/** admin_ukuran_keberhasilan_v2 (M/0087 §4) — satu baris. Tanpa daftar email:
 *  hanya BANYAKNYA email berbeda yang dikecualikan (daftar di Sakelar ∪ admin). */
export interface KeberhasilanDTO { jumlah: number; pembanding: number; jumlah_pengecualian: number }
export interface RetensiDTO { kohort: string; mendaftar: number; pernah_catat: number; catat_30hari: number; bulan_berjalan: boolean }
/** Nilai CHECK peristiwa.arah (M/0053:81). admin_aktivitas_pengguna meneruskan
 *  kolom itu apa adanya (M/0076:102) — Inggris, bukan 'masuk'/'keluar'. */
export const ARAH_PERISTIWA = ['income', 'expense'] as const
export type ArahPeristiwa = typeof ARAH_PERISTIWA[number]
/** admin_aktivitas_terbaru v1: sejak 0089 §20 `pada` dan `ruang_pendek` SELALU
 *  null (kolomnya tetap ada) — waktu presisi dan awalan workspace_id adalah
 *  kunci penggabung feed ↔ daftar tersamar. UI menulis '—'. */
export interface AktivitasDTO {
  jenis: string; judul?: string | null; nominal?: number | string | null; arah?: ArahPeristiwa | null
  tanggal: string; pada: string | null; pada_perangkat?: string | null; ruang?: string | null
  rentang_nominal?: string; ruang_pendek?: string | null
}
/** Nilai CHECK workspaces_jenis (M/0019:48) = penjaga p_jenis admin_daftar_ruang_v2. */
export const JENIS_RUANG = ['pribadi', 'usaha'] as const
export type JenisRuang = typeof JENIS_RUANG[number]
/** admin_daftar_ruang_v2 (M/0087 §5): nama dan pemilik SUDAH tersamar di server;
 *  pemilik null bila akunnya sudah tiada (left join). */
export interface RuangDTO {
  workspace_id: string; nama: string | null; pemilik_email: string | null; jenis: string
  /** Ketiga hitungan null untuk sesi tanpa cashflow:pii (M/0089 §15 (d)). */
  jumlah_anggota: number | null; jumlah_tx: number | null; undangan_aktif: number | null
  created_at: string; total_semua: number
}
/** admin_daftar_config_v2 (M/0087 §6). admin.pengecualian_email dikirim sebagai
 *  larik bentuk tersamar tanpa '@' ('ded*** · gmail.com'); nilai lain yang
 *  memuat '@' diganti penanda teks, begitu pula catatan. `tersamar` = baris ini
 *  bukan nilai aslinya dan TIDAK boleh disimpan balik. */
export interface ConfigDTO {
  key: string; value: NilaiJson; is_public: boolean; note: string | null
  updated_by: string | null; updated_at: string; tersamar: boolean
}
/** admin_audit.detail: selalu dibangun jsonb_build_object (atau null). Sengaja
 *  TIDAK rekursif seperti NilaiJson: ref<…[]> di halaman membuat UnwrapRef
 *  Vue menjelajahi tipe rekursif sampai TS2589. */
export type ObjekJson = { [kunci: string]: unknown }
/* Baris public.announcements apa adanya: admin_daftar_pengumuman memulangkan
   `setof public.announcements` (M/0022:36-45, 72-83) — nama kolom Inggris.
   Halaman dulu membaca judul/isi/mulai/sampai langsung dari jawaban ini,
   jadi judul kosong, waktu selalu "—", dan tombol Hentikan muncul juga di
   pengumuman yang sudah berakhir. */
export interface PengumumanDTO {
  id: string; title: string; body: string; level: string
  starts_at: string; ends_at: string | null; created_by: string | null; created_at: string
}
/* admin_kesehatan (M/0017:379-411). `tabel` adalah OBJEK jsonb_object_agg
   (nama tabel → {baris, ukuran}), bukan larik, dan kedua ukuran dalam BYTE
   (pg_database_size / pg_total_relation_size). DTO lama mengharapkan larik
   berteks siap tampil: kolom nama tabel kosong, kunci v-for ganda, dan
   ukuran tampil sebagai angka byte mentah. */
export interface KesehatanDTO {
  ukuran_db: number | string
  tabel: Record<string, { baris: number | string; ukuran: number | string }> | null
}

// ── Domain: yang dibutuhkan UI ───────────────────────────────────────────
export interface Pengguna {
  id: string
  emailTersamar: string
  /** Hanya terisi bila server memulangkan email utuh (daftar dibuka dengan alasan). */
  emailPenuh: string | null
  daftar: string            // 'DD Mon YYYY' (WIB)
  masukTerakhir: string     // 'DD Mon YYYY' | '—'
  aktivitasTerakhir: string // 'DD Mon YYYY' | '—'
  /* Nilai MENTAH untuk urut: teks tanggal 'DD Mon YYYY' tidak bisa diurutkan. */
  daftarIso: string
  masukTerakhirIso: string | null
  aktivitasTerakhirIso: string | null
  /** null = server tidak mengirim hitungan (sesi tanpa pii) — bukan 0. */
  ruang: number | null
  tx: number | null
  status: 'aktif' | 'ditangguhkan'
  hariAktif: number         // aktivitas terakhir − daftar, dalam hari
  hariSejakAktif: number    // hari ini − aktivitas terakhir; Infinity bila belum pernah
}
export interface LangkahCorong { urut: number; kunci: string; jumlah: number; persenDariSebelumnya: number | null }
export interface SelKohort { kohort: string; mendaftar: number; pernahCatat: number; catat30: number; berjalan: boolean; persen: number }

export type JedaCatatan = { satuan: 'menit' | 'jam' | 'hari'; n: number } | null
export type ArahUang = 'masuk' | 'keluar'
export interface TabelKesehatan { tabel: string; baris: number; ukuran: number }
export interface Kesehatan {
  ukuranDb: number | null   // byte; null bila server tidak mengirim angka
  tabel: TabelKesehatan[]   // terbesar dulu
}

/** Nilai yang diterima CHECK announcements.level dan admin_buat_pengumuman
 *  (M/0022:39, 106-108); label ID/EN-nya milik i18n (pengumuman.levelOpsi). */
export const LEVEL_PENGUMUMAN = ['info', 'warning', 'critical'] as const
export type LevelPengumuman = typeof LEVEL_PENGUMUMAN[number]
export interface Pengumuman {
  id: string
  judul: string
  isi: string
  level: string
  mulai: string             // ISO; diformat di halaman sesuai bahasa
  sampai: string | null     // null = tanpa akhir
  dibuat: string
}

export interface Keberhasilan { jumlah: number; pembanding: number; pengecualian: number }

export interface Ruang {
  id: string
  nama: string              // tersamar (server), '—' bila kosong
  pemilik: string           // tersamar (server), '—' bila akunnya sudah tiada
  jenis: JenisRuang | null  // null = nilai yang tidak dikenal
  /* null = server tidak mengirim hitungan (sesi tanpa pii) — bukan 0. */
  anggota: number | null
  tx: number | null
  undangan: number | null
  dibuatIso: string
}

export interface Config {
  kunci: string
  nilai: NilaiJson
  publik: boolean
  catatan: string | null
  diperbaruiIso: string
  tersamar: boolean
}

// ── Pembantu ─────────────────────────────────────────────────────────────
/** UUID utuh (pengguna, ruang, transaksi). Dipakai palet untuk mengenali tempelan. */
export const POLA_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** 'ded***@gmail.com' — paling banyak tiga aksara pertama dan selalu
 *  menyembunyikan minimal dua ('edi@x' → 'e***@x'); domain utuh. Aturannya
 *  SAMA dengan public.samar_email() di server (0082) supaya bentuk tersamar
 *  dari dua jalur identik, dan idempoten bila dipanggil pada yang sudah tersamar. */
export function samarkanEmail(email: string | null | undefined): string {
  if (!email || !email.includes('@')) return '—'
  const [lokal = '', domain = ''] = email.split('@')
  if (lokal.endsWith('***')) return email
  const tampak = Math.min(3, Math.max(1, lokal.length - 2))
  return `${lokal.slice(0, tampak)}***@${domain}`
}

/** Nama ruang buatan pengguna bisa memuat rahasia ("catatan rahasia", nama
 *  usaha). Hanya nama BAWAAN yang tampil apa adanya. */
const NAMA_BAWAAN = new Set(['Keuangan Saya', 'Bisnis', 'My Finances', 'Business'])
export function samarkanNamaRuang(nama: string | null | undefined): string {
  if (!nama) return '—'
  return NAMA_BAWAAN.has(nama) ? nama : `${nama.slice(0, 2)}${'·'.repeat(Math.min(6, Math.max(2, nama.length - 2)))}`
}

/** Rupiah tanpa desimal, pemisah ribuan titik. Nominal dari PostgREST bisa
 *  pulang sebagai STRING (numeric), jadi diterima keduanya. */
export function rupiah(v: number | string | null | undefined): string {
  const n = typeof v === 'string' ? Number(v) : (v ?? 0)
  if (!Number.isFinite(n)) return '—'
  const bulat = Math.round(Math.abs(n))
  const s = bulat.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `${n < 0 ? '−' : ''}Rp ${s}`
}

export function angka(v: number | string | null | undefined): string {
  const n = typeof v === 'string' ? Number(v) : (v ?? 0)
  return Number.isFinite(n) ? Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') : '—'
}

/** Byte → '1,6 MB' / '1.6 MB' (basis 1024). Satu desimal hanya di bawah 100
 *  satuan; tanda desimal mengikuti bahasa. Kosong/tak terbaca → '—', bukan
 *  "0 B" yang terbaca seolah tabelnya kosong. */
const SATUAN_BYTE = ['B', 'KB', 'MB', 'GB', 'TB']
export function ukuranByte(v: number | string | null | undefined, bahasa: BahasaWaktu = 'id'): string {
  const n = v == null || v === '' ? Number.NaN : Number(v)
  if (!Number.isFinite(n) || n < 0) return '—'
  let x = n
  let i = 0
  while (x >= 1024 && i < SATUAN_BYTE.length - 1) { x /= 1024; i++ }
  const desimal = i === 0 || x >= 100 ? 0 : 1
  const teks = new Intl.NumberFormat(bahasa === 'en' ? 'en-US' : 'id-ID', { maximumFractionDigits: desimal }).format(x)
  return `${teks} ${SATUAN_BYTE[i]}`
}

/** 'income'/'expense' (peristiwa.arah, transactions.kind) → arah domain.
 *  Selainnya null → nada netral: tanpa arah, warna merah akan terbaca
 *  "pengeluaran" (nominal tampil tanpa tanda). */
export function keArahUang(v: string | null | undefined): ArahUang | null {
  return v === 'income' ? 'masuk' : v === 'expense' ? 'keluar' : null
}

// ── Konversi ─────────────────────────────────────────────────────────────
export function kePengguna(d: PenggunaDTO, bahasa: BahasaWaktu = 'id'): Pengguna {
  const daftar = new Date(d.created_at)
  const aktifIso = d.aktivitas_terakhir ?? d.last_sign_in
  const aktif = aktifIso ? new Date(aktifIso) : null
  const hariAktif = aktif ? Math.max(0, Math.round((aktif.getTime() - daftar.getTime()) / 864e5)) : 0
  const hariSejakAktif = aktif ? Math.max(0, Math.round((Date.now() - aktif.getTime()) / 864e5)) : Number.POSITIVE_INFINITY
  const ditangguhkan = !!d.banned_until && new Date(d.banned_until).getTime() > Date.now()
  // Server yang menyamarkan dan server pula yang bilang (kolom `terbuka`);
  // tebakan lewat '***' hanya cadangan untuk respons tanpa kolom itu.
  const terbuka = d.terbuka === true || (d.terbuka === undefined && !!d.email && !d.email.includes('***'))
  return {
    id: d.user_id,
    emailTersamar: samarkanEmail(d.email),
    emailPenuh: terbuka ? d.email : null,
    daftar: tanggalPendek(d.created_at, bahasa),
    masukTerakhir: tanggalPendek(d.last_sign_in, bahasa),
    aktivitasTerakhir: tanggalPendek(aktifIso, bahasa),
    daftarIso: d.created_at,
    masukTerakhirIso: d.last_sign_in,
    aktivitasTerakhirIso: aktifIso ?? null,
    ruang: angkaAtauNull(d.jumlah_ruang),
    tx: angkaAtauNull(d.jumlah_tx),
    status: ditangguhkan ? 'ditangguhkan' : 'aktif',
    hariAktif,
    hariSejakAktif,
  }
}

/** Persen dihitung terhadap PENDAFTAR (langkah 1), bukan langkah sebelumnya:
 *  langkah-langkah corong dihitung masing-masing, tidak bersarang (0083), jadi
 *  "menyiapkan" bisa lebih besar dari "masuk lagi" dan persen 113% hanya
 *  membingungkan. "Berapa persen pendaftar yang sampai ke sini" selalu jujur. */
export function keCorong(rows: CorongDTO[]): LangkahCorong[] {
  const urut = [...rows].sort((a, b) => a.urut - b.urut)
  const dasar = Number(urut[0]?.jumlah ?? 0)
  return urut.map((r, i) => {
    const j = Number(r.jumlah)
    return {
      urut: r.urut, kunci: r.langkah, jumlah: j,
      persenDariSebelumnya: i === 0 ? null : dasar === 0 ? 0 : Math.round((j / dasar) * 100),
    }
  })
}

export function keKohort(rows: RetensiDTO[]): SelKohort[] {
  return rows.map(r => ({
    kohort: r.kohort,
    mendaftar: Number(r.mendaftar), pernahCatat: Number(r.pernah_catat), catat30: Number(r.catat_30hari),
    berjalan: !!r.bulan_berjalan,
    persen: Number(r.mendaftar) ? Math.round((Number(r.catat_30hari) / Number(r.mendaftar)) * 100) : 0,
  }))
}

/** Sparkline dari transaksi_per_hari — pastikan 30 hari terisi (hari tanpa
 *  transaksi = 0), supaya garisnya jujur tentang hari-hari sepi. Hari = hari
 *  WIB: `tanggal` adalah kolom date milik pengguna, jadi "hari ini" pun harus
 *  hari ini di Jakarta — dengan hari UTC, pukul 00:00–06:59 WIB transaksi hari
 *  ini hilang dari ujung grafik. */
export function keSeri30Hari(rows: StatsDTO['transaksi_per_hari'], sekarang: Date = new Date()): number[] {
  const peta = new Map(rows.map(r => [r.tanggal.slice(0, 10), Number(r.jumlah)]))
  const hariIni = hariIniWib(sekarang)
  const hasil: number[] = []
  for (let i = 29; i >= 0; i--) hasil.push(peta.get(geserHari(hariIni, -i)) ?? 0)
  return hasil
}

/** Jeda daftar → catatan pertama sebagai angka + satuan; kalimatnya milik
 *  i18n (pengguna.jeda*). null = belum pernah mencatat. */
export function jedaDaftarKeCatatan(daftarIso: string, catatanPertamaIso: string | null | undefined): JedaCatatan {
  if (!catatanPertamaIso) return null
  const menit = Math.max(0, Math.round((new Date(catatanPertamaIso).getTime() - new Date(daftarIso).getTime()) / 6e4))
  if (menit < 60) return { satuan: 'menit', n: menit }
  if (menit < 60 * 48) return { satuan: 'jam', n: Math.round(menit / 60) }
  return { satuan: 'hari', n: Math.round(menit / 1440) }
}

/** Objek per nama tabel → larik, TERBESAR dulu: halaman ini dibuka saat ada
 *  keluhan, dan yang dicari adalah tabel yang membengkak. */
export function keKesehatan(d: KesehatanDTO): Kesehatan {
  const db = d.ukuran_db == null || d.ukuran_db === '' ? Number.NaN : Number(d.ukuran_db)
  const tabel = Object.entries(d.tabel ?? {})
    .map(([nama, t]) => ({ tabel: nama, baris: Number(t?.baris) || 0, ukuran: Number(t?.ukuran) || 0 }))
    .sort((a, b) => b.ukuran - a.ukuran || a.tabel.localeCompare(b.tabel))
  return { ukuranDb: Number.isFinite(db) ? db : null, tabel }
}

export function kePengumuman(d: PengumumanDTO): Pengumuman {
  return {
    id: d.id, judul: d.title ?? '', isi: d.body ?? '', level: d.level,
    mulai: d.starts_at, sampai: d.ends_at ?? null, dibuat: d.created_at,
  }
}

/** Belum berakhir = masih bisa dihentikan. Server tidak mengubah apa pun
 *  (dan tidak menulis audit) untuk pengumuman yang sudah berakhir, jadi
 *  tombolnya tidak boleh tampil untuk yang itu. */
export function pengumumanBelumBerakhir(p: Pengumuman, sekarang: number = Date.now()): boolean {
  if (!p.sampai) return true
  const t = new Date(p.sampai).getTime()
  return Number.isFinite(t) && t > sekarang
}

/** Sidik 10 aksara hex (sha256) — nilai BURAM untuk URL. Email pelaku audit
 *  tidak ditulis mentah ke ?pelaku=: URL yang dimuat penuh tercatat di riwayat
 *  peramban dan log Vercel, dan ikut terbawa ke ?ke= saat sambung ulang.
 *  Dinormalkan (trim + huruf kecil) supaya dua ejaan satu alamat bersidik sama.
 *  Butuh crypto.subtle (konteks aman: https atau localhost). */
export async function sidik(teks: string): Promise<string> {
  const data = new TextEncoder().encode(teks.trim().toLowerCase())
  const hash = await globalThis.crypto.subtle.digest('SHA-256', data)
  return [...new Uint8Array(hash)].map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 10)
}
export const POLA_SIDIK = /^[0-9a-f]{10}$/

// ── Fase 0b: jawaban RPC v2 (M/0087) ─────────────────────────────────────
const angkaAtauNol = (v: number | string | null | undefined): number => {
  const x = Number(v ?? 0)
  return Number.isFinite(x) ? x : 0
}
/** Hitungan yang server boleh tahan (null untuk sesi tanpa pii, M/0089 §15 (d)):
 *  null tetap null supaya tabel menulis '-', bukan "0" yang terbaca sebagai fakta. */
const angkaAtauNull = (v: number | string | null | undefined): number | null => {
  if (v == null || v === '') return null
  const x = Number(v)
  return Number.isFinite(x) ? x : null
}

/** admin_ukuran_keberhasilan_v2 memulangkan SATU baris (returns table); tanpa baris → null. */
export function keKeberhasilan(d: KeberhasilanDTO | null | undefined): Keberhasilan | null {
  if (!d) return null
  return { jumlah: angkaAtauNol(d.jumlah), pembanding: angkaAtauNol(d.pembanding), pengecualian: angkaAtauNol(d.jumlah_pengecualian) }
}

const JENIS_RUANG_SET: ReadonlySet<string> = new Set(JENIS_RUANG)
export function keRuang(d: RuangDTO): Ruang {
  return {
    id: d.workspace_id,
    // Server sudah menyamarkan; keduanya idempoten atas bentuk server.
    nama: samarkanNamaRuang(d.nama),
    pemilik: samarkanEmail(d.pemilik_email),
    jenis: JENIS_RUANG_SET.has(d.jenis) ? (d.jenis as JenisRuang) : null,
    anggota: angkaAtauNull(d.jumlah_anggota),
    tx: angkaAtauNull(d.jumlah_tx),
    undangan: angkaAtauNull(d.undangan_aktif),
    dibuatIso: d.created_at,
  }
}

/** Kunci daftar email yang dikecualikan dari ukuran keberhasilan (M/0087 §6). */
export const KUNCI_PENGECUALIAN = 'admin.pengecualian_email'

export function keConfig(d: ConfigDTO): Config {
  return {
    kunci: d.key, nilai: d.value, publik: !!d.is_public, catatan: d.note ?? null,
    diperbaruiIso: d.updated_at, tersamar: d.tersamar === true,
  }
}

/** Larik teks dari nilai jsonb; bukan larik → []. */
export function daftarTeks(v: NilaiJson | undefined): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []
}

/** Nilai UTUH admin.pengecualian_email (dari admin_config_buka) → draf.
 *  `asing` = yang tersimpan BUKAN larik teks murni (bukan larik, atau ada
 *  entri bukan teks — admin-next bisa menulis JSON apa pun ke kunci ini).
 *  Draf hanya memuat teksnya, jadi menyimpannya membuang sisanya: halaman
 *  wajib memperingatkan dan meminta persetujuan dulu. */
export function bacaDaftarEmail(v: NilaiJson | undefined): { daftar: string[]; asing: boolean } {
  const daftar = daftarTeks(v)
  return { daftar, asing: !Array.isArray(v) || daftar.length !== v.length }
}

/** Keadaan daftar pengecualian dari admin_daftar_config_v2 (bentuk tersamar):
 *  'tiada'  kunci belum ada;
 *  'kosong' larik kosong — server memetakan entri satu-satu, jadi nilai
 *           utuhnya pasti [] juga: tidak ada yang perlu dibuka dengan alasan;
 *  'isi'    larik berisi (tersamar);
 *  'lain'   bukan larik — isinya tidak diketahui sampai dibuka. */
export type KeadaanPengecualian = 'tiada' | 'kosong' | 'isi' | 'lain'
export function keadaanPengecualian(baris: Pick<Config, 'nilai'> | null | undefined): KeadaanPengecualian {
  if (!baris) return 'tiada'
  if (!Array.isArray(baris.nilai)) return 'lain'
  return baris.nilai.length ? 'isi' : 'kosong'
}

/** Penanda tersamar yang DITOLAK admin_set_config (22023 nilai-tersamar, M/0087
 *  §7a). Diperiksa di sini juga supaya admin tidak menunggu jaringan untuk
 *  tahu bahwa yang di tangannya bentuk tersamar — penentunya tetap server. */
export const PENANDA_NILAI_TERSAMAR = '(tersamar; buka dengan alasan)'
export function nilaiMasihTersamar(kunci: string, nilai: NilaiJson): boolean {
  const teks = JSON.stringify(nilai) ?? ''
  return (kunci.trim() === KUNCI_PENGECUALIAN && teks.includes('***')) || teks.includes(PENANDA_NILAI_TERSAMAR)
}

export type GalatEmailPengecualian = 'bukan-email' | 'tersamar' | 'ganda'
/** Email baru untuk daftar pengecualian. Bentuk tersamar ('ded***@…',
 *  'ded*** · gmail.com') bukan email — menyimpannya menambah entri yang tidak
 *  pernah cocok dengan siapa pun, dan server menolak '***' pada kunci ini. */
export function periksaEmailPengecualian(email: string, daftar: readonly string[]): GalatEmailPengecualian | null {
  const e = email.trim().toLowerCase()
  if (e.includes('***') || e.includes('·')) return 'tersamar'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return 'bukan-email'
  if (daftar.some(x => x.trim().toLowerCase() === e)) return 'ganda'
  return null
}
