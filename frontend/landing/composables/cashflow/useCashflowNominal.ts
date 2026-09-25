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
 *   - bila URL membawa ?kursor= atau ?tx=, keduanya dikosongkan lewat
 *     `setel` — jalur yang sama dengan saringan lain — dan `menunggu`
 *     bernilai true sampai URL-nya selesai diganti. Halaman mengabaikan
 *     ?kursor= selama `menunggu`, jadi tidak ada satu pun panggilan (dan
 *     baris audit) untuk pasangan saringan baru + kursor lama.
 * Kapan harus kembali ke awal diputuskan DI SINI, bukan di halaman, supaya
 * perilakunya diuji (tests/cashflow/nominal.test.ts), bukan hanya dijaga regex.
 */
import { getCurrentScope, onScopeDispose, ref, watch, type Ref } from 'vue'

export interface NominalSaring { min: string; maks: string }

/** Bagian URL tab Transaksi yang dikosongkan saat nominal berubah. */
export interface PosisiHalaman { kursor: string; tx: string }

export function useCashflowNominal(o: {
  nominal: Ref<NominalSaring>
  /** Nilai query URL tab ini (useCashflowQuery().nilai). */
  q: Readonly<Ref<PosisiHalaman>>
  /** useCashflowQuery().setel (replace). */
  setel: (ubah: PosisiHalaman) => Promise<unknown> | void
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
      // Halaman pertama tanpa laci: tidak ada yang perlu dikosongkan.
      if (!o.q.value.kursor && !o.q.value.tx) return
      menunggu.value = true
      Promise.resolve()
        .then(() => o.setel({ kursor: '', tx: '' }))
        .catch(() => { /* navigasi dibatalkan (jarang): halaman kembali membaca ?kursor= dari URL */ })
        .finally(() => { menunggu.value = false })
    }, o.tundaMs ?? 300)
  }, { deep: true })
  if (getCurrentScope()) onScopeDispose(() => clearTimeout(tunda))

  return { stabil, menunggu }
}
