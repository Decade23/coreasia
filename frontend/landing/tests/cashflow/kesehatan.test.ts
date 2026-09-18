/**
 * Kontrak halaman Kesehatan terhadap admin_kesehatan (M/0017, satu-satunya
 * definisi). Server membangun `tabel` dengan jsonb_object_agg — OBJEK
 * bernama tabel, bukan larik — dan mengirim ukuran dalam BYTE. DTO lama
 * mengharapkan larik {tabel, baris, ukuran} berteks: kolom nama tabel kosong,
 * kunci v-for ganda, dan "1638400" tampil sebagai ukuran.
 */
import { describe, expect, it } from 'vitest'
import { keKesehatan, ukuranByte, type KesehatanDTO } from '../../adapters/cashflow'
import { adaMigrasi, fungsiTerakhir, pohonContoh, pohonJsonb, urutPohon } from './migrasi'

// Jawaban PostgREST: bigint dari pg_database_size/count/pg_total_relation_size jadi angka JSON.
const JAWABAN_SERVER = `{
  "ukuran_db": 15482880,
  "tabel": {
    "workspaces": {"baris": 12, "ukuran": 65536},
    "transactions": {"baris": 4210, "ukuran": 1638400},
    "admin_audit": {"baris": 87, "ukuran": 98304},
    "budgets": {"baris": 0, "ukuran": 24576}
  }
}`
const contoh = (): KesehatanDTO => JSON.parse(JAWABAN_SERVER) as KesehatanDTO

describe('kontrak KesehatanDTO ↔ admin_kesehatan', () => {
  it.skipIf(!adaMigrasi)('tabel = objek jsonb_object_agg per nama tabel, bukan larik', () => {
    const { badan } = fungsiTerakhir('admin_kesehatan')
    expect(badan).toMatch(/'tabel'\s*,\s*\(\s*select\s+jsonb_object_agg\s*\(\s*t\.nama\s*,/i)
    expect(badan).not.toMatch(/jsonb_agg\s*\(/i)
  })

  it.skipIf(!adaMigrasi)('kunci contoh = kunci server (isi tabel diwakili satu entrinya)', () => {
    const { badan } = fungsiTerakhir('admin_kesehatan')
    const c = JSON.parse(JAWABAN_SERVER)
    const bentuk = { ...c, tabel: Object.values(c.tabel)[0] }
    expect(urutPohon(pohonContoh(bentuk))).toEqual(urutPohon(pohonJsonb(badan)))
  })

  it.skipIf(!adaMigrasi)('nama tabel di contoh memang dikirim server', () => {
    const { badan } = fungsiTerakhir('admin_kesehatan')
    const namaServer = [...badan.matchAll(/select\s+'(\w+)'/gi)].map(m => m[1])
    for (const nama of Object.keys(contoh().tabel ?? {})) expect(namaServer).toContain(nama)
  })

  it.skipIf(!adaMigrasi)('ukuran dalam byte (pg_database_size / pg_total_relation_size), bukan teks', () => {
    const { badan } = fungsiTerakhir('admin_kesehatan')
    expect(badan).toMatch(/'ukuran_db'\s*,\s*pg_database_size\s*\(/i)
    expect(badan).toMatch(/pg_total_relation_size\s*\(/i)
    expect(badan).not.toMatch(/pg_size_pretty/i)
  })
})

describe('keKesehatan', () => {
  it('objek per nama → larik bernama, terbesar dulu', () => {
    const k = keKesehatan(contoh())
    expect(k.ukuranDb).toBe(15482880)
    expect(k.tabel.map(t => t.tabel)).toEqual(['transactions', 'admin_audit', 'workspaces', 'budgets'])
    expect(k.tabel[0]).toEqual({ tabel: 'transactions', baris: 4210, ukuran: 1638400 })
  })

  it('setiap baris punya nama unik (kunci v-for)', () => {
    const nama = keKesehatan(contoh()).tabel.map(t => t.tabel)
    expect(new Set(nama).size).toBe(nama.length)
    expect(nama.every(n => typeof n === 'string' && n.length > 0)).toBe(true)
  })

  it('angka bigint yang pulang sebagai string tetap terbaca; tabel null → kosong', () => {
    const k = keKesehatan({ ukuran_db: '15482880', tabel: { wallets: { baris: '3', ukuran: '8192' } } })
    expect(k).toEqual({ ukuranDb: 15482880, tabel: [{ tabel: 'wallets', baris: 3, ukuran: 8192 }] })
    expect(keKesehatan({ ukuran_db: 1, tabel: null }).tabel).toEqual([])
  })

  it('ukuran_db tak terbaca → null (tampil "—"), bukan 0', () => {
    expect(keKesehatan({ ukuran_db: '', tabel: {} }).ukuranDb).toBeNull()
  })
})

describe('ukuranByte', () => {
  it('basis 1024, satu desimal di bawah 100 satuan', () => {
    expect(ukuranByte(512)).toBe('512 B')
    expect(ukuranByte(8192)).toBe('8 KB')
    expect(ukuranByte(1638400)).toBe('1,6 MB')
    expect(ukuranByte(15482880)).toBe('14,8 MB')
    expect(ukuranByte(150 * 1024 * 1024)).toBe('150 MB')
    expect(ukuranByte(3 * 1024 ** 3)).toBe('3 GB')
  })

  it('tanda desimal mengikuti bahasa', () => {
    expect(ukuranByte(1638400, 'en')).toBe('1.6 MB')
  })

  it('string numeric diterima; kosong/tak terbaca → "—"', () => {
    expect(ukuranByte('1638400')).toBe('1,6 MB')
    expect(ukuranByte(null)).toBe('—')
    expect(ukuranByte(undefined)).toBe('—')
    expect(ukuranByte('')).toBe('—')
    expect(ukuranByte('abc')).toBe('—')
  })
})
