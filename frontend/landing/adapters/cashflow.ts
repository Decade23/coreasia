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
 */

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
  banned_until: string | null
  jumlah_ruang: number
  jumlah_tx: number
  total_semua: number
}
export interface CorongDTO { urut: number; langkah: string; jumlah: number }
export interface KeberhasilanDTO { jumlah: number; pembanding: number; pengecualian: string[] }
export interface RetensiDTO { kohort: string; mendaftar: number; pernah_catat: number; catat_30hari: number; bulan_berjalan: boolean }
export interface AktivitasDTO {
  jenis: string; judul?: string | null; nominal?: number | string | null; arah?: string | null
  tanggal: string; pada: string; pada_perangkat?: string | null; ruang?: string | null
  rentang_nominal?: string; ruang_pendek?: string
}
export interface RuangDTO {
  workspace_id: string; nama: string; pemilik_email: string; jumlah_anggota: number
  jumlah_tx: number; undangan_aktif: number; created_at: string; total_semua: number
}
export interface DetailRuangDTO {
  workspace_id: string; nama: string; peran: string; pemilik: boolean; anggota: number
  transaksi: number; pemasukan: number | string; pengeluaran: number | string; dompet: number; jadwal: number
}
export interface DetailPenggunaDTO {
  user_id: string; email: string; display_name: string | null; created_at: string
  last_sign_in: string | null; banned_until: string | null; ruang: DetailRuangDTO[]
}

// ── Domain: yang dibutuhkan UI ───────────────────────────────────────────
export interface Pengguna {
  id: string
  emailTersamar: string
  /** Hanya terisi bila server memulangkan email utuh (daftar dibuka dengan alasan). */
  emailPenuh: string | null
  daftar: string            // 'DD Mon YYYY'
  masukTerakhir: string     // 'DD Mon YYYY' | '—'
  aktivitasTerakhir: string // 'DD Mon YYYY' | '—'
  ruang: number
  tx: number
  status: 'aktif' | 'ditangguhkan'
  hariAktif: number         // aktivitas terakhir − daftar, dalam hari
}
export interface LangkahCorong { urut: number; kunci: string; jumlah: number; persenDariSebelumnya: number | null }
export interface SelKohort { kohort: string; mendaftar: number; pernahCatat: number; catat30: number; berjalan: boolean; persen: number }

// ── Pembantu ─────────────────────────────────────────────────────────────
const BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']

/** '2026-09-03T14:00:00Z' → '3 Sep 2026'. Null/kosong → '—'. */
export function tanggalPendek(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return `${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}`
}

/** 'ded***@gmail.com' — tiga aksara pertama, domain utuh. Domain bukan PII
 *  yang berarti (gmail.com), dan tiga aksara cukup untuk membedakan baris. */
export function samarkanEmail(email: string | null | undefined): string {
  if (!email || !email.includes('@')) return '—'
  const [lokal, domain] = email.split('@')
  return `${lokal.slice(0, 3)}***@${domain}`
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

// ── Konversi ─────────────────────────────────────────────────────────────
export function kePengguna(d: PenggunaDTO): Pengguna {
  const daftar = new Date(d.created_at)
  const aktifIso = d.aktivitas_terakhir ?? d.last_sign_in
  const aktif = aktifIso ? new Date(aktifIso) : null
  const hariAktif = aktif ? Math.max(0, Math.round((aktif.getTime() - daftar.getTime()) / 864e5)) : 0
  const ditangguhkan = !!d.banned_until && new Date(d.banned_until).getTime() > Date.now()
  // Server yang menyamarkan; '***' berarti tersamar. samarkanEmail pada email
  // yang sudah tersamar memulangkan bentuk yang sama, jadi aman dipanggil ganda.
  const terbuka = !!d.email && !d.email.includes('***')
  return {
    id: d.user_id,
    emailTersamar: samarkanEmail(d.email),
    emailPenuh: terbuka ? d.email : null,
    daftar: tanggalPendek(d.created_at),
    masukTerakhir: tanggalPendek(d.last_sign_in),
    aktivitasTerakhir: tanggalPendek(aktifIso),
    ruang: Number(d.jumlah_ruang) || 0,
    tx: Number(d.jumlah_tx) || 0,
    status: ditangguhkan ? 'ditangguhkan' : 'aktif',
    hariAktif,
  }
}

export function keCorong(rows: CorongDTO[]): LangkahCorong[] {
  const urut = [...rows].sort((a, b) => a.urut - b.urut)
  return urut.map((r, i) => {
    const sebelum = i === 0 ? null : Number(urut[i - 1].jumlah)
    const j = Number(r.jumlah)
    return {
      urut: r.urut, kunci: r.langkah, jumlah: j,
      persenDariSebelumnya: sebelum == null ? null : sebelum === 0 ? 0 : Math.round((j / sebelum) * 100),
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
 *  transaksi = 0), supaya garisnya jujur tentang hari-hari sepi. */
export function keSeri30Hari(rows: StatsDTO['transaksi_per_hari']): number[] {
  const peta = new Map(rows.map(r => [r.tanggal.slice(0, 10), Number(r.jumlah)]))
  const hasil: number[] = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date(); d.setUTCDate(d.getUTCDate() - i)
    hasil.push(peta.get(d.toISOString().slice(0, 10)) ?? 0)
  }
  return hasil
}

/** "Mencatat pertama kali 7 jam setelah daftar" — atau "Belum pernah mencatat". */
export function jedaDaftarKeCatatan(daftarIso: string, catatanPertamaIso: string | null | undefined): string {
  if (!catatanPertamaIso) return 'Belum pernah mencatat'
  const menit = Math.round((new Date(catatanPertamaIso).getTime() - new Date(daftarIso).getTime()) / 6e4)
  if (menit < 60) return `Mencatat pertama kali ${menit} menit setelah daftar`
  if (menit < 60 * 48) return `Mencatat pertama kali ${Math.round(menit / 60)} jam setelah daftar`
  return `Mencatat pertama kali ${Math.round(menit / 1440)} hari setelah daftar`
}
