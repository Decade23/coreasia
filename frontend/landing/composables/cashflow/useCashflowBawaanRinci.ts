/**
 * Bawaan dari daftar pengguna ke halaman rincian: cara nomor WhatsApp
 * dibuktikan dan kapan terakhir memakai Domi.
 *
 * Kedua hal itu dulu kolom di daftar. Halaman rincian tidak mengambilnya dari
 * server, jadi baris yang sedang tampil di daftar disimpan di memori tab dan
 * dibaca saat rincian dibuka. Tanpa email, nama, atau nomor. Dibuka lewat
 * tautan langsung, keduanya kosong dan halaman berkata begitu.
 *
 * Isinya ikut dibuang saat hak baca data pribadi hilang dan saat keluar.
 */
import type { Pengguna } from '~/adapters/cashflow'
import { keBawaanRinci, type BawaanRinci } from '~/adapters/cashflowPenggunaDaftar'

export const useCashflowBawaanRinci = () => {
  const simpanan = useState<BawaanRinci[]>('cf_bawaan_rinci', () => [])
  const isi = (baris: readonly Pengguna[]) => { simpanan.value = baris.map(keBawaanRinci) }
  const untuk = (id: string): BawaanRinci | null => simpanan.value.find(b => b.id === id) ?? null
  const kosongkan = () => { simpanan.value = [] }
  return { isi, untuk, kosongkan }
}
