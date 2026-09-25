/**
 * DELETE /api/cashflow/sesi — mencabut sesi konsol milik tab yang memanggil.
 *
 * Dipanggil saat admin keluar dari console (useAdminAuth.logout) atau saat
 * modul CashFlow ditinggalkan dengan sengaja. Dua hal dilakukan:
 *   1. semua catatan sesi milik orang yang sama dicabut → tab lain orang itu
 *      ikut mati, dan is_platform_admin() menolak seketika walau access
 *      token-nya belum kedaluwarsa. "Orang yang sama" = id admin gateway
 *      (admin_gw_id, 0092) — lib/konsol/cashflow-cabut.ts. Baris tanpa id
 *      (sesi sebelum 0092, sudah habis sejak transisi paket A): sesi ini
 *      saja yang dicabut, per session_id;
 *   2. semua kasus (Fase 1, migrasi 0089) milik orang itu ditutup
 *      (admin_kasus_tutup_admin — kasus dimiliki per id). Server sudah
 *      menolak kasus yang dibuka sebelum pencabutan sesi pelakunya;
 *      penutupan ini membuat /kasus jujur ("ditutup", bukan "aktif" yang tak
 *      bisa dipakai). Gagal = dicatat saja; pencabutan di langkah 1 yang
 *      menutup aksesnya;
 *   3. refresh token-nya dicabut di GoTrue (signOut scope 'local' — hanya sesi
 *      ini, bukan sesi tab/admin lain yang memakai identitas konsol yang sama).
 *
 * Token dibawa di Authorization: Bearer — bukan cookie — dan diverifikasi ke
 * Supabase dulu (getUser), supaya bukan sembarang orang yang bisa mencabut
 * sesi orang lain dengan menebak session_id.
 */
import { createClient } from '@supabase/supabase-js'
import { cabutSesiCashflowAdmin, idAdminGateway } from '../../lib/konsol/cashflow-cabut'

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
    // Siapa pemilik sesi ini? Semua sesi orang yang sama ikut dicabut —
    // sessionStorage per tab berarti tab lain tidak tahu tab ini sudah keluar.
    const { data: baris } = await admin
      .from('admin_konsol_sesi').select('admin_gw_id').eq('session_id', sessionId).maybeSingle()
    const id = idAdminGateway(baris?.admin_gw_id)
    const hasil = id
      ? await cabutSesiCashflowAdmin({ url, service }, { id })
      : ((await admin.rpc('admin_konsol_sesi_cabut', { p_session: sessionId })).error ? 'gagal' : 'dicabut')
    if (hasil !== 'dicabut') {
      // Tanpa pencabutan di tabel, access token ini masih diterima
      // is_platform_admin() sampai kedaluwarsa — jangan pura-pura berhasil.
      console.error('[cashflow/sesi] cabut gagal:', hasil)
      throw createError({ statusCode: 502, statusMessage: 'cabut-gagal' })
    }
  }
  const { error: eKeluar } = await admin.auth.admin.signOut(token, 'local')
  if (eKeluar) console.error('[cashflow/sesi] signOut gagal:', eKeluar.message)
  return { ok: true }
})
