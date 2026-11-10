/**
 * useCashflowDomi — alur tab Domi tanpa Nuxt: useCashflowAdmin dan
 * useCashflowKasus dipasang sebagai global tiruan. Data karangan saja.
 */
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'
import 'vue'
import { GalatAdmin } from '~/composables/cashflow/useCashflowAdmin'

const SUBJEK = '3f0c2a4e-8b1d-4c6a-9e2f-1a2b3c4d5e6f'
const P = '22222222-2222-4222-8222-222222222222'
const J = (n: number) => `${SUBJEK}/${P}/33333333-3333-4333-8333-33333333333${n}.jpg`
let nomorAnak = 1
const pendengar = new Set<() => void>()
let lepasDipanggil: string[] = []

const kasus = {
  kasus: { value: { id: 'induk' } },
  anakDomiOtomatis: async () => ({ id: `anak${nomorAnak}` }),
  lepasAnak: (id: string) => { lepasDipanggil.push(id); nomorAnak++ },
  saatDibuang: (f: () => void) => { pendengar.add(f); return () => pendengar.delete(f) },
  tampilkanFoto: vi.fn(),
}
const api = {
  aiPercakapanDaftar: vi.fn(),
  aiPesanDaftar: vi.fn(),
  aiGambar: vi.fn(),
  ambilBerkas: vi.fn(async () => new Blob(['x'], { type: 'image/jpeg' })),
}
vi.stubGlobal('useCashflowAdmin', () => api)
vi.stubGlobal('useCashflowKasus', () => kasus)
const { useCashflowDomi } = await import('~/composables/cashflow/useCashflowDomi')

const satuPesanFoto = (id: number, jalur: string[]) => ({
  percakapan: { id: P, judul: 'J', jumlah_pesan: 1, dibuat: '', diperbarui: '' },
  pesan: [{ id, peran: 'user', isi: { teks: 'x', gambar: true, gambar_jalur_daftar: jalur }, dibuat: '' }],
  kursor_sebelum: null, ada_lagi: false, halaman_pertama: true,
})

afterAll(() => { vi.unstubAllGlobals() })
beforeEach(() => {
  nomorAnak = 1
  lepasDipanggil = []
  api.aiPercakapanDaftar.mockReset()
  api.aiPesanDaftar.mockReset()
  api.aiGambar.mockReset()
  api.ambilBerkas.mockClear()
  kasus.tampilkanFoto.mockClear()
  // Keadaan modul dibuang lewat pendengar yang didaftarkan modul.
  for (const f of pendengar) f()
})

const tungguFoto = () => new Promise(r => setTimeout(r, 0))

const P2 = '44444444-4444-4444-8444-444444444444'
const ditunda = <T,>() => { let bereskan!: (v: T) => void; const janji = new Promise<T>((r) => { bereskan = r }); return { janji, bereskan } }
const baris = (id: string, judul: string) => ({ id, judul, jumlah_pesan: 1, dibuat: '', diperbarui: '' })
const hal = (id: string, judul: string) => ({ percakapan: baris(id, judul), pesan: [], kursor_sebelum: null, ada_lagi: false, halaman_pertama: true })

describe('isi tidak tertinggal dan jawaban tidak bertabrakan', () => {
  it('tab ditinggal: isi hilang, membuka lagi berarti baca baru', async () => {
    const d = useCashflowDomi(); d.pasangSubjek(SUBJEK)
    api.aiPercakapanDaftar.mockResolvedValue({ baris: [baris(P, 'A')], kursor_berikut: null, total: 1, halaman_pertama: true })
    await d.buka(SUBJEK)
    api.aiPesanDaftar.mockResolvedValue(hal(P, 'ISI'))
    await d.bukaPercakapan(P)
    d.buangSekarang()
    expect(d.panel.value).toBeNull()
    expect(d.daftar.value).toEqual([])
    expect(d.sudahDibuka.value).toBe(false)
    await d.buka(SUBJEK)
    expect(api.aiPercakapanDaftar).toHaveBeenCalledTimes(2)
  })
  it('pembukaan yang masih di jalan saat data dibuang tidak disimpan', async () => {
    const d = useCashflowDomi(); d.pasangSubjek(SUBJEK)
    const a = ditunda<unknown>()
    api.aiPercakapanDaftar.mockReturnValueOnce(a.janji)
    const p = d.buka(SUBJEK)
    await Promise.resolve(); await Promise.resolve()
    for (const f of pendengar) f()
    a.bereskan({ baris: [baris(P, 'A')], kursor_berikut: null, total: 1, halaman_pertama: true })
    await p
    expect(d.sudahDibuka.value).toBe(false)
    expect(d.daftar.value).toEqual([])
  })
  it('klik A lalu B: jawaban A yang terlambat tidak menimpa B', async () => {
    const d = useCashflowDomi(); d.pasangSubjek(SUBJEK)
    api.aiPercakapanDaftar.mockResolvedValue({ baris: [baris(P, 'A'), baris(P2, 'B')], kursor_berikut: null, total: 2, halaman_pertama: true })
    await d.buka(SUBJEK)
    const a = ditunda<unknown>(); const b = ditunda<unknown>()
    api.aiPesanDaftar.mockReturnValueOnce(a.janji).mockReturnValueOnce(b.janji)
    const pa = d.bukaPercakapan(P); const pb = d.bukaPercakapan(P2)
    b.bereskan(hal(P2, 'B')); await pb
    a.bereskan(hal(P, 'A')); await pa
    expect(d.panel.value?.percakapan.id).toBe(P2)
  })
  it('muat daftar lagi dua kali serentak: satu panggilan, tanpa baris kembar', async () => {
    const d = useCashflowDomi(); d.pasangSubjek(SUBJEK)
    api.aiPercakapanDaftar.mockResolvedValueOnce({ baris: [baris(P, 'A')], kursor_berikut: { d: 'x', i: P }, total: 2, halaman_pertama: true })
    await d.buka(SUBJEK)
    api.aiPercakapanDaftar.mockResolvedValue({ baris: [baris(P2, 'B')], kursor_berikut: null, total: null, halaman_pertama: false })
    await Promise.all([d.muatDaftarLagi(SUBJEK), d.muatDaftarLagi(SUBJEK)])
    expect(d.daftar.value).toHaveLength(2)
    expect(api.aiPercakapanDaftar).toHaveBeenCalledTimes(2)
  })
})

describe('useCashflowDomi', () => {
  it('buka memakai anak Domi lalu mengisi daftar', async () => {
    api.aiPercakapanDaftar.mockResolvedValue({ baris: [{ id: P, judul: 'Belanja', jumlah_pesan: 2, dibuat: '', diperbarui: '' }], kursor_berikut: null, total: 1, halaman_pertama: true })
    const d = useCashflowDomi()
    d.pasangSubjek(SUBJEK)
    await d.buka(SUBJEK)
    expect(api.aiPercakapanDaftar).toHaveBeenCalledWith('anak1', SUBJEK, null, 20)
    expect(d.sudahDibuka.value).toBe(true)
    expect(d.daftar.value[0]).toMatchObject({ id: P, jumlahPesan: 2 })
  })

  it('anak habis di server diganti SEKALI lalu diulang', async () => {
    api.aiPercakapanDaftar
      .mockRejectedValueOnce(new GalatAdmin('kasus', 'habis', 'kasus-kedaluwarsa'))
      .mockResolvedValueOnce({ baris: [], kursor_berikut: null, total: 0, halaman_pertama: true })
    const d = useCashflowDomi()
    d.pasangSubjek(SUBJEK)
    await d.buka(SUBJEK)
    expect(lepasDipanggil).toEqual(['anak1'])
    expect(api.aiPercakapanDaftar).toHaveBeenCalledTimes(2)
    expect(api.aiPercakapanDaftar.mock.calls[1]![0]).toBe('anak2')
  })

  it('galat selain kasus (mis. izin) tidak diulang dan dilempar', async () => {
    api.aiPercakapanDaftar.mockRejectedValueOnce(new GalatAdmin('izin', 'tidak', 'izin-kurang'))
    const d = useCashflowDomi()
    d.pasangSubjek(SUBJEK)
    await expect(d.buka(SUBJEK)).rejects.toThrow()
    expect(api.aiPercakapanDaftar).toHaveBeenCalledTimes(1)
    expect(lepasDipanggil).toEqual([])
  })

  it('buka percakapan: pesan terpetakan, foto diambil per paket, belum terunggah ditandai', async () => {
    api.aiPesanDaftar.mockResolvedValue(satuPesanFoto(7, [J(1), J(2)]))
    api.aiGambar.mockResolvedValue({ berkas: [
      { pesan: 7, urutan: 1, jalur: J(1), url: 'https://ref/storage/v1/object/sign/ai-gambar/x?token=t', kedaluwarsa_pada: 'z' },
      { pesan: 7, urutan: 2, jalur: J(2), url: null, kedaluwarsa_pada: null },
    ], berlaku_detik: 300 })
    const d = useCashflowDomi()
    d.pasangSubjek(SUBJEK)
    await d.bukaPercakapan(P)
    await tungguFoto()
    expect(api.aiGambar).toHaveBeenCalledWith('anak1', P, [7])
    expect(d.panel.value?.percakapan.id).toBe(P)
    expect(d.foto.value.get(J(1))).toMatchObject({ keadaan: 'siap' })
    expect(d.foto.value.get(J(1))?.src).toMatch(/^blob:/)
    expect(d.foto.value.get(J(2))).toMatchObject({ keadaan: 'belum', src: null })
  })

  it('tanpa-lampiran dari server: foto ditandai belum tanpa galat', async () => {
    api.aiPesanDaftar.mockResolvedValue(satuPesanFoto(8, [J(1)]))
    api.aiGambar.mockRejectedValue(new GalatAdmin('tidak-ada', 'x', 'tanpa-lampiran'))
    const d = useCashflowDomi()
    d.pasangSubjek(SUBJEK)
    await d.bukaPercakapan(P)
    await tungguFoto()
    expect(d.foto.value.get(J(1))).toMatchObject({ keadaan: 'belum' })
  })

  it('muat lebih lama menambah di atas, urutan lama ke baru', async () => {
    const hal = (id: number, adaLagi: boolean, kursor: number | null) => ({
      percakapan: { id: P, judul: 'J', jumlah_pesan: 2, dibuat: '', diperbarui: '' },
      pesan: [{ id, peran: 'user', isi: { teks: `t${id}` }, dibuat: '' }],
      kursor_sebelum: kursor, ada_lagi: adaLagi, halaman_pertama: adaLagi,
    })
    api.aiPesanDaftar.mockResolvedValueOnce(hal(20, true, 20)).mockResolvedValueOnce(hal(10, false, null))
    const d = useCashflowDomi()
    d.pasangSubjek(SUBJEK)
    await d.bukaPercakapan(P)
    await d.muatLebihLama()
    expect(api.aiPesanDaftar.mock.calls[1]).toEqual(['anak1', P, 20, 30])
    expect(d.panel.value?.pesan.map(p => p.id)).toEqual([10, 20])
    expect(d.panel.value?.adaLagi).toBe(false)
  })

  it('data dibuang: isi dan blob hilang, jawaban yang tiba sesudahnya tidak disimpan', async () => {
    api.aiPesanDaftar.mockResolvedValue(satuPesanFoto(9, [J(1)]))
    let selesaiGambar: (v: unknown) => void = () => {}
    api.aiGambar.mockImplementationOnce(() => new Promise((r) => { selesaiGambar = r }))
    const revoke = vi.spyOn(URL, 'revokeObjectURL')
    const d = useCashflowDomi()
    d.pasangSubjek(SUBJEK)
    await d.bukaPercakapan(P)
    await tungguFoto()
    expect(d.panel.value).not.toBeNull()
    for (const f of pendengar) f()
    expect(d.panel.value).toBeNull()
    expect(d.dibuang.value).toBe(true)
    selesaiGambar({ berkas: [{ pesan: 9, urutan: 1, jalur: J(1), url: 'u', kedaluwarsa_pada: 'z' }], berlaku_detik: 300 })
    await tungguFoto()
    expect(api.ambilBerkas).not.toHaveBeenCalled()
    expect(d.foto.value.size).toBe(0)
    revoke.mockRestore()
  })

  it('bukaFoto membuka penampil mulai foto yang diklik', async () => {
    api.aiPesanDaftar.mockResolvedValue(satuPesanFoto(10, [J(1), J(2)]))
    api.aiGambar.mockResolvedValue({ berkas: [
      { pesan: 10, urutan: 1, jalur: J(1), url: 'a', kedaluwarsa_pada: 'z' },
      { pesan: 10, urutan: 2, jalur: J(2), url: 'b', kedaluwarsa_pada: 'z' },
    ], berlaku_detik: 300 })
    const d = useCashflowDomi()
    d.pasangSubjek(SUBJEK)
    await d.bukaPercakapan(P)
    await tungguFoto()
    d.bukaFoto([J(1), J(2)], J(2))
    expect(kasus.tampilkanFoto).toHaveBeenCalledTimes(1)
    const [berkas, mulai] = kasus.tampilkanFoto.mock.calls[0] as [unknown[], number]
    expect(berkas).toHaveLength(2)
    expect(mulai).toBe(1)
  })
})
