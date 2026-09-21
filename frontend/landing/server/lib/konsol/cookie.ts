/**
 * Cookie sesi console (BFF Nitro, Fase 0c).
 *
 * Token gateway HANYA hidup di cookie HttpOnly yang dipasang server Nitro;
 * JS peramban tidak pernah memegangnya. Dulu useAdminAuth memasang
 * `auth_admin_token`/`refresh_admin_token` dari JS, jadi skrip apa pun di
 * coreasia.id (GTM, XSS) bisa membaca refresh token 30 hari.
 *
 * Di https nama cookie berawalan `__Host-Http-`:
 *   - `__Host-`: hanya diterima bila Secure, Path=/, tanpa Domain, jadi
 *     subdomain *.coreasia.id yang disusupi tidak bisa menanamnya;
 *   - `Http-`: hanya diterima lewat Set-Cookie ber-HttpOnly, jadi skrip halaman
 *     publik satu-asal (GTM, XSS) tidak bisa menanam sesi admin lain lewat
 *     document.cookie (session fixation / login-CSRF). Chrome/Edge 140+,
 *     Firefox 143+; Safari belum, dan di sana awalan ini hanya berlaku sebagai
 *     `__Host-` (risiko sisa, docs/runbook-console.md "Batas yang diketahui").
 * Di http (dev, `nuxt preview` lokal) awalan itu ditolak peramban, jadi
 * namanya polos dan tanpa Secure.
 *
 * Berkas ini MURNI (tanpa h3/Nitro) supaya bisa diuji vitest.
 */

/** `ikat` bukan kredensial: nilai acak pengikat token dokumen console
 *  (lib/konsol/ikatan.ts). Tidak ikut dihapus saat keluar; login berikutnya
 *  menggantinya.
 *
 *  Tantangan MFA TIDAK punya cookie: sejak login dikirim peramban langsung ke
 *  gateway, tantangan itu hanya hidup di memori halaman /console/login. */
export type JenisCookie = 'akses' | 'segar' | 'ikat'

const NAMA_DASAR: Record<JenisCookie, string> = {
  akses: 'ca_konsol_akses',
  segar: 'ca_konsol_segar',
  ikat: 'ca_konsol_ikat',
}

/** Umur cadangan bila token tidak membawa `exp` (seharusnya tidak pernah).
 *  Untuk `ikat` (bukan JWT) inilah umurnya. */
export const UMUR_CADANGAN: Record<JenisCookie, number> = {
  akses: 60 * 60,
  segar: 30 * 24 * 60 * 60,
  ikat: 30 * 24 * 60 * 60,
}

export const namaCookie = (jenis: JenisCookie, aman: boolean): string =>
  (aman ? '__Host-Http-' : '') + NAMA_DASAR[jenis]

/** Klaim JWT TANPA verifikasi tanda tangan. Hanya untuk umur cookie dan
 *  email di token yang baru saja diterima gateway, bukan keputusan akses. */
export function klaimJwt(token: string | null | undefined): Record<string, unknown> | null {
  try {
    const bagian = (token ?? '').split('.')[1]
    if (!bagian) return null
    const json = Buffer.from(bagian.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8')
    const isi = JSON.parse(json)
    return isi && typeof isi === 'object' ? isi as Record<string, unknown> : null
  } catch {
    return null
  }
}

/** Sisa umur token dalam detik (exp − sekarang), tidak pernah negatif. */
export function umurToken(token: string, jenis: JenisCookie, sekarangMs: number): number {
  const exp = klaimJwt(token)?.exp
  const detik = typeof exp === 'number' && Number.isFinite(exp)
    ? Math.floor(exp - sekarangMs / 1000)
    : UMUR_CADANGAN[jenis]
  return Math.max(0, detik)
}

export interface OpsiCookie {
  httpOnly: true
  secure: boolean
  sameSite: 'lax'
  path: '/'
  maxAge: number
}

/**
 * Lax: halaman console yang dibuka dari tautan email/bookmark tetap membawa
 * sesi (BFF menolak lintas situs lewat Sec-Fetch-Site dan token ikatan).
 * Path=/ wajib untuk awalan __Host-, HttpOnly wajib untuk awalan Http- (tanpa
 * itu peramban menolak cookie-nya). Mempersempit ke Path=/api tidak menutup
 * apa pun: yang berbahaya adalah fetch satu-asal ke /api/**, dan itu tetap
 * membawa cookie; yang menahannya token ikatan (lib/konsol/ikatan.ts).
 */
export const opsiCookie = (_jenis: JenisCookie, aman: boolean, maxAge: number): OpsiCookie => ({
  httpOnly: true,
  secure: aman,
  sameSite: 'lax',
  path: '/',
  maxAge,
})

export interface RencanaCookie {
  nama: string
  nilai: string
  opsi: OpsiCookie
}

export interface PasanganToken {
  akses: string
  segar: string
}

/** Cookie yang dipasang sesudah serah terima login (/api/admin/sesi) atau refresh. */
export function rencanaCookieToken(token: PasanganToken, aman: boolean, sekarangMs: number): RencanaCookie[] {
  return (['akses', 'segar'] as const).map((jenis) => ({
    nama: namaCookie(jenis, aman),
    nilai: token[jenis],
    opsi: opsiCookie(jenis, aman, umurToken(token[jenis], jenis, sekarangMs)),
  }))
}

/** Menghapus = memasang ulang dengan Max-Age=0 dan atribut yang sama. */
export function rencanaHapus(jenis: readonly JenisCookie[], aman: boolean): RencanaCookie[] {
  return jenis.map((j) => ({ nama: namaCookie(j, aman), nilai: '', opsi: opsiCookie(j, aman, 0) }))
}

/** Cookie sesi yang dihapus saat keluar/sesi berakhir (tanpa `ikat`). */
export const SEMUA_JENIS: readonly JenisCookie[] = ['akses', 'segar']

export function rencanaCookieIkat(ikat: string, aman: boolean): RencanaCookie {
  return { nama: namaCookie('ikat', aman), nilai: ikat, opsi: opsiCookie('ikat', aman, UMUR_CADANGAN.ikat) }
}
