/**
 * Empat keadaan daftar console CashFlow: memuat, galat, akses terbatas, dan
 * kosong. Satu urutan untuk semua halaman, supaya tidak ada halaman yang
 * menulis "Belum ada data" padahal muatannya gagal.
 *
 * Fungsi murni tanpa Nuxt supaya bisa diuji.
 */

export type JenisKeadaan = 'memuat' | 'galat' | 'terbatas' | 'kosong'

export interface MasukanKeadaan {
  memuat: boolean
  /** Ada galat muat (apa pun selain izin). */
  galat: boolean
  /** Server menolak karena izin sesi ini kurang. */
  izin?: boolean
  /** Banyaknya baris yang sudah ada di layar. */
  jumlah: number
}

/**
 * Keadaan yang menggantikan isi daftar. null = tampilkan barisnya.
 *
 * Baris yang sudah tampil bertahan selama memuat ulang dan saat muatan
 * berikutnya gagal (galatnya ditulis pemanggil di atas daftar). Izin kurang
 * selalu menang: baris lama tidak boleh tetap terbaca sesudah akses dicabut.
 */
export function keadaanDaftar(m: MasukanKeadaan): JenisKeadaan | null {
  if (m.izin) return 'terbatas'
  if (m.jumlah > 0) return null
  if (m.galat) return 'galat'
  if (m.memuat) return 'memuat'
  return 'kosong'
}

/** Lebar batang kerangka (persen) yang berulang tiap empat baris, supaya tidak tampak seperti pagar. */
const POLA = [58, 74, 48, 66] as const
export function lebarKerangka(baris: number): number {
  return POLA[((baris % POLA.length) + POLA.length) % POLA.length]!
}
