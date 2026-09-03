/**
 * POST /api/cashflow/sesi — membuatkan sesi Supabase untuk modul CashFlow
 * dari cookie console yang sudah tervalidasi.
 *
 * Ini satu-satunya tempat di landing yang memegang service-role Supabase,
 * dan kuncinya tidak pernah meninggalkan proses server (runtimeConfig
 * non-public). Peramban hanya menerima access + refresh token sesi biasa.
 *
 * Urutan:
 *   1. cookie auth_admin_token → GET {gateway}/admin/auth/me. Gateway yang
 *      memutuskan siapa pemegang cookie; rute ini tidak mem-parse JWT sendiri.
 *   2. peran pemegangnya harus punya izin cashflow:view — peta yang sama
 *      dengan sidebar (utils/rbac.ts).
 *   3. service-role → generateLink(magiclink) untuk identitas konsol →
 *      verifyOtp(token_hash) dengan anon key → sesi asli. Tidak ada email
 *      yang dikirim; tautannya tidak pernah keluar dari proses ini.
 *
 * Identitas yang dipakai BUKAN akun orang: konsol@coreasia.id ditandai
 * admin_users.lewat_konsol = true (migrasi 0077 CashFlow), sehingga
 * is_platform_admin() menerimanya tanpa TOTP — sementara akun admin manusia
 * tetap dituntut aal2. Manusia di balik sesi ini tercatat dua kali: di audit
 * log console (siapa yang login) dan sebagai awalan [email] pada alasan
 * audit setiap RPC yang membuka data (useCashflowAdmin).
 *
 * Kode gagal (statusMessage) dibaca halaman /console/cashflow/masuk:
 *   tanpa-cookie · cookie-ditolak · tanpa-izin · belum-konfigurasi · mint-gagal
 */
import { createClient } from '@supabase/supabase-js'
import { peranBoleh } from '~/utils/rbac'

interface JawabanMe {
  data?: { id: string; email: string; role: string; is_active: boolean } | null
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)

  const cookie = getCookie(event, 'auth_admin_token')
  if (!cookie) throw createError({ statusCode: 401, statusMessage: 'tanpa-cookie' })

  // 1. Gateway memutuskan siapa pemegang cookie.
  let me: JawabanMe['data'] = null
  try {
    const r = await $fetch<JawabanMe>(`${config.public.gatewayUrl}/admin/auth/me`, {
      headers: { Authorization: `Bearer ${cookie}` },
      timeout: 8000,
    })
    me = r?.data ?? null
  } catch {
    throw createError({ statusCode: 401, statusMessage: 'cookie-ditolak' })
  }
  if (!me || !me.is_active) throw createError({ statusCode: 401, statusMessage: 'cookie-ditolak' })

  // 2. Peran yang boleh melihat pintunya = peran yang boleh masuk.
  if (!peranBoleh(me.role, 'cashflow:view')) {
    throw createError({ statusCode: 403, statusMessage: 'tanpa-izin' })
  }

  // 3. Bahan. Tanpa service key, modul tidak boleh setengah hidup.
  const url = config.public.cashflowSupabaseUrl as string
  const anon = config.public.cashflowSupabaseAnonKey as string
  const service = config.cashflowSupabaseServiceKey as string
  const email = (config.cashflowKonsolEmail as string) || 'konsol@coreasia.id'
  if (!url || !anon || !service) {
    throw createError({ statusCode: 503, statusMessage: 'belum-konfigurasi' })
  }

  const admin = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } })
  const { data: tautan, error: eTautan } = await admin.auth.admin.generateLink({ type: 'magiclink', email })
  const tokenHash = tautan?.properties?.hashed_token
  if (eTautan || !tokenHash) {
    // Pesan galat Supabase aman dicatat; yang tidak boleh tercatat adalah kuncinya.
    console.error('[cashflow/sesi] generateLink gagal:', eTautan?.message ?? 'tanpa hashed_token')
    throw createError({ statusCode: 502, statusMessage: 'mint-gagal' })
  }

  const klien = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } })
  const { data: hasil, error: eSesi } = await klien.auth.verifyOtp({ token_hash: tokenHash, type: 'magiclink' })
  if (eSesi || !hasil.session) {
    console.error('[cashflow/sesi] verifyOtp gagal:', eSesi?.message ?? 'tanpa sesi')
    throw createError({ statusCode: 502, statusMessage: 'mint-gagal' })
  }

  return {
    access_token: hasil.session.access_token,
    refresh_token: hasil.session.refresh_token,
    expires_at: hasil.session.expires_at ?? null,
    /** Email admin console yang meminta — dipakai klien sebagai awalan alasan audit. */
    pelaku: me.email,
  }
})
