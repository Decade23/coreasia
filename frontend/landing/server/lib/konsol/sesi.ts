/**
 * Serah terima token login ke BFF (POST /api/admin/sesi), bagian MURNI.
 *
 * Halaman /console/login mengirim sandi (dan kode TOTP) LANGSUNG ke gateway,
 * lalu menyerahkan pasangan token hasilnya ke sini. Yang memutuskan token
 * akses sah tetap gateway (/admin/auth/me). Pemeriksaan di sini hanya menolak
 * bentuk yang jelas salah SEBELUM gateway ditanya, dan memastikan token
 * refresh sepasang dengan token akses (klaim tanpa verifikasi tanda tangan:
 * refresh token yang palsu hanya merusak sesi pengirimnya sendiri, karena
 * gateway menolaknya saat refresh dan BFF lalu menghapus cookie).
 *
 * Tanpa h3/Nitro supaya bisa diuji vitest.
 */
import { klaimJwt, type PasanganToken } from './cookie'

/** JWT HS256 gateway jauh di bawah ini; batas mencegah badan raksasa ke cookie. */
export const PANJANG_MAKS_TOKEN = 4096

const POLA_JWT = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/

export type SebabTolakSesi = 'badan' | 'bentuk' | 'jenis' | 'pasangan' | 'kedaluwarsa'

export type HasilSesi =
  | { ok: true; token: PasanganToken; sub: string }
  | { ok: false; sebab: SebabTolakSesi }

const tokenSah = (v: unknown): v is string =>
  typeof v === 'string' && v.length > 0 && v.length <= PANJANG_MAKS_TOKEN && POLA_JWT.test(v)

export function periksaBadanSesi(badan: unknown, sekarangMs: number): HasilSesi {
  if (!badan || typeof badan !== 'object') return { ok: false, sebab: 'badan' }
  const { access_token: akses, refresh_token: segar } = badan as Record<string, unknown>
  if (!tokenSah(akses) || !tokenSah(segar)) return { ok: false, sebab: 'bentuk' }

  const ka = klaimJwt(akses)
  const ks = klaimJwt(segar)
  if (ka?.typ !== 'access' || ks?.typ !== 'refresh') return { ok: false, sebab: 'jenis' }

  const sub = ka.sub
  if (typeof sub !== 'string' || !sub || ks.sub !== sub || ka.tv !== ks.tv) {
    return { ok: false, sebab: 'pasangan' }
  }
  const detik = sekarangMs / 1000
  if (typeof ks.exp !== 'number' || ks.exp <= detik || typeof ka.exp !== 'number' || ka.exp <= detik) {
    return { ok: false, sebab: 'kedaluwarsa' }
  }
  return { ok: true, token: { akses, segar }, sub }
}
