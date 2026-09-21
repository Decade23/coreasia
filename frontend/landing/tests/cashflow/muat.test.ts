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
  it('hint 22023 Fase 1 → kalimat kamus, bukan kalimat server berbahasa Indonesia', async () => {
    const { pesanUntuk } = (await muatModul())()
    expect(pesanUntuk(new GalatAdmin('argumen', 'Kasus sudah di batas 2 jam…', 'batas-2jam'))).toBe('galat.batas2jam')
    expect(pesanUntuk(new GalatAdmin('argumen', 'Cari server hanya menerima…', 'kueri-tidak-didukung'))).toBe('galat.kueriTidakDidukung')
  })
  it('jenis kasus/ranah/lingkup/izin/batas → kalimat kamus masing-masing', async () => {
    const { pesanUntuk } = (await muatModul())()
    expect(pesanUntuk(new GalatAdmin('kasus', 'x', 'kasus-kedaluwarsa'))).toBe('galat.kasusHabis')
    expect(pesanUntuk(new GalatAdmin('ranah', 'x', 'kasus-ranah'))).toBe('galat.diLuarRanah')
    expect(pesanUntuk(new GalatAdmin('lingkup', 'x', 'kasus-lingkup'))).toBe('galat.diLuarLingkup')
    expect(pesanUntuk(new GalatAdmin('izin', 'x', 'izin-kurang'))).toBe('galat.izinKurang')
    expect(pesanUntuk(new GalatAdmin('batas', 'x', 'batas-investigasi'))).toBe('galat.batasInvestigasi')
  })
  it("temuan fe p2 #4: galat sesi/totp → kalimat kamus, bukan kode mentah ('cookie-ditolak')", async () => {
    const { pesanUntuk } = (await muatModul())()
    expect(pesanUntuk(new GalatAdmin('sesi', 'cookie-ditolak'))).toBe('galat.sesiBerakhir')
    expect(pesanUntuk(new GalatAdmin('totp', 'Sesi identitas konsol ini tidak dicetak…', 'mfa-wajib'))).toBe('galat.sesiBerakhir')
  })
  it('keMasukBilaSesi diekspor: galat sesi → /masuk dengan ke = URL saat ini; galat lain tidak', async () => {
    navigateTo.mockClear()
    const { keMasukBilaSesi } = (await muatModul())()
    expect(keMasukBilaSesi(new GalatAdmin('galat' as never, 'x'))).toBe(false)
    expect(navigateTo).not.toHaveBeenCalled()
    expect(keMasukBilaSesi(new GalatAdmin('sesi', 'cookie-ditolak'))).toBe(true)
    expect(navigateTo).toHaveBeenCalledWith({ path: '/console/cashflow/masuk', query: { sebab: 'sesi', ke: '/console/cashflow/ruang' } })
  })
  it('22023 tanpa hint tetap memakai kalimat server', async () => {
    const { pesanUntuk } = (await muatModul())()
    expect(pesanUntuk(new GalatAdmin('argumen', 'Waktu berakhir harus sesudah waktu mulai'))).toBe('Waktu berakhir harus sesudah waktu mulai')
  })
})

describe('batal: halaman dilepas (temuan fe p3 #1)', () => {
  it('muat yang masih berjalan menjadi basi: terbaru() false, memuat mati', async () => {
    const { memuat, muat, batal } = (await muatModul())({ awal: true })
    const j = tunda()
    let saatTiba: boolean | null = null
    const p = muat(async (terbaru) => { await j.janji; saatTiba = terbaru() })
    expect(memuat.value).toBe(true)
    batal()
    expect(memuat.value).toBe(false)
    j.selesai()
    expect(await p).toBe(true)
    expect(saatTiba).toBe(false)
  })

  it('galat yang tiba sesudah batal() tidak tampil dan tidak mengarahkan ke /masuk', async () => {
    navigateTo.mockClear()
    const { galat, muat, batal } = (await muatModul())({ awal: true })
    const j = tunda()
    const p = muat(async () => { await j.janji })
    batal()
    j.gagal(new GalatAdmin('sesi', 'cookie-ditolak'))
    expect(await p).toBe(false)
    expect(galat.value).toBeNull()
    expect(navigateTo).not.toHaveBeenCalled()
  })

  it('muat sesudah batal() berjalan biasa', async () => {
    const { memuat, muat, batal } = (await muatModul())({ awal: true })
    batal()
    let saatTiba: boolean | null = null
    expect(await muat(async (terbaru) => { saatTiba = terbaru() })).toBe(true)
    expect(saatTiba).toBe(true)
    expect(memuat.value).toBe(false)
  })
})
