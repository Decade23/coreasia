/**
 * Ranah yang ditambahkan OTOMATIS saat sebuah tab dibuka (satu klik, tanpa
 * tombol perantara) — dipakai tab Dompet: kasus Pengguna 360 dibuka tanpa
 * ranah dompet, jadi membuka tab ini = admin_kasus_tambah(['dompet']),
 * alasan diwarisi dan tercatat di audit.
 *
 * - `immediate`: tab yang dibuka sesudah kasus terpasang (kasus TIDAK
 *   berubah lagi) tetap menambah ranahnya; tanpa itu tab macet di "di luar
 *   ranah".
 * - Sekali per kasus: galat tambah tidak diulang terus-menerus untuk kasus
 *   yang sama; kasus BARU (habis → dibuka lagi) mencoba lagi.
 * - Tidak untuk kasus anak (T3): ranah buku tidak ditambahkan ke sana.
 *
 * `watch` diimpor dari vue (bukan auto-import) supaya bisa diuji tanpa Nuxt.
 */
import { ref, watch, type Ref, type WatchStopHandle } from 'vue'
import type { Kasus } from '~/adapters/cashflowKasus'

export interface KasusUntukRanah {
  kasus: Readonly<Ref<Kasus | null>>
  punyaRanah: (r: string) => boolean
  tambah: (ranah: readonly string[]) => Promise<void>
}

export function useCashflowRanahOtomatis(
  kasus: KasusUntukRanah,
  ranah: string,
  /** Pembungkus galat halaman (useCashflowMuat().aksi). */
  jalankan: (kerja: () => Promise<void>) => unknown,
): { ditambahUntuk: Ref<string | null>; henti: WatchStopHandle } {
  const ditambahUntuk = ref<string | null>(null)
  const henti = watch(() => [kasus.kasus.value?.id ?? null, kasus.kasus.value ? kasus.punyaRanah(ranah) : true] as const, ([id, punya]) => {
    if (!id || punya || ditambahUntuk.value === id || kasus.kasus.value?.anak) return
    ditambahUntuk.value = id
    void jalankan(() => kasus.tambah([ranah]))
  }, { immediate: true })
  return { ditambahUntuk, henti }
}
