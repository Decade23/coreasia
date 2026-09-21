/**
 * Cookie sesi console (BFF): flag, nama, dan umur. Token gateway hanya boleh
 * hidup di cookie HttpOnly; umurnya mengikuti klaim exp token.
 */
import { describe, expect, it } from 'vitest'
import {
  klaimJwt,
  namaCookie,
  rencanaCookieIkat,
  rencanaCookieToken,
  rencanaHapus,
  SEMUA_JENIS,
  umurToken,
} from '../../server/lib/konsol/cookie'

const SEKARANG = Date.UTC(2026, 8, 18, 10, 0, 0)
const detik = Math.floor(SEKARANG / 1000)

/** JWT tanpa tanda tangan sah — cukup untuk membaca klaim (bukan verifikasi). */
const jwt = (klaim: Record<string, unknown>) =>
  `eyJhbGciOiJIUzI1NiJ9.${Buffer.from(JSON.stringify(klaim)).toString('base64url')}.tanda`

describe('namaCookie', () => {
  it('https memakai awalan __Host-Http- (Secure, Path=/, tanpa Domain, HttpOnly)', () => {
    expect(namaCookie('akses', true)).toBe('__Host-Http-ca_konsol_akses')
    expect(namaCookie('segar', true)).toBe('__Host-Http-ca_konsol_segar')
    expect(namaCookie('ikat', true)).toBe('__Host-Http-ca_konsol_ikat')
  })
  it('http (dev) tanpa awalan, karena peramban menolak __Host- tanpa Secure', () => {
    expect(namaCookie('akses', false)).toBe('ca_konsol_akses')
  })
  it('bukan nama cookie JS lama', () => {
    for (const j of SEMUA_JENIS) {
      expect(namaCookie(j, false)).not.toMatch(/auth_admin_token|refresh_admin_token/)
    }
  })
})

/**
 * Regresi temuan 0c putaran 3 (session fixation lewat document.cookie): skrip
 * halaman publik satu-asal bisa menanam `__Host-ca_konsol_akses` milik
 * penyerang di peramban korban yang belum login, dan BFF memakainya sebagai
 * Bearer. Awalan `__Host-Http-` membuat peramban (Chrome/Edge 140+, Firefox
 * 143+) menolak cookie itu dari document.cookie. Peramban menolak juga cookie
 * ber-awalan itu dari SERVER bila tidak Secure + HttpOnly + Path=/ tanpa
 * Domain, jadi setiap rencana https (pasang, hapus, ikat) wajib memenuhinya.
 */
describe('awalan __Host-Http- menahan cookie sesi tanaman skrip', () => {
  const token = { akses: jwt({ typ: 'access', exp: detik + 60 }), segar: jwt({ typ: 'refresh', exp: detik + 60 }) }
  const semuaRencanaHttps = [
    ...rencanaCookieToken(token, true, SEKARANG),
    ...rencanaHapus(SEMUA_JENIS, true),
    ...rencanaHapus(['ikat'], true),
    rencanaCookieIkat('z'.repeat(43), true),
  ]

  it('setiap cookie https berawalan __Host-Http-', () => {
    for (const c of semuaRencanaHttps) expect(c.nama.startsWith('__Host-Http-')).toBe(true)
  })

  it('setiap cookie https memenuhi syarat awalan: HttpOnly, Secure, Path=/, tanpa Domain', () => {
    for (const c of semuaRencanaHttps) {
      expect(c.opsi.httpOnly).toBe(true)
      expect(c.opsi.secure).toBe(true)
      expect(c.opsi.path).toBe('/')
      expect(c.opsi).not.toHaveProperty('domain')
    }
  })

  it('nama tanaman lama (`__Host-` saja) tidak dibaca sebagai sesi', () => {
    for (const j of ['akses', 'segar', 'ikat'] as const) {
      expect(namaCookie(j, true)).not.toBe(`__Host-ca_konsol_${j}`)
    }
  })
})

describe('rencanaCookieToken', () => {
  const akses = jwt({ typ: 'access', exp: detik + 3600, email: 'a@coreasia.id' })
  const segar = jwt({ typ: 'refresh', exp: detik + 720 * 3600 })

  it('https: HttpOnly; Secure; SameSite=Lax; Path=/; umur = exp − sekarang', () => {
    const [cAkses, cSegar] = rencanaCookieToken({ akses, segar }, true, SEKARANG)
    expect(cAkses).toEqual({
      nama: '__Host-Http-ca_konsol_akses',
      nilai: akses,
      opsi: { httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 3600 },
    })
    expect(cSegar).toEqual({
      nama: '__Host-Http-ca_konsol_segar',
      nilai: segar,
      opsi: { httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 720 * 3600 },
    })
  })

  it('http: tetap HttpOnly, tanpa Secure', () => {
    for (const c of rencanaCookieToken({ akses, segar }, false, SEKARANG)) {
      expect(c.opsi.httpOnly).toBe(true)
      expect(c.opsi.secure).toBe(false)
      expect(c.opsi.path).toBe('/')
      expect(c.opsi.sameSite).toBe('lax')
    }
  })

  it('token kedaluwarsa → Max-Age 0 (tidak pernah negatif)', () => {
    const basi = jwt({ exp: detik - 10 })
    expect(umurToken(basi, 'akses', SEKARANG)).toBe(0)
  })

  it('token tanpa exp → umur cadangan', () => {
    expect(umurToken(jwt({}), 'akses', SEKARANG)).toBe(3600)
    expect(umurToken('bukan-jwt', 'segar', SEKARANG)).toBe(30 * 24 * 3600)
  })
})

describe('tantangan MFA tanpa cookie', () => {
  it('sejak login langsung ke gateway, tantangan hanya di memori halaman login', () => {
    expect(SEMUA_JENIS).toEqual(['akses', 'segar'])
  })
})

describe('rencanaHapus', () => {
  it('Max-Age=0 dengan atribut yang sama (nama, Path, Secure)', () => {
    const hapus = rencanaHapus(SEMUA_JENIS, true)
    expect(hapus.map(h => h.nama)).toEqual(['__Host-Http-ca_konsol_akses', '__Host-Http-ca_konsol_segar'])
    for (const h of hapus) {
      expect(h.nilai).toBe('')
      expect(h.opsi.maxAge).toBe(0)
      expect(h.opsi.httpOnly).toBe(true)
      expect(h.opsi.secure).toBe(true)
      expect(h.opsi.path).toBe('/')
    }
  })
})

describe('klaimJwt', () => {
  it('membaca payload base64url; token rusak → null', () => {
    expect(klaimJwt(jwt({ email: 'x@y.id', exp: 5 }))).toEqual({ email: 'x@y.id', exp: 5 })
    expect(klaimJwt('a.b.c')).toBeNull()
    expect(klaimJwt('')).toBeNull()
    expect(klaimJwt(null)).toBeNull()
  })
})

describe('cookie ikat (pengikat token dokumen console)', () => {
  it('HttpOnly; SameSite=Lax; Path=/; 30 hari; __Host-Http- di https', () => {
    const c = rencanaCookieIkat('x'.repeat(43), true)
    expect(c).toEqual({
      nama: '__Host-Http-ca_konsol_ikat',
      nilai: 'x'.repeat(43),
      opsi: { httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 30 * 24 * 3600 },
    })
    expect(rencanaCookieIkat('y', false).nama).toBe('ca_konsol_ikat')
  })

  it('tidak ikut dihapus saat keluar (bukan kredensial; login berikutnya menggantinya)', () => {
    expect(SEMUA_JENIS).not.toContain('ikat')
  })
})
