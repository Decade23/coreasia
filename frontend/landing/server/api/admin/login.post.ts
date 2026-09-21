/**
 * POST /api/admin/login — DIPENSIUNKAN (Fase 0c, putaran 2).
 *
 * Login console kini dikirim peramban LANGSUNG ke gateway
 * (/admin/auth/login), supaya pembatas per IP dan audit gateway melihat IP
 * admin yang asli, bukan IP keluar Vercel yang dibagi semua admin. Token
 * hasilnya diserahkan ke POST /api/admin/sesi.
 *
 * Rute ini tetap ada sebagai penolak (410) supaya tab lama mendapat jawaban
 * JSON yang jelas, bukan halaman 404. Badan TIDAK dibaca: sandi tidak pernah
 * diproses di server Nitro.
 */
import { tanpaCache } from '../../lib/konsol/h3'

export default defineEventHandler((event) => {
  tanpaCache(event)
  setResponseStatus(event, 410)
  return { data: null, errors: { code: 'LOGIN_PINDAH', message: 'Muat ulang halaman login console, lalu masuk lagi.' } }
})
