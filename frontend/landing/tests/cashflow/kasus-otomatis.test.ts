/**
 * useCashflowKasus — pembukaan OTOMATIS (keputusan Master 21 Sep 2026).
 *
 * Membuka Pengguna 360 = data tampil tanpa dialog: kasus aktif dipakai (dan
 * dilengkapi), atau kasus baru dibuka dengan isian otomatis; diperpanjang
 * otomatis selama halaman aktif; lewat batas 2 jam dibuka baru otomatis;
 * catatan (T3) satu klik lewat kasus anak otomatis. Tanpa pii → tahap 'izin'
 * tanpa panggilan; batas laju → tahap 'batas' tanpa dicoba ulang sendiri.
 *
 * Tanpa Nuxt (lihat vitest.config.ts): useCashflowAdmin dipasang sebagai
 * global tiruan, window/document tiruan secukupnya untuk detak & aktivitas.
 */
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
// Vue dimuat SEBELUM document tiruan dipasang: runtime-dom membaca document saat dimuat.
import 'vue'
import type { KasusDTO } from '~/adapters/cashflowKasus'
import { GalatAdmin } from '~/composables/cashflow/useCashflowAdmin'

const SUBJEK = '3f0c2a4e-8b1d-4c6a-9e2f-1a2b3c4d5e6f'
const W1 = '0b6f5c1e-2d3a-4b5c-8d7e-9f0a1b2c3d4e'
const W2 = '7c8d9e0f-1a2b-4c3d-9e4f-5a6b7c8d9e0f'
const MENIT = 60_000

let nomor = 0
function kasusDto(x: Partial<KasusDTO> & { menit?: number; akarMenitLalu?: number } = {}): KasusDTO {
  const { menit = 30, akarMenitLalu = 0, ...sisa } = x
  const kini = Date.now()
  const akar = new Date(kini - akarMenitLalu * MENIT)
  return {
    id: `k${++nomor}`, induk: null, subjek_tipe: 'user', subjek_id: SUBJEK, ruang: [W1, W2], jumlah_ruang: 2,
    skenario: 'pengguna_360', preset: 'keluhan', alasan: 'Dibuka dari console CashFlow — Pengguna 360 · x',
    ranah: ['akun', 'jejak', 'transaksi'], tingkat: 'T2', lanjutan_dari: null,
    dibuka: new Date(kini).toISOString(), akar_dibuka: akar.toISOString(),
    berlaku_sampai: new Date(kini + menit * MENIT).toISOString(),
    batas_perpanjang: new Date(akar.getTime() + 120 * MENIT).toISOString(),
    ditutup: null, status: 'aktif', jumlah_terdampak: 1,
    ...sisa,
  }
}

const api = {
  kasusAktif: vi.fn(),
  kasusAktifRuang: vi.fn(),
  kasusBuka: vi.fn(),
  kasusTambah: vi.fn(),
  kasusPerpanjang: vi.fn(),
  kasusInvestigasi: vi.fn(),
  teks: vi.fn(),
}
const pendengar = new Map<string, () => void>()

beforeAll(() => {
  vi.stubGlobal('useCashflowAdmin', () => api)
  vi.stubGlobal('window', {
    addEventListener: (p: string, f: () => void) => pendengar.set(p, f),
    removeEventListener: (p: string) => pendengar.delete(p),
  })
  vi.stubGlobal('document', {
    visibilityState: 'visible',
    addEventListener: (p: string, f: () => void) => pendengar.set(`dokumen:${p}`, f),
    removeEventListener: (p: string) => pendengar.delete(`dokumen:${p}`),
  })
})
/** Tab disembunyikan/ditampilkan lagi (visibilitychange). */
function aturTerlihat(terlihat: boolean) {
  ;(document as { visibilityState: string }).visibilityState = terlihat ? 'visible' : 'hidden'
  pendengar.get('dokumen:visibilitychange')?.()
}
afterAll(() => vi.unstubAllGlobals())

const modul = async () => import('~/composables/cashflow/useCashflowKasus')
let lepas: (() => void) | null = null

beforeEach(async () => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-09-21T15:00:00Z'))
  for (const f of Object.values(api)) f.mockReset()
  api.kasusAktif.mockResolvedValue({ kasus: null, investigasi: [] })
  api.kasusAktifRuang.mockResolvedValue({ kasus: null, investigasi: [] })
  api.kasusBuka.mockImplementation(async () => kasusDto())
  ;(await modul()).lupakanKasus()
})
afterEach(() => {
  lepas?.()
  lepas = null
  ;(document as { visibilityState: string }).visibilityState = 'visible'
  vi.useRealTimers()
})

async function siapkan(ruang: string[] | null = [W1, W2], pasangHalaman = true) {
  const m = await modul()
  const k = m.useCashflowKasus()
  if (pasangHalaman) lepas = k.pasangHalaman()
  await k.pulihkan(SUBJEK)
  await k.aturLingkup(SUBJEK, ruang)
  return { k, m }
}

describe('membuka Pengguna 360 = kasus dibuka otomatis', () => {
  it('tanpa kasus aktif → admin_kasus_buka dengan isian otomatis, tanpa masukan orang', async () => {
    const { k } = await siapkan()
    expect(api.kasusBuka).toHaveBeenCalledTimes(1)
    const [subjek, skenario, preset, ranah, ruang, alasan] = api.kasusBuka.mock.calls[0]!
    expect([subjek, skenario, preset, [...ranah], ruang]).toEqual([SUBJEK, 'pengguna_360', 'keluhan', ['akun', 'transaksi', 'jejak'], [W1, W2]])
    expect(alasan).toBe('Dibuka dari console CashFlow — Pengguna 360 · 2026-09-21 22.00.00 WIB')
    expect(k.keadaan.value.tahap).toBe('siap')
    expect(k.kasus.value?.id).toBeTruthy()
    // pulihkan() baru saja bertanya dan server tidak punya kasus: tidak ditanya dua kali.
    expect(api.kasusAktif).toHaveBeenCalledTimes(1)
  })

  it('kasus aktif dipulihkan dan dilengkapi (ranah & ruang yang kurang), tanpa kasus baru', async () => {
    const lama = kasusDto({ ranah: ['akun'], tingkat: 'T1', ruang: [W1], jumlah_ruang: 1 })
    api.kasusAktif.mockResolvedValue({ kasus: lama, investigasi: [] })
    api.kasusTambah.mockImplementation(async () => ({ ...lama, ranah: ['akun', 'jejak', 'transaksi'], ruang: [W1, W2], tingkat: 'T2' }))
    const { k } = await siapkan()
    expect(api.kasusBuka).not.toHaveBeenCalled()
    expect(api.kasusTambah).toHaveBeenCalledWith(lama.id, ['transaksi', 'jejak'], [W2])
    expect(k.kasus.value?.ranah).toEqual(['akun', 'jejak', 'transaksi'])
    expect(k.keadaan.value.tahap).toBe('siap')
  })

  it('sesi tanpa pii (kepala tanpa ruang) → tahap izin, tanpa panggilan, tanpa kasus di memori', async () => {
    api.kasusAktif.mockResolvedValue({ kasus: kasusDto({ ruang: null }), investigasi: [] })
    const { k } = await siapkan(null)
    expect(api.kasusBuka).not.toHaveBeenCalled()
    expect(api.kasusTambah).not.toHaveBeenCalled()
    expect(k.kasus.value).toBeNull()
    expect(k.keadaan.value.tahap).toBe('izin')
  })

  it('izin-kurang dari server → tahap izin', async () => {
    api.kasusBuka.mockRejectedValue({ code: '42501', hint: 'izin-kurang', message: 'x' })
    const { k } = await siapkan()
    expect(k.keadaan.value.tahap).toBe('izin')
  })

  it('batas laju → tahap batas; tidak dicoba ulang sendiri, "Coba lagi" satu klik mencoba lagi', async () => {
    api.kasusBuka.mockResolvedValue({ ditolak: true, hint: 'batas-akses', pesan: 'x', batas: { jam: 20, hari: 60 }, terpakai: { jam: 20, hari: 21 } })
    const { k } = await siapkan()
    expect(k.keadaan.value.tahap).toBe('batas')
    expect(k.keadaan.value.batas?.batas).toEqual({ jam: 20, hari: 60 })
    pendengar.get('pointerdown')?.()
    await vi.advanceTimersByTimeAsync(10_000)
    expect(api.kasusBuka).toHaveBeenCalledTimes(1)
    api.kasusBuka.mockImplementation(async () => kasusDto())
    await k.cobaLagi()
    expect(api.kasusBuka).toHaveBeenCalledTimes(2)
    expect(k.keadaan.value.tahap).toBe('siap')
  })
})

describe('selama halaman aktif', () => {
  it('diperpanjang otomatis saat sisa ≤ 5 menit', async () => {
    api.kasusBuka.mockImplementation(async () => kasusDto({ menit: 6 }))
    const { k } = await siapkan()
    const id = k.kasus.value!.id
    api.kasusPerpanjang.mockImplementation(async () => ({ ...kasusDto({ menit: 36 }), id }))
    await vi.advanceTimersByTimeAsync(30_000)
    expect(api.kasusPerpanjang).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(40_000)
    expect(api.kasusPerpanjang).toHaveBeenCalledTimes(1)
    expect(api.kasusPerpanjang).toHaveBeenCalledWith(id)
    expect(k.sisa.value).toBeGreaterThan(30 * 60)
  })

  it('halaman tidak terpasang (Pengguna 360 ditinggal) → tidak diperpanjang, habis sendiri, data dibuang', async () => {
    api.kasusBuka.mockImplementation(async () => kasusDto({ menit: 6 }))
    const { k } = await siapkan([W1, W2], false)
    await k.muatData('kunci', async () => 'isi')
    expect(k.data('kunci')).toBe('isi')
    await vi.advanceTimersByTimeAsync(7 * MENIT)
    expect(api.kasusPerpanjang).not.toHaveBeenCalled()
    expect(k.kasus.value).toBeNull()
    expect(k.data('kunci')).toBeUndefined()
    expect(api.kasusBuka).toHaveBeenCalledTimes(1)
  })

  it('layar ditinggal (diam ≥ 30 menit) → berhenti diperpanjang dan habis; interaksi berikutnya membuka lagi', async () => {
    api.kasusBuka.mockImplementation(async () => kasusDto({ menit: 30 }))
    const { k } = await siapkan()
    const id = k.kasus.value!.id
    api.kasusPerpanjang.mockImplementation(async () => ({ ...kasusDto({ menit: 30 }), id }))
    // Menit 25: interaksi terakhir 25 menit lalu (< 30) → diperpanjang sekali
    // (sampai menit 55). Menit 50: diam 50 menit → tidak lagi; habis di 55.
    await vi.advanceTimersByTimeAsync(61 * MENIT)
    expect(api.kasusPerpanjang).toHaveBeenCalledTimes(1)
    expect(k.kasus.value).toBeNull()
    expect(api.kasusBuka).toHaveBeenCalledTimes(1)
    pendengar.get('keydown')?.()
    await vi.advanceTimersByTimeAsync(0)
    expect(api.kasusBuka).toHaveBeenCalledTimes(2)
    expect(k.kasus.value).not.toBeNull()
  })

  it('lewat batas 2 jam → kasus berakhir, data dibuang, kasus BARU dibuka otomatis', async () => {
    // Kasus di ujung anggaran: berlaku_sampai = batas_perpanjang (tidak bisa diperpanjang).
    api.kasusBuka.mockImplementationOnce(async () => kasusDto({ menit: 2, akarMenitLalu: 118 }))
    const { k } = await siapkan()
    const pertama = k.kasus.value!.id
    await k.muatData('kunci', async () => 'isi')
    await vi.advanceTimersByTimeAsync(2 * MENIT + 1_000)
    expect(api.kasusPerpanjang).not.toHaveBeenCalled()
    expect(k.data('kunci')).toBeUndefined()
    await vi.advanceTimersByTimeAsync(5_000)
    // Server ditanya dulu (kasus terikat pelaku, dipakai bersama antar-tab); tidak ada → buka.
    expect(api.kasusAktif).toHaveBeenCalledTimes(2)
    expect(api.kasusBuka).toHaveBeenCalledTimes(2)
    expect(k.kasus.value?.id).not.toBe(pertama)
  })

  it('penjaga putaran: kasus yang terus habis sesaat sesudah dibuka tidak dibuka tanpa henti', async () => {
    api.kasusBuka.mockImplementation(async () => kasusDto({ menit: 0.05, akarMenitLalu: 119.95 }))
    const { k } = await siapkan()
    await vi.advanceTimersByTimeAsync(60_000)
    expect(api.kasusBuka).toHaveBeenCalledTimes(3)
    expect(k.keadaan.value.tahap).toBe('galat')
    expect(k.keadaan.value.galat?.hint).toBe('buka-beruntun')
  })

  it('kasus ditolak server (kasus-kedaluwarsa) saat memuat → data dibuang, dibuka lagi otomatis', async () => {
    const { k } = await siapkan()
    await expect(k.muatData('x', async () => { throw new GalatAdmin('kasus', 'habis', 'kasus-kedaluwarsa') })).rejects.toThrow()
    expect(k.kasus.value).toBeNull()
    await vi.advanceTimersByTimeAsync(5_000)
    expect(api.kasusBuka).toHaveBeenCalledTimes(2)
    expect(k.kasus.value).not.toBeNull()
  })
})

describe('sesi mati saat kasus dibuka otomatis (temuan fe p2 #4)', () => {
  it('tab ditinggal, sesi console mati, tab dilihat lagi → tahap sesi (bukan galat + kode mentah); tidak dicoba ulang sendiri', async () => {
    const { k } = await siapkan()
    expect(k.keadaan.value.tahap).toBe('siap')
    aturTerlihat(false)
    await vi.advanceTimersByTimeAsync(40 * MENIT)
    expect(k.kasus.value).toBeNull()
    api.kasusAktif.mockRejectedValue(new GalatAdmin('sesi', 'cookie-ditolak'))
    aturTerlihat(true)
    await vi.advanceTimersByTimeAsync(0)
    expect(k.keadaan.value.tahap).toBe('sesi')
    expect(k.keadaan.value.galat?.jenis).toBe('sesi')
    expect(api.kasusBuka).toHaveBeenCalledTimes(1)
    // Masukan berikutnya & jadwal buka ulang tidak memanggil server lagi (induk sudah mengarahkan ke /masuk).
    const tanya = api.kasusAktif.mock.calls.length
    pendengar.get('pointerdown')?.()
    await vi.advanceTimersByTimeAsync(10 * MENIT)
    expect(api.kasusAktif.mock.calls.length).toBe(tanya)
  })

  it('galat totp (hint mfa-wajib) juga tahap sesi; "Coba lagi" yang gagal lagi memasang galat BARU (induk memantau galat)', async () => {
    api.kasusBuka.mockRejectedValue({ code: '42501', hint: 'mfa-wajib', message: 'x' })
    const { k } = await siapkan()
    expect(k.keadaan.value.tahap).toBe('sesi')
    const pertama = k.keadaan.value.galat
    await k.cobaLagi()
    expect(k.keadaan.value.tahap).toBe('sesi')
    expect(k.keadaan.value.galat).not.toBe(pertama)
  })

  it('kembali ke subjek yang sama sesudah masuk ulang → tahap sesi dilepas, kasus dibuka lagi', async () => {
    api.kasusBuka.mockRejectedValueOnce(new GalatAdmin('sesi', 'cookie-ditolak'))
    const { k } = await siapkan()
    expect(k.keadaan.value.tahap).toBe('sesi')
    // Sesudah /masuk: induk dipasang lagi → pulihkan + aturLingkup.
    await k.pulihkan(SUBJEK)
    expect(k.keadaan.value.tahap).toBe('diam')
    expect(k.keadaan.value.galat).toBeNull()
    await k.aturLingkup(SUBJEK, [W1, W2])
    expect(k.keadaan.value.tahap).toBe('siap')
    expect(k.kasus.value).not.toBeNull()
  })
})

describe('catatan (T3) satu klik', () => {
  it('kasus anak dibuka otomatis lalu admin_teks untuk id yang terlihat; anak yang hidup dipakai ulang', async () => {
    const { k } = await siapkan()
    const induk = k.kasus.value!.id
    api.kasusInvestigasi.mockImplementation(async () => kasusDto({ induk, tingkat: 'T3', ranah: ['teks'], preset: 'galat', menit: 10 }))
    api.teks.mockResolvedValue({ jenis: 'transaksi', baris: [{ id: 'a', note: 'beli gas' }] })
    await k.mintaTeks('transaksi', ['a', 'b'])
    expect(api.kasusInvestigasi).toHaveBeenCalledTimes(1)
    const [idInduk, preset, alasan] = api.kasusInvestigasi.mock.calls[0]!
    expect([idInduk, preset]).toEqual([induk, 'galat'])
    expect(alasan).toBe('Catatan dibuka dari console CashFlow · 2026-09-21 22.00.00 WIB')
    expect(api.teks.mock.calls[0]![2]).toEqual(['a', 'b'])
    expect(k.teks('transaksi', 'a')).toEqual([{ kolom: 'note', isi: 'beli gas' }])
    expect(k.teks('transaksi', 'b')).toEqual([])
    api.teks.mockResolvedValue({ jenis: 'jejak', baris: [] })
    await k.mintaTeks('jejak', [7])
    expect(api.kasusInvestigasi).toHaveBeenCalledTimes(1)
  })

  it('temuan fe p2 #3: dua klik = dua baris saja; kasus anak yang hidup dipakai ulang', async () => {
    const { k } = await siapkan()
    const induk = k.kasus.value!.id
    api.kasusInvestigasi.mockImplementation(async () => kasusDto({ induk, tingkat: 'T3', ranah: ['teks'], preset: 'galat', menit: 10 }))
    api.teks.mockImplementation(async (_anak: string, jenis: string, ids: string[]) => ({ jenis, baris: ids.map(id => ({ id, note: `n-${id}` })) }))
    await k.mintaTeks('transaksi', ['a'])
    await vi.advanceTimersByTimeAsync(3 * MENIT)
    await k.mintaTeks('transaksi', ['c'])
    expect(api.kasusInvestigasi).toHaveBeenCalledTimes(1)
    expect(api.teks.mock.calls.map(c => c[2])).toEqual([['a'], ['c']])
    expect(k.teks('transaksi', 'a')).toEqual([{ kolom: 'note', isi: 'n-a' }])
    expect(k.teks('transaksi', 'b')).toBeNull()
    // Baris yang sudah terbuka tidak diminta ulang (tidak ada audit tambahan).
    await k.mintaTeks('transaksi', ['a'])
    expect(api.teks).toHaveBeenCalledTimes(2)
  })

  it('tanpa izin investigasi → galat izin dilempar ke tombol, tanpa baca teks', async () => {
    const { k } = await siapkan()
    api.kasusInvestigasi.mockRejectedValue({ code: '42501', hint: 'izin-kurang', message: 'x' })
    await expect(k.mintaTeks('transaksi', ['a'])).rejects.toMatchObject({ jenis: 'izin' })
    expect(api.teks).not.toHaveBeenCalled()
  })
})

describe('aktivitas = masukan orang, bukan tata letak (temuan fe p1 #1)', () => {
  it('yang didengar hanya pointerdown/keydown/wheel/touchstart — "scroll" tidak', async () => {
    await siapkan()
    const didengar = [...pendengar.keys()].filter(p => !p.startsWith('dokumen:')).sort()
    expect(didengar).toEqual(['keydown', 'pointerdown', 'touchstart', 'wheel'])
    expect(pendengar.has('dokumen:visibilitychange')).toBe(true)
    const { PERISTIWA_AKTIVITAS } = await modul()
    expect(PERISTIWA_AKTIVITAS).not.toContain('scroll')
  })

  it('halaman diam, kasus habis, isi memendek → "scroll" dari tata letak tidak membuka kasus', async () => {
    // Di ujung anggaran 2 jam (tidak bisa diperpanjang), habis di menit 40;
    // tidak ada masukan sejak dibuka → di menit 40 layar sudah diam > 30 menit.
    api.kasusBuka.mockImplementationOnce(async () => kasusDto({ menit: 40, akarMenitLalu: 80 }))
    const { k } = await siapkan()
    await k.muatData('kunci', async () => 'isi')
    await vi.advanceTimersByTimeAsync(40 * MENIT + 500)
    expect(k.kasus.value).toBeNull()
    expect(k.data('kunci')).toBeUndefined()
    // Peramban menjepit posisi gulir (isTrusted) — tidak ada pendengarnya.
    pendengar.get('scroll')?.()
    await vi.advanceTimersByTimeAsync(10 * MENIT)
    expect(api.kasusBuka).toHaveBeenCalledTimes(1)
    expect(api.kasusAktif).toHaveBeenCalledTimes(1)
    expect(k.kasus.value).toBeNull()
  })

  it('sabuk kedua: masukan ≤ 2 detik sesudah data dibuang diabaikan; sesudahnya membuka lagi', async () => {
    api.kasusBuka.mockImplementationOnce(async () => kasusDto({ menit: 40, akarMenitLalu: 80 }))
    const { k } = await siapkan()
    await vi.advanceTimersByTimeAsync(40 * MENIT + 500)
    expect(k.kasus.value).toBeNull()
    // Peristiwa apa pun sesaat sesudah isi diganti kerangka: bukan bukti ada orang.
    pendengar.get('pointerdown')?.()
    await vi.advanceTimersByTimeAsync(10_000)
    expect(api.kasusBuka).toHaveBeenCalledTimes(1)
    expect(k.kasus.value).toBeNull()
    // Orang kembali: satu masukan membuka lagi.
    pendengar.get('pointerdown')?.()
    await vi.advanceTimersByTimeAsync(0)
    expect(api.kasusBuka).toHaveBeenCalledTimes(2)
    expect(k.kasus.value).not.toBeNull()
  })
})

describe('kasus dipakai bersama antar-tab: tanya server dulu sebelum membuka (temuan fe p1 #3)', () => {
  it('salinan tab tersembunyi habis, server masih punya kasusnya → dipakai, admin_kasus_buka TIDAK dipanggil', async () => {
    // Tab ini memulihkan K1 yang tinggal 1 menit; tab lain lalu memperpanjangnya di server.
    const k1 = kasusDto({ menit: 1 })
    api.kasusAktif.mockResolvedValueOnce({ kasus: k1, investigasi: [] })
    const { k } = await siapkan()
    expect(k.kasus.value?.id).toBe(k1.id)
    api.kasusAktif.mockResolvedValue({ kasus: { ...k1, berlaku_sampai: new Date(Date.now() + 31 * MENIT).toISOString() }, investigasi: [] })
    aturTerlihat(false)
    await vi.advanceTimersByTimeAsync(61_000)
    expect(k.kasus.value).toBeNull()
    expect(api.kasusPerpanjang).not.toHaveBeenCalled()
    aturTerlihat(true)
    // Pembukaan ulang yang sudah dijadwalkan (jeda 5 detik sesudah habis) yang berjalan.
    await vi.advanceTimersByTimeAsync(5_000)
    expect(api.kasusAktif).toHaveBeenCalledTimes(2)
    expect(api.kasusBuka).not.toHaveBeenCalled()
    expect(k.kasus.value?.id).toBe(k1.id)
    expect(k.sisa.value).toBeGreaterThan(29 * 60)
    expect(k.keadaan.value.tahap).toBe('siap')
  })

  it('tab lama ditinggal lalu dibuka lagi → kasus yang diperpanjang tab lain dipulihkan saat itu juga', async () => {
    const k1 = kasusDto({ menit: 1 })
    api.kasusAktif.mockResolvedValueOnce({ kasus: k1, investigasi: [] })
    const { k } = await siapkan()
    api.kasusAktif.mockResolvedValue({ kasus: { ...k1, berlaku_sampai: new Date(Date.now() + 40 * MENIT).toISOString() }, investigasi: [] })
    aturTerlihat(false)
    await vi.advanceTimersByTimeAsync(10 * MENIT)
    expect(k.kasus.value).toBeNull()
    aturTerlihat(true)
    await vi.advanceTimersByTimeAsync(0)
    expect(api.kasusAktif).toHaveBeenCalledTimes(2)
    expect(api.kasusBuka).not.toHaveBeenCalled()
    expect(k.kasus.value?.id).toBe(k1.id)
  })

  it('server menjawab kasus-tidak-dikenal (tab lain membuka pengganti) → kasus pengganti dipakai, tanpa buka baru', async () => {
    const { k } = await siapkan()
    expect(api.kasusBuka).toHaveBeenCalledTimes(1)
    const pengganti = kasusDto()
    api.kasusAktif.mockResolvedValue({ kasus: pengganti, investigasi: [] })
    await expect(k.muatData('x', async () => { throw new GalatAdmin('kasus', 'ditutup', 'kasus-tidak-dikenal') })).rejects.toThrow()
    expect(k.kasus.value).toBeNull()
    await vi.advanceTimersByTimeAsync(5_000)
    expect(api.kasusBuka).toHaveBeenCalledTimes(1)
    expect(k.kasus.value?.id).toBe(pengganti.id)
  })

  it('kasus dari server yang kurang ranah/ruang dilengkapi (admin_kasus_tambah), bukan dibuka baru', async () => {
    const { k } = await siapkan()
    const sempit = kasusDto({ ranah: ['akun'], tingkat: 'T1', ruang: [W1], jumlah_ruang: 1 })
    api.kasusAktif.mockResolvedValue({ kasus: sempit, investigasi: [] })
    api.kasusTambah.mockImplementation(async () => ({ ...sempit, ranah: ['akun', 'jejak', 'transaksi'], ruang: [W1, W2], tingkat: 'T2' }))
    await expect(k.muatData('x', async () => { throw new GalatAdmin('kasus', 'habis', 'kasus-kedaluwarsa') })).rejects.toThrow()
    await vi.advanceTimersByTimeAsync(5_000)
    expect(api.kasusBuka).toHaveBeenCalledTimes(1)
    expect(api.kasusTambah).toHaveBeenCalledWith(sempit.id, ['transaksi', 'jejak'], [W2])
    expect(k.kasus.value?.ranah).toEqual(['akun', 'jejak', 'transaksi'])
  })

  it('kasus server yang sudah lewat menurut jam tab ini tidak dipasang (langsung dibuang lagi) → dibuka baru', async () => {
    const { k } = await siapkan()
    api.kasusAktif.mockResolvedValue({ kasus: kasusDto({ menit: -0.1 }), investigasi: [] })
    await expect(k.muatData('x', async () => { throw new GalatAdmin('kasus', 'habis', 'kasus-kedaluwarsa') })).rejects.toThrow()
    await vi.advanceTimersByTimeAsync(5_000)
    expect(api.kasusBuka).toHaveBeenCalledTimes(2)
    expect(k.keadaan.value.tahap).toBe('siap')
  })
})

const SUBJEK_B = '9a8b7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d'
const W3 = 'e1f2a3b4-c5d6-4e7f-8a9b-0c1d2e3f4a5b'

describe('jawaban basi subjek lama tidak menempel pada subjek baru (temuan fe p3 #1)', () => {
  beforeEach(() => {
    // Kasus yang dibuka memuat subjek & ruang yang diminta — supaya lingkup basi terlihat bedanya.
    api.kasusBuka.mockImplementation(async (subjek: string, _s: unknown, _p: unknown, _r: unknown, ruang: string[]) =>
      kasusDto({ subjek_id: subjek, ruang, jumlah_ruang: ruang.length }))
  })

  it('pulihkan(A), pulihkan(B), lalu aturLingkup basi untuk A → lingkup B tetap, kasusBuka tidak dipanggil', async () => {
    const k = (await modul()).useCashflowKasus()
    lepas = k.pasangHalaman()
    await k.pulihkan(SUBJEK)
    await k.pulihkan(SUBJEK_B)
    await k.aturLingkup(SUBJEK, [W1, W2])
    expect(k.keadaan.value.subjek).toBe(SUBJEK_B)
    expect(k.keadaan.value.lingkup).toBeNull()
    expect(k.keadaan.value.tahap).toBe('diam')
    expect(api.kasusBuka).not.toHaveBeenCalled()
    // Kepala B yang sah tetap membuka kasus B dengan ruang B saja.
    await k.aturLingkup(SUBJEK_B, [W3])
    expect(api.kasusBuka).toHaveBeenCalledTimes(1)
    expect(api.kasusBuka.mock.calls[0]![0]).toBe(SUBJEK_B)
    expect(api.kasusBuka.mock.calls[0]![4]).toEqual([W3])
    expect(k.keadaan.value.lingkup).toEqual([W3])
  })

  it('kasus aktif A tiba SESUDAH kasus B dibuka: pulihkan(A) pulang tanpa efek, aturLingkup(A) basi tidak menambah ruang A ke kasus B', async () => {
    let jawabA!: (v: unknown) => void
    api.kasusAktif.mockImplementationOnce(() => new Promise((r) => { jawabA = r }))
    const k = (await modul()).useCashflowKasus()
    lepas = k.pasangHalaman()
    const pulihA = k.pulihkan(SUBJEK)
    await k.pulihkan(SUBJEK_B)
    await k.aturLingkup(SUBJEK_B, [W3])
    const kasusB = k.kasus.value!.id
    jawabA({ kasus: kasusDto({ ruang: [W1, W2] }), investigasi: [] })
    await pulihA
    await k.aturLingkup(SUBJEK, [W1, W2])
    await vi.advanceTimersByTimeAsync(0)
    expect(k.kasus.value?.id).toBe(kasusB)
    expect(k.kasus.value?.ruang).toEqual([W3])
    expect(k.keadaan.value.lingkup).toEqual([W3])
    expect(api.kasusTambah).not.toHaveBeenCalled()
    expect(api.kasusBuka).toHaveBeenCalledTimes(1)
    expect(k.keadaan.value.tahap).toBe('siap')
  })
})

describe('tambah() terlambat tidak memasang kasus subjek lama (temuan F11)', () => {
  beforeEach(() => {
    api.kasusBuka.mockImplementation(async (subjek: string, _s: unknown, _p: unknown, _r: unknown, ruang: string[]) =>
      kasusDto({ subjek_id: subjek, ruang, jumlah_ruang: ruang.length }))
  })

  it('"Masukkan ke lingkup" untuk A dijawab SESUDAH kasus B terbuka → kasus B tetap, tidak ada perpanjangan kasus A', async () => {
    const { k } = await siapkan([W1])
    const kasusA = k.kasus.value!
    let jawab!: (v: unknown) => void
    api.kasusTambah.mockImplementationOnce(() => new Promise((r) => { jawab = r }))
    const tambahA = k.tambah([], [W2])
    // Staf pindah ke B lewat palet selagi tambah(A) masih berjalan.
    await k.pulihkan(SUBJEK_B)
    await k.aturLingkup(SUBJEK_B, [W3])
    const kasusB = k.kasus.value!
    expect(kasusB.subjekId).toBe(SUBJEK_B)
    jawab({ ...kasusDto({ ruang: [W1, W2], jumlah_ruang: 2 }), id: kasusA.id })
    await tambahA
    expect(k.kasus.value?.id).toBe(kasusB.id)
    expect(k.kasus.value?.subjekId).toBe(SUBJEK_B)
    expect(k.kasus.value?.ruang).toEqual([W3])
    // Detak berjalan sampai ambang perpanjang: yang diperpanjang kasus B, bukan A.
    api.kasusPerpanjang.mockImplementation(async (id: string) => ({ ...kasusDto({ subjek_id: SUBJEK_B, ruang: [W3], menit: 30 }), id }))
    pendengar.get('pointerdown')?.()
    await vi.advanceTimersByTimeAsync(26 * MENIT)
    expect(api.kasusPerpanjang.mock.calls.map(c => c[0])).not.toContain(kasusA.id)
  })

  it('A → B → A selagi tambah(A) berjalan: jawaban untuk kasus A yang LAMA tidak menimpa kasus A yang baru', async () => {
    const { k } = await siapkan([W1])
    const lama = k.kasus.value!
    let jawab!: (v: unknown) => void
    api.kasusTambah.mockImplementationOnce(() => new Promise((r) => { jawab = r }))
    const tambahLama = k.tambah([], [W2])
    await k.pulihkan(SUBJEK_B)
    await k.aturLingkup(SUBJEK_B, [W3])
    await k.pulihkan(SUBJEK)
    await k.aturLingkup(SUBJEK, [W1])
    const baru = k.kasus.value!
    expect(baru.id).not.toBe(lama.id)
    jawab({ ...kasusDto({ ruang: [W1, W2], jumlah_ruang: 2 }), id: lama.id })
    await tambahLama
    expect(k.kasus.value?.id).toBe(baru.id)
  })

  it('tambah() di subjek yang sama tetap memasang lingkup barunya', async () => {
    const { k } = await siapkan([W1])
    const id = k.kasus.value!.id
    api.kasusTambah.mockImplementationOnce(async () => ({ ...kasusDto({ ruang: [W1, W2], jumlah_ruang: 2 }), id }))
    await k.tambah([], [W2])
    expect(k.kasus.value?.ruang).toEqual([W1, W2])
  })

  it('pasang() menolak kasus yang subjeknya bukan subjek tab ini (mis. kasus aktif salah alamat)', async () => {
    api.kasusAktif.mockResolvedValue({ kasus: kasusDto({ subjek_id: SUBJEK_B }), investigasi: [] })
    const k = (await modul()).useCashflowKasus()
    lepas = k.pasangHalaman()
    await k.pulihkan(SUBJEK)
    expect(k.kasus.value).toBeNull()
    // Subjek sama dengan huruf besar tetap diterima (uuid tidak peka huruf).
    api.kasusAktif.mockResolvedValue({ kasus: kasusDto({ subjek_id: SUBJEK.toUpperCase() }), investigasi: [] })
    await k.pulihkan(SUBJEK)
    expect(k.kasus.value?.subjekId).toBe(SUBJEK.toUpperCase())
  })
})

describe('kunjungan baru ke subjek yang sama mencoba lagi (temuan fe p3 #3)', () => {
  /** Induk Pengguna 360 dipasang lagi (kembali dari daftar): pasangHalaman + pulihkan + aturLingkup. */
  async function kunjungi(k: Awaited<ReturnType<typeof siapkan>>['k']) {
    lepas?.()
    lepas = k.pasangHalaman()
    await k.pulihkan(SUBJEK)
    await k.aturLingkup(SUBJEK, [W1, W2])
  }
  function tinggalkan() {
    lepas?.()
    lepas = null
  }

  it('pembukaan gagal sekali (jaringan) → dibuka lagi 60 menit kemudian: kasus terbuka, bukan galat lama', async () => {
    api.kasusBuka.mockRejectedValueOnce(new TypeError('Failed to fetch'))
    const { k } = await siapkan()
    expect(k.keadaan.value.tahap).toBe('galat')
    tinggalkan()
    await vi.advanceTimersByTimeAsync(60 * MENIT)
    await kunjungi(k)
    expect(api.kasusBuka).toHaveBeenCalledTimes(2)
    expect(k.keadaan.value.tahap).toBe('siap')
    expect(k.keadaan.value.galat).toBeNull()
    expect(k.kasus.value).not.toBeNull()
  })

  it('batas laju → dibuka lagi 120 menit kemudian: dicoba lagi, "batas" lama tidak menempel', async () => {
    api.kasusBuka.mockResolvedValueOnce({ ditolak: true, hint: 'batas-akses', pesan: 'x', batas: { jam: 20, hari: 60 }, terpakai: { jam: 20, hari: 21 } })
    const { k } = await siapkan()
    expect(k.keadaan.value.tahap).toBe('batas')
    tinggalkan()
    await vi.advanceTimersByTimeAsync(120 * MENIT)
    await kunjungi(k)
    expect(api.kasusBuka).toHaveBeenCalledTimes(2)
    expect(k.keadaan.value.tahap).toBe('siap')
    expect(k.keadaan.value.batas).toBeNull()
    expect(k.kasus.value).not.toBeNull()
  })

  it('batas masih berlaku di server → kunjungan baru menampilkan jawaban BARU (satu panggilan per kunjungan)', async () => {
    api.kasusBuka.mockResolvedValueOnce({ ditolak: true, hint: 'batas-akses', pesan: 'x', batas: { jam: 20, hari: 60 }, terpakai: { jam: 20, hari: 21 } })
    api.kasusBuka.mockResolvedValueOnce({ ditolak: true, hint: 'batas-akses', pesan: 'y', batas: { jam: 20, hari: 60 }, terpakai: { jam: 20, hari: 40 } })
    const { k } = await siapkan()
    tinggalkan()
    await vi.advanceTimersByTimeAsync(10 * MENIT)
    await kunjungi(k)
    expect(api.kasusBuka).toHaveBeenCalledTimes(2)
    expect(k.keadaan.value.tahap).toBe('batas')
    expect(k.keadaan.value.batas?.terpakai).toEqual({ jam: 20, hari: 40 })
  })

  it('izin-kurang dari server → kunjungan baru mencoba lagi (mis. sesudah sambung ulang ber-TOTP)', async () => {
    api.kasusBuka.mockRejectedValueOnce({ code: '42501', hint: 'izin-kurang', message: 'x' })
    const { k } = await siapkan()
    expect(k.keadaan.value.tahap).toBe('izin')
    tinggalkan()
    await kunjungi(k)
    expect(api.kasusBuka).toHaveBeenCalledTimes(2)
    expect(k.keadaan.value.tahap).toBe('siap')
  })

  it('kepala tetap tanpa ruang (sesi tanpa pii) → kunjungan baru tetap tahap izin, tanpa panggilan buka', async () => {
    const { k } = await siapkan(null)
    expect(k.keadaan.value.tahap).toBe('izin')
    tinggalkan()
    lepas = k.pasangHalaman()
    await k.pulihkan(SUBJEK)
    await k.aturLingkup(SUBJEK, null)
    expect(k.keadaan.value.tahap).toBe('izin')
    expect(api.kasusBuka).not.toHaveBeenCalled()
  })

  it('penjaga putaran tetap berlaku: kunjungan ulang sesaat sesudah buka-beruntun tidak membuka kasus lagi', async () => {
    api.kasusBuka.mockImplementation(async () => kasusDto({ menit: 0.05, akarMenitLalu: 119.95 }))
    const { k } = await siapkan()
    await vi.advanceTimersByTimeAsync(60_000)
    expect(api.kasusBuka).toHaveBeenCalledTimes(3)
    expect(k.keadaan.value.galat?.hint).toBe('buka-beruntun')
    await kunjungi(k)
    expect(api.kasusBuka).toHaveBeenCalledTimes(3)
    expect(k.keadaan.value.tahap).toBe('galat')
    expect(k.keadaan.value.galat?.hint).toBe('buka-beruntun')
  })

  it('tanpa kunjungan baru, masukan di halaman yang sama tidak mengulang pembukaan yang gagal', async () => {
    api.kasusBuka.mockRejectedValueOnce(new TypeError('Failed to fetch'))
    const { k } = await siapkan()
    pendengar.get('pointerdown')?.()
    await vi.advanceTimersByTimeAsync(10 * MENIT)
    expect(api.kasusBuka).toHaveBeenCalledTimes(1)
    expect(k.keadaan.value.tahap).toBe('galat')
  })
})

describe('Ruang 360 (0094): subjek bertipe workspace, satu klik', () => {
  async function siapkanRuang(lingkup: string[] | null = [W1]) {
    const m = await modul()
    const k = m.useCashflowKasus()
    lepas = k.pasangHalaman()
    await k.pulihkan(W1, 'workspace')
    await k.aturLingkup(W1, lingkup)
    return k
  }
  const kasusRuang = (x: Partial<KasusDTO> = {}) => kasusDto({
    subjek_tipe: 'workspace', subjek_id: W1, ruang: [W1], jumlah_ruang: 1, skenario: 'ruang_360', ranah: ['dompet', 'jejak', 'ruang', 'transaksi'], ...x,
  })

  it('tanpa kasus → admin_kasus_aktif_ruang lalu admin_kasus_buka workspace berlingkup [W], ranah tab ruang, tanpa masukan orang', async () => {
    api.kasusBuka.mockImplementation(async () => kasusRuang())
    const k = await siapkanRuang()
    expect(api.kasusAktifRuang).toHaveBeenCalledWith(W1)
    expect(api.kasusAktif).not.toHaveBeenCalled()
    expect(api.kasusBuka).toHaveBeenCalledTimes(1)
    const [subjek, skenario, preset, ranah, ruang, alasan, tipe] = api.kasusBuka.mock.calls[0]!
    expect([subjek, skenario, preset, [...ranah], ruang, tipe]).toEqual([W1, 'ruang_360', 'keluhan', ['ruang', 'dompet', 'transaksi', 'jejak'], [W1], 'workspace'])
    expect(alasan).toBe('Dibuka dari console CashFlow — Ruang 360 · 2026-09-21 22.00.00 WIB')
    expect(k.keadaan.value.tahap).toBe('siap')
  })

  it('kasus PENGGUNA yang lingkupnya memuat W dipakai (datang dari Pengguna 360): ranah kurang ditambah, tanpa kasus baru', async () => {
    const pengguna = kasusDto({ ranah: ['akun', 'jejak', 'transaksi'] })
    api.kasusAktifRuang.mockResolvedValue({ kasus: pengguna, investigasi: [] })
    api.kasusTambah.mockImplementation(async () => ({ ...pengguna, ranah: ['akun', 'dompet', 'jejak', 'ruang', 'transaksi'] }))
    const k = await siapkanRuang()
    expect(api.kasusBuka).not.toHaveBeenCalled()
    expect(api.kasusTambah).toHaveBeenCalledWith(pengguna.id, ['ruang', 'dompet'], [])
    expect(k.kasus.value?.id).toBe(pengguna.id)
    expect(k.keadaan.value.tahap).toBe('siap')
  })

  it('kasus aktif yang tidak memuat W ditolak (bukan milik halaman ini) → kasus ruang baru', async () => {
    api.kasusAktifRuang.mockResolvedValue({ kasus: kasusDto({ ruang: [W2] }), investigasi: [] })
    api.kasusBuka.mockImplementation(async () => kasusRuang())
    const k = await siapkanRuang()
    expect(api.kasusBuka).toHaveBeenCalledTimes(1)
    expect(k.kasus.value?.subjekTipe).toBe('workspace')
  })

  it('sesi tanpa pii: pemulihan ditolak izin-kurang → tahap izin, tanpa kasusBuka, tanpa galat pemuatan', async () => {
    api.kasusAktifRuang.mockRejectedValue({ code: '42501', hint: 'izin-kurang', message: 'x' })
    const k = await siapkanRuang(null)
    expect(k.keadaan.value.tahap).toBe('izin')
    expect(k.keadaan.value.pulih).toBe('siap')
    expect(api.kasusBuka).not.toHaveBeenCalled()
  })

  it('galat lain saat pemulihan ruang tetap dilempar', async () => {
    api.kasusAktifRuang.mockRejectedValue({ code: 'P0002', message: 'Ruang tidak ditemukan.' })
    const m = await modul()
    const k = m.useCashflowKasus()
    await expect(k.pulihkan(W1, 'workspace')).rejects.toMatchObject({ jenis: 'tidak-ada' })
    expect(k.keadaan.value.pulih).toBe('galat')
  })

  it('pengguna → ruang → pengguna: ganti jenis subjek membuang data, kasus pengguna ditanya lewat admin_kasus_aktif', async () => {
    const pengguna = kasusDto({ ranah: ['akun', 'dompet', 'jejak', 'ruang', 'transaksi'] })
    api.kasusAktif.mockResolvedValue({ kasus: pengguna, investigasi: [] })
    api.kasusAktifRuang.mockResolvedValue({ kasus: pengguna, investigasi: [] })
    const { k } = await siapkan()
    await k.muatData('tx-pengguna', async () => 'isi')
    await k.pulihkan(W1, 'workspace')
    expect(k.data('tx-pengguna')).toBeUndefined()
    await k.aturLingkup(W1, [W1])
    expect(k.kasus.value?.id).toBe(pengguna.id)
    await k.pulihkan(SUBJEK)
    expect(api.kasusAktif).toHaveBeenCalledTimes(2)
    expect(api.kasusBuka).not.toHaveBeenCalled()
  })
})
