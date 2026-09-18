/**
 * useCashflowMuat — permintaan yang sudah digantikan tidak berhak atas
 * memuat/galat halaman.
 *
 * Pencarian /ruang menembak permintaan tiap 300 ms. Dulu penjaga urutan hanya
 * melindungi DATA: jawaban lama yang selesai lebih dulu mematikan "memuat"
 * padahal yang terbaru masih berjalan, dan jawaban lama yang GAGAL menaruh
 * pesan galat di atas tabel yang sebenarnya sudah segar.
 *
 * Tanpa Nuxt (lihat vitest.config.ts): auto-import yang dipakai berkas ini
 * (ref, computed, useCashflowI18n, useRoute, useToast, navigateTo) dipasang
 * sebagai global tiruan — cukup untuk menguji alur keadaannya.
 */
import { computed, ref } from 'vue'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { GalatAdmin } from '~/composables/cashflow/useCashflowAdmin'

const toast = { success: vi.fn(), error: vi.fn() }
const navigateTo = vi.fn()

beforeAll(() => {
  vi.stubGlobal('ref', ref)
  vi.stubGlobal('computed', computed)
  vi.stubGlobal('useCashflowI18n', () => ({ tcf: (k: string) => k }))
  vi.stubGlobal('useRoute', () => ({ fullPath: '/console/cashflow/ruang' }))
  vi.stubGlobal('useToast', () => toast)
  vi.stubGlobal('navigateTo', navigateTo)
})
afterAll(() => vi.unstubAllGlobals())

const muatModul = async () => (await import('~/composables/cashflow/useCashflowMuat')).useCashflowMuat

/** Janji yang diselesaikan dari luar, untuk mengatur urutan jawaban. */
function tunda() {
  let selesai!: () => void
  let gagal!: (e: unknown) => void
  const janji = new Promise<void>((a, b) => { selesai = a; gagal = b })
  return { janji, selesai, gagal }
}

describe('muat: yang terbaru menentukan', () => {
  it('galat permintaan lama yang tiba belakangan tidak tampil di atas hasil baru', async () => {
    const { memuat, galat, pesanGalat, muat } = (await muatModul())({ awal: true })
    const lama = tunda()
    const baru = tunda()
    const data: string[] = []
    const p1 = muat(async (terbaru) => { await lama.janji; if (terbaru()) data.push('lama') })
    const p2 = muat(async (terbaru) => { await baru.janji; if (terbaru()) data.push('baru') })
    baru.selesai()
    await p2
    expect(memuat.value).toBe(false)
    lama.gagal(new TypeError('Failed to fetch'))
    expect(await p1).toBe(false)
    expect(galat.value).toBeNull()
    expect(pesanGalat.value).toBe('')
    expect(memuat.value).toBe(false)
    expect(data).toEqual(['baru'])
  })

  it('jawaban lama yang selesai lebih dulu tidak mematikan memuat milik yang terbaru', async () => {
    const { memuat, muat } = (await muatModul())()
    const lama = tunda()
    const baru = tunda()
    const data: string[] = []
    const p1 = muat(async (terbaru) => { await lama.janji; if (terbaru()) data.push('lama') })
    const p2 = muat(async (terbaru) => { await baru.janji; if (terbaru()) data.push('baru') })
    lama.selesai()
    await p1
    expect(memuat.value).toBe(true)
    expect(data).toEqual([])
    baru.selesai()
    await p2
    expect(memuat.value).toBe(false)
    expect(data).toEqual(['baru'])
  })

  it('galat permintaan terbaru tetap tampil', async () => {
    const { galat, muat } = (await muatModul())()
    expect(await muat(async () => { throw new GalatAdmin('lain', 'server mati') })).toBe(false)
    expect(galat.value?.message).toBe('server mati')
  })

  it('sesi hilang pada permintaan basi tidak mengarahkan ke /masuk; pada yang terbaru, ya', async () => {
    navigateTo.mockClear()
    const { muat } = (await muatModul())()
    const lama = tunda()
    const p1 = muat(async () => { await lama.janji })
    const p2 = muat(async () => {})
    await p2
    lama.gagal(new GalatAdmin('sesi', 'sesi habis'))
    await p1
    expect(navigateTo).not.toHaveBeenCalled()
    await muat(async () => { throw new GalatAdmin('sesi', 'sesi habis') })
    expect(navigateTo).toHaveBeenCalledTimes(1)
  })
})

describe('pesanUntuk: hint server dilokalkan', () => {
  it('42501 bukan-milik-subjek → kalimat kamus, bukan kalimat server berbahasa Indonesia', async () => {
    const { pesanUntuk } = (await muatModul())()
    const g = new GalatAdmin('argumen', 'Sebagian transaksi bukan catatan pengguna ini (atau tidak ada). Tidak satu pun dibuka.', 'bukan-milik-subjek')
    expect(pesanUntuk(g)).toBe('galat.bukanMilikSubjek')
  })
  it('22023 tanpa hint tetap memakai kalimat server', async () => {
    const { pesanUntuk } = (await muatModul())()
    expect(pesanUntuk(new GalatAdmin('argumen', 'Waktu berakhir harus sesudah waktu mulai'))).toBe('Waktu berakhir harus sesudah waktu mulai')
  })
})
