/**
 * Proxy /api/gw/**: jalur mana yang boleh diteruskan ke gateway, dan
 * permintaan dari mana yang boleh masuk (Sec-Fetch-Site + X-Console).
 */
import { describe, expect, it } from 'vitest'
import { periksaAsal } from '../../server/lib/konsol/asal'
import { KHUSUS_BFF, pecahPathProxy, rakitTujuan, validasiJalur } from '../../server/lib/konsol/jalur'

const GW = 'https://api.coreasia.id/api'

describe('validasiJalur — daftar putih', () => {
  it.each([
    'admin/auth/me',
    'admin/articles',
    'admin/articles/stats',
    'admin/articles/0b7c1c9e-2a3f-4d5e-9f10-1234567890ab/publish',
    'admin/ai/models/claude',
    'admin/ai/active-key/unsplash',
    'admin/cad/licenses/42/copy',
    'admin/cad/devices/abc_DEF-1.2~x/deactivate',
    'admin/keywords/batch',
    'admin/upload',
    'admin/auth/logout-all',
    'admin/auth/totp/setup',
  ])('menerima %s', (jalur) => {
    expect(validasiJalur(jalur)).toEqual({ ok: true, jalur })
  })

  it.each([
    ['', 'kosong'],
    ['admin', 'di-luar-daftar'],
    ['public/leads', 'di-luar-daftar'],
    ['articles', 'di-luar-daftar'],
    ['cad/activate', 'di-luar-daftar'],
    ['Admin/articles', 'di-luar-daftar'],
  ])('menolak prefiks di luar daftar: %s', (jalur, sebab) => {
    expect(validasiJalur(jalur)).toEqual({ ok: false, sebab })
  })

  it.each([
    'admin/../public/leads',
    'admin/articles/..',
    'admin/./articles',
    '../admin/articles',
    'admin//articles',
    'admin/articles/',
    '/admin/articles',
  ])('menolak traversal & segmen kosong: %s', (jalur) => {
    const hasil = validasiJalur(jalur)
    expect(hasil.ok).toBe(false)
  })

  it.each([
    'admin/%2e%2e/public/leads',
    'admin/%2E%2E%2Fpublic',
    'admin/articles%2f..%2fx',
    'admin/%252e%252e/x',
    'admin\\..\\public',
    'admin/articles?x=1',
    'admin/articles#x',
    'admin/a b',
    'admin/x\u0000y',
  ])('menolak encoding & karakter berbahaya: %s', (jalur) => {
    expect(validasiJalur(jalur)).toEqual({ ok: false, sebab: 'karakter' })
  })

  it.each([
    'https://evil.example/admin/x',
    '//evil.example/admin/x',
    'admin@evil.example/x',
    'admin:8080/x',
    'http:/evil/admin',
  ])('menolak host/skema lain: %s', (jalur) => {
    expect(validasiJalur(jalur).ok).toBe(false)
  })

  it('rute BFF tidak bisa dipanggil lewat proxy', () => {
    for (const jalur of KHUSUS_BFF) expect(validasiJalur(jalur)).toEqual({ ok: false, sebab: 'pakai-bff' })
  })

  // Router Fiber gateway tidak peka huruf: /admin/AUTH/LOGIN = /admin/auth/login,
  // dan jawabannya (access/refresh token, tantangan MFA) tidak boleh sampai ke JS.
  it.each([
    'admin/AUTH/LOGIN',
    'admin/auth/Refresh',
    'admin/Auth/Totp/Verify',
    'admin/auth/LOGOUT',
    'admin/aUtH/lOgIn',
  ])('rute BFF beda huruf juga ditolak: %s', (jalur) => {
    expect(validasiJalur(jalur)).toEqual({ ok: false, sebab: 'pakai-bff' })
  })

  it('id berhuruf besar di rute biasa tetap diteruskan apa adanya', () => {
    expect(validasiJalur('admin/cad/devices/ABC-123/deactivate')).toEqual({ ok: true, jalur: 'admin/cad/devices/ABC-123/deactivate' })
    expect(validasiJalur('admin/AUTH/ME')).toEqual({ ok: true, jalur: 'admin/AUTH/ME' })
  })

  it('menolak jalur yang terlalu panjang', () => {
    expect(validasiJalur(`admin/${'a'.repeat(600)}`)).toEqual({ ok: false, sebab: 'terlalu-panjang' })
  })
})

describe('pecahPathProxy', () => {
  it('memisahkan jalur dan query tanpa men-decode', () => {
    expect(pecahPathProxy('/api/gw/admin/articles?page=2&per_page=10')).toEqual({ jalur: 'admin/articles', query: 'page=2&per_page=10' })
    expect(pecahPathProxy('/api/gw/admin/%2e%2e/x')).toEqual({ jalur: 'admin/%2e%2e/x', query: '' })
    expect(pecahPathProxy('/api/lain/admin')).toBeNull()
  })
})

describe('rakitTujuan', () => {
  it('menempel jalur di bawah base gateway, query dipertahankan', () => {
    expect(rakitTujuan(GW, 'admin/articles', 'page=2')?.toString()).toBe('https://api.coreasia.id/api/admin/articles?page=2')
    expect(rakitTujuan(`${GW}/`, 'admin/auth/me', '')?.toString()).toBe('https://api.coreasia.id/api/admin/auth/me')
    expect(rakitTujuan('http://localhost:8096/api', 'admin/users', '')?.toString()).toBe('http://localhost:8096/api/admin/users')
  })

  it('jaring kedua: tidak pernah keluar dari origin/base gateway', () => {
    expect(rakitTujuan(GW, '//evil.example/admin/x', '')).toBeNull()
    expect(rakitTujuan(GW, 'https://evil.example/admin/x', '')).toBeNull()
    expect(rakitTujuan(GW, '../admin/x', '')).toBeNull()
    expect(rakitTujuan(GW, 'admin/../../x', '')).toBeNull()
    expect(rakitTujuan(GW, 'public/leads', '')).toBeNull()
    expect(rakitTujuan('javascript:alert(1)', 'admin/x', '')).toBeNull()
    expect(rakitTujuan('bukan url', 'admin/x', '')).toBeNull()
  })
})

describe('periksaAsal — Sec-Fetch-Site & header khusus', () => {
  it('GET satu-asal lolos tanpa X-Console', () => {
    expect(periksaAsal({ metode: 'GET', secFetchSite: 'same-origin' })).toEqual({ ok: true })
    expect(periksaAsal({ metode: 'HEAD', secFetchSite: 'same-origin' })).toEqual({ ok: true })
  })

  it.each([undefined, null, '', 'cross-site', 'same-site', 'none', 'SAME-ORIGINX'])(
    'Sec-Fetch-Site %s ditolak',
    (situs) => {
      expect(periksaAsal({ metode: 'GET', secFetchSite: situs as string | undefined })).toEqual({ ok: false, sebab: 'lintas-situs' })
      expect(periksaAsal({ metode: 'POST', secFetchSite: situs as string | undefined, headerKonsol: '1' })).toEqual({ ok: false, sebab: 'lintas-situs' })
    },
  )

  it.each(['POST', 'PUT', 'PATCH', 'DELETE', 'post'])('%s wajib X-Console: 1', (metode) => {
    expect(periksaAsal({ metode, secFetchSite: 'same-origin' })).toEqual({ ok: false, sebab: 'tanpa-header-konsol' })
    expect(periksaAsal({ metode, secFetchSite: 'same-origin', headerKonsol: '0' })).toEqual({ ok: false, sebab: 'tanpa-header-konsol' })
    expect(periksaAsal({ metode, secFetchSite: 'same-origin', headerKonsol: '1' })).toEqual({ ok: true })
  })
})
