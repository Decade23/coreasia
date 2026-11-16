/**
 * Deret pil segmen console CashFlow: bentuk pilihannya dan aturan hitungan.
 *
 * Fungsi murni tanpa Nuxt supaya bisa diuji. Dipakai CashflowSegmen, satu
 * komponen untuk semua deret pil di modul ini.
 */

export interface OpsiSegmen<T extends string = string> {
  nilai: T
  label: string
  /** Hitungan di samping label. Hanya diisi bila angkanya memang sudah ada. */
  jumlah?: number | null
  /** Pilihan tampil tetapi tidak bisa ditekan (misalnya butuh izin lebih). */
  mati?: boolean
  /** Keterangan saat disorot, biasanya alasan pilihan itu mati. */
  ket?: string
  /** Warna pilihan aktif. Tanpa ini pilihan aktif memakai bidang inti. */
  nada?: 'baik' | 'awas'
}

const ribuan = (n: number): string => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')

/**
 * Teks hitungan sebuah pil. null = tidak ditulis sama sekali.
 *
 * Nol tetap ditulis: "0" adalah kabar, kosong berarti belum tahu. Angka yang
 * tidak terbaca atau negatif tidak ditulis, supaya pil tidak pernah memuat
 * "NaN" atau angka karangan.
 */
export function teksJumlahSegmen(jumlah: number | null | undefined): string | null {
  if (typeof jumlah !== 'number' || !Number.isFinite(jumlah) || jumlah < 0) return null
  return ribuan(jumlah)
}

/**
 * Pilihan yang boleh ditekan. Pilihan yang sedang aktif tetap boleh: menekannya
 * lagi dipakai halaman untuk kembali ke halaman pertama daftar.
 */
export function bisaDipilih<T extends string>(o: OpsiSegmen<T>, semuaMati = false): boolean {
  return !semuaMati && !o.mati
}
