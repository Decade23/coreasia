/** Kontrak status WhatsApp OTP terhadap admin_wa_status, dan pemetaannya. */
import { describe, expect, it } from 'vitest'
import { KODE_GANGGUAN_WA, STATUS_SESI_WA, keStatusWa, type WaStatusDTO } from '../../adapters/cashflowWa'
import { adaMigrasi, fungsiTerakhir } from './migrasi'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const contoh = (ubah: Partial<WaStatusDTO> = {}): WaStatusDTO => ({
  sekarang: '2026-11-10T08:00:00Z',
  sesi: { status: 'connected', sejak: '2026-11-10T08:02:00Z', dicek_pada: '2026-11-10T08:04:00Z', galat: null },
  gangguan: [],
  kirim_gangguan_sampai: null,
  otp: { aktif: true, wajib: true, darurat: false },
  batas: { terpakai_hari_ini: 3, harian: 50 },
  kiriman_24j: { diminta: 4, terkirim: 3, gagal: 1, tanpa_wa: 0, diketik: 2 },
  sebab_gagal_24j: [{ sebab: 'sesi-putus', jumlah: 1 }],
  terkirim_terakhir: '2026-11-10T07:00:00Z',
  ...ubah,
})

describe('kontrak admin_wa_status', () => {
  it.skipIf(!adaMigrasi)('setiap kunci jawaban ada di server, dan data orang tidak', () => {
    const { badan } = fungsiTerakhir('admin_wa_status')
    for (const k of ['sekarang', 'sesi', 'gangguan', 'kirim_gangguan_sampai', 'otp', 'batas', 'kiriman_24j', 'sebab_gagal_24j', 'terkirim_terakhir',
      'dicek_pada', 'terpakai_hari_ini', 'harian', 'diminta', 'terkirim', 'gagal', 'tanpa_wa', 'diketik', 'sebab', 'jumlah']) {
      expect(badan).toContain(`'${k}'`)
    }
    expect(badan).toMatch(/nomor_wa_gangguan_inti\s*\(/)
    expect(badan).not.toMatch(/nomor_sidik|kode_id|'uji'|'peninjau'/)
  })
})

describe('keStatusWa', () => {
  it('tanpa gangguan: sehat', () => {
    const s = keStatusWa(contoh())
    expect(s.tingkat).toBe('sehat')
    expect(s.lewatOtp).toBe(false)
    expect(s.otp).toBe('wajib')
  })
  it('sesi putus saat OTP wajib: gangguan dan pengguna baru lolos', () => {
    const s = keStatusWa(contoh({ gangguan: ['sesi'], sesi: { status: 'disconnected', sejak: null, dicek_pada: null, galat: null } }))
    expect(s.tingkat).toBe('gangguan')
    expect(s.lewatOtp).toBe(true)
    expect(s.sebab).toEqual(['sesi'])
    expect(s.statusSesi).toBe('disconnected')
  })
  it('gangguan saat OTP tidak wajib: tidak mengaku pengguna lolos', () => {
    expect(keStatusWa(contoh({ gangguan: ['sesi'], otp: { aktif: true, wajib: false, darurat: false } })).lewatOtp).toBe(false)
  })
  it('OTP dimatikan mengalahkan gangguan', () => {
    const s = keStatusWa(contoh({ gangguan: ['sesi'], otp: { aktif: false, wajib: false, darurat: false } }))
    expect(s.tingkat).toBe('nonaktif')
    expect(s.otp).toBe('mati')
    expect(s.lewatOtp).toBe(false)
  })
  it('kode gangguan dan status sesi asing tidak hilang', () => {
    const s = keStatusWa(contoh({ gangguan: ['baru_nih', 'x'], sesi: { status: 'aneh', sejak: null, dicek_pada: null, galat: null } }))
    expect(s.tingkat).toBe('gangguan')
    expect(s.sebab).toEqual(['lain'])
    expect(s.statusSesi).toBe('lain')
  })
  it('belum ada data sesi', () => {
    const s = keStatusWa(contoh({ sesi: null, gangguan: ['sesi', 'basi'], sebab_gagal_24j: null }))
    expect(s.statusSesi).toBe('kosong')
    expect(s.sebabGagal).toEqual([])
    expect(s.sebab).toEqual(['sesi', 'basi'])
  })
})

describe('kamus status WhatsApp', () => {
  const kamus = readFileSync(resolve(__dirname, '../../composables/cashflow/useCashflowI18n.ts'), 'utf8')
  const blok = [...kamus.matchAll(/ {6}wa: \{\n([\s\S]*?)\n {6}\},\n/g)].map(m => m[1]!)
  it('ada di ID dan EN', () => expect(blok).toHaveLength(2))
  it('setiap kode gangguan punya sebab dan langkah, setiap status punya label', () => {
    for (const b of blok) {
      const sebab = /sebab: \{([\s\S]*?)\n {8}\},/.exec(b)![1]!
      const langkah = /langkah: \{([\s\S]*?)\n {8}\},/.exec(b)![1]!
      for (const k of [...KODE_GANGGUAN_WA, 'lain']) {
        expect(sebab).toMatch(new RegExp(`\\b${k}:`))
        expect(langkah).toMatch(new RegExp(`\\b${k}:`))
      }
      for (const k of [...STATUS_SESI_WA, 'kosong']) expect(b).toMatch(new RegExp(`\\b${k}: '`))
    }
  })
})
