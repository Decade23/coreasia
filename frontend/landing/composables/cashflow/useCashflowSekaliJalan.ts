/**
 * Satu aksi berjalan pada satu waktu untuk seluruh daftar — mis. "Selidiki"
 * di /aktivitas: klik ganda (atau dua baris diklik beruntun) tidak boleh
 * membuka dua kasus. Tombol yang di-disable hanya meredam sebagian; klik
 * kedua sebelum render berikutnya tetap sampai ke sini.
 *
 * `sibuk` = kunci yang sedang berjalan (null = bebas); dilepas juga saat
 * kerja gagal. `ref` diimpor dari vue supaya bisa diuji tanpa Nuxt.
 */
import { ref, type Ref } from 'vue'

export function useCashflowSekaliJalan<K>(kerja: (kunci: K) => Promise<unknown>): {
  sibuk: Ref<K | null>
  jalankan: (kunci: K) => Promise<boolean>
} {
  const sibuk = ref(null) as Ref<K | null>
  const jalankan = async (kunci: K): Promise<boolean> => {
    if (sibuk.value !== null) return false
    sibuk.value = kunci
    try {
      await kerja(kunci)
      return true
    } finally {
      sibuk.value = null
    }
  }
  return { sibuk, jalankan }
}
