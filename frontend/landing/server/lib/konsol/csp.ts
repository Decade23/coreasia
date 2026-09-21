/**
 * CSP halaman console (/console/**), dihitung dari HTML yang benar-benar
 * dikirim (server/plugins/konsol-csp.ts, hook render:response).
 *
 * Kenapa dihitung, bukan konstanta: Nuxt menyisipkan skrip sebaris
 * `window.__NUXT__={};window.__NUXT__.config={…}` yang isinya bergantung
 * runtimeConfig saat berjalan (env Vercel), jadi hash-nya tidak bisa
 * ditulis saat build. Setiap skrip sebaris yang BISA dieksekusi di HTML
 * diberi hash sha256; tanpa 'unsafe-inline', skrip sebaris lain (suntikan XSS,
 * sisa GTM) ditolak peramban.
 *
 * Tanpa domain GTM/iklan sama sekali. connect-src dibedakan per jenis
 * dokumen (utils/konsol.ts jenisDokumen):
 *   - dokumen console: 'self' (BFF /api/gw, /api/admin, /api/cashflow) +
 *     Supabase CashFlow. Gateway tidak dipanggil langsung;
 *   - dokumen /console/login: 'self' + origin gateway publik SAJA. Sandi dan
 *     kode TOTP dikirim peramban langsung ke gateway supaya pembatas dan audit
 *     gateway melihat IP admin yang asli; tokennya lalu diserahkan ke BFF
 *     (/api/admin/sesi). Dokumen login tidak memuat modul CashFlow, jadi tanpa
 *     Supabase.
 *
 * MURNI (node:crypto + utils/konsol) supaya bisa diuji vitest.
 */
import { createHash } from 'node:crypto'
import { originHttp } from '~/utils/konsol'

/** Tipe <script> yang dieksekusi peramban (sisanya blok data, bukan skrip). */
const TIPE_SKRIP = new Set(['', 'text/javascript', 'application/javascript', 'module', 'text/ecmascript', 'application/ecmascript'])

const POLA_SKRIP = /<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi

function atribut(atr: string, nama: string): string | null {
  const m = new RegExp(`(?:^|\\s)${nama}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'>]+))`, 'i').exec(atr)
  if (m) return (m[1] ?? m[2] ?? m[3] ?? '').trim()
  return new RegExp(`(?:^|\\s)${nama}(?:\\s|$)`, 'i').test(atr) ? '' : null
}

/** Isi setiap skrip sebaris yang dapat dieksekusi (tanpa src, tipe JS). */
export function skripSebaris(html: string): string[] {
  const hasil: string[] = []
  for (const m of html.matchAll(POLA_SKRIP)) {
    const atr = m[1] ?? ''
    if (atribut(atr, 'src') !== null) continue
    const tipe = (atribut(atr, 'type') ?? '').toLowerCase()
    if (!TIPE_SKRIP.has(tipe)) continue
    hasil.push(m[2] ?? '')
  }
  return hasil
}

/** Pengurai HTML menormalkan CRLF/CR menjadi LF sebelum peramban menghitung
 *  hash, jadi normalisasi yang sama dilakukan di sini. */
export const hashSkrip = (isi: string): string =>
  `'sha256-${createHash('sha256').update(isi.replace(/\r\n?/g, '\n'), 'utf8').digest('base64')}'`

export interface OpsiCsp {
  /** Dokumen console: modul CashFlow bicara langsung ke Supabase. */
  supabaseUrl?: string | null
  /** HANYA dokumen /console/login: login dan verifikasi TOTP langsung ke gateway. */
  gatewayUrl?: string | null
}

export function cspKonsol(html: string, opsi: OpsiCsp = {}): string {
  const hash = [...new Set(skripSebaris(html).map(hashSkrip))]
  const tujuan = [...new Set([originHttp(opsi.supabaseUrl), originHttp(opsi.gatewayUrl)].filter((o): o is string => !!o))]
  const direktif: Array<[string, string[]]> = [
    ['default-src', ["'self'"]],
    ['script-src', ["'self'", ...hash]],
    ['script-src-attr', ["'none'"]],
    ['style-src', ["'self'", "'unsafe-inline'"]],
    ['img-src', ["'self'", 'data:', 'https:']],
    ['font-src', ["'self'", 'https://fonts.gstatic.com']],
    ['connect-src', ["'self'", ...tujuan]],
    ['worker-src', ["'self'"]],
    ['frame-src', ["'self'"]],
    ['object-src', ["'none'"]],
    ['base-uri', ["'self'"]],
    ['form-action', ["'self'"]],
    // Tidak boleh dibingkai siapa pun, termasuk halaman publik satu-asal:
    // iframe tersembunyi dari halaman ber-GTM bisa membaca DOM console.
    ['frame-ancestors', ["'none'"]],
  ]
  return direktif.map(([nama, nilai]) => `${nama} ${nilai.join(' ')}`).join('; ')
}

/** Tautan preconnect/dns-prefetch GTM dari app.head global: di console
 *  tidak berguna dan tetap membuka koneksi ke Google. */
const POLA_LINK_PIHAK_KETIGA = /<link\b[^>]*\bhref\s*=\s*["']?https:\/\/(?:www\.)?(?:googletagmanager\.com|google-analytics\.com|googleadservices\.com|googleads\.g\.doubleclick\.net)[^>]*>/gi

export const bersihkanHeadKonsol = (potongan: string): string => potongan.replace(POLA_LINK_PIHAK_KETIGA, '')
