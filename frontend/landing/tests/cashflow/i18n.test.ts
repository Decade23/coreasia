/** Kalimat berfungsi di kamus CashFlow — bentuk tunggal/jamak EN. */
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
