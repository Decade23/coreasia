/**
 * /Console/login, /CONSOLE, /%63onsole → 301 ke bentuk huruf kecil.
 *
 * vue-router mencocokkan rute tanpa peduli huruf, sedangkan matcher routeRules
 * Nitro ('/console/**': ssr:false + header console) peka huruf. Tanpa
 * pengalihan ini, /Console/login merender form sandi + TOTP console di dokumen
 * berkebijakan publik: GTM & tag iklan termuat, CSP 'unsafe-inline', SSR
 * aktif, dan X-Robots-Tag index. Pengalihan terjadi sebelum renderer, jadi
 * dokumen console selalu lahir di path kanonik (utils/konsol.ts kanonKonsol).
 */
import { kanonKonsol } from '~/utils/konsol'

export default defineEventHandler((event) => {
  if (event.method !== 'GET' && event.method !== 'HEAD') return
  const tujuan = kanonKonsol(event.path)
  if (tujuan) return sendRedirect(event, tujuan, 301)
})
