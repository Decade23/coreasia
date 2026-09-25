/**
 * useCashflowNominal — saringan nominal tab Transaksi (temuan F9).
 *
 * Mengetik Min/Maks di halaman 3 dulu menjalankan saringan baru dengan kursor
 * halaman lama: transaksi terbaru yang cocok hilang tanpa tanda. Nominal kini
 * kembali ke halaman pertama dan menutup laci (jalur yang sama dengan saringan
 * lain), dan selama URL-nya diganti kursor lama tidak dipakai (`menunggu`).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'
import { useCashflowNominal, type NominalSaring } from '~/composables/cashflow/useCashflowNominal'

beforeEach(() => { vi.useFakeTimers() })
afterEach(() => { vi.useRealTimers() })

function siapkan(awal: { kursor: string; tx: string }) {
  // Tiruan useCashflowQuery: `q` = nilai URL, `setel` menggantinya (async, replace).
  const q = ref({ ...awal })
  let selesaikan: () => void = () => {}
  const keAwal = vi.fn((ubah: { kursor: string; tx: string }) =>
    new Promise<void>((r) => { selesaikan = () => { q.value = { ...q.value, ...ubah }; r() } }))
  const nominal = ref<NominalSaring>({ min: '', maks: '' })
  const n = useCashflowNominal({ nominal, q, setel: keAwal })
  return { get url() { return q.value }, nominal, keAwal, selesai: () => selesaikan(), ...n }
}

/** Ketik lalu tunggu debounce 300 ms. */
async function ketik(nominal: { value: NominalSaring }, nilai: Partial<NominalSaring>) {
  nominal.value = { ...nominal.value, ...nilai }
  await nextTick()
  await vi.advanceTimersByTimeAsync(300)
}

describe('useCashflowNominal', () => {
  it('di halaman 3: nominal berubah → kembali ke halaman pertama (kursor & laci dikosongkan)', async () => {
    const s = siapkan({ kursor: 'K3', tx: '' })
    await ketik(s.nominal, { min: '5000000' })
    expect(s.stabil.value).toEqual({ min: '5000000', maks: '' })
    expect(s.keAwal).toHaveBeenCalledTimes(1)
    expect(s.keAwal).toHaveBeenCalledWith({ kursor: '', tx: '' })
    // Sampai URL selesai diganti, halaman mengabaikan ?kursor= lama.
    expect(s.menunggu.value).toBe(true)
    s.selesai()
    await vi.runAllTimersAsync()
    expect(s.menunggu.value).toBe(false)
    expect(s.url).toEqual({ kursor: '', tx: '' })
  })

  it('laci terbuka di halaman pertama → laci ditutup juga', async () => {
    const s = siapkan({ kursor: '', tx: 'tx-1' })
    await ketik(s.nominal, { maks: '100' })
    expect(s.keAwal).toHaveBeenCalledTimes(1)
    expect(s.menunggu.value).toBe(true)
    s.selesai()
    await vi.runAllTimersAsync()
    expect(s.url).toEqual({ kursor: '', tx: '' })
  })

  it('halaman 2 dengan laci terbuka → kursor DAN laci dikosongkan dalam satu langkah', async () => {
    const s = siapkan({ kursor: 'K2', tx: 'tx-1' })
    await ketik(s.nominal, { min: '1' })
    expect(s.keAwal).toHaveBeenCalledTimes(1)
    expect(s.keAwal).toHaveBeenCalledWith({ kursor: '', tx: '' })
  })

  it('sudah di halaman pertama tanpa laci → hanya nilai stabil yang berubah', async () => {
    const s = siapkan({ kursor: '', tx: '' })
    await ketik(s.nominal, { min: '10' })
    expect(s.stabil.value.min).toBe('10')
    expect(s.keAwal).not.toHaveBeenCalled()
    expect(s.menunggu.value).toBe(false)
  })

  it('didebounce: beberapa ketukan = satu perubahan; sebelum 300 ms belum ada apa-apa', async () => {
    const s = siapkan({ kursor: 'K3', tx: '' })
    for (const min of ['5', '50', '500']) {
      s.nominal.value = { ...s.nominal.value, min }
      await nextTick()
      await vi.advanceTimersByTimeAsync(100)
    }
    expect(s.stabil.value.min).toBe('')
    expect(s.keAwal).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(300)
    expect(s.stabil.value.min).toBe('500')
    expect(s.keAwal).toHaveBeenCalledTimes(1)
  })

  it('nilai kembali sama sebelum debounce habis → tidak mengubah halaman', async () => {
    const s = siapkan({ kursor: 'K3', tx: '' })
    s.nominal.value = { min: '5', maks: '' }
    await nextTick()
    s.nominal.value = { min: '', maks: '' }
    await nextTick()
    await vi.advanceTimersByTimeAsync(300)
    expect(s.keAwal).not.toHaveBeenCalled()
  })
})
