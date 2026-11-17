/**
 * Keadaan daftar console CashFlow: memuat, galat, akses terbatas, kosong, dan
 * belum aktif di server. Satu urutan untuk semua halaman, supaya tidak ada
 * halaman yang menulis "Belum ada data" padahal muatannya gagal, dan tidak
 * ada yang menulis galat padahal fiturnya memang belum dipasang di server.
 *
 * Fungsi murni tanpa Nuxt supaya bisa diuji.
 */

export type JenisKeadaan = 'memuat' | 'galat' | 'terbatas' | 'kosong' | 'belum-aktif'

export interface MasukanKeadaan {
  memuat: boolean
  /** Ada galat muat (apa pun selain izin). */
  galat: boolean
  /** Server menolak karena izin sesi ini kurang. */
  izin?: boolean
  /** RPC halaman ini belum ada di server (console tayang lebih dulu dari migrasinya). */
  belumAktif?: boolean
  /** Banyaknya baris yang sudah ada di layar. */
  jumlah: number
}

/**
 * Keadaan yang menggantikan isi daftar. null = tampilkan barisnya.
 *
 * Baris yang sudah tampil bertahan selama memuat ulang dan saat muatan
 * berikutnya gagal (galatnya ditulis pemanggil di atas daftar). Izin kurang
 * selalu menang: baris lama tidak boleh tetap terbaca sesudah akses dicabut.
 * Belum aktif di server bukan galat: tidak ada yang rusak dan tidak ada yang
 * perlu dicoba lagi sekarang, jadi ia punya rupanya sendiri.
 */
export function keadaanDaftar(m: MasukanKeadaan): JenisKeadaan | null {
  if (m.izin) return 'terbatas'
  if (m.belumAktif) return 'belum-aktif'
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
