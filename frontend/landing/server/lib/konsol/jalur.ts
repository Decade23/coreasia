/**
 * Jalur yang boleh diteruskan proxy /api/gw/** ke gateway.
 *
 * Proxy ini memegang access token admin, jadi ia tidak boleh menjadi jalan
 * ke host atau jalur lain (SSRF), dan tidak boleh memotong rute BFF yang
 * mengurus cookie (login, refresh, verifikasi TOTP, logout).
 *
 * Aturannya sengaja sempit: semua pemanggilan console hari ini berbentuk
 * `/admin/<segmen>/…` dengan segmen berupa kata, uuid, atau angka. Jadi:
 *   - tanpa `%` sama sekali (menutup %2e%2e, %2f, %5c, dan encoding ganda);
 *   - setiap segmen [A-Za-z0-9._~-]+, bukan `.` atau `..`;
 *   - tanpa segmen kosong (`//`), tanpa `\`, `:`, `@`;
 *   - segmen pertama harus prefiks daftar putih;
 *   - rute milik BFF ditolak (pakai /api/admin/*), TANPA peduli huruf: router
 *     Fiber gateway tidak peka huruf, jadi admin/AUTH/Refresh sama dengan
 *     admin/auth/refresh dan jawabannya (token) tidak boleh sampai ke JS.
 * Lalu URL tujuan dirakit ulang dan dicek: origin sama dengan GATEWAY_URL dan
 * path di bawah `<base>/admin/`.
 */

/** Prefiks yang dipakai console (composables/use*.ts, pages/console/**). */
export const PREFIKS_IZIN = ['admin'] as const

/** Rute gateway yang HANYA boleh lewat BFF (mengurus cookie/tantangan). */
export const KHUSUS_BFF = new Set([
  'admin/auth/login',
  'admin/auth/refresh',
  'admin/auth/totp/verify',
  'admin/auth/logout',
])

/** Rute yang mengakhiri semua sesi admin ini bila berhasil (gateway menaikkan
 *  token_version). Cookie BFF ikut dihapus dan sesi CashFlow-nya dicabut.
 *  Dicocokkan lewat ruteGateway (huruf kecil). */
export const PENGAKHIR_SESI = new Set([
  'admin/auth/logout-all',
  'admin/auth/totp/enable',
  'admin/auth/totp/disable',
])

/** Bentuk jalur seperti yang dicocokkan router gateway (tidak peka huruf).
 *  Hanya untuk membandingkan dengan KHUSUS_BFF/PENGAKHIR_SESI; jalur yang
 *  diteruskan tetap apa adanya (id bisa berhuruf besar). */
export const ruteGateway = (jalur: string): string => jalur.toLowerCase()

const SEGMEN = /^[A-Za-z0-9._~-]+$/
const PANJANG_MAKS = 512

export type SebabTolakJalur = 'kosong' | 'terlalu-panjang' | 'karakter' | 'segmen' | 'di-luar-daftar' | 'pakai-bff'

export type HasilJalur = { ok: true; jalur: string } | { ok: false; sebab: SebabTolakJalur }

/**
 * `mentah` = bagian URL sesudah `/api/gw/`, TANPA query, apa adanya seperti
 * diterima (belum di-decode).
 */
export function validasiJalur(mentah: string): HasilJalur {
  if (!mentah) return { ok: false, sebab: 'kosong' }
  if (mentah.length > PANJANG_MAKS) return { ok: false, sebab: 'terlalu-panjang' }
  if (/[%\\:@?#\s]/.test(mentah) || [...mentah].some((c) => c.charCodeAt(0) < 0x20 || c.charCodeAt(0) === 0x7f)) {
    return { ok: false, sebab: 'karakter' }
  }

  const segmen = mentah.split('/')
  for (const s of segmen) {
    if (!s || s === '.' || s === '..' || !SEGMEN.test(s)) return { ok: false, sebab: 'segmen' }
  }
  if (segmen.length < 2 || !(PREFIKS_IZIN as readonly string[]).includes(segmen[0]!)) {
    return { ok: false, sebab: 'di-luar-daftar' }
  }
  if (KHUSUS_BFF.has(ruteGateway(mentah))) return { ok: false, sebab: 'pakai-bff' }
  return { ok: true, jalur: mentah }
}

/** Pisahkan `/api/gw/<jalur>?<query>` dari path permintaan mentah. */
export function pecahPathProxy(pathPermintaan: string, awalan = '/api/gw/'): { jalur: string; query: string } | null {
  if (!pathPermintaan.startsWith(awalan)) return null
  const sisa = pathPermintaan.slice(awalan.length)
  const tanya = sisa.indexOf('?')
  return tanya < 0
    ? { jalur: sisa, query: '' }
    : { jalur: sisa.slice(0, tanya), query: sisa.slice(tanya + 1) }
}

/**
 * URL tujuan di gateway. null bila hasil rakitan keluar dari base (seharusnya
 * mustahil setelah validasiJalur — ini jaring pengaman kedua).
 */
export function rakitTujuan(gatewayUrl: string, jalur: string, query: string): URL | null {
  let dasar: URL
  try {
    dasar = new URL(gatewayUrl.endsWith('/') ? gatewayUrl : `${gatewayUrl}/`)
  } catch {
    return null
  }
  if (dasar.protocol !== 'https:' && dasar.protocol !== 'http:') return null
  let tujuan: URL
  try {
    tujuan = new URL(jalur, dasar)
  } catch {
    return null
  }
  if (tujuan.origin !== dasar.origin) return null
  if (!tujuan.pathname.startsWith(`${dasar.pathname}admin/`)) return null
  if (tujuan.pathname !== `${dasar.pathname}${jalur}`) return null
  tujuan.search = query ? `?${query}` : ''
  tujuan.hash = ''
  return tujuan
}
