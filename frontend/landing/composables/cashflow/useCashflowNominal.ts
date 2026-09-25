/**
 * Saringan nominal (min/maks) tab Transaksi Pengguna 360.
 *
 * Nominal TIDAK di URL (terlalu mengungkap untuk riwayat peramban/log
 * Vercel); ia di useState per subjek dan dipakai sesudah didebounce 300 ms.
 * Karena bukan kunci URL, ia tidak lewat saringUlang() yang mengosongkan
 * ?kursor= dan ?tx= — dulu mengetik Min di halaman 3 menjalankan saringan
 * baru dengan kursor halaman lama, sehingga transaksi terbaru yang cocok
 * hilang tanpa tanda (temuan F9; server menambahkan `< kursor` dan tidak
 * menghitung total bila kursor terisi).
 *
 * Di sini, begitu nilai stabil berubah:
 *   - `stabil` diperbarui (dipakai kunci muat halaman);
 *   - bila ada kursor/laci (`perluKeAwal`), `keAwal` dipanggil — jalur yang
 *     sama dengan saringan lain (setel({ kursor: '', tx: '' })) — dan
 *     `menunggu` bernilai true sampai URL-nya selesai diganti. Halaman
 *     mengabaikan ?kursor= selama `menunggu`, jadi tidak ada satu pun
 *     panggilan (dan baris audit) untuk pasangan saringan baru + kursor lama.
 */
import { getCurrentScope, onScopeDispose, ref, watch, type Ref } from 'vue'

export interface NominalSaring { min: string; maks: string }

export function useCashflowNominal(o: {
  nominal: Ref<NominalSaring>
  /** true bila URL masih membawa ?kursor= atau ?tx=. */
  perluKeAwal: () => boolean
  /** Kosongkan ?kursor= dan ?tx= (replace). */
  keAwal: () => Promise<unknown> | void
  tundaMs?: number
}) {
  const stabil = ref<NominalSaring>({ ...o.nominal.value })
  const menunggu = ref(false)
  let tunda: ReturnType<typeof setTimeout> | undefined

  watch(o.nominal, (n) => {
    clearTimeout(tunda)
    tunda = setTimeout(() => {
      if (n.min === stabil.value.min && n.maks === stabil.value.maks) return
      stabil.value = { ...n }
      if (!o.perluKeAwal()) return
      menunggu.value = true
      Promise.resolve()
        .then(() => o.keAwal())
        .catch(() => { /* navigasi dibatalkan (jarang): halaman kembali membaca ?kursor= dari URL */ })
        .finally(() => { menunggu.value = false })
    }, o.tundaMs ?? 300)
  }, { deep: true })
  if (getCurrentScope()) onScopeDispose(() => clearTimeout(tunda))

  return { stabil, menunggu }
}
