/**
 * Halaman Users console: pesan 409 EMAIL_TAKEN di form ubah admin.
 *
 * vitest proyek ini hanya node (tanpa @nuxt/test-utils): perilaku diuji di
 * fungsi murni, dan kaitan di halaman dijaga lewat teks sumber.
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { consoleMessages } from '../../composables/useConsoleI18n'
import { perluMuatUlangAdmin, pesanKelolaAdmin } from '../../utils/konsol'

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

  it('halaman memuat ulang daftar hanya lewat perluMuatUlangAdmin', () => {
    expect(baca('pages/console/users/index.vue')).toMatch(/if \(perluMuatUlangAdmin\(galat\.value\)\) fetchUsers\(\)/)
  })
})
