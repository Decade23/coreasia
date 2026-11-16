/**
 * Sapaan Ringkasan: satu kalimat yang mengikuti jam (WIB) dan satu kalimat
 * keadaan dari data yang sudah ada di halaman. Fungsi murni, tulisannya
 * datang dari kamus pemanggil.
 */
export type WaktuSapaan = 'pagi' | 'siang' | 'sore' | 'malam'
export type TingkatWa = 'sehat' | 'sebagian' | 'gangguan' | 'nonaktif'

/** Jam di WIB, apa pun zona peramban atau server. */
export function jamWib(saat: Date): number {
  const jam = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', hourCycle: 'h23', timeZone: 'Asia/Jakarta' }).format(saat)
  return Number(jam) % 24
}

/** Mulai 04.00 pagi, 11.00 siang, 15.00 sore, 19.00 malam. */
export function waktuSapaan(saat: Date): WaktuSapaan {
  const j = jamWib(saat)
  if (j >= 4 && j < 11) return 'pagi'
  if (j >= 11 && j < 15) return 'siang'
  if (j >= 15 && j < 19) return 'sore'
  return 'malam'
}

/** Nama panggilan dari nama lengkap admin: kata pertama, paling panjang 24 huruf. Kosong bila tidak ada. */
export function namaPanggilan(namaLengkap: string | null | undefined): string {
  const kata = (namaLengkap ?? '').trim().split(/\s+/)[0] ?? ''
  return kata.length > 24 ? `${kata.slice(0, 24)}…` : kata
}

export interface BahanKeadaan {
  /** Tingkat status WhatsApp OTP. null = belum diketahui atau gagal dimuat. */
  wa: TingkatWa | null
  /** Jumlah pengguna terdaftar. null = belum dimuat. */
  pengguna: number | null
}

/**
 * Kunci kalimat keadaan. Kabar yang perlu ditindak menang atas angka: selama
 * WhatsApp tidak sehat, itulah yang disebut.
 */
export function kunciKeadaan(b: BahanKeadaan): 'gangguan' | 'sebagian' | 'nonaktif' | 'sehat' | 'angka' | 'memuat' {
  if (b.wa && b.wa !== 'sehat') return b.wa
  if (b.wa === 'sehat') return 'sehat'
  return b.pengguna === null ? 'memuat' : 'angka'
}
