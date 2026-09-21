/**
 * Serah terima token login ke BFF (/api/admin/sesi): bentuk dan pasangan token
 * diperiksa sebelum gateway ditanya. Keabsahan token akses tetap diputuskan
 * gateway (/admin/auth/me).
 */
import { describe, expect, it } from 'vitest'
import { PANJANG_MAKS_TOKEN, periksaBadanSesi } from '../../server/lib/konsol/sesi'

const SEKARANG = Date.UTC(2026, 8, 18, 10, 0, 0)
const detik = Math.floor(SEKARANG / 1000)
const jwt = (klaim: Record<string, unknown>) =>
  `eyJhbGciOiJIUzI1NiJ9.${Buffer.from(JSON.stringify(klaim)).toString('base64url')}.tanda`

const SUB = '0b6e7c1e-2a55-4d59-9c5f-0a8d2f9d1b11'
const AKSES = jwt({ typ: 'access', sub: SUB, tv: 2, exp: detik + 3600 })
const SEGAR = jwt({ typ: 'refresh', sub: SUB, tv: 2, exp: detik + 30 * 86400 })

describe('periksaBadanSesi', () => {
  it('pasangan sah → token + sub', () => {
    expect(periksaBadanSesi({ access_token: AKSES, refresh_token: SEGAR }, SEKARANG)).toEqual({
      ok: true,
      token: { akses: AKSES, segar: SEGAR },
      sub: SUB,
    })
  })

  it.each([
    [null, 'badan'],
    ['teks', 'badan'],
    [{}, 'bentuk'],
    [{ access_token: AKSES }, 'bentuk'],
    [{ access_token: AKSES, refresh_token: 123 }, 'bentuk'],
    [{ access_token: 'bukan.jwt', refresh_token: SEGAR }, 'bentuk'],
    [{ access_token: `${AKSES};x=1`, refresh_token: SEGAR }, 'bentuk'],
    [{ access_token: `a.${'b'.repeat(PANJANG_MAKS_TOKEN)}.c`, refresh_token: SEGAR }, 'bentuk'],
  ])('%o → %s', (badan, sebab) => {
    expect(periksaBadanSesi(badan, SEKARANG)).toEqual({ ok: false, sebab })
  })

  it('jenis token harus tepat: akses = access, segar = refresh (tertukar/tantangan MFA ditolak)', () => {
    expect(periksaBadanSesi({ access_token: SEGAR, refresh_token: AKSES }, SEKARANG)).toEqual({ ok: false, sebab: 'jenis' })
    const mfa = jwt({ typ: 'mfa', sub: SUB, tv: 2, exp: detik + 300 })
    expect(periksaBadanSesi({ access_token: mfa, refresh_token: SEGAR }, SEKARANG)).toEqual({ ok: false, sebab: 'jenis' })
    const tanpaTyp = jwt({ sub: SUB, exp: detik + 60 })
    expect(periksaBadanSesi({ access_token: tanpaTyp, refresh_token: SEGAR }, SEKARANG)).toEqual({ ok: false, sebab: 'jenis' })
  })

  // Gejala yang dijelaskan runbook "Cek setelah rilis" dan README gateway "Urutan
  // rilis bersama landing": gateway wajib tayang sebelum landing ini.
  it('pasangan dari gateway sebelum 0c (klaim tanpa typ/tv) → jenis', () => {
    const lama = { sub: SUB, iss: 'coreasia-gateway', iat: detik, jti: 'j', user_id: SUB, email: 'a@contoh.id', role: 'super_admin' }
    const akses = jwt({ ...lama, exp: detik + 3600, full_name: 'Admin' })
    const segar = jwt({ ...lama, exp: detik + 30 * 86400 })
    expect(periksaBadanSesi({ access_token: akses, refresh_token: segar }, SEKARANG)).toEqual({ ok: false, sebab: 'jenis' })
  })

  it('akses & segar harus milik admin dan token_version yang sama', () => {
    const lain = jwt({ typ: 'refresh', sub: 'admin-lain', tv: 2, exp: detik + 60 })
    const tvLain = jwt({ typ: 'refresh', sub: SUB, tv: 3, exp: detik + 60 })
    const tanpaSub = jwt({ typ: 'access', tv: 2, exp: detik + 60 })
    expect(periksaBadanSesi({ access_token: AKSES, refresh_token: lain }, SEKARANG)).toEqual({ ok: false, sebab: 'pasangan' })
    expect(periksaBadanSesi({ access_token: AKSES, refresh_token: tvLain }, SEKARANG)).toEqual({ ok: false, sebab: 'pasangan' })
    expect(periksaBadanSesi({ access_token: tanpaSub, refresh_token: SEGAR }, SEKARANG)).toEqual({ ok: false, sebab: 'pasangan' })
  })

  it('token kedaluwarsa atau tanpa exp ditolak', () => {
    const aksesBasi = jwt({ typ: 'access', sub: SUB, tv: 2, exp: detik - 1 })
    const segarTanpaExp = jwt({ typ: 'refresh', sub: SUB, tv: 2 })
    expect(periksaBadanSesi({ access_token: aksesBasi, refresh_token: SEGAR }, SEKARANG)).toEqual({ ok: false, sebab: 'kedaluwarsa' })
    expect(periksaBadanSesi({ access_token: AKSES, refresh_token: segarTanpaExp }, SEKARANG)).toEqual({ ok: false, sebab: 'kedaluwarsa' })
  })
})
