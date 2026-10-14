/**
 * Hapus akun bertahap: permintaan dari aplikasi → antrean console → admin
 * menghapus permanen atau membatalkan.
 *
 * Sejak migrasi 0112, "Hapus akun" di aplikasi tidak lagi menghapus apa pun.
 * Akunnya ditandai menunggu, pemiliknya keluar dan tidak bisa masuk lagi,
 * lalu permintaannya muncul di halaman console Hapus akun. Data, buku, foto
 * struk, dan lampiran baru hilang saat admin menekan Hapus permanen.
 *
 * KONTRAK RPC 0112 (dibandingkan dengan migrasi oleh tests/cashflow/hapus-akun.test.ts):
 * - admin_hapus_akun_daftar(p_status, p_batas) returns jsonb
 *   {status, batas, jumlah: {menunggu, selesai, dibatalkan}, baris: [...]}.
 *   Izin view, email selalu tersamar, nama hanya untuk sesi ber-pii. `isi`
 *   = hitungan sekarang selama menunggu, ringkasan yang dibekukan saat
 *   selesai. Server juga menghitung umur_hari dan lewat_7_hari.
 * - admin_hapus_akun_permanen(p_permintaan, p_alasan) returns jsonb, izin
 *   tindak; `status`: selesai (+ sudah_tiada, foto_antre) | sudah_selesai |
 *   sudah_dibatalkan | tidak_ada. Pemilik buku bersama beranggota → P0001
 *   hint alihkan-kepemilikan (penjaga yang sama dengan aplikasi).
 * - admin_hapus_akun_batalkan(p_permintaan, p_alasan) returns jsonb, izin
 *   tindak; `status`: dibatalkan (+ buka_blokir) | sudah_selesai |
 *   sudah_dibatalkan | tidak_ada.
 * - Jawaban "sudah_*" dan "tidak_ada" dipulangkan sebelum audit: server tidak
 *   mengubah apa pun, console cukup memuat ulang daftar.
 *
 * TANPA KOLOM ALASAN. Kedua aksi satu konfirmasi; p_alasan diisi otomatis di
 * sini (menamai tindakannya + id permintaan), rpc() menambahkan email pelaku.
 *
 * Istilah: "buku" di server = "ruang" di console.
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
 *  Tidak ada hapus otomatis. Server juga mengirim lewat_7_hari; ini cadangannya. */
export const BATAS_HARI_MENUNGGU = 7
/** p_batas halaman untuk selesai dan dibatalkan (bawaan server; server menjepit 1..500). */
export const BATAS_DAFTAR_HAPUS = 100
/** p_batas untuk yang menunggu: jepit atas server. Server mengurutkan yang
 *  terbaru dulu sebelum memotong, jadi batas kecil membuang permintaan yang
 *  PALING LAMA, justru yang bertanda merah. */
export const BATAS_MENUNGGU_HAPUS = 500
/** p_batas untuk badge di daftar pengguna: semua yang menunggu. */
export const BATAS_BADGE_HAPUS = BATAS_MENUNGGU_HAPUS
export const batasDaftarHapus = (status: StatusHapus): number =>
  status === 'menunggu' ? BATAS_MENUNGGU_HAPUS : BATAS_DAFTAR_HAPUS

// ── DTO: persis seperti yang dipulangkan RPC ─────────────────────────────
/** hapus_akun_hitung_inti: angka bigint bisa pulang sebagai string. */
export interface IsiHapusDTO {
  buku_milik: number | string | null
  buku_anggota: number | string | null
  transaksi_milik: number | string | null
  /** Transaksinya di buku orang lain (pindah ke pemilik buku saat dihapus). */
  transaksi_pindah: number | string | null
  foto: number | string | null
  tertahan: boolean | null
}
/** Satu baris `baris` admin_hapus_akun_daftar. */
export interface HapusAkunDTO {
  id: string
  user_id: string
  email_samar: string | null
  /** Hanya untuk sesi ber-pii (aturan 0082); null juga bila profilnya tiada. */
  nama: string | null
  lewat: string
  status: string
  diminta_pada: string
  umur_hari: number | null
  lewat_7_hari: boolean | null
  selesai_pada: string | null
  dibatalkan_pada: string | null
  /** Pelaku console yang menghapus atau membatalkan (dari admin_audit). */
  oleh: string | null
  /** 'sql' | 'edge' | 'gagal'; blokir_pada terisi begitu blokir masuk pasti terpasang. */
  blokir: string | null
  blokir_pada: string | null
  isi: IsiHapusDTO | null
  /** Masih memiliki buku bersama yang beranggota orang lain (hapus permanen akan ditolak). */
  tertahan: boolean | null
  /** Antrean penyapu foto sesudah hapus permanen. */
  foto_menunggu: number | string | null
  foto_gagal: number | string | null
}
export interface HapusAkunDaftarDTO {
  status: string
  batas: number
  jumlah: { menunggu: number | string; selesai: number | string; dibatalkan: number | string } | null
  baris: HapusAkunDTO[] | null
}

/** `status` jawaban admin_hapus_akun_permanen / admin_hapus_akun_batalkan. */
export const STATUS_JAWAB = ['selesai', 'dibatalkan', 'sudah_selesai', 'sudah_dibatalkan', 'tidak_ada'] as const
export interface HasilHapusDTO {
  status: string
  permintaan: string
  user_id?: string
  /** Hapus permanen: akunnya sudah terhapus lewat jalur lain sebelum admin menekan. */
  sudah_tiada?: boolean
  foto_antre?: number | string | null
  /** isi = hitungan saat dihapus (sama dengan `isi` daftar yang selesai);
   *  inti = hasil hapus_akun_inti ({buku_runtuh, pindah} atau {sudah_tiada}), tidak ditampilkan. */
  ringkasan?: { isi?: IsiHapusDTO | null; inti?: unknown } | null
  selesai_pada?: string | null
  dibatalkan_pada?: string | null
  /** Pembatalan: 'sql' = blokir masuk sudah dibuka; 'edge' = dibuka fungsi
   *  edge, belum dipastikan; null = akunnya sudah tiada. */
  buka_blokir?: string | null
}
/** Kunci kalimat jawaban aksi (hapusAkun.hasil.*). */
export const HASIL_HAPUS = ['dihapus', 'sudah_tiada', 'dibatalkan', 'dibatalkan_tertunda', 'dibatalkan_tiada', 'sudah_selesai', 'sudah_dibatalkan', 'tidak_ada'] as const
export type HasilHapus = typeof HASIL_HAPUS[number]
/** Jawaban yang berarti aksinya benar-benar dikerjakan sekarang (toast sukses).
 *  dibatalkan_tiada tidak termasuk: permintaannya dibatalkan, tapi akunnya
 *  sudah tidak ada, jadi tidak ada yang bisa masuk lagi (toast info). */
export const HASIL_BERHASIL: readonly HasilHapus[] = ['dihapus', 'dibatalkan', 'dibatalkan_tertunda']

// ── Domain ───────────────────────────────────────────────────────────────
export type KeadaanFoto = 'tersimpan' | 'menunggu' | 'gagal' | 'bersih'
export interface IsiHapus {
  ruangMilik: number | null
  ruangAnggota: number | null
  transaksi: number | null
  transaksiPindah: number | null
  foto: number | null
}
export interface PermintaanHapus {
  id: string
  userId: string
  emailTersamar: string
  nama: string | null
  status: StatusHapus | null
  lewat: LewatHapus | null
  dimintaIso: string
  selesaiIso: string | null
  dibatalkanIso: string | null
  oleh: string | null
  /** Hari utuh sejak diminta (0 = hari ini). */
  umurHari: number
  /** Menunggu lebih dari BATAS_HARI_MENUNGGU hari. */
  lewatBatas: boolean
  /** Masih menunggu tapi blokir masuknya belum pasti terpasang (jalur edge). */
  blokirTertunda: boolean
  /** null = server tidak mengirim isi. */
  isi: IsiHapus | null
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

export function keIsiHapus(d: IsiHapusDTO | null | undefined): IsiHapus | null {
  if (!d || typeof d !== 'object') return null
  return {
    ruangMilik: angkaAtauNull(d.buku_milik),
    ruangAnggota: angkaAtauNull(d.buku_anggota),
    transaksi: angkaAtauNull(d.transaksi_milik),
    transaksiPindah: angkaAtauNull(d.transaksi_pindah),
    foto: angkaAtauNull(d.foto),
  }
}

export function kePermintaanHapus(d: HapusAkunDTO, sekarang: number = Date.now()): PermintaanHapus {
  const status = pilihan(STATUS_HAPUS, d.status)
  const diminta = Date.parse(d.diminta_pada)
  const umurMs = Number.isFinite(diminta) ? Math.max(0, sekarang - diminta) : 0
  const fotoMenunggu = angkaAtauNull(d.foto_menunggu) ?? 0
  const fotoGagal = angkaAtauNull(d.foto_gagal) ?? 0
  const umurServer = angkaAtauNull(d.umur_hari)
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
    dibatalkanIso: d.dibatalkan_pada ?? null,
    oleh: d.oleh?.trim() || null,
    // Jam server lebih dulu: jam laptop admin bisa meleset.
    umurHari: umurServer !== null && umurServer >= 0 ? Math.floor(umurServer) : Math.floor(umurMs / 864e5),
    lewatBatas: status === 'menunggu'
      && (typeof d.lewat_7_hari === 'boolean' ? d.lewat_7_hari : umurMs > BATAS_HARI_MENUNGGU * 864e5),
    blokirTertunda: status === 'menunggu' && !d.blokir_pada,
    isi: keIsiHapus(d.isi),
    tertahan: d.tertahan === true,
    fotoMenunggu,
    fotoGagal,
    keadaanFoto: keadaanFoto(status, fotoMenunggu, fotoGagal),
    ke360: status === 'selesai' ? null : `/console/cashflow/pengguna/${d.user_id}`,
  }
}

/** Menunggu: yang paling lama di atas (paling mendesak). Selesai/dibatalkan:
 *  yang terbaru dikerjakan dulu. Seri diurutkan id supaya urutan tidak
 *  melompat saat dimuat ulang. */
export function urutPermintaan(daftar: readonly PermintaanHapus[], status: StatusHapus): PermintaanHapus[] {
  const waktu = (p: PermintaanHapus) =>
    Date.parse((status === 'selesai' && p.selesaiIso) || (status === 'dibatalkan' && p.dibatalkanIso) || p.dimintaIso) || 0
  const arah = status === 'menunggu' ? 1 : -1
  return [...daftar].sort((a, b) => (waktu(a) - waktu(b)) * arah || a.id.localeCompare(b.id))
}

/** Ringkasan isi akun untuk kartu dan konfirmasi. Hitungan 0 dan yang tidak
 *  dikirim (null) dilewati: "anggota di 0 ruang" hanya mengganggu. */
export const BAGIAN_ISI = ['ruangMilik', 'ruangAnggota', 'transaksi', 'transaksiPindah', 'foto'] as const
export type BagianIsi = typeof BAGIAN_ISI[number]
export function bagianIsi(isi: IsiHapus | null): Array<{ kunci: BagianIsi; n: number }> {
  if (!isi) return []
  return BAGIAN_ISI.flatMap(kunci => (isi[kunci] === null || isi[kunci] === 0 ? [] : [{ kunci, n: isi[kunci]! }]))
}

/** Jumlah per status untuk label saringan; null bila server tidak mengirimnya. */
export function jumlahPerStatus(d: HapusAkunDaftarDTO | null | undefined): Record<StatusHapus, number> | null {
  if (!d?.jumlah) return null
  const j = d.jumlah
  return { menunggu: angkaAtauNull(j.menunggu) ?? 0, selesai: angkaAtauNull(j.selesai) ?? 0, dibatalkan: angkaAtauNull(j.dibatalkan) ?? 0 }
}

/** Baris jawaban daftar (larik kosong bila tidak ada). */
export const barisHapus = (d: HapusAkunDaftarDTO | null | undefined): HapusAkunDTO[] =>
  Array.isArray(d?.baris) ? d.baris : []

/** Id akun yang permintaannya masih menunggu — untuk badge di daftar pengguna. */
export function idMenungguHapus(d: HapusAkunDaftarDTO | null | undefined): Set<string> {
  return new Set(barisHapus(d).filter(b => b.status === 'menunggu').map(b => b.user_id))
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
  if (!d || typeof d !== 'object') return 'lain'
  const j = d as Partial<HasilHapusDTO>
  const status = pilihan(STATUS_JAWAB, j.status)
  if (status === 'selesai') return j.sudah_tiada === true ? 'sudah_tiada' : 'dihapus'
  if (status === 'dibatalkan') {
    // Jalur cadangan: blokirnya dibuka fungsi edge, jadi "bisa masuk lagi" belum pasti.
    if (j.buka_blokir === 'edge') return 'dibatalkan_tertunda'
    // null: akunnya sudah terhapus lewat jalur lain, tidak ada blokir yang dibuka.
    if (j.buka_blokir === null) return 'dibatalkan_tiada'
  }
  return status ?? 'lain'
}

/** Galat aksi → cara halaman menjawabnya.
 *  'tertahan'    P0001 alihkan-kepemilikan: ditulis di kartunya, bahasa awam;
 *  'izin'        42501 izin-kurang: CashflowIzinKurang di atas daftar;
 *  'belum-aktif' RPC-nya belum ada (PGRST202, atau 42883 yang menyebut RPC
 *                itu sendiri): migrasi 0112 belum terpasang. 42883 fungsi lain
 *                di dalamnya = 0112 rusak, jatuh ke 'lain';
 *  'lain'        sisanya (toast dari useCashflowMuat). */
export function jenisGagalHapus(g: { jenis: string; hint?: string }): 'tertahan' | 'izin' | 'belum-aktif' | 'lain' {
  if (g.hint === 'alihkan-kepemilikan') return 'tertahan'
  if (g.jenis === 'izin') return 'izin'
  if (g.jenis === 'belum-aktif') return 'belum-aktif'
  return 'lain'
}

/** Aksi gagal tanpa kepastian (jaringan putus, galat yang tidak dikenal):
 *  server bisa saja sudah selesai sebelum jawabannya hilang, jadi daftar
 *  dimuat ulang supaya kartunya tidak tetap tampil menunggu. Penolakan yang
 *  jelas (tertahan, izin, sesi, bukan admin, argumen, belum aktif) terjadi
 *  sebelum apa pun berubah dan tidak perlu dimuat ulang. */
export const muatUlangSesudahGagal = (g: { jenis: string; hint?: string }): boolean =>
  g.jenis === 'lain' && jenisGagalHapus(g) === 'lain'
