/**
 * DELETE /api/cashflow/sesi — mencabut sesi konsol milik tab yang memanggil.
 *
 * Dipanggil saat admin keluar dari console (useAdminAuth.logout) atau saat
 * modul CashFlow ditinggalkan dengan sengaja. Dua hal dilakukan:
 *   1. admin_konsol_sesi.dicabut diisi → is_platform_admin() menolak sesi ini
 *      seketika, sekalipun access token-nya masih belum kedaluwarsa;
 *   2. refresh token-nya dicabut di GoTrue (signOut scope 'local' — hanya sesi
 *      ini, bukan sesi tab/admin lain yang memakai identitas konsol yang sama).
 *
 * Token dibawa di Authorization: Bearer — bukan cookie — dan diverifikasi ke
 * Supabase dulu (getUser), supaya bukan sembarang orang yang bisa mencabut
 * sesi orang lain dengan menebak session_id.
 */
import { createClient } from '@supabase/supabase-js'

function klaimJwt(token: string): Record<string, unknown> | null {
  try {
    const bagian = token.split('.')[1]
    if (!bagian) return null
    return JSON.parse(Buffer.from(bagian.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8'))
  } catch {
    return null
  }
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const auth = getHeader(event, 'authorization') ?? ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : ''
  if (!token) throw createError({ statusCode: 401, statusMessage: 'tanpa-token' })

  const url = config.public.cashflowSupabaseUrl as string
  const service = config.cashflowSupabaseServiceKey as string
  if (!url || !service) throw createError({ statusCode: 503, statusMessage: 'belum-konfigurasi' })

  const admin = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } })
  const { data: pemilik, error } = await admin.auth.getUser(token)
  if (error || !pemilik?.user) throw createError({ statusCode: 401, statusMessage: 'token-ditolak' })

  const sessionId = klaimJwt(token)?.session_id
  if (typeof sessionId === 'string') {
    const { error } = await admin.rpc('admin_konsol_sesi_cabut', { p_session: sessionId })
    if (error) {
      // Tanpa pencabutan di tabel, access token ini masih diterima
      // is_platform_admin() sampai kedaluwarsa — jangan pura-pura berhasil.
      console.error('[cashflow/sesi] cabut gagal:', error.message)
      throw createError({ statusCode: 502, statusMessage: 'cabut-gagal' })
    }
  }
  const { error: eKeluar } = await admin.auth.admin.signOut(token, 'local')
  if (eKeluar) console.error('[cashflow/sesi] signOut gagal:', eKeluar.message)
  return { ok: true }
})
