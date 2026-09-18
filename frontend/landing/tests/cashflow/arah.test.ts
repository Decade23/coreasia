/**
 * Arah nominal di lini aktivitas detail pengguna. admin_aktivitas_pengguna
 * meneruskan peristiwa.arah apa adanya, dan CHECK kolom itu hanya menerima
 * 'income'/'expense'. Halaman dulu membandingkan dengan 'masuk' — tidak
 * pernah benar — sehingga setiap pemasukan tampil merah seperti pengeluaran.
 */
import { describe, expect, it } from 'vitest'
import { ARAH_PERISTIWA, keArahUang } from '../../adapters/cashflow'
import { adaMigrasi, fungsiTerakhir, kolomTabel } from './migrasi'

const nilaiCek = (definisi: string | undefined) => {
  const isi = /in\s*\(([^)]*)\)/i.exec(definisi ?? '')?.[1] ?? ''
  return [...isi.matchAll(/'([^']+)'/g)].map(m => m[1]).sort()
}

describe('kontrak AktivitasDTO.arah ↔ peristiwa.arah', () => {
  it.skipIf(!adaMigrasi)('ARAH_PERISTIWA = nilai CHECK peristiwa.arah', () => {
    expect([...ARAH_PERISTIWA].sort()).toEqual(nilaiCek(kolomTabel('peristiwa').definisi.arah))
  })

  it.skipIf(!adaMigrasi)('admin_aktivitas_pengguna meneruskan arah tanpa menerjemahkan', () => {
    const { kepala, badan } = fungsiTerakhir('admin_aktivitas_pengguna')
    expect(kepala).toMatch(/\barah\s+text\b/i)
    expect(badan).toMatch(/\bp\.arah::text\b/i)
  })
})

describe('keArahUang', () => {
  it('nilai server → arah domain', () => {
    expect(keArahUang('income')).toBe('masuk')
    expect(keArahUang('expense')).toBe('keluar')
  })

  it('selainnya null (nada netral), termasuk "masuk" yang bukan nilai server', () => {
    expect(keArahUang('masuk')).toBeNull()
    expect(keArahUang(null)).toBeNull()
    expect(keArahUang(undefined)).toBeNull()
    expect(keArahUang('transfer')).toBeNull()
  })
})
