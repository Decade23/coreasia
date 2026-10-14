/**
 * Hapus akun bertahap: permintaan dari aplikasi → antrean console → admin
 * menghapus permanen atau membatalkan.
 *
 * Sejak migrasi 0112, "Hapus akun" di aplikasi tidak lagi menghapus apa pun.
 * Akunnya ditandai menunggu, pemiliknya keluar dan tidak bisa masuk lagi,
 * lalu permintaannya muncul di halaman console Hapus akun. Data, buku, foto
 * struk, dan lampiran baru hilang saat admin menekan Hapus permanen.
 *
 * KONTRAK RPC (dibandingkan dengan migrasi oleh tests/cashflow/hapus-akun.test.ts):
 * - admin_hapus_akun_daftar(p_status, p_batas)  returns table, izin view,
 *   email selalu tersamar (kolom email_samar).
 * - admin_hapus_akun_permanen(p_permintaan, p_alasan) returns jsonb, izin
 *   tindak; jawaban `hasil`: dihapus | sudah_selesai | sudah_dibatalkan |
 *   sudah_tiada. Pemilik buku bersama beranggota → P0001 hint
 *   alihkan-kepemilikan (penjaga yang sama dengan aplikasi).
 * - admin_hapus_akun_batalkan(p_permintaan, p_alasan) returns jsonb, izin
 *   tindak; `hasil`: dibatalkan | sudah_selesai | sudah_dibatalkan.
 *
 * TANPA KOLOM ALASAN. Kedua aksi satu konfirmasi; p_alasan diisi otomatis di
 * sini (menamai tindakannya + id permintaan), rpc() menambahkan email pelaku.
 *
 * Fungsi MURNI semua: tanpa jaringan, tanpa state.
 */
import { samarkanEmail } from './cashflow'

/** Nilai status permintaan (CHECK hapus_akun_permintaan.status) = filter halaman. */
export const STATUS_HAPUS = ['menunggu', 'selesai', 'dibatalkan'] as const
export type StatusHapus = typeof STATUS_HAPUS[number]
/** Jalur masuknya permintaan: tombol di aplikasi, atau staf atas permintaan email. */
export const LEWAT_HAPUS = ['aplikasi', 'surel'] as const
export type LewatHapus = typeof LEWAT_HAPUS[number]

/** Pengingat internal (keputusan P4): menunggu lebih dari 7 hari ditandai merah.
 *  Tidak ada hapus otomatis. */
export const BATAS_HARI_MENUNGGU = 7
/** p_batas yang dikirim — sama dengan bawaan server. */
export const BATAS_DAFTAR_HAPUS = 100

// ── DTO: persis seperti yang dipulangkan RPC ─────────────────────────────
/** Satu baris admin_hapus_akun_daftar. Angka bisa pulang sebagai string (bigint). */
export interface HapusAkunDTO {
  id: string
  user_id: string
  email_samar: string | null
  /** Nama tampilan; null bila profilnya sudah tiada (permintaan selesai). */
  nama: string | null
  diminta_pada: string
  lewat: string
  status: string
  /** Waktu hapus permanen; null selama menunggu atau bila dibatalkan. */
  selesai_pada: string | null
  jumlah_buku_milik: number | string | null
  jumlah_buku_anggota: number | string | null
  jumlah_transaksi: number | string | null
  jumlah_foto: number | string | null
  /** Masih memiliki buku bersama yang beranggota orang lain (hapus permanen akan ditolak). */
  tertahan: boolean | null
  /** Antrean penyapu foto sesudah hapus permanen. */
  foto_menunggu: number | string | null
  foto_gagal: number | string | null
}

export const HASIL_HAPUS = ['dihapus', 'dibatalkan', 'sudah_selesai', 'sudah_dibatalkan', 'sudah_tiada'] as const
export type HasilHapus = typeof HASIL_HAPUS[number]
/** Jawaban admin_hapus_akun_permanen / admin_hapus_akun_batalkan. */
export interface HasilHapusDTO {
  hasil: string
  permintaan: string
  /** Hanya hapus permanen: jumlah foto yang masuk antrean penyapu. */
  foto_antre?: number | string | null
}

// ── Domain ───────────────────────────────────────────────────────────────
export type KeadaanFoto = 'tersimpan' | 'menunggu' | 'gagal' | 'bersih'
export interface PermintaanHapus {
  id: string
  userId: string
  emailTersamar: string
  nama: string | null
  status: StatusHapus | null
  lewat: LewatHapus | null
  dimintaIso: string
  selesaiIso: string | null
  /** Hari utuh sejak diminta (0 = hari ini). */
  umurHari: number
  /** Menunggu lebih dari BATAS_HARI_MENUNGGU hari. */
  lewatBatas: boolean
  bukuMilik: number | null
  bukuAnggota: number | null
  transaksi: number | null
  foto: number | null
  tertahan: boolean
  fotoMenunggu: number
  fotoGagal: number
  keadaanFoto: KeadaanFoto
  /** Pengguna 360 selama akunnya masih ada; null sesudah dihapus permanen. */
  ke360: string | null
}

const angkaAtauNull = (v: number | string | null | undefined): number | null => {
  if (v == null || v === '') return null
  const x = Number(v)
  return Number.isFinite(x) ? x : null
}
const pilihan = <T extends string>(daftar: readonly T[], v: unknown): T | null =>
  (daftar as readonly unknown[]).includes(v) ? (v as T) : null

/** Selama menunggu dan sesudah dibatalkan fotonya masih di penyimpanan; sesudah
 *  hapus permanen, yang gagal disapu didahulukan dari yang masih antre. */
export function keadaanFoto(status: StatusHapus | null, menunggu: number, gagal: number): KeadaanFoto {
  if (status !== 'selesai') return 'tersimpan'
  if (gagal > 0) return 'gagal'
  if (menunggu > 0) return 'menunggu'
  return 'bersih'
}

export function kePermintaanHapus(d: HapusAkunDTO, sekarang: number = Date.now()): PermintaanHapus {
  const status = pilihan(STATUS_HAPUS, d.status)
  const diminta = Date.parse(d.diminta_pada)
  const umurMs = Number.isFinite(diminta) ? Math.max(0, sekarang - diminta) : 0
  const fotoMenunggu = angkaAtauNull(d.foto_menunggu) ?? 0
  const fotoGagal = angkaAtauNull(d.foto_gagal) ?? 0
  return {
    id: d.id,
    userId: d.user_id,
    // Server sudah menyamarkan; samarkanEmail idempoten atas bentuk server.
    emailTersamar: samarkanEmail(d.email_samar),
    nama: d.nama?.trim() || null,
    status,
    lewat: pilihan(LEWAT_HAPUS, d.lewat),
    dimintaIso: d.diminta_pada,
    selesaiIso: d.selesai_pada ?? null,
    umurHari: Math.floor(umurMs / 864e5),
    lewatBatas: status === 'menunggu' && umurMs > BATAS_HARI_MENUNGGU * 864e5,
    bukuMilik: angkaAtauNull(d.jumlah_buku_milik),
    bukuAnggota: angkaAtauNull(d.jumlah_buku_anggota),
    transaksi: angkaAtauNull(d.jumlah_transaksi),
    foto: angkaAtauNull(d.jumlah_foto),
    tertahan: d.tertahan === true,
    fotoMenunggu,
    fotoGagal,
    keadaanFoto: keadaanFoto(status, fotoMenunggu, fotoGagal),
    ke360: status === 'selesai' ? null : `/console/cashflow/pengguna/${d.user_id}`,
  }
}

/** Menunggu: yang paling lama di atas (paling mendesak). Selesai/dibatalkan:
 *  terbaru dulu. Seri diurutkan id supaya urutan tidak melompat saat dimuat ulang. */
export function urutPermintaan(daftar: readonly PermintaanHapus[], status: StatusHapus): PermintaanHapus[] {
  const waktu = (p: PermintaanHapus) => Date.parse((status === 'selesai' && p.selesaiIso) || p.dimintaIso) || 0
  const arah = status === 'menunggu' ? 1 : -1
  return [...daftar].sort((a, b) => (waktu(a) - waktu(b)) * arah || a.id.localeCompare(b.id))
}

/** Ringkasan isi akun untuk kartu dan konfirmasi. Yang dilewati: hitungan
 *  yang ditahan server (null, bukan 0) dan hitungan 0 ("anggota di 0 ruang"
 *  hanya mengganggu). Bedakan kosong karena ditahan dan kosong karena
 *  akunnya memang tanpa isi lewat isiDitahan. */
export const BAGIAN_ISI = ['ruangMilik', 'ruangAnggota', 'transaksi', 'foto'] as const
export type BagianIsi = typeof BAGIAN_ISI[number]
export function bagianIsi(p: Pick<PermintaanHapus, 'bukuMilik' | 'bukuAnggota' | 'transaksi' | 'foto'>): Array<{ kunci: BagianIsi; n: number }> {
  const nilai: Record<BagianIsi, number | null> = { ruangMilik: p.bukuMilik, ruangAnggota: p.bukuAnggota, transaksi: p.transaksi, foto: p.foto }
  return BAGIAN_ISI.flatMap(kunci => (nilai[kunci] === null || nilai[kunci] === 0 ? [] : [{ kunci, n: nilai[kunci]! }]))
}
/** Semua hitungan ditahan server (sesi tanpa izin yang membukanya). */
export const isiDitahan = (p: Pick<PermintaanHapus, 'bukuMilik' | 'bukuAnggota' | 'transaksi' | 'foto'>): boolean =>
  p.bukuMilik === null && p.bukuAnggota === null && p.transaksi === null && p.foto === null

/** Id akun yang permintaannya masih menunggu — untuk badge di daftar pengguna. */
export function idMenungguHapus(daftar: readonly HapusAkunDTO[]): Set<string> {
  return new Set(daftar.filter(d => d.status === 'menunggu').map(d => d.user_id))
}

/**
 * Tombol Hapus permanen dan Batalkan pada satu kartu.
 * - hanya permintaan yang masih menunggu yang punya tombol;
 * - tanpa cashflow:tindak (super admin ber-TOTP, keputusan P3) tombolnya
 *   tampil tapi mati, dan halaman menjelaskan lewat CashflowIzinKurang.
 * `bolehTindak` hanya petunjuk tampilan (useCashflowSesi().boleh); yang
 * memutuskan tetap server (42501 izin-kurang).
 */
export interface AksiPermintaan { tampil: boolean; aktif: boolean; sebab: 'izin' | null }
export function aksiPermintaan(p: Pick<PermintaanHapus, 'status'>, bolehTindak: boolean): AksiPermintaan {
  if (p.status !== 'menunggu') return { tampil: false, aktif: false, sebab: null }
  return bolehTindak ? { tampil: true, aktif: true, sebab: null } : { tampil: true, aktif: false, sebab: 'izin' }
}

/** p_alasan otomatis (bahasa Indonesia apa pun bahasa layar; masuk audit). */
export const alasanHapusOtomatis = (id: string) => `Hapus permanen atas permintaan pengguna · ${id}`
export const alasanBatalOtomatis = (id: string) => `Batalkan permintaan hapus akun · ${id}`

/** Jawaban aksi → kunci kalimat. Bentuk yang tidak dikenal tetap dianggap
 *  berhasil (server tidak melempar galat), tapi kalimatnya umum. */
export function keHasilHapus(d: unknown): HasilHapus | 'lain' {
  const hasil = d && typeof d === 'object' ? (d as { hasil?: unknown }).hasil : undefined
  return pilihan(HASIL_HAPUS, hasil) ?? 'lain'
}

/** Galat aksi → cara halaman menjawabnya.
 *  'tertahan'    P0001 alihkan-kepemilikan: ditulis di kartunya, bahasa awam;
 *  'izin'        42501 izin-kurang: CashflowIzinKurang di atas daftar;
 *  'belum-aktif' 42883/PGRST202: migrasi 0112 belum terpasang;
 *  'lain'        sisanya (toast dari useCashflowMuat). */
export function jenisGagalHapus(g: { jenis: string; hint?: string }): 'tertahan' | 'izin' | 'belum-aktif' | 'lain' {
  if (g.hint === 'alihkan-kepemilikan') return 'tertahan'
  if (g.jenis === 'izin') return 'izin'
  if (g.jenis === 'belum-aktif') return 'belum-aktif'
  return 'lain'
}
