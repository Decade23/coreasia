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
 * sudah tersamar; email utuh hanya datang lewat admin_buka_email (beraudit).
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
  jumlah_ruang: number
  jumlah_tx: number
  total_semua: number
}
export interface CorongDTO { urut: number; langkah: string; jumlah: number }
export interface KeberhasilanDTO { jumlah: number; pembanding: number; pengecualian: string[] }
export interface RetensiDTO { kohort: string; mendaftar: number; pernah_catat: number; catat_30hari: number; bulan_berjalan: boolean }
/** Nilai CHECK peristiwa.arah (M/0053:81). admin_aktivitas_pengguna meneruskan
 *  kolom itu apa adanya (M/0076:102) — Inggris, bukan 'masuk'/'keluar'. */
export const ARAH_PERISTIWA = ['income', 'expense'] as const
export type ArahPeristiwa = typeof ARAH_PERISTIWA[number]
export interface AktivitasDTO {
  jenis: string; judul?: string | null; nominal?: number | string | null; arah?: ArahPeristiwa | null
  tanggal: string; pada: string; pada_perangkat?: string | null; ruang?: string | null
  rentang_nominal?: string; ruang_pendek?: string
}
/** admin_baca_transaksi (M/0017:283-294): transaksi yang DICATAT p_user, terbaru dulu. */
export interface TransaksiLamaDTO {
  id: string; workspace: string; wallet: string; category: string; kind: string // 'income' | 'expense'
  amount: number | string; note: string | null; occurred_at: string; occurred_time: string | null; created_at: string
}
export interface RuangDTO {
  workspace_id: string; nama: string; pemilik_email: string; jumlah_anggota: number
  jumlah_tx: number; undangan_aktif: number; created_at: string; total_semua: number
}
/* Bentuk jsonb admin_detail_pengguna_bangun (M/0082:145-171). Dulu DTO ini
   mengharapkan angka di ruang[] — kolom yang tidak pernah dikirim server —
   sehingga ubin detail selalu 0. Angkanya ada di jumlah{}, dan itu jumlah
   yang DICATAT pengguna ini (t.user_id) di semua ruang, termasuk kaki
   transfer. Angka per ruang baru datang bersama admin_pengguna_360 (Fase 1). */
export interface DetailRuangDTO {
  workspace_id: string; nama: string; peran: string; pemilik: boolean; anggota: number
}
export interface JumlahPenggunaDTO {
  transaksi: number; pemasukan: number | string; pengeluaran: number | string; dompet: number; jadwal: number
}
export interface DetailPenggunaDTO {
  user_id: string; email: string; display_name: string | null; created_at: string
  last_sign_in: string | null; banned_until: string | null
  ruang: DetailRuangDTO[]
  jumlah: JumlahPenggunaDTO
}
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
  ruang: number
  tx: number
  status: 'aktif' | 'ditangguhkan'
  hariAktif: number         // aktivitas terakhir − daftar, dalam hari
  hariSejakAktif: number    // hari ini − aktivitas terakhir; Infinity bila belum pernah
}
export interface LangkahCorong { urut: number; kunci: string; jumlah: number; persenDariSebelumnya: number | null }
export interface SelKohort { kohort: string; mendaftar: number; pernahCatat: number; catat30: number; berjalan: boolean; persen: number }

export interface RuangPengguna {
  id: string
  nama: string
  peran: string
  pemilik: boolean
  anggota: number
  /* null = server belum mengirim angka per ruang; tampil "—", BUKAN 0. Nol
     yang palsu terbaca "orang ini tidak mencatat apa pun di ruang ini". */
  transaksi: number | null
  pemasukan: number | null
  pengeluaran: number | null
  dompet: number | null
  jadwal: number | null
}
export interface DetailPengguna {
  id: string
  email: string
  namaTampil: string        // '—' bila kosong
  daftarIso: string
  daftar: string            // 'DD Mon YYYY' (WIB)
  masukTerakhir: string
  ditangguhkan: boolean
  ruang: RuangPengguna[]
  /** Dicatat olehnya di semua ruang, termasuk kaki transfer (M/0082:163-168). */
  jumlah: { transaksi: number; pemasukan: number; pengeluaran: number; dompet: number; jadwal: number }
}
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
    ruang: Number(d.jumlah_ruang) || 0,
    tx: Number(d.jumlah_tx) || 0,
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

/** Detail satu orang. Angka ubin diambil dari jumlah{} server apa adanya;
 *  angka per ruang null sampai server mengirimnya (lihat DetailRuangDTO). */
export function keDetailPengguna(d: DetailPenggunaDTO, bahasa: BahasaWaktu = 'id'): DetailPengguna {
  const n = (v: number | string | null | undefined) => {
    const x = Number(v ?? 0)
    return Number.isFinite(x) ? x : 0
  }
  const j = d.jumlah
  return {
    id: d.user_id,
    email: d.email,
    namaTampil: d.display_name?.trim() || '—',
    daftarIso: d.created_at,
    daftar: tanggalPendek(d.created_at, bahasa),
    masukTerakhir: tanggalPendek(d.last_sign_in, bahasa),
    ditangguhkan: !!d.banned_until && new Date(d.banned_until).getTime() > Date.now(),
    ruang: (d.ruang ?? []).map(r => ({
      id: r.workspace_id, nama: r.nama, peran: r.peran, pemilik: !!r.pemilik, anggota: n(r.anggota),
      transaksi: null, pemasukan: null, pengeluaran: null, dompet: null, jadwal: null,
    })),
    jumlah: {
      transaksi: n(j?.transaksi), pemasukan: n(j?.pemasukan), pengeluaran: n(j?.pengeluaran),
      dompet: n(j?.dompet), jadwal: n(j?.jadwal),
    },
  }
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
