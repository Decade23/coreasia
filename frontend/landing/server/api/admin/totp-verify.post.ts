/**
 * POST /api/admin/totp-verify — DIPENSIUNKAN (Fase 0c, putaran 2).
 *
 * Kode TOTP kini dikirim peramban LANGSUNG ke gateway
 * (/admin/auth/totp/verify) bersama tantangan MFA yang hanya hidup di memori
 * halaman /console/login. Token hasilnya diserahkan ke POST /api/admin/sesi.
 *
 * Penolak (410); badan tidak dibaca. Lihat server/api/admin/login.post.ts.
 */
import { tanpaCache } from '../../lib/konsol/h3'

export default defineEventHandler((event) => {
  tanpaCache(event)
  setResponseStatus(event, 410)
  return { data: null, errors: { code: 'LOGIN_PINDAH', message: 'Muat ulang halaman login console, lalu masuk lagi.' } }
})
