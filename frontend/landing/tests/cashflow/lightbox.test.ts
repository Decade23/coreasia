import { describe, expect, it } from 'vitest'
import { batasiGeserFoto, batasiZoomFoto, geserSaatZoom, ukuranPasFoto } from '../../adapters/cashflowLightbox'

describe('foto pas layar dan putaran', () => {
  it('menampilkan seluruh struk panjang tanpa memotong ujungnya', () => {
    expect(ukuranPasFoto({ lebar: 1200, tinggi: 3600 }, { lebar: 1000, tinggi: 600 }, 0))
      .toEqual({ lebar: 200, tinggi: 600 })
  })
  it('memperhitungkan kedua sisi setelah diputar', () => {
    expect(ukuranPasFoto({ lebar: 1200, tinggi: 3600 }, { lebar: 900, tinggi: 600 }, 90))
      .toEqual({ lebar: 300, tinggi: 900 })
    expect(ukuranPasFoto({ lebar: 1200, tinggi: 3600 }, { lebar: 900, tinggi: 600 }, 270))
      .toEqual({ lebar: 300, tinggi: 900 })
  })
  it('tidak membesarkan foto kecil sebelum pengguna memilih zoom', () => {
    expect(ukuranPasFoto({ lebar: 200, tinggi: 100 }, { lebar: 900, tinggi: 600 }, 0))
      .toEqual({ lebar: 200, tinggi: 100 })
  })
  it('menunggu ukuran bidang dan gambar tersedia', () => {
    expect(ukuranPasFoto({ lebar: 0, tinggi: 0 }, { lebar: 900, tinggi: 600 }, 0))
      .toEqual({ lebar: 0, tinggi: 0 })
    expect(ukuranPasFoto({ lebar: 1200, tinggi: 3600 }, { lebar: 0, tinggi: 0 }, 0))
      .toEqual({ lebar: 0, tinggi: 0 })
  })
})

describe('geser foto yang diperbesar', () => {
  it('mengunci sisi yang masih muat dan membatasi sisi panjang sampai tepi', () => {
    const pas = { lebar: 200, tinggi: 600 }, bidang = { lebar: 900, tinggi: 600 }
    expect(batasiGeserFoto({ x: 1000, y: -1000 }, pas, bidang, 3, 0)).toEqual({ x: 0, y: -600 })
    expect(batasiGeserFoto({ x: 1000, y: 2000 }, pas, bidang, 5, 0)).toEqual({ x: 50, y: 1200 })
  })
  it('memakai batas foto yang sudah diputar', () => {
    expect(batasiGeserFoto({ x: -2000, y: 2000 }, { lebar: 300, tinggi: 900 }, { lebar: 900, tinggi: 600 }, 2, 90))
      .toEqual({ x: -450, y: 0 })
  })
  it('mengembalikan geseran ke tengah pada ukuran pas layar', () => {
    expect(batasiGeserFoto({ x: 50, y: -600 }, { lebar: 200, tinggi: 600 }, { lebar: 900, tinggi: 600 }, 1, 0))
      .toEqual({ x: 0, y: 0 })
  })
  it('menjaga detail yang berada di bawah kursor saat zoom', () => {
    const awal = { x: -30, y: 40 }, jangkar = { x: 120, y: -180 }
    const baru = geserSaatZoom(awal, 1.5, 3, jangkar)
    expect((jangkar.x - baru.x) / 3).toBe((jangkar.x - awal.x) / 1.5)
    expect((jangkar.y - baru.y) / 3).toBe((jangkar.y - awal.y) / 1.5)
  })
  it('mengikuti perpindahan titik tengah dua jari saat mencubit', () => {
    expect(geserSaatZoom({ x: 0, y: 0 }, 1, 2, { x: 100, y: 50 }, { x: 120, y: 80 }))
      .toEqual({ x: -80, y: -20 })
  })
  it('membatasi zoom agar foto bisa selalu dipulihkan', () => {
    expect([-1, 0, 1, 2.5, 9, NaN, Infinity].map(batasiZoomFoto)).toEqual([1, 1, 1, 2.5, 5, 1, 1])
  })
})
