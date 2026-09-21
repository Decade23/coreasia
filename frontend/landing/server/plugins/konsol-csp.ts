/**
 * Dokumen console (/console/**), per jawaban:
 *
 * - render:html   → buang preconnect/dns-prefetch GTM dari head console, dan
 *   (hanya untuk navigasi dokumen puncak) titipkan token ikatan di
 *   <meta name="ca-konsol-ikat">. Token itu wajib dibawa setiap panggilan BFF
 *   (lib/konsol/ikatan.ts): halaman publik satu-asal tidak bisa membacanya.
 * - render:response → hitung sha256 setiap skrip sebaris yang dapat dieksekusi
 *   di HTML final (mis. `window.__NUXT__.config`), lalu pasang CSP tanpa
 *   'unsafe-inline' dan tanpa domain GTM/iklan (lib/konsol/csp.ts); jawaban
 *   `no-store` supaya HTML bertoken tidak pernah masuk cache peramban/CDN.
 *   Dokumen /console/login mendapat origin gateway publik di connect-src
 *   (login langsung ke gateway); dokumen console lain mendapat Supabase
 *   CashFlow. Berpindah di antara keduanya selalu memuat ulang dokumen
 *   (plugins/konsol-isolasi.client.ts), jadi kebijakan itu tidak bocor.
 *
 * Header lain (HSTS, X-Frame-Options DENY, COOP, dst.) datang dari routeRules
 * '/console/**' di nuxt.config.ts, yang sengaja TIDAK memuat CSP: di Vercel
 * header routeRules dipasang di tepi dan kebijakan statis tidak mungkin
 * memuat hash yang bergantung env saat berjalan. Secara lokal Nitro
 * menggabungkan CSP '/**' ke rute console; header di sini menimpanya.
 */
import { halamanLoginKonsol, jalurKonsol, META_IKATAN } from '~/utils/konsol'
import { bersihkanHeadKonsol, cspKonsol } from '../lib/konsol/csp'
import { tokenIkatanNavigasi } from '../lib/konsol/h3'
import { metaIkatan, navigasiDokumen } from '../lib/konsol/ikatan'

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('render:html', (html, { event }) => {
    if (!jalurKonsol(event.path)) return
    html.head = html.head.map(bersihkanHeadKonsol)
    if (navigasiDokumen({ dest: getHeader(event, 'sec-fetch-dest'), mode: getHeader(event, 'sec-fetch-mode') })) {
      html.head.push(metaIkatan(META_IKATAN, tokenIkatanNavigasi(event)))
    }
  })

  nitroApp.hooks.hook('render:response', (response, { event }) => {
    if (!jalurKonsol(event.path) || typeof response.body !== 'string') return
    const config = useRuntimeConfig(event)
    const opsi = halamanLoginKonsol(event.path)
      ? { gatewayUrl: config.public.gatewayPublicUrl as string }
      : { supabaseUrl: config.public.cashflowSupabaseUrl as string }
    response.headers = {
      ...response.headers,
      'cache-control': 'no-store',
      'content-security-policy': cspKonsol(response.body, opsi),
    }
  })
})
