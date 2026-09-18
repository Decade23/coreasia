/**
 * State di URL: daftar putih kunci, nilai tak sah → bawaan.
 */
import { describe, expect, it } from 'vitest'
import { bacaQuery, tulisQuery, type SkemaQuery } from '../../adapters/cashflowQuery'

const SKEMA = {
  seg: { jenis: 'pilihan', opsi: ['semua', 'catat7', 'belum'], bawaan: 'semua' },
  arah: { jenis: 'pilihan', opsi: ['asc', 'desc'], bawaan: 'desc' },
  hal: { jenis: 'halaman', bawaan: 1 },
  aksi: { jenis: 'teks', pola: /^[a-z0-9_]+$/, maks: 64, bawaan: '' },
} as const satisfies SkemaQuery

describe('bacaQuery', () => {
  it('nilai sah terbaca bertipe', () => {
    expect(bacaQuery(SKEMA, { seg: 'belum', arah: 'asc', hal: '3', aksi: 'baca_transaksi' }))
      .toEqual({ seg: 'belum', arah: 'asc', hal: 3, aksi: 'baca_transaksi' })
  })
  it('kosong → bawaan', () => {
    expect(bacaQuery(SKEMA, {})).toEqual({ seg: 'semua', arah: 'desc', hal: 1, aksi: '' })
  })
  it('nilai di luar daftar atau rusak → bawaan', () => {
    expect(bacaQuery(SKEMA, { seg: 'semuaa', arah: 'DESC', hal: '-2', aksi: 'x; drop' }))
      .toEqual({ seg: 'semua', arah: 'desc', hal: 1, aksi: '' })
    expect(bacaQuery(SKEMA, { hal: '0' }).hal).toBe(1)
    expect(bacaQuery(SKEMA, { hal: '2.5' }).hal).toBe(1)
    expect(bacaQuery(SKEMA, { aksi: 'a'.repeat(65) }).aksi).toBe('')
  })
  it('larik (?seg=a&seg=b) → yang pertama', () => {
    expect(bacaQuery(SKEMA, { seg: ['catat7', 'belum'] }).seg).toBe('catat7')
  })
})

describe('tulisQuery', () => {
  it('hanya kunci skema; bawaan tidak ditulis', () => {
    const q = tulisQuery(SKEMA, { seg: 'belum', arah: 'desc', hal: 2, aksi: '', ...({ email: 'bocor@x.id' } as object) })
    expect(q).toEqual({ seg: 'belum', hal: '2' })
  })
  it('nilai tidak sah tidak ditulis', () => {
    expect(tulisQuery(SKEMA, { seg: 'entah' as 'semua', hal: 0 })).toEqual({})
  })
  it('pulang-pergi', () => {
    const nilai = { seg: 'catat7', arah: 'asc', hal: 4, aksi: 'cari' } as const
    expect(bacaQuery(SKEMA, tulisQuery(SKEMA, nilai))).toEqual(nilai)
  })
})
