import { describe, expect, it } from 'vitest'
import { kursorKeUrl } from '../../adapters/cashflowBuku'
import { kelompokPerjalanan, kursorPerjalananDariUrl, salinPerjalanan, type PerjalananBarisDTO } from '../../adapters/cashflowPerjalanan'
import { kunciKelompokCorong } from '../../adapters/cashflowCorongAlur'

const contoh: PerjalananBarisDTO = {
  id: '1'.repeat(32),
  pada: '2026-10-08T17:10:43Z',
  sumber: 'aplikasi',
  jenis: 'onboarding.langkah',
  langkah: 'nomor_wa.petunjuk',
  kategori: 'nomor_wa',
  layar: '/nomor-wa',
  rincian_aman: { hasil: 'batal', nomor: '081234567890', email: 'sintetis@contoh.invalid' },
  sesi: 'sesi-a',
  sesi_mulai: '2026-10-08T17:10:30Z',
  versi: '1.4.1',
}

describe('Perjalanan', () => {
  it('mempertahankan urutan bila dua peluncuran dari perangkat berbeda beririsan', () => {
    const kedua = { ...contoh, id: '2'.repeat(32), sesi: 'sesi-b', versi: '1.4.0' }
    const ketiga = { ...contoh, id: '3'.repeat(32) }
    const kelompok = kelompokPerjalanan([contoh, kedua, ketiga], 'id')
    expect(kelompok.map(k => k.versi)).toEqual(['1.4.1', '1.4.0', '1.4.1'])
    expect(kelompok.flatMap(k => k.baris.map(b => b.id))).toEqual([contoh.id, kedua.id, ketiga.id])
    expect(kelompok[0]?.mulai).toBe('9 Okt 2026 00.10.30 WIB')
  })

  it('menyalin baris dan rincian yang terbuka dengan jam WIB', () => {
    const kelompok = kelompokPerjalanan([contoh], 'id')
    const salin = (buka: boolean) => salinPerjalanan(
      kelompok, new Set(buka ? [contoh.id] : []), k => k.mulai!,
      () => 'Aplikasi', 'Belum dikenal', () => 'Nomor WhatsApp',
    )
    expect(salin(false)).toBe([
      '9 Okt 2026 00.10.30 WIB',
      '9 Okt 2026 00.10.43 WIB · Nomor WhatsApp · Menutup pilihan nomor dari Google · Nomor WhatsApp · Aplikasi',
    ].join('\n'))
    expect(salin(true).split('\n').length).toBeGreaterThan(2)
    expect(salin(true)).not.toMatch(/081234567890|contoh\.invalid|sesi-a/)
  })

  it('menerima kursor server dan mengabaikan ID yang disunting', () => {
    const kursor = { p: contoh.pada, i: contoh.id }
    expect(kursorPerjalananDariUrl(kursorKeUrl(kursor))).toEqual(kursor)
    expect(kursorPerjalananDariUrl(kursorKeUrl({ ...kursor, i: 'tidak-sah' }))).toBeNull()
  })
})

it('kelompok total berbeda dari versi tak diketahui', () => {
  expect(kunciKelompokCorong({ cara: null, versi: null, langkah: [] }))
    .not.toBe(kunciKelompokCorong({ cara: 'wa_masuk', versi: null, langkah: [] }))
})
