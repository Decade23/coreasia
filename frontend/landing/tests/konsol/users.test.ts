/**
 * Halaman Users console (C8): cabut sesi & reset TOTP admin lain, pesan 409
 * EMAIL_TAKEN di form ubah, dan badan PUT yang hanya membawa email/peran bila
 * berubah (BFF memakai kehadiran kolom itu untuk mencabut sesi CashFlow admin
 * lain, lihat tests/konsol/proxy.test.ts).
 *
 * vitest proyek ini hanya node (tanpa @nuxt/test-utils): keputusan diuji di
 * fungsi murni di sini, komposabel dijalankan dengan global tiruan
 * (users-aksi.test.ts, admin-api.test.ts). Blok "tripwire" di bawah hanya
 * mencocokkan teks halaman .vue: penanda kaitan, BUKAN bukti perilaku.
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { consoleMessages } from '../../composables/useConsoleI18n'
import {
  bidangUbahAdmin, HEADER_CABUT_CASHFLOW, perluMuatUlangAdmin, peringatanCabutCashflow, pesanAksiSesiAdmin, pesanKelolaAdmin,
  tampilanKonfirmasiSesi, ubahMengakhiriSesi,
} from '../../utils/konsol'
import { adminDiakhiri } from '../../server/lib/konsol/proxy'
import { sesiKuat, TENGGANG_SESI_KUAT_MS, UMUR_MFA_MAKS_MS } from '../../utils/rbac'

const AKAR = resolve(fileURLToPath(new URL('.', import.meta.url)), '../..')
const baca = (f: string) => readFileSync(resolve(AKAR, f), 'utf8')
const g = (status: number, kode: string, pesan = '') => ({ status, kode, pesan, tunggu: null })

const ambil = (bahasa: 'id' | 'en', jalur: string): unknown =>
  jalur.split('.').reduce<unknown>((a, k) => (a && typeof a === 'object' ? (a as Record<string, unknown>)[k] : undefined), consoleMessages[bahasa])

/** Himpunan placeholder {{…}} di teks kunci itu, terurut. */
const placeholder = (bahasa: 'id' | 'en', jalur: string): string[] =>
  [...new Set([...String(ambil(bahasa, jalur)).matchAll(/\{\{(.*?)\}\}/g)].map(m => m[1]!.trim()))].sort()

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

describe('ubahMengakhiriSesi — cermin adminDiakhiri untuk badan PUT', () => {
  const LAIN = '7a1d2c3b-4e5f-4a6b-8c7d-9e0f1a2b3c4d'
  const BADAN: Array<Record<string, unknown>> = [
    { full_name: 'Budi' }, { password: 'Baru-1234' }, { password: '  ' }, { password: 'Baru-1234', current_password: 'x' },
    { is_active: false }, { is_active: true }, { email: 'b@coreasia.id' }, { email: '' }, { role: 'admin' },
    { full_name: 'B', role: ' ' }, { is_active: 0 }, { email: 5 },
  ]

  it.each(BADAN.map(b => [JSON.stringify(b), b] as const))('%s: klien dan BFF sepakat', (_n, badan) => {
    const bff = adminDiakhiri({ metode: 'PUT', jalur: `admin/users/${LAIN}`, body: new TextEncoder().encode(JSON.stringify(badan)) })
    expect(ubahMengakhiriSesi(badan)).toBe(bff === LAIN)
  })

  it('kontrol: kasus yang mencabut dan yang tidak sama-sama ada', () => {
    expect(BADAN.filter(ubahMengakhiriSesi).length).toBeGreaterThan(2)
    expect(BADAN.filter(b => !ubahMengakhiriSesi(b)).length).toBeGreaterThan(2)
  })
})

describe('peringatanCabutCashflow — hapus / ubah admin', () => {
  it('dicabut / tak-terkonfigurasi → tanpa peringatan', () => {
    for (const aksi of ['ubah', 'hapus'] as const) {
      for (const d of [true, false]) {
        expect(peringatanCabutCashflow(aksi, 'dicabut', d)).toBeNull()
        expect(peringatanCabutCashflow(aksi, 'tak-terkonfigurasi', d)).toBeNull()
      }
    }
  })

  it('gagal → peringatan, diharapkan atau tidak', () => {
    expect(peringatanCabutCashflow('hapus', 'gagal', true)).toBe('users.hasil.hapusCashflowGagal')
    expect(peringatanCabutCashflow('ubah', 'gagal', false)).toBe('users.hasil.ubahCashflowGagal')
  })

  it('header hilang → peringatan hanya bila BFF seharusnya mencabut', () => {
    for (const h of [null, undefined, '']) {
      expect(peringatanCabutCashflow('ubah', h, true)).toBe('users.hasil.ubahCashflowGagal')
      expect(peringatanCabutCashflow('ubah', h, false)).toBeNull()
      expect(peringatanCabutCashflow('hapus', h, true)).toBe('users.hasil.hapusCashflowGagal')
    }
  })
})

describe('tampilanKonfirmasiSesi — isi modal cabut sesi / reset TOTP', () => {
  const u = { id: 'b-1', email: 'budi@coreasia.id', full_name: 'Budi' }

  it('judul, deskripsi, dan tombol mengikuti aksi', () => {
    expect(tampilanKonfirmasiSesi({ aksi: 'cabut-sesi', user: u }, true)).toMatchObject({
      judul: 'users.revokeTitle', deskripsi: 'users.revokeDescription', tombol: 'users.revokeConfirm',
    })
    expect(tampilanKonfirmasiSesi({ aksi: 'reset-totp', user: u }, true)).toMatchObject({
      judul: 'users.resetTitle', deskripsi: 'users.resetDescription', tombol: 'users.resetConfirm',
    })
  })

  it('petunjuk sesi kuat hanya untuk reset TOTP saat sesi pemanggil BELUM kuat', () => {
    expect(tampilanKonfirmasiSesi({ aksi: 'reset-totp', user: u }, false).petunjukSesiKuat).toBe(true)
    expect(tampilanKonfirmasiSesi({ aksi: 'reset-totp', user: u }, true).petunjukSesiKuat).toBe(false)
    expect(tampilanKonfirmasiSesi({ aksi: 'cabut-sesi', user: u }, false).petunjukSesiKuat).toBe(false)
  })

  it('parameter nama & email, "-" bila kosong', () => {
    expect(tampilanKonfirmasiSesi({ aksi: 'cabut-sesi', user: u }, true).param).toEqual({ name: 'Budi', email: 'budi@coreasia.id' })
    expect(tampilanKonfirmasiSesi({ aksi: 'cabut-sesi', user: { id: 'x', email: '', full_name: '' } }, true).param).toEqual({ name: '-', email: '-' })
  })

  it('setiap kunci modal ada di ID dan EN', () => {
    for (const aksi of ['cabut-sesi', 'reset-totp'] as const) {
      const t = tampilanKonfirmasiSesi({ aksi, user: u }, false)
      for (const k of [t.judul, t.deskripsi, t.tombol, 'users.resetSesiKuat']) {
        for (const b of ['id', 'en'] as const) expect(typeof ambil(b, k), `${b} ${k}`).toBe('string')
      }
    }
  })
})

describe('placeholder i18n — sama antarbahasa dan sama dengan parameter yang dikirim', () => {
  it('users.hasil.*: hanya {{name}} (aksiSesi, hapus, ubah mengirim { name })', () => {
    const kunci = Object.keys(consoleMessages.id.users.hasil).map(k => `users.hasil.${k}`)
    expect(kunci.length).toBeGreaterThanOrEqual(8)
    expect(Object.keys(consoleMessages.en.users.hasil).sort()).toEqual(Object.keys(consoleMessages.id.users.hasil).sort())
    for (const k of kunci) {
      for (const b of ['id', 'en'] as const) expect(placeholder(b, k), `${b} ${k}`).toEqual(['name'])
    }
  })

  it('deskripsi modal: placeholder id = en = kunci param tampilanKonfirmasiSesi', () => {
    for (const aksi of ['cabut-sesi', 'reset-totp'] as const) {
      const t = tampilanKonfirmasiSesi({ aksi, user: { id: 'x', email: 'e', full_name: 'n' } }, true)
      const param = Object.keys(t.param).sort()
      for (const b of ['id', 'en'] as const) expect(placeholder(b, t.deskripsi), `${b} ${t.deskripsi}`).toEqual(param)
    }
  })
})

describe('kalimat modal cabut sesi — benar untuk admin nonaktif dan admin tanpa TOTP', () => {
  it('tidak menjanjikan akun tetap aktif atau masuk dengan TOTP; menyatakan status akun tidak berubah', () => {
    const id = String(ambil('id', 'users.revokeDescription'))
    const en = String(ambil('en', 'users.revokeDescription'))
    expect(id).not.toMatch(/tetap aktif|TOTP/)
    expect(en).not.toMatch(/stays active|TOTP/)
    expect(id).toMatch(/Status akunnya tidak berubah\./)
    expect(en).toMatch(/account status does not change\./)
  })
})

describe('halaman Users — tripwire teks sumber (bukan bukti perilaku)', () => {
  const halaman = baca('pages/console/users/index.vue')
  const komposabel = baca('composables/useAdminUsers.ts')

  it('tombol cabut sesi & reset TOTP hanya untuk admin lain, lewat konfirmasi satu langkah', () => {
    const blokLain = /<template v-if="u\.id !== currentAdmin\?\.id">([\s\S]*?)<\/template>/.exec(halaman)?.[1] ?? ''
    expect(blokLain).toMatch(/bukaKonfirmasiSesi\('cabut-sesi', u\)/)
    expect(blokLain).toMatch(/bukaKonfirmasiSesi\('reset-totp', u\)/)
    expect(halaman).toMatch(/:show="!!tampilanSesi"/)
    expect(halaman).toMatch(/@click="jalankanKonfirmasiSesi"/)
    expect(halaman).toMatch(/tampilanKonfirmasiSesi\(konfirmasiSesi\.value, sesiKuat\(currentAdmin\.value\)\)/)
    // Tanpa dialog alasan: tidak ada isian di modal konfirmasi.
    const modal = /:show="!!tampilanSesi"[\s\S]*?<\/ConsoleModal>/.exec(halaman)?.[0] ?? ''
    expect(modal).not.toMatch(/<(input|textarea|BaseInput|BasePasswordInput)\b/)
  })

  it('form ubah memakai bidangUbahAdmin, 409 lewat perluMuatUlangAdmin; hapus/ubah mengirim baris admin (nama untuk peringatan)', () => {
    expect(halaman).toMatch(/updateUser\(editingUser\.value, bidangUbahAdmin\(editingUser\.value, data\)\)/)
    expect(halaman).toMatch(/updateUser\(passwordTarget\.value, body\)/)
    expect(halaman).toMatch(/deleteUser\(deletingUser\.value\)/)
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
