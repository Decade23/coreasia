/** Kalimat berfungsi di kamus CashFlow — bentuk tunggal/jamak EN. */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { KAMUS_CASHFLOW } from '~/composables/cashflow/useCashflowI18n'

describe('pengguna.jedaSetelah', () => {
  const en = KAMUS_CASHFLOW.en.pengguna.jedaSetelah
  it('EN: n = 1 tunggal, selainnya jamak', () => {
    expect(en(1, 'jam')).toBe('First recorded 1 hour after signing up')
    expect(en(1, 'menit')).toBe('First recorded 1 minute after signing up')
    expect(en(1, 'hari')).toBe('First recorded 1 day after signing up')
    expect(en(0, 'menit')).toBe('First recorded 0 minutes after signing up')
    expect(en(7, 'jam')).toBe('First recorded 7 hours after signing up')
  })
  it('ID tanpa jamak', () => {
    expect(KAMUS_CASHFLOW.id.pengguna.jedaSetelah(1, 'jam')).toBe('Mencatat pertama kali 1 jam setelah daftar')
  })
})

describe('pengguna.bercatatan menyebut penanda baris (legenda pil Catatan)', () => {
  it('ID dan EN menyebut label pil yang sama dengan yang tampil di tabel', () => {
    for (const b of ['id', 'en'] as const) {
      const k = KAMUS_CASHFLOW[b].pengguna
      expect(k.bercatatan(3)).toContain(k.catatanPil)
    }
  })
  it('EN: tunggal/jamak', () => {
    expect(KAMUS_CASHFLOW.en.pengguna.bercatatan(1)).toBe('1 transaction here has a note (tagged “Note”).')
  })
})

describe('kaki transfer: arah terbaca di kedua bahasa', () => {
  it('label keluar/masuk berbeda dari label netral', () => {
    for (const b of ['id', 'en'] as const) {
      const k = KAMUS_CASHFLOW[b].pengguna
      expect(new Set([k.transfer, k.transferKeluar, k.transferMasuk]).size).toBe(3)
    }
  })
})

/* Keputusan Master 21 Sep 2026: membuka data = satu klik, tanpa dialog
   "Kenapa data ini dibuka?". /sakelar membuka daftar pengecualian dengan
   alasan otomatis yang menamai tindakannya (audit buka_config), dan alasan
   perubahannya terisi kalimat yang menamai tindakan UBAH — bukan alasan
   pembukaan. */
describe('/sakelar membuka daftar pengecualian satu klik', () => {
  const src = readFileSync(fileURLToPath(new URL('../../pages/console/cashflow/sakelar.vue', import.meta.url)), 'utf8')
  it('tanpa dialog alasan; bukaConfig memakai alasan otomatis', () => {
    expect(src).not.toMatch(/<CashflowReasonGate\b|<ConsoleModal\b/)
    expect(src).toMatch(/api\.bukaConfig\(KUNCI_PENGECUALIAN, ALASAN_BUKA\)/)
    const buka = /const ALASAN_BUKA = '([^']+)'/.exec(src)?.[1] ?? ''
    const ubah = /const ALASAN_UBAH = '([^']+)'/.exec(src)?.[1] ?? ''
    expect(buka.length).toBeGreaterThanOrEqual(8)
    expect(ubah.length).toBeGreaterThanOrEqual(8)
    expect(buka).not.toBe(ubah)
  })
  it('kamus tidak lagi memuat judul "Kenapa data ini dibuka?"', () => {
    expect(JSON.stringify(KAMUS_CASHFLOW)).not.toMatch(/Kenapa data ini dibuka|Why is this data being opened/)
  })
})
