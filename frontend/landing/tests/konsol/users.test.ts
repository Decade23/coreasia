/**
 * Halaman Users console (C8): cabut sesi & reset TOTP admin lain, pesan 409
 * EMAIL_TAKEN di form ubah, dan badan PUT yang hanya membawa email/peran bila
 * berubah (BFF memakai kehadiran kolom itu untuk mencabut sesi CashFlow admin
 * lain, lihat tests/konsol/proxy.test.ts).
 *
 * vitest proyek ini hanya node (tanpa @nuxt/test-utils): perilaku diuji di
 * fungsi murni, dan kaitan di halaman dijaga lewat teks sumber.
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { consoleMessages } from '../../composables/useConsoleI18n'
import {
  bidangUbahAdmin, HEADER_CABUT_CASHFLOW, perluMuatUlangAdmin, pesanAksiSesiAdmin, pesanKelolaAdmin,
} from '../../utils/konsol'
import { sesiKuat, TENGGANG_SESI_KUAT_MS, UMUR_MFA_MAKS_MS } from '../../utils/rbac'

const AKAR = resolve(fileURLToPath(new URL('.', import.meta.url)), '../..')
const baca = (f: string) => readFileSync(resolve(AKAR, f), 'utf8')
const g = (status: number, kode: string, pesan = '') => ({ status, kode, pesan, tunggu: null })

const ambil = (bahasa: 'id' | 'en', jalur: string): unknown =>
  jalur.split('.').reduce<unknown>((a, k) => (a && typeof a === 'object' ? (a as Record<string, unknown>)[k] : undefined), consoleMessages[bahasa])

describe('409 EMAIL_TAKEN di form admin', () => {
  it('ubah → pesan email dipakai admin lain (bukan "data berubah"); tambah → email terdaftar', () => {
    expect(pesanKelolaAdmin(g(409, 'EMAIL_TAKEN', 'Email sudah terdaftar'), 'update')).toEqual({ kunci: 'users.errors.emailDipakai' })
    expect(pesanKelolaAdmin(g(409, 'EMAIL_TAKEN', 'Email sudah terdaftar'), 'create')).toEqual({ kunci: 'users.errors.emailTerdaftar' })
    // 409 CONFLICT (baris berubah) tetap seperti sebelumnya.
    expect(pesanKelolaAdmin(g(409, 'CONFLICT'), 'update')).toEqual({ kunci: 'users.errors.berubah' })
  })

  it('EMAIL_TAKEN tidak memuat ulang daftar; CONFLICT memuat ulang', () => {
    expect(perluMuatUlangAdmin(g(409, 'EMAIL_TAKEN'))).toBe(false)
    expect(perluMuatUlangAdmin(g(409, 'CONFLICT'))).toBe(true)
    expect(perluMuatUlangAdmin(g(409, 'HTTP_409'))).toBe(true)
    expect(perluMuatUlangAdmin(g(403, 'MFA_REQUIRED'))).toBe(false)
    expect(perluMuatUlangAdmin(null)).toBe(false)
  })

  it('kalimat emailDipakai ada di ID dan EN, dan berbeda dari "berubah"', () => {
    for (const b of ['id', 'en'] as const) {
      expect(typeof ambil(b, 'users.errors.emailDipakai')).toBe('string')
      expect(ambil(b, 'users.errors.emailDipakai')).not.toBe(ambil(b, 'users.errors.berubah'))
    }
  })
})

describe('bidangUbahAdmin — email & peran hanya bila berubah', () => {
  const lama = { email: 'Budi@CoreAsia.id', full_name: 'Budi', role: 'admin' }

  it('hanya nama berubah → tanpa email & peran (sesi CashFlow admin itu tidak dicabut)', () => {
    expect(bidangUbahAdmin(lama, { ...lama, full_name: 'Budi S' })).toEqual({ full_name: 'Budi S' })
    // Beda huruf / spasi tepi = email yang sama bagi gateway (NormalizeEmail).
    expect(bidangUbahAdmin(lama, { ...lama, email: ' budi@coreasia.id ' })).toEqual({ full_name: 'Budi' })
  })

  it('email atau peran berubah → ikut dikirim', () => {
    expect(bidangUbahAdmin(lama, { ...lama, email: 'budi2@coreasia.id' })).toEqual({ full_name: 'Budi', email: 'budi2@coreasia.id' })
    expect(bidangUbahAdmin(lama, { ...lama, role: 'super_admin' })).toEqual({ full_name: 'Budi', role: 'super_admin' })
  })
})

describe('pesanAksiSesiAdmin — hasil pencabutan sesi CashFlow dari header BFF', () => {
  it('header BFF sama dengan yang dipasang handler /api/gw/**', () => {
    expect(HEADER_CABUT_CASHFLOW).toBe('x-konsol-cashflow-cabut')
    expect(baca('server/api/gw/[...path].ts')).toMatch(/setResponseHeader\(event, HEADER_CABUT_CASHFLOW, cf\)/)
  })

  it('dicabut → sukses; tak-terkonfigurasi → sukses tanpa kalimat CashFlow', () => {
    expect(pesanAksiSesiAdmin('cabut-sesi', 'dicabut')).toEqual({ jenis: 'sukses', kunci: 'users.hasil.cabutOk' })
    expect(pesanAksiSesiAdmin('reset-totp', 'dicabut')).toEqual({ jenis: 'sukses', kunci: 'users.hasil.resetOk' })
    expect(pesanAksiSesiAdmin('cabut-sesi', 'tak-terkonfigurasi')).toEqual({ jenis: 'sukses', kunci: 'users.hasil.cabutOkTanpaCashflow' })
  })

  it('gagal atau header hilang → peringatan (runbook Langkah 1), bukan sukses', () => {
    for (const h of ['gagal', null, undefined, '']) {
      expect(pesanAksiSesiAdmin('cabut-sesi', h).jenis, String(h)).toBe('peringatan')
      expect(pesanAksiSesiAdmin('reset-totp', h)).toEqual({ jenis: 'peringatan', kunci: 'users.hasil.resetCashflowGagal' })
    }
  })

  it('semua kunci hasil ada di ID dan EN', () => {
    for (const aksi of ['cabut-sesi', 'reset-totp'] as const) {
      for (const h of ['dicabut', 'tak-terkonfigurasi', 'gagal']) {
        const { kunci } = pesanAksiSesiAdmin(aksi, h)
        for (const b of ['id', 'en'] as const) expect(typeof ambil(b, kunci), `${b} ${kunci}`).toBe('string')
      }
    }
  })
})

describe('sesiKuat — petunjuk syarat reset TOTP admin ber-TOTP', () => {
  const kini = Date.parse('2026-09-26T10:00:00Z')
  const iso = (ms: number) => new Date(ms).toISOString()
  const kuat = {
    mfa: true, mfa_at: iso(kini - 60_000),
    totp_enabled_at: iso(kini - TENGGANG_SESI_KUAT_MS - 1), created_at: iso(kini - 30 * TENGGANG_SESI_KUAT_MS),
  }

  it('MFA segar + TOTP & akun ≥ 24 jam → kuat', () => {
    expect(sesiKuat(kuat, kini)).toBe(true)
  })

  it('tanpa MFA, MFA basi, TOTP < 24 jam, akun < 24 jam, atau data hilang → tidak kuat', () => {
    expect(sesiKuat({ ...kuat, mfa: false }, kini)).toBe(false)
    expect(sesiKuat({ ...kuat, mfa_at: iso(kini - UMUR_MFA_MAKS_MS - 1) }, kini)).toBe(false)
    expect(sesiKuat({ ...kuat, totp_enabled_at: iso(kini - TENGGANG_SESI_KUAT_MS + 60_000) }, kini)).toBe(false)
    expect(sesiKuat({ ...kuat, created_at: iso(kini - 60_000) }, kini)).toBe(false)
    expect(sesiKuat({ ...kuat, totp_enabled_at: null }, kini)).toBe(false)
    expect(sesiKuat({ ...kuat, created_at: undefined }, kini)).toBe(false)
    expect(sesiKuat(null, kini)).toBe(false)
  })
})

describe('halaman Users — kaitan (teks sumber)', () => {
  const halaman = baca('pages/console/users/index.vue')
  const komposabel = baca('composables/useAdminUsers.ts')

  it('tombol cabut sesi & reset TOTP hanya untuk admin lain, lewat konfirmasi satu langkah', () => {
    const blokLain = /<template v-if="u\.id !== currentAdmin\?\.id">([\s\S]*?)<\/template>/.exec(halaman)?.[1] ?? ''
    expect(blokLain).toMatch(/bukaKonfirmasiSesi\('cabut-sesi', u\)/)
    expect(blokLain).toMatch(/bukaKonfirmasiSesi\('reset-totp', u\)/)
    expect(halaman).toMatch(/:show="!!konfirmasiSesi"/)
    expect(halaman).toMatch(/@click="jalankanAksiSesi"/)
    // Tanpa dialog alasan: tidak ada isian di modal konfirmasi.
    const modal = /:show="!!konfirmasiSesi"[\s\S]*?<\/ConsoleModal>/.exec(halaman)?.[0] ?? ''
    expect(modal).not.toMatch(/<(input|textarea|BaseInput|BasePasswordInput)\b/)
  })

  it('aksi memanggil rute gateway yang benar dan membaca header hasil CashFlow', () => {
    expect(komposabel).toMatch(/aksi === 'cabut-sesi' \? 'revoke-sessions' : 'totp\/reset'/)
    expect(komposabel).toMatch(/api\.tulisDenganHeader\('POST', `\/admin\/users\/\$\{u\.id\}\/\$\{jalur\}`\)/)
    expect(komposabel).toMatch(/headers\.get\(HEADER_CABUT_CASHFLOW\)/)
  })

  it('form ubah memakai bidangUbahAdmin, 409 lewat perluMuatUlangAdmin', () => {
    expect(halaman).toMatch(/updateUser\(editingUser\.value\.id, bidangUbahAdmin\(editingUser\.value, data\)\)/)
    expect(halaman).toMatch(/if \(perluMuatUlangAdmin\(galat\.value\)\) fetchUsers\(\)/)
  })

  it('setiap kunci tc(\'users.…\') / tc(\'feedback.…\') di halaman & komposabel ada di ID dan EN', () => {
    const kunci = new Set<string>()
    for (const src of [halaman, komposabel]) {
      for (const m of src.matchAll(/['"]((?:users|feedback)\.[a-zA-Z0-9_.]+)['"]/g)) kunci.add(m[1]!)
    }
    expect(kunci.size).toBeGreaterThan(20)
    for (const k of kunci) {
      for (const b of ['id', 'en'] as const) expect(typeof ambil(b, k), `${b} ${k}`).toBe('string')
    }
  })
})
